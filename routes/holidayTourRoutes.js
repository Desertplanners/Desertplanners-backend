import express from "express";
import {
  createHolidayTour,
  getAllHolidayTours,
  getHolidayTourById,
  updateHolidayTour,
  deleteHolidayTour,
  getToursByCategory,
  getHolidayPackageBySlug,
  downloadItinerary,
  downloadFlyerWithLogo,
  downloadFlyerWithoutLogo
} from "../controllers/holidayTourController.js";

import { holidayTourUpload } from "../middleware/holidayTourUpload.js";

const router = express.Router();

/* =========================================================
   🟢 PUBLIC ROUTES (WEBSITE / NAVBAR)
   👉 ONLY status: "published"
   ========================================================= */

// ⭐ GET HOLIDAY TOURS BY CATEGORY (Navbar / Listing page)
router.get("/category/:slug", getToursByCategory);

// ⭐ DOWNLOAD ITINERARY
router.get("/download/itinerary/:slug", downloadItinerary);

// ⭐ DOWNLOAD FLYER WITH LOGO
router.get("/download/flyer-logo/:slug", downloadFlyerWithLogo);

// ⭐ DOWNLOAD FLYER WITHOUT LOGO
router.get("/download/flyer-no-logo/:slug", downloadFlyerWithoutLogo);

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
    { name: "itineraryImages", maxCount: 50 }, // ✅ Dynamic itinerary images
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
    { name: "itineraryImages", maxCount: 50 }, // ✅ Dynamic itinerary images
  ]),
  updateHolidayTour
);

// ⭐ DELETE HOLIDAY TOUR
router.delete("/delete/:id", deleteHolidayTour);

// ⭐ GET HOLIDAY TOUR BY ID (Admin edit page)
// ❗ MUST BE LAST – otherwise conflicts with /category/*
router.get("/:id", getHolidayTourById);

export default router;