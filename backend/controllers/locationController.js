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

    // GeoNear aggregation search
    const nearestWarehouses = await Warehouse.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [searchLng, searchLat],
          },
          distanceField: "distanceKm",
          distanceMultiplier: 0.001, // convert meters to KM
          spherical: true,
          query: { isActive: true },
        },
      },
      {
        $match: {
          $expr: {
            $lte: ["$distanceKm", "$deliveryRangeKm"],
          },
        },
      },
      {
        $sort: { distanceKm: 1 },
      },
      {
        $limit: 1,
      },
    ]);

    if (!nearestWarehouses || nearestWarehouses.length === 0) {
      return res.status(200).json({
        success: true,
        isServiceable: false,
        estimatedDeliveryTime: null,
        warehouse: null,
        message: "Sorry, we currently do not deliver to this location.",
      });
    }

    const warehouse = nearestWarehouses[0];
    const dist = Number(warehouse.distanceKm.toFixed(2));

    // Dynamic ETA calculation based on distance
    let etaMinutes = "8-12 mins";
    if (dist > 3) etaMinutes = "15-20 mins";
    else if (dist > 1.5) etaMinutes = "10-15 mins";

    return res.status(200).json({
      success: true,
      isServiceable: true,
      estimatedDeliveryTime: etaMinutes,
      warehouse: {
        id: warehouse.warehouse_id,
        name: warehouse.name,
        distanceKm: dist,
        deliveryRangeKm: warehouse.deliveryRangeKm,
      },
      message: `Express Delivery in ${etaMinutes} ⚡`,
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
