const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
    guestId: {
      type: String,
      default: null,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: [true, "Product reference is required"],
        },
        quantity: {
          type: Number,
          required: [true, "Quantity is required"],
          min: [1, "Quantity cannot be less than 1"],
          default: 1,
        },
      },
    ],
  },
  { timestamps: true }
);

// Indexes: A customer can have at most one cart, and a guest session can have at most one cart.
cartSchema.index(
  { customer: 1 },
  { unique: true, partialFilterExpression: { customer: { $exists: true, $ne: null } } }
);

cartSchema.index(
  { guestId: 1 },
  { unique: true, partialFilterExpression: { guestId: { $exists: true, $ne: null } } }
);

module.exports = mongoose.model("Cart", cartSchema);
