import express from "express";
import {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  getMyBookings,
} from "../controllers/bookingController.js";
import { protect, adminAuth, optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Guests + Logged-in Users can create booking
router.post("/", optionalAuth, createBooking);

// ✅ Logged-in user's bookings
router.get("/my", protect, getMyBookings);

// ✅ Admin routes
router.get("/", adminAuth, getAllBookings);

// 🔥 Public route (IMPORTANT for booking success page)
router.get("/:id", getBookingById);

// Admin update booking status
router.put("/:id/status", adminAuth, updateBookingStatus);

export default router;
