const Order = require("../models/Order");
const Customer = require("../models/Customer");
const Staff = require("../models/Staff");
const Warehouse = require("../models/Warehouse");
const mongoose = require("mongoose");

// ───────────────────────────────────────────────────────────────
// Get Admin Dashboard Analytics
// GET /api/v1/admin/dashboard
// ───────────────────────────────────────────────────────────────
const getDashboardAnalytics = async (req, res) => {
  try {
    // Role-based Access Control
    const restrictedRoles = ["warehouse_manager", "agent"];
    const user = req.admin || req.user;
    
    let orderMatch = {};
    let warehouseMatch = {};

    if (restrictedRoles.includes(user?.role)) {
      const assignedIds = user.assignedWarehouses ? user.assignedWarehouses.map(w => new mongoose.Types.ObjectId(w._id ? w._id.toString() : w.toString())) : [];
      orderMatch.assignedWarehouse = { $in: assignedIds };
      warehouseMatch._id = { $in: assignedIds };
    }

    // 1. Fetch Global System Stats (Parallel queries to avoid blocking)
    const [
      totalCustomers,
      totalOrdersCount,
      orderAggregations
    ] = await Promise.all([
      Customer.countDocuments(),
      Order.countDocuments(orderMatch),
      Order.aggregate([
        { $match: orderMatch },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: {
                $cond: [{ $eq: ["$orderStatus", "Delivered"] }, "$pricing.totalPrice", 0]
              }
            },
            totalReturns: {
              $sum: {
                $cond: [{ $in: ["$orderStatus", ["Return Requested", "Return Approved", "Returned", "Refunded"]] }, 1, 0]
              }
            }
          }
        }
      ])
    ]);

    const systemStats = {
      totalCustomers,
      totalOrders: totalOrdersCount,
      totalRevenue: orderAggregations[0]?.totalRevenue || 0,
      totalReturns: orderAggregations[0]?.totalReturns || 0,
    };

    // 2. Fetch Warehouse Specific Stats efficiently (No N+1 queries)
    const [warehouses, staffStats, orderStats] = await Promise.all([
      Warehouse.find(warehouseMatch).select("name status").lean(),
      Staff.aggregate([
        { $match: { assignedWarehouses: { $ne: [], $exists: true } } },
        { $unwind: "$assignedWarehouses" },
        { $match: restrictedRoles.includes(user?.role) ? { assignedWarehouses: { $in: orderMatch.assignedWarehouse.$in } } : {} },
        {
          $group: {
            _id: "$assignedWarehouses",
            totalStaff: { $sum: 1 },
            agents: { $sum: { $cond: [{ $eq: ["$role", "agent"] }, 1, 0] } },
            managers: { $sum: { $cond: [{ $eq: ["$role", "warehouse_manager"] }, 1, 0] } }
          }
        }
      ]),
      Order.aggregate([
        { $match: { ...orderMatch, assignedWarehouse: { $ne: null } } },
        {
          $group: {
            _id: "$assignedWarehouse",
            totalOrders: { $sum: 1 },
            pendingOrders: {
              $sum: {
                $cond: [
                  { $in: ["$orderStatus", ["Pending", "Placed", "Accepted", "Processing", "Out for Delivery"]] },
                  1,
                  0
                ]
              }
            },
            deliveredOrders: {
              $sum: { $cond: [{ $eq: ["$orderStatus", "Delivered"] }, 1, 0] }
            }
          }
        }
      ])
    ]);

    // O(N) Map lookups for fast merging
    const staffMap = {};
    staffStats.forEach(stat => {
      staffMap[stat._id.toString()] = stat;
    });

    const orderMap = {};
    orderStats.forEach(stat => {
      orderMap[stat._id.toString()] = stat;
    });

    const warehouseAnalytics = warehouses.map(wh => {
      const wId = wh._id.toString();
      const sStat = staffMap[wId] || { totalStaff: 0, agents: 0, managers: 0 };
      const oStat = orderMap[wId] || { totalOrders: 0, pendingOrders: 0, deliveredOrders: 0 };

      return {
        id: wId,
        name: wh.name,
        status: wh.status,
        staffAllocated: sStat.totalStaff,
        agentsCount: sStat.agents,
        managersCount: sStat.managers,
        ordersHandled: oStat.totalOrders,
        pendingOrders: oStat.pendingOrders,
        deliveredOrders: oStat.deliveredOrders
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        systemStats,
        warehouseAnalytics,
      },
    });
  } catch (error) {
    console.error("Dashboard Analytics Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  getDashboardAnalytics,
};
