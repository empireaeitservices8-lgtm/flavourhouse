const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/db");
const { JWT_SECRET } = require("../middleware/auth");

const TOKEN_EXPIRY = "30d";

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

// POST /api/customer/auth/register
async function register(req, res) {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: "Full name is required." });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: "Valid email address is required." });
    }
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, error: "Please enter a valid email address." });
    }

    const normPhone = normalizePhone(phone);
    if (!normPhone || normPhone.length < 10) {
      return res.status(400).json({ success: false, error: "Please enter a valid 10-digit mobile number." });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: "Password must be at least 6 characters long." });
    }

    // Check if customer exists by email or phone
    const existing = await prisma.customer.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { phone: normPhone }],
      },
    });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let customer;
    if (existing) {
      // If customer was created via guest checkout without password, activate their account
      if (!existing.passwordHash) {
        customer = await prisma.customer.update({
          where: { id: existing.id },
          data: {
            name: name.trim(),
            email: cleanEmail,
            phone: normPhone,
            passwordHash,
          },
        });
      } else {
        return res.status(400).json({
          success: false,
          error: "An account with this email or phone number already exists. Please sign in instead.",
        });
      }
    } else {
      customer = await prisma.customer.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          phone: normPhone,
          passwordHash,
        },
      });
    }

    const token = jwt.sign(
      { customerId: customer.id, email: customer.email, role: "customer" },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    return res.status(201).json({
      success: true,
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
      message: "Account created successfully!",
    });
  } catch (err) {
    console.error("Customer register error:", err);
    return res.status(500).json({ success: false, error: "Server error creating customer account." });
  }
}

// POST /api/customer/auth/login
async function login(req, res) {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !emailOrPhone.trim() || !password) {
      return res.status(400).json({ success: false, error: "Email/phone and password are required." });
    }

    const identifier = emailOrPhone.trim().toLowerCase();
    const normPhone = normalizePhone(emailOrPhone);

    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: normPhone && normPhone.length >= 10 ? normPhone : undefined },
        ].filter(Boolean),
      },
    });

    if (!customer) {
      return res.status(401).json({ success: false, error: "No account found with these credentials. Please check your details or register." });
    }

    if (!customer.passwordHash) {
      return res.status(400).json({
        success: false,
        error: "You previously placed orders as a guest with this contact. Please choose 'Create Account' with this email/phone to set a password and access your orders.",
      });
    }

    const isValid = await bcrypt.compare(password, customer.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: "Incorrect password. Please try again." });
    }

    if (customer.isActive === false) {
      return res.status(403).json({ success: false, error: "Your account is currently deactivated. Please contact store support." });
    }

    const token = jwt.sign(
      { customerId: customer.id, email: customer.email, role: "customer" },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    return res.json({
      success: true,
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        alternatePhone: customer.alternatePhone,
      },
      message: "Logged in successfully",
    });
  } catch (err) {
    console.error("Customer login error:", err);
    return res.status(500).json({ success: false, error: "Internal server error during customer login." });
  }
}

// GET /api/customer/auth/me
async function getMe(req, res) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.customer.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        alternatePhone: true,
        createdAt: true,
        _count: {
          select: { orders: true, addresses: true },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ success: false, error: "Customer not found." });
    }

    return res.json({
      success: true,
      customer: {
        ...customer,
        totalOrders: customer._count.orders,
        totalAddresses: customer._count.addresses,
      },
    });
  } catch (err) {
    console.error("Customer getMe error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch customer profile." });
  }
}

// PUT /api/customer/auth/profile
async function updateProfile(req, res) {
  try {
    const { name, phone, alternatePhone } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: "Name is required." });
    }

    const normPhone = phone ? normalizePhone(phone) : req.customer.phone;

    const updated = await prisma.customer.update({
      where: { id: req.customer.id },
      data: {
        name: name.trim(),
        phone: normPhone,
        alternatePhone: alternatePhone ? alternatePhone.trim() : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        alternatePhone: true,
        updatedAt: true,
      },
    });

    return res.json({
      success: true,
      customer: updated,
      message: "Profile updated successfully.",
    });
  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(500).json({ success: false, error: "Failed to update profile." });
  }
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
};

