const express = require("express");
const {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  toggleWishlist,
  clearWishlist,
} = require("../controllers/wishlistController");
const { verifyCustomerToken } = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Customer - Wishlist
 *     description: Customer Wishlist management endpoints
 */

// Apply strict customer authentication to all wishlist endpoints
router.use(verifyCustomerToken);

/**
 * @swagger
 * /wishlist:
 *   get:
 *     summary: View customer's saved wishlist products (Paginated & Filterable)
 *     tags: [Customer - Wishlist]
 *     security:
 *       - bearerAuth: []
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
 *         description: Number of wishlist items per page (max 50)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search within wishlist by product name or SKU
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter wishlist items by Category MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Wishlist products retrieved successfully with pagination info
 *       401:
 *         description: Unauthorized
 */
router.get("/", getWishlist);

/**
 * @swagger
 * /wishlist/add:
 *   post:
 *     summary: Add product to wishlist
 *     tags: [Customer - Wishlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId]
 *             properties:
 *               productId:
 *                 type: string
 *                 description: Product MongoDB ObjectId
 *                 example: "64f1a2b3c4d5e6f7a8b9c0d1"
 *     responses:
 *       200:
 *         description: Product added to wishlist
 *       400:
 *         description: Product ID is required / Product already in wishlist
 *       404:
 *         description: Product not found
 */
router.post("/add", addToWishlist);

/**
 * @swagger
 * /wishlist/remove/{productId}:
 *   delete:
 *     summary: Remove product from wishlist
 *     tags: [Customer - Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Product removed from wishlist
 *       404:
 *         description: Wishlist or product not found
 */
router.delete("/remove/:productId", removeFromWishlist);

router.post("/remove", removeFromWishlist);

/**
 * @swagger
 * /wishlist/toggle:
 *   post:
 *     summary: Toggle product in wishlist (Adds if missing, Removes if already in wishlist)
 *     tags: [Customer - Wishlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId]
 *             properties:
 *               productId:
 *                 type: string
 *                 example: "64f1a2b3c4d5e6f7a8b9c0d1"
 *     responses:
 *       200:
 *         description: Product wishlist status toggled successfully
 */
router.post("/toggle", toggleWishlist);

/**
 * @swagger
 * /wishlist/clear:
 *   delete:
 *     summary: Clear all products from customer wishlist
 *     tags: [Customer - Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist cleared successfully
 */
router.delete("/clear", clearWishlist);

module.exports = router;
