const express = require("express");
const {
  checkCanReview,
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
} = require("../controllers/reviewController");
const { verifyCustomerToken } = require("../middleware/auth");

const router = express.Router();

// Public route: Anyone can view product reviews & rating breakdown
router.get("/product/:productId", getProductReviews);

// Protected routes (Customer only)
router.get("/can-review/:productId", verifyCustomerToken, checkCanReview);
router.post("/", verifyCustomerToken, createReview);
router.put("/:id", verifyCustomerToken, updateReview);
router.delete("/:id", verifyCustomerToken, deleteReview);

module.exports = router;
