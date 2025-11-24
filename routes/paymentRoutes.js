import axios from "axios";
import express from "express";
import {
  createPayment,
  handleWebhook,
  manualConfirmPayment,
  getAllTourPayments, // ⭐ COMBINED LIST (tour + visa)
} from "../controllers/paymentController.js";
import bodyParser from "body-parser";
const router = express.Router();

// Tour Payment Create
router.post("/create", createPayment);

// Tour Webhook
router.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  handleWebhook
);


// Manual confirm (local)
router.put("/confirm/:bookingId", manualConfirmPayment);

// ⭐ FINAL: Combined Payments List
router.get("/all", getAllTourPayments);

// Create Paymennt Webhook (TEMP)
router.get("/create-webhook", async (req, res) => {
  try {
    const result = await axios.post(
      "https://api.paymennt.com/mer/v2.0/webhooks",
      {
        address: "https://desertplanners-backend.onrender.com/api/payment/webhook"
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
    return res.status(500).json(err.response?.data || { message: err.message });
  }
});



export default router;
