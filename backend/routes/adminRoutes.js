const express = require("express");
const { createStaff, getAllStaff, editStaff, toggleStaffStatus, assignWarehouseToStaff } = require("../controllers/staffController");
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
const { handleCategoryImageUpload, handleProductUpload, handleBannerImageUpload } = require("../middleware/uploadMiddleware");
const {
  createBanner,
  getAllBannersAdmin,
  getActiveBannersPublic,
  getBannerById,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
} = require("../controllers/bannerController");
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
} = require("../controllers/productController");
const { getAllOrdersAdmin, getOrderByIdAdmin, updateOrderStatusAdmin, approveReturn, markReturned, qcCheck } = require("../controllers/orderController");
const {
  createWarehouse,
  getWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
  toggleWarehouseStatus,
} = require("../controllers/warehouseController");
const {
  getAllCustomers,
  getCustomerById,
  toggleCustomerStatus,
} = require("../controllers/customerController");
const { getDashboardAnalytics } = require("../controllers/dashboardController");

const router = express.Router();

// ─── Dashboard Routes ────────────────────────────────────────────────────────
/**
 * @swagger
 * tags:
 *   name: Admin - Dashboard
 *   description: Admin dashboard analytics
 */

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get overall business and warehouse analytics
 *     tags: [Admin - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats retrieved
 */
router.get("/dashboard", verifyAdminToken, getDashboardAnalytics);

// ─── Customer Routes ─────────────────────────────────────────────────────────
/**
 * @swagger
 * tags:
 *   name: Admin - Customer
 *   description: Customer management
 */

/**
 * @swagger
 * /admin/customers:
 *   get:
 *     summary: Get all customers
 *     tags: [Admin - Customer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customers retrieved
 */
router.get("/customers", verifyAdminToken, getAllCustomers);

/**
 * @swagger
 * /admin/customers/{id}:
 *   get:
 *     summary: Get single customer details
 *     tags: [Admin - Customer]
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
 *         description: Customer details retrieved
 */
router.get("/customers/:id", verifyAdminToken, getCustomerById);

/**
 * @swagger
 * /admin/customers/{id}/toggle-status:
 *   patch:
 *     summary: Toggle customer status (suspend/activate)
 *     tags: [Admin - Customer]
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
 *         description: Customer status toggled
 */
router.patch("/customers/:id/toggle-status", verifyAdminToken, toggleCustomerStatus);

/**
 * @swagger
 * /admin/orders/{id}/approve-return:
 *   put:
 *     summary: Approve a return request
 *     tags: [Admin - Orders]
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
 *         description: Return approved
 */
router.put("/orders/:id/approve-return", verifyAdminToken, approveReturn);

/**
 * @swagger
 * /admin/orders/{id}/mark-returned:
 *   put:
 *     summary: Mark an order as returned (item collected)
 *     tags: [Admin - Orders]
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
 *         description: Order marked returned
 */
router.put("/orders/:id/mark-returned", verifyAdminToken, markReturned);

/**
 * @swagger
 * /admin/orders/{id}/qc-check:
 *   put:
 *     summary: Perform Quality Check (QC) on returned item
 *     tags: [Admin - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isPassed:
 *                 type: boolean
 *               comments:
 *                 type: string
 *     responses:
 *       200:
 *         description: QC completed
 */
router.put("/orders/:id/qc-check", verifyAdminToken, qcCheck);

// ─── Staff Routes ────────────────────────────────────────────────────────────
/**
 * @swagger
 * tags:
 *   name: Staff Management & Authentication
 *   description: Staff management and authentication APIs
 */

/**
 * @swagger
 * /admin/create-staff:
 *   post:
 *     summary: Create staff
 *     tags: [Staff Management & Authentication]
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
 *     tags: [Staff Management & Authentication]
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
 *     tags: [Staff Management & Authentication]
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
 *     tags: [Staff Management & Authentication]
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

/**
 * @swagger
 * /admin/staff/{id}/assign-warehouse:
 *   put:
 *     summary: Assign a warehouse to a staff member
 *     tags: [Staff Management & Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff ID (STF-XXXX)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               warehouseId:
 *                 type: string
 *                 description: Warehouse Document ID (Pass null/empty to unassign)
 *     responses:
 *       200:
 *         description: Warehouse assigned successfully
 */
router.put("/staff/:id/assign-warehouse", verifyAdminToken, assignWarehouseToStaff);

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

// ─── Order Routes ────────────────────────────────────────────────────────────
/**
 * @swagger
 * tags:
 *   name: Admin - Order
 *   description: Order management
 */

/**
 * @swagger
 * /admin/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Admin - Order]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders retrieved
 */
router.get("/orders", verifyAdminToken, getAllOrdersAdmin);
router.get("/orders/:id", verifyAdminToken, getOrderByIdAdmin);
router.put("/orders/:id/status", verifyAdminToken, updateOrderStatusAdmin);

// ─── Warehouse Routes ────────────────────────────────────────────────────────
/**
 * @swagger
 * tags:
 *   name: Admin - Warehouse
 *   description: Warehouse management
 */

/**
 * @swagger
 * /admin/warehouses:
 *   post:
 *     summary: Create warehouse
 *     tags: [Admin - Warehouse]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Warehouse created
 */
router.post("/warehouses", verifyAdminToken, createWarehouse);

/**
 * @swagger
 * /admin/get-warehouses:
 *   get:
 *     summary: Get all warehouses
 *     tags: [Admin - Warehouse]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Warehouses retrieved
 */
router.get("/get-warehouses", verifyAdminToken, getWarehouses);

/**
 * @swagger
 * /admin/single-warehouses/{id}:
 *   get:
 *     summary: Get single warehouse
 *     tags: [Admin - Warehouse]
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
 *         description: Warehouse retrieved
 */
router.get("/single-warehouses/:id", verifyAdminToken, getWarehouseById);

/**
 * @swagger
 * /admin/update-warehouses/{id}:
 *   put:
 *     summary: Update warehouse
 *     tags: [Admin - Warehouse]
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
 *         description: Warehouse updated
 */
router.put("/update-warehouses/:id", verifyAdminToken, updateWarehouse);

/**
 * @swagger
 * /admin/delete-warehouses/{id}:
 *   delete:
 *     summary: Delete warehouse
 *     tags: [Admin - Warehouse]
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
 *         description: Warehouse deleted
 */
router.delete("/delete-warehouses/:id", verifyAdminToken, deleteWarehouse);

/**
 * @swagger
 * /admin/warehouses/{id}/toggle-status:
 *   patch:
 *     summary: Toggle warehouse status
 *     tags: [Admin - Warehouse]
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
router.patch("/warehouses/:id/toggle-status", verifyAdminToken, toggleWarehouseStatus);

// ─── Banner Routes ───────────────────────────────────────────────────────────
/**
 * @swagger
 * tags:
 *   name: Admin - Banner
 *   description: Banner management
 */

/**
 * @swagger
 * /admin/banners:
 *   post:
 *     summary: Create a banner
 *     tags: [Admin - Banner]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Banner image file
 *     responses:
 *       201:
 *         description: Banner created successfully
 *       400:
 *         description: Bad request (missing image)
 */
router.post("/banners", verifyAdminToken, handleBannerImageUpload, createBanner);

/**
 * @swagger
 * /admin/banners:
 *   get:
 *     summary: Get all banners (Admin panel)
 *     tags: [Admin - Banner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of banners per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Banners retrieved
 */
router.get("/banners", verifyAdminToken, getAllBannersAdmin);

/**
 * @swagger
 * /admin/get-banners:
 *   get:
 *     summary: Get active banners (Public)
 *     tags: [Admin - Banner]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of banners per page
 *     responses:
 *       200:
 *         description: Active banners retrieved
 */
router.get("/get-banners", getActiveBannersPublic);

/**
 * @swagger
 * /admin/single-banners/{id}:
 *   get:
 *     summary: Get a single active banner
 *     tags: [Admin - Banner]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Banner ID (BAN-XXXXXX)
 *     responses:
 *       200:
 *         description: Banner details retrieved
 *       404:
 *         description: Banner not found or inactive
 */
router.get("/single-banners/:id", getBannerById);

/**
 * @swagger
 * /admin/update-banners/{id}:
 *   put:
 *     summary: Update banner details or image
 *     tags: [Admin - Banner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Banner ID (BAN-XXXXXX)
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: New banner image file (optional)
 *               isActive:
 *                 type: string
 *                 enum: [true, false]
 *                 description: Banner active status (optional)
 *     responses:
 *       200:
 *         description: Banner updated successfully
 *       404:
 *         description: Banner not found
 */
router.put("/update-banners/:id", verifyAdminToken, handleBannerImageUpload, updateBanner);

/**
 * @swagger
 * /admin/delete-banners/{id}:
 *   delete:
 *     summary: Delete banner
 *     tags: [Admin - Banner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Banner ID (BAN-XXXXXX)
 *     responses:
 *       200:
 *         description: Banner deleted successfully
 *       404:
 *         description: Banner not found
 */
router.delete("/delete-banners/:id", verifyAdminToken, deleteBanner);

/**
 * @swagger
 * /admin/banners/{id}/toggle-status:
 *   patch:
 *     summary: Toggle banner status
 *     tags: [Admin - Banner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Banner ID (BAN-XXXXXX)
 *     responses:
 *       200:
 *         description: Banner status toggled successfully
 *       404:
 *         description: Banner not found
 */
router.patch("/banners/:id/toggle-status", verifyAdminToken, toggleBannerStatus);

module.exports = router;
