import express from "express";
import {
  createBlog,
  getBlogs,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
} from "../controllers/blogController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ➕ Create Blog (LOGIN REQUIRED)
router.post("/", protect, createBlog);

// 📄 Get all blogs
router.get("/", getBlogs);

// 📦 Get blog by slug (frontend)
router.get("/:slug", getBlogBySlug);

// 📝 Update blog (LOGIN REQUIRED)
router.put("/:id", protect, updateBlog);

// ❌ Delete blog (LOGIN REQUIRED)
router.delete("/:id", protect, deleteBlog);

export default router;

