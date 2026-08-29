const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Shared allowed formats ─────────────────────────────────────
const IMAGE_FORMATS = ["jpg", "jpeg", "png", "webp", "avif"];
const IMAGE_MIMETYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/x-png",
  "image/avif",
  "image/x-avif",
];
const IMAGE_EXT_REGEX = /\.(jpg|jpeg|png|webp|avif)$/i;

const imageFileFilter = (_req, file, cb) => {
  const validMime = IMAGE_MIMETYPES.includes(file.mimetype);
  const validExt = IMAGE_EXT_REGEX.test(file.originalname);
  if (validMime || validExt) {
    cb(null, true);
  } else {
    cb(new Error("Only jpg, jpeg, png, webp, avif images are allowed"), false);
  }
};

// ── Category Storage ───────────────────────────────────────────
const categoryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "categories",
    allowed_formats: IMAGE_FORMATS,
    transformation: [{ width: 500, height: 500, crop: "limit", quality: "auto" }],
  },
});

const uploadCategoryImage = multer({
  storage: categoryStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: imageFileFilter,
}).single("image");

// ── Sub-Category Storage ───────────────────────────────────────
const subCategoryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "sub-categories",
    allowed_formats: IMAGE_FORMATS,
    transformation: [{ width: 500, height: 500, crop: "limit", quality: "auto" }],
  },
});

const uploadSubCategoryImage = multer({
  storage: subCategoryStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: imageFileFilter,
}).single("image");

// ── Banner Storage ─────────────────────────────────────────────
const bannerStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "banners",
    allowed_formats: IMAGE_FORMATS,
    transformation: [{ quality: "auto" }],
  },
});

const uploadBannerImage = multer({
  storage: bannerStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: imageFileFilter,
}).single("image");

// ── Avatar Storage ─────────────────────────────────────────────
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "avatars",
    allowed_formats: IMAGE_FORMATS,
    transformation: [{ width: 300, height: 300, crop: "thumb", gravity: "face", quality: "auto" }],
  },
});

const uploadAvatarImage = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: imageFileFilter,
}).single("image");

// ── Stream upload (used for products) ─────────────────────────
const uploadToCloudinary = (fileBuffer, folder, resourceType = "auto") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, public_id: result.public_id });
      }
    );
    uploadStream.end(fileBuffer);
  });
};

// ── Notification Storage ───────────────────────────────────────
const notificationStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "notifications",
    allowed_formats: IMAGE_FORMATS,
    // Optional: add transformation if you want to resize banner images
    transformation: [{ width: 800, crop: "limit", quality: "auto" }],
  },
});

const uploadNotificationImage = multer({
  storage: notificationStorage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB limit for notification banners
  fileFilter: imageFileFilter,
}).single("image");

// ── Delete from Cloudinary ─────────────────────────────────────
const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  if (!publicId) return;
  try {
    return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.error(`Failed to delete ${publicId} from Cloudinary:`, error.message);
  }
};

module.exports = {
  cloudinary,
  uploadCategoryImage,
  uploadSubCategoryImage,
  uploadBannerImage,
  uploadAvatarImage,
  uploadToCloudinary,
  deleteFromCloudinary,
  uploadNotificationImage,
  IMAGE_MIMETYPES,
  IMAGE_EXT_REGEX,
};
