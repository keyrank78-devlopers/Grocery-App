const express = require("express");
const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
} = require("../controllers/categoryController");
const { verifyAdminToken } = require("../middleware/auth");
const { handleCategoryImageUpload } = require("../middleware/uploadMiddleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Customer - Categories
 *     description: Public category endpoints for Customer App / Storefront
 */

// ─── Public Category Endpoints ───────────────────────────────────────────────

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all active categories (Public)
 *     tags: [Customer - Categories]
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
 *           default: 10
 *         description: Number of categories per page (max 50)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search category by name
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *           default: active
 *         description: Filter by category status
 *     responses:
 *       200:
 *         description: List of categories retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get("/", getAllCategories);

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get single category by ID or Slug (Public)
 *     tags: [Customer - Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category MongoDB ID, category_id (e.g. CAT-000001), or slug
 *     responses:
 *       200:
 *         description: Category details retrieved
 *       404:
 *         description: Category not found
 */
router.get("/:id", getCategoryById);

// ─── Admin-only Category Endpoints ───────────────────────────────────────────
// POST /api/v1/categories (Create new category)
router.post("/", verifyAdminToken, handleCategoryImageUpload, createCategory);

// PUT /api/v1/categories/:id (Update category details or image)
router.put("/:id", verifyAdminToken, handleCategoryImageUpload, updateCategory);

// DELETE /api/v1/categories/:id (Delete category)
router.delete("/:id", verifyAdminToken, deleteCategory);

// PATCH /api/v1/categories/:id/toggle-status (Toggle active/inactive status)
router.patch("/:id/toggle-status", verifyAdminToken, toggleCategoryStatus);

module.exports = router;
