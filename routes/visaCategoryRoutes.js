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
import { visaCategoryUpload } from "../middleware/visaCategoryUpload.js";

const router = express.Router();

/*  
-------------------------------------------
      VISA CATEGORY ROUTES (UPDATED)
-------------------------------------------
*/

router.post("/", visaCategoryUpload.single("image"), addVisaCategory);
router.get("/", getVisaCategories);

router.get("/:id", getVisaCategoryById);
router.put("/:id/description", updateVisaCategoryDescription);

router.put("/:id", visaCategoryUpload.single("image"), updateVisaCategory);
router.delete("/:id", deleteVisaCategory);

router.get("/category/:slug", getVisasByCategory);


export default router;
