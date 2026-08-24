const express = require("express");
const { getWalletBalance, topUpWallet, verifyTopUp } = require("../controllers/walletController");
const { verifyCustomerToken } = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Customer - Wallet
 *     description: Customer In-App Wallet balance, top-up, and transaction history endpoints
 */

// Apply strict customer authentication to all wallet endpoints
router.use(verifyCustomerToken);

/**
 * @swagger
 * /wallet/balance:
 *   get:
 *     summary: View customer wallet balance & transaction history (Paginated & Filterable)
 *     tags: [Customer - Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search transactions by description or transaction ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [Credit, Debit]
 *         description: Filter transactions by type (Credit or Debit)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for transaction history pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of transactions per page (max 50)
 *     responses:
 *       200:
 *         description: Wallet balance and transaction history retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/balance", getWalletBalance);

/**
 * @swagger
 * /wallet/topup:
 *   post:
 *     summary: Initialize Razorpay payment gateway order for Wallet top-up
 *     tags: [Customer - Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Top-up amount in Rupees (Minimum ₹10)
 *                 example: 500
 *     responses:
 *       200:
 *         description: Top-up order initialized with Razorpay order details
 *       400:
 *         description: Minimum top-up amount constraint violated
 *       401:
 *         description: Unauthorized
 */
router.post("/topup", topUpWallet);

/**
 * @swagger
 * /wallet/verify-topup:
 *   post:
 *     summary: Verify Razorpay top-up payment signature and credit money to wallet
 *     tags: [Customer - Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [razorpay_order_id, razorpay_payment_id, razorpay_signature, amount]
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
 *               amount:
 *                 type: number
 *                 example: 500
 *     responses:
 *       200:
 *         description: Wallet topped up successfully and transaction credited
 *       400:
 *         description: Payment verification failed or already processed
 *       401:
 *         description: Unauthorized
 */
router.post("/verify-topup", verifyTopUp);

module.exports = router;
