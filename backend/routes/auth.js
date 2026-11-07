const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Fh@2026#SecureAdmin!";
const JWT_SECRET = process.env.JWT_SECRET || "flavorhouse_jwt_secret";
const TOKEN_EXPIRY = "7d";

// ── Middleware: verify JWT ─────────────────────────────────────────────────────
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Export middleware for other routes
router.verifyToken = verifyToken;

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const token = jwt.sign(
    { username, role: "admin" },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );

  res.json({
    success: true,
    token,
    username,
    message: "Login successful",
  });
});

// GET /api/auth/verify
router.get("/verify", verifyToken, (req, res) => {
  res.json({ authenticated: true, username: req.user.username });
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  // JWT is stateless; client removes token
  res.json({ success: true, message: "Logged out successfully" });
});

module.exports = router;

