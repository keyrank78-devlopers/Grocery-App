const Faq = require("../models/Faq");

// Default initial FAQs list for Grocery App storefront
const DEFAULT_FAQS = [
  {
    question: "How fast is grocery delivery?",
    answer: "Orders are delivered from the nearest serviceable warehouse within 15-30 minutes of placing the order.",
    category: "Delivery",
    displayOrder: 1,
  },
  {
    question: "What payment methods are accepted?",
    answer: "We accept Cash on Delivery (COD), In-App Wallet payments, and Online payments via UPI, Credit/Debit Cards, and Net Banking.",
    category: "Payments",
    displayOrder: 2,
  },
  {
    question: "How do I cancel my order?",
    answer: "You can cancel your order directly from the 'My Orders' section before the order status changes to 'Out for Delivery'. For paid orders, the amount is instantly refunded to your app Wallet.",
    category: "Orders",
    displayOrder: 3,
  },
  {
    question: "How does the Return / Refund policy work?",
    answer: "If you receive damaged or incorrect grocery items, you can request a return within 5 days of delivery. Once verified, refunds are credited to your app Wallet.",
    category: "Refunds",
    displayOrder: 4,
  },
  {
    question: "Is there a minimum order amount?",
    answer: "No, there is no minimum order value. However, free delivery may apply on orders above a specified threshold.",
    category: "General",
    displayOrder: 5,
  },
];

// ─── Get Active FAQs (Public Endpoint) ───────────────────────────────────────
const getFaqs = async (req, res) => {
  try {
    const { category, search } = req.query;

    const filter = { isActive: true };
    if (category) {
      filter.category = new RegExp(`^${category.trim()}$`, "i");
    }
    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [{ question: searchRegex }, { answer: searchRegex }];
    }

    let faqs = await Faq.find(filter).sort({ displayOrder: 1, createdAt: -1 });

    // If no FAQs in DB and no filter applied, return DEFAULT_FAQS template
    if (faqs.length === 0 && !category && !search) {
      return res.status(200).json({
        success: true,
        data: DEFAULT_FAQS,
      });
    }

    return res.status(200).json({
      success: true,
      data: faqs,
    });
  } catch (error) {
    console.error("Get FAQs Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching FAQs.",
    });
  }
};

// ─── Get FAQ Categories (Public Endpoint) ────────────────────────────────────
const getFaqCategories = async (req, res) => {
  try {
    const categories = await Faq.distinct("category", { isActive: true });
    const defaultCategories = ["General", "Delivery", "Payments", "Orders", "Refunds"];
    const merged = Array.from(new Set([...defaultCategories, ...categories]));

    return res.status(200).json({
      success: true,
      data: merged,
    });
  } catch (error) {
    console.error("Get FAQ Categories Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching FAQ categories.",
    });
  }
};

// ─── Get All FAQs (Admin — includes inactive) ────────────────────────────────
const getAllFaqsAdmin = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};
    if (category) filter.category = new RegExp(`^${category.trim()}$`, "i");
    if (search) {
      const rx = new RegExp(search.trim(), "i");
      filter.$or = [{ question: rx }, { answer: rx }];
    }

    let faqs = await Faq.find(filter).sort({ displayOrder: 1, createdAt: -1 });

    // If DB is empty and no filter applied, auto-seed DEFAULT_FAQS into DB
    if (faqs.length === 0 && !category && !search) {
      faqs = await Faq.insertMany(DEFAULT_FAQS);
    }

    return res.status(200).json({ success: true, data: faqs });
  } catch (error) {
    console.error("Get All FAQs Admin Error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ─── Create FAQ (Admin Only) ──────────────────────────────────────────────────
const createFaq = async (req, res) => {
  try {
    const { question, answer, category = "General", displayOrder = 0 } = req.body;
    const adminId = req.admin?._id;

    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: "question and answer fields are required.",
      });
    }

    const faq = await Faq.create({
      question,
      answer,
      category,
      displayOrder,
      createdBy: adminId,
    });

    return res.status(201).json({
      success: true,
      message: "FAQ created successfully.",
      data: faq,
    });
  } catch (error) {
    console.error("Create FAQ Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while creating FAQ.",
    });
  }
};

// ─── Update FAQ (Admin Only) ──────────────────────────────────────────────────
const updateFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, category, displayOrder, isActive } = req.body;

    const faq = await Faq.findById(id);
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found.",
      });
    }

    if (question !== undefined) faq.question = question;
    if (answer !== undefined) faq.answer = answer;
    if (category !== undefined) faq.category = category;
    if (displayOrder !== undefined) faq.displayOrder = displayOrder;
    if (isActive !== undefined) faq.isActive = isActive;

    await faq.save();

    return res.status(200).json({
      success: true,
      message: "FAQ updated successfully.",
      data: faq,
    });
  } catch (error) {
    console.error("Update FAQ Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating FAQ.",
    });
  }
};

// ─── Delete FAQ (Admin Only) ──────────────────────────────────────────────────
const deleteFaq = async (req, res) => {
  try {
    const { id } = req.params;

    const faq = await Faq.findByIdAndDelete(id);
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "FAQ deleted successfully.",
    });
  } catch (error) {
    console.error("Delete FAQ Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting FAQ.",
    });
  }
};

// ─── Toggle FAQ Status (Admin Only) ───────────────────────────────────────────
const toggleFaqStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const faq = await Faq.findById(id);
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found.",
      });
    }

    faq.isActive = !faq.isActive;
    await faq.save();

    return res.status(200).json({
      success: true,
      message: `FAQ ${faq.isActive ? "activated" : "deactivated"} successfully.`,
      data: faq,
    });
  } catch (error) {
    console.error("Toggle FAQ Status Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while toggling FAQ status.",
    });
  }
};

module.exports = {
  getFaqs,
  getFaqCategories,
  getAllFaqsAdmin,
  createFaq,
  updateFaq,
  deleteFaq,
  toggleFaqStatus,
};
