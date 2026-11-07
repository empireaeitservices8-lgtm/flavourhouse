const express = require("express");
const addressController = require("../controllers/addressController");
const { verifyCustomer } = require("../middleware/auth");

const router = express.Router();

// All address routes require a logged-in customer
router.use(verifyCustomer);

router.get("/", addressController.getAddresses);
router.post("/", addressController.createAddress);
router.put("/:id", addressController.updateAddress);
router.delete("/:id", addressController.deleteAddress);
router.patch("/:id/default", addressController.setDefaultAddress);

module.exports = router;

