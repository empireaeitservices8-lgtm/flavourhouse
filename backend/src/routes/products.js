const express = require("express");
const { verifyAdmin } = require("../middleware/auth");
const productController = require("../controllers/productController");

// Public router: /api/products
const publicRouter = express.Router();
publicRouter.get("/", productController.getProducts);
publicRouter.get("/admin/all", verifyAdmin, productController.getAdminProducts);
publicRouter.get("/:id", productController.getProductById);

// Admin router: /api/admin/products
const adminRouter = express.Router();
adminRouter.use(verifyAdmin);
adminRouter.get("/", productController.getAdminProducts);
adminRouter.post("/", productController.createProduct);
adminRouter.put("/:id", productController.updateProduct);
adminRouter.delete("/:id", productController.deleteProduct);

module.exports = {
  productsRouter: publicRouter,
  adminProductsRouter: adminRouter,
};
