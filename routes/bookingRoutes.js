import express from "express";
import {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  getMyBookings,
} from "../controllers/bookingController.js";
import { protect, adminAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// User routes
router.post("/", protect, createBooking);       // ✅ Create booking (requires login)
router.get("/my", protect, getMyBookings);      // ✅ Get logged-in user's bookings

// Admin routes
router.get("/", adminAuth, getAllBookings);     // ✅ Admin can view all bookings
router.get("/:id", adminAuth, getBookingById);  // ✅ Get booking by ID
router.put("/:id/status", adminAuth, updateBookingStatus); // ✅ Update booking status

export default router;
