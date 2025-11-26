import express from "express";
import {
  createSEO,
  updateSEO,
  getSEO,
  deleteSEO
} from "../controllers/seoController.js";

const router = express.Router();

// Create SEO
router.post("/create", createSEO);

// Update SEO
router.put("/update", updateSEO);

// Get SEO by parentType + parentId
router.get("/get", getSEO);

// Delete SEO for a specific parent
router.post("/delete", deleteSEO);

export default router;
