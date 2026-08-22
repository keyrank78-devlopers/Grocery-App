const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for category images
const categoryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "categories",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 500, height: 500, crop: "limit", quality: "auto" }],
  },
});

const uploadCategoryImage = multer({
  storage: categoryStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: (_req, file, cb) => {
    const allowedMimetypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/x-png"];
    const allowedExtensions = /\.(jpg|jpeg|png|webp)$/i;

    const validMime = allowedMimetypes.includes(file.mimetype);
    const validExt = allowedExtensions.test(file.originalname);

    if (validMime || validExt) {
      cb(null, true);
    } else {
      cb(new Error("Only jpg, jpeg, png, webp images are allowed"), false);
    }
  },
}).single("image");

// Storage for banner images (preserves aspect ratio)
const bannerStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "banners",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ quality: "auto" }],
  },
});

const uploadBannerImage = multer({
  storage: bannerStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    const allowedMimetypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/x-png"];
    const allowedExtensions = /\.(jpg|jpeg|png|webp)$/i;

    const validMime = allowedMimetypes.includes(file.mimetype);
    const validExt = allowedExtensions.test(file.originalname);

    if (validMime || validExt) {
      cb(null, true);
    } else {
      cb(new Error("Only jpg, jpeg, png, webp images are allowed"), false);
    }
  },
}).single("image");

const uploadToCloudinary = (fileBuffer, folder, resourceType = "auto") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );
    uploadStream.end(fileBuffer);
  });
};

const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  if (!publicId) return;
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    console.error(`Failed to delete ${publicId} from Cloudinary:`, error.message);
  }
};

module.exports = {
  cloudinary,
  uploadCategoryImage,
  uploadBannerImage,
  uploadToCloudinary,
  deleteFromCloudinary,
};
