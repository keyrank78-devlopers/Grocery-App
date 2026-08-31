const mongoose = require("mongoose");

const warehouseStockSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product reference is required"],
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: [true, "Warehouse reference is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock quantity cannot be negative"],
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes for fast querying
warehouseStockSchema.index({ warehouse: 1, product: 1 }, { unique: true });
warehouseStockSchema.index({ product: 1 });
warehouseStockSchema.index({ quantity: 1 });

module.exports = mongoose.model("WarehouseStock", warehouseStockSchema);
