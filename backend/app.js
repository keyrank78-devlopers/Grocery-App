require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const { connectDB } = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const cartRoutes = require("./routes/cartRoutes");
const addressRoutes = require("./routes/addressRoutes");
const orderRoutes = require("./routes/orderRoutes");
const couponRoutes = require("./routes/couponRoutes");

const app = express();

// Connect MongoDB Database
connectDB();

// ─── Security Middlewares ───────────────────────────────────────────────────
// 1. Helmet: Secure HTTP headers
app.use(helmet());

// 2. Cookie Parser
app.use(cookieParser());

// 3. CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);

// 3. Rate Limiter: General limiter for all requests (100 requests per 1 minute per IP)
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after a minute.",
  },
});
app.use("/api", generalLimiter);

// 4. Auth & OTP Rate Limiter: Strict limit for sensitive auth endpoints (15 requests per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login/OTP attempts from this IP, please try again after 15 minutes.",
  },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/customer/send-otp", authLimiter);
app.use("/api/auth/customer/verify-otp", authLimiter);

// ─── Performance Middlewares ────────────────────────────────────────────────
// 5. Gzip Compression: Greatly reduces response payload sizes
app.use(compression());

// 6. Request Parsers (With body size limitation to prevent JSON flooding attacks)
app.use(express.json({ limit: "15kb" })); // Max 15kb payload
app.use(express.urlencoded({ extended: true, limit: "15kb" }));

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/addresses", addressRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/coupons", couponRoutes);

// ─── Health check ───────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is healthy and running ✅" });
});

// ─── 404 Route Not Found Handler ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "API Route Not Found" });
});

// ─── Global Error Handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  // Catch invalid JSON syntax errors (like comments or trailing commas in client request body)
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON payload format. Please check your JSON syntax (remove comments/trailing commas).",
    });
  }

  console.error("Global Error Handler:", err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong on the server.",
  });
});

// ─── Scheduled Task: Clean up pending online orders and release stock ────────
const { startPendingOrderCleanup } = require("./utils/orderCleanupHelper");
startPendingOrderCleanup();

module.exports = app;
