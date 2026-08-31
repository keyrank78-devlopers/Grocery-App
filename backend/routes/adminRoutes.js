const express = require("express");
const { uploadNotificationImage } = require("../config/cloudinary");
const { createStaff, getAllStaff, editStaff, toggleStaffStatus, assignWarehouseToStaff } = require("../controllers/staffController");
const { verifyAdminToken, verifyStaffToken, checkPermission } = require("../middleware/auth");
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
router.get("/dashboard", verifyStaffToken, checkPermission("dashboard", "canView"), getDashboardAnalytics);

// ─── Notification Routes ─────────────────────────────────────────────────────
router.post("/notifications/broadcast", verifyAdminToken, uploadNotificationImage, broadcastNotification);

// ─── Notification Routes ─────────────────────────────────────────────────────
router.post("/notifications/broadcast", verifyStaffToken, checkPermission("notifications", "canEdit"), uploadNotificationImage, broadcastNotification);
router.get("/notifications", verifyStaffToken, checkPermission("notifications", "canView"), getNotificationHistory);
router.delete("/notifications/:id", verifyStaffToken, checkPermission("notifications", "canDelete"), deleteNotification);

// ─── Customer Management Routes ──────────────────────────────────────────────
router.get("/customers", verifyStaffToken, checkPermission("customers", "canView"), getAllCustomers);
router.get("/customers/:id", verifyStaffToken, checkPermission("customers", "canView"), getCustomerById);
router.patch("/customers/:id/toggle-status", verifyStaffToken, checkPermission("customers", "canEdit"), toggleCustomerStatus);

// ─── Order Management & Returns Routes ───────────────────────────────────────
router.get("/orders", verifyStaffToken, checkPermission("orders", "canView"), getAllOrdersAdmin);
router.get("/orders/:id", verifyStaffToken, checkPermission("orders", "canView"), getOrderByIdAdmin);
router.put("/orders/:id/status", verifyStaffToken, checkPermission("orders", "canEdit"), updateOrderStatusAdmin);
router.put("/orders/:id/approve-return", verifyStaffToken, checkPermission("orders", "canEdit"), approveReturn);
router.put("/orders/:id/mark-returned", verifyStaffToken, checkPermission("orders", "canEdit"), markReturned);
router.put("/orders/:id/qc-check", verifyStaffToken, checkPermission("orders", "canEdit"), qcCheck);

// ─── Staff Management Routes ─────────────────────────────────────────────────
router.post("/create-staff", verifyStaffToken, checkPermission("staff", "canEdit"), createStaff);
router.get("/get-staff", verifyStaffToken, checkPermission("staff", "canView"), getAllStaff);
router.put("/staff/:id", verifyStaffToken, checkPermission("staff", "canEdit"), editStaff);
router.patch("/staff/:id/toggle-status", verifyStaffToken, checkPermission("staff", "canEdit"), toggleStaffStatus);
router.put("/staff/:id/assign-warehouse", verifyStaffToken, checkPermission("staff", "canEdit"), assignWarehouseToStaff);

// ─── Warehouse Management Routes ─────────────────────────────────────────────
router.post("/warehouses", verifyStaffToken, checkPermission("warehouses", "canEdit"), createWarehouse);
router.get("/get-warehouses", verifyStaffToken, checkPermission("warehouses", "canView"), getWarehouses);
router.get("/single-warehouses/:id", verifyStaffToken, checkPermission("warehouses", "canView"), getWarehouseById);
router.put("/update-warehouses/:id", verifyStaffToken, checkPermission("warehouses", "canEdit"), updateWarehouse);
router.delete("/delete-warehouses/:id", verifyStaffToken, checkPermission("warehouses", "canDelete"), deleteWarehouse);
router.patch("/warehouses/:id/toggle-status", verifyStaffToken, checkPermission("warehouses", "canEdit"), toggleWarehouseStatus);

// ─── Inventory Management Routes ─────────────────────────────────────────────
router.get("/inventory", verifyStaffToken, checkPermission("inventory", "canView"), getInventory);
router.put("/inventory/update", verifyStaffToken, checkPermission("inventory", "canEdit"), updateStock);

module.exports = router;
