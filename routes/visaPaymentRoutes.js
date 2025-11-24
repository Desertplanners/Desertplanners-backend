import axios from "axios";
import express from "express";
import bodyParser from "body-parser";
import {
  createVisaPayment,
  visaPaymentWebhook,
  manualConfirmVisaPayment,
} from "../controllers/visaPaymentController.js";

const router = express.Router();

// Create Visa Payment
router.post("/create", createVisaPayment);

// Visa Webhook (RAW BODY REQUIRED)
router.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  visaPaymentWebhook
);

// Manual Confirm (Test)
router.post("/confirm/:bookingId", manualConfirmVisaPayment);

// ⭐ Check Registered Webhooks (Visa)
router.get("/check-webhooks", async (req, res) => {
  try {
    const result = await axios.get(
      "https://api.paymennt.com/mer/v2.0/webhooks",
      {
        headers: {
          "X-Paymennt-Api-Key": process.env.PAYMENT_API_KEY,
          "X-Paymennt-Api-Secret": process.env.PAYMENT_SECRET_KEY,
        },
      }
    );
    return res.json(result.data);
  } catch (err) {
    return res.status(500).json(err.response?.data || err.message);
  }
});

// ⭐ Create Webhook (LIVE)
router.get("/create-webhook", async (req, res) => {
  try {
    const result = await axios.post(
      "https://api.paymennt.com/mer/v2.0/webhooks",
      {
        address:
          "https://desertplanners-backend.onrender.com/api/visa-payment/webhook",
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
