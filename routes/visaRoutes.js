import express from "express";
import {
  getAllVisas,
  getVisaBySlug,
  createVisa,
  updateVisa,
  deleteVisa,
  getVisasByCategory,
  getVisaById,
  getVisaNavbarTree,
} from "../controllers/visaController.js";

import { visaUpload } from "../middleware/visaUpload.js"; // ✅ NEW CORRECT IMPORT

const router = express.Router();

// 🟩 CREATE VISA (single image upload)
router.post("/", visaUpload.single("img"), createVisa);

// 🟨 UPDATE VISA (optional image upload)
router.put("/:id", visaUpload.single("img"), updateVisa);
router.get("/visa-navbar", getVisaNavbarTree);
// 🟦 GET VISAS BY CATEGORY
router.get("/category/:slug", getVisasByCategory);

router.get("/id/:id", getVisaById);
// 🟦 GET ALL
router.get("/", getAllVisas);

// 🟦 GET BY SLUG
router.get("/:slug", getVisaBySlug);


// 🟥 DELETE
router.delete("/:id", deleteVisa);

export default router;
