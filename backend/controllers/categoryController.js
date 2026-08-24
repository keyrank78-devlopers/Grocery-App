const mongoose = require("mongoose");
const Category = require("../models/Category");
const { cloudinary } = require("../config/cloudinary");
const generateCustomId = require("../utils/generateCustomId");

// ───────────────────────────────────────────────────────────────
// Create Category
// POST /api/v1/admin/categories
// ───────────────────────────────────────────────────────────────
const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      // If image was uploaded but validation fails, delete from cloudinary
      if (req.file?.public_id) {
        await cloudinary.uploader.destroy(req.file.public_id);
      }
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    }).lean();

    if (existing) {
      if (req.file?.public_id) {
        await cloudinary.uploader.destroy(req.file.public_id);
      }
      return res.status(409).json({
        success: false,
        message: "Category with this name already exists",
      });
    }

    const category_id = await generateCustomId("Category", "CAT");

    const category = await Category.create({
      category_id,
      name: name.trim(),
      image: req.file
        ? { url: req.file.path, public_id: req.file.filename }
        : { url: "", public_id: "" },
      createdBy: req.admin._id,
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    console.error("Create Category Error:", error);

    if (req.file?.public_id) {
      await cloudinary.uploader.destroy(req.file.public_id).catch(() => {});
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Category name already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Get All Categories
// GET /api/v1/admin/categories
// ───────────────────────────────────────────────────────────────
const getAllCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};

    if (search.trim()) {
      filter.name = { $regex: search.trim(), $options: "i" };
    }

    if (status === "active") filter.isActive = true;
    else if (status === "inactive") filter.isActive = false;

    const [categories, total] = await Promise.all([
      Category.find(filter)
        .select("-__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Category.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: categories,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get Categories Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Get Single Category
// GET /api/v1/admin/categories/:id
// ───────────────────────────────────────────────────────────────
const getCategoryById = async (req, res) => {
  try {
    const query = {
      $or: [{ category_id: req.params.id }, { slug: req.params.id }],
      isActive: true,
    };
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      query.$or.push({ _id: req.params.id });
    }

    const category = await Category.findOne(query)
      .select("-__v")
      .lean();

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Get Category Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Update Category
// PUT /api/v1/admin/categories/:id
// ───────────────────────────────────────────────────────────────
const updateCategory = async (req, res) => {
  try {
    const { name, isActive } = req.body;

    const query = mongoose.Types.ObjectId.isValid(req.params.id)
      ? { $or: [{ category_id: req.params.id }, { _id: req.params.id }] }
      : { category_id: req.params.id };

    const category = await Category.findOne(query);

    if (!category) {
      if (req.file?.public_id) {
        await cloudinary.uploader.destroy(req.file.public_id);
      }
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Check name conflict (excluding current category)
    if (name && name.trim() !== category.name) {
      const existing = await Category.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
        _id: { $ne: category._id },
      }).lean();

      if (existing) {
        if (req.file?.public_id) {
          await cloudinary.uploader.destroy(req.file.public_id);
        }
        return res.status(409).json({
          success: false,
          message: "Category with this name already exists",
        });
      }
    }

    // If new image uploaded, delete old from cloudinary
    if (req.file && category.image?.public_id) {
      await cloudinary.uploader.destroy(category.image.public_id).catch(() => {});
    }

    if (name) category.name = name.trim();
    if (isActive !== undefined) category.isActive = isActive === "true" || isActive === true;
    if (req.file) {
      category.image = { url: req.file.path, public_id: req.file.filename };
    }

    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    console.error("Update Category Error:", error);

    if (req.file?.public_id) {
      await cloudinary.uploader.destroy(req.file.public_id).catch(() => {});
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Category name already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Delete Category (Soft Delete — sets isActive: false)
// DELETE /api/v1/admin/categories/:id
// ───────────────────────────────────────────────────────────────
const deleteCategory = async (req, res) => {
  try {
    const query = mongoose.Types.ObjectId.isValid(req.params.id)
      ? { $or: [{ category_id: req.params.id }, { _id: req.params.id }] }
      : { category_id: req.params.id };

    const category = await Category.findOne(query);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Hard delete — also remove image from cloudinary
    if (category.image?.public_id) {
      await cloudinary.uploader.destroy(category.image.public_id).catch(() => {});
    }

    await category.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete Category Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Toggle Category Status (Active / Inactive)
// PATCH /api/v1/admin/categories/:id/toggle-status
// ───────────────────────────────────────────────────────────────
const toggleCategoryStatus = async (req, res) => {
  try {
    const category = await Category.findOne({ category_id: req.params.id });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    category.isActive = !category.isActive;
    await category.save();

    return res.status(200).json({
      success: true,
      message: `Category ${category.isActive ? "activated" : "deactivated"} successfully`,
      data: { category_id: category.category_id, isActive: category.isActive },
    });
  } catch (error) {
    console.error("Toggle Category Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
};
