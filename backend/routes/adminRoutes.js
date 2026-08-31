const express = require("express");
const { uploadNotificationImage } = require("../config/cloudinary");
const { createStaff, getAllStaff, editStaff, toggleStaffStatus, assignWarehouseToStaff } = require("../controllers/staffController");
const { verifyAdminToken } = require("../middleware/auth");
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
const { getInventory, updateStock } = require("../controllers/inventoryController");
const { broadcastNotification, getNotificationHistory, deleteNotification } = require("../controllers/adminController");

const router = express.Router();

// ─── Dashboard Routes ────────────────────────────────────────────────────────
router.get("/dashboard", verifyAdminToken, getDashboardAnalytics);

// ─── Notification Routes ─────────────────────────────────────────────────────
router.post("/notifications/broadcast", verifyAdminToken, uploadNotificationImage, broadcastNotification);

// ─── Notification Routes ─────────────────────────────────────────────────────
router.post("/notifications/broadcast", verifyAdminToken, uploadNotificationImage, broadcastNotification);
router.get("/notifications", verifyAdminToken, getNotificationHistory);
router.delete("/notifications/:id", verifyAdminToken, deleteNotification);

// ─── Customer Management Routes ──────────────────────────────────────────────
router.get("/customers", verifyAdminToken, getAllCustomers);
router.get("/customers/:id", verifyAdminToken, getCustomerById);
router.patch("/customers/:id/toggle-status", verifyAdminToken, toggleCustomerStatus);

// ─── Order Management & Returns Routes ───────────────────────────────────────
router.get("/orders", verifyAdminToken, getAllOrdersAdmin);
router.get("/orders/:id", verifyAdminToken, getOrderByIdAdmin);
router.put("/orders/:id/status", verifyAdminToken, updateOrderStatusAdmin);
router.put("/orders/:id/approve-return", verifyAdminToken, approveReturn);
router.put("/orders/:id/mark-returned", verifyAdminToken, markReturned);
router.put("/orders/:id/qc-check", verifyAdminToken, qcCheck);

// ─── Staff Management Routes ─────────────────────────────────────────────────
router.post("/create-staff", verifyAdminToken, createStaff);
router.get("/get-staff", verifyAdminToken, getAllStaff);
router.put("/staff/:id", verifyAdminToken, editStaff);
router.patch("/staff/:id/toggle-status", verifyAdminToken, toggleStaffStatus);
router.put("/staff/:id/assign-warehouse", verifyAdminToken, assignWarehouseToStaff);

// ─── Warehouse Management Routes ─────────────────────────────────────────────
router.post("/warehouses", verifyAdminToken, createWarehouse);
router.get("/get-warehouses", verifyAdminToken, getWarehouses);
router.get("/single-warehouses/:id", verifyAdminToken, getWarehouseById);
router.put("/update-warehouses/:id", verifyAdminToken, updateWarehouse);
router.delete("/delete-warehouses/:id", verifyAdminToken, deleteWarehouse);
router.patch("/warehouses/:id/toggle-status", verifyAdminToken, toggleWarehouseStatus);

// ─── Inventory Management Routes ─────────────────────────────────────────────
router.get("/inventory", verifyAdminToken, getInventory);
router.put("/inventory/update", verifyAdminToken, updateStock);

module.exports = router;
