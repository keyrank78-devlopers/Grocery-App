const mongoose = require("mongoose");

const warehouseSchema = new mongoose.Schema(
  {
    warehouse_id: {
      type: String,
      unique: true,
      required: true,
    },
    name: {
      type: String,
      required: [true, "Warehouse name is required"],
      trim: true,
    },
    address: {
      addressLine1: {
        type: String,
        required: [true, "Address Line 1 is required"],
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
    },
    contactNumber: {
      type: String,
      required: [true, "Contact number is required"],
      trim: true,
    },
    openingTime: {
      type: String,
      required: [true, "Opening time is required"],
      trim: true,
    },
    closingTime: {
      type: String,
      required: [true, "Closing time is required"],
      trim: true,
    },
    deliveryRangeKm: {
      type: Number,
      required: [true, "Delivery range in kilometers is required"],
      min: [1, "Delivery range must be at least 1 km"],
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
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

warehouseSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Warehouse", warehouseSchema);
