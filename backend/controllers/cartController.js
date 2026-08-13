const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Product = require("../models/Product");



// Helper to find or create a cart for the session
const findOrCreateCart = async (session) => {
  if (session.customerId) {
    let cart = await Cart.findOne({ customer: session.customerId });
    if (!cart) {
      cart = await Cart.create({ customer: session.customerId, items: [] });
    }
    return cart;
  } else {
    let cart = await Cart.findOne({ guestId: session.guestId });
    if (!cart) {
      cart = await Cart.create({ guestId: session.guestId, items: [] });
    }
    return cart;
  }
};

// Helper to populate cart items in one query (Avoiding N+1)
const getPopulatedCart = async (cartId) => {
  return await Cart.findById(cartId)
    .populate({
      path: "items.product",
      select: "name slug mrp sellPrice image stockQuantity sku isActive",
    })
    .lean();
};

// ───────────────────────────────────────────────────────────────
// Add To Cart
// POST /api/v1/cart/add
// ───────────────────────────────────────────────────────────────
const addToCart = async (req, res) => {
  try {
    const session = req.cartSession;

    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "productId is required",
      });
    }

    const qty = Math.max(1, parseInt(quantity));

    // Validate Product
    const product = await Product.findOne({ _id: productId, isActive: true }).lean();
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or inactive",
      });
    }

    const cart = await findOrCreateCart(session);

    // Check if item already exists in cart
    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId.toString()
    );

    if (existingItem) {
      existingItem.quantity += qty;
    } else {
      cart.items.push({ product: productId, quantity: qty });
    }

    await cart.save();

    const populatedCart = await getPopulatedCart(cart._id);

    return res.status(200).json({
      success: true,
      message: "Product added to cart successfully",
      data: populatedCart,
    });
  } catch (error) {
    console.error("Add To Cart Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Increase Quantity (+1)
// POST /api/v1/cart/increase
// ───────────────────────────────────────────────────────────────
const increaseQuantity = async (req, res) => {
  try {
    const session = req.cartSession;

    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "productId is required",
      });
    }

    // Validate Product
    const product = await Product.findOne({ _id: productId, isActive: true }).lean();
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or inactive",
      });
    }

    const cart = await findOrCreateCart(session);

    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId.toString()
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.items.push({ product: productId, quantity: 1 });
    }

    await cart.save();

    const populatedCart = await getPopulatedCart(cart._id);

    return res.status(200).json({
      success: true,
      message: "Quantity increased successfully",
      data: populatedCart,
    });
  } catch (error) {
    console.error("Increase Cart Quantity Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Decrease Quantity (-1)
// POST /api/v1/cart/decrease
// ───────────────────────────────────────────────────────────────
const decreaseQuantity = async (req, res) => {
  try {
    const session = req.cartSession;

    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "productId is required",
      });
    }

    const cart = await findOrCreateCart(session);

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId.toString()
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    if (cart.items[itemIndex].quantity > 1) {
      cart.items[itemIndex].quantity -= 1;
    } else {
      // If quantity is 1 and we decrease, remove it completely from cart
      cart.items.splice(itemIndex, 1);
    }

    await cart.save();

    const populatedCart = await getPopulatedCart(cart._id);

    return res.status(200).json({
      success: true,
      message: "Quantity decreased successfully",
      data: populatedCart,
    });
  } catch (error) {
    console.error("Decrease Cart Quantity Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Remove From Cart
// POST /api/v1/cart/remove
// ───────────────────────────────────────────────────────────────
const removeFromCart = async (req, res) => {
  try {
    const session = req.cartSession;

    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "productId is required",
      });
    }

    const cart = await findOrCreateCart(session);

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId.toString()
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    const populatedCart = await getPopulatedCart(cart._id);

    return res.status(200).json({
      success: true,
      message: "Product removed from cart successfully",
      data: populatedCart,
    });
  } catch (error) {
    console.error("Remove From Cart Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Get Cart
// GET /api/v1/cart
// ───────────────────────────────────────────────────────────────
const getCart = async (req, res) => {
  try {
    const session = req.cartSession;

    let cart;
    if (session.customerId) {
      cart = await Cart.findOne({ customer: session.customerId });
    } else {
      cart = await Cart.findOne({ guestId: session.guestId });
    }

    if (!cart) {
      // Instead of 404, return an empty cart to simplify frontend state initialization
      return res.status(200).json({
        success: true,
        data: {
          items: [],
        },
      });
    }

    const populatedCart = await getPopulatedCart(cart._id);

    return res.status(200).json({
      success: true,
      data: populatedCart,
    });
  } catch (error) {
    console.error("Get Cart Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Merge Guest Cart (Requires Customer Auth)
// POST /api/v1/cart/merge
// ───────────────────────────────────────────────────────────────
const mergeCart = async (req, res) => {
  try {
    const customerId = req.customerId;
    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is required to merge carts",
      });
    }

    const { guestId } = req.body;
    if (!guestId) {
      return res.status(400).json({
        success: false,
        message: "guestId is required to merge carts",
      });
    }

    const guestCart = await Cart.findOne({ guestId: guestId.trim() });
    let customerCart = await Cart.findOne({ customer: customerId });

    if (!guestCart || guestCart.items.length === 0) {
      // Nothing to merge, return current customer cart
      if (!customerCart) {
        customerCart = await Cart.create({ customer: customerId, items: [] });
      }
      const populatedCart = await getPopulatedCart(customerCart._id);
      return res.status(200).json({
        success: true,
        message: "Cart merge completed (no guest items found)",
        data: populatedCart,
      });
    }

    if (!customerCart) {
      customerCart = await Cart.create({ customer: customerId, items: [] });
    }

    // Merge logic
    for (const guestItem of guestCart.items) {
      const existingItem = customerCart.items.find(
        (item) => item.product.toString() === guestItem.product.toString()
      );

      if (existingItem) {
        existingItem.quantity += guestItem.quantity;
      } else {
        customerCart.items.push({
          product: guestItem.product,
          quantity: guestItem.quantity,
        });
      }
    }

    await customerCart.save();
    await Cart.deleteOne({ _id: guestCart._id }); // Delete guest cart after merge

    const populatedCart = await getPopulatedCart(customerCart._id);

    return res.status(200).json({
      success: true,
      message: "Cart merged successfully",
      data: populatedCart,
    });
  } catch (error) {
    console.error("Merge Cart Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  getCart,
  mergeCart,
};
