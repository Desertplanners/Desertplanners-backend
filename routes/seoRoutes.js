import express from "express";
import seoUpload from "../middleware/seoUpload.js";
import { createSEO, updateSEO, getSEO, deleteSEO } from "../controllers/seoController.js";

const router = express.Router();

router.post("/create", seoUpload.single("ogImage"), createSEO);
router.put("/update", seoUpload.single("ogImage"), updateSEO);

router.get("/get", getSEO);
router.post("/delete", deleteSEO);

export default router;
