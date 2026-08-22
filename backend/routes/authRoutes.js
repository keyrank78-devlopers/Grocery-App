const express = require("express");
const { adminRegister, login, refreshAccessToken, logout, getMe, updateMe, uploadAvatar } = require("../controllers/adminController");
const { sendOTP, verifyOTP, getCustomerProfile, updateCustomerProfile } = require("../controllers/customerController");
const { verifyAdminToken, verifyStaffToken, verifyCustomerToken } = require("../middleware/auth");
const { uploadAvatarImage } = require("../config/cloudinary");

const router = express.Router();



/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Admin registration
 *     tags: [Admin Authentication]
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
 *     tags: [Admin Authentication, Staff Management & Authentication]
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
 *     tags: [Common Authentication]
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
 *     tags: [Common Authentication]
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
 *     tags: [Staff Management & Authentication]
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
 * /auth/profile:
 *   put:
 *     summary: Update admin profile
 *     tags: [Staff Management & Authentication]
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
 *               email:
 *                 type: string
 *               mobile:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
// PUT /api/auth/profile (Update admin profile)
router.put("/profile", verifyAdminToken, updateMe);

/**
 * @swagger
 * /auth/profile/avatar:
 *   post:
 *     summary: Upload admin profile avatar image
 *     tags: [Staff Management & Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar image uploaded successfully
 */
// POST /api/auth/profile/avatar (Upload admin profile picture)
router.post("/profile/avatar", verifyAdminToken, uploadAvatarImage, uploadAvatar);

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
 *     tags: [Customer Authentication]
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

/**
 * @swagger
 * /auth/customer/me:
 *   get:
 *     summary: Get customer profile
 *     tags: [Customer Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns customer profile
 *       401:
 *         description: Unauthorized
 */
// GET /api/auth/customer/me (Get customer profile)
router.get("/customer/me", verifyCustomerToken, getCustomerProfile);

/**
 * @swagger
 * /auth/customer/profile:
 *   put:
 *     summary: Update customer profile
 *     tags: [Customer Authentication]
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
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 */
// PUT /api/auth/customer/profile (Update customer profile)
router.put("/customer/profile", verifyCustomerToken, updateCustomerProfile);

module.exports = router;
