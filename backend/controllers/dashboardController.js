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

// ───────────────────────────────────────────────────────────────
// Get Revenue Analytics
// GET /api/v1/admin/revenue
// ───────────────────────────────────────────────────────────────
const getRevenueAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, warehouseId } = req.query;

    const matchStage = {
      orderStatus: "Delivered",
      "paymentInfo.status": "Paid",
    };

    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
      };
    }

    const restrictedRoles = ["warehouse_manager", "agent"];
    const user = req.admin || req.user;
    
    if (user && restrictedRoles.includes(user.role)) {
      const assignedIds = user.assignedWarehouses ? user.assignedWarehouses.map(w => new mongoose.Types.ObjectId(w._id ? w._id.toString() : w.toString())) : [];
      if (warehouseId && assignedIds.some(id => id.toString() === warehouseId)) {
        matchStage.assignedWarehouse = new mongoose.Types.ObjectId(warehouseId);
      } else {
        matchStage.assignedWarehouse = { $in: assignedIds };
      }
    } else {
      if (warehouseId) {
        matchStage.assignedWarehouse = new mongoose.Types.ObjectId(warehouseId);
      }
    }

    // 1. Total Revenue and Payment Method Split
    const summaryAgg = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$pricing.totalPrice" },
          totalOrders: { $sum: 1 },
          codRevenue: {
            $sum: { $cond: [{ $eq: ["$paymentInfo.method", "COD"] }, "$pricing.totalPrice", 0] }
          },
          onlineRevenue: {
            $sum: { $cond: [{ $eq: ["$paymentInfo.method", "Online"] }, "$pricing.totalPrice", 0] }
          },
          walletRevenue: {
            $sum: { $cond: [{ $eq: ["$paymentInfo.method", "Wallet"] }, "$pricing.totalPrice", 0] }
          }
        }
      }
    ]);

    // 2. Daily Timeline
    const timelineAgg = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "+05:30" } },
          revenue: { $sum: "$pricing.totalPrice" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 3. Top Products
    const topProductsAgg = await Order.aggregate([
      { $match: matchStage },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          totalSold: { $sum: "$items.quantity" },
          revenueGenerated: { $sum: { $multiply: ["$items.sellPrice", "$items.quantity"] } }
        }
      },
      { $sort: { revenueGenerated: -1 } },
      { $limit: 10 }
    ]);

    const summary = summaryAgg[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      codRevenue: 0,
      onlineRevenue: 0,
      walletRevenue: 0
    };

    return res.status(200).json({
      success: true,
      data: {
        summary,
        timeline: timelineAgg.map(t => ({ date: t._id, revenue: t.revenue, orders: t.orders })),
        topProducts: topProductsAgg.map(p => ({
          productId: p._id,
          name: p.name,
          totalSold: p.totalSold,
          revenueGenerated: p.revenueGenerated
        }))
      }
    });

  } catch (error) {
    console.error("Get Revenue Analytics Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  getDashboardAnalytics,
  getRevenueAnalytics,
};
