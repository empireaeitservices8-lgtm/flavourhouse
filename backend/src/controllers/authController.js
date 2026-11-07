const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/db");
const { JWT_SECRET } = require("../middleware/auth");

const ADMIN_TOKEN_EXPIRY = "7d";
const CUSTOMER_TOKEN_EXPIRY = "30d";

function normalizePhone(phone) {
  if (!phone) return "";
  const cleaned = phone.toString().replace(/\D/g, "");
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return cleaned.slice(2);
  }
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    return cleaned.slice(1);
  }
  return cleaned;
}

// POST /api/admin/auth/login or /api/admin/login
async function login(req, res) {
  try {
    const { email, username, emailOrPhone, password } = req.body;
    const identifier = (email || username || emailOrPhone || "").trim().toLowerCase();

    if (!identifier || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required." });
    }

    // Authenticate strictly against the database admin record
    const admin = await prisma.admin.findUnique({
      where: { email: identifier },
    });

    if (!admin) {
      // Check if this is a customer account attempting to access the admin area
      const normPhone = normalizePhone(identifier);
      const isCustomer = await prisma.customer.findFirst({
        where: {
          OR: [
            { email: identifier },
            { phone: normPhone && normPhone.length >= 10 ? normPhone : undefined },
          ].filter(Boolean),
        },
      });

      if (isCustomer) {
        return res.status(403).json({
          success: false,
          error: "Access denied. Customer accounts cannot access the admin dashboard. Please sign in via the customer store portal.",
          isCustomer: true,
          role: "customer",
        });
      }

      return res.status(401).json({ success: false, error: "Invalid admin email or password." });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "Invalid admin email or password." });
    }

    const token = jwt.sign(
      { adminId: admin.id, email: admin.email, role: "admin" },
      JWT_SECRET,
      { expiresIn: ADMIN_TOKEN_EXPIRY }
    );

    return res.json({
      success: true,
      role: "admin",
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
      message: "Admin authenticated successfully",
    });
  } catch (err) {
    console.error("Admin login error:", err);
    return res.status(500).json({ success: false, error: "Internal server error during admin login." });
  }
}

// POST /api/auth/login (Unified login endpoint for common login page)
async function unifiedLogin(req, res) {
  try {
    const { email, emailOrPhone, password, requestedRole } = req.body;
    const identifier = (email || emailOrPhone || "").trim().toLowerCase();

    if (!identifier || !password) {
      return res.status(400).json({ success: false, error: "Email or phone and password are required." });
    }

    // 1. If explicitly requested as admin or if identifier matches admin
    const admin = await prisma.admin.findUnique({
      where: { email: identifier },
    });

    if (admin) {
      const isMatch = await bcrypt.compare(password, admin.passwordHash);
      if (isMatch) {
        const token = jwt.sign(
          { adminId: admin.id, email: admin.email, role: "admin" },
          JWT_SECRET,
          { expiresIn: ADMIN_TOKEN_EXPIRY }
        );

        return res.json({
          success: true,
          role: "admin",
          token,
          user: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
          },
          redirectUrl: "/admin/dashboard",
          message: "Admin login successful",
        });
      } else {
        return res.status(401).json({ success: false, error: "Incorrect password. Please try again." });
      }
    }

    // 2. Check Customer record
    const normPhone = normalizePhone(identifier);
    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: normPhone && normPhone.length >= 10 ? normPhone : undefined },
        ].filter(Boolean),
      },
    });

    if (customer) {
      // If customer is attempting to access admin route
      if (requestedRole === "admin") {
        return res.status(403).json({
          success: false,
          error: "Access denied. Customer accounts cannot access the admin dashboard. Please sign in via the customer store portal.",
          role: "customer",
          isCustomer: true,
        });
      }

      if (!customer.passwordHash) {
        return res.status(400).json({
          success: false,
          error: "You previously placed orders as a guest. Please create an account with this email/phone to set your password.",
        });
      }

      const isMatch = await bcrypt.compare(password, customer.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: "Incorrect password. Please try again." });
      }

      if (customer.isActive === false) {
        return res.status(403).json({ success: false, error: "Your account is currently deactivated. Please contact support." });
      }

      const token = jwt.sign(
        { customerId: customer.id, email: customer.email, role: "customer" },
        JWT_SECRET,
        { expiresIn: CUSTOMER_TOKEN_EXPIRY }
      );

      return res.json({
        success: true,
        role: "customer",
        token,
        user: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
        },
        redirectUrl: "/account/orders",
        message: "Customer login successful",
      });
    }

    // Neither admin nor customer found
    return res.status(401).json({
      success: false,
      error: "No account found with these credentials. Please check your information or create an account.",
    });
  } catch (err) {
    console.error("Unified login error:", err);
    return res.status(500).json({ success: false, error: "Server error during login." });
  }
}

