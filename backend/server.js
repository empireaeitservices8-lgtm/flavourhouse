const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const authRouter = require("./src/routes/auth");
const authController = require("./src/controllers/authController");
const { initAdminAccount } = require("./src/config/initAdmin");
const customerAuthRouter = require("./src/routes/customerAuth");
const addressesRouter = require("./src/routes/addresses");
const { productsRouter, adminProductsRouter } = require("./src/routes/products");
const { categoriesRouter, adminCategoriesRouter } = require("./src/routes/categories");
const { ordersRouter, adminOrdersRouter } = require("./src/routes/orders");
const customersRouter = require("./src/routes/customers");
const dashboardRouter = require("./src/routes/dashboard");
const storeRouter = require("./src/routes/store");
const uploadRouter = require("./src/routes/upload");

const app = express();
const PORT = process.env.PORT || 4000;

// ── CORS Configuration ────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:3000,http://127.0.0.1:3000")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || origin.includes("localhost") || origin.includes("127.0.0.1")) {
        return callback(null, true);
      }
      callback(null, true);
    },
    credentials: true,
  })
);

// ── Body Parsers ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// ── Static Uploads ─────────────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

// ── Routes Mounting ────────────────────────────────────────────────────────────

// 0. Unified Auth endpoint (used by shared customer/admin login)
app.post("/api/auth/login", authController.unifiedLogin);

// 1. Admin Authentication & Profile
app.use("/api/admin/auth", authRouter);
app.use("/api/admin/profile", authRouter);
app.use("/api/admin", authRouter);
app.use("/api/auth", authRouter);

// 1b. Customer Authentication & Profile
app.use("/api/customer/auth", customerAuthRouter);
app.use("/api/customer/addresses", addressesRouter);
app.use("/api/addresses", addressesRouter);

// 2. Products
app.use("/api/products", productsRouter);
app.use("/api/admin/products", adminProductsRouter);

// 3. Categories
app.use("/api/categories", categoriesRouter);
app.use("/api/admin/categories", adminCategoriesRouter);

// 4. Orders & Tracking
app.use("/api/orders", ordersRouter);
app.use("/api/admin/orders", adminOrdersRouter);

// 5. Customer Management
app.use("/api/admin/customers", customersRouter);

// 6. Admin Dashboard
app.use("/api/admin/dashboard", dashboardRouter);

// 7. Store Settings
app.use("/api/store", storeRouter);
app.use("/api/admin/store", storeRouter);

// 8. Uploads
app.use("/api/upload", uploadRouter);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Flavour House MySQL Backend is running smoothly",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
    database: "MySQL (flavour_house_db)",
  });
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({
    success: false,
    error: err.message || "Internal server error occurred",
  });
});

// ── Start Server ──────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, async () => {
    console.log(`\n🌾 Flavour House MySQL Backend active on port ${PORT}`);
    console.log(`   Health:    http://localhost:${PORT}/api/health`);
    console.log(`   Products:  http://localhost:${PORT}/api/products`);
    console.log(`   Admin:     http://localhost:${PORT}/api/admin/auth/login\n`);

    // Verify / initialize admin account state on startup without overwriting existing data
    await initAdminAccount();
  });
}

module.exports = app;
