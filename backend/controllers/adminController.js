const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Staff = require("../models/Staff");
const Customer = require("../models/Customer");
const Notification = require("../models/Notification");
const generateTokens = require("../utils/generateTokens");
const generateCustomId = require("../utils/generateCustomId");
const { sendMulticastNotification } = require("../utils/notificationHelper");

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
        "_id staff_id name email phone password role address isActive refreshToken assignedWarehouse"
      ).populate("assignedWarehouse", "name warehouse_id");

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
    if (isStaff && user.assignedWarehouse) {
      userData.assignedWarehouse = user.assignedWarehouse;
    }

    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 15 * 60 * 1000, // 15 mins
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
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
    const refreshToken = req.body?.refreshToken || req.cookies?.refreshToken;

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
    } else if (role === "customer") {
      user = await Customer.findById(id).select("refreshToken isActive");

      if (user && !user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Your account is deactivated. Please contact support.",
        });
      }
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
    } else if (role === "customer") {
      await Customer.findByIdAndUpdate(id, { refreshToken: newRefreshToken });
    } else {
      await Staff.findByIdAndUpdate(id, { refreshToken: newRefreshToken });
    }

    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
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
    const refreshToken = req.body?.refreshToken || req.cookies?.refreshToken;

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

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

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
    const isStaff = role !== "admin";

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: role === "admin" ? user.admin_id : user.staff_id,
          name: role === "admin" ? user.fullName : user.name,
          email: user.email,
          mobile: role === "admin" ? user.mobile : user.phone,
          role: role,
          avatarUrl: role === "admin" ? user.avatarUrl : undefined,
          assignedWarehouse: isStaff && user.assignedWarehouse ? user.assignedWarehouse : undefined,
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

const updateMe = async (req, res) => {
  try {
    const admin = req.admin; // Populated by verifyAdminToken middleware
    const { name, email, mobile } = req.body;

    if (name) admin.fullName = name.trim();
    if (mobile) admin.mobile = mobile.trim();

    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== admin.email) {
        const existing = await Admin.findOne({ email: normalizedEmail }).lean();
        if (existing) {
          return res.status(409).json({
            success: false,
            message: "Email already in use",
          });
        }
        admin.email = normalizedEmail;
      }
    }

    await admin.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          id: admin.admin_id,
          name: admin.fullName,
          email: admin.email,
          mobile: admin.mobile,
          role: "admin",
          avatarUrl: admin.avatarUrl || "",
        },
      },
    });
  } catch (error) {
    console.error("Update Admin Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    const admin = req.admin; // Populated by verifyAdminToken middleware
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }

    // Delete old avatar from Cloudinary if it exists
    if (admin.avatarPublicId) {
      const { deleteFromCloudinary } = require("../config/cloudinary");
      await deleteFromCloudinary(admin.avatarPublicId).catch(() => { });
    }

    admin.avatarUrl = req.file.path;
    admin.avatarPublicId = req.file.filename;
    await admin.save();

    return res.status(200).json({
      success: true,
      message: "Profile image uploaded successfully",
      data: {
        user: {
          id: admin.admin_id,
          name: admin.fullName,
          email: admin.email,
          mobile: admin.mobile,
          role: "admin",
          avatarUrl: admin.avatarUrl,
        },
      },
    });
  } catch (error) {
    console.error("Upload Avatar Error:", error);
    // Clean up Cloudinary file if upload fails
    if (req.file?.filename) {
      const { deleteFromCloudinary } = require("../config/cloudinary");
      await deleteFromCloudinary(req.file.filename).catch(() => { });
    }
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ───────────────────────────────────────────────────────────────
// Broadcast Promotional Notification
// POST /api/v1/admin/notifications/broadcast
// ───────────────────────────────────────────────────────────────
const broadcastNotification = async (req, res) => {
  try {
    const { title, body } = req.body;
    let imageUrl = req.body.imageUrl || null;

    if (!title || !body) {
      // Clean up Cloudinary file if validation fails
      if (req.file?.filename) {
        const { deleteFromCloudinary } = require("../config/cloudinary");
        await deleteFromCloudinary(req.file.filename).catch(() => { });
      }
      return res.status(400).json({ success: false, message: "Title and body are required for broadcast" });
    }

    // If an image file was uploaded, use its Cloudinary URL
    if (req.file && req.file.path) {
      imageUrl = req.file.path;
    }

    // Find all customers who have an fcmToken
    const customers = await Customer.find({ fcmToken: { $ne: null } }, "fcmToken");
    const tokens = customers.map(c => c.fcmToken).filter(t => t);

    // Save notification to DB for history
    const newNotification = new Notification({
      title,
      body,
      imageUrl,
      isGlobal: true, // It's a broadcast
    });
    await newNotification.save();

    if (tokens.length === 0) {
      // Notification is saved, but no mobile apps to ping
      return res.status(200).json({ success: true, message: "Notification saved to history. No mobile apps found to receive push.", data: { successCount: 0, failureCount: 0 } });
    }

    // Firebase sendEachForMulticast can take max 500 tokens per call.
    // If we have more than 500, we need to batch them.
    const batchSize = 500;
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < tokens.length; i += batchSize) {
      const batchTokens = tokens.slice(i, i + batchSize);
      const response = await sendMulticastNotification(batchTokens, title, body, imageUrl);
      successCount += response.successCount || 0;
      failureCount += response.failureCount || 0;
    }

    return res.status(200).json({
      success: true,
      message: `Notification broadcast completed. Sent to ${successCount} users.`,
      stats: {
        totalTargeted: tokens.length,
        successCount,
        failureCount
      }
    });

  } catch (error) {
    console.error("Broadcast Notification Error:", error);
    return res.status(500).json({ success: false, message: "Failed to send broadcast notification" });
  }
};

// ───────────────────────────────────────────────────────────────
// Get all notifications (history for admin) with pagination
// GET /api/v1/admin/notifications?page=1&limit=10&search=sale
// ───────────────────────────────────────────────────────────────
const getNotificationHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: "i" } },
        { body: { $regex: req.query.search, $options: "i" } }
      ];
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await Notification.countDocuments(query);

    return res.status(200).json({ 
      success: true, 
      data: notifications,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    console.error("Get Notification History Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ───────────────────────────────────────────────────────────────
// Delete a notification
// DELETE /api/v1/admin/notifications/:id
// ───────────────────────────────────────────────────────────────
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    // Optional: Delete image from Cloudinary if it exists and was uploaded to our bucket
    if (notification.imageUrl && notification.imageUrl.includes("res.cloudinary.com")) {
      const publicId = notification.imageUrl.split("/").pop().split(".")[0];
      const { deleteFromCloudinary } = require("../config/cloudinary");
      await deleteFromCloudinary(`notifications/${publicId}`).catch(() => {});
    }

    return res.status(200).json({ success: true, message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Delete Notification Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  adminRegister,
  login,
  refreshAccessToken,
  logout,
  getMe,
  updateMe,
  uploadAvatar,
  broadcastNotification,
  getNotificationHistory,
  deleteNotification
};
