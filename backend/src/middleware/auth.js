const jwt = require("jsonwebtoken");
const prisma = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET || "flavorhouse_super_secret_jwt_key_2026";

/**
 * Middleware: Enforces that the request is made by an authenticated Administrator.
 * Strictly rejects customer tokens and invalidates tokens issued prior to credential changes.
 */
async function verifyAdmin(req, res, next) {
  try {
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ success: false, error: "Access denied. No authentication token provided." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Reject non-admin tokens (e.g. customer tokens attempting admin access)
    if (!decoded || !decoded.adminId || decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Administrator privileges required.",
        role: decoded?.role || "unknown",
      });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: decoded.adminId },
      select: { id: true, name: true, email: true, updatedAt: true },
    });

    if (!admin) {
      return res.status(401).json({ success: false, error: "Admin account not found or removed." });
    }

    // Security revocation check: Invalidate tokens issued before email/password change
    if (decoded.iat && admin.updatedAt) {
      const updatedAtSec = Math.floor(new Date(admin.updatedAt).getTime() / 1000);
      // Allow 2 second clock skew tolerance
      if (decoded.iat < updatedAtSec - 2) {
        return res.status(401).json({
          success: false,
          error: "Session revoked due to credential change. Please sign in again with your updated credentials.",
          sessionRevoked: true,
        });
      }
    }

    req.admin = admin;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, error: "Session expired. Please log in again." });
    }
    return res.status(401).json({ success: false, error: "Invalid authentication token." });
  }
}

/**
 * Middleware: Enforces that the request is made by an authenticated Customer.
 */
async function verifyCustomer(req, res, next) {
  try {
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ success: false, error: "Authentication required. Please sign in to your account." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.customerId || decoded.role !== "customer") {
      return res.status(401).json({ success: false, error: "Invalid customer session." });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: decoded.customerId },
      select: { id: true, name: true, email: true, phone: true, alternatePhone: true, isActive: true },
    });

    if (!customer) {
      return res.status(401).json({ success: false, error: "Customer account not found." });
    }

    if (customer.isActive === false) {
      return res.status(403).json({ success: false, error: "Your account is currently deactivated. Please contact support." });
    }

    req.customer = customer;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, error: "Session expired. Please log in again." });
    }
    return res.status(401).json({ success: false, error: "Invalid customer authentication token." });
  }
}

/**
 * Middleware: Optional Customer extraction for cart/checkout without blocking guests.
 */
async function optionalCustomer(req, res, next) {
  try {
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded && decoded.customerId && decoded.role === "customer") {
        const customer = await prisma.customer.findUnique({
          where: { id: decoded.customerId },
          select: { id: true, name: true, email: true, phone: true, alternatePhone: true, isActive: true },
        });
        if (customer && customer.isActive !== false) {
          req.customer = customer;
        }
      }
    }
  } catch {}
  next();
}

module.exports = {
  verifyAdmin,
  verifyCustomer,
  optionalCustomer,
  JWT_SECRET,
};