// GET /api/admin/auth/me or /api/admin/profile
async function getMe(req, res) {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.admin.id },
      select: { id: true, name: true, email: true, createdAt: true, updatedAt: true },
    });
    if (!admin) {
      return res.status(404).json({ success: false, error: "Admin profile not found." });
    }
    return res.json({ success: true, admin });
  } catch (err) {
    console.error("GetMe error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch admin profile." });
  }
}

// PUT /api/admin/profile
async function updateProfile(req, res) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: "Name is required." });
    }

    const updated = await prisma.admin.update({
      where: { id: req.admin.id },
      data: { name: name.trim() },
      select: { id: true, name: true, email: true, updatedAt: true },
    });

    return res.json({ success: true, admin: updated, message: "Profile updated successfully." });
  } catch (err) {
    console.error("UpdateProfile error:", err);
    return res.status(500).json({ success: false, error: "Failed to update profile." });
  }
}

// PUT /api/admin/profile/email or /api/admin/update-email
async function updateEmail(req, res) {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, error: "Please enter a valid email address." });
    }
    if (!password) {
      return res.status(400).json({ success: false, error: "Current password is required to change email." });
    }

    const admin = await prisma.admin.findUnique({ where: { id: req.admin.id } });
    if (!admin) {
      return res.status(404).json({ success: false, error: "Admin account not found." });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "Current password is incorrect." });
    }

    // Check if new email is already in use by another admin
    const existing = await prisma.admin.findFirst({
      where: { email: cleanEmail, NOT: { id: req.admin.id } },
    });
    if (existing) {
      return res.status(400).json({ success: false, error: "This email address is already in use by another account." });
    }

    // Update the database record
    const updated = await prisma.admin.update({
      where: { id: req.admin.id },
      data: { email: cleanEmail },
      select: { id: true, name: true, email: true, updatedAt: true },
    });

    // Generate refreshed token with new email and timestamp
    const newToken = jwt.sign(
      { adminId: updated.id, email: updated.email, role: "admin" },
      JWT_SECRET,
      { expiresIn: ADMIN_TOKEN_EXPIRY }
    );

    return res.json({
      success: true,
      token: newToken,
      admin: updated,
      message: "Admin email updated successfully. The previous email has been permanently decommissioned.",
    });
  } catch (err) {
    console.error("UpdateEmail error:", err);
    return res.status(500).json({ success: false, error: "Failed to update email." });
  }
}

// PUT /api/admin/profile/password or /api/admin/update-password
async function updatePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: "Both current and new passwords are required." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: "New password must be at least 6 characters long." });
    }

    const admin = await prisma.admin.findUnique({ where: { id: req.admin.id } });
    if (!admin) {
      return res.status(404).json({ success: false, error: "Admin account not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "Current password is incorrect." });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    const updated = await prisma.admin.update({
      where: { id: req.admin.id },
      data: { passwordHash: newHash },
      select: { id: true, name: true, email: true, updatedAt: true },
    });

    // Generate refreshed token for active session
    const newToken = jwt.sign(
      { adminId: updated.id, email: updated.email, role: "admin" },
      JWT_SECRET,
      { expiresIn: ADMIN_TOKEN_EXPIRY }
    );

    return res.json({
      success: true,
      token: newToken,
      message: "Password updated successfully. The previous password has been permanently revoked.",
    });
  } catch (err) {
    console.error("UpdatePassword error:", err);
    return res.status(500).json({ success: false, error: "Failed to update password." });
  }
}

// POST /api/admin/auth/logout
function logout(req, res) {
  return res.json({ success: true, message: "Logged out successfully." });
}

module.exports = {
  login,
  unifiedLogin,
  getMe,
  updateProfile,
  updateEmail,
  updatePassword,
  logout,
};
