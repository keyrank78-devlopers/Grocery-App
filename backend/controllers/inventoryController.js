const mongoose = require("mongoose");
const Product = require("../models/Product");
const WarehouseStock = require("../models/WarehouseStock");
const Warehouse = require("../models/Warehouse");

// ───────────────────────────────────────────────────────────────
// Get Inventory Data
// GET /api/v1/admin/inventory
// ───────────────────────────────────────────────────────────────
const getInventory = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", category, subCategory, status, warehouseId } = req.query;
    
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};

    if (search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { sku: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (category) filter.category = category;
    if (subCategory) filter.subCategory = subCategory;
    if (status) filter.isActive = status === "active";

    // 1. Get paginated products
    const totalProducts = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate("category", "name category_id")
      .populate("subCategory", "name sub_category_id")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // 2. Fetch stock for these products
    const productIds = products.map((p) => p._id);
    
    const stockQuery = { product: { $in: productIds } };

    // Role-based Access Control
    const restrictedRoles = ["warehouse_manager", "agent"];
    if (restrictedRoles.includes(req.admin.role)) {
      const assignedIds = req.admin.assignedWarehouses ? req.admin.assignedWarehouses.map(w => w._id ? w._id.toString() : w.toString()) : [];
      
      if (warehouseId) {
        if (!assignedIds.includes(warehouseId.toString())) {
           return res.status(403).json({ success: false, message: "Forbidden: You are not assigned to this warehouse" });
        }
        stockQuery.warehouse = warehouseId;
      } else {
        // Only fetch stock for their assigned warehouses
        stockQuery.warehouse = { $in: assignedIds };
      }
    } else {
      // Super Admins / Sub Admins
      if (warehouseId) {
         stockQuery.warehouse = warehouseId;
      }
    }

    const stocks = await WarehouseStock.find(stockQuery)
       .populate("warehouse", "name warehouse_id isActive")
       .lean();

    // 3. Map stocks back to products
    const inventoryData = products.map(product => {
       const productStocks = stocks.filter(s => s.product.toString() === product._id.toString());
       return {
          ...product,
          stocks: productStocks
       };
    });

    return res.status(200).json({
      success: true,
      data: inventoryData,
      pagination: {
        total: totalProducts,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalProducts / limitNum),
      },
    });

  } catch (error) {
    console.error("Get Inventory Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching inventory",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Update Stock for a Product in a Warehouse
// PUT /api/v1/admin/inventory/update
// ───────────────────────────────────────────────────────────────
const updateStock = async (req, res) => {
  try {
    const { productId, warehouseId, quantity } = req.body;

    if (!productId || !warehouseId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "productId, warehouseId, and quantity are required",
      });
    }

    if (Number(quantity) < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock quantity cannot be negative",
      });
    }

    // Role-based Access Control
    const restrictedRoles = ["warehouse_manager", "agent"];
    if (restrictedRoles.includes(req.admin.role)) {
      const assignedIds = req.admin.assignedWarehouses ? req.admin.assignedWarehouses.map(w => w._id ? w._id.toString() : w.toString()) : [];
      if (!assignedIds.includes(warehouseId.toString())) {
        return res.status(403).json({ success: false, message: "Forbidden: You cannot update stock for an unassigned warehouse" });
      }
    }

    // Upsert the stock record
    const stock = await WarehouseStock.findOneAndUpdate(
      { product: productId, warehouse: warehouseId },
      { quantity: Number(quantity) },
      { new: true, upsert: true }
    ).populate("warehouse", "name warehouse_id isActive");

    return res.status(200).json({
      success: true,
      message: "Stock updated successfully",
      data: stock,
    });
  } catch (error) {
    console.error("Update Stock Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error updating stock",
    });
  }
};

module.exports = {
  getInventory,
  updateStock,
};
