import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

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

const categoryStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const original = file.originalname;
    const base = original.split(".")[0];
    const safe = sanitizeFileName(base);

    return {
      folder: "desertplanners_uploads/visa_categories", // ⭐ separate folder
      public_id: `${safe}-${Date.now()}`,
      resource_type: "auto",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
    };
  },
});

export const visaCategoryUpload = multer({ storage: categoryStorage });
