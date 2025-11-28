// routes/visaCategoryRoutes.js
import express from "express";
import {
  addVisaCategory,
  getVisaCategories,
  deleteVisaCategory,
  updateVisaCategory,
  getVisasByCategory,
} from "../controllers/visaCategoryController.js";

const router = express.Router();

/*  
-------------------------------------------
      VISA CATEGORY ROUTES (UPDATED)
-------------------------------------------
*/

// ➕ Add new visa category
router.post("/", addVisaCategory);

// 📄 Get all categories
router.get("/", getVisaCategories);

// 📝 Update category (name + slug)
router.put("/:id", updateVisaCategory);

// ❌ Delete category
router.delete("/:id", deleteVisaCategory);

// 📦 Get visas inside a category by slug
router.get("/category/:slug", getVisasByCategory);

export default router;
