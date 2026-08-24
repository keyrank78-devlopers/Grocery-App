const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer reference is required"],
    },
    ticketId: {
      type: String,
      unique: true,
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Payment Issues",
        "Delivery Issues",
        "Refund Requests",
        "Product Feedback",
        "Account Issues",
        "Other",
      ],
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low",
    },
    status: {
      type: String,
      enum: ["Open", "In-Progress", "Resolved", "Closed"],
      default: "Open",
    },
    messages: [
      {
        sender: {
          type: String,
          enum: ["Customer", "Admin", "Staff"],
          required: true,
        },
        senderId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        senderName: {
          type: String,
          required: true,
        },
        message: {
          type: String,
          required: [true, "Message content is required"],
          trim: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// Indexes for fast querying
ticketSchema.index({ customer: 1 });
ticketSchema.index({ status: 1 });

// Pre-save hook to generate readable ticketId (e.g. TKT-0001)
ticketSchema.pre("save", async function () {
  if (this.isNew) {
    const count = await mongoose.model("Ticket").countDocuments();
    const formattedCount = String(count + 1).padStart(4, "0");
    this.ticketId = `TKT-${formattedCount}`;
  }
});

module.exports = mongoose.model("Ticket", ticketSchema);
