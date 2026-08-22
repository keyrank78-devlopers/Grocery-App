const multer = require("multer");
const { uploadCategoryImage, uploadBannerImage } = require("../config/cloudinary");

// Wraps multer upload in a promise so errors can be caught cleanly in controllers
const handleCategoryImageUpload = (req, res, next) => {
  uploadCategoryImage(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Image upload failed",
      });
    }
    next();
  });
};

const handleBannerImageUpload = (req, res, next) => {
  uploadBannerImage(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Image upload failed",
      });
    }
    next();
  });
};

// Multer memory storage configuration for product files
const productUploadConfig = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB total buffer ceiling
  },
  fileFilter: (req, file, cb) => {
    const isImage = file.fieldname === "image" || file.fieldname === "images";
    const isVideo = file.fieldname === "video";

    if (isImage) {
      const allowedMimetypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/x-png"];
      const allowedExtensions = /\.(jpg|jpeg|png|webp)$/i;
      const validMime = allowedMimetypes.includes(file.mimetype);
      const validExt = allowedExtensions.test(file.originalname);
      if (validMime || validExt) {
        cb(null, true);
      } else {
        cb(new Error("Only jpg, jpeg, png, webp images are allowed for product image/images"), false);
      }
    } else if (isVideo) {
      const allowedMimetypes = ["video/mp4", "video/mpeg", "video/ogg", "video/webm", "video/quicktime"];
      const allowedExtensions = /\.(mp4|mpeg|ogg|webm|mov)$/i;
      const validMime = allowedMimetypes.includes(file.mimetype);
      const validExt = allowedExtensions.test(file.originalname);
      if (validMime || validExt) {
        cb(null, true);
      } else {
        cb(new Error("Only mp4, mpeg, ogg, webm, mov videos are allowed for product video"), false);
      }
    } else {
      cb(new Error(`Unexpected field: ${file.fieldname}`), false);
    }
  },
}).fields([
  { name: "image", maxCount: 1 },
  { name: "images", maxCount: 10 },
  { name: "video", maxCount: 1 },
]);

const handleProductUpload = (req, res, next) => {
  productUploadConfig(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "File upload failed",
      });
    }

    // Validate individual file sizes
    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        const file = req.files.image[0];
        if (file.size > 1 * 1024 * 1024) {
          return res.status(400).json({
            success: false,
            message: "Main product image must be less than 1MB",
          });
        }
      }

      if (req.files.images) {
        for (const file of req.files.images) {
          if (file.size > 1 * 1024 * 1024) {
            return res.status(400).json({
              success: false,
              message: "Each additional product image must be less than 1MB",
            });
          }
        }
      }

      if (req.files.video && req.files.video[0]) {
        const file = req.files.video[0];
        if (file.size > 3 * 1024 * 1024) {
          return res.status(400).json({
            success: false,
            message: "Product video must be less than 3MB",
          });
        }
      }
    }

    next();
  });
};

module.exports = { handleCategoryImageUpload, handleProductUpload, handleBannerImageUpload };
