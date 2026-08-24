const express = require("express");
const jwt = require("jsonwebtoken");
const {
  createTicket,
  getCustomerTickets,
  getTicketById,
  customerReply,
  adminReply,
  updateTicketStatus,
  getAllTicketsAdmin,
  deleteTicket,
} = require("../controllers/ticketController");
const { verifyCustomerToken, verifyStaffToken } = require("../middleware/auth");

const router = express.Router();

// Middleware helper to authenticate EITHER Customer OR Admin/Staff
const verifyAnyToken = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (decoded.role === "customer") {
      req.customerId = decoded.id;
    } else {
      // Lazy load models to avoid circular dependencies
      const Admin = require("../models/Admin");
      const Staff = require("../models/Staff");
      let user;

      if (decoded.role === "admin") {
        user = await Admin.findById(decoded.id);
      } else {
        user = await Staff.findById(decoded.id);
        if (user && !user.isActive) {
          return res.status(403).json({
            success: false,
            message: "Forbidden. Account is deactivated.",
          });
        }
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User session not found.",
        });
      }

      req.user = user;
    }
    next();
  } catch (error) {
    console.error("verifyAnyToken Error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired session token.",
    });
  }
};

/**
 * @swagger
 * tags:
 *   - name: Customer - FAQs & Support
 *     description: Frequently Asked Questions & Customer Support Helpdesk endpoints
 */

/**
 * @swagger
 * /tickets/create:
 *   post:
 *     summary: Raise a new support ticket (Customer)
 *     tags: [Customer - FAQs & Support]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject, category, message]
 *             properties:
 *               subject:
 *                 type: string
 *                 example: "Order missing items"
 *               category:
 *                 type: string
 *                 enum: [Payment Issues, Delivery Issues, Refund Requests, Product Feedback, Account Issues, Other]
 *                 example: "Delivery Issues"
 *               priority:
 *                 type: string
 *                 enum: [Low, Medium, High]
 *                 default: Low
 *                 example: "Medium"
 *               message:
 *                 type: string
 *                 description: Initial query / description of the issue
 *                 example: "I ordered 5 items but received only 4. Please refund the missing items."
 *     responses:
 *       201:
 *         description: Ticket raised successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/create", verifyCustomerToken, createTicket);

/**
 * @swagger
 * /tickets:
 *   get:
 *     summary: View own support tickets list (Customer)
 *     tags: [Customer - FAQs & Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Open, In-Progress, Resolved, Closed]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [Payment Issues, Delivery Issues, Refund Requests, Product Feedback, Account Issues, Other]
 *     responses:
 *       200:
 *         description: Customer tickets list retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/", verifyCustomerToken, getCustomerTickets);

router.get("/admin/all", verifyStaffToken, getAllTicketsAdmin);

/**
 * @swagger
 * /tickets/{id}:
 *   get:
 *     summary: Get ticket details and conversation thread (Customer & Admin / Staff)
 *     tags: [Customer - FAQs & Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Full ticket details and messages retrieved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Ticket not found
 */
router.get("/:id", verifyAnyToken, getTicketById);

/**
 * @swagger
 * /tickets/{id}/reply:
 *   post:
 *     summary: Post a reply to a support ticket (Customer)
 *     tags: [Customer - FAQs & Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Any updates on my missing refund?"
 *     responses:
 *       200:
 *         description: Reply posted successfully
 *       400:
 *         description: Closed ticket reply restriction or validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Ticket not found
 */
router.post("/:id/reply", verifyCustomerToken, customerReply);

router.post("/:id/admin-reply", verifyStaffToken, adminReply);

/**
 * @swagger
 * /tickets/{id}/status:
 *   put:
 *     summary: Update ticket status (Customer & Admin / Staff)
 *     tags: [Customer - FAQs & Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Open, In-Progress, Resolved, Closed]
 *                 example: "Closed"
 *     responses:
 *       200:
 *         description: Ticket status updated successfully
 *       400:
 *         description: Unauthorized status transition (e.g. Customer trying to set In-Progress)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Ticket not found
 */
router.put("/:id/status", verifyAnyToken, updateTicketStatus);

/**
 * @swagger
 * /tickets/{id}:
 *   delete:
 *     summary: Delete a support ticket (Customer & Admin / Staff)
 *     tags: [Customer - FAQs & Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Ticket deleted successfully
 *       400:
 *         description: Customer deletion restriction (cannot delete active tickets)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Ticket not found
 */
router.delete("/:id", verifyAnyToken, deleteTicket);

module.exports = router;
