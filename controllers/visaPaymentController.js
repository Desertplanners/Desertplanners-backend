import Payment from "../models/Payment.js";
import VisaBooking from "../models/VisaBooking.js";
import axios from "axios";

// ============================
// CREATE VISA PAYMENT
// ============================
export const createVisaPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Visa Booking ID is required",
      });
    }

    const booking = await VisaBooking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Visa booking not found",
      });
    }

    const totalAmount = Number(booking.totalPrice || 0);
    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid visa booking amount. Amount must be greater than 0.",
      });
    }

    const payload = {
      requestId: `REQ-VISA-${booking._id}`,
      orderId: booking._id.toString(),
      currency: "AED",
      amount: totalAmount,
      totals: {
        subtotal: totalAmount,
        tax: 0,
        shipping: 0,
        handling: 0,
        discount: 0,
        skipTotalsValidation: true,
      },
      items: [
        {
          name: booking.visaType || booking.visaTitle || "Visa Application",
          sku: `VISA-${booking._id}`,
          unitprice: totalAmount,
          quantity: 1,
          linetotal: totalAmount,
        },
      ],
      customer: {
        id: booking._id.toString(),
        firstName: booking.fullName?.split(" ")[0] || "Guest",
        lastName: booking.fullName?.split(" ")[1] || "User",
        email: booking.email,
        phone: booking.phone,
      },
      billingAddress: {
        name: booking.fullName || "Customer",
        address1: "Dubai",
        address2: "",
        city: "Dubai",
        state: "Dubai",
        zip: "00000",
        country: "AE",
        set: true,
      },
      deliveryAddress: {
        name: booking.fullName || "Customer",
        address1: "Dubai",
        address2: "",
        city: "Dubai",
        state: "Dubai",
        zip: "00000",
        country: "AE",
        set: true,
      },
      returnUrl: `${process.env.FRONTEND_URL}/visa-success?bookingId=${booking._id}`,
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

    // Create Payment record (pending)
    const paymentDoc = new Payment({
      bookingId: booking._id,
      transactionId: gatewayData?.result?.id || gatewayData?.id || null,
      amount: totalAmount,
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
      raw: gatewayData,
    });
  } catch (err) {
    console.error("❌ createVisaPayment error:", err);
    return res.status(500).json({
      success: false,
      error: err.response?.data || err.message,
    });
  }
};

// ============================
// VISA WEBHOOK
// ============================
export const visaPaymentWebhook = async (req, res) => {
  try {
    const data = req.body;
    const status = data.status;
    const bookingId = data.orderId;
    const gatewayTxnId = data.id || data.transactionId || null;

    if (!bookingId) {
      return res.status(400).send("Missing visa booking id");
    }

    if (status === "PAID") {
      await VisaBooking.findByIdAndUpdate(bookingId, {
        paymentStatus: "paid",
        status: "confirmed",
      });

      await Payment.findOneAndUpdate(
        { bookingId: bookingId, transactionId: gatewayTxnId || undefined },
        {
          bookingId: bookingId,
          transactionId: gatewayTxnId,
          amount: Number(data.amount || data.total || 0) || undefined,
          currency: data.currency || "AED",
          status: "paid",
          paymentInfo: data,
          method: "checkout",
          gateway: "Paymennt",
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    if (status === "FAILED") {
      await VisaBooking.findByIdAndUpdate(bookingId, {
        paymentStatus: "failed",
        status: "cancelled",
      });

      await Payment.findOneAndUpdate(
        { bookingId: bookingId, transactionId: gatewayTxnId || undefined },
        {
          bookingId: bookingId,
          transactionId: gatewayTxnId,
          amount: Number(data.amount || data.total || 0) || undefined,
          currency: data.currency || "AED",
          status: "failed",
          paymentInfo: data,
          method: "checkout",
          gateway: "Paymennt",
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    return res.status(200).send("ok");
  } catch (err) {
    console.error("❌ Visa Webhook Error:", err);
    return res.status(500).send("err");
  }
};

// ============================
// MANUAL VISA PAYMENT CONFIRM
// ============================
export const manualConfirmVisaPayment = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;

    const booking = await VisaBooking.findByIdAndUpdate(
      bookingId,
      {
        paymentStatus: "paid",
        status: "confirmed",
      },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Visa booking not found",
      });
    }

    const paymentDoc = new Payment({
      bookingId: booking._id,
      transactionId: `MANUAL-VISA-${Date.now()}`,
      amount: booking.totalPrice || 0,
      currency: "AED",
      status: "paid",
      paymentInfo: { manual: true },
      method: "manual",
      gateway: "internal",
    });

    await paymentDoc.save();

    return res.status(200).json({
      success: true,
      message: "Visa booking manually confirmed",
      booking,
      payment: paymentDoc,
    });
  } catch (err) {
    console.error("❌ manualConfirmVisaPayment error:", err);
    return res.status(500).json({
      success: false,
      message: "Manual confirmation error",
    });
  }
};


