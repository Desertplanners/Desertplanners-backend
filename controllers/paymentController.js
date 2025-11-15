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

    // ---------------- REQUIRED PAYLOAD (PER API DOC) ----------------
    // const payload = {
    //   requestId: `REQ-${booking._id}`,
    //   orderId: booking._id.toString(),
    //   currency: "AED",
    //   amount: booking.totalPrice,

    //   // REQUIRED totals (staging reject karta hai agar totals missing ho)
    //   totals: {
    //     subtotal: booking.totalPrice,
    //     tax: 0,
    //     shipping: 0,
    //     handling: 0,
    //     discount: 0,
    //     skipTotalsValidation: true,
    //   },

    //   // REQUIRED items
    //   items: [
    //     {
    //       name: booking.packageName || "Visa Booking",
    //       quantity: 1,
    //       price: booking.totalPrice,
    //     },
    //   ],

    //   // REQUIRED customer fields
    //   customer: {
    //     id: booking._id.toString(),
    //     firstName: booking.guestName?.split(" ")[0] || "Guest",
    //     lastName: booking.guestName?.split(" ")[1] || "User",
    //     email: booking.guestEmail,
    //     phone: booking.guestContact,
    //   },

    //   billingAddress: {
    //     name: booking.guestName || "Customer",
    //     address1: "Dubai",
    //     address2: "",
    //     city: "Dubai",
    //     state: "Dubai",
    //     zip: "00000",
    //     country: "AE",
    //     set: true,
    //   },

    //   // DELIVERY OPTIONAL
    //   deliveryAddress: {
    //     name: booking.guestName || "Customer",
    //     address1: "Dubai",
    //     address2: "",
    //     city: "Dubai",
    //     state: "Dubai",
    //     zip: "00000",
    //     country: "AE",
    //     set: true,
    //   },

    //   returnUrl: `${process.env.FRONTEND_URL}/payment-result?reference=${booking._id}`,
    //   language: "EN",
    // };

    // const body = {
    //   requestId: "REQ-691702187b1ab3e39c804c97",
    //   orderId: "691702187b1ab3e39c804c97",
    //   currency: "AED",
    //   amount: 4380,
    //   totals: {
    //     subtotal: 4380,
    //     tax: 0,
    //     shipping: 0,
    //     handling: 0,
    //     discount: 0,
    //     skipTotalsValidation: true,
    //   },
    //   items: [
    //     {
    //       name: "Visa Booking",
    //       sku: "VISA-BOOKING-001", // optional but good to have
    //       unitprice: 4380,
    //       quantity: 1,
    //       linetotal: 4380,
    //     },
    //   ],
    //   customer: {
    //     id: "691702187b1ab3e39c804c97",
    //     firstName: "Chirag",
    //     lastName: "Parihar",
    //     email: "chiragparihar118@gmail.com",
    //     phone: "08003155718",
    //   },
    //   billingAddress: {
    //     name: "Chirag Parihar",
    //     address1: "Dubai",
    //     address2: "",
    //     city: "Dubai",
    //     state: "Dubai",
    //     zip: "00000",
    //     country: "AE",
    //     set: true,
    //   },
    //   deliveryAddress: {
    //     name: "Chirag Parihar",
    //     address1: "Dubai",
    //     address2: "",
    //     city: "Dubai",
    //     state: "Dubai",
    //     zip: "00000",
    //     country: "AE",
    //     set: true,
    //   },
    //   returnUrl:
    //     "https://desertplanners.vercel.app/payment-result?reference=691702187b1ab3e39c804c97",
    //   language: "EN",
    // };

    const totalAmount = Number(booking.totalPrice || 0);

    const payload = {
      requestId: `REQ-${booking._id}`,
      orderId: booking._id.toString(),
      currency: "AED",
      amount: totalAmount,

      // REQUIRED totals
      totals: {
        subtotal: totalAmount,
        tax: 0,
        shipping: 0,
        handling: 0,
        discount: 0,
        skipTotalsValidation: true,
      },

      // REQUIRED items (updated to match working payload)
      items: [
        {
          name: booking.packageName || "Visa Booking",
          sku: booking.packageId?.toString() || booking._id.toString(), // optional but nice to have
          unitprice: totalAmount,
          quantity: 1,
          linetotal: totalAmount,
        },
      ],

      // REQUIRED customer fields
      customer: {
        id: booking._id.toString(),
        firstName: booking.guestName?.split(" ")[0] || "Guest",
        lastName: booking.guestName?.split(" ")[1] || "User",
        email: booking.guestEmail,
        phone: booking.guestContact,
      },

      billingAddress: {
        name: booking.guestName || "Customer",
        address1: "Dubai",
        address2: "",
        city: "Dubai",
        state: "Dubai",
        zip: "00000",
        country: "AE",
        set: true,
      },

      // DELIVERY OPTIONAL
      deliveryAddress: {
        name: booking.guestName || "Customer",
        address1: "Dubai",
        address2: "",
        city: "Dubai",
        state: "Dubai",
        zip: "00000",
        country: "AE",
        set: true,
      },

      // returnUrl: `${process.env.FRONTEND_URL}/payment-result?reference=${booking._id}`,
      // returnUrl: `${process.env.FRONTEND_URL}/booking-success?reference=${booking._id}`,
      returnUrl: `${process.env.FRONTEND_URL}/booking-success?bookingId=${booking._id}`,
      language: "EN",
    };
    // console.log("📤 Sending Checkout Request →", payload);

    // -------------- API CALL --------------
    const response = await axios.post(
      process.env.PAYMENNT_API_URL, // MUST BE: https://pay.test.paymennt.com/checkout/web
      payload,
      {
        headers: {
          "X-Paymennt-Api-Key": process.env.PAYMENT_API_KEY,
          "X-Paymennt-Api-Secret": process.env.PAYMENT_SECRET_KEY,
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
    console.error("🔥 Payment Error:", err);

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
  console.log("🔥 RAW BODY:", req.body);

  let json;

  try {
    // Paymennt sends raw Buffer → convert to string → JSON parse
    const raw = req.body.toString("utf8");
    json = JSON.parse(raw);
  } catch (err) {
    console.log("❌ JSON PARSE FAILED:", err.message);
    return res.status(400).send("Invalid JSON");
  }

  console.log("🔥 Parsed Webhook Data:", json);

  const ref = json?.data?.reference;

  if (!ref) {
    console.log("❌ Reference missing in webhook");
    return res.status(400).send("reference missing");
  }

  // SUCCESS
  if (json.type === "payment.success") {
    await Booking.findByIdAndUpdate(
      ref,
      { status: "confirmed", paymentStatus: "paid" },
      { new: true }
    );

    await Payment.findOneAndUpdate(
      { bookingId: ref },
      { status: "paid", paymentInfo: json.data },
      { upsert: true }
    );

    console.log("✅ Payment SUCCESS updated:", ref);
  }

  // FAILED
  if (json.type === "payment.failed") {
    await Booking.findByIdAndUpdate(
      ref,
      { status: "cancelled", paymentStatus: "failed" }
    );

    await Payment.findOneAndUpdate(
      { bookingId: ref },
      { status: "failed" },
      { upsert: true }
    );

    console.log("❌ Payment FAILED updated:", ref);
  }

  return res.status(200).send("ok");
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
