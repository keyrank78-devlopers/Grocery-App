const Banner = require("../models/Banner");
const { cloudinary } = require("../config/cloudinary");
const generateCustomId = require("../utils/generateCustomId");

// ───────────────────────────────────────────────────────────────
// Create Banner
// POST /api/v1/admin/banners
// ───────────────────────────────────────────────────────────────
const createBanner = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Banner image is required",
      });
    }

    const banner_id = await generateCustomId("Banner", "BAN");

    const banner = await Banner.create({
      banner_id,
      image: {
        url: req.file.path,
        public_id: req.file.filename,
      },
      createdBy: req.admin._id,
    });

    return res.status(201).json({
      success: true,
      message: "Banner created successfully",
      data: banner,
    });
  } catch (error) {
    console.error("Create Banner Error:", error);

    if (req.file?.filename) {
      await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Get All Banners (Admin Panel view - includes inactive)
// GET /api/v1/admin/banners
// ───────────────────────────────────────────────────────────────
const getAllBannersAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (status === "active") filter.isActive = true;
    else if (status === "inactive") filter.isActive = false;

    const [banners, total] = await Promise.all([
      Banner.find(filter)
        .select("-__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Banner.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: banners,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get All Banners Admin Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Get Active Banners (Public View - only active banners)
// GET /api/v1/admin/get-banners
// ───────────────────────────────────────────────────────────────
const getActiveBannersPublic = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = { isActive: true };

    const [banners, total] = await Promise.all([
      Banner.find(filter)
        .select("-__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Banner.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: banners,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get Active Banners Public Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Get Single Banner By ID
// GET /api/v1/admin/single-banners/:id
// ───────────────────────────────────────────────────────────────
const getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findOne({
      banner_id: req.params.id,
      isActive: true,
    })
      .select("-__v")
      .lean();

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found or inactive",
      });
    }

    return res.status(200).json({
      success: true,
      data: banner,
    });
  } catch (error) {
    console.error("Get Banner By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Update Banner
// PUT /api/v1/admin/update-banners/:id
// ───────────────────────────────────────────────────────────────
const updateBanner = async (req, res) => {
  try {
    const { isActive } = req.body;

    const banner = await Banner.findOne({ banner_id: req.params.id });

    if (!banner) {
      if (req.file?.filename) {
        await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
      }
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    // If new image uploaded, delete old image from Cloudinary
    if (req.file && banner.image?.public_id) {
      await cloudinary.uploader.destroy(banner.image.public_id).catch(() => {});
    }

    if (isActive !== undefined) {
      banner.isActive = isActive === "true" || isActive === true;
    }

    if (req.file) {
      banner.image = {
        url: req.file.path,
        public_id: req.file.filename,
      };
    }

    await banner.save();

    return res.status(200).json({
      success: true,
      message: "Banner updated successfully",
      data: banner,
    });
  } catch (error) {
    console.error("Update Banner Error:", error);

    if (req.file?.filename) {
      await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Delete Banner (Hard Delete)
// DELETE /api/v1/admin/delete-banners/:id
// ───────────────────────────────────────────────────────────────
const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findOne({ banner_id: req.params.id });

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    // Delete image from Cloudinary
    if (banner.image?.public_id) {
      await cloudinary.uploader.destroy(banner.image.public_id).catch(() => {});
    }

    await banner.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (error) {
    console.error("Delete Banner Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Toggle Banner Status (Active / Inactive)
// PATCH /api/v1/admin/banners/:id/toggle-status
// ───────────────────────────────────────────────────────────────
const toggleBannerStatus = async (req, res) => {
  try {
    const banner = await Banner.findOne({ banner_id: req.params.id });

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    return res.status(200).json({
      success: true,
      message: `Banner ${banner.isActive ? "activated" : "deactivated"} successfully`,
      data: {
        banner_id: banner.banner_id,
        isActive: banner.isActive,
      },
    });
  } catch (error) {
    console.error("Toggle Banner Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createBanner,
  getAllBannersAdmin,
  getActiveBannersPublic,
  getBannerById,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
};
