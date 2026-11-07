const express = require("express");
const { verifyAdmin } = require("../middleware/auth");
const storeController = require("../controllers/storeController");

const router = express.Router();

// Public store settings
router.get("/", storeController.getStoreSettings);
router.get("/settings", storeController.getStoreSettings);

// Admin store settings update
router.put("/", verifyAdmin, storeController.updateStoreSettings);
router.put("/settings", verifyAdmin, storeController.updateStoreSettings);

module.exports = router;

