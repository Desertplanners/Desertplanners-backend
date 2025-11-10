import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

// ✅ Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🧠 Debug print
console.log("☁️ Connected to Cloudinary:", process.env.CLOUDINARY_CLOUD_NAME);

// ✅ Helper: sanitize invalid chars for Cloudinary public_id
const sanitizeFileName = (name) => {
  return name
    .normalize("NFD") // remove diacritics
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "") // remove anything not alphanumeric, space, dash, underscore
    .replace(/\s+/g, "-") // replace spaces with dash
    .replace(/-+/g, "-") // collapse multiple dashes
    .trim()
    .toLowerCase();
};

// ✅ Cloudinary storage config
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const baseName = file.originalname.split(".")[0];
    const safeName = sanitizeFileName(baseName);

    return {
      folder: "desertplanners_uploads/tours",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      resource_type: "image",
      // 👇 Always add timestamp to avoid duplicates
      public_id: `${safeName}-${Date.now()}`,
    };
  },
});

// ✅ Multer instance
export const upload = multer({ storage });
export default cloudinary;
