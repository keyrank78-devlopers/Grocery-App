const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const WarehouseStock = require("../models/WarehouseStock");



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

    const warehouseId = req.headers["x-warehouse-id"];
    if (!warehouseId) {
      return res.status(400).json({
        success: false,
        message: "Warehouse ID is missing. Please set delivery location.",
      });
    }

    const cart = await findOrCreateCart(session);
    
    // Check if item already exists in cart to calculate total requested quantity
    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId.toString()
    );
    const totalRequestedQty = existingItem ? existingItem.quantity + qty : qty;

    // Validate against WarehouseStock
    const stockInfo = await WarehouseStock.findOne({ product: productId, warehouse: warehouseId }).lean();
    const availableStock = stockInfo ? stockInfo.quantity : 0;

    if (totalRequestedQty > availableStock) {
      return res.status(400).json({
        success: false,
        message: `Only ${availableStock} units available in stock at your location`,
      });
    }

    if (existingItem) {
      existingItem.quantity = totalRequestedQty;
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

    const warehouseId = req.headers["x-warehouse-id"];
    if (!warehouseId) {
      return res.status(400).json({
        success: false,
        message: "Warehouse ID is missing. Please set delivery location.",
      });
    }

    const cart = await findOrCreateCart(session);

    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId.toString()
    );

    const currentQty = existingItem ? existingItem.quantity : 0;
    const totalRequestedQty = currentQty + 1;

    // Validate against WarehouseStock
    const stockInfo = await WarehouseStock.findOne({ product: productId, warehouse: warehouseId }).lean();
    const availableStock = stockInfo ? stockInfo.quantity : 0;

    if (totalRequestedQty > availableStock) {
      return res.status(400).json({
        success: false,
        message: `Only ${availableStock} units available in stock at your location`,
      });
    }

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
// Get Cart (Supports page, limit, search & category filters + pricing summary)
// GET /api/v1/cart/view-cart
// ───────────────────────────────────────────────────────────────
const getCart = async (req, res) => {
  try {
    const session = req.cartSession;
    const { page = 1, limit = 10, search = "", category } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    let cart;
    if (session.customerId) {
      cart = await Cart.findOne({ customer: session.customerId });
    } else {
      cart = await Cart.findOne({ guestId: session.guestId });
    }

    if (!cart) {
      return res.status(200).json({
        success: true,
        data: {
          items: [],
          pricingSummary: {
            subtotal: 0,
            totalMrp: 0,
            totalSavings: 0,
            totalGst: 0,
            itemCount: 0,
            totalQuantity: 0,
          },
          pagination: {
            total: 0,
            page: pageNum,
            limit: limitNum,
            totalPages: 0,
          },
        },
      });
    }

    let populatedCart = await getPopulatedCart(cart._id);

    // Filter out deleted product references
    let items = (populatedCart.items || []).filter((item) => item.product != null);

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

    // Calculate Pricing Summary Breakdown (for full filtered cart)
    let subtotal = 0;
    let totalMrp = 0;
    let totalSavings = 0;
    let totalGst = 0;
    let totalQuantity = 0;

    const formattedItems = items.map((item) => {
      const p = item.product;
      const itemMrpTotal = (p.mrp || 0) * item.quantity;
      const itemSellTotal = (p.sellPrice || 0) * item.quantity;
      const itemSavings = Math.max(0, itemMrpTotal - itemSellTotal);
      const gstRate = p.gstRate || 0;
      const itemGst = Math.round(((itemSellTotal * gstRate) / 100) * 100) / 100;

      subtotal += itemSellTotal;
      totalMrp += itemMrpTotal;
      totalSavings += itemSavings;
      totalGst += itemGst;
      totalQuantity += item.quantity;

      return {
        ...item,
        itemMrpTotal,
        itemSellTotal,
        itemSavings,
        itemGst,
      };
    });

    const total = formattedItems.length;
    const paginatedItems = formattedItems.slice(skip, skip + limitNum);

    return res.status(200).json({
      success: true,
      data: {
        _id: populatedCart._id,
        customer: populatedCart.customer,
        guestId: populatedCart.guestId,
        items: paginatedItems,
        pricingSummary: {
          subtotal: Math.round(subtotal * 100) / 100,
          totalMrp: Math.round(totalMrp * 100) / 100,
          totalSavings: Math.round(totalSavings * 100) / 100,
          totalGst: Math.round(totalGst * 100) / 100,
          itemCount: formattedItems.length,
          totalQuantity,
        },
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
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

    const guestId =
      (req.body?.guestId && typeof req.body.guestId === "string")
        ? req.body.guestId.trim()
        : req.cookies?.guestId || req.headers["x-guest-id"];

    let customerCart = await Cart.findOne({ customer: customerId });

    if (!guestId) {
      if (!customerCart) {
        customerCart = await Cart.create({ customer: customerId, items: [] });
      }
      const populatedCart = await getPopulatedCart(customerCart._id);
      return res.status(200).json({
        success: true,
        message: "No guest cart found to merge.",
        data: populatedCart,
      });
    }

    const guestCart = await Cart.findOne({ guestId });

    if (!guestCart || !guestCart.items || guestCart.items.length === 0) {
      // Nothing to merge, clear guestId cookie & return customer cart
      res.clearCookie("guestId");
      if (!customerCart) {
        customerCart = await Cart.create({ customer: customerId, items: [] });
      }
      const populatedCart = await getPopulatedCart(customerCart._id);
      return res.status(200).json({
        success: true,
        message: "Cart merge completed (no items in guest cart)",
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
    res.clearCookie("guestId"); // Clear guest session cookie after merging

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
