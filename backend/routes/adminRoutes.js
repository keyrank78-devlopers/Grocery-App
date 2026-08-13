const express = require("express");
const { createStaff, getAllStaff, editStaff, toggleStaffStatus } = require("../controllers/staffController");
const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
} = require("../controllers/categoryController");
const {
  createSubCategory,
  getAllSubCategories,
  getSubCategoryById,
  updateSubCategory,
  deleteSubCategory,
  toggleSubCategoryStatus,
} = require("../controllers/subCategoryController");
const { verifyAdminToken } = require("../middleware/auth");
const { handleCategoryImageUpload, handleProductUpload } = require("../middleware/uploadMiddleware");
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
} = require("../controllers/productController");

const router = express.Router();

// ─── Staff Routes ────────────────────────────────────────────────────────────
router.post("/create-staff", verifyAdminToken, createStaff);
router.get("/get-staff", verifyAdminToken, getAllStaff);
router.put("/staff/:id", verifyAdminToken, editStaff);
router.patch("/staff/:id/toggle-status", verifyAdminToken, toggleStaffStatus);

// ─── Category Routes ─────────────────────────────────────────────────────────
router.post("/categories", verifyAdminToken, handleCategoryImageUpload, createCategory);
router.get("/get-categories",  getAllCategories);
router.get("/single-categories/:id", verifyAdminToken, getCategoryById);
router.put("/udpate-categories/:id", verifyAdminToken, handleCategoryImageUpload, updateCategory);
router.delete("/delete-categories/:id", verifyAdminToken, deleteCategory);
router.patch("/categories/:id/toggle-status", verifyAdminToken, toggleCategoryStatus);

// ─── Sub-Category Routes ─────────────────────────────────────────────────────
router.post("/sub-categories", verifyAdminToken, handleCategoryImageUpload, createSubCategory);
router.get("/get-sub-categories",  getAllSubCategories);
router.get("/single-sub-categories/:id", verifyAdminToken, getSubCategoryById);
router.put("/update-sub-categories/:id", verifyAdminToken, handleCategoryImageUpload, updateSubCategory);
router.delete("/delete-sub-categories/:id", verifyAdminToken, deleteSubCategory);
router.patch("/sub-categories/:id/toggle-status", verifyAdminToken, toggleSubCategoryStatus);

// ─── Product Routes ──────────────────────────────────────────────────────────
router.post("/products", verifyAdminToken, handleProductUpload, createProduct);
router.get("/get-products", getAllProducts);
router.get("/single-products/:id", verifyAdminToken, getProductById);
router.put("/update-products/:id", verifyAdminToken, handleProductUpload, updateProduct);
router.delete("/delete-products/:id", verifyAdminToken, deleteProduct);
router.patch("/products/:id/toggle-status", verifyAdminToken, toggleProductStatus);

module.exports = router;
