import Payment from "../models/Payment.js";
import VisaBooking from "../models/VisaBooking.js";
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

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

    // ⭐ ⭐ ⭐ FINAL AMOUNT WITH TRANSACTION FEE
    const finalAmount = Number(booking.finalAmount || 0);

    if (!finalAmount || finalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid visa booking final amount.",
      });
    }

    const payload = {
      requestId: `REQ-VISA-${booking._id}`,
      orderId: booking._id.toString(),
      currency: "AED",
      amount: finalAmount, // ⭐ FINAL AMOUNT

      totals: {
        subtotal: finalAmount, // ⭐ FINAL AMOUNT
        tax: 0,
        shipping: 0,
        handling: 0,
        discount: 0,
        skipTotalsValidation: true,
      },

      items: [
        {
          name: booking.visaTitle || "Visa Application",
          sku: `VISA-${booking._id}`,
          unitprice: finalAmount, // ⭐ FINAL AMOUNT
          quantity: 1,
          linetotal: finalAmount, // ⭐ FINAL AMOUNT
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

    const response = await axios.post(process.env.PAYMENNT_API_URL, payload, {
      headers: {
        "X-Paymennt-Api-Key": process.env.PAYMENT_API_KEY,
        "X-Paymennt-Api-Secret": process.env.PAYMENT_SECRET_KEY,
        "Content-Type": "application/json",
      },
    });

    const gatewayData = response.data || {};

    // Create Payment record (pending)
    const paymentDoc = new Payment({
      bookingId: booking._id,
      transactionId: gatewayData?.result?.id || gatewayData?.id || null,
      amount: finalAmount, // ⭐ FINAL AMOUNT
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

    console.log("🔔 VISA PAYMENT WEBHOOK RECEIVED:", data);

    const status = (data.status || "").toLowerCase();

    const bookingId =
      data.orderId || data.order_id || data.reference || data.order?.id || null;

    const gatewayTxnId = data.id || data.transactionId || null;

    if (!bookingId) return res.status(400).send("Missing visa booking id");

    const booking = await VisaBooking.findById(bookingId);

    if (!booking) return res.status(404).send("Visa booking not found");

    const paidAmount = Number(data.amount || booking.finalAmount || 0);

    // -------------------------------------------
    // PAYMENT SUCCESS FLOW
    // -------------------------------------------
    if (status === "paid" || status === "success") {
      console.log("💰 VISA PAYMENT SUCCESS:", bookingId);

      booking.paymentStatus = "paid";
      booking.status = "completed";
      await booking.save();

      await Payment.findOneAndUpdate(
        { bookingId },
        {
          bookingId,
          bookingType: "visa",
          transactionId: gatewayTxnId,
          amount: paidAmount,
          currency: data.currency || "AED",
          status: "paid",
          paymentInfo: data,
          method: "checkout",
          gateway: "Paymennt",
        },
        { upsert: true, new: true }
      );

      // ================================
      // EMAILS (ADMIN + CUSTOMER)
      // ================================

      const adminEmailHtml = `
<table width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial;background:#f4f4f7;padding:20px;">
  <tr><td align="center">

    <table width="600" cellpadding="0" cellspacing="0"
      style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">

      <tr>
        <td style="background:#b40303;color:white;padding:25px 30px;
          text-align:center;font-size:24px;font-weight:bold;">
          🛂 New Paid Visa Booking
        </td>
      </tr>

      <tr>
        <td style="padding:30px;font-size:15px;color:#333;">

          <h3 style="margin:0 0 15px;color:#b40303;">Applicant Details</h3>
          <p><b>Name:</b> ${booking.fullName}</p>
          <p><b>Email:</b> ${booking.email}</p>
          <p><b>Phone:</b> ${booking.phone}</p>
          <p><b>Passport No:</b> ${booking.passportNumber}</p>

          <hr style="margin:20px 0;border:none;border-top:1px solid #ddd;">

          <h3 style="margin:0 0 15px;color:#b40303;">Visa Package Details</h3>
          <p><b>Visa Package:</b> ${booking.visaTitle}</p>
          <p><b>Visa Type:</b> ${booking.visaType || "N/A"}</p>
          <p><b>Entry Date:</b> ${booking.entryDate}</p>
          <p><b>Return Date:</b> ${booking.returnDate}</p>

          <hr style="margin:20px 0;border:none;border-top:1px solid #ddd;">

          <h3 style="margin:0 0 15px;color:#b40303;">Payment Summary</h3>
          <p><b>Total Paid:</b> AED ${booking.finalAmount}</p>

          <p style="margin-top:10px;font-size:14px;color:#555;">
            <b>Booking ID:</b> ${booking._id}
          </p>

        </td>
      </tr>

      <tr>
        <td style="background:#fafafa;color:#777;text-align:center;
          padding:12px;font-size:12px;">
          Desert Planners Tourism LLC ⬩ Dubai, UAE
        </td>
      </tr>

    </table>

  </td></tr>
</table>
      `;

      const customerEmailHtml = `
<table width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial;background:#f4f4f7;padding:20px;">
  <tr><td align="center">

    <table width="600" cellpadding="0" cellspacing="0"
      style="background:white;border-radius:12px;overflow:hidden;
      box-shadow:0 4px 20px rgba(0,0,0,0.1);">

      <tr>
        <td style="background:#b40303;color:white;padding:25px 30px;
          text-align:center;font-size:24px;font-weight:bold;">
          🎉 Visa Application Payment Successful!
        </td>
      </tr>

      <tr>
        <td style="padding:30px;font-size:15px;color:#333;">
          
          <p>Dear <b>${booking.fullName}</b>,</p>
          <p>Thank you for your payment. Your visa application has been submitted successfully!</p>

          <h3 style="margin:20px 0 10px;color:#b40303;">Visa Details</h3>
          <p><b>Visa Package:</b> ${booking.visaTitle}</p>
          <p><b>Visa Type:</b> ${booking.visaType || "N/A"}</p>

          <h3 style="margin:20px 0 10px;color:#b40303;">Payment Summary</h3>
          <p><b>Total Paid:</b> AED ${booking.finalAmount}</p>

          <p style="margin-top:15px;font-size:14px;">Our team will contact you shortly for further processing.</p>

          <p style="font-size:14px;color:#777;margin-top:10px;">
            <b>Booking ID:</b> ${booking._id}
          </p>

        </td>
      </tr>

      <tr>
        <td style="background:#fafafa;color:#777;text-align:center;
          padding:12px;font-size:12px;">
          Thank you for choosing Desert Planners ❤️
        </td>
      </tr>

    </table>

  </td></tr>
</table>
      `;

      // SEND EMAILS
      try {
        await resend.emails.send({
          from: "Desert Planners Tourism LLC <booking@desertplanners.net>",
          to: process.env.ADMIN_EMAIL,
          subject: "New Paid Visa Booking",
          html: adminEmailHtml,
        });
      } catch (error) {
        console.log("❌ Admin email failed:", error);
      }

      try {
        await resend.emails.send({
          from: "Desert Planners Tourism LLC <booking@desertplanners.net>",
          to: booking.email,
          subject: "Visa Payment Successful!",
          html: customerEmailHtml,
        });
      } catch (error) {
        console.log("❌ Customer email failed:", error);
      }
    }

    // -------------------------------------------
    // PAYMENT FAILED FLOW
    // -------------------------------------------
    if (status === "failed" || status === "cancelled") {
      await VisaBooking.findByIdAndUpdate(bookingId, {
        paymentStatus: "failed",
        status: "rejected",
      });

      await Payment.findOneAndUpdate(
        { bookingId },
        {
          bookingId,
          amount: paidAmount,
          status: "failed",
          paymentInfo: data,
        },
        { upsert: true }
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
