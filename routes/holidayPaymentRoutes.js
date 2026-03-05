import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

import {
  createHolidayPayment,
  holidayPaymentWebhook
} from "../controllers/holidayPaymentController.js";

const router = express.Router();

// ======================================
// CREATE PAYMENT
// ======================================

router.post("/create", createHolidayPayment);


// ======================================
// PAYMENNT WEBHOOK (VERY IMPORTANT)
// ======================================

router.post(
  "/webhook",
  bodyParser.raw({ type: "*/*" }),
  (req, res, next) => {
    try {
      console.log("➡️ RAW BODY:", req.body.toString());

      req.body = JSON.parse(req.body.toString("utf8"));

      console.log("➡️ PARSED BODY:", req.body);

    } catch (err) {
      console.log("❌ JSON Parse Error:", err.message);
    }

    next();
  },
  holidayPaymentWebhook
);


// ======================================
// CREATE WEBHOOK (RUN ONCE)
// ======================================

router.get("/create-webhook", async (req, res) => {
  try {

    const result = await axios.post(
      "https://api.paymennt.com/mer/v2.0/webhooks",
      {
        address:
          "https://desertplanners-backend.onrender.com/api/holiday-payment/webhook",
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

    return res.status(500).json(
      err.response?.data || { message: err.message }
    );

  }
});

export default router;