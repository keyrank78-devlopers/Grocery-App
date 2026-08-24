const Address = require("../models/Address");
const Customer = require("../models/Customer");

// ───────────────────────────────────────────────────────────────
// Add Address
// POST /api/v1/addresses
// ───────────────────────────────────────────────────────────────
const addAddress = async (req, res) => {
  try {
    const customerId = req.customerId;
    const customer = await Customer.findById(customerId).select("name mobile").lean();
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found",
      });
    }

    const {
      name,
      mobile,
      alternateMobile,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      landmark,
      addressType,
      isDefault,
      longitude,
      latitude,
    } = req.body;

    if (!addressLine1 || !city || !state || !pincode || longitude === undefined || latitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "addressLine1, city, state, pincode, longitude, and latitude are required fields",
      });
    }

    const finalName = name ? name.trim() : customer.name;
    const finalMobile = mobile ? mobile.trim() : customer.mobile;

    // Check if this is the first address for the customer
    const existingAddressesCount = await Address.countDocuments({ customer: customerId });
    let defaultFlag = isDefault === true || isDefault === "true";

    // If first address, it MUST be default
    if (existingAddressesCount === 0) {
      defaultFlag = true;
    }

    // If setting as default, unset other defaults
    if (defaultFlag) {
      await Address.updateMany({ customer: customerId }, { isDefault: false });
    }

    const newAddress = await Address.create({
      customer: customerId,
      name: finalName,
      mobile: finalMobile,
      alternateMobile: alternateMobile ? alternateMobile.trim() : undefined,
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2 ? addressLine2.trim() : undefined,
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      landmark: landmark ? landmark.trim() : undefined,
      addressType: addressType || "Home",
      isDefault: defaultFlag,
      location: {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)],
      },
    });

    return res.status(201).json({
      success: true,
      message: "Address added successfully",
      data: newAddress,
    });
  } catch (error) {
    console.error("Add Address Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Get All Addresses for Logged-in Customer (Paginated)
// GET /api/v1/addresses/view-address
// ───────────────────────────────────────────────────────────────
const getAddresses = async (req, res) => {
  try {
    const customerId = req.customerId;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [addresses, total] = await Promise.all([
      Address.find({ customer: customerId })
        .sort({ isDefault: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Address.countDocuments({ customer: customerId }),
    ]);

    return res.status(200).json({
      success: true,
      data: addresses,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get Addresses Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Get Single Address by ID
// GET /api/v1/addresses/:id
// ───────────────────────────────────────────────────────────────
const getAddressById = async (req, res) => {
  try {
    const customerId = req.customerId;
    const { id } = req.params;

    const address = await Address.findOne({ _id: id, customer: customerId }).lean();
    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: address,
    });
  } catch (error) {
    console.error("Get Address By Id Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Update Address
// PUT /api/v1/addresses/:id
// ───────────────────────────────────────────────────────────────
const updateAddress = async (req, res) => {
  try {
    const customerId = req.customerId;
    const { id } = req.params;
    const {
      name,
      mobile,
      alternateMobile,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      landmark,
      addressType,
      isDefault,
      longitude,
      latitude,
    } = req.body;

    const address = await Address.findOne({ _id: id, customer: customerId });
    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    let defaultFlag = isDefault !== undefined ? (isDefault === true || isDefault === "true") : address.isDefault;

    // If updating this address to default, unset other defaults
    if (defaultFlag && !address.isDefault) {
      await Address.updateMany({ customer: customerId }, { isDefault: false });
    }

    // Apply fields
    if (name) address.name = name.trim();
    if (mobile) address.mobile = mobile.trim();
    if (alternateMobile !== undefined) address.alternateMobile = alternateMobile.trim();
    if (addressLine1) address.addressLine1 = addressLine1.trim();
    if (addressLine2 !== undefined) address.addressLine2 = addressLine2.trim();
    if (city) address.city = city.trim();
    if (state) address.state = state.trim();
    if (pincode) address.pincode = pincode.trim();
    if (landmark !== undefined) address.landmark = landmark.trim();
    if (addressType) address.addressType = addressType;
    if (longitude !== undefined && latitude !== undefined) {
      address.location = {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)],
      };
    }
    address.isDefault = defaultFlag;

    await address.save();

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: address,
    });
  } catch (error) {
    console.error("Update Address Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Delete Address
// DELETE /api/v1/addresses/:id
// ───────────────────────────────────────────────────────────────
const deleteAddress = async (req, res) => {
  try {
    const customerId = req.customerId;
    const { id } = req.params;

    const address = await Address.findOne({ _id: id, customer: customerId });
    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    const wasDefault = address.isDefault;
    await address.deleteOne();

    // If we deleted the default address, make another address default (if any exist)
    if (wasDefault) {
      const remainingAddress = await Address.findOne({ customer: customerId });
      if (remainingAddress) {
        remainingAddress.isDefault = true;
        await remainingAddress.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("Delete Address Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  addAddress,
  getAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
};
