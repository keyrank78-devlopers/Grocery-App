const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category reference is required"],
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
      required: [true, "Sub-category reference is required"],
    },
    description: {
      type: String,
      trim: true,
    },
    mrp: {
      type: Number,
      required: [true, "MRP is required"],
      min: [0, "MRP cannot be negative"],
    },
    sellPrice: {
      type: Number,
      required: [true, "Selling price is required"],
      min: [0, "Selling price cannot be negative"],
      validate: {
        validator: function (value) {
          return value <= this.mrp;
        },
        message: "Selling price cannot be greater than MRP",
      },
    },
    stockQuantity: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock quantity cannot be negative"],
      default: 0,
    },
    gstRate: {
      type: Number,
      default: 0,
      min: [0, "GST rate cannot be negative"],
    },
    sku: {
      type: String,
      unique: true,
    },
    image: {
      url: {
        type: String,
        required: [true, "Product main image is required"],
      },
      public_id: {
        type: String,
        required: [true, "Product main image public ID is required"],
      },
    },
    images: [
      {
        url: { type: String },
        public_id: { type: String },
      },
    ],
    video: {
      url: { type: String, default: "" },
      public_id: { type: String, default: "" },
    },
    variants: [
      {
        key: {
          type: String,
          required: [true, "Variant key is required"],
          trim: true,
        },
        value: {
          type: String,
          required: [true, "Variant value is required"],
          trim: true,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "Creator reference is required"],
    },
  },
  { timestamps: true }
);

// Auto-generate slug from name
productSchema.pre("save", function () {
  if (this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }
});

// ── Indexes for query performance ──────────────────────────────
productSchema.index({ category: 1 });
productSchema.index({ subCategory: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ category: 1, subCategory: 1, isActive: 1 }); // compound — most common query
productSchema.index({ name: "text", description: "text" });         // full-text search

module.exports = mongoose.model("Product", productSchema);
