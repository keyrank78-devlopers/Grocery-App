const Coupon = require("../models/Coupon");
const Cart = require("../models/Cart");
const { calculatePricing } = require("../utils/pricingHelper");

// ───────────────────────────────────────────────────────────────
// Admin Coupon CRUD Operations
// ───────────────────────────────────────────────────────────────

// 1. Create Coupon
// POST /api/v1/admin/coupons
const createCoupon = async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minPurchaseAmount,
      maxDiscountAmount,
      startDate,
      expiryDate,
      usageLimit,
      isActive,
    } = req.body;

    if (!code || !discountType || discountValue === undefined || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: "Code, discountType, discountValue, and expiryDate are required",
      });
    }

    const formattedCode = code.trim().toUpperCase();

    // Check uniqueness
    const existingCoupon = await Coupon.findOne({ code: formattedCode });
    if (existingCoupon) {
      return res.status(409).json({
        success: false,
        message: `Coupon with code "${formattedCode}" already exists`,
      });
    }

    const coupon = await Coupon.create({
      code: formattedCode,
      discountType,
      discountValue: Number(discountValue),
      minPurchaseAmount: minPurchaseAmount !== undefined ? Number(minPurchaseAmount) : 0,
      maxDiscountAmount: maxDiscountAmount !== undefined && maxDiscountAmount !== null ? Number(maxDiscountAmount) : null,
      startDate: startDate ? new Date(startDate) : undefined,
      expiryDate: new Date(expiryDate),
      usageLimit: usageLimit !== undefined && usageLimit !== null ? Number(usageLimit) : null,
      isActive: isActive !== undefined ? (isActive === "true" || isActive === true) : true,
    });

    return res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: coupon,
    });
  } catch (error) {
    console.error("Create Coupon Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error creating coupon",
    });
  }
};

// 2. Get All Coupons (Admin pagination/filter)
// GET /api/v1/admin/coupons
const getAllCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (search.trim()) {
      filter.code = { $regex: search.trim(), $options: "i" };
    }

    const [coupons, total] = await Promise.all([
      Coupon.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Coupon.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: coupons,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get All Coupons Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching coupons",
    });
  }
};

// 3. Get Single Coupon
// GET /api/v1/admin/coupons/:id
const getCouponById = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id).lean();

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: coupon,
    });
  } catch (error) {
    console.error("Get Single Coupon Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 4. Update Coupon
// PUT /api/v1/admin/coupons/:id
const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      discountType,
      discountValue,
      minPurchaseAmount,
      maxDiscountAmount,
      startDate,
      expiryDate,
      usageLimit,
      isActive,
    } = req.body;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    if (code) {
      const formattedCode = code.trim().toUpperCase();
      if (formattedCode !== coupon.code) {
        // Ensure uniqueness for new code
        const existingCoupon = await Coupon.findOne({ code: formattedCode });
        if (existingCoupon) {
          return res.status(409).json({
            success: false,
            message: `Coupon with code "${formattedCode}" already exists`,
          });
        }
        coupon.code = formattedCode;
      }
    }

    if (discountType !== undefined) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = Number(discountValue);
    if (minPurchaseAmount !== undefined) coupon.minPurchaseAmount = Number(minPurchaseAmount);
    if (maxDiscountAmount !== undefined) coupon.maxDiscountAmount = maxDiscountAmount;
    if (startDate !== undefined) coupon.startDate = startDate ? new Date(startDate) : null;
    if (expiryDate !== undefined) coupon.expiryDate = new Date(expiryDate);
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
    if (isActive !== undefined) {
      coupon.isActive = isActive === "true" || isActive === true;
    }

    await coupon.save();

    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      data: coupon,
    });
  } catch (error) {
    console.error("Update Coupon Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error updating coupon",
    });
  }
};

// 5. Delete Coupon
// DELETE /api/v1/admin/coupons/:id
const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.error("Delete Coupon Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error deleting coupon",
    });
  }
};

// 6. Toggle Coupon Status
// PATCH /api/v1/admin/coupons/:id/toggle-status
const toggleCouponStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    return res.status(200).json({
      success: true,
      message: `Coupon ${coupon.isActive ? "activated" : "deactivated"} successfully`,
      data: { code: coupon.code, isActive: coupon.isActive },
    });
  } catch (error) {
    console.error("Toggle Coupon Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Customer Coupon Operations
// ───────────────────────────────────────────────────────────────

// Apply Coupon (Preview only, does not alter DB)
// POST /api/v1/orders/coupon/apply
const applyCoupon = async (req, res) => {
  try {
    const customerId = req.customerId;
    const { couponCode } = req.body;

    if (!couponCode) {
      return res.status(400).json({
        success: false,
        message: "couponCode is required",
      });
    }

    // Get customer's cart
    const cart = await Cart.findOne({ customer: customerId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty. Cannot apply coupon.",
      });
    }

    // Call pricing helper
    const result = await calculatePricing(cart, couponCode);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Coupon applied successfully",
      data: {
        pricing: result.pricing,
      },
    });
  } catch (error) {
    console.error("Apply Coupon Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error applying coupon",
    });
  }
};

// Get Active Coupons (Customer)
// GET /api/v1/coupons/active
const getActiveCoupons = async (req, res) => {
  try {
    const currentDate = new Date();
    const activeCoupons = await Coupon.find({
      isActive: true,
      expiryDate: { $gt: currentDate },
      $or: [
        { startDate: { $exists: false } },
        { startDate: null },
        { startDate: { $lte: currentDate } }
      ]
    }).select("-__v").sort({ expiryDate: 1 }).lean();

    return res.status(200).json({
      success: true,
      data: activeCoupons,
    });
  } catch (error) {
    console.error("Get Active Coupons Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching active coupons",
    });
  }
};

module.exports = {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  applyCoupon,
  getActiveCoupons,
};
