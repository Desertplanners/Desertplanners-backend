// backend/routes/enquiry.js
import express from "express";
import { createEnquiry, getEnquiries, updateStatus, deleteEnquiry } from "../controllers/enquiryController.js";
import verifyAdmin from "../middleware/verifyAdmin.js";

const router = express.Router();

// Public route: Create enquiry
router.post("/", createEnquiry);

// Admin routes (protected)
router.get("/", verifyAdmin, getEnquiries);
router.patch("/:id/status", verifyAdmin, updateStatus);
router.delete("/:id", verifyAdmin, deleteEnquiry);

export default router;
