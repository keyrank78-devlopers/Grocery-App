const express = require("express");
const {
  getFaqs,
  getFaqCategories,
  getAllFaqsAdmin,
  createFaq,
  updateFaq,
  deleteFaq,
  toggleFaqStatus,
} = require("../controllers/faqController");
const { verifyAdminToken } = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Customer - FAQs & Support
 *     description: Frequently Asked Questions & Customer Support Helpdesk endpoints
 */

// ─── Public Customer FAQ Endpoints ───────────────────────────────────────────

/**
 * @swagger
 * /faqs:
 *   get:
 *     summary: View Frequently Asked Questions (Filterable by category & search)
 *     tags: [Customer - FAQs & Support]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search FAQs by question or answer keywords (e.g. refund, delivery)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter FAQs by category (e.g. Delivery, Payment, Orders, Refunds)
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
 *         description: Number of FAQs per page (max 50)
 *     responses:
 *       200:
 *         description: List of FAQs retrieved successfully
 */
router.get("/", getFaqs);

/**
 * @swagger
 * /faqs/categories:
 *   get:
 *     summary: Get list of distinct FAQ category tags
 *     tags: [Customer - FAQs & Support]
 *     responses:
 *       200:
 *         description: Array of distinct FAQ category names retrieved
 */
router.get("/categories", getFaqCategories);

// ─── Admin Endpoints ──────────────────────────────────────────────────────────
router.get("/admin", getAllFaqsAdmin);                                          // Public — loads all FAQs (active + inactive) for admin panel
router.post("/admin", verifyAdminToken, createFaq);
router.put("/admin/:id", verifyAdminToken, updateFaq);
router.delete("/admin/:id", verifyAdminToken, deleteFaq);
router.patch("/admin/:id/toggle-status", verifyAdminToken, toggleFaqStatus);

module.exports = router;
