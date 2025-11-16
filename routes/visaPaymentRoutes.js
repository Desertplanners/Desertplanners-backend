import express from "express";
import {
  createVisaPayment,
  visaPaymentWebhook,
  manualConfirmVisaPayment,
} from "../controllers/visaPaymentController.js";

const router = express.Router();

// Create Visa Payment
router.post("/create", createVisaPayment);

// Visa Webhook
router.post("/webhook", visaPaymentWebhook);

// Manual Confirm (Test)
router.post("/confirm/:bookingId", manualConfirmVisaPayment);

// ❌ Removed: getAllPayments
// Visa payments now included in /api/payment/all

export default router;
