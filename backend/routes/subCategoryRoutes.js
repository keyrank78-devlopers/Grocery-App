const express = require("express");
const {
  createSubCategory,
  getAllSubCategories,
  getSubCategoryById,
  updateSubCategory,
  deleteSubCategory,
  toggleSubCategoryStatus,
} = require("../controllers/subCategoryController");
const { verifyAdminToken } = require("../middleware/auth");
const { handleCategoryImageUpload } = require("../middleware/uploadMiddleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Customer - Sub-Categories
 *     description: Public sub-category endpoints for Customer App / Storefront
 */

// ─── Public Sub-Category Endpoints ───────────────────────────────────────────

/**
 * @swagger
 * /sub-categories:
 *   get:
 *     summary: Get all sub-categories (Public - Filter by Parent Category)
 *     tags: [Customer - Sub-Categories]
 *     parameters:
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *         description: Filter sub-categories by Parent Category ID (e.g. CAT-000001 or MongoDB ObjectId)
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
 *         description: Number of items per page (max 50)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search sub-category by name
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *           default: active
 *         description: Filter by sub-category status
 *     responses:
 *       200:
 *         description: Sub-categories list retrieved successfully
 *       404:
 *         description: Parent category not found
 */
router.get("/", getAllSubCategories);

/**
 * @swagger
 * /sub-categories/{id}:
 *   get:
 *     summary: Get single sub-category by ID or Slug (Public)
 *     tags: [Customer - Sub-Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sub-Category MongoDB ID, sub_category_id (e.g. SUB-000001), or slug
 *     responses:
 *       200:
 *         description: Sub-category details retrieved
 *       404:
 *         description: Sub-category not found
 */
router.get("/:id", getSubCategoryById);

// ─── Admin-only Sub-Category Endpoints ───────────────────────────────────────
// POST /api/v1/sub-categories (Create sub-category)
router.post("/", verifyAdminToken, handleCategoryImageUpload, createSubCategory);

// PUT /api/v1/sub-categories/:id (Update sub-category)
router.put("/:id", verifyAdminToken, handleCategoryImageUpload, updateSubCategory);

// DELETE /api/v1/sub-categories/:id (Delete sub-category)
router.delete("/:id", verifyAdminToken, deleteSubCategory);

// PATCH /api/v1/sub-categories/:id/toggle-status (Toggle active status)
router.patch("/:id/toggle-status", verifyAdminToken, toggleSubCategoryStatus);

module.exports = router;
