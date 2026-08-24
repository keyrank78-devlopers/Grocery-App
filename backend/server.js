require("dotenv").config();
const http = require("http");
const app = require("./app");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
});

// ── Graceful Shutdown ──────────────────────────────────────────
const shutdown = (signal) => {
  logger.warn(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    logger.info("HTTP server closed. Exiting process.");
    process.exit(0);
  });

  // Force exit if not closed in 10 seconds
  setTimeout(() => {
    logger.error("Forced shutdown after timeout.");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
