import express from "express";
import {
  addTour,
  getTours,
  getTourBySlug,
  deleteTour,
  getToursByCategory,
  updateTour,
  getTourById,
  checkAvailability,
} from "../controllers/tourController.js";

import { tourUpload } from "../middleware/tourUpload.js";  // 🟢 Updated

const router = express.Router();

// 🟢 Add Tour
router.post(
  "/",
  tourUpload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "galleryImages", maxCount: 10 },
  ]),
  addTour
);

// 🟡 Update Tour
router.put(
  "/:id",
  tourUpload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "galleryImages", maxCount: 10 },
  ]),
  updateTour
);

// 🟠 Get Routes
router.get("/", getTours);
router.get("/id/:id", getTourById);
router.get("/category/:categoryName", getToursByCategory);
router.get("/:slug", getTourBySlug);
router.delete("/:id", deleteTour);

// 🔵 Check Availability
router.post("/check-availability", checkAvailability);

export default router;
