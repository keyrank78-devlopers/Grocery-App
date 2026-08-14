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
/**
 * @swagger
 * tags:
 *   name: Admin - Staff
 *   description: Staff management
 */

/**
 * @swagger
 * /admin/create-staff:
 *   post:
 *     summary: Create staff
 *     tags: [Admin - Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Staff created
 */
router.post("/create-staff", verifyAdminToken, createStaff);

/**
 * @swagger
 * /admin/get-staff:
 *   get:
 *     summary: Get all staff
 *     tags: [Admin - Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff retrieved
 */
router.get("/get-staff", verifyAdminToken, getAllStaff);

/**
 * @swagger
 * /admin/staff/{id}:
 *   put:
 *     summary: Edit staff
 *     tags: [Admin - Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Staff updated
 */
router.put("/staff/:id", verifyAdminToken, editStaff);

/**
 * @swagger
 * /admin/staff/{id}/toggle-status:
 *   patch:
 *     summary: Toggle staff status
 *     tags: [Admin - Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status toggled
 */
router.patch("/staff/:id/toggle-status", verifyAdminToken, toggleStaffStatus);

// ─── Category Routes ─────────────────────────────────────────────────────────
/**
 * @swagger
 * tags:
 *   name: Admin - Category
 *   description: Category management
 */

/**
 * @swagger
 * /admin/categories:
 *   post:
 *     summary: Create category
 *     tags: [Admin - Category]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Category created
 */
router.post("/categories", verifyAdminToken, handleCategoryImageUpload, createCategory);

/**
 * @swagger
 * /admin/get-categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Admin - Category]
 *     responses:
 *       200:
 *         description: Categories retrieved
 */
router.get("/get-categories",  getAllCategories);

/**
 * @swagger
 * /admin/single-categories/{id}:
 *   get:
 *     summary: Get single category
 *     tags: [Admin - Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category retrieved
 */
router.get("/single-categories/:id", verifyAdminToken, getCategoryById);

/**
 * @swagger
 * /admin/udpate-categories/{id}:
 *   put:
 *     summary: Update category
 *     tags: [Admin - Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category updated
 */
router.put("/udpate-categories/:id", verifyAdminToken, handleCategoryImageUpload, updateCategory);

/**
 * @swagger
 * /admin/delete-categories/{id}:
 *   delete:
 *     summary: Delete category
 *     tags: [Admin - Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category deleted
 */
router.delete("/delete-categories/:id", verifyAdminToken, deleteCategory);

/**
 * @swagger
 * /admin/categories/{id}/toggle-status:
 *   patch:
 *     summary: Toggle category status
 *     tags: [Admin - Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status toggled
 */
router.patch("/categories/:id/toggle-status", verifyAdminToken, toggleCategoryStatus);

// ─── Sub-Category Routes ─────────────────────────────────────────────────────
/**
 * @swagger
 * tags:
 *   name: Admin - Sub-Category
 *   description: Sub-Category management
 */

/**
 * @swagger
 * /admin/sub-categories:
 *   post:
 *     summary: Create sub-category
 *     tags: [Admin - Sub-Category]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Sub-Category created
 */
router.post("/sub-categories", verifyAdminToken, handleCategoryImageUpload, createSubCategory);

/**
 * @swagger
 * /admin/get-sub-categories:
 *   get:
 *     summary: Get all sub-categories
 *     tags: [Admin - Sub-Category]
 *     responses:
 *       200:
 *         description: Sub-Categories retrieved
 */
router.get("/get-sub-categories",  getAllSubCategories);

/**
 * @swagger
 * /admin/single-sub-categories/{id}:
 *   get:
 *     summary: Get single sub-category
 *     tags: [Admin - Sub-Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sub-Category retrieved
 */
router.get("/single-sub-categories/:id", verifyAdminToken, getSubCategoryById);

/**
 * @swagger
 * /admin/update-sub-categories/{id}:
 *   put:
 *     summary: Update sub-category
 *     tags: [Admin - Sub-Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sub-Category updated
 */
router.put("/update-sub-categories/:id", verifyAdminToken, handleCategoryImageUpload, updateSubCategory);

/**
 * @swagger
 * /admin/delete-sub-categories/{id}:
 *   delete:
 *     summary: Delete sub-category
 *     tags: [Admin - Sub-Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sub-Category deleted
 */
router.delete("/delete-sub-categories/:id", verifyAdminToken, deleteSubCategory);

/**
 * @swagger
 * /admin/sub-categories/{id}/toggle-status:
 *   patch:
 *     summary: Toggle sub-category status
 *     tags: [Admin - Sub-Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status toggled
 */
router.patch("/sub-categories/:id/toggle-status", verifyAdminToken, toggleSubCategoryStatus);

// ─── Product Routes ──────────────────────────────────────────────────────────
/**
 * @swagger
 * tags:
 *   name: Admin - Product
 *   description: Product management
 */

/**
 * @swagger
 * /admin/products:
 *   post:
 *     summary: Create product
 *     tags: [Admin - Product]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Product created
 */
router.post("/products", verifyAdminToken, handleProductUpload, createProduct);

/**
 * @swagger
 * /admin/get-products:
 *   get:
 *     summary: Get all products
 *     tags: [Admin - Product]
 *     responses:
 *       200:
 *         description: Products retrieved
 */
router.get("/get-products", getAllProducts);

/**
 * @swagger
 * /admin/single-products/{id}:
 *   get:
 *     summary: Get single product
 *     tags: [Admin - Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product retrieved
 */
router.get("/single-products/:id", verifyAdminToken, getProductById);

/**
 * @swagger
 * /admin/update-products/{id}:
 *   put:
 *     summary: Update product
 *     tags: [Admin - Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product updated
 */
router.put("/update-products/:id", verifyAdminToken, handleProductUpload, updateProduct);

/**
 * @swagger
 * /admin/delete-products/{id}:
 *   delete:
 *     summary: Delete product
 *     tags: [Admin - Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted
 */
router.delete("/delete-products/:id", verifyAdminToken, deleteProduct);

/**
 * @swagger
 * /admin/products/{id}/toggle-status:
 *   patch:
 *     summary: Toggle product status
 *     tags: [Admin - Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status toggled
 */
router.patch("/products/:id/toggle-status", verifyAdminToken, toggleProductStatus);

module.exports = router;
