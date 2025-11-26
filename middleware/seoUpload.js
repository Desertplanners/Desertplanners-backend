import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

// 🧼 File name sanitizer (same as tours)
const sanitizeFileName = (name) => {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .toLowerCase();
};

// ⭐ SEO STORAGE CONFIG (OG Image Upload)
const seoStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const base = file.originalname.split(".")[0];
    const safe = sanitizeFileName(base);

    return {
      folder: "desertplanners_uploads/seo", // ⭐ SEO images folder
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      resource_type: "image",
      public_id: `${safe}-${Date.now()}`, // unique SEO image name
    };
  },
});

// ⭐ EXPORT MULTER SETUP
const seoUpload = multer({ storage: seoStorage });

export default seoUpload;
