const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    order_id: {
      type: String,
      required: [true, "Order ID is required"],
      unique: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer reference is required"],
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: [true, "Product reference is required"],
        },
        name: {
          type: String,
          required: [true, "Product name at time of order is required"],
        },
        sellPrice: {
          type: Number,
          required: [true, "Product selling price at time of order is required"],
        },
        mrp: {
          type: Number,
          required: [true, "Product MRP at time of order is required"],
        },
        quantity: {
          type: Number,
          required: [true, "Quantity is required"],
          min: [1, "Quantity must be at least 1"],
        },
      },
    ],
    shippingAddress: {
      name: { type: String, required: true },
      mobile: { type: String, required: true },
      alternateMobile: { type: String },
      addressLine1: { type: String, required: true },
      addressLine2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      landmark: { type: String },
      addressType: { type: String, default: "Home" },
    },
    pricing: {
      itemsPrice: {
        type: Number,
        required: [true, "Items total price is required"],
      },
      couponCode: {
        type: String,
        default: null,
      },
      couponDiscount: {
        type: Number,
        default: 0,
      },
      gstAmount: {
        type: Number,
        default: 0,
      },
      shippingPrice: {
        type: Number,
        required: [true, "Shipping price is required"],
        default: 0,
      },
      totalPrice: {
        type: Number,
        required: [true, "Total price is required"],
      },
    },
    paymentInfo: {
      method: {
        type: String,
        enum: ["COD", "Online"],
        default: "COD",
      },
      status: {
        type: String,
        enum: ["Pending", "Paid", "Failed"],
        default: "Pending",
      },
      transactionId: {
        type: String,
        default: null,
      },
      razorpayOrderId: {
        type: String,
        default: null,
      },
      razorpayPaymentId: {
        type: String,
        default: null,
      },
      razorpaySignature: {
        type: String,
        default: null,
      },
    },
    orderStatus: {
      type: String,
      enum: ["Pending", "Placed", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
    history: [
      {
        status: { type: String, required: true },
        updatedAt: { type: Date, default: Date.now },
        message: { type: String },
      },
    ],
  },
  { timestamps: true }
);

// Indexes: Optimize query performance
orderSchema.index({ customer: 1 });

module.exports = mongoose.model("Order", orderSchema);
