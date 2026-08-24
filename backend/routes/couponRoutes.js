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
 *   - name: Customer - Coupons & Offers
 *     description: Customer discount coupons and promotional offers endpoints
 */

// ─── Admin-only Coupon Endpoints ─────────────────────────────────────────────
router.post("/admin", verifyAdminToken, createCoupon);
router.get("/admin", verifyAdminToken, getAllCoupons);
router.get("/admin/:id", verifyAdminToken, getCouponById);
router.put("/admin/:id", verifyAdminToken, updateCoupon);
router.delete("/admin/:id", verifyAdminToken, deleteCoupon);
router.patch("/admin/:id/toggle-status", verifyAdminToken, toggleCouponStatus);

// ─── Customer-only Coupon Endpoints ──────────────────────────────────────────

/**
 * @swagger
 * /coupons/active:
 *   get:
 *     summary: View all active & valid discount coupons for customer (Paginated & Filterable)
 *     tags: [Customer - Coupons & Offers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search active coupons by promo code (e.g. WELCOME50)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of coupons per page (max 50)
 *     responses:
 *       200:
 *         description: Active coupons list retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/active", verifyCustomerToken, getActiveCoupons);

/**
 * @swagger
 * /coupons/apply:
 *   post:
 *     summary: Validate & Apply coupon code to current cart
 *     tags: [Customer - Coupons & Offers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [couponCode]
 *             properties:
 *               couponCode:
 *                 type: string
 *                 description: Coupon promo code
 *                 example: "WELCOME50"
 *     responses:
 *       200:
 *         description: Coupon applied successfully with pricing preview breakdown
 *       400:
 *         description: Invalid or expired coupon code / Minimum purchase amount not met / Cart is empty
 *       401:
 *         description: Unauthorized
 */
router.post("/apply", verifyCustomerToken, applyCoupon);

module.exports = router;
