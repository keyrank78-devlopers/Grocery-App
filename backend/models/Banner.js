const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    banner_id: {
      type: String,
      unique: true,
    },
    image: {
      url: {
        type: String,
        required: [true, "Banner image URL is required"],
      },
      public_id: {
        type: String,
        required: [true, "Banner image public_id is required"],
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Banner", bannerSchema);
