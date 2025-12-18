import express from "express";
import {
  addCategory,
  getCategories,
  getCategoryById,              // ⭐ NEW
  deleteCategory,
  editCategory,
  updateCategoryDescription,    // ⭐ NEW
} from "../controllers/categoryController.js";

const router = express.Router();

// 🟢 Add new category
router.post("/", addCategory);

// 🟢 Fetch all categories
router.get("/", getCategories);

// 🔵 Get single category (for SEO editor)
router.get("/:id", getCategoryById);

// 🟣 Update ONLY category description (SEO / Content editor)
router.put("/:id/description", updateCategoryDescription);

// 🔵 Edit category name / slug
router.put("/:id", editCategory);

// 🟠 Delete category
router.delete("/:id", deleteCategory);

export default router;
