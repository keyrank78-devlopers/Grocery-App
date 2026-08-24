const express = require("express");
const {
  createBanner,
  getAllBannersAdmin,
  getActiveBannersPublic,
  getBannerById,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
} = require("../controllers/bannerController");
const { verifyAdminToken } = require("../middleware/auth");
const { handleBannerImageUpload } = require("../middleware/uploadMiddleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Customer - Banners
 *     description: Public promotional banner endpoints for Customer App / Storefront
 */

// ─── Public Customer Banner Endpoints ─────────────────────────────────────────

/**
 * @swagger
 * /banners:
 *   get:
 *     summary: View active promotional home banners for Customer App (Public)
 *     tags: [Customer - Banners]
 *     parameters:
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
 *           default: 20
 *         description: Number of banners per page (max 50)
 *     responses:
 *       200:
 *         description: Active promotional banners list retrieved successfully
 */
router.get("/", getActiveBannersPublic);

/**
 * @swagger
 * /banners/{id}:
 *   get:
 *     summary: Get details of a single active banner by banner_id (Public)
 *     tags: [Customer - Banners]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Banner Custom ID (e.g. BAN-000001)
 *     responses:
 *       200:
 *         description: Banner details retrieved
 *       404:
 *         description: Banner not found or inactive
 */
router.get("/:id", getBannerById);

// ─── Admin-only Banner Endpoints ─────────────────────────────────────────────
router.get("/admin/all", verifyAdminToken, getAllBannersAdmin);
router.post("/", verifyAdminToken, handleBannerImageUpload, createBanner);
router.put("/:id", verifyAdminToken, handleBannerImageUpload, updateBanner);
router.delete("/:id", verifyAdminToken, deleteBanner);
router.patch("/:id/toggle-status", verifyAdminToken, toggleBannerStatus);

module.exports = router;
