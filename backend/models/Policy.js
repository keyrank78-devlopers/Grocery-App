const mongoose = require("mongoose");

const policySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, "Policy type is required"],
      enum: ["privacy_policy", "terms_conditions", "about_us", "refund_policy", "shipping_policy"],
      unique: true,
    },
    title: {
      type: String,
      required: [true, "Policy title is required"],
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Policy content is required"],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Policy", policySchema);
