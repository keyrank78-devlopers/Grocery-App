const mongoose = require("mongoose");
const Warehouse = require("../models/Warehouse");
const generateCustomId = require("../utils/generateCustomId");

// ───────────────────────────────────────────────────────────────
// Create Warehouse
// POST /api/v1/admin/warehouses
// ───────────────────────────────────────────────────────────────
const createWarehouse = async (req, res) => {
  try {
    const {
      name,
      address,
      contactNumber,
      openingTime,
      closingTime,
      deliveryRangeKm,
      longitude,
      latitude,
      isActive,
    } = req.body;

    if (!name || !address || !address.addressLine1 || !address.city || !address.state || !address.pincode || !contactNumber || !openingTime || !closingTime || !deliveryRangeKm || longitude === undefined || latitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "All required fields (name, addressLine1, city, state, pincode, contactNumber, openingTime, closingTime, deliveryRangeKm, longitude, latitude) must be provided",
      });
    }

    const warehouse_id = await generateCustomId("Warehouse", "WH");

    const newWarehouse = await Warehouse.create({
      warehouse_id,
      name: name.trim(),
      address: {
        addressLine1: address.addressLine1.trim(),
        addressLine2: address.addressLine2 ? address.addressLine2.trim() : "",
        city: address.city.trim(),
        state: address.state.trim(),
        pincode: address.pincode.trim(),
        landmark: address.landmark ? address.landmark.trim() : "",
      },
      contactNumber: contactNumber.trim(),
      openingTime: openingTime.trim(),
      closingTime: closingTime.trim(),
      deliveryRangeKm: Number(deliveryRangeKm),
      location: {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)],
      },
      isActive: isActive !== undefined ? isActive : true,
    });

    return res.status(201).json({
      success: true,
      message: "Warehouse created successfully",
      data: newWarehouse,
    });
  } catch (error) {
    console.error("Create Warehouse Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error creating warehouse",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Get All Warehouses
// GET /api/v1/admin/warehouses
// ───────────────────────────────────────────────────────────────
const getWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouse.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json({
      success: true,
      data: warehouses,
    });
  } catch (error) {
    console.error("Get Warehouses Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching warehouses",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Get Single Warehouse By ID
// GET /api/v1/admin/warehouses/:id
// ───────────────────────────────────────────────────────────────
const getWarehouseById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { warehouse_id: id }] }
      : { warehouse_id: id };
    const warehouse = await Warehouse.findOne(query).lean();

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: warehouse,
    });
  } catch (error) {
    console.error("Get Warehouse By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Update Warehouse
// PUT /api/v1/admin/warehouses/:id
// ───────────────────────────────────────────────────────────────
const updateWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      address,
      contactNumber,
      openingTime,
      closingTime,
      deliveryRangeKm,
      longitude,
      latitude,
      isActive,
    } = req.body;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { warehouse_id: id }] }
      : { warehouse_id: id };
    const warehouse = await Warehouse.findOne(query);

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    if (name) warehouse.name = name.trim();
    if (address) {
      if (address.addressLine1) warehouse.address.addressLine1 = address.addressLine1.trim();
      if (address.addressLine2 !== undefined) warehouse.address.addressLine2 = address.addressLine2.trim();
      if (address.city) warehouse.address.city = address.city.trim();
      if (address.state) warehouse.address.state = address.state.trim();
      if (address.pincode) warehouse.address.pincode = address.pincode.trim();
      if (address.landmark !== undefined) warehouse.address.landmark = address.landmark.trim();
    }
    if (contactNumber) warehouse.contactNumber = contactNumber.trim();
    if (openingTime) warehouse.openingTime = openingTime.trim();
    if (closingTime) warehouse.closingTime = closingTime.trim();
    if (deliveryRangeKm !== undefined) warehouse.deliveryRangeKm = Number(deliveryRangeKm);
    if (longitude !== undefined && latitude !== undefined) {
      warehouse.location = {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)],
      };
    }
    if (isActive !== undefined) warehouse.isActive = isActive;

    await warehouse.save();

    return res.status(200).json({
      success: true,
      message: "Warehouse updated successfully",
      data: warehouse,
    });
  } catch (error) {
    console.error("Update Warehouse Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error updating warehouse",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Delete Warehouse
// DELETE /api/v1/admin/warehouses/:id
// ───────────────────────────────────────────────────────────────
const deleteWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { warehouse_id: id }] }
      : { warehouse_id: id };
    const warehouse = await Warehouse.findOneAndDelete(query);

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Warehouse deleted successfully",
    });
  } catch (error) {
    console.error("Delete Warehouse Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error deleting warehouse",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Toggle Warehouse Status
// PATCH /api/v1/admin/warehouses/:id/toggle-status
// ───────────────────────────────────────────────────────────────
const toggleWarehouseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { warehouse_id: id }] }
      : { warehouse_id: id };
    const warehouse = await Warehouse.findOne(query);

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    warehouse.isActive = !warehouse.isActive;
    await warehouse.save();

    return res.status(200).json({
      success: true,
      message: `Warehouse ${warehouse.isActive ? "activated" : "deactivated"} successfully`,
      data: { isActive: warehouse.isActive },
    });
  } catch (error) {
    console.error("Toggle Warehouse Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error toggling warehouse status",
    });
  }
};

module.exports = {
  createWarehouse,
  getWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
  toggleWarehouseStatus,
};
