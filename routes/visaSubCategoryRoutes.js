import express from "express";
import {
  addVisaSubCategory,
  getAllVisaSubCategories,
  getSubCategoriesByCategory,
  updateSubCategoryDescription,
  deleteVisaSubCategory,      // ⭐ ADD
  updateVisaSubCategory,
  getSubCategoriesByCategorySlug      // ⭐ ADD
} from "../controllers/visaSubCategoryController.js";

const router = express.Router();

router.post("/", addVisaSubCategory);
router.get("/all", getAllVisaSubCategories); 
router.get("/category/:categoryId", getSubCategoriesByCategory);
router.get("/", getSubCategoriesByCategorySlug);
// edit name
router.put("/:id", updateVisaSubCategory);

// SEO content
router.put("/:id/description", updateSubCategoryDescription);

// delete
router.delete("/:id", deleteVisaSubCategory);

export default router;
