const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Address = require("../models/Address");
const generateCustomId = require("../utils/generateCustomId");
const { calculatePricing } = require("../utils/pricingHelper");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn("WARNING: Razorpay credentials are not defined in environment variables!");
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "dummy_key",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "dummy_secret",
  });
};

// ───────────────────────────────────────────────────────────────
// Checkout / Place Order
// POST /api/v1/orders/checkout
// ───────────────────────────────────────────────────────────────
const checkout = async (req, res) => {
  try {
    const customerId = req.customerId;
    const { addressId, paymentMethod = "COD", couponCode } = req.body;

    if (!addressId) {
      return res.status(400).json({
        success: false,
        message: "addressId is required for delivery",
      });
    }

    if (!["COD", "Online"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method. Supported methods: COD, Online",
      });
    }

    // 1. Get Customer Cart
    const cart = await Cart.findOne({ customer: customerId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty. Cannot checkout.",
      });
    }

    // 2. Clean up any previous "Pending" online orders for this customer (Stock Lock release)
    const previousPendingOrder = await Order.findOne({
      customer: customerId,
      orderStatus: "Pending",
      "paymentInfo.method": "Online",
    });

    if (previousPendingOrder) {
      console.log(`[Checkout] Cancelling previous pending payment order ${previousPendingOrder.order_id} for customer ${customerId}`);
      
      // Revert stock
      for (const item of previousPendingOrder.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stockQuantity: item.quantity } }
        );
      }
      
      // Update order status to Cancelled
      previousPendingOrder.orderStatus = "Cancelled";
      previousPendingOrder.paymentInfo.status = "Failed";
      previousPendingOrder.history.push({
        status: "Cancelled",
        message: "Order cancelled automatically due to initiation of a new checkout session.",
      });
      await previousPendingOrder.save();
    }

    // 3. Verify Delivery Address
    const address = await Address.findOne({ _id: addressId, customer: customerId }).lean();
    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Delivery address not found",
      });
    }

    // 4. Verify Stock and calculate pricing details
    const pricingResult = await calculatePricing(cart, couponCode);
    if (!pricingResult.success) {
      return res.status(400).json({
        success: false,
        message: pricingResult.message,
      });
    }

    // Map checkout items
    const orderItems = pricingResult.items.map((item) => ({
      product: item.product,
      name: item.name,
      sellPrice: item.sellPrice,
      mrp: item.mrp,
      quantity: item.quantity,
    }));

    // 5. Generate Order ID
    const order_id = await generateCustomId("Order", "ORD");

    // 6. Address Snapshot mapping
    const shippingAddressSnapshot = {
      name: address.name,
      mobile: address.mobile,
      alternateMobile: address.alternateMobile,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      landmark: address.landmark,
      addressType: address.addressType,
    };

    // 7. Decrement stock for products (Stock Lock/Reservation)
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stockQuantity: -item.quantity } }
      );
    }

    // 8. Handle payment methods
    if (paymentMethod === "COD") {
      // For COD, order is placed immediately and cart is cleared
      if (pricingResult.coupon) {
        pricingResult.coupon.usedCount += 1;
        await pricingResult.coupon.save();
      }

      const order = await Order.create({
        order_id,
        customer: customerId,
        items: orderItems,
        shippingAddress: shippingAddressSnapshot,
        pricing: {
          itemsPrice: pricingResult.pricing.itemsPrice,
          couponCode: pricingResult.pricing.couponCode,
          couponDiscount: pricingResult.pricing.couponDiscount,
          gstAmount: pricingResult.pricing.gstAmount,
          shippingPrice: pricingResult.pricing.shippingPrice,
          totalPrice: pricingResult.pricing.totalPrice,
        },
        paymentInfo: {
          method: "COD",
          status: "Pending",
        },
        orderStatus: "Placed",
        history: [
          {
            status: "Placed",
            message: "Order placed successfully (Cash on Delivery).",
          },
        ],
      });

      // Clear Customer Cart immediately for COD
      cart.items = [];
      await cart.save();

      return res.status(201).json({
        success: true,
        message: "Order placed successfully",
        data: order,
      });
    } else {
      // For Online payment, we create a Razorpay Order and keep local order status as "Pending"
      const razorpay = getRazorpayInstance();

      let razorpayOrder;
      try {
        razorpayOrder = await razorpay.orders.create({
          amount: Math.round(pricingResult.pricing.totalPrice * 100), // convert to paise
          currency: "INR",
          receipt: `receipt_${order_id}`,
        });
      } catch (rpError) {
        console.error("Razorpay Order Creation Failed:", rpError);
        
        // Revert stock decrement if Razorpay creation fails
        for (const item of cart.items) {
          await Product.findByIdAndUpdate(
            item.product,
            { $inc: { stockQuantity: item.quantity } }
          );
        }
        
        return res.status(500).json({
          success: false,
          message: "Failed to initialize payment gateway order. Please try again.",
          error: rpError.message,
        });
      }

      const order = await Order.create({
        order_id,
        customer: customerId,
        items: orderItems,
        shippingAddress: shippingAddressSnapshot,
        pricing: {
          itemsPrice: pricingResult.pricing.itemsPrice,
          couponCode: pricingResult.pricing.couponCode,
          couponDiscount: pricingResult.pricing.couponDiscount,
          gstAmount: pricingResult.pricing.gstAmount,
          shippingPrice: pricingResult.pricing.shippingPrice,
          totalPrice: pricingResult.pricing.totalPrice,
        },
        paymentInfo: {
          method: "Online",
          status: "Pending",
          razorpayOrderId: razorpayOrder.id,
        },
        orderStatus: "Pending",
        history: [
          {
            status: "Pending",
            message: "Order initiated. Waiting for online payment verification.",
          },
        ],
      });

      // We do NOT clear the cart yet. It will be cleared upon verifyPayment or Webhook call.

      return res.status(201).json({
        success: true,
        message: "Payment order initiated successfully",
        razorpayOrder: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          key: process.env.RAZORPAY_KEY_ID,
        },
        data: order,
      });
    }
  } catch (error) {
    console.error("Checkout Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during checkout",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Get All Orders for Customer
// GET /api/v1/orders
// ───────────────────────────────────────────────────────────────
const getOrders = async (req, res) => {
  try {
    const customerId = req.customerId;
    const orders = await Order.find({ customer: customerId })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Get Orders Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Get Single Order details
// GET /api/v1/orders/:id
// ───────────────────────────────────────────────────────────────
const getOrderById = async (req, res) => {
  try {
    const customerId = req.customerId;
    const { id } = req.params;

    const query = { customer: customerId };
    if (id.startsWith("ORD-")) {
      query.order_id = id;
    } else {
      query._id = id;
    }

    const order = await Order.findOne(query).lean();
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Get Order By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Verify Online Payment
// POST /api/v1/orders/verify-payment
// ───────────────────────────────────────────────────────────────
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "razorpay_order_id, razorpay_payment_id, and razorpay_signature are required fields",
      });
    }

    // 1. Verify the signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed. Invalid signature.",
      });
    }

    // 2. Find the pending order
    const order = await Order.findOne({
      "paymentInfo.razorpayOrderId": razorpay_order_id,
      orderStatus: "Pending",
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Pending order not found for this payment",
      });
    }

    // 3. Confirm the order in DB
    order.orderStatus = "Placed";
    order.paymentInfo.status = "Paid";
    order.paymentInfo.transactionId = razorpay_payment_id;
    order.paymentInfo.razorpayPaymentId = razorpay_payment_id;
    order.paymentInfo.razorpaySignature = razorpay_signature;
    order.history.push({
      status: "Placed",
      message: "Payment verified and order placed successfully.",
    });

    await order.save();

    // 4. Update Coupon count if applicable
    if (order.pricing.couponCode) {
      const Coupon = require("../models/Coupon");
      await Coupon.updateOne(
        { code: order.pricing.couponCode },
        { $inc: { usedCount: 1 } }
      );
    }

    // 5. Clear Customer Cart
    await Cart.updateOne(
      { customer: order.customer },
      { $set: { items: [] } }
    );

    return res.status(200).json({
      success: true,
      message: "Payment verified and order placed successfully",
      data: order,
    });
  } catch (error) {
    console.error("Verify Payment Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during payment verification",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Razorpay Webhook Handler
// POST /api/v1/orders/razorpay-webhook
// ───────────────────────────────────────────────────────────────
const handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return res.status(400).json({
        success: false,
        message: "Signature or Webhook Secret is missing",
      });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    const event = req.body.event;

    // We listen to the order.paid event
    if (event === "order.paid") {
      const { id: razorpay_order_id } = req.body.payload.order.entity;
      const payments = req.body.payload.payment?.entity;
      const razorpay_payment_id = payments ? payments.id : null;

      // Find the pending order
      const order = await Order.findOne({
        "paymentInfo.razorpayOrderId": razorpay_order_id,
        orderStatus: "Pending",
      });

      if (order) {
        // Confirm order
        order.orderStatus = "Placed";
        order.paymentInfo.status = "Paid";
        if (razorpay_payment_id) {
          order.paymentInfo.transactionId = razorpay_payment_id;
          order.paymentInfo.razorpayPaymentId = razorpay_payment_id;
        }
        order.history.push({
          status: "Placed",
          message: "Payment confirmed via webhook.",
        });

        await order.save();

        // Increment Coupon count if applicable
        if (order.pricing.couponCode) {
          const Coupon = require("../models/Coupon");
          await Coupon.updateOne(
            { code: order.pricing.couponCode },
            { $inc: { usedCount: 1 } }
          );
        }

        // Clear Cart
        await Cart.updateOne(
          { customer: order.customer },
          { $set: { items: [] } }
        );

        console.log(`[Webhook] Order ${order.order_id} successfully confirmed via Razorpay Webhook`);
      }
    }

    // Send a 200 OK back to Razorpay immediately
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Razorpay Webhook Error:", error);
    // Return 200 to prevent Razorpay from retrying indefinitely
    return res.status(200).json({ success: false, error: error.message });
  }
};

module.exports = {
  checkout,
  getOrders,
  getOrderById,
  verifyPayment,
  handleRazorpayWebhook,
};
