const express = require("express");
const {
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  getCart,
  mergeCart,
} = require("../controllers/cartController");
const { optionalCustomerAuth, resolveCartSession } = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Customer - Cart
 *     description: Shopping cart management endpoints (Works for both Guests and Logged-in Customers)
 */

/**
 * @swagger
 * /cart/view-cart:
 *   get:
 *     summary: View current cart items and calculated pricing summary breakdown
 *     tags: [Customer - Cart]
 *     security:
 *       - bearerAuth: []
 *     description: Accessible by both logged-in customers (Bearer Token) and guest users (auto-handled via session cookie/header). Includes subtotal, totalSavings, totalGst, and total quantity calculations.
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
 *         description: Number of cart items per page (max 50)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search within cart items by product name or SKU
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter cart items by Category MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Cart details retrieved successfully with full pricing breakdown
 *       400:
 *         description: Invalid session
 */
router.get("/view-cart", optionalCustomerAuth, resolveCartSession, getCart);

/**
 * @swagger
 * /cart/add:
 *   post:
 *     summary: Add product to cart (or update quantity)
 *     tags: [Customer - Cart]
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
 *               quantity:
 *                 type: integer
 *                 default: 1
 *                 example: 1
 *     responses:
 *       200:
 *         description: Product added to cart successfully
 *       400:
 *         description: Invalid input or insufficient stock
 */
router.post("/add", optionalCustomerAuth, resolveCartSession, addToCart);

/**
 * @swagger
 * /cart/increase:
 *   post:
 *     summary: Increase cart item quantity (+1)
 *     tags: [Customer - Cart]
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
 *         description: Cart item quantity increased
 */
router.post("/increase", optionalCustomerAuth, resolveCartSession, increaseQuantity);

/**
 * @swagger
 * /cart/decrease:
 *   post:
 *     summary: Decrease cart item quantity (-1)
 *     tags: [Customer - Cart]
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
 *         description: Cart item quantity decreased
 */
router.post("/decrease", optionalCustomerAuth, resolveCartSession, decreaseQuantity);

/**
 * @swagger
 * /cart/remove:
 *   post:
 *     summary: Remove item completely from cart
 *     tags: [Customer - Cart]
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
 *         description: Item removed from cart
 */
router.post("/remove", optionalCustomerAuth, resolveCartSession, removeFromCart);

/**
 * @swagger
 * /cart/merge:
 *   post:
 *     summary: Merge guest cart into customer account after login (guestId is Optional)
 *     tags: [Customer - Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               guestId:
 *                 type: string
 *                 description: (Optional) Guest session ID to merge from. If omitted or blank, backend automatically detects guestId from session cookies or headers.
 *                 example: "guest_a1b2c3d4"
 *     responses:
 *       200:
 *         description: Cart merged successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/merge", optionalCustomerAuth, resolveCartSession, mergeCart);

module.exports = router;
