const Customer = require("../models/Customer");
const OTP = require("../models/OTP");
const Cart = require("../models/Cart");
const generateTokens = require("../utils/generateTokens");
const generateCustomId = require("../utils/generateCustomId");

const generate6DigitOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ─── Send OTP ─────────────────────────────────────────────
// POST /api/auth/customer/send-otp
const sendOTP = async (req, res) => {
  try {
    const { mobile, name } = req.body;

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required",
      });
    }

    const normalizedMobile = mobile.trim();

    const customer = await Customer.findOne({
      mobile: normalizedMobile,
    })
      .select("_id")
      .lean();

    const otp = generate6DigitOTP();

    await OTP.findOneAndUpdate(
      {
        mobile: normalizedMobile,
      },
      {
        otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
      {
        upsert: true,
      },
    );

    console.log(`[OTP] Mobile: ${normalizedMobile} OTP: ${otp}`);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      otp: process.env.NODE_ENV === "production" ? undefined : otp,
    });
  } catch (error) {
    console.error("Send OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ─── Verify OTP ───────────────────────────────────────────
// POST /api/auth/customer/verify-otp
const verifyOTP = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({
        success: false,
        message: "Mobile number and OTP are required",
      });
    }

    const normalizedMobile = mobile.trim();

    const otpDoc = await OTP.findOne({
      mobile: normalizedMobile,
    });

    if (!otpDoc || otpDoc.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (Date.now() > otpDoc.expiresAt.getTime()) {
      await OTP.deleteOne({
        mobile: normalizedMobile,
      });

      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    // Delete OTP
    await OTP.deleteOne({
      mobile: normalizedMobile,
    });

    let customer = await Customer.findOne({
      mobile: normalizedMobile,
    });

    if (!customer) {
      const customer_id = await generateCustomId("Customer", "CUS");

      customer = await Customer.create({
        customer_id,
        name: "",
        mobile: normalizedMobile,
      });
    }

    if (!customer.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account inactive",
      });
    }

    const { accessToken, refreshToken } = generateTokens(
      customer._id,
      "customer",
    );

    await Customer.updateOne(
      {
        _id: customer._id,
      },
      {
        refreshToken,
      },
    );

    // Automatic Cart Merge
    const { guestId } = req.body;
    if (guestId) {
      try {
        const guestCart = await Cart.findOne({ guestId });
        if (guestCart && guestCart.items.length > 0) {
          let customerCart = await Cart.findOne({ customer: customer._id });
          if (!customerCart) {
            customerCart = new Cart({ customer: customer._id, items: [] });
          }

          for (const guestItem of guestCart.items) {
            const existingItem = customerCart.items.find(
              (item) => item.product.toString() === guestItem.product.toString()
            );
            if (existingItem) {
              existingItem.quantity += guestItem.quantity;
            } else {
              customerCart.items.push({
                product: guestItem.product,
                quantity: guestItem.quantity,
              });
            }
          }

          await customerCart.save();
          await Cart.deleteOne({ _id: guestCart._id });
          console.log(`[Cart] Automatically merged guest cart (${guestId}) into customer (${customer._id})`);
        }
      } catch (mergeError) {
        console.error("Automatic Cart Merge Error during Login:", mergeError.message);
      }
    }

    return res.status(200).json({
      success: true,

      message: "Login successful",

      data: {
        user: {
          id: customer._id,
          customer_id: customer.customer_id,
          name: customer.name,
          email: customer.email,
          mobile: customer.mobile,
          role: "customer",
        },

        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ─── Get Customer Profile ───────────────────────────────────
// GET /api/auth/customer/me
const getCustomerProfile = async (req, res) => {
  try {
    const customerId = req.customerId; // populated by verifyCustomerToken
    const customer = await Customer.findById(customerId).select("-refreshToken -__v");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: customer._id,
          customer_id: customer.customer_id,
          name: customer.name,
          email: customer.email,
          mobile: customer.mobile,
          role: "customer",
        },
      },
    });
  } catch (error) {
    console.error("Get Customer Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ─── Update Customer Profile ────────────────────────────────
// PUT /api/auth/customer/update-profile
const updateCustomerProfile = async (req, res) => {
  try {
    const customerId = req.customerId; // populated by verifyCustomerToken
    const { name, email } = req.body;

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (name) customer.name = name.trim();
    if (email !== undefined) customer.email = email.trim();

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          id: customer._id,
          customer_id: customer.customer_id,
          name: customer.name,
          email: customer.email,
          mobile: customer.mobile,
          role: "customer",
        },
      },
    });
  } catch (error) {
    console.error("Update Customer Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Get All Customers (Admin)
// GET /api/v1/admin/customers
// ───────────────────────────────────────────────────────────────
const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find()
      .select("customer_id name mobile email walletBalance isActive createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: customers,
    });
  } catch (error) {
    console.error("Get All Customers Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ───────────────────────────────────────────────────────────────
// Get Single Customer Details (Admin)
// GET /api/v1/admin/customers/:id
// ───────────────────────────────────────────────────────────────
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Determine if it's an ObjectId or a custom customer_id string
    const query = id.startsWith("CUST-") ? { customer_id: id } : { _id: id };

    const customer = await Customer.findOne(query).lean();
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    // Parallel fetch of related data
    const Order = require("../models/Order");
    const Address = require("../models/Address");
    const WalletTransaction = require("../models/WalletTransaction");

    const [orders, addresses, walletTransactions] = await Promise.all([
      Order.find({ customer: customer._id }).sort({ createdAt: -1 }).lean(),
      Address.find({ customer: customer._id }).lean(),
      WalletTransaction.find({ customer: customer._id }).sort({ createdAt: -1 }).lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        profile: customer,
        orders,
        addresses,
        walletTransactions,
      },
    });
  } catch (error) {
    console.error("Get Customer Details Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ───────────────────────────────────────────────────────────────
// Toggle Customer Status (Block/Unblock)
// PATCH /api/v1/admin/customers/:id/toggle-status
// ───────────────────────────────────────────────────────────────
const toggleCustomerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const query = id.startsWith("CUST-") ? { customer_id: id } : { _id: id };

    const customer = await Customer.findOne(query);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    customer.isActive = !customer.isActive;
    
    // If blocked, optionally invalidate refresh token to force logout
    if (!customer.isActive) {
      customer.refreshToken = null;
    }

    await customer.save();

    return res.status(200).json({
      success: true,
      message: `Customer ${customer.isActive ? "activated" : "suspended"} successfully`,
      data: {
        id: customer.customer_id,
        name: customer.name,
        status: customer.isActive ? "Active" : "Suspended",
      },
    });
  } catch (error) {
    console.error("Toggle Customer Status Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── Customer Logout ─────────────────────────────────────────
// POST /api/auth/customer/logout
const customerLogout = async (req, res) => {
  try {
    const customerId = req.customerId;
    if (customerId) {
      await Customer.updateOne({ _id: customerId }, { $unset: { refreshToken: 1 } });
    }
    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Customer Logout Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ─── Update FCM Token ────────────────────────────────────────
// PUT /api/v1/auth/customer/fcm-token
const updateFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) {
      return res.status(400).json({ success: false, message: "fcmToken is required" });
    }

    const customerId = req.customerId;
    const customer = await Customer.findByIdAndUpdate(
      customerId,
      { fcmToken },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    return res.status(200).json({
      success: true,
      message: "FCM token updated successfully",
    });
  } catch (error) {
    console.error("Update FCM Token Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  getCustomerProfile,
  updateCustomerProfile,
  updateFcmToken,
  customerLogout,
  getAllCustomers,
  getCustomerById,
  toggleCustomerStatus,
};
