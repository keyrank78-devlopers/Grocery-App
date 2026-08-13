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

    if (!customer && !name) {
      return res.status(400).json({
        success: false,
        message: "Name is required for registration",
        isNewUser: true,
      });
    }

    const otp = generate6DigitOTP();

    await OTP.findOneAndUpdate(
      {
        mobile: normalizedMobile,
      },
      {
        otp,
        name: name?.trim() || "",
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
      if (!otpDoc.name) {
        return res.status(400).json({
          success: false,
          message: "Name required",
        });
      }

      const customer_id = await generateCustomId("Customer", "CUS");

      customer = await Customer.create({
        customer_id,
        name: otpDoc.name,
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

module.exports = {
  sendOTP,
  verifyOTP,
};
