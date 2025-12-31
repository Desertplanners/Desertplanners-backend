import express from "express";
import {
  addBlogCategory,
  getBlogCategories,
  updateBlogCategory,
  deleteBlogCategory,
  getBlogsByCategory,
  getBlogCategoryBySlug, // ⭐ NEW
} from "../controllers/blogCategoryController.js";

const router = express.Router();

/*
-------------------------------------------
      BLOG CATEGORY ROUTES
-------------------------------------------
*/

// ➕ Add new blog category
router.post("/", addBlogCategory);

// 📄 Get all categories
router.get("/", getBlogCategories);

// ⭐ GET SINGLE CATEGORY BY SLUG (SEO HELPER)
router.get("/slug/:slug", getBlogCategoryBySlug);

// 📝 Update category
router.put("/:id", updateBlogCategory);

// ❌ Delete category
router.delete("/:id", deleteBlogCategory);

// 📦 Get blogs inside a category by slug
router.get("/category/:slug", getBlogsByCategory);

export default router;
