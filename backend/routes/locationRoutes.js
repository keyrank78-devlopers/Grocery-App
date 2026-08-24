const express = require("express");
const { checkServiceability } = require("../controllers/locationController");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Customer - Location & Serviceability
 *     description: 10-Minute Quick Commerce delivery area & location serviceability endpoints
 */

/**
 * @swagger
 * /location/check-serviceability:
 *   post:
 *     summary: Check 10-Minute Express Delivery serviceability & dynamic ETA for customer location
 *     tags: [Customer - Location & Serviceability]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               latitude:
 *                 type: number
 *                 example: 28.535512
 *                 description: Customer current latitude coordinate
 *               longitude:
 *                 type: number
 *                 example: 77.391026
 *                 description: Customer current longitude coordinate
 *               pincode:
 *                 type: string
 *                 example: "201301"
 *                 description: (Optional fallback if lat/lng is unavailable)
 *     responses:
 *       200:
 *         description: Location serviceability status with assigned warehouse and estimated delivery time (ETA)
 *       400:
 *         description: Latitude and longitude or pincode are missing
 */
router.post("/check-serviceability", checkServiceability);

module.exports = router;
