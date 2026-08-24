const Ticket = require("../models/Ticket");
const Customer = require("../models/Customer");

// ───────────────────────────────────────────────────────────────
// Create Support Ticket (Customer)
// POST /api/v1/tickets/create
// ───────────────────────────────────────────────────────────────
const createTicket = async (req, res) => {
  try {
    const customerId = req.customerId;
    const { subject, category, message, priority } = req.body;

    if (!subject || !category || !message) {
      return res.status(400).json({
        success: false,
        message: "Subject, category, and initial message are required fields.",
      });
    }

    const customer = await Customer.findById(customerId).select("name").lean();
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found.",
      });
    }

    const newTicket = await Ticket.create({
      customer: customerId,
      subject: subject.trim(),
      category: category,
      priority: priority || "Low",
      status: "Open",
      messages: [
        {
          sender: "Customer",
          senderId: customerId,
          senderName: customer.name || "Customer",
          message: message.trim(),
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Ticket raised successfully.",
      data: newTicket,
    });
  } catch (error) {
    console.error("Create Ticket Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Get All Tickets for Logged-in Customer (Paginated)
// GET /api/v1/tickets
// ───────────────────────────────────────────────────────────────
const getCustomerTickets = async (req, res) => {
  try {
    const customerId = req.customerId;
    const { page = 1, limit = 10, status, category } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const query = { customer: customerId };
    if (status) query.status = status;
    if (category) query.category = category;

    const [tickets, total] = await Promise.all([
      Ticket.find(query)
        .select("-messages") // Exclude messages array in lists to keep response lightweight
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Ticket.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: tickets,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get Customer Tickets Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Get Ticket Details and Full Thread (Customer & Admin/Staff)
// GET /api/v1/tickets/:id
// ───────────────────────────────────────────────────────────────
const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.customerId; // Defined if request passes verifyCustomerToken
    const adminUser = req.user;        // Defined if request passes verifyStaffToken

    const ticket = await Ticket.findById(id)
      .populate("customer", "name mobile email")
      .lean();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found.",
      });
    }

    // Authorization: Customer can only view their own tickets. Admin/Staff can view any ticket.
    if (customerId && ticket.customer._id.toString() !== customerId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. Access to this ticket is denied.",
      });
    }

    return res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error("Get Ticket By Id Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Reply to Ticket (Customer)
// POST /api/v1/tickets/:id/reply
// ───────────────────────────────────────────────────────────────
const customerReply = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.customerId;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message content is required.",
      });
    }

    const ticket = await Ticket.findOne({ _id: id, customer: customerId });
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found.",
      });
    }

    if (ticket.status === "Closed") {
      return res.status(400).json({
        success: false,
        message: "This ticket is closed. Please raise a new ticket for further assistance.",
      });
    }

    const customer = await Customer.findById(customerId).select("name").lean();

    // Push message to thread
    ticket.messages.push({
      sender: "Customer",
      senderId: customerId,
      senderName: customer.name || "Customer",
      message: message.trim(),
    });

    // If ticket was resolved, reopen it to Open
    if (ticket.status === "Resolved") {
      ticket.status = "Open";
    }

    await ticket.save();

    return res.status(200).json({
      success: true,
      message: "Reply posted successfully.",
      data: ticket,
    });
  } catch (error) {
    console.error("Customer Reply Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Reply to Ticket (Admin / Staff)
// POST /api/v1/tickets/:id/admin-reply
// ───────────────────────────────────────────────────────────────
const adminReply = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUser = req.user; // populated by verifyStaffToken (Admin or Staff)
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message content is required.",
      });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found.",
      });
    }

    // Push admin/staff reply
    ticket.messages.push({
      sender: adminUser.role === "admin" ? "Admin" : "Staff",
      senderId: adminUser._id,
      senderName: adminUser.name || "Customer Support",
      message: message.trim(),
    });

    // Update status to In-Progress when admin responds
    if (ticket.status === "Open") {
      ticket.status = "In-Progress";
    }

    await ticket.save();

    return res.status(200).json({
      success: true,
      message: "Reply posted successfully.",
      data: ticket,
    });
  } catch (error) {
    console.error("Admin Reply Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Update Ticket Status (Admin/Staff/Customer)
// PUT /api/v1/tickets/:id/status
// ───────────────────────────────────────────────────────────────
const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const customerId = req.customerId; // From verifyCustomerToken
    const adminUser = req.user;        // From verifyStaffToken

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status parameter is required.",
      });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found.",
      });
    }

    if (customerId) {
      // Authorization Check
      if (ticket.customer.toString() !== customerId) {
        return res.status(403).json({
          success: false,
          message: "Forbidden. Access denied.",
        });
      }

      // Customer can ONLY set status to Closed
      if (status !== "Closed") {
        return res.status(400).json({
          success: false,
          message: "Customers can only change ticket status to 'Closed'.",
        });
      }
    } else if (adminUser) {
      // Admin/Staff can set status to any enum
      const validStatuses = ["Open", "In-Progress", "Resolved", "Closed"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status code provided.",
        });
      }
    } else {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    ticket.status = status;
    await ticket.save();

    return res.status(200).json({
      success: true,
      message: `Ticket status successfully updated to '${status}'.`,
      data: ticket,
    });
  } catch (error) {
    console.error("Update Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Get All System Tickets (Admin / Staff - Paginated)
// GET /api/v1/tickets/admin/all
// ───────────────────────────────────────────────────────────────
const getAllTicketsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, priority, category } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;

    const [tickets, total] = await Promise.all([
      Ticket.find(query)
        .populate("customer", "name mobile email")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Ticket.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: tickets,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get All Tickets Admin Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Delete Support Ticket (Customer & Admin)
// DELETE /api/v1/tickets/:id
// ───────────────────────────────────────────────────────────────
const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.customerId; // From verifyCustomerToken
    const adminUser = req.user;        // From verifyStaffToken

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found.",
      });
    }

    if (customerId) {
      // Authorization
      if (ticket.customer.toString() !== customerId) {
        return res.status(403).json({
          success: false,
          message: "Forbidden. Access denied.",
        });
      }

      // Customer can only delete if the ticket is Open (unresponded) or Closed
      if (ticket.status !== "Open" && ticket.status !== "Closed") {
        return res.status(400).json({
          success: false,
          message: "You cannot delete a ticket that is currently In-Progress or Resolved.",
        });
      }
    }

    await ticket.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Support ticket deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Ticket Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createTicket,
  getCustomerTickets,
  getTicketById,
  customerReply,
  adminReply,
  updateTicketStatus,
  getAllTicketsAdmin,
  deleteTicket,
};
