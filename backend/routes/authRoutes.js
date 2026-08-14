const express = require("express");
const { adminRegister, login, refreshAccessToken, logout, getMe } = require("../controllers/adminController");
const { sendOTP, verifyOTP } = require("../controllers/customerController");
const { verifyAdminToken, verifyStaffToken } = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication APIs for Admins, Staff, and Customers
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Admin registration
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, mobile, password]
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               mobile:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Admin registered successfully
 *       400:
 *         description: All fields are required
 *       409:
 *         description: Email or mobile already registered
 */
// POST /api/auth/register (Admin registration)
router.post("/register", adminRegister);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Unified login for Admin, Sub Admin, Agent, Warehouse Manager, Accountant
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
// POST /api/auth/login (Unified login for Admin, Sub Admin, Agent, Warehouse Manager, Accountant)
router.post("/login", login);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Get new access token using refresh token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 */
// POST /api/auth/refresh-token (Get new access token using refresh token)
router.post("/refresh-token", refreshAccessToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Session logout / invalidate refresh token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout successful
 */
// POST /api/auth/logout (Session logout / invalidate refresh token)
router.post("/logout", logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Check active user session profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns user profile
 */
// GET /api/auth/me (Check active user session profile)
router.get("/me", verifyStaffToken, getMe);

/**
 * @swagger
 * /auth/customer/send-otp:
 *   post:
 *     summary: Send OTP for customer registration / login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mobile:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
// POST /api/auth/customer/send-otp (Send OTP for registration / login)
router.post("/customer/send-otp", sendOTP);

/**
 * @swagger
 * /auth/customer/verify-otp:
 *   post:
 *     summary: Verify OTP and register/login customer
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mobile:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Customer authenticated successfully
 */
// POST /api/auth/customer/verify-otp (Verify OTP and register/login customer)
router.post("/customer/verify-otp", verifyOTP);

module.exports = router;
