const Notification = require("../models/Notification");

// ─── Get Customer Notifications ──────────────────────────────────────────────
// GET /api/v1/notifications
const getCustomerNotifications = async (req, res) => {
  try {
    const customerId = req.customerId;

    // Fetch both personal notifications and global broadcast notifications
    const notifications = await Notification.find({
      $or: [{ customerId }, { isGlobal: true }],
    })
      .sort({ createdAt: -1 })
      .limit(50); // Limit to latest 50 notifications to optimize performance

    return res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error("Get Notifications Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  getCustomerNotifications,
};
