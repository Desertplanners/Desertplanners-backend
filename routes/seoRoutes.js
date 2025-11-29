import express from "express";
import seoUpload from "../middleware/seoUpload.js";
import {
  saveSEO,
  getSEO,
  deleteSEO
} from "../controllers/seoController.js";

const router = express.Router();

// ⭐ CREATE + UPDATE (same endpoint)
router.post("/save", seoUpload.single("ogImage"), saveSEO);

// ⭐ GET SEO by parentType & parentId
router.get("/get", getSEO);

// ⭐ DELETE SEO
router.post("/delete", deleteSEO);

export default router;
