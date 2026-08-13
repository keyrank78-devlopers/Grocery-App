const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    mobile: {
      type: String,
      required: true,
      unique: true, // Only one active OTP per mobile number
    },
    otp: {
      type: String,
      required: true,
    },
    name: {
      type: String, // Temporarily hold name for new registration flow
      default: "",
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Auto delete when expiresAt is reached
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OTP", otpSchema);
