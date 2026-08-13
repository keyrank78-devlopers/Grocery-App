const express = require("express");
const {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  applyCoupon,
} = require("../controllers/couponController");
const { verifyAdminToken, verifyCustomerToken } = require("../middleware/auth");

const router = express.Router();

// ─── Admin-only Coupon Endpoints ─────────────────────────────────────────────
router.post("/admin", verifyAdminToken, createCoupon);
router.get("/admin", verifyAdminToken, getAllCoupons);
router.get("/admin/:id", verifyAdminToken, getCouponById);
router.put("/admin/:id", verifyAdminToken, updateCoupon);
router.delete("/admin/:id", verifyAdminToken, deleteCoupon);
router.patch("/admin/:id/toggle-status", verifyAdminToken, toggleCouponStatus);

// ─── Customer-only Coupon Endpoints ──────────────────────────────────────────
router.post("/apply", verifyCustomerToken, applyCoupon);

module.exports = router;
