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
const walletRoutes = require("./routes/walletRoutes");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

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
    origin: [
      "http://localhost:5173",
      "https://grocery-app-three-kappa.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);

// 3. Rate Limiter: General limiter for all requests (100 requests per 1 minute per IP)
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
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
app.use("/api/v1/wallet", walletRoutes);

// ─── Swagger Documentation ──────────────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Admin & Staff API Documentation",
      version: "1.0.0",
      description: "API documentation for the Admin and Staff application features",
    },
    servers: [
      {
        url: "https://grocery-app-x6gf.onrender.com/api/v1",
        description: "Development server",
      },
    ],
    tags: [
      { name: "Admin Authentication", description: "APIs for Admin registration and login" },
      { name: "Staff Management & Authentication", description: "APIs for Staff registration (creation) and login" },
      { name: "Customer Authentication", description: "APIs for Customer registration, login and profile update" },
      { name: "Common Authentication", description: "APIs shared between roles, like refresh token and logout" }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js"], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Generate Customer Specific Swagger Spec
const customerSwaggerSpec = JSON.parse(JSON.stringify(swaggerSpec));
customerSwaggerSpec.info = {
  title: "Customer API Documentation",
  version: "1.0.0",
  description: "API documentation for Customer mobile / web application features",
};
customerSwaggerSpec.tags = [
  { name: "Customer Authentication", description: "APIs for Customer OTP login and profile" },
  { name: "Common Authentication", description: "APIs shared between roles, like refresh token" },
  { name: "Admin - Category", description: "APIs for viewing categories" },
  { name: "Admin - Sub-Category", description: "APIs for viewing subcategories" },
  { name: "Admin - Product", description: "APIs for viewing products" },
  { name: "Admin - Banner", description: "APIs for viewing banners" }
];

// Limit to only the paths requested by the user for Customer docs
const customerPaths = [
  "/auth/customer/send-otp",
  "/auth/customer/verify-otp",
  "/auth/customer/me",
  "/auth/customer/profile",
  "/auth/refresh-token",
  "/admin/get-categories",
  "/admin/get-sub-categories",
  "/admin/get-products",
  "/admin/single-products/{id}",
  "/admin/get-banners",
  "/admin/single-banners/{id}"
];

customerSwaggerSpec.paths = {};
for (const path of customerPaths) {
  if (swaggerSpec.paths[path]) {
    customerSwaggerSpec.paths[path] = swaggerSpec.paths[path];
  }
}

// Serve separate documentation endpoints
app.use("/api-docs/admin", swaggerUi.serveFiles(swaggerSpec), swaggerUi.setup(swaggerSpec));
app.use("/api-docs/customer", swaggerUi.serveFiles(customerSwaggerSpec), swaggerUi.setup(customerSwaggerSpec));
app.use("/api-docs", swaggerUi.serveFiles(swaggerSpec), swaggerUi.setup(swaggerSpec));

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
