const express = require("express");
const { verifyAdmin } = require("../middleware/auth");
const dashboardController = require("../controllers/dashboardController");

const router = express.Router();

router.use(verifyAdmin); // All dashboard routes are protected

router.get("/stats", dashboardController.getDashboardStats);
router.get("/sales", dashboardController.getSalesOverview);
router.get("/recent-orders", dashboardController.getRecentOrders);
router.get("/top-products", dashboardController.getTopProducts);
router.get("/low-stock", dashboardController.getLowStock);
router.get("/recent-activities", dashboardController.getRecentActivities);

module.exports = router;

