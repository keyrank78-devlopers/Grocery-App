const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Staff = require("../models/Staff");
const generateTokens = require("../utils/generateTokens");
const generateCustomId = require("../utils/generateCustomId");

// ───────────────────────────────────────────────────────────────
// Admin Register
// POST /api/auth/register
// ───────────────────────────────────────────────────────────────
const adminRegister = async (req, res) => {
  try {
    const { fullName, email, mobile, password } = req.body;

    if (!fullName || !email || !mobile || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedMobile = mobile.trim();

    const existingAdmin = await Admin.findOne({
      $or: [{ email: normalizedEmail }, { mobile: normalizedMobile }],
    }).lean();

    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message:
          existingAdmin.email === normalizedEmail
            ? "Email already registered"
            : "Mobile number already registered",
      });
    }

    const admin_id = await generateCustomId("Admin", "ADM");

    const admin = await Admin.create({
      admin_id,
      fullName: fullName.trim(),
      email: normalizedEmail,
      mobile: normalizedMobile,
      password,
    });

    return res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      data: {
        admin_id: admin.admin_id,
        fullName: admin.fullName,
        email: admin.email,
        mobile: admin.mobile,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    console.error("Admin Register Error:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `${field} already registered`,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Unified Login
// POST /api/auth/login
// ───────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    let user = await Admin.findOne({ email: normalizedEmail }).select(
      "_id admin_id fullName email mobile password refreshToken",
    );

    let role = "admin";
    let isStaff = false;

    if (!user) {
      user = await Staff.findOne({ email: normalizedEmail }).select(
        "_id staff_id name email phone password role address isActive refreshToken",
      );

      if (user) {
        role = user.role;
        isStaff = true;
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (isStaff && !user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is deactivated. Please contact admin.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const { accessToken, refreshToken } = generateTokens(user._id, role);

    if (isStaff) {
      await Staff.findByIdAndUpdate(user._id, { refreshToken });
    } else {
      await Admin.findByIdAndUpdate(user._id, { refreshToken });
    }

    const userData = {
      id: isStaff ? user.staff_id : user.admin_id,
      name: isStaff ? user.name : user.fullName,
      email: user.email,
      mobile: isStaff ? user.phone : user.mobile,
      role,
    };

    if (isStaff && user.address) {
      userData.address = user.address;
    }

    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 15 * 60 * 1000, // 15 mins
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: userData,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Refresh Access Token
// POST /api/auth/refresh-token
// ───────────────────────────────────────────────────────────────
const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    const { id, role } = decoded;

    let user;
    if (role === "admin") {
      user = await Admin.findById(id).select("refreshToken");
    } else {
      user = await Staff.findById(id).select("refreshToken isActive");

      if (user && !user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Your account is deactivated. Please contact admin.",
        });
      }
    }

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token mismatch or user not found",
      });
    }

    // Refresh token rotation — issue new pair
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(id, role);

    if (role === "admin") {
      await Admin.findByIdAndUpdate(id, { refreshToken: newRefreshToken });
    } else {
      await Staff.findByIdAndUpdate(id, { refreshToken: newRefreshToken });
    }

    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error("Refresh Token Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Logout
// POST /api/auth/logout
// ───────────────────────────────────────────────────────────────
const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (refreshToken) {
      // Clear refresh token in database for admin or staff
      await Admin.updateOne({ refreshToken }, { $set: { refreshToken: null } });
      await Staff.updateOne({ refreshToken }, { $set: { refreshToken: null } });
    }

    // Also support clearing if they send Bearer Access Token
    let authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (decoded.role === "admin") {
          await Admin.findByIdAndUpdate(decoded.id, { $set: { refreshToken: null } });
        } else if (decoded.role && decoded.role !== "customer") {
          await Staff.findByIdAndUpdate(decoded.id, { $set: { refreshToken: null } });
        }
      } catch (err) {
        // Access token might be expired, which is fine for logout
      }
    }

    res.clearCookie("token");
    res.clearCookie("refreshToken");

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Get Current Authenticated Administrator Profile
// GET /api/auth/me
// ───────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = req.user; // Populated by verifyStaffToken middleware
    const role = user.role || "admin";
    
    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: role === "admin" ? user.admin_id : user.staff_id,
          name: role === "admin" ? user.fullName : user.name,
          email: user.email,
          mobile: role === "admin" ? user.mobile : user.phone,
          role: role,
        },
      },
    });
  } catch (error) {
    console.error("Get Me Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  adminRegister,
  login,
  refreshAccessToken,
  logout,
  getMe,
};
