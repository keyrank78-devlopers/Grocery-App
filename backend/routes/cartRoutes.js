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

// Apply optionalCustomerAuth and resolveCartSession to validate session identification (customer token or guestId)
/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Cart management APIs
 */

/**
 * @swagger
 * /cart/add:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Item added successfully
 */
router.post("/add", optionalCustomerAuth, resolveCartSession, addToCart);

/**
 * @swagger
 * /cart/increase:
 *   post:
 *     summary: Increase item quantity in cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Quantity increased
 */
router.post("/increase", optionalCustomerAuth, resolveCartSession, increaseQuantity);

/**
 * @swagger
 * /cart/decrease:
 *   post:
 *     summary: Decrease item quantity in cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Quantity decreased
 */
router.post("/decrease", optionalCustomerAuth, resolveCartSession, decreaseQuantity);

/**
 * @swagger
 * /cart/remove:
 *   post:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Item removed successfully
 */
router.post("/remove", optionalCustomerAuth, resolveCartSession, removeFromCart);

/**
 * @swagger
 * /cart/view-cart:
 *   get:
 *     summary: View cart contents
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart details retrieved
 */
router.get("/view-cart", optionalCustomerAuth, resolveCartSession, getCart);

/**
 * @swagger
 * /cart/merge:
 *   post:
 *     summary: Merge guest cart with user cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart merged successfully
 */
router.post("/merge", optionalCustomerAuth, resolveCartSession, mergeCart);

module.exports = router;
