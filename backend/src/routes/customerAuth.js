const express = require("express");
const customerAuthController = require("../controllers/customerAuthController");
const { verifyCustomer } = require("../middleware/auth");
const { createRateLimiter } = require("../middleware/rateLimiter");

const router = express.Router();
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many authentication attempts, please try again later.",
});

// Authentication routes
router.post("/register", authLimiter, customerAuthController.register);
router.post("/login", authLimiter, customerAuthController.login);

// Customer profile routes (protected)
router.get("/me", verifyCustomer, customerAuthController.getMe);
router.put("/profile", verifyCustomer, customerAuthController.updateProfile);

module.exports = router;

