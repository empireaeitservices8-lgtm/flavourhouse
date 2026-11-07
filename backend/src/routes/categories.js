const express = require("express");
const { verifyAdmin } = require("../middleware/auth");
const categoryController = require("../controllers/categoryController");

const publicRouter = express.Router();
publicRouter.get("/", categoryController.getCategories);

const adminRouter = express.Router();
adminRouter.use(verifyAdmin);
adminRouter.get("/", categoryController.getCategories);
adminRouter.post("/", categoryController.createCategory);
adminRouter.put("/:id", categoryController.updateCategory);
adminRouter.delete("/:id", categoryController.deleteCategory);

module.exports = {
  categoriesRouter: publicRouter,
  adminCategoriesRouter: adminRouter,
};
