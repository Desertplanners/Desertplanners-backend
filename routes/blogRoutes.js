import express from "express";
import {
  createBlog,
  getBlogs,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
  getBlogsByCategory,
} from "../controllers/blogController.js";

import { protect } from "../middleware/authMiddleware.js";
import { blogUpload } from "../middleware/blogUpload.js";

const router = express.Router();

/* ================================
   ➕ CREATE BLOG (Admin)
   ➕ Featured Image + Author Image
================================ */
router.post(
  "/",
  protect,
  blogUpload.fields([
    { name: "featuredImage", maxCount: 1 },
    { name: "authorImage", maxCount: 1 }, // ✅ NEW
  ]),
  createBlog
);

/* ================================
   📄 GET ALL BLOGS
================================ */
router.get("/", getBlogs);

/* ================================
   📂 GET BLOGS BY CATEGORY
   USE SLUG, NOT ID
================================ */
router.get("/category/:slug", getBlogsByCategory);

/* ================================
   📦 GET BLOG BY SLUG (Frontend)
   ⚠️ ALWAYS AFTER category route
================================ */
router.get("/:slug", getBlogBySlug);

/* ================================
   📝 UPDATE BLOG (Admin)
   ➕ Featured Image + Author Image
================================ */
router.put(
  "/:id",
  protect,
  blogUpload.fields([
    { name: "featuredImage", maxCount: 1 },
    { name: "authorImage", maxCount: 1 }, // ✅ NEW
  ]),
  updateBlog
);

/* ================================
   ❌ DELETE BLOG (Admin)
================================ */
router.delete("/:id", protect, deleteBlog);

export default router;
