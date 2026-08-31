const Order = require("../models/Order");
const WarehouseStock = require("../models/WarehouseStock");

/**
 * Starts a background scheduler (using setInterval) that runs every 5 minutes
 * to automatically cancel pending online orders that have not been paid within 6 minutes.
 * When an order is cancelled, its reserved product stock is restored.
 */
const startPendingOrderCleanup = () => {
  // Run every 5 minutes (300000 ms)
  setInterval(async () => {
    try {
      const expirationWindow = 6 * 60 * 1000; // 6 minutes timeout
      const expiredTime = new Date(Date.now() - expirationWindow);
      
      // Find orders that are still "Pending" online payment after 6 minutes
      const expiredOrders = await Order.find({
        orderStatus: "Pending",
        "paymentInfo.method": "Online",
        createdAt: { $lt: expiredTime }
      });

      if (expiredOrders.length > 0) {
        console.log(`[Scheduler] Found ${expiredOrders.length} expired pending online orders. Starting cancellation...`);

        for (const order of expiredOrders) {
          // Revert stock for each item in the expired order
          for (const item of order.items) {
            if (order.assignedWarehouse) {
              await WarehouseStock.findOneAndUpdate(
                { product: item.product, warehouse: order.assignedWarehouse },
                { $inc: { quantity: item.quantity } }
              );
            }
          }

          // Cancel the order
          order.orderStatus = "Cancelled";
          order.paymentInfo.status = "Failed";
          order.history.push({
            status: "Cancelled",
            message: "Order cancelled automatically due to payment timeout (6 minutes elapsed without completion).",
          });

          await order.save();
          console.log(`[Scheduler] Successfully cancelled expired order: ${order.order_id}`);
        }
      }
    } catch (error) {
      console.error("[Scheduler] Error in pending order cleanup task:", error);
    }
  }, 5 * 60 * 1000); // 5 minutes
};

module.exports = {
  startPendingOrderCleanup,
};
