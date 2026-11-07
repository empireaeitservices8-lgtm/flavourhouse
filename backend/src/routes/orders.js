const express = require("express");
const { verifyAdmin, verifyCustomer, optionalCustomer } = require("../middleware/auth");
const { createRateLimiter } = require("../middleware/rateLimiter");
const orderController = require("../controllers/orderController");

const publicRouter = express.Router();
const trackingLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 60, message: "Too many tracking requests." });

// Public & Customer routes: /api/orders
publicRouter.post("/", optionalCustomer, orderController.createOrder);
publicRouter.get("/track", trackingLimiter, orderController.trackOrder);
publicRouter.get("/summary/:idOrNumber", orderController.getOrderSummary);

// Customer protected order history routes: /api/orders/my-orders
publicRouter.get("/my-orders", verifyCustomer, orderController.getCustomerOrders);
publicRouter.get("/my-orders/:id", verifyCustomer, orderController.getCustomerOrderById);

// Admin backwards-compatibility routes
publicRouter.get("/admin", verifyAdmin, orderController.getAdminOrders);
publicRouter.get("/admin/:id", verifyAdmin, orderController.getAdminOrderById);
publicRouter.patch("/admin/:id/status", verifyAdmin, orderController.updateOrderStatus);
publicRouter.delete("/admin/:id", verifyAdmin, orderController.deleteOrder);

// Admin router: /api/admin/orders
const adminRouter = express.Router();
adminRouter.use(verifyAdmin);
adminRouter.get("/", orderController.getAdminOrders);
adminRouter.get("/:id", orderController.getAdminOrderById);
adminRouter.patch("/:id/status", orderController.updateOrderStatus);
adminRouter.delete("/:id", orderController.deleteOrder);

module.exports = {
  ordersRouter: publicRouter,
  adminOrdersRouter: adminRouter,
};
