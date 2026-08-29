const express = require("express");
const { getCustomerNotifications } = require("../controllers/notificationController");
const { verifyCustomerToken } = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get customer's notification history
 *     description: Retrieve all notifications for the logged-in customer (including global broadcasts).
 *     tags: [Customer - Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/", verifyCustomerToken, getCustomerNotifications);

module.exports = router;
