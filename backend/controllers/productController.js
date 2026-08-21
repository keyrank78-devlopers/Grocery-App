const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");
const SubCategory = require("../models/SubCategory");
const { uploadToCloudinary, deleteFromCloudinary } = require("../config/cloudinary");
const generateCustomId = require("../utils/generateCustomId");

// ───────────────────────────────────────────────────────────────
// Create Product
// POST /api/v1/admin/products
// ───────────────────────────────────────────────────────────────
const createProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      subCategory,
      description,
      mrp,
      sellPrice,
      stockQuantity,
      gstRate,
      variants,
    } = req.body;

    // Basic Validation
    if (!name || !category || !subCategory || mrp === undefined || sellPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name, Category, Sub-category, MRP, and Selling Price are required",
      });
    }

    if (!req.files || !req.files.image || !req.files.image[0]) {
      return res.status(400).json({
        success: false,
        message: "Product main image is required",
      });
    }

    const numericMrp = Number(mrp);
    const numericSellPrice = Number(sellPrice);
    const numericStock = stockQuantity !== undefined ? Number(stockQuantity) : 0;
    const numericGstRate = gstRate !== undefined ? Number(gstRate) : 0;

    if (isNaN(numericGstRate) || numericGstRate < 0) {
      return res.status(400).json({
        success: false,
        message: "GST rate must be a non-negative number",
      });
    }

    if (numericSellPrice > numericMrp) {
      return res.status(400).json({
        success: false,
        message: "Selling price cannot be greater than MRP",
      });
    }

    // Verify Category and Subcategory
    const catExists = await Category.findById(category).lean();
    if (!catExists) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const subCatExists = await SubCategory.findOne({ _id: subCategory, category }).lean();
    if (!subCatExists) {
      return res.status(400).json({
        success: false,
        message: "Sub-category not found or does not belong to the selected Category",
      });
    }

    // Parse Variants
    let parsedVariants = [];
    if (variants) {
      try {
        parsedVariants = typeof variants === "string" ? JSON.parse(variants) : variants;
        if (!Array.isArray(parsedVariants)) {
          return res.status(400).json({
            success: false,
            message: "Variants must be an array of key-value pairs",
          });
        }
        for (const variant of parsedVariants) {
          if (!variant.key || !variant.value) {
            return res.status(400).json({
              success: false,
              message: "Each variant must contain both 'key' and 'value'",
            });
          }
        }
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: "Invalid variants JSON format",
        });
      }
    }

    // Upload to Cloudinary (with rollback logic)
    const uploadedAssets = [];
    let mainImageResult = null;
    let otherImagesResults = [];
    let videoResult = null;

    try {
      // 1. Main Image
      const mainImageFile = req.files.image[0];
      mainImageResult = await uploadToCloudinary(mainImageFile.buffer, "products", "image");
      uploadedAssets.push({ public_id: mainImageResult.public_id, resourceType: "image" });

      // 2. Optional Other Images
      if (req.files.images) {
        for (const file of req.files.images) {
          const resImg = await uploadToCloudinary(file.buffer, "products", "image");
          otherImagesResults.push(resImg);
          uploadedAssets.push({ public_id: resImg.public_id, resourceType: "image" });
        }
      }

      // 3. Optional Video
      if (req.files.video && req.files.video[0]) {
        const videoFile = req.files.video[0];
        videoResult = await uploadToCloudinary(videoFile.buffer, "products", "video");
        uploadedAssets.push({ public_id: videoResult.public_id, resourceType: "video" });
      }
    } catch (uploadError) {
      // Rollback/Delete anything uploaded
      for (const asset of uploadedAssets) {
        await deleteFromCloudinary(asset.public_id, asset.resourceType);
      }
      return res.status(500).json({
        success: false,
        message: "Failed to upload product media files to Cloudinary",
        error: uploadError.message,
      });
    }

    // Generate SKU
    const sku = await generateCustomId("ProductSKU", "SKU");

    // Save Product to DB
    try {
      const product = await Product.create({
        name: name.trim(),
        category,
        subCategory,
        description: description ? description.trim() : "",
        mrp: numericMrp,
        sellPrice: numericSellPrice,
        stockQuantity: numericStock,
        gstRate: numericGstRate,
        sku,
        image: mainImageResult,
        images: otherImagesResults,
        video: videoResult || { url: "", public_id: "" },
        variants: parsedVariants,
        createdBy: req.admin._id,
      });

      return res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: product,
      });
    } catch (dbError) {
      // Cleanup Cloudinary uploads if database save fails
      for (const asset of uploadedAssets) {
        await deleteFromCloudinary(asset.public_id, asset.resourceType);
      }
      console.error("Database Save Product Error:", dbError);
      return res.status(500).json({
        success: false,
        message: "Internal server error saving product to database",
      });
    }
  } catch (error) {
    console.error("Create Product Global Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Get All Products (Avoids N+1 Query by using population)
// GET /api/v1/admin/get-products
// ───────────────────────────────────────────────────────────────
const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", category, subCategory, status } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};

    if (search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { sku: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (category) filter.category = category;
    if (subCategory) filter.subCategory = subCategory;

    if (status === "active") filter.isActive = true;
    else if (status === "inactive") filter.isActive = false;

    // Query both total counts and paginated products in parallel.
    // Category and SubCategory are loaded in bulk using Mongoose population to prevent N+1 Queries.
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "category_id name slug image")
        .populate("subCategory", "sub_category_id name slug image")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get Products Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Get Single Product
// GET /api/v1/admin/single-products/:id
// ───────────────────────────────────────────────────────────────
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.isValidObjectId(id) ? { _id: id } : { sku: id };

    const product = await Product.findOne(query)
      .populate("category", "category_id name slug image")
      .populate("subCategory", "sub_category_id name slug image")
      .populate("createdBy", "fullName email mobile")
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Get Single Product Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Update Product
// PUT /api/v1/admin/update-products/:id
// ───────────────────────────────────────────────────────────────
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      subCategory,
      description,
      mrp,
      sellPrice,
      stockQuantity,
      gstRate,
      variants,
      isActive,
    } = req.body;

    const query = mongoose.isValidObjectId(id) ? { _id: id } : { sku: id };
    const product = await Product.findOne(query);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Verify Selling Price vs MRP constraint
    const finalMrp = mrp !== undefined ? Number(mrp) : product.mrp;
    const finalSellPrice = sellPrice !== undefined ? Number(sellPrice) : product.sellPrice;
    if (finalSellPrice > finalMrp) {
      return res.status(400).json({
        success: false,
        message: "Selling price cannot be greater than MRP",
      });
    }

    // Verify Category and Subcategory references if updated
    const finalCategory = category || product.category;
    const finalSubCategory = subCategory || product.subCategory;
    if (category || subCategory) {
      const catExists = await Category.findById(finalCategory).lean();
      if (!catExists) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }
      const subCatExists = await SubCategory.findOne({ _id: finalSubCategory, category: finalCategory }).lean();
      if (!subCatExists) {
        return res.status(400).json({
          success: false,
          message: "Sub-category not found or does not belong to the selected Category",
        });
      }
    }

    // Parse variants if updated
    let parsedVariants = undefined;
    if (variants !== undefined) {
      try {
        parsedVariants = typeof variants === "string" ? JSON.parse(variants) : variants;
        if (!Array.isArray(parsedVariants)) {
          return res.status(400).json({
            success: false,
            message: "Variants must be an array of key-value pairs",
          });
        }
        for (const variant of parsedVariants) {
          if (!variant.key || !variant.value) {
            return res.status(400).json({
              success: false,
              message: "Each variant must contain both 'key' and 'value'",
            });
          }
        }
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: "Invalid variants JSON format",
        });
      }
    }

    // Handle Upload Asset Updates (with Rollback support)
    const newUploadedAssets = [];
    let newMainImage = null;
    let newOtherImages = [];
    let newVideo = null;

    try {
      // 1. New main image
      if (req.files && req.files.image && req.files.image[0]) {
        newMainImage = await uploadToCloudinary(req.files.image[0].buffer, "products", "image");
        newUploadedAssets.push({ public_id: newMainImage.public_id, resourceType: "image" });
      }

      // 2. New additional images (replaces all old ones if provided)
      if (req.files && req.files.images) {
        for (const file of req.files.images) {
          const imgRes = await uploadToCloudinary(file.buffer, "products", "image");
          newOtherImages.push(imgRes);
          newUploadedAssets.push({ public_id: imgRes.public_id, resourceType: "image" });
        }
      }

      // 3. New video
      if (req.files && req.files.video && req.files.video[0]) {
        newVideo = await uploadToCloudinary(req.files.video[0].buffer, "products", "video");
        newUploadedAssets.push({ public_id: newVideo.public_id, resourceType: "video" });
      }
    } catch (uploadError) {
      // Clean up newly uploaded files on exception
      for (const asset of newUploadedAssets) {
        await deleteFromCloudinary(asset.public_id, asset.resourceType);
      }
      return res.status(500).json({
        success: false,
        message: "Failed to upload product media files to Cloudinary during update",
        error: uploadError.message,
      });
    }

    // Clean up old assets from Cloudinary and assign new values
    if (newMainImage) {
      if (product.image?.public_id) {
        await deleteFromCloudinary(product.image.public_id, "image");
      }
      product.image = newMainImage;
    }

    // Handle additional images: retain selected existing ones, delete others, and append new uploads
    let remainingImages = [];
    if (req.body.remainingImages !== undefined) {
      try {
        remainingImages = typeof req.body.remainingImages === "string" 
          ? JSON.parse(req.body.remainingImages) 
          : req.body.remainingImages;
        if (!Array.isArray(remainingImages)) remainingImages = [];
      } catch (err) {
        console.error("Parse remainingImages error:", err);
      }
    } else {
      remainingImages = product.images || [];
    }

    const remainingPublicIds = remainingImages.map(img => typeof img === "string" ? img : img.public_id);
    const keptImages = [];

    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        if (img.public_id && remainingPublicIds.includes(img.public_id)) {
          keptImages.push(img);
        } else if (img.public_id) {
          try {
            await deleteFromCloudinary(img.public_id, "image");
          } catch (delErr) {
            console.error("Failed to delete removed image from Cloudinary during update:", img.public_id, delErr);
          }
        }
      }
    }

    if (newOtherImages.length > 0) {
      product.images = [...keptImages, ...newOtherImages];
    } else {
      product.images = keptImages;
    }

    if (newVideo) {
      if (product.video?.public_id) {
        await deleteFromCloudinary(product.video.public_id, "video");
      }
      product.video = newVideo;
    }

    // Apply remaining field updates
    if (name) product.name = name.trim();
    if (category) product.category = category;
    if (subCategory) product.subCategory = subCategory;
    if (description !== undefined) product.description = description.trim();
    if (mrp !== undefined) product.mrp = numericMrp;
    if (sellPrice !== undefined) product.sellPrice = numericSellPrice;
    if (stockQuantity !== undefined) product.stockQuantity = Number(stockQuantity);
    if (gstRate !== undefined) {
      const numericGstRate = Number(gstRate);
      if (isNaN(numericGstRate) || numericGstRate < 0) {
        return res.status(400).json({
          success: false,
          message: "GST rate must be a non-negative number",
        });
      }
      product.gstRate = numericGstRate;
    }
    if (parsedVariants !== undefined) product.variants = parsedVariants;
    if (isActive !== undefined) {
      product.isActive = isActive === "true" || isActive === true;
    }

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    console.error("Update Product Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Delete Product
// DELETE /api/v1/admin/delete-products/:id
// ───────────────────────────────────────────────────────────────
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.isValidObjectId(id) ? { _id: id } : { sku: id };
    const product = await Product.findOne(query);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Delete assets from Cloudinary
    if (product.image?.public_id) {
      await deleteFromCloudinary(product.image.public_id, "image");
    }

    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        if (img.public_id) {
          await deleteFromCloudinary(img.public_id, "image");
        }
      }
    }

    if (product.video?.public_id) {
      await deleteFromCloudinary(product.video.public_id, "video");
    }

    await product.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete Product Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ───────────────────────────────────────────────────────────────
// Toggle Product Status (Active / Inactive)
// PATCH /api/v1/admin/products/:id/toggle-status
// ───────────────────────────────────────────────────────────────
const toggleProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.isValidObjectId(id) ? { _id: id } : { sku: id };
    const product = await Product.findOne(query);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    product.isActive = !product.isActive;
    await product.save();

    return res.status(200).json({
      success: true,
      message: `Product ${product.isActive ? "activated" : "deactivated"} successfully`,
      data: { sku: product.sku, isActive: product.isActive },
    });
  } catch (error) {
    console.error("Toggle Product Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
};
