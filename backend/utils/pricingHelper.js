const Product = require("../models/Product");
const Coupon = require("../models/Coupon");

/**
 * Calculates pricing details for the cart items including subtotal, coupon discount, and GST.
 * 
 * @param {Object} cart - Cart document with items populated
 * @param {string} [couponCode] - Optional coupon code to apply
 * @returns {Promise<Object>} Pricing details and breakdown
 */
const calculatePricing = async (cart, couponCode) => {
  if (!cart || !cart.items || cart.items.length === 0) {
    return {
      success: true,
      pricing: {
        itemsPrice: 0,
        couponCode: null,
        couponDiscount: 0,
        gstAmount: 0,
        shippingPrice: 0,
        totalPrice: 0,
      },
      items: [],
    };
  }

  // 1. Calculate items subtotal and load product data
  let itemsPrice = 0;
  const calculatedItems = [];

  for (const item of cart.items) {
    // Find product to ensure latest price and GST rate are used
    const product = await Product.findOne({ _id: item.product._id || item.product, isActive: true }).lean();
    if (!product) {
      return {
        success: false,
        message: `Product reference not found or is currently inactive`,
      };
    }

    if (product.stockQuantity < item.quantity) {
      return {
        success: false,
        message: `Insufficient stock for product: "${product.name}". Available stock: ${product.stockQuantity}, requested: ${item.quantity}`,
      };
    }

    const baseSubtotal = product.sellPrice * item.quantity;
    itemsPrice += baseSubtotal;

    calculatedItems.push({
      product: product._id,
      name: product.name,
      sellPrice: product.sellPrice,
      mrp: product.mrp,
      quantity: item.quantity,
      gstRate: product.gstRate || 0,
      baseSubtotal: baseSubtotal,
    });
  }

  // 2. Validate Coupon and Calculate Discount
  let coupon = null;
  let couponDiscount = 0;

  if (couponCode && couponCode.trim()) {
    const formattedCode = couponCode.trim().toUpperCase();
    coupon = await Coupon.findOne({ code: formattedCode });

    if (!coupon) {
      return {
        success: false,
        message: "Invalid coupon code",
      };
    }

    if (!coupon.isActive) {
      return {
        success: false,
        message: "Coupon is inactive",
      };
    }

    const now = new Date();
    if (now < coupon.startDate) {
      return {
        success: false,
        message: "Coupon is not yet active",
      };
    }

    if (now > coupon.expiryDate) {
      return {
        success: false,
        message: "Coupon has expired",
      };
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return {
        success: false,
        message: "Coupon usage limit reached",
      };
    }

    if (itemsPrice < coupon.minPurchaseAmount) {
      return {
        success: false,
        message: `Minimum purchase amount of Rs ${coupon.minPurchaseAmount} is required to apply this coupon`,
      };
    }

    // Calculate discount amount
    if (coupon.discountType === "Percentage") {
      couponDiscount = itemsPrice * (coupon.discountValue / 100);
      if (coupon.maxDiscountAmount !== null && couponDiscount > coupon.maxDiscountAmount) {
        couponDiscount = coupon.maxDiscountAmount;
      }
    } else if (coupon.discountType === "Flat") {
      couponDiscount = coupon.discountValue;
    }

    // Cap discount to itemsPrice to prevent negative prices
    couponDiscount = Math.min(couponDiscount, itemsPrice);
  }

  // 3. Proportional Discount Distribution & GST Calculation
  let totalGstAmount = 0;

  for (const item of calculatedItems) {
    let itemDiscount = 0;
    if (itemsPrice > 0) {
      // Pro-rata distribution of discount
      itemDiscount = couponDiscount * (item.baseSubtotal / itemsPrice);
    }

    const remainingBase = item.baseSubtotal - itemDiscount;
    const itemGst = remainingBase * (item.gstRate / 100);

    totalGstAmount += itemGst;

    item.discount = Number(itemDiscount.toFixed(2));
    item.gstAmount = Number(itemGst.toFixed(2));
    item.finalPrice = Number((remainingBase + itemGst).toFixed(2));
  }

  const shippingPrice = 0; // Configured shipping rate (if any)
  const finalTotalPrice = (itemsPrice - couponDiscount) + totalGstAmount + shippingPrice;

  return {
    success: true,
    coupon,
    pricing: {
      itemsPrice: Number(itemsPrice.toFixed(2)),
      couponCode: coupon ? coupon.code : null,
      couponDiscount: Number(couponDiscount.toFixed(2)),
      gstAmount: Number(totalGstAmount.toFixed(2)),
      shippingPrice: Number(shippingPrice.toFixed(2)),
      totalPrice: Number(finalTotalPrice.toFixed(2)),
    },
    items: calculatedItems,
  };
};

module.exports = {
  calculatePricing,
};
