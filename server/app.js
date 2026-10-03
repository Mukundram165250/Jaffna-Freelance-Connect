const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const env = require("./config/env");
const apiRouter = require("./routes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();
const rootDir = path.resolve(__dirname, "..");

app.disable("x-powered-by");

// Configure Helmet to allow AI Studio iframe embedding and CDN assets (Google Fonts, FontAwesome)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false
}));

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

if (env.nodeEnv !== "test") {
  app.use(morgan("dev"));
}

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: "Too many requests. Please try again later."
    }
  }
}));

// Serve static frontend assets
app.use("/css", express.static(path.join(rootDir, "css")));
app.use("/js", express.static(path.join(rootDir, "js")));

// API Router
app.use("/api", apiRouter);

// Fallback for missing API routes
app.use("/api", notFoundHandler);

// Serve index.html for all other GET requests (SPA navigation)
app.use((req, res, next) => {
  if (req.method === "GET") {
    return res.sendFile(path.join(rootDir, "index.html"));
  }
  next();
});

app.use(errorHandler);

module.exports = app;
