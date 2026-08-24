const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");

// ─── Add Product to Wishlist ─────────────────────────────────────────────────
const addToWishlist = async (req, res) => {
  try {
    const customerId = req.customerId;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "productId is required.",
      });
    }

    // Verify product exists and is active
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    // Find or create wishlist for customer
    let wishlist = await Wishlist.findOne({ customer: customerId });
    if (!wishlist) {
      wishlist = new Wishlist({ customer: customerId, products: [] });
    }

    // Check if already in wishlist
    const exists = wishlist.products.some(
      (item) => item.product.toString() === productId.toString()
    );

    if (exists) {
      return res.status(200).json({
        success: true,
        message: "Product is already in your wishlist.",
        data: wishlist,
      });
    }

    wishlist.products.push({ product: productId, addedAt: new Date() });
    await wishlist.save();

    await wishlist.populate("products.product", "name SKU slug price discountPrice images stock status isActive");

    return res.status(200).json({
      success: true,
      message: "Product added to wishlist successfully.",
      data: wishlist,
    });
  } catch (error) {
    console.error("Add To Wishlist Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while adding product to wishlist.",
    });
  }
};

// ─── Remove Product from Wishlist ────────────────────────────────────────────
const removeFromWishlist = async (req, res) => {
  try {
    const customerId = req.customerId;
    const productId = req.params.productId || req.body.productId;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "productId parameter is required.",
      });
    }

    let wishlist = await Wishlist.findOne({ customer: customerId });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found.",
      });
    }

    wishlist.products = wishlist.products.filter(
      (item) => item.product.toString() !== productId.toString()
    );

    await wishlist.save();
    await wishlist.populate("products.product", "name SKU slug price discountPrice images stock status isActive");

    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist successfully.",
      data: wishlist,
    });
  } catch (error) {
    console.error("Remove From Wishlist Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while removing product from wishlist.",
    });
  }
};

// ─── Get Customer Wishlist (Paginated & Filtered) ─────────────────────────────
const getWishlist = async (req, res) => {
  try {
    const customerId = req.customerId;
    const { page = 1, limit = 10, search = "", category } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    let wishlist = await Wishlist.findOne({ customer: customerId }).populate({
      path: "products.product",
      select: "name sku slug mrp sellPrice image stockQuantity isActive category subCategory averageRating ratingsCount",
      populate: { path: "category", select: "name slug" },
    });

    if (!wishlist || !wishlist.products) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          page: pageNum,
          limit: limitNum,
          totalPages: 0,
        },
      });
    }

    // Filter out null/deleted product references
    let items = wishlist.products.filter((item) => item.product != null);

    // Apply optional search filter by Product Name or SKU
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      items = items.filter(
        (item) =>
          searchRegex.test(item.product.name) ||
          searchRegex.test(item.product.sku)
      );
    }

    // Apply optional category filter
    if (category) {
      items = items.filter(
        (item) =>
          item.product.category &&
          (item.product.category._id?.toString() === category ||
            item.product.category.toString() === category)
      );
    }

    const total = items.length;
    const paginatedItems = items.slice(skip, skip + limitNum);

    return res.status(200).json({
      success: true,
      data: paginatedItems,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get Wishlist Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching wishlist.",
    });
  }
};

// ─── Toggle Product in Wishlist (Add if absent, Remove if present) ───────────
const toggleWishlist = async (req, res) => {
  try {
    const customerId = req.customerId;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "productId is required.",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    let wishlist = await Wishlist.findOne({ customer: customerId });
    if (!wishlist) {
      wishlist = new Wishlist({ customer: customerId, products: [] });
    }

    const existingIndex = wishlist.products.findIndex(
      (item) => item.product.toString() === productId.toString()
    );

    let isAdded = false;
    if (existingIndex > -1) {
      wishlist.products.splice(existingIndex, 1);
      isAdded = false;
    } else {
      wishlist.products.push({ product: productId, addedAt: new Date() });
      isAdded = true;
    }

    await wishlist.save();
    await wishlist.populate("products.product", "name SKU slug price discountPrice images stock status isActive");

    return res.status(200).json({
      success: true,
      isAdded,
      message: isAdded
        ? "Product added to wishlist."
        : "Product removed from wishlist.",
      data: wishlist,
    });
  } catch (error) {
    console.error("Toggle Wishlist Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while toggling wishlist.",
    });
  }
};

// ─── Clear All Wishlist Items ─────────────────────────────────────────────────
const clearWishlist = async (req, res) => {
  try {
    const customerId = req.customerId;

    let wishlist = await Wishlist.findOne({ customer: customerId });
    if (wishlist) {
      wishlist.products = [];
      await wishlist.save();
    }

    return res.status(200).json({
      success: true,
      message: "Wishlist cleared successfully.",
    });
  } catch (error) {
    console.error("Clear Wishlist Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while clearing wishlist.",
    });
  }
};

module.exports = {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  toggleWishlist,
  clearWishlist,
};
