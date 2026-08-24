const express = require("express");
const { adminRegister, login, refreshAccessToken, logout, getMe, updateMe, uploadAvatar } = require("../controllers/adminController");
const { sendOTP, verifyOTP, getCustomerProfile, updateCustomerProfile, customerLogout } = require("../controllers/customerController");
const { verifyAdminToken, verifyStaffToken, verifyCustomerToken } = require("../middleware/auth");
const { uploadAvatarImage } = require("../config/cloudinary");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Customer Authentication
 *     description: APIs for Customer OTP login, authentication, and logout
 *   - name: Customer Profile
 *     description: APIs for Customer profile management
 */

// ─── Admin / Staff Auth Endpoints ─────────────────────────────────────────────
router.post("/register", adminRegister);
router.post("/login", login);
/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     description: Exchange a valid refresh token (provided via cookie or request body) for a new access token and rotated refresh token. Works for Customers, Admins, and Staff.
 *     tags: [Customer Authentication]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token (Optional if sent via httpOnly cookie)
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Token refreshed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     refreshToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Refresh token is required
 *       401:
 *         description: Invalid or expired refresh token
 *       403:
 *         description: Account is deactivated
 */
router.post("/refresh-token", refreshAccessToken);
router.post("/logout", logout);
router.get("/me", verifyStaffToken, getMe);
router.put("/profile", verifyAdminToken, updateMe);
router.post("/profile/avatar", verifyAdminToken, uploadAvatarImage, uploadAvatar);

// ─── Customer Auth & Profile Endpoints ────────────────────────────────────────

/**
 * @swagger
 * /auth/customer/send-otp:
 *   post:
 *     summary: Send OTP for customer registration / login
 *     tags: [Customer Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mobile]
 *             properties:
 *               mobile:
 *                 type: string
 *                 description: 10-digit mobile number
 *                 example: "9876543210"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Mobile number is required
 */
router.post("/customer/send-otp", sendOTP);

/**
 * @swagger
 * /auth/customer/verify-otp:
 *   post:
 *     summary: Verify OTP and login/register customer
 *     tags: [Customer Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mobile, otp]
 *             properties:
 *               mobile:
 *                 type: string
 *                 example: "9876543210"
 *               otp:
 *                 type: string
 *                 example: "482910"
 *               guestId:
 *                 type: string
 *                 description: (Optional) Guest session ID to automatically merge guest cart into customer account upon login
 *                 example: "guest_a1b2c3d4"
 *     responses:
 *       200:
 *         description: Login successful (returns accessToken, refreshToken, user profile)
 *       400:
 *         description: Invalid or expired OTP
 */
router.post("/customer/verify-otp", verifyOTP);

/**
 * @swagger
 * /auth/customer/logout:
 *   post:
 *     summary: Customer logout (Invalidates active refresh token session)
 *     tags: [Customer Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/customer/logout", verifyCustomerToken, customerLogout);

/**
 * @swagger
 * /auth/customer/me:
 *   get:
 *     summary: Get logged-in customer profile
 *     tags: [Customer Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer profile details retrieved successfully
 *       401:
 *         description: Unauthorized / Missing or expired token
 */
router.get("/customer/me", verifyCustomerToken, getCustomerProfile);

/**
 * @swagger
 * /auth/customer/profile:
 *   put:
 *     summary: Update customer profile details
 *     tags: [Customer Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Ravi Kumar"
 *               email:
 *                 type: string
 *                 example: "ravi@example.com"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put("/customer/profile", verifyCustomerToken, updateCustomerProfile);

module.exports = router;
