import express from "express";
import {
  getAllVisas,
  getVisaBySlug,
  createVisa,
  updateVisa,
  deleteVisa,
} from "../controllers/visaController.js";

const router = express.Router();

router.get("/", getAllVisas);
router.get("/:slug", getVisaBySlug);
router.post("/", createVisa);
router.put("/:id", updateVisa);
router.delete("/:id", deleteVisa);

export default router;
