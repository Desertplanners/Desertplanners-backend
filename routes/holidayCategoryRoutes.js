import express from "express";
import {
  addHolidayCategory,
  getHolidayCategories,
  deleteHolidayCategory,
  updateHolidayCategory,
  getHolidayPackagesByCategory,
  getHolidayCategoryById,
  updateHolidayCategoryDescription,
  getHolidayCategoryBySlug,
} from "../controllers/holidayCategoryController.js";

const router = express.Router();

// ➕ Add new category
router.post("/", addHolidayCategory);

// 📄 Get all categories
router.get("/", getHolidayCategories);

// ⭐⭐⭐ IMPORTANT: STATIC ROUTES FIRST ⭐⭐⭐
router.get("/slug/:slug", getHolidayCategoryBySlug);
router.get("/category/:slug", getHolidayPackagesByCategory);

// 📝 Update description
router.put("/:id/description", updateHolidayCategoryDescription);

// 📝 Update category
router.put("/:id", updateHolidayCategory);

// ❌ Delete category
router.delete("/:id", deleteHolidayCategory);

// 🔍 Get category by ID (LAST)
router.get("/:id", getHolidayCategoryById);

export default router;
