import axios from "axios";
import express from "express";
import {
  createPayment,
  handleWebhook,
  manualConfirmPayment, // 👈 added for local testing
} from "../controllers/paymentController.js";

const router = express.Router();

// ✅ Create payment (after booking created)
router.post("/create", createPayment);

// ✅ Webhook from Paymennt (for live mode)
// router.post("/webhook", express.raw({ type: "*/*" }), handleWebhook);
router.post("/webhook", express.urlencoded({ extended: true }), handleWebhook);


// ✅ Temporary manual confirm (for local testing)
router.put("/confirm/:bookingId", manualConfirmPayment);


// ⭐ TEMPORARY: CREATE WEBHOOK FROM RENDER SERVER
router.get("/create-webhook", async (req, res) => {
  try {
    const result = await axios.post(
      "https://api.test.paymennt.com/mer/v2.0/webhooks",
      {
        address:
          "https://desetplanner-backend.onrender.com/api/payment/webhook",
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
