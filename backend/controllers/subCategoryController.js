const SubCategory = require("../models/SubCategory");
const Category = require("../models/Category");
const { cloudinary } = require("../config/cloudinary");
const generateCustomId = require("../utils/generateCustomId");

// ───────────────────────────────────────────────────────────────
// Create Sub-Category
// POST /api/v1/admin/sub-categories
// ───────────────────────────────────────────────────────────────
const createSubCategory = async (req, res) => {
  try {
    const { name, category_id } = req.body;

    if (!name || !category_id) {
      if (req.file?.public_id) await cloudinary.uploader.destroy(req.file.public_id);
      return res.status(400).json({
        success: false,
        message: "name and category_id are required",
      });
    }

    // Validate parent category exists and is active
    const parentCategory = await Category.findOne({
      category_id,
      isActive: true,
    }).lean();

    if (!parentCategory) {
      if (req.file?.public_id) await cloudinary.uploader.destroy(req.file.public_id);
      return res.status(404).json({
        success: false,
        message: "Parent category not found or inactive",
      });
    }

    // Check duplicate name within same category
    const existing = await SubCategory.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      category: parentCategory._id,
    }).lean();

    if (existing) {
      if (req.file?.public_id) await cloudinary.uploader.destroy(req.file.public_id);
      return res.status(409).json({
        success: false,
        message: "Sub-category with this name already exists in this category",
      });
    }

    const sub_category_id = await generateCustomId("SubCategory", "SUB");

    const subCategory = await SubCategory.create({
      sub_category_id,
      name: name.trim(),
      category: parentCategory._id,
      image: req.file
        ? { url: req.file.path, public_id: req.file.filename }
        : { url: "", public_id: "" },
      createdBy: req.admin._id,
    });

    // Populate category info in response
    await subCategory.populate("category", "category_id name slug");

    return res.status(201).json({
      success: true,
      message: "Sub-category created successfully",
      data: subCategory,
    });
  } catch (error) {
    console.error("Create SubCategory Error:", error);
    if (req.file?.public_id) await cloudinary.uploader.destroy(req.file.public_id).catch(() => {});
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ───────────────────────────────────────────────────────────────
// Get All Sub-Categories
// GET /api/v1/admin/sub-categories
// ───────────────────────────────────────────────────────────────
const getAllSubCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status, category_id } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};

    if (search.trim()) {
      filter.name = { $regex: search.trim(), $options: "i" };
    }

    if (status === "active") filter.isActive = true;
    else if (status === "inactive") filter.isActive = false;

    // Filter by parent category_id if provided
    if (category_id) {
      const parentCategory = await Category.findOne({ category_id }).select("_id").lean();
      if (!parentCategory) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }
      filter.category = parentCategory._id;
    }

    const [subCategories, total] = await Promise.all([
      SubCategory.find(filter)
        .select("-__v")
        .populate("category", "category_id name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      SubCategory.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: subCategories,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get SubCategories Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ───────────────────────────────────────────────────────────────
// Get Single Sub-Category
// GET /api/v1/admin/sub-categories/:id
// ───────────────────────────────────────────────────────────────
const getSubCategoryById = async (req, res) => {
  try {
    const subCategory = await SubCategory.findOne({
      $or: [{ sub_category_id: req.params.id }, { slug: req.params.id }],
    })
      .select("-__v")
      .populate("category", "category_id name slug")
      .lean();

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: "Sub-category not found",
      });
    }

    return res.status(200).json({ success: true, data: subCategory });
  } catch (error) {
    console.error("Get SubCategory Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ───────────────────────────────────────────────────────────────
// Update Sub-Category
// PUT /api/v1/admin/sub-categories/:id
// ───────────────────────────────────────────────────────────────
const updateSubCategory = async (req, res) => {
  try {
    const { name, category_id, isActive } = req.body;

    const subCategory = await SubCategory.findOne({ sub_category_id: req.params.id });

    if (!subCategory) {
      if (req.file?.public_id) await cloudinary.uploader.destroy(req.file.public_id);
      return res.status(404).json({
        success: false,
        message: "Sub-category not found",
      });
    }

    // If changing parent category, validate new category
    let newParentId = subCategory.category;
    if (category_id) {
      const parentCategory = await Category.findOne({
        category_id,
        isActive: true,
      }).lean();

      if (!parentCategory) {
        if (req.file?.public_id) await cloudinary.uploader.destroy(req.file.public_id);
        return res.status(404).json({
          success: false,
          message: "Parent category not found or inactive",
        });
      }
      newParentId = parentCategory._id;
    }

    // Check name conflict within same category (exclude current)
    if (name && name.trim() !== subCategory.name) {
      const existing = await SubCategory.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
        category: newParentId,
        _id: { $ne: subCategory._id },
      }).lean();

      if (existing) {
        if (req.file?.public_id) await cloudinary.uploader.destroy(req.file.public_id);
        return res.status(409).json({
          success: false,
          message: "Sub-category with this name already exists in this category",
        });
      }
    }

    // Replace image on cloudinary if new one uploaded
    if (req.file && subCategory.image?.public_id) {
      await cloudinary.uploader.destroy(subCategory.image.public_id).catch(() => {});
    }

    if (name) subCategory.name = name.trim();
    if (category_id) subCategory.category = newParentId;
    if (isActive !== undefined) subCategory.isActive = isActive === "true" || isActive === true;
    if (req.file) subCategory.image = { url: req.file.path, public_id: req.file.filename };

    await subCategory.save();
    await subCategory.populate("category", "category_id name slug");

    return res.status(200).json({
      success: true,
      message: "Sub-category updated successfully",
      data: subCategory,
    });
  } catch (error) {
    console.error("Update SubCategory Error:", error);
    if (req.file?.public_id) await cloudinary.uploader.destroy(req.file.public_id).catch(() => {});
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Sub-category name already exists" });
    }
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ───────────────────────────────────────────────────────────────
// Delete Sub-Category
// DELETE /api/v1/admin/sub-categories/:id
// ───────────────────────────────────────────────────────────────
const deleteSubCategory = async (req, res) => {
  try {
    const subCategory = await SubCategory.findOne({ sub_category_id: req.params.id });

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: "Sub-category not found",
      });
    }

    if (subCategory.image?.public_id) {
      await cloudinary.uploader.destroy(subCategory.image.public_id).catch(() => {});
    }

    await subCategory.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Sub-category deleted successfully",
    });
  } catch (error) {
    console.error("Delete SubCategory Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ───────────────────────────────────────────────────────────────
// Toggle Sub-Category Status
// PATCH /api/v1/admin/sub-categories/:id/toggle-status
// ───────────────────────────────────────────────────────────────
const toggleSubCategoryStatus = async (req, res) => {
  try {
    const subCategory = await SubCategory.findOne({ sub_category_id: req.params.id });

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: "Sub-category not found",
      });
    }

    subCategory.isActive = !subCategory.isActive;
    await subCategory.save();

    return res.status(200).json({
      success: true,
      message: `Sub-category ${subCategory.isActive ? "activated" : "deactivated"} successfully`,
      data: {
        sub_category_id: subCategory.sub_category_id,
        isActive: subCategory.isActive,
      },
    });
  } catch (error) {
    console.error("Toggle SubCategory Status Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  createSubCategory,
  getAllSubCategories,
  getSubCategoryById,
  updateSubCategory,
  deleteSubCategory,
  toggleSubCategoryStatus,
};
