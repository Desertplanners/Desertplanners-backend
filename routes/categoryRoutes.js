import express from "express";
import {
  addCategory,
  getCategories,
  deleteCategory,
  editCategory,
} from "../controllers/categoryController.js";

const router = express.Router();

// Admin can add new category
router.post("/", addCategory);

// Fetch all categories
router.get("/", getCategories);

// Admin can delete a category
router.delete("/:id", deleteCategory);

router.put("/:id", editCategory); // Edit category by ID ✅

export default router;
 
