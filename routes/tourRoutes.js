import express from "express";
import multer from "multer";
import path from "path";
import {
  addTour,
  getTours,
  getTourBySlug,
  deleteTour,
  getToursByCategory,
  updateTour,
  checkAvailability, // 🔴 New import
} from "../controllers/tourController.js";

const router = express.Router();

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
const upload = multer({ storage });

// Routes
router.post(
  "/",
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "galleryImages", maxCount: 10 },
  ]),
  addTour
);

router.get("/", getTours);
router.get("/category/:categoryName", getToursByCategory);
router.get("/:slug", getTourBySlug);
router.delete("/:id", deleteTour);
router.put(
  "/:id",
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "galleryImages", maxCount: 10 },
  ]),
  updateTour
);

// 🔴 New route for checking availability
router.post("/check-availability", checkAvailability);

export default router;
