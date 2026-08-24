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
 *             required: [street, city, state, pincode]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Home"
 *               street:
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
 *                 example: "Near City Park"
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
 *                 example: "Office"
 *               street:
 *                 type: string
 *                 example: "456 Tech Park"
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
