const winston = require("winston");
const path = require("path");
const fs = require("fs");

// ── Ensure logs directory exists ───────────────────────────────
const logsDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ── Custom log format ──────────────────────────────────────────
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` | ${JSON.stringify(meta)}`;
    }
    if (stack) {
      log += `\n${stack}`;
    }
    return log;
  })
);

// ── Console format (colored for dev) ──────────────────────────
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    let log = `[${timestamp}] ${level}: ${message}`;
    if (stack) log += `\n${stack}`;
    return log;
  })
);

// ── Winston Logger ─────────────────────────────────────────────
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  transports: [
    // Console — always on
    new winston.transports.Console({
      format: consoleFormat,
    }),

    // error.log — only errors
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      format: logFormat,
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
    }),

    // combined.log — everything
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      format: logFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
  ],

  // Catch unhandled exceptions + rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, "exceptions.log"),
      format: logFormat,
    }),
    new winston.transports.Console({ format: consoleFormat }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, "exceptions.log"),
      format: logFormat,
    }),
  ],
});

module.exports = logger;
