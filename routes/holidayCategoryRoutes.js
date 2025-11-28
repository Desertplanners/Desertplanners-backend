import express from "express";
import {
  addHolidayCategory,
  getHolidayCategories,
  deleteHolidayCategory,
  updateHolidayCategory,
  getHolidayPackagesByCategory,
} from "../controllers/holidayCategoryController.js";

const router = express.Router();

/*  
-------------------------------------------
      HOLIDAY CATEGORY ROUTES (UPDATED)
-------------------------------------------
*/

// ➕ Add new category
router.post("/", addHolidayCategory);

// 📄 Get all categories
router.get("/", getHolidayCategories);

// 📝 Update category (name + slug + SEO update)
router.put("/:id", updateHolidayCategory);

// ❌ Delete category (also deletes category SEO)
router.delete("/:id", deleteHolidayCategory);

// 📦 Get holiday packages inside a category by slug
router.get("/category/:slug", getHolidayPackagesByCategory);

export default router;
