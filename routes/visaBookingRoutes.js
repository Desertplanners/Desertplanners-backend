import express from "express";
import {
  createVisaBooking,
  getAllVisaBookings,
  getVisaBookingById,
  updateVisaBookingStatus,
  deleteVisaBooking,
  lookupVisaBooking, 
  downloadVisaInvoice,    // <-- ⭐ ADD THIS
} from "../controllers/visaBookingController.js";

import { visaUpload } from "../middleware/visaUpload.js";

const router = express.Router();

const uploadFields = visaUpload.fields([
  { name: "passportFront", maxCount: 1 },
  { name: "passportBack", maxCount: 1 },
  { name: "passportCover", maxCount: 1 },
  { name: "photo", maxCount: 1 },
  { name: "accommodation", maxCount: 1 },
  { name: "emiratesId", maxCount: 1 },
  { name: "extraId", maxCount: 1 },
  { name: "oldVisa", maxCount: 1 },
  { name: "flightTicket", maxCount: 1 },
]);
router.get("/invoice/:id", downloadVisaInvoice);

// 🟢 Create booking
router.post("/", uploadFields, createVisaBooking);

// 🔍 ⭐ VISA LOOKUP (Booking ID + Email)
router.get("/lookup", lookupVisaBooking);

// 🔵 List bookings
router.get("/", getAllVisaBookings);

// 🔵 Single booking
router.get("/:id", getVisaBookingById);

// 🟡 Update status
router.patch("/:id/status", updateVisaBookingStatus);

// ❌ Delete booking
router.delete("/:id", deleteVisaBooking);

export default router;
