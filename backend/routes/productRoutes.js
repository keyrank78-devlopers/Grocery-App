const express = require("express");
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  getSearchSuggestions,
} = require("../controllers/productController");
const { verifyAdminToken } = require("../middleware/auth");
const { handleProductUpload } = require("../middleware/uploadMiddleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Customer - Products
 *     description: Public product listing, search, and details endpoints for Customer App
 */

// ─── Public Product Endpoints ────────────────────────────────────────────────

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get products listing & search (Public)
 *     tags: [Customer - Products]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search product by name, SKU, or description
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by Category MongoDB ObjectId
 *       - in: query
 *         name: subCategory
 *         schema:
 *           type: string
 *         description: Filter by SubCategory MongoDB ObjectId
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
 *         description: Number of products per page (max 50)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *           default: active
 *         description: Filter by product status
 *     responses:
 *       200:
 *         description: Products list retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get("/", getAllProducts);

/**
 * @swagger
 * /products/search-suggestions:
 *   get:
 *     summary: Ultra-fast product search autocomplete & instant suggestions (Public)
 *     tags: [Customer - Products]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query keyword typed by customer (e.g. "mi" or "milk")
 *         example: "mi"
 *     responses:
 *       200:
 *         description: Instant autocomplete text suggestions and top product previews
 */
router.get("/search-suggestions", getSearchSuggestions);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get single product details by MongoDB ID or SKU (Public)
 *     tags: [Customer - Products]
 *     description: Returns complete product details including variants, gallery images, averageRating, ratingsCount, and top 5 recent reviews.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product MongoDB ObjectId or SKU (e.g. SKU-10001)
 *     responses:
 *       200:
 *         description: Product details retrieved successfully
 *       404:
 *         description: Product not found
 */
router.get("/:id", getProductById);

// ─── Admin-only Product Endpoints ────────────────────────────────────────────
// POST /api/v1/products (Create product)
router.post("/", verifyAdminToken, handleProductUpload, createProduct);

// PUT /api/v1/products/:id (Update product details, images, video)
router.put("/:id", verifyAdminToken, handleProductUpload, updateProduct);

// DELETE /api/v1/products/:id (Delete product and media)
router.delete("/:id", verifyAdminToken, deleteProduct);

// PATCH /api/v1/products/:id/toggle-status (Toggle active/inactive status)
router.patch("/:id/toggle-status", verifyAdminToken, toggleProductStatus);

module.exports = router;
