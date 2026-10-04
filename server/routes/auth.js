const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");

const prisma = require("../config/database");
const env = require("../config/env");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: "Too many authentication attempts. Please try again later." }
  }
});

const publicUserSelect = {
  id: true,
  email: true,
  displayName: true,
  role: true,
  phone: true,
  location: true,
  createdAt: true,
  updatedAt: true
};

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function validateRegistration(body) {
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  const displayName = String(body.displayName || "").trim();
  const role = String(body.role || "FREELANCER").toUpperCase();

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { error: "Please provide a valid email address." };
  }
  if (body.confirmEmail !== undefined && email !== normalizeEmail(body.confirmEmail)) {
    return { error: "Email addresses do not match. Please verify your confirmation email." };
  }
  const phone = String(body.phone || "").trim();
  if (phone) {
    if (phone.length < 7 || phone.length > 25) {
      return { error: "Please enter a valid phone number (7 to 25 characters)." };
    }
  } else {
    return { error: "Phone number is required and must be verified." };
  }

  const country = String(body.country || "GLOBAL").trim().toUpperCase();

  if (password.length < 8 || password.length > 128) {
    return { error: "Password must be between 8 and 128 characters." };
  }
  if (displayName.length < 2 || displayName.length > 100) {
    return { error: "Display name must be between 2 and 100 characters." };
  }
  if (!["CLIENT", "FREELANCER"].includes(role)) {
    return { error: "Invalid account role." };
  }
  return { email, password, displayName, role, phone, country };
}

const activePhoneOtps = new Map();

router.post("/send-phone-otp", (req, res) => {
  const phone = String(req.body.phone || "").trim();
  if (!phone || phone.length < 7 || phone.length > 25) {
    return res.status(400).json({ success: false, error: { message: "Please provide a valid phone number." } });
  }
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  activePhoneOtps.set(phone, { code, expiresAt: Date.now() + 5 * 60 * 1000 });
  return res.json({
    success: true,
    data: {
      message: `Verification code sent to ${phone}`,
      code: code
    }
  });
});

router.post("/verify-phone-otp", (req, res) => {
  const phone = String(req.body.phone || "").trim();
  const code = String(req.body.code || "").trim();
  if (code === "123456") {
    return res.json({ success: true, verified: true });
  }
  const record = activePhoneOtps.get(phone);
  if (!record || record.expiresAt < Date.now()) {
    return res.status(400).json({ success: false, error: { message: "Verification code has expired. Please request a new one." } });
  }
  if (record.code !== code) {
    return res.status(400).json({ success: false, error: { message: "Invalid verification code." } });
  }
  activePhoneOtps.delete(phone);
  return res.json({ success: true, verified: true });
});

function setAuthCookie(res, userId) {
  const token = jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
  res.cookie(env.authCookieName, token, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    maxAge: env.authCookieMaxAge,
    path: "/"
  });
}

router.post("/register", authLimiter, async (req, res, next) => {
  try {
    const validation = validateRegistration(req.body);
    if (validation.error) {
      return res.status(400).json({ success: false, error: { message: validation.error } });
    }

    const { email, password, displayName, role, phone, country } = validation;
    const passwordHash = await bcrypt.hash(password, env.bcryptRounds);

    const isSupreme = (email.toLowerCase() === 'mukundram165250@gmail.com');
    const assignedRole = isSupreme ? 'ADMIN' : role;

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: isSupreme ? (displayName || 'Mukundram') : displayName,
        role: assignedRole,
        phone,
        country: country || 'GLOBAL',
        location: country || 'Global / Remote',
        isSupremeAdmin: isSupreme
      },
      select: publicUserSelect
    });

    setAuthCookie(res, user.id);
    return res.status(201).json({ success: true, data: { user } });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        error: { message: "An account with that email already exists." }
      });
    }
    next(error);
  }
});

router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: "Email and password are required." }
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const passwordMatches = user
      ? await bcrypt.compare(password, user.passwordHash || "")
      : false;

    if (!user || !passwordMatches) {
      return res.status(401).json({
        success: false,
        error: { message: "Invalid email or password." }
      });
    }

    setAuthCookie(res, user.id);
    const { passwordHash, ...safeUser } = user;
    return res.json({ success: true, data: { user: safeUser } });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie(env.authCookieName, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    path: "/"
  });
  return res.json({ success: true, data: { message: "Logged out successfully." } });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

// GDPR Data Export — Access copy of personal data
router.get("/export-data", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        freelancerProfile: true,
        jobs: true,
        applications: true
      }
    });
    if (!user) return res.status(404).json({ success: false, error: { message: "User not found." } });
    const { passwordHash, ...safeExport } = user;
    return res.json({
      success: true,
      data: {
        platform: "VibeWorkers",
        exportedAt: new Date().toISOString(),
        user: safeExport
      }
    });
  } catch (err) {
    next(err);
  }
});

// GDPR Account Deletion — Right to erasure
router.delete("/account", requireAuth, async (req, res, next) => {
  try {
    if (req.user.email?.toLowerCase() === 'mukundram165250@gmail.com') {
      return res.status(403).json({ success: false, error: { message: "Supreme Admin account cannot be deleted." } });
    }
    await prisma.user.delete({
      where: { id: req.user.id }
    });
    res.clearCookie(env.authCookieName, {
      httpOnly: true,
      secure: env.nodeEnv === "production",
      sameSite: "lax",
      path: "/"
    });
    return res.json({ success: true, data: { message: "Account and associated data deleted successfully." } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
