// routes/visaCategoryRoutes.js
import express from "express";
import {
  addVisaCategory,
  getVisaCategories,
  deleteVisaCategory,
  updateVisaCategory,
  getVisasByCategory,
  getVisaCategoryById,              // ⭐ NEW
  updateVisaCategoryDescription,    // ⭐ NEW
} from "../controllers/visaCategoryController.js";

const router = express.Router();

/*  
-------------------------------------------
      VISA CATEGORY ROUTES (UPDATED)
-------------------------------------------
*/

router.post("/", addVisaCategory);
router.get("/", getVisaCategories);

router.get("/:id", getVisaCategoryById);
router.put("/:id/description", updateVisaCategoryDescription);

router.put("/:id", updateVisaCategory);
router.delete("/:id", deleteVisaCategory);

router.get("/category/:slug", getVisasByCategory);


export default router;
