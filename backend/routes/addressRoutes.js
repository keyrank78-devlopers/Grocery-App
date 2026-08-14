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


/**
 * @swagger
 * tags:
 *   name: Address
 *   description: Address management for customers
 */

/**
 * @swagger
 * /addresses/create-address:
 *   post:
 *     summary: Create a new address
 *     tags: [Address]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Address created successfully
 */
router.post("/create-address", verifyCustomerToken, addAddress);

/**
 * @swagger
 * /addresses/view-address:
 *   get:
 *     summary: Get all addresses for the logged-in customer
 *     tags: [Address]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Addresses retrieved successfully
 */
router.get("/view-address", verifyCustomerToken, getAddresses);

/**
 * @swagger
 * /addresses/single-address/{id}:
 *   get:
 *     summary: Get a single address by ID
 *     tags: [Address]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Address retrieved successfully
 */
router.get("/single-address/:id", verifyCustomerToken, getAddressById);

/**
 * @swagger
 * /addresses/update-address/{id}:
 *   put:
 *     summary: Update an address
 *     tags: [Address]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Address updated successfully
 */
router.put("/update-address/:id", verifyCustomerToken, updateAddress);

/**
 * @swagger
 * /addresses/delete-address/{id}:
 *   delete:
 *     summary: Delete an address
 *     tags: [Address]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Address deleted successfully
 */
router.delete("/delete-address/:id", verifyCustomerToken, deleteAddress);

module.exports = router;
