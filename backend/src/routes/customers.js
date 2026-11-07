const express = require("express");
const { verifyAdmin } = require("../middleware/auth");
const customerController = require("../controllers/customerController");

const router = express.Router();

router.use(verifyAdmin); // All customer management routes are protected

router.get("/", customerController.getAdminCustomers);
router.get("/:id", customerController.getAdminCustomerById);
router.get("/:id/orders", customerController.getAdminCustomerOrders);
router.delete("/:id", customerController.deleteCustomer);
router.patch("/:id/status", customerController.toggleCustomerStatus);

module.exports = router;

