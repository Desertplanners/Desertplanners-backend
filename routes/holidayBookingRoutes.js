import express from "express";

import {
  createHolidayBooking,
  getAllHolidayBookings,
  getHolidayBooking,
} from "../controllers/holidayBookingController.js";

const router = express.Router();

// Create booking
router.post("/create", createHolidayBooking);

// Get all bookings
router.get("/all", getAllHolidayBookings);

// Get single booking
router.get("/:id", getHolidayBooking);

export default router;