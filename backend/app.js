require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const morgan = require("morgan");
const logger = require("./utils/logger");
const { connectDB } = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const subCategoryRoutes = require("./routes/subCategoryRoutes");
const productRoutes = require("./routes/productRoutes");
const bannerRoutes = require("./routes/bannerRoutes");
const cartRoutes = require("./routes/cartRoutes");
const addressRoutes = require("./routes/addressRoutes");
const orderRoutes = require("./routes/orderRoutes");
const couponRoutes = require("./routes/couponRoutes");
const walletRoutes = require("./routes/walletRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const policyRoutes = require("./routes/policyRoutes");
const faqRoutes = require("./routes/faqRoutes");
const locationRoutes = require("./routes/locationRoutes");
const ticketRoutes = require("./routes/ticketRoutes");

const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();

// Connect MongoDB Database
connectDB();

// ─── HTTP Request Logger (Morgan → Winston) ─────────────────────────────────
const morganFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
    // Skip logging health check endpoint to reduce noise
    skip: (req) => req.originalUrl === "/api/health",
  })
);

// ─── Security Middlewares ───────────────────────────────────────────────────
// 1. Helmet: Secure HTTP headers
app.use(helmet());

// 2. Cookie Parser
app.use(cookieParser());

// 3. CORS configuration
app.use(
  cors({
    origin: true, // Dynamically allows origin
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie", "x-guest-id", "guestId"],
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

// 7. NoSQL Injection Sanitization — strips $ and . from req.body, req.params, req.query
app.use(mongoSanitize());

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/sub-categories", subCategoryRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/banners", bannerRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/addresses", addressRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/coupons", couponRoutes);
app.use("/api/v1/wallet", walletRoutes);
app.use("/api/v1/wishlist", wishlistRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/policies", policyRoutes);
app.use("/api/v1/faqs", faqRoutes);
app.use("/api/v1/location", locationRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/tickets", ticketRoutes);

// ─── Swagger Setup ──────────────────────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Grocery App API Documentation",
      version: "1.0.0",
      description: "Interactive API Documentation for Grocery App",
    },
    servers: [
      {
        url: "https://grocery-app-x6gf.onrender.com/api/v1",
        description: "Production Server (Render)",
      },
      {
        url: "http://localhost:5000/api/v1",
        description: "Localhost Server",
      },
    ],
    tags: [
      { name: "Customer Authentication", description: "APIs for Customer OTP login & authentication" },
      { name: "Customer Profile", description: "APIs for Customer profile management" },
      { name: "Customer - Location & Serviceability", description: "10-Minute Quick Commerce delivery area & location serviceability endpoints" },
      { name: "Customer - Banners", description: "Public promotional banner endpoints for Customer App / Storefront" },
      { name: "Customer - Categories", description: "Public category endpoints for Customer App / Storefront" },
      { name: "Customer - Sub-Categories", description: "Public sub-category endpoints for Customer App / Storefront" },
      { name: "Customer - Products", description: "Public product listing, search, and details endpoints for Customer App" },
      { name: "Customer - Wishlist", description: "Customer Wishlist management endpoints" },
      { name: "Customer - Cart", description: "Shopping cart management endpoints (Works for both Guests and Logged-in Customers)" },
      { name: "Customer - Address", description: "Customer delivery address management endpoints (Requires Login)" },
      { name: "Customer - Coupons & Offers", description: "Customer discount coupons and promotional offers endpoints" },
      { name: "Customer - Checkout & Orders", description: "Customer checkout, payment verification, order tracking, cancellation, and return endpoints" },
      { name: "Customer - Wallet", description: "Customer In-App Wallet balance, top-up, and transaction history endpoints" },
      { name: "Customer - FAQs & Support", description: "Frequently Asked Questions & Customer Support Helpdesk endpoints" },
      { name: "Customer - Policies & Legal", description: "Public legal policies, terms, and privacy policy endpoints" },
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
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Force redirect to ensure trailing slash is present (needed for relative assets in Swagger UI)
app.use("/api-docs", (req, res, next) => {
  if (req.originalUrl === "/api-docs") {
    return res.redirect("/api-docs/");
  }
  next();
});

// Serve Swagger UI with relaxed Content Security Policy specifically for this route
app.use(
  "/api-docs",
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "'unsafe-inline'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "validator.swagger.io"],
      },
    },
  }),
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

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
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON payload format. Please check your JSON syntax (remove comments/trailing commas).",
    });
  }

  logger.error(`Unhandled Error: ${err.message}`, {
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });

  res.status(500).json({
    success: false,
    message: "Something went wrong on the server.",
  });
});

// ─── Scheduled Task: Clean up pending online orders and release stock ────────
const { startPendingOrderCleanup } = require("./utils/orderCleanupHelper");
startPendingOrderCleanup();

module.exports = app;
