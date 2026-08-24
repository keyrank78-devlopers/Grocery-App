const mongoose = require("mongoose");
const Review = require("../models/Review");
const Order = require("../models/Order");
const Product = require("../models/Product");

// Helper function to update product average rating & count
const updateProductAverageRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: "$product",
        ratingsCount: { $sum: 1 },
        averageRating: { $avg: "$rating" },
      },
    },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      ratingsCount: stats[0].ratingsCount,
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      ratingsCount: 0,
      averageRating: 0,
    });
  }
};

// ─── Check Eligibility (Can Customer Review Product?) ─────────────────────────
const checkCanReview = async (req, res) => {
  try {
    const customerId = req.customerId;
    const { productId } = req.params;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Valid productId is required.",
      });
    }

    // Check if customer has a delivered order for this product
    const deliveredOrder = await Order.findOne({
      customer: customerId,
      orderStatus: "Delivered",
      "items.product": productId,
    });

    if (!deliveredOrder) {
      return res.status(200).json({
        success: true,
        canReview: false,
        message: "You can only review products after purchasing and receiving them.",
      });
    }

    // Check if customer has already reviewed this product for this order
    const existingReview = await Review.findOne({
      customer: customerId,
      product: productId,
      order: deliveredOrder._id,
    });

    return res.status(200).json({
      success: true,
      canReview: true,
      alreadyReviewed: Boolean(existingReview),
      review: existingReview || null,
      orderId: deliveredOrder._id,
    });
  } catch (error) {
    console.error("Check Can Review Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while checking review eligibility.",
    });
  }
};

// ─── Create Product Review ────────────────────────────────────────────────────
const createReview = async (req, res) => {
  try {
    const customerId = req.customerId;
    const { productId, rating, title, comment, orderId } = req.body;

    if (!productId || !rating) {
      return res.status(400).json({
        success: false,
        message: "productId and rating (1 to 5) are required.",
      });
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a number between 1 and 5.",
      });
    }

    // Find delivered order if orderId not supplied
    let orderQuery = {
      customer: customerId,
      orderStatus: "Delivered",
      "items.product": productId,
    };

    if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
      orderQuery._id = orderId;
    }

    const deliveredOrder = await Order.findOne(orderQuery);

    if (!deliveredOrder) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. You can only review products that have been delivered to you.",
      });
    }

    // Check if user already reviewed this product from this order
    let review = await Review.findOne({
      customer: customerId,
      product: productId,
      order: deliveredOrder._id,
    });

    if (review) {
      // Update existing review
      review.rating = numericRating;
      review.title = title || review.title;
      review.comment = comment || review.comment;
      await review.save();
    } else {
      // Create new review
      review = new Review({
        customer: customerId,
        product: productId,
        order: deliveredOrder._id,
        rating: numericRating,
        title: title || "",
        comment: comment || "",
        isVerifiedPurchase: true,
      });
      await review.save();
    }

    // Recalculate product average rating
    await updateProductAverageRating(productId);

    await review.populate("customer", "name customer_id");

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully.",
      data: review,
    });
  } catch (error) {
    console.error("Create Review Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while submitting review.",
    });
  }
};

// ─── Get Product Reviews (Public Endpoint with Breakdown) ─────────────────────
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Valid productId is required.",
      });
    }

    const [reviews, total, ratingStats] = await Promise.all([
      Review.find({ product: productId })
        .populate("customer", "name customer_id")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments({ product: productId }),
      Review.aggregate([
        { $match: { product: new mongoose.Types.ObjectId(productId) } },
        {
          $group: {
            _id: "$rating",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Format breakdown: { 5: count, 4: count, 3: count, 2: count, 1: count }
    const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalScore = 0;
    ratingStats.forEach((stat) => {
      if (ratingBreakdown[stat._id] !== undefined) {
        ratingBreakdown[stat._id] = stat.count;
        totalScore += stat._id * stat.count;
      }
    });

    const averageRating = total > 0 ? Math.round((totalScore / total) * 10) / 10 : 0;

    return res.status(200).json({
      success: true,
      data: {
        reviews,
        summary: {
          totalReviews: total,
          averageRating,
          ratingBreakdown,
        },
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get Product Reviews Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching product reviews.",
    });
  }
};

// ─── Update Review ────────────────────────────────────────────────────────────
const updateReview = async (req, res) => {
  try {
    const customerId = req.customerId;
    const { id } = req.params;
    const { rating, title, comment } = req.body;

    const review = await Review.findOne({ _id: id, customer: customerId });
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found or unauthorized.",
      });
    }

    if (rating) {
      const numericRating = Number(rating);
      if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be a number between 1 and 5.",
        });
      }
      review.rating = numericRating;
    }

    if (title !== undefined) review.title = title;
    if (comment !== undefined) review.comment = comment;

    await review.save();
    await updateProductAverageRating(review.product);

    return res.status(200).json({
      success: true,
      message: "Review updated successfully.",
      data: review,
    });
  } catch (error) {
    console.error("Update Review Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating review.",
    });
  }
};

// ─── Delete Review ────────────────────────────────────────────────────────────
const deleteReview = async (req, res) => {
  try {
    const customerId = req.customerId;
    const { id } = req.params;

    const review = await Review.findOneAndDelete({ _id: id, customer: customerId });
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found or unauthorized.",
      });
    }

    await updateProductAverageRating(review.product);

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Review Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting review.",
    });
  }
};

module.exports = {
  checkCanReview,
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
};
