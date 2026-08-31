const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Address = require("../models/Address");
const Customer = require("../models/Customer");
const WarehouseStock = require("../models/WarehouseStock");
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

    if (!["COD", "Online", "Wallet"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method. Supported methods: COD, Online, Wallet",
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
        if (previousPendingOrder.assignedWarehouse) {
          await WarehouseStock.findOneAndUpdate(
            { product: item.product, warehouse: previousPendingOrder.assignedWarehouse },
            { $inc: { quantity: item.quantity } }
          );
        }
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

    // 2.5 Idempotency check for Wallet payment — prevent duplicate orders on double-click
    if (paymentMethod === "Wallet") {
      const recentWalletOrder = await Order.findOne({
        customer: customerId,
        "paymentInfo.method": "Wallet",
        orderStatus: "Placed",
        createdAt: { $gte: new Date(Date.now() - 15000) }, // last 15 seconds
      });

      if (recentWalletOrder) {
        return res.status(200).json({
          success: true,
          message: "Order already placed successfully",
          data: recentWalletOrder,
        });
      }
    }

    // 3. Verify Delivery Address
    const address = await Address.findOne({ _id: addressId, customer: customerId }).lean();
    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Delivery address not found",
      });
    }

    if (!address.location || !address.location.coordinates) {
      return res.status(400).json({
        success: false,
        message: "Your address is missing location coordinates. Please update your address or create a new one.",
      });
    }

    const [longitude, latitude] = address.location.coordinates;

    // 3.5 Find Serviceable Warehouse using $geoNear
    const Warehouse = require("../models/Warehouse");
    const nearestWarehouses = await Warehouse.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          distanceField: "distance", // Distance in meters
          distanceMultiplier: 0.001, // Convert distance to km
          spherical: true,
          query: { isActive: true },
        },
      },
      {
        $match: {
          $expr: {
            $lte: ["$distance", "$deliveryRangeKm"], // Compare distance with warehouse specific delivery range
          },
        },
      },
      {
        $sort: { distance: 1 },
      },
      {
        $limit: 1,
      },
    ]);

    if (!nearestWarehouses || nearestWarehouses.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Sorry, we do not currently deliver to your location. No warehouses in range.",
      });
    }

    const assignedWarehouseId = nearestWarehouses[0]._id;

    // 4. Verify Stock and calculate pricing details
    const pricingResult = await calculatePricing(cart, couponCode, assignedWarehouseId);
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

    // 7.5 Check Wallet Balance if Wallet payment
    const Customer = require("../models/Customer");
    if (paymentMethod === "Wallet") {
      const customer = await Customer.findOne({ customer_id: customerId });
      if (!customer || customer.walletBalance < pricingResult.pricing.totalPrice) {
        return res.status(400).json({
          success: false,
          message: "Insufficient wallet balance. Please top up your wallet or choose another payment method.",
        });
      }
    }

    // 8. Decrement stock for products (Stock Lock/Reservation)
    for (const item of cart.items) {
      await WarehouseStock.findOneAndUpdate(
        { product: item.product, warehouse: assignedWarehouseId },
        { $inc: { quantity: -item.quantity } }
      );
    }

    // 9. Handle payment methods
    if (paymentMethod === "COD" || paymentMethod === "Wallet") {
      // For COD & Wallet, order is placed immediately
      if (paymentMethod === "Wallet") {
        // Atomic deduction — balance check + deduct in one query (race condition safe)
        const WalletTransaction = require("../models/WalletTransaction");
        const updatedCustomer = await Customer.findOneAndUpdate(
          {
            _id: customerId,
            walletBalance: { $gte: pricingResult.pricing.totalPrice }, // balance check
          },
          { $inc: { walletBalance: -pricingResult.pricing.totalPrice } },
          { new: true }
        );

        if (!updatedCustomer) {
          return res.status(400).json({
            success: false,
            message: "Insufficient wallet balance. Please top up your wallet.",
          });
        }

        await WalletTransaction.create({
          customer: updatedCustomer._id,
          amount: pricingResult.pricing.totalPrice,
          type: "Debit",
          description: `Payment for Order ${order_id}`,
        });
      }
      if (pricingResult.coupon) {
        pricingResult.coupon.usedCount += 1;
        await pricingResult.coupon.save();
      }

      const order = await Order.create({
        order_id,
        customer: customerId,
        assignedWarehouse: assignedWarehouseId,
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
          method: paymentMethod,
          status: paymentMethod === "Wallet" ? "Paid" : "Pending",
        },
        orderStatus: "Placed",
        history: [
          {
            status: "Placed",
            message: `Order placed successfully (${paymentMethod}).`,
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
          await WarehouseStock.findOneAndUpdate(
            { product: item.product, warehouse: assignedWarehouseId },
            { $inc: { quantity: item.quantity } }
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
        assignedWarehouse: assignedWarehouseId,
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
// Get All Orders for Customer (Paginated & Filterable)
// GET /api/v1/orders/view-orders
// ───────────────────────────────────────────────────────────────
const getOrders = async (req, res) => {
  try {
    const customerId = req.customerId;
    const { page = 1, limit = 10, search = "", orderStatus } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = { customer: customerId };

    if (orderStatus) {
      filter.orderStatus = orderStatus;
    }

    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { order_id: searchRegex },
        { orderStatus: searchRegex },
        { "items.name": searchRegex },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
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
// Get All Orders (Admin)
// GET /api/v1/admin/orders
// ───────────────────────────────────────────────────────────────
const getAllOrdersAdmin = async (req, res) => {
  try {
    const { search, orderStatus, paymentStatus, paymentMethod, warehouseId, page = 1, limit = 10 } = req.query;

    const filter = {};
    
    // Role-based Access Control
    const restrictedRoles = ["warehouse_manager", "agent"];
    const user = req.admin || req.user;
    if (user && restrictedRoles.includes(user.role)) {
      const assignedIds = user.assignedWarehouses ? user.assignedWarehouses.map(w => typeof w === 'object' ? (w._id || w.id || w).toString() : w.toString()) : [];
      if (warehouseId && assignedIds.includes(warehouseId)) {
        filter.assignedWarehouse = warehouseId;
      } else {
        filter.assignedWarehouse = { $in: assignedIds };
      }
    } else {
      if (warehouseId) {
        filter.assignedWarehouse = warehouseId;
      }
    }

    // 1. Order Status Filter
    if (orderStatus) {
      filter.orderStatus = orderStatus;
    }

    // 2. Payment Status Filter
    if (paymentStatus) {
      filter["paymentInfo.status"] = paymentStatus;
    }

    // 3. Payment Method Filter
    if (paymentMethod) {
      filter["paymentInfo.method"] = paymentMethod;
    }

    // 4. Search Filter (matches order_id, recipient shipping name/mobile, or customer profile info)
    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      
      // Find matching customer IDs first
      const matchingCustomers = await Customer.find({
        $or: [
          { name: searchRegex },
          { mobile: searchRegex },
          { email: searchRegex }
        ]
      }).select("_id");

      const customerIds = matchingCustomers.map(c => c._id);

      filter.$or = [
        { order_id: searchRegex },
        { "shippingAddress.name": searchRegex },
        { "shippingAddress.mobile": searchRegex },
        { customer: { $in: customerIds } }
      ];
    }

    // Pagination setup
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("customer", "name email mobile")
        .populate("items.product", "sku image")
        .populate("assignedWarehouse", "name warehouse_id")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      }
    });
  } catch (error) {
    console.error("Get All Orders Admin Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get Single Order (Admin)
// GET /api/v1/admin/orders/:id
const getOrderByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const query = {};
    if (id.startsWith("ORD-")) {
      query.order_id = id;
    } else {
      query._id = id;
    }

    const order = await Order.findOne(query)
      .populate("customer", "name email mobile")
      .populate("items.product", "sku image")
      .populate("assignedWarehouse", "name warehouse_id")
      .lean();

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
    console.error("Get Order By ID Admin Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update Order Status (Admin)
// PUT /api/v1/admin/orders/:id/status
const updateOrderStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    const query = {};
    if (id.startsWith("ORD-")) {
      query.order_id = id;
    } else {
      query._id = id;
    }

    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (orderStatus) {
      order.orderStatus = orderStatus;
      order.history.push({
        status: orderStatus,
        message: `Order status updated to ${orderStatus} by Admin.`,
      });
      if (orderStatus === "Delivered") {
        order.deliveredAt = new Date();
      }
    }

    if (paymentStatus) {
      order.paymentInfo.status = paymentStatus;
    }

    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate("customer", "name email mobile")
      .populate("items.product", "sku image")
      .populate("assignedWarehouse", "name warehouse_id")
      .lean();

    return res.status(200).json({
      success: true,
      message: "Order updated successfully",
      data: populatedOrder,
    });
  } catch (error) {
    console.error("Update Order Status Error:", error);
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

// ───────────────────────────────────────────────────────────────
// Request Order Return (Customer)
// PUT /api/v1/orders/:id/request-return
// ───────────────────────────────────────────────────────────────
const requestReturn = async (req, res) => {
  try {
    const customerId = req.customerId;
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: "Return reason is required" });
    }

    const order = await Order.findOne({ _id: id, customer: customerId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.orderStatus !== "Delivered") {
      return res.status(400).json({ success: false, message: "Only delivered orders can be returned" });
    }

    if (!order.deliveredAt) {
      return res.status(400).json({ success: false, message: "Delivery date is missing, cannot process return" });
    }

    const fiveDaysInMillis = 5 * 24 * 60 * 60 * 1000;
    const timeSinceDelivery = Date.now() - new Date(order.deliveredAt).getTime();
    if (timeSinceDelivery > fiveDaysInMillis) {
      return res.status(400).json({ success: false, message: "Return period of 5 days has expired" });
    }

    order.orderStatus = "Return Requested";
    order.returnReason = reason;
    order.history.push({
      status: "Return Requested",
      message: `Return requested. Reason: ${reason}`,
    });

    await order.save();
    return res.status(200).json({ success: true, message: "Return requested successfully", data: order });
  } catch (error) {
    console.error("Request Return Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ───────────────────────────────────────────────────────────────
// Approve Return Request (Admin/Staff)
// PUT /api/v1/admin/orders/:id/approve-return
// ───────────────────────────────────────────────────────────────
const approveReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.orderStatus !== "Return Requested") {
      return res.status(400).json({ success: false, message: "Order is not pending for return approval" });
    }

    order.orderStatus = "Return Approved";
    order.history.push({
      status: "Return Approved",
      message: "Return request has been approved. Agent will pick up the item soon.",
    });

    await order.save();
    return res.status(200).json({ success: true, message: "Return approved successfully", data: order });
  } catch (error) {
    console.error("Approve Return Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ───────────────────────────────────────────────────────────────
// Mark Order as Returned (Agent)
// PUT /api/v1/admin/orders/:id/mark-returned
// ───────────────────────────────────────────────────────────────
const markReturned = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.orderStatus !== "Return Approved") {
      return res.status(400).json({ success: false, message: "Order return must be approved first" });
    }

    order.orderStatus = "Returned";
    order.returnedAt = new Date();
    order.history.push({
      status: "Returned",
      message: "Item collected by agent and returned to warehouse.",
    });

    await order.save();
    return res.status(200).json({ success: true, message: "Order marked as returned", data: order });
  } catch (error) {
    console.error("Mark Returned Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ───────────────────────────────────────────────────────────────
// QC Check & Instant Refund (Warehouse Manager/Admin)
// PUT /api/v1/admin/orders/:id/qc-check
// ───────────────────────────────────────────────────────────────
const qcCheck = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPassed, comments } = req.body;
    
    if (isPassed === undefined) {
      return res.status(400).json({ success: false, message: "isPassed boolean is required" });
    }

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.orderStatus !== "Returned") {
      return res.status(400).json({ success: false, message: "Order must be in 'Returned' state for QC check" });
    }

    if (!isPassed) {
      order.orderStatus = "QC Failed";
      order.history.push({
        status: "QC Failed",
        message: `Quality check failed. ${comments ? `Comments: ${comments}` : "Item rejected."}`,
      });
      await order.save();
      return res.status(200).json({ success: true, message: "Order QC Failed. No refund issued.", data: order });
    }

    // If QC Passed, trigger instant refund to Wallet
    const Customer = require("../models/Customer");
    const WalletTransaction = require("../models/WalletTransaction");

    const customer = await Customer.findOne({ customer_id: order.customer });
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found, cannot refund" });
    }

    const refundAmount = order.pricing.totalPrice;
    customer.walletBalance += refundAmount;
    await customer.save();

    await WalletTransaction.create({
      customer: customer._id,
      amount: refundAmount,
      type: "Credit",
      description: `Refund for Order ${order.order_id}`,
      referenceOrder: order._id,
    });

    order.orderStatus = "Refunded";
    order.history.push({
      status: "Refunded",
      message: "Quality check passed. Refund processed to wallet successfully.",
    });

    await order.save();
    return res.status(200).json({ success: true, message: "QC Passed and Refund issued successfully", data: order });
  } catch (error) {
    console.error("QC Check Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ───────────────────────────────────────────────────────────────
// Cancel Order (Customer)
// PUT /api/v1/orders/:id/cancel
// ───────────────────────────────────────────────────────────────
const cancelOrder = async (req, res) => {
  try {
    const customerId = req.customerId;
    const { id } = req.params;
    const { reason = "Cancelled by customer" } = req.body;

    const query = {};
    if (id.startsWith("ORD-")) {
      query.order_id = id;
    } else {
      query._id = id;
    }
    if (customerId) {
      query.customer = customerId;
    }

    const order = await Order.findOne(query);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (order.orderStatus === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "This order is already cancelled.",
      });
    }

    const cancellableStatuses = ["Pending", "Placed", "Accepted", "Processing"];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status '${order.orderStatus}'. Orders can only be cancelled before they are out for delivery.`,
      });
    }

    // 1. Revert Stock Quantities
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stockQuantity: item.quantity },
      });
    }

    // 2. Refund to Customer Wallet if payment was completed
    let refundIssued = false;
    if (order.paymentInfo.status === "Paid" || order.paymentInfo.method === "Wallet") {
      const CustomerModel = require("../models/Customer");
      const customer = await CustomerModel.findById(order.customer);
      if (customer) {
        customer.walletBalance += order.pricing.totalPrice;
        await customer.save();

        const WalletTransaction = require("../models/WalletTransaction");
        await WalletTransaction.create({
          customer: customer._id,
          amount: order.pricing.totalPrice,
          type: "Credit",
          description: `Refund for Cancelled Order ${order.order_id}`,
        });

        refundIssued = true;
        order.paymentInfo.status = "Refunded";
      }
    }

    // 3. Update Order Status
    order.orderStatus = "Cancelled";
    order.history.push({
      status: "Cancelled",
      message: `Order cancelled. Reason: ${reason}.${refundIssued ? " Refund credited to wallet." : ""}`,
    });

    await order.save();

    return res.status(200).json({
      success: true,
      message: `Order cancelled successfully.${refundIssued ? " Refund of ₹" + order.pricing.totalPrice + " credited to your wallet." : ""}`,
      data: order,
    });
  } catch (error) {
    console.error("Cancel Order Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while cancelling order.",
    });
  }
};

module.exports = {
  checkout,
  getOrders,
  getOrderById,
  verifyPayment,
  handleRazorpayWebhook,
  getAllOrdersAdmin,
  getOrderByIdAdmin,
  updateOrderStatusAdmin,
  requestReturn,
  approveReturn,
  markReturned,
  qcCheck,
  cancelOrder,
};
