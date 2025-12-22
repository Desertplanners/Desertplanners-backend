// ======================================================
// PAYMENT CONTROLLER - FINAL UPDATED VERSION
// DesertPlanners Tourism LLC
// ======================================================

import Payment from "../models/Payment.js";
import Booking from "../models/Booking.js";
import axios from "axios";
import { Resend } from "resend";

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// ======================================================
// CREATE PAYMENT (Checkout Web)
// ======================================================
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

    const subtotal = Number(booking.subtotal || 0);
    const fee = Number(booking.transactionFee || 0);
    const discount = Number(booking.couponDiscount || 0);
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
    
      // ⭐ ONLY TRUST THIS
      amount: booking.totalPrice, // discounted final price
    
      items: [
        {
          name: "Tour Booking",
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
    
      returnUrl: `${process.env.FRONTEND_URL}/booking-success?bookingId=${booking._id}`,
      language: "EN",
    };
    

    const response = await axios.post(process.env.PAYMENNT_API_URL, payload, {
      headers: {
        "X-Paymennt-Api-Key": process.env.PAYMENT_API_KEY,
        "X-Paymennt-Api-Secret": process.env.PAYMENT_SECRET_KEY,
        "Content-Type": "application/json",
      },
    });

    const gatewayData = response.data || {};

    // ----------- SAVE PAYMENT -----------
    const paymentDoc = new Payment({
      bookingId: booking._id,
      bookingType: "Tour",
      transactionId: gatewayData?.result?.id || null,
      amount,
      currency: "AED",
      status: "Pending",
      paymentInfo: gatewayData,
      method: "Checkout",
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

// ======================================================
// HANDLE WEBHOOK (FINAL VERSION)
// ======================================================
export const handleWebhook = async (req, res) => {
  try {
    const data = req.body;
    const status = data.status;
    const bookingId = data.orderId;
    const gatewayTxnId = data.id || null;

    console.log("🔔 PAYMENT WEBHOOK RECEIVED:", data);

    if (!bookingId) return res.status(400).send("orderId missing");

    // Fetch booking
    const booking = await Booking.findById(bookingId).populate(
      "items.tourId",
      "title"
    );

    if (!booking) return res.status(404).send("Booking not found");

    const customerEmail = booking.guestEmail || booking.userEmail;

    // Prepare booking items for email
    const itemsHtml = booking.items
      .map(
        (item) => `
          <li>
            <b>Tour:</b> ${item.tourId?.title}<br>
            <b>Date:</b> ${item.date}<br>
            <b>Adults:</b> ${item.adultCount} × ${item.adultPrice}<br>
            <b>Children:</b> ${item.childCount} × ${item.childPrice}<br>
          </li>
        `
      )
      .join("");

    // ==============================
    // 1️⃣ PAYMENT PAID → CONFIRM BOOKING
    // ==============================
    if (status === "PAID") {
      console.log("💰 PAYMENT SUCCESS FOR BOOKING:", bookingId);

      await Booking.findByIdAndUpdate(bookingId, {
        paymentStatus: "Paid",
        status: "Confirmed",
      });

      // Save/Update Payment Status
      await Payment.findOneAndUpdate(
        { bookingId },
        {
          bookingId,
          bookingType: "tour",
          transactionId: gatewayTxnId,
          amount: Number(data.amount) || booking.totalPrice,
          currency: data.currency || "AED",
          status: "Paid",
          paymentInfo: data,
          method: "checkout",
          gateway: "Paymennt",
        },
        { upsert: true, new: true }
      );

      // ------------------------------------
      // EMAIL TEMPLATES
      // ------------------------------------

      // ADMIN EMAIL
      const paymentAdminEmail = `
      <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial;background:#f4f4f7;padding:20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
              
              <tr>
                <td style="background:#b40303;color:white;padding:25px 30px;text-align:center;font-size:24px;font-weight:bold;">
                  🚀 New Paid Booking Received
                </td>
              </tr>

              <tr>
                <td style="padding:30px;font-size:15px;color:#333;">
                  <h3 style="margin:0 0 15px;color:#b40303;">Customer Details</h3>
                  <p><b>Name:</b> ${booking.guestName || booking.userName}</p>
                  <p><b>Email:</b> ${customerEmail}</p>

                  <hr style="margin:20px 0;border:none;border-top:1px solid #ddd;">

                  <h3 style="margin:0 0 15px;color:#b40303;">Booking Summary</h3>
                  <ul style="padding-left:18px;color:#555;font-size:14px;line-height:1.5;">
                    ${itemsHtml}
                  </ul>

                  <hr style="margin:20px 0;border:none;border-top:1px solid #ddd;">

                  <p style="font-size:16px;margin-bottom:8px;">
                    <b>Total Paid:</b> AED ${booking.totalPrice}
                  </p>

                  <p style="font-size:14px;color:#555;margin-top:0;">
                    <b>Booking ID:</b> ${booking._id}
                  </p>
                </td>
              </tr>

              <tr>
                <td style="background:#fafafa;color:#777;text-align:center;padding:12px;font-size:12px;">
                  Desert Planners Tourism LLC ⬩ Dubai, UAE
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>`;

      // CUSTOMER EMAIL
      const paymentCustomerEmail = `
      <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial;background:#f4f4f7;padding:20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">

              <tr>
                <td style="background:#b40303;color:white;padding:25px 30px;text-align:center;font-size:24px;font-weight:bold;">
                  🎉 Your Booking is Confirmed!
                </td>
              </tr>

              <tr>
                <td style="padding:30px;font-size:15px;color:#333;">
                  <p>Thank you for choosing <b>Desert Planners Tourism LLC</b>!  
                  Your payment has been successfully received.</p>

                  <h3 style="margin:15px 0;color:#b40303;">Your Details</h3>
                  <p><b>Name:</b> ${booking.guestName || booking.userName}</p>
                  <p><b>Email:</b> ${customerEmail}</p>

                  <hr style="margin:20px 0;border:none;border-top:1px solid #ddd;">

                  <h3 style="margin:0 0 15px;color:#b40303;">Tour Summary</h3>
                  <ul style="padding-left:18px;color:#555;font-size:14px;line-height:1.5;">
                    ${itemsHtml}
                  </ul>

                  <hr style="margin:20px 0;border:none;border-top:1px solid #ddd;">

                  <p style="font-size:18px;margin-bottom:8px;color:#000;">
                    <b>Total Paid:</b> AED ${booking.totalPrice}
                  </p>

                  <p style="font-size:14px;color:#555;margin-top:0;">
                    <b>Booking ID:</b> ${booking._id}
                  </p>

                  <p style="margin-top:20px;font-size:14px;">
                    Our team will contact you shortly. For urgent queries, reply to this email.
                  </p>

                </td>
              </tr>

              <tr>
                <td style="background:#fafafa;color:#777;text-align:center;padding:12px;font-size:12px;">
                  Thank you for traveling with us ❤️
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>`;

      // ------------------------------------
      // SEND EMAILS (ADMIN + CUSTOMER)
      // ------------------------------------
      try {
        await resend.emails.send({
          from: "Desert Planners Tourism LLC <booking@desertplanners.net>",
          to: process.env.ADMIN_EMAIL,
          subject: "New Paid Booking Received",
          html: paymentAdminEmail,
        });
        console.log("📨 PAID ADMIN EMAIL SENT");
      } catch (e) {
        console.log("❌ ADMIN EMAIL FAILED:", e);
      }

      try {
        await resend.emails.send({
          from: "Desert Planners Tourism LLC <booking@desertplanners.net>",
          to: customerEmail,
          subject: "Payment Successful - Booking Confirmed",
          html: paymentCustomerEmail,
        });
        console.log("📨 CUSTOMER PAYMENT EMAIL SENT");
      } catch (e) {
        console.log("❌ CUSTOMER EMAIL FAILED:", e);
      }
    }

    return res.status(200).send("ok");
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return res.status(500).send("err");
  }
};

// ======================================================
// MANUAL CONFIRM PAYMENT
// ======================================================
export const manualConfirmPayment = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { paymentStatus: "Paid", status: "Confirmed" },
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

// ======================================================
// GET ALL TOUR PAYMENTS ONLY
// ======================================================
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
