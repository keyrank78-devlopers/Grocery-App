const express = require("express");
const {
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  getCart,
  mergeCart,
} = require("../controllers/cartController");
const { optionalCustomerAuth, resolveCartSession } = require("../middleware/auth");

const router = express.Router();

// Apply optionalCustomerAuth and resolveCartSession to validate session identification (customer token or guestId)
router.post("/add", optionalCustomerAuth, resolveCartSession, addToCart);
router.post("/increase", optionalCustomerAuth, resolveCartSession, increaseQuantity);
router.post("/decrease", optionalCustomerAuth, resolveCartSession, decreaseQuantity);
router.post("/remove", optionalCustomerAuth, resolveCartSession, removeFromCart);
router.get("/view-cart", optionalCustomerAuth, resolveCartSession, getCart);
router.post("/merge", optionalCustomerAuth, resolveCartSession, mergeCart);

module.exports = router;
