import express from "express";
import {
  createHolidayTour,
  getAllHolidayTours,
  getHolidayTourById,
  updateHolidayTour,
  deleteHolidayTour,
  getToursByCategory,
  getHolidayPackageBySlug,
} from "../controllers/holidayTourController.js";

import { holidayTourUpload } from "../middleware/holidayTourUpload.js";

const router = express.Router();

// ⭐ Allow up to 50 itinerary image fields
const itineraryFields = Array.from({ length: 50 }).map((_, i) => ({
  name: `itineraryImages_${i}`,
  maxCount: 1,
}));

/* =========================================================
   🟢 PUBLIC ROUTES (WEBSITE / NAVBAR)
   👉 ONLY status: "published"
   ========================================================= */

// ⭐ GET HOLIDAY TOURS BY CATEGORY (Navbar / Listing page)
router.get("/category/:slug", getToursByCategory);

// ⭐ GET SINGLE HOLIDAY PACKAGE BY SLUG (Detail page)
router.get(
  "/category/:categorySlug/:packageSlug",
  getHolidayPackageBySlug
);

/* =========================================================
   🔵 ADMIN ROUTES (DASHBOARD)
   👉 Draft + Published
   ========================================================= */

// ⭐ CREATE HOLIDAY TOUR
router.post(
  "/create",
  holidayTourUpload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "sliderImages", maxCount: 20 },
    ...itineraryFields,
  ]),
  createHolidayTour
);

// ⭐ GET ALL HOLIDAY TOURS (Admin list)
router.get("/all", getAllHolidayTours);

// ⭐ UPDATE HOLIDAY TOUR
router.put(
  "/update/:id",
  holidayTourUpload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "sliderImages", maxCount: 20 },
    ...itineraryFields,
  ]),
  updateHolidayTour
);

// ⭐ DELETE HOLIDAY TOUR
router.delete("/delete/:id", deleteHolidayTour);

// ⭐ GET HOLIDAY TOUR BY ID (Admin edit page)
// ❗ MUST BE LAST – otherwise conflicts with /category/*
router.get("/:id", getHolidayTourById);

export default router;
