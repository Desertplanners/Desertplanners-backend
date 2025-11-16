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

    const amount = Number(booking.totalPrice || 0);
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking amount",
      });
    }

    // ------------ PAYLOAD -------------
    const payload = {
      requestId: `REQ-${booking._id}`,
      orderId: booking._id.toString(),
      currency: "AED",
      amount,
      totals: {
        subtotal: amount,
        tax: 0,
        shipping: 0,
        handling: 0,
        discount: 0,
        skipTotalsValidation: true,
      },
      items: [
        {
          name: booking.packageName || "Tour Booking",
          sku: booking.packageId?.toString() || booking._id.toString(),
          unitprice: amount,
          quantity: 1,
          linetotal: amount,
        },
      ],
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
        city: "Dubai",
        state: "Dubai",
        zip: "00000",
        country: "AE",
        set: true,
      },
      deliveryAddress: {
        name: booking.guestName || "Customer",
        address1: "Dubai",
        city: "Dubai",
        state: "Dubai",
        zip: "00000",
        country: "AE",
        set: true,
      },
      returnUrl: `${process.env.FRONTEND_URL}/booking-success?bookingId=${booking._id}`,
      language: "EN",
    };

    const response = await axios.post(
      process.env.PAYMENNT_API_URL,
      payload,
      {
        headers: {
          "X-Paymennt-Api-Key": process.env.PAYMENT_API_KEY,
          "X-Paymennt-Api-Secret": process.env.PAYMENT_SECRET_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const gatewayData = response.data || {};

    // ----------- SAVE PAYMENT -----------
    const paymentDoc = new Payment({
      bookingId: booking._id,
      bookingType: "tour",
      transactionId: gatewayData?.result?.id || null,
      amount,
      currency: "AED",
      status: "pending",
      paymentInfo: gatewayData,
      method: "checkout",
      gateway: "Paymennt",
    });

    await paymentDoc.save();

    return res.status(200).json({
      success: true,
      paymentLink: gatewayData?.result?.redirectUrl || null,
      payment: paymentDoc,
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
  try {
    const data = req.body;
    const status = data.status;
    const bookingId = data.orderId; 
    const gatewayTxnId = data.id || null;

    if (!bookingId) return res.status(400).send("orderId missing");

    // Update booking
    if (status === "PAID") {
      await Booking.findByIdAndUpdate(bookingId, {
        paymentStatus: "paid",
        status: "confirmed",
      });
    } else if (status === "FAILED") {
      await Booking.findByIdAndUpdate(bookingId, {
        paymentStatus: "failed",
        status: "cancelled",
      });
    }

    // Update / Create payment
    await Payment.findOneAndUpdate(
      { bookingId, bookingType: "tour" },
      {
        bookingId,
        bookingType: "tour",
        transactionId: gatewayTxnId,
        amount: Number(data.amount) || undefined,
        currency: data.currency || "AED",
        status: status?.toLowerCase(),
        paymentInfo: data,
        method: "checkout",
        gateway: "Paymennt",
      },
      { upsert: true, new: true }
    );

    return res.status(200).send("ok");
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return res.status(500).send("err");
  }
};

// ============================
// MANUAL CONFIRM PAYMENT
// ============================
export const manualConfirmPayment = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { paymentStatus: "paid", status: "confirmed" },
      { new: true }
    );

    const paymentDoc = await Payment.create({
      bookingId,
      bookingType: "tour",
      transactionId: `MANUAL-${Date.now()}`,
      amount: booking.totalPrice || 0,
      currency: "AED",
      status: "paid",
      method: "manual",
      gateway: "internal",
      paymentInfo: { manual: true },
    });

    return res.json({ success: true, booking, payment: paymentDoc });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ============================
// GET ALL TOUR PAYMENTS ONLY
// ============================
export const getAllTourPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("bookingId")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      payments,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
