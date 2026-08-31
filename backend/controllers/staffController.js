const Staff = require("../models/Staff");
const generateCustomId = require("../utils/generateCustomId");

// ─── Admin Creates Staff ───────────────────────────────────────────────
// POST /api/admin/staff/create
const createStaff = async (req, res) => {
  try {
    const { name, email, phone, password, role, address, assignedWarehouses, permissions } = req.body;

    if (!name || !email || !phone || !password || !role || !address) {
      return res.status(400).json({
        success: false,
        message: "All fields are required (name, email, phone, password, role, address)",
      });
    }

    const { street, city, state, pincode, landmark = "" } = address;

    if (!street || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message: "Address must contain street, city, state, and pincode",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingStaff = await Staff.findOne({ email: normalizedEmail }).lean();

    if (existingStaff) {
      return res.status(409).json({
        success: false,
        message: "Email already registered for a staff member",
      });
    }

    const staff_id = await generateCustomId("Staff", "STF");

    const newStaff = await Staff.create({
      staff_id,
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password,
      role,
      address: {
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        landmark: landmark.trim(),
      },
      createdBy: req.admin._id,
      assignedWarehouses: Array.isArray(assignedWarehouses) ? assignedWarehouses : (assignedWarehouses ? [assignedWarehouses] : []),
      permissions: permissions || {},
    });

    return res.status(201).json({
      success: true,
      message: `${newStaff.role.replace("_", " ")} created successfully`,
      data: {
        staff_id: newStaff.staff_id,
        name: newStaff.name,
        email: newStaff.email,
        phone: newStaff.phone,
        role: newStaff.role,
        address: newStaff.address,
        assignedWarehouses: newStaff.assignedWarehouses,
        permissions: newStaff.permissions,
        createdBy: newStaff.createdBy,
        createdAt: newStaff.createdAt,
      },
    });
  } catch (error) {
    console.error("Create Staff Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ─── Get All Staff ────────────────────────────────────────────────────
// GET /api/admin/get-staff
const getAllStaff = async (req, res) => {
  try {
    const staffList = await Staff.find({}, {
      staff_id: 1,
      name: 1,
      email: 1,
      phone: 1,
      role: 1,
      address: 1,
      isActive: 1,
      assignedWarehouses: 1,
      permissions: 1,
      createdAt: 1,
    }).populate("assignedWarehouses", "name warehouse_id").lean();

    const formatted = staffList.map((s) => ({
      id: s.staff_id,
      name: s.name,
      email: s.email,
      mobile: s.phone,
      role: s.role,
      city: s.address?.city || "",
      assignedWarehouses: s.assignedWarehouses ? s.assignedWarehouses.map(w => ({ id: w._id, name: w.name, warehouse_id: w.warehouse_id })) : [],
      permissions: s.permissions || {},
      status: s.isActive === false ? "Suspended" : "Active",
      createdAt: s.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("Get All Staff Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ─── Edit Staff ───────────────────────────────────────────────────────
// PUT /api/admin/staff/:id
const editStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, address, assignedWarehouses, permissions } = req.body;

    const member = await Staff.findOne({ staff_id: id });
    if (!member) {
      return res.status(404).json({ success: false, message: "Staff member not found" });
    }

    // Update only provided fields
    if (name) member.name = name.trim();
    if (phone) member.phone = phone.trim();
    if (role) member.role = role;
    if (assignedWarehouses !== undefined) member.assignedWarehouses = Array.isArray(assignedWarehouses) ? assignedWarehouses : (assignedWarehouses ? [assignedWarehouses] : []);
    if (permissions) member.permissions = permissions;

    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== member.email) {
        const existing = await Staff.findOne({ email: normalizedEmail }).lean();
        if (existing) {
          return res.status(409).json({ success: false, message: "Email already in use by another staff member" });
        }
        member.email = normalizedEmail;
      }
    }

    if (address) {
      if (address.street) member.address.street = address.street.trim();
      if (address.city)   member.address.city   = address.city.trim();
      if (address.state)  member.address.state  = address.state.trim();
      if (address.pincode) member.address.pincode = address.pincode.trim();
      if (address.landmark !== undefined) member.address.landmark = address.landmark.trim();
    }

    await member.save();

    return res.status(200).json({
      success: true,
      message: "Staff member updated successfully",
      data: {
        id: member.staff_id,
        name: member.name,
        email: member.email,
        mobile: member.phone,
        role: member.role,
        assignedWarehouses: member.assignedWarehouses,
        permissions: member.permissions,
        city: member.address?.city || "",
        status: member.isActive === false ? "Suspended" : "Active",
      },
    });
  } catch (error) {
    console.error("Edit Staff Error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};


// PATCH /api/admin/staff/:id/toggle-status
const toggleStaffStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const member = await Staff.findOne({ staff_id: id });
    if (!member) {
      return res.status(404).json({ success: false, message: "Staff member not found" });
    }

    member.isActive = !member.isActive;
    await member.save();

    return res.status(200).json({
      success: true,
      message: `Staff member ${member.isActive ? "activated" : "suspended"} successfully`,
      data: { id: member.staff_id, status: member.isActive ? "Active" : "Suspended" },
    });
  } catch (error) {
    console.error("Toggle Staff Status Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};


// ─── Assign Warehouse To Staff ──────────────────────────────────────────
// PUT /api/admin/staff/:id/assign-warehouse
const assignWarehouseToStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { warehouseId, action } = req.body; // action = "add" or "remove"

    const member = await Staff.findOne({ staff_id: id });
    if (!member) {
      return res.status(404).json({ success: false, message: "Staff member not found" });
    }

    if (warehouseId) {
      const Warehouse = require("../models/Warehouse");
      const warehouseExists = await Warehouse.findById(warehouseId);
      if (!warehouseExists) {
        return res.status(404).json({ success: false, message: "Warehouse not found" });
      }
      
      if (action === "remove") {
        member.assignedWarehouses = member.assignedWarehouses.filter(wId => wId.toString() !== warehouseId.toString());
      } else {
        // default add
        if (!member.assignedWarehouses.includes(warehouseId)) {
          member.assignedWarehouses.push(warehouseId);
        }
      }
    }

    await member.save();

    return res.status(200).json({
      success: true,
      message: `Warehouse successfully ${action === "remove" ? "unassigned" : "assigned"} for staff member`,
      data: {
        id: member.staff_id,
        name: member.name,
        assignedWarehouses: member.assignedWarehouses,
      },
    });
  } catch (error) {
    console.error("Assign Warehouse Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  createStaff,
  getAllStaff,
  editStaff,
  toggleStaffStatus,
  assignWarehouseToStaff,
};
