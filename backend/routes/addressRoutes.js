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
 *   - name: Customer - Address
 *     description: Customer delivery address management endpoints (Requires Login)
 */

/**
 * @swagger
 * /addresses/view-address:
 *   get:
 *     summary: View all saved delivery addresses for logged-in customer (Paginated)
 *     tags: [Customer - Address]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of addresses per page (max 50)
 *     responses:
 *       200:
 *         description: List of addresses retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/view-address", verifyCustomerToken, getAddresses);

/**
 * @swagger
 * /addresses/create-address:
 *   post:
 *     summary: Add new delivery address
 *     tags: [Customer - Address]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [addressLine1, city, state, pincode]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Recipient name (Optional, defaults to Customer profile name)
 *                 example: "Ravi Kumar"
 *               mobile:
 *                 type: string
 *                 description: Recipient mobile number (Optional, defaults to Customer profile mobile)
 *                 example: "9876543210"
 *               addressLine1:
 *                 type: string
 *                 description: Flat, House no., Building, Company, Apartment
 *                 example: "Flat No 405, Block B"
 *               addressLine2:
 *                 type: string
 *                 description: Area, Street, Sector, Village
 *                 example: "123 Main Street, Sector 15"
 *               city:
 *                 type: string
 *                 example: "Noida"
 *               state:
 *                 type: string
 *                 example: "Uttar Pradesh"
 *               pincode:
 *                 type: string
 *                 example: "201301"
 *               landmark:
 *                 type: string
 *                 example: "Near City Park"
 *               addressType:
 *                 type: string
 *                 enum: [Home, Work, Other]
 *                 default: Home
 *                 example: "Home"
 *               alternateMobile:
 *                 type: string
 *                 example: "9876543211"
 *               isDefault:
 *                 type: boolean
 *                 default: false
 *                 example: true
 *     responses:
 *       201:
 *         description: Address created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/create-address", verifyCustomerToken, addAddress);

/**
 * @swagger
 * /addresses/single-address/{id}:
 *   get:
 *     summary: Get details of a single address by ID
 *     tags: [Customer - Address]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Address MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Address details retrieved
 *       404:
 *         description: Address not found
 */
router.get("/single-address/:id", verifyCustomerToken, getAddressById);

/**
 * @swagger
 * /addresses/update-address/{id}:
 *   put:
 *     summary: Update existing delivery address
 *     tags: [Customer - Address]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Recipient name (updates profile name stored on address)
 *                 example: "Ravi Kumar"
 *               mobile:
 *                 type: string
 *                 description: Recipient mobile
 *                 example: "9876543210"
 *               alternateMobile:
 *                 type: string
 *                 example: "9876543211"
 *               addressLine1:
 *                 type: string
 *                 example: "Flat No 405, Block B"
 *               addressLine2:
 *                 type: string
 *                 example: "123 Main Street, Sector 15"
 *               city:
 *                 type: string
 *                 example: "Noida"
 *               state:
 *                 type: string
 *                 example: "Uttar Pradesh"
 *               pincode:
 *                 type: string
 *                 example: "201301"
 *               landmark:
 *                 type: string
 *                 example: "Tower B"
 *               addressType:
 *                 type: string
 *                 enum: [Home, Work, Other]
 *                 example: "Work"
 *               isDefault:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Address updated successfully
 *       404:
 *         description: Address not found
 */
router.put("/update-address/:id", verifyCustomerToken, updateAddress);

/**
 * @swagger
 * /addresses/delete-address/{id}:
 *   delete:
 *     summary: Delete a delivery address
 *     tags: [Customer - Address]
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
 *       404:
 *         description: Address not found
 */
router.delete("/delete-address/:id", verifyCustomerToken, deleteAddress);

module.exports = router;
