const jwt = require("jsonwebtoken");
const env = require("../config/env");
const prisma = require("../config/database");

function readToken(req) {
  const cookieHeader = req.headers.cookie || "";
  const cookies = Object.fromEntries(
    cookieHeader
      .split(";")
      .map((part) => part.trim().split("="))
      .filter(([key, value]) => key && value)
  );
  return cookies[env.authCookieName] || null;
}

async function requireAuth(req, res, next) {
  try {
    const token = readToken(req);
    if (!token) {
      return res.status(401).json({ success: false, error: { message: "Authentication required." } });
    }

    const payload = jwt.verify(token, env.jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true, email: true, displayName: true, role: true,
        phone: true, location: true, createdAt: true, updatedAt: true
      }
    });

    if (!user) {
      return res.status(401).json({ success: false, error: { message: "Authentication required." } });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: { message: "Authentication required." } });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { message: "You do not have permission to access this resource." }
      });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
