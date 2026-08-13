const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    category_id: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
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

// Auto-generate slug from name before save
categorySchema.pre("save", function () {
  if (this.isModified("name")) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }
});

module.exports = mongoose.model("Category", categorySchema);
