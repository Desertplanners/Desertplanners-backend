import express from "express";
import {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  getMyBookings,
} from "../controllers/bookingController.js";
import { protect, adminAuth, optionalAuth  } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Allow both guest and logged-in users
router.post("/", optionalAuth, createBooking);

// ✅ Logged-in user's bookings
router.get("/my", protect, getMyBookings);

// ✅ Admin routes
router.get("/", adminAuth, getAllBookings);
router.get("/:id", adminAuth, getBookingById);
router.put("/:id/status", adminAuth, updateBookingStatus);

export default router;
