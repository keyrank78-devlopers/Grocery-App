const express = require("express");
const {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  applyCoupon,
  getActiveCoupons,
} = require("../controllers/couponController");
const { verifyAdminToken, verifyCustomerToken } = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Coupon
 *   description: Coupon management
 */

// ─── Admin-only Coupon Endpoints ─────────────────────────────────────────────

/**
 * @swagger
 * /coupons/admin:
 *   post:
 *     summary: Create a new coupon
 *     tags: [Coupon]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Coupon created
 */
router.post("/admin", verifyAdminToken, createCoupon);

/**
 * @swagger
 * /coupons/admin:
 *   get:
 *     summary: Get all coupons
 *     tags: [Coupon]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Coupons retrieved
 */
router.get("/admin", verifyAdminToken, getAllCoupons);

/**
 * @swagger
 * /coupons/admin/{id}:
 *   get:
 *     summary: Get single coupon
 *     tags: [Coupon]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coupon retrieved
 */
router.get("/admin/:id", verifyAdminToken, getCouponById);

/**
 * @swagger
 * /coupons/admin/{id}:
 *   put:
 *     summary: Update coupon
 *     tags: [Coupon]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coupon updated
 */
router.put("/admin/:id", verifyAdminToken, updateCoupon);

/**
 * @swagger
 * /coupons/admin/{id}:
 *   delete:
 *     summary: Delete coupon
 *     tags: [Coupon]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coupon deleted
 */
router.delete("/admin/:id", verifyAdminToken, deleteCoupon);

/**
 * @swagger
 * /coupons/admin/{id}/toggle-status:
 *   patch:
 *     summary: Toggle coupon status
 *     tags: [Coupon]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status toggled
 */
router.patch("/admin/:id/toggle-status", verifyAdminToken, toggleCouponStatus);

// ─── Customer-only Coupon Endpoints ──────────────────────────────────────────

/**
 * @swagger
 * /coupons/apply:
 *   post:
 *     summary: Apply coupon to cart
 *     tags: [Coupon]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Coupon applied successfully
 */
router.post("/apply", verifyCustomerToken, applyCoupon);

/**
 * @swagger
 * /coupons/active:
 *   get:
 *     summary: Get all active coupons (Customer)
 *     tags: [Coupon]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active coupons retrieved
 */
router.get("/active", verifyCustomerToken, getActiveCoupons);

module.exports = router;
