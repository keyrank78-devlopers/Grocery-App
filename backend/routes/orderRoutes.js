const express = require("express");
const {
  checkout,
  getOrders,
  getOrderById,
  verifyPayment,
  handleRazorpayWebhook,
  requestReturn,
  cancelOrder,
} = require("../controllers/orderController");
const { verifyCustomerToken } = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Customer - Checkout & Orders
 *     description: Customer checkout, payment verification, order tracking, cancellation, and return endpoints
 */

// Webhook endpoint (Called by Razorpay server - No Customer Auth Required)
router.post("/razorpay-webhook", handleRazorpayWebhook);

// Apply strict customer token verification for all customer order endpoints
router.use(verifyCustomerToken);

/**
 * @swagger
 * /orders/checkout:
 *   post:
 *     summary: Checkout & Place Order (Supports COD, Online Razorpay, and In-App Wallet)
 *     tags: [Customer - Checkout & Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [addressId, paymentMethod]
 *             properties:
 *               addressId:
 *                 type: string
 *                 description: Saved delivery address MongoDB ObjectId
 *                 example: "64f1a2b3c4d5e6f7a8b9c0d1"
 *               paymentMethod:
 *                 type: string
 *                 enum: [COD, Online, Wallet]
 *                 example: "Online"
 *               couponCode:
 *                 type: string
 *                 description: (Optional) Coupon code to apply
 *                 example: "WELCOME50"
 *     responses:
 *       200:
 *         description: Order placed successfully (returns razorpay_order_id if paymentMethod is Online)
 *       400:
 *         description: Cart is empty or insufficient wallet balance / stock
 */
router.post("/checkout", checkout);

/**
 * @swagger
 * /orders/verify-payment:
 *   post:
 *     summary: Verify Razorpay online payment signature
 *     tags: [Customer - Checkout & Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [razorpay_order_id, razorpay_payment_id, razorpay_signature]
 *             properties:
 *               razorpay_order_id:
 *                 type: string
 *                 example: "order_Kxyz12345"
 *               razorpay_payment_id:
 *                 type: string
 *                 example: "pay_Kabc67890"
 *               razorpay_signature:
 *                 type: string
 *                 example: "a8fbc123456789..."
 *     responses:
 *       200:
 *         description: Payment verified successfully and order status updated to Placed
 *       400:
 *         description: Payment verification failed / signature mismatch
 */
router.post("/verify-payment", verifyPayment);

/**
 * @swagger
 * /orders/view-orders:
 *   get:
 *     summary: View customer's order history (Paginated & Filterable)
 *     tags: [Customer - Checkout & Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search orders by Order ID (e.g. ORD-000001), Product Name, or Status
 *       - in: query
 *         name: orderStatus
 *         schema:
 *           type: string
 *           enum: [Pending, Placed, Accepted, Processing, Out for Delivery, Delivered, Cancelled, Return Requested, Returned, Refunded]
 *         description: Filter by specific order status
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
 *         description: Number of orders per page (max 50)
 *     responses:
 *       200:
 *         description: List of customer orders retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/view-orders", getOrders);

/**
 * @swagger
 * /orders/single-order/{id}:
 *   get:
 *     summary: Get single order details & tracking status history
 *     tags: [Customer - Checkout & Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order MongoDB ObjectId or order_id (e.g. ORD-000001)
 *     responses:
 *       200:
 *         description: Order details retrieved
 *       404:
 *         description: Order not found
 */
router.get("/single-order/:id", getOrderById);

/**
 * @swagger
 * /orders/{id}/cancel:
 *   put:
 *     summary: Cancel order before delivery (Instant refund to wallet if paid)
 *     tags: [Customer - Checkout & Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order MongoDB ObjectId or order_id (e.g. ORD-000001)
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Changed my mind"
 *     responses:
 *       200:
 *         description: Order cancelled successfully (Refund credited to wallet if prepaid)
 *       400:
 *         description: Cannot cancel order after it is out for delivery
 */
router.put("/:id/cancel", cancelOrder);

/**
 * @swagger
 * /orders/{id}/request-return:
 *   put:
 *     summary: Request order item return (Within 5 days of delivery)
 *     tags: [Customer - Checkout & Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order MongoDB ObjectId or order_id (e.g. ORD-000001)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Damaged item received"
 *               comments:
 *                 type: string
 *                 example: "Outer box was crushed"
 *     responses:
 *       200:
 *         description: Return request submitted successfully
 *       400:
 *         description: Cannot return order or 5-day window expired
 */
router.put("/:id/request-return", requestReturn);

module.exports = router;
