const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer reference is required"],
    },
    name: {
      type: String,
      required: [true, "Recipient name is required"],
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
    },
    alternateMobile: {
      type: String,
      trim: true,
    },
    addressLine1: {
      type: String,
      required: [true, "Address line 1 is required"],
      trim: true,
    },
    addressLine2: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, "Pincode is required"],
      trim: true,
    },
    landmark: {
      type: String,
      trim: true,
    },
    addressType: {
      type: String,
      enum: ["Home", "Work", "Other"],
      default: "Home",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: [true, "Coordinates are required [longitude, latitude]"],
      },
    },
  },
  { timestamps: true }
);

// Indexes: Customer-based index for fast address retrieval
addressSchema.index({ customer: 1 });
addressSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Address", addressSchema);
