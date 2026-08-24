const Policy = require("../models/Policy");

// Default Privacy Policy content template for Grocery App
const DEFAULT_PRIVACY_POLICY = {
  type: "privacy_policy",
  title: "Privacy Policy",
  content: `
# Privacy Policy for Grocery App

Last updated: August 2026

## 1. Information We Collect
We collect personal information that you provide directly to us when registering, placing an order, or contacting customer support. This includes:
- **Personal Identifier Data**: Name, phone number, email address.
- **Delivery Address Details**: Street address, city, state, pincode, geo-coordinates.
- **Transaction & Order History**: Products purchased, order value, payment method (COD, Online, Wallet).

## 2. How We Use Your Information
We use the collected information to:
- Process and fulfill your grocery orders.
- Assign nearest serviceable warehouse and coordinate fast delivery.
- Process payments and wallet top-ups securely.
- Send SMS/OTP notifications regarding order status and account security.

## 3. Data Protection & Security
We implement strict industry-standard security measures (SSL/TLS encryption, JWT authentication, hashed passwords) to protect your personal information against unauthorized access, loss, or alteration.

## 4. Sharing of Information
We do not sell or rent your personal data to third parties. Information is only shared with:
- Payment gateway providers (e.g. Razorpay) for transaction processing.
- Delivery agents and warehouse staff solely for fulfilling your orders.

## 5. Contact Us
If you have any questions or concerns about this Privacy Policy, please contact our support team at support@groceryapp.com.
  `.trim(),
};

// ─── Get Privacy Policy (Public) ─────────────────────────────────────────────
const getPrivacyPolicy = async (req, res) => {
  try {
    let policy = await Policy.findOne({ type: "privacy_policy" }).populate("updatedBy", "name email");

    if (!policy) {
      return res.status(200).json({
        success: true,
        data: DEFAULT_PRIVACY_POLICY,
      });
    }

    return res.status(200).json({
      success: true,
      data: policy,
    });
  } catch (error) {
    console.error("Get Privacy Policy Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching privacy policy.",
    });
  }
};

// ─── Get Any Policy by Type (Public) ─────────────────────────────────────────
const getPolicyByType = async (req, res) => {
  try {
    const { type } = req.params;

    const allowedTypes = ["privacy_policy", "terms_conditions", "about_us", "refund_policy", "shipping_policy"];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid policy type. Supported types: ${allowedTypes.join(", ")}`,
      });
    }

    let policy = await Policy.findOne({ type }).populate("updatedBy", "name email");

    if (!policy && type === "privacy_policy") {
      return res.status(200).json({
        success: true,
        data: DEFAULT_PRIVACY_POLICY,
      });
    }

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: `Policy for '${type}' has not been set yet.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: policy,
    });
  } catch (error) {
    console.error("Get Policy Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching policy.",
    });
  }
};

// ─── Create / Update Policy (Admin Only) ─────────────────────────────────────
const updatePolicy = async (req, res) => {
  try {
    const { type, title, content } = req.body;
    const adminId = req.admin?._id;

    if (!type || !title || !content) {
      return res.status(400).json({
        success: false,
        message: "type, title, and content are required.",
      });
    }

    const allowedTypes = ["privacy_policy", "terms_conditions", "about_us", "refund_policy", "shipping_policy"];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid policy type. Supported types: ${allowedTypes.join(", ")}`,
      });
    }

    const policy = await Policy.findOneAndUpdate(
      { type },
      {
        type,
        title,
        content,
        updatedBy: adminId,
      },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: `${title} updated successfully.`,
      data: policy,
    });
  } catch (error) {
    console.error("Update Policy Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating policy.",
    });
  }
};

module.exports = {
  getPrivacyPolicy,
  getPolicyByType,
  updatePolicy,
};
