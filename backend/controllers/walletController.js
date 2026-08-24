const Customer = require("../models/Customer");
const WalletTransaction = require("../models/WalletTransaction");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "dummy_key",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "dummy_secret",
  });
};

// ───────────────────────────────────────────────────────────────
// Get Wallet Balance and History
// GET /api/v1/wallet/balance
// ───────────────────────────────────────────────────────────────
// ───────────────────────────────────────────────────────────────
// ───────────────────────────────────────────────────────────────
// Get Wallet Balance and History (Paginated & Filterable)
// GET /api/v1/wallet/balance
// ───────────────────────────────────────────────────────────────
const getWalletBalance = async (req, res) => {
  try {
    const customerId = req.customerId;
    const { page = 1, limit = 10, type, search = "" } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const customer = await Customer.findById(customerId).select("walletBalance customer_id name").lean();

    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const filter = { customer: customer._id };

    if (type && ["Credit", "Debit"].includes(type)) {
      filter.type = type;
    }

    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { description: searchRegex },
        { transactionId: searchRegex },
      ];
    }

    const [transactions, total] = await Promise.all([
      WalletTransaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      WalletTransaction.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        balance: customer.walletBalance || 0,
        transactions,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("Get Wallet Balance Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ───────────────────────────────────────────────────────────────
// Top Up Wallet (Initialize Payment)
// POST /api/v1/wallet/topup
// ───────────────────────────────────────────────────────────────
const topUpWallet = async (req, res) => {
  try {
    const customerId = req.customerId;
    const { amount } = req.body;

    if (!amount || amount < 10) {
      return res.status(400).json({ success: false, message: "Minimum top-up amount is ₹10" });
    }

    const customer = await Customer.findOne({ customer_id: customerId });
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const razorpay = getRazorpayInstance();
    const orderOptions = {
      amount: Math.round(amount * 100), // convert to paise
      currency: "INR",
      receipt: `topup_${customer.customer_id}_${Date.now()}`,
    };

    const razorpayOrder = await razorpay.orders.create(orderOptions);

    return res.status(200).json({
      success: true,
      message: "Top-up initialized",
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error("Top-up Initialization Error:", error);
    return res.status(500).json({ success: false, message: "Failed to initialize payment gateway order" });
  }
};

// ───────────────────────────────────────────────────────────────
// Verify Top Up
// POST /api/v1/wallet/verify-topup
// ───────────────────────────────────────────────────────────────
const verifyTopUp = async (req, res) => {
  try {
    const customerId = req.customerId;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !amount) {
      return res.status(400).json({ success: false, message: "Missing payment parameters" });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    const customer = await Customer.findOne({ customer_id: customerId });
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    // Check if this transactionId is already processed to prevent double-counting
    const existingTransaction = await WalletTransaction.findOne({ transactionId: razorpay_payment_id });
    if (existingTransaction) {
      return res.status(400).json({ success: false, message: "Payment already verified" });
    }

    // Add money to wallet
    customer.walletBalance += amount;
    await customer.save();

    // Log transaction
    const transaction = await WalletTransaction.create({
      customer: customer._id,
      amount,
      type: "Credit",
      description: "Wallet Top-up via Razorpay",
      transactionId: razorpay_payment_id,
    });

    return res.status(200).json({
      success: true,
      message: "Wallet topped up successfully",
      data: {
        balance: customer.walletBalance,
        transaction,
      },
    });
  } catch (error) {
    console.error("Verify Top-up Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  getWalletBalance,
  topUpWallet,
  verifyTopUp,
};
