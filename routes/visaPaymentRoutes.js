import axios from "axios";
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

// ⭐ Create Webhook Route (Visa) — SAME AS TOUR BUT WITH VISA WEBHOOK URL
router.get("/create-webhook", async (req, res) => {
  try {
    const result = await axios.post(
      "https://api.test.paymennt.com/mer/v2.0/webhooks",
      {
        address:
          "https://desetplanner-backend.onrender.com/api/visa-payment/webhook",
      },
      {
        headers: {
          "X-Paymennt-Api-Key": process.env.PAYMENT_API_KEY,
          "X-Paymennt-Api-Secret": process.env.PAYMENT_SECRET_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    return res.json(result.data);
  } catch (err) {
    return res
      .status(500)
      .json(err.response?.data || { message: err.message });
  }
});

export default router;
