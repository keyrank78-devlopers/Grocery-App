const express = require("express");
const {
  checkout,
  getOrders,
  getOrderById,
  verifyPayment,
  handleRazorpayWebhook,
  requestReturn,
} = require("../controllers/orderController");
const { verifyCustomerToken } = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Order
 *   description: Order management and checkout
 */

/**
 * @swagger
 * /orders/razorpay-webhook:
 *   post:
 *     summary: Razorpay Webhook
 *     tags: [Order]
 *     responses:
 *       200:
 *         description: Webhook received successfully
 */
router.post("/razorpay-webhook", handleRazorpayWebhook);

/**
 * @swagger
 * /orders/{id}/request-return:
 *   put:
 *     summary: Request return for a delivered order
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Return requested
 */
router.put("/:id/request-return", verifyCustomerToken, requestReturn);

// Apply strict customer token verification for all other order/checkout endpoints
router.use(verifyCustomerToken);

/**
 * @swagger
 * /orders/checkout:
 *   post:
 *     summary: Checkout and create order
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order created successfully
 */
router.post("/checkout", checkout);

/**
 * @swagger
 * /orders/verify-payment:
 *   post:
 *     summary: Verify Razorpay payment
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment verified successfully
 */
router.post("/verify-payment", verifyPayment);

/**
 * @swagger
 * /orders/view-orders:
 *   get:
 *     summary: View customer orders
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 */
router.get("/view-orders", getOrders);

/**
 * @swagger
 * /orders/single-order/{id}:
 *   get:
 *     summary: Get single order details
 *     tags: [Order]
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
 *         description: Order retrieved successfully
 */
router.get("/single-order/:id", getOrderById);

module.exports = router;
