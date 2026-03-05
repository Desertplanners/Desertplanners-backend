import HolidayPayment from "../models/HolidayPayment.js";
import HolidayBooking from "../models/HolidayBooking.js";
import axios from "axios";

// ======================================================
// CREATE HOLIDAY PAYMENT
// ======================================================

export const createHolidayPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    const booking = await HolidayBooking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Holiday booking not found",
      });
    }

    if (!booking.totalPrice || booking.totalPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking amount",
      });
    }

    // ======================================================
    // PAYMENNT CHECKOUT PAYLOAD
    // ======================================================

    const payload = {
      requestId: `REQ-${booking._id}`,
      orderId: booking._id.toString(),
      currency: "AED",

      amount: booking.totalPrice,

      items: [
        {
          name: booking.packageTitle || "Holiday Package",
          sku: booking._id.toString(),
          unitprice: booking.totalPrice,
          quantity: 1,
          linetotal: booking.totalPrice,
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
        country: "AE",
        set: true,
      },

      deliveryAddress: {
        name: booking.guestName || "Customer",
        address1: "Dubai",
        city: "Dubai",
        country: "AE",
        set: true,
      },

      returnUrl: `${process.env.FRONTEND_URL}/holiday-booking-success?bookingId=${booking._id}`,

      language: "EN",
    };

    // ======================================================
    // CALL PAYMENNT API
    // ======================================================

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

    // ======================================================
    // SAVE PAYMENT IN DATABASE
    // ======================================================

    const payment = await HolidayPayment.create({
      bookingId: booking._id,
      transactionId: gatewayData?.result?.id || null,
      amount: booking.totalPrice,
      currency: "AED",
      status: "Pending",
      paymentInfo: gatewayData,
      method: "Checkout",
      gateway: "Paymennt",
    });

    return res.status(200).json({
      success: true,
      paymentLink: gatewayData?.result?.redirectUrl || null,
      payment,
    });

  } catch (err) {
    console.error("🔥 Holiday Payment Error:", err);

    return res.status(500).json({
      success: false,
      message: err.response?.data || err.message,
    });
  }
};


// ======================================================
// HOLIDAY PAYMENT WEBHOOK
// ======================================================

export const holidayPaymentWebhook = async (req, res) => {
  try {
    const data = req.body;

    const bookingId = data.orderId;
    const status = data.status;
    const transactionId = data.id || null;

    console.log("🔔 HOLIDAY PAYMENT WEBHOOK:", data);

    if (!bookingId) {
      return res.status(400).send("orderId missing");
    }

    const booking = await HolidayBooking.findById(bookingId);

    if (!booking) {
      return res.status(404).send("Booking not found");
    }

    // ======================================================
    // PAYMENT SUCCESS
    // ======================================================

    if (status === "PAID") {

      console.log("💰 HOLIDAY PAYMENT SUCCESS:", bookingId);

      // Update booking
      await HolidayBooking.findByIdAndUpdate(bookingId, {
        paymentStatus: "Paid",
        status: "Confirmed",
      });

      // Update payment
      await HolidayPayment.findOneAndUpdate(
        { bookingId },
        {
          transactionId: transactionId,
          status: "Paid",
          paymentInfo: data,
        },
        { new: true }
      );
    }

    return res.status(200).send("ok");

  } catch (err) {
    console.error("❌ Holiday Webhook Error:", err);
    return res.status(500).send("error");
  }
};