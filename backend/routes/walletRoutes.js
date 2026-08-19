const express = require("express");
const { getWalletBalance, topUpWallet, verifyTopUp } = require("../controllers/walletController");
const { verifyCustomerToken } = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Wallet
 *   description: Customer Wallet Management
 */

/**
 * @swagger
 * /wallet/balance:
 *   get:
 *     summary: Get Wallet Balance and history
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/balance", verifyCustomerToken, getWalletBalance);

/**
 * @swagger
 * /wallet/topup:
 *   post:
 *     summary: Initialize wallet top-up via Razorpay
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Top-up initialized
 */
router.post("/topup", verifyCustomerToken, topUpWallet);

/**
 * @swagger
 * /wallet/verify-topup:
 *   post:
 *     summary: Verify wallet top-up Razorpay payment
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               razorpay_order_id:
 *                 type: string
 *               razorpay_payment_id:
 *                 type: string
 *               razorpay_signature:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Top-up verified and amount added
 */
router.post("/verify-topup", verifyCustomerToken, verifyTopUp);

module.exports = router;
