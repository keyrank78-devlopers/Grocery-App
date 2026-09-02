const Warehouse = require("../models/Warehouse");

/**
 * Check location serviceability & calculate dynamic delivery ETA
 * POST /api/v1/location/check-serviceability
 */
const checkServiceability = async (req, res) => {
  try {
    const { latitude, longitude, pincode } = req.body;

    let searchLat = latitude !== undefined && latitude !== null ? Number(latitude) : null;
    let searchLng = longitude !== undefined && longitude !== null ? Number(longitude) : null;

    if (!searchLat || !searchLng) {
      if (pincode) {
        // Find warehouse by pincode match if lat/lng not provided
        const warehouseByPincode = await Warehouse.findOne({
          "address.pincode": pincode.toString().trim(),
          isActive: true,
        }).lean();

        if (warehouseByPincode) {
          return res.status(200).json({
            success: true,
            isServiceable: true,
            estimatedDeliveryTime: "10-15 mins",
            warehouse: {
              id: warehouseByPincode.warehouse_id,
              name: warehouseByPincode.name,
              city: warehouseByPincode.address.city,
            },
            message: "Express Delivery in 10-15 mins ⚡",
          });
        }
      }

      return res.status(400).json({
        success: false,
        message: "Latitude & longitude (or valid pincode) are required to check serviceability",
      });
    }

    // Find default active warehouse instead of doing GeoNear search
    const defaultWarehouse = await Warehouse.findOne({ isActive: true }).lean();

    if (!defaultWarehouse) {
      return res.status(200).json({
        success: true,
        isServiceable: false,
        estimatedDeliveryTime: null,
        warehouse: null,
        message: "Sorry, we currently do not deliver. System maintenance.",
      });
    }

    const etaMinutes = "2-3 Days"; // Default static ETA for single location setup

    return res.status(200).json({
      success: true,
      isServiceable: true,
      estimatedDeliveryTime: etaMinutes,
      warehouse: {
        id: defaultWarehouse.warehouse_id,
        name: defaultWarehouse.name,
        distanceKm: 0,
        deliveryRangeKm: defaultWarehouse.deliveryRangeKm || 10000,
      },
      message: `Standard Delivery in ${etaMinutes} ⚡`,
    });
  } catch (error) {
    console.error("Check Serviceability Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error checking location serviceability",
    });
  }
};

module.exports = {
  checkServiceability,
};
