const express = require("express");
const {
  getPrivacyPolicy,
  getPolicyByType,
  updatePolicy,
} = require("../controllers/policyController");
const { verifyAdminToken } = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Customer - Policies & Legal
 *     description: Public legal policies, terms, and privacy policy endpoints
 */

// ─── Public Customer Policy Endpoints ─────────────────────────────────────────

/**
 * @swagger
 * /policies/privacy-policy:
 *   get:
 *     summary: View public Privacy Policy (App Store & PlayStore Compliance)
 *     tags: [Customer - Policies & Legal]
 *     responses:
 *       200:
 *         description: Privacy Policy HTML/Markdown content retrieved successfully
 */
router.get("/privacy-policy", getPrivacyPolicy);

/**
 * @swagger
 * /policies/{type}:
 *   get:
 *     summary: View legal policy content by type
 *     tags: [Customer - Policies & Legal]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [privacy_policy, terms_conditions, about_us, refund_policy, shipping_policy]
 *         description: Policy type identifier
 *     responses:
 *       200:
 *         description: Policy content details retrieved successfully
 *       404:
 *         description: Policy not found
 */
router.get("/:type", getPolicyByType);

// ─── Admin Endpoint ───────────────────────────────────────────────────────────
router.put("/", verifyAdminToken, updatePolicy);

module.exports = router;
