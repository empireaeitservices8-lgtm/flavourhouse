const express = require("express");
const { verifyAdmin } = require("../middleware/auth");
const { createRateLimiter } = require("../middleware/rateLimiter");
const authController = require("../controllers/authController");

const router = express.Router();
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many login attempts. Please wait 15 minutes before trying again.",
});

// Admin authentication endpoints
router.post("/login", loginLimiter, authController.login);
router.post("/logout", authController.logout);
router.get("/me", verifyAdmin, authController.getMe);
router.get("/profile", verifyAdmin, authController.getMe);

// Admin credential management endpoints (strict admin-only)
router.put("/", verifyAdmin, authController.updateProfile);
router.put("/profile", verifyAdmin, authController.updateProfile);

router.put("/email", verifyAdmin, authController.updateEmail);
router.put("/profile/email", verifyAdmin, authController.updateEmail);
router.put("/update-email", verifyAdmin, authController.updateEmail);

router.put("/password", verifyAdmin, authController.updatePassword);
router.put("/profile/password", verifyAdmin, authController.updatePassword);
router.put("/update-password", verifyAdmin, authController.updatePassword);

// Backward compatibility alias for session verification
router.get("/verify", verifyAdmin, (req, res) => {
  res.json({ authenticated: true, admin: req.admin });
});

module.exports = router;
