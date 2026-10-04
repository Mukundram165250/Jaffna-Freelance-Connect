const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    service: "vibeworkers-api",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
