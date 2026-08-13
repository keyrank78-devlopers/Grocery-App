const express = require("express");
const { adminRegister, login, refreshAccessToken, logout, getMe } = require("../controllers/adminController");
const { sendOTP, verifyOTP } = require("../controllers/customerController");
const { verifyAdminToken, verifyStaffToken } = require("../middleware/auth");

const router = express.Router();

// POST /api/auth/register (Admin registration)
router.post("/register", adminRegister);

// POST /api/auth/login (Unified login for Admin, Sub Admin, Agent, Warehouse Manager, Accountant)
router.post("/login", login);

// POST /api/auth/refresh-token (Get new access token using refresh token)
router.post("/refresh-token", refreshAccessToken);

// POST /api/auth/logout (Session logout / invalidate refresh token)
router.post("/logout", logout);

// GET /api/auth/me (Check active user session profile)
router.get("/me", verifyStaffToken, getMe);

// POST /api/auth/customer/send-otp (Send OTP for registration / login)
router.post("/customer/send-otp", sendOTP);

// POST /api/auth/customer/verify-otp (Verify OTP and register/login customer)
router.post("/customer/verify-otp", verifyOTP);

module.exports = router;
