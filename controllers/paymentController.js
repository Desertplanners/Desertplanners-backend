import Payment from "../models/Payment.js";
import Booking from "../models/Booking.js";
import axios from "axios";

// ============================
// CREATE PAYMENT (Checkout Web)
// ============================
export const createPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // -------- PAYMENNT REQUIRED PAYLOAD --------
    const payload = {
      requestId: `REQ-${booking._id}`,
      orderId: booking._id.toString(),
      currency: "AED",
      amount: booking.totalPrice,

      items: [
        {
          name: booking.packageName || "Visa Booking",
          quantity: 1,
          price: booking.totalPrice,
        }
      ],

      customer: {
        firstName: booking.guestName?.split(" ")[0] || "Guest",
        lastName: booking.guestName?.split(" ")[1] || "",
        email: booking.guestEmail,
        phone: booking.guestContact,
      },

      billingAddress: {
        name: booking.guestName || "Customer",
        address1: "Dubai",
        city: "Dubai",
        country: "AE",
        set: true,
      },

      returnUrl: `${process.env.FRONTEND_URL}/payment-result?reference=${booking._id}`,
    };

    console.log("📤 Sending Checkout Request →", payload);

    // -------- API REQUEST --------
    const response = await axios.post(
      process.env.PAYMENNT_API_URL, // https://api.paymennt.com/checkout/web
      payload,
      {
        headers: {
          "X-PayMennt-Api-Key": process.env.PAYMENT_API_KEY,
          "X-PayMennt-Api-Secret": process.env.PAYMENT_SECRET_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Checkout Created:", response.data);

    return res.status(200).json({
      success: true,
      paymentLink: response.data?.result?.redirectUrl || null,
      raw: response.data,
    });

  } catch (err) {
    console.error("🔥 Payment Error:", err.response?.data || err.message);

    return res.status(500).json({
      success: false,
      error: err.response?.data || err.message,
    });
  }
};


// ============================
// HANDLE WEBHOOK
// ============================
export const handleWebhook = async (req, res) => {
  try {
    const event = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    if (event.type === "payment.success") {
      const ref = event.data.reference;

      await Payment.findOneAndUpdate(
        { bookingId: ref },
        { status: "paid", paymentInfo: event.data },
        { new: true }
      );

      await Booking.findByIdAndUpdate(ref, { status: "confirmed" });

      console.log("✅ Payment success (webhook):", ref);
    }

    if (event.type === "payment.failed") {
      const ref = event.data.reference;

      await Payment.findOneAndUpdate(
        { bookingId: ref },
        { status: "failed" }
      );

      await Booking.findByIdAndUpdate(ref, { status: "cancelled" });

      console.log("❌ Payment failed (webhook):", ref);
    }

    return res.status(200).send("ok");

  } catch (err) {
    console.error("❌ Webhook error:", err.message);
    res.status(500).send("Webhook error");
  }
};


// ============================
// MANUAL CONFIRM PAYMENT
// ============================
export const manualConfirmPayment = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID missing",
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status: "confirmed",
        paymentStatus: "paid",
      },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    console.log("✅ Booking manually confirmed:", booking._id);

    return res.status(200).json({
      success: true,
      message: "Booking confirmed successfully (manual)",
      booking,
    });

  } catch (err) {
    console.error("❌ Manual confirm error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error during manual confirm",
    });
  }
};
