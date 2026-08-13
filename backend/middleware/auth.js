const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Staff = require("../models/Staff");

const verifyAdminToken = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden. Admin access required.",
      });
    }

    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin user not found.",
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

const optionalCustomerAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      if (decoded.role === "customer") {
        req.customerId = decoded.id;
      }
    }
    next();
  } catch (error) {
    console.error("Optional Customer Auth Error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired session token.",
    });
  }
};

const resolveCartSession = (req, res, next) => {
  const customerId = req.customerId;
  const guestId = req.body?.guestId || req.query?.guestId || req.headers["x-guest-id"];

  if (!customerId && !guestId) {
    return res.status(400).json({
      success: false,
      message: "Authorization token or guestId session identifier is required",
    });
  }

  req.cartSession = {
    customerId,
    guestId: (guestId && typeof guestId === "string") ? guestId.trim() : null,
  };
  next();
};

const verifyCustomerToken = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (decoded.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Forbidden. Customer access required.",
      });
    }

    req.customerId = decoded.id;
    next();
  } catch (error) {
    console.error("Customer Auth Middleware Error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired session token.",
    });
  }
};

const verifyStaffToken = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (decoded.role === "customer") {
      return res.status(403).json({
        success: false,
        message: "Forbidden. Administrative access required.",
      });
    }

    let user;
    if (decoded.role === "admin") {
      user = await Admin.findById(decoded.id);
    } else {
      user = await Staff.findById(decoded.id);
      if (user && !user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Forbidden. Account is deactivated.",
        });
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User session not found.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Staff Auth Middleware Error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired session token.",
    });
  }
};

module.exports = {
  verifyAdminToken,
  optionalCustomerAuth,
  resolveCartSession,
  verifyCustomerToken,
  verifyStaffToken
};

