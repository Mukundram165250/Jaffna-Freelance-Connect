const express = require("express");
const healthRouter = require("./health");
const authRouter = require("./auth");
const profileRouter = require("./profile");

const router = express.Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/profile", profileRouter);

module.exports = router;
