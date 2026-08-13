const express = require("express");
const {
  addAddress,
  getAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
} = require("../controllers/addressController");
const { verifyCustomerToken } = require("../middleware/auth");

const router = express.Router();

// Apply strict customer token verification for all address endpoints


router.post("/create-address", verifyCustomerToken, addAddress);
router.get("/view-address", verifyCustomerToken, getAddresses);
router.get("/single-address/:id", verifyCustomerToken, getAddressById);
router.put("/update-address/:id", verifyCustomerToken, updateAddress);
router.delete("/delete-address/:id", verifyCustomerToken, deleteAddress);

module.exports = router;
