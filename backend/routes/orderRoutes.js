const express = require("express");
const {
  checkout,
  getOrders,
  getOrderById,
  verifyPayment,
  handleRazorpayWebhook,
} = require("../controllers/orderController");
const { verifyCustomerToken } = require("../middleware/auth");

const router = express.Router();

// Razorpay Webhook (must bypass customer authentication)
router.post("/razorpay-webhook", handleRazorpayWebhook);

// Apply strict customer token verification for all other order/checkout endpoints
router.use(verifyCustomerToken);

router.post("/checkout", checkout);
router.post("/verify-payment", verifyPayment);
router.get("/view-orders", getOrders);
router.get("/single-order/:id", getOrderById);

module.exports = router;
