const mongoose = require("mongoose");

const subCategorySchema = new mongoose.Schema(
  {
    sub_category_id: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: [true, "Sub-category name is required"],
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
      required: [true, "Parent category is required"],
    },
    image: {
      url: { type: String, default: "" },
      public_id: { type: String, default: "" },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true }
);

// Auto-generate slug from name
subCategorySchema.pre("save", function () {
  if (this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }
});

module.exports = mongoose.model("SubCategory", subCategorySchema);
