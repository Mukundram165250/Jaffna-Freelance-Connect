const express = require("express");
const healthRouter = require("./health");
const authRouter = require("./auth");
const profileRouter = require("./profile");
const jobsRouter = require("./jobs");
const applicationsRouter = require("./applications");
const adminRouter = require("./admin");

const router = express.Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/profile", profileRouter);
router.use("/jobs", jobsRouter);
router.use("/applications", applicationsRouter);
router.use("/admin", adminRouter);

module.exports = router;
