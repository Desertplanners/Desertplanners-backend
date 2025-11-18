// ⭐ COMPLETE UPDATED VISA BOOKING CONTROLLER WITH EMAIL NOTIFICATION

import VisaBooking from "../models/VisaBooking.js";
import { Resend } from "resend";
import PDFDocument from "pdfkit";
import path from "path";

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper: Get file URL from multer
const fileUrl = (req, field) => req.files?.[field]?.[0]?.path || "";

// 🟢 CREATE VISA BOOKING
// 🟢 CREATE VISA BOOKING WITH TRANSACTION FEE
export const createVisaBooking = async (req, res) => {
  try {
    const data = req.body;

    // ⭐ Ensure transaction price fields are numbers
    const basePrice = Number(data.basePrice || 0);
    const transactionFee = Number(data.transactionFee || 0);
    const finalAmount = Number(data.finalAmount || 0);

    // ⭐ Create booking with file uploads + pricing fields
    const booking = new VisaBooking({
      ...data,

      basePrice,
      transactionFee,
      finalAmount,

      passportFront: fileUrl(req, "passportFront"),
      passportBack: fileUrl(req, "passportBack"),
      passportCover: fileUrl(req, "passportCover"),
      photo: fileUrl(req, "photo"),
      accommodation: fileUrl(req, "accommodation"),
      emiratesId: fileUrl(req, "emiratesId"),
      extraId: fileUrl(req, "extraId"),
      oldVisa: fileUrl(req, "oldVisa"),
      flightTicket: fileUrl(req, "flightTicket"),
    });

    await booking.save();

    // ====================================================================
    // ⭐ SEND EMAIL TO ADMIN (Same design as before)
    // ====================================================================

    const filesHtml = `
      ${
        booking.passportFront
          ? `<li>Passport Front: ${booking.passportFront}</li>`
          : ""
      }
      ${
        booking.passportBack
          ? `<li>Passport Back: ${booking.passportBack}</li>`
          : ""
      }
      ${
        booking.passportCover
          ? `<li>Passport Cover: ${booking.passportCover}</li>`
          : ""
      }
      ${booking.photo ? `<li>Photo: ${booking.photo}</li>` : ""}
      ${
        booking.accommodation
          ? `<li>Accommodation: ${booking.accommodation}</li>`
          : ""
      }
      ${booking.emiratesId ? `<li>Emirates ID: ${booking.emiratesId}</li>` : ""}
      ${booking.extraId ? `<li>Extra ID: ${booking.extraId}</li>` : ""}
      ${booking.oldVisa ? `<li>Old Visa: ${booking.oldVisa}</li>` : ""}
      ${
        booking.flightTicket
          ? `<li>Flight Ticket: ${booking.flightTicket}</li>`
          : ""
      }
    `;

    const emailHtml = `
<div style="font-family:'Segoe UI',Arial,sans-serif;line-height:1.7;background:#f7f7f7;padding:25px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 5px 18px rgba(0,0,0,0.1);">
    
    <div style="background:linear-gradient(90deg,#e82429,#721011);padding:22px 0;text-align:center;color:#fff;">
      <h1 style="margin:0;font-size:26px;font-weight:700;">📄 UAE Visa Application</h1>
      <p style="margin:5px 0 0;font-size:15px;opacity:0.9;">New Visa Booking Received</p>
    </div>

    <div style="padding:28px 30px;">

      <h2 style="margin-top:0;color:#721011;">Applicant: ${
        booking.fullName
      }</h2>

      <!-- ⭐ CUSTOMER DETAILS -->
      <div style="background:#fafafa;border:1px solid #eee;border-radius:12px;padding:18px 20px;margin-top:18px;">
        <h3 style="color:#721011;margin-top:0;">🧑 Applicant Details</h3>
        <p><b>Name:</b> ${booking.fullName}</p>
        <p><b>Email:</b> ${booking.email}</p>
        <p><b>Contact:</b> ${booking.phone}</p>
        <p><b>Nationality:</b> ${booking.nationality}</p>
        <p><b>Passport No:</b> ${booking.passportNumber}</p>
        <p><b>Visa Type:</b> ${booking.visaType}</p>
        <p><b>Booking ID:</b> ${booking._id}</p>

        <br/>
        <p><b>Base Price:</b> AED ${booking.basePrice.toFixed(2)}</p>
        <p><b>Transaction Fee (3.75%):</b> AED ${booking.transactionFee.toFixed(
          2
        )}</p>
        <p><b>Final Amount:</b> AED ${booking.finalAmount.toFixed(2)}</p>
      </div>

      <!-- ⭐ FILE LINKS -->
      <div style="background:#fafafa;border:1px solid #eee;border-radius:12px;padding:18px 20px;margin:20px 0;">
        <h3 style="color:#721011;margin-top:0;">📎 Uploaded Documents</h3>
        <ul style="padding-left:18px;color:#404041;margin:0;">${filesHtml}</ul>
      </div>

    </div>
  </div>
</div>
`;

    // ⭐ SEND EMAIL TO ADMIN
    await resend.emails.send({
      from: "Desert Planners Tourism LLC <onboarding@resend.dev>",
      to: process.env.ADMIN_EMAIL,
      subject: "📄 New Visa Booking Received",
      html: emailHtml,
    });

    // ====================================================================

    res.status(201).json({
      message: "Visa booking submitted successfully",
      booking,
    });
  } catch (err) {
    console.error("❌ Visa Booking Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 🔵 GET ALL VISA BOOKINGS
export const getAllVisaBookings = async (req, res) => {
  try {
    const list = await VisaBooking.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔵 GET SINGLE VISA BOOKING
export const getVisaBookingById = async (req, res) => {
  try {
    const booking = await VisaBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🟡 UPDATE VISA BOOKING STATUS
export const updateVisaBookingStatus = async (req, res) => {
  try {
    const booking = await VisaBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.status = req.body.status || booking.status;
    await booking.save();

    res.json({ message: "Status updated", booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ❌ DELETE VISA BOOKING
export const deleteVisaBooking = async (req, res) => {
  try {
    await VisaBooking.findByIdAndDelete(req.params.id);
    res.json({ message: "Booking deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔍 LOOKUP VISA BOOKING (Booking ID + Email)
export const lookupVisaBooking = async (req, res) => {
  try {
    const { bookingId, email } = req.query;

    // ❗ Validation
    if (!bookingId || !email) {
      return res.status(400).json({
        success: false,
        message: "Booking ID and Email are required",
      });
    }

    // 🔍 Find Booking + Populate Visa Full Details
    const booking = await VisaBooking.findById(bookingId).populate(
      "visaId",
      "title category price duration processingTime slug"
    );

    // ❗ Booking not found
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "No booking found with this ID",
      });
    }

    // ❗ Email mismatch
    if (booking.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(401).json({
        success: false,
        message: "Email does not match this booking",
      });
    }

    // 👍 Everything OK
    return res.status(200).json({
      success: true,
      booking,
    });
  } catch (err) {
    console.log("❌ Lookup Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const downloadVisaInvoice = async (req, res) => {
  try {
    const booking = await VisaBooking.findById(req.params.id).populate(
      "visaId"
    );

    if (!booking)
      return res.status(404).json({ message: "Visa Booking not found" });

    const doc = new PDFDocument({ size: "A4", margin: 0 });

    res.setHeader(
      "Content-disposition",
      `attachment; filename=visa-invoice-${booking._id}.pdf`
    );
    res.setHeader("Content-type", "application/pdf");

    doc.pipe(res);

    // =====================================================
    // HEADER (Soft Gradient)
    // =====================================================
    const headerGradient = doc.linearGradient(0, 0, 595, 120);
    headerGradient.stop(0, "#e0f2fe").stop(1, "#f0f9ff");

    doc.rect(0, 0, 595, 120).fill(headerGradient);

    // LOGO LEFT
    try {
      const logoPath = path.resolve("public/desertplanners_logo.png");
      doc.image(logoPath, 40, 32, { width: 120 });
    } catch (err) {
      console.log("Logo missing:", err);
    }

    // HEADER RIGHT CONTENT
    const dpHeaderRightWidth = 220;
    const dpHeaderX = 330;
    const dpHeaderY = 30;

    doc
      .fill("#0f172a")
      .font("Helvetica-Bold")
      .fontSize(26)
      .text("VISA INVOICE", dpHeaderX, dpHeaderY, {
        width: dpHeaderRightWidth,
        align: "right",
      });

    doc
      .font("Helvetica")
      .fontSize(11)
      .fill("#334155")
      .text(`Invoice ID: ${booking._id}`, dpHeaderX, dpHeaderY + 40, {
        width: dpHeaderRightWidth,
        align: "right",
      })
      .text(
        `Payment: ${booking.paymentStatus || "Paid"}`,
        dpHeaderX,
        dpHeaderY + 58,
        {
          width: dpHeaderRightWidth,
          align: "right",
        }
      )
      .text(
        `Date: ${new Date(booking.createdAt).toLocaleDateString()}`,
        dpHeaderX,
        dpHeaderY + 76,
        { width: dpHeaderRightWidth, align: "right" }
      );

    // =====================================================
    // FROM & BILL TO (Clean Layout)
    // =====================================================
    let y = 160;

    // LEFT - FROM
    doc.fill("#0ea5e9").font("Helvetica-Bold").fontSize(15).text("FROM", 50, y);

    doc
      .font("Helvetica")
      .fontSize(11)
      .fill("#334155")
      .text("Desert Planners Tourism LLC", 50, y + 22)
      .text("Dubai, UAE", 50, y + 38)
      .text("info@desertplanners.net", 50, y + 54)
      .text("+971 4354 6677", 50, y + 70);

    // RIGHT - BILL TO
    const dpRightPadding = 25;
    const dpRightX = 330;
    const dpRightWidth = 240 - dpRightPadding;

    doc
      .fill("#0ea5e9")
      .font("Helvetica-Bold")
      .fontSize(15)
      .text("BILL TO", dpRightX, y, {
        width: dpRightWidth,
        align: "right",
      });

    doc
      .font("Helvetica")
      .fontSize(11)
      .fill("#334155")
      .text(booking.fullName, dpRightX, y + 22, {
        width: dpRightWidth,
        align: "right",
      })
      .text(booking.email, dpRightX, y + 38, {
        width: dpRightWidth,
        align: "right",
      })
      .text(booking.phone || "—", dpRightX, y + 54, {
        width: dpRightWidth,
        align: "right",
      });

    // =====================================================
    // VISA OVERVIEW TABLE
    // =====================================================
    let dpTableY = y + 120;

    // Title
    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fill("#0f172a")
      .text("Visa Overview", 50, dpTableY);

    dpTableY += 35;

    const dpTableHeight = 4 * 35;

    doc
      .roundedRect(45, dpTableY, 500, dpTableHeight, 12)
      .fill("#f8fafc")
      .stroke("#e2e8f0");

    const dpRows = [
      ["Visa Package", booking.visaId?.title || booking.visaType || "N/A"],
      ["Visa Type", booking.visaType || "N/A"],
      ["Nationality", booking.nationality || "N/A"],
      ["Passport No", booking.passportNumber || "N/A"],
    ];

    dpRows.forEach(([label, value], idx) => {
      const rowY = dpTableY + idx * 35;

      if (idx > 0) {
        doc.moveTo(45, rowY).lineTo(545, rowY).stroke("#e2e8f0");
      }

      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fill("#1e3a8a")
        .text(label, 60, rowY + 10);

      doc
        .font("Helvetica")
        .fontSize(12)
        .fill("#0f172a")
        .text(value, 260, rowY + 10);
    });

    // =====================================================
    // TOTAL SUMMARY (Base + Fee + Final Amount)
    // =====================================================
    const dpTotalY = dpTableY + dpTableHeight + 40;

    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fill("#0f172a")
      .text("Payment Summary", 50, dpTotalY);

    const summaryRows = [
      ["Base Price", `AED ${booking.basePrice?.toFixed(2)}`],
      ["Transaction Fee (3.75%)", `AED ${booking.transactionFee?.toFixed(2)}`],
      ["Final Amount", `AED ${booking.finalAmount?.toFixed(2)}`],
    ];

    let yy = dpTotalY + 40;

    summaryRows.forEach(([label, value]) => {
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fill("#1e3a8a")
        .text(label, 60, yy);

      doc
        .font("Helvetica")
        .fontSize(12)
        .fill("#0f172a")
        .text(value, 320, yy, { align: "right" });

      yy += 28;
    });

    // =====================================================
    // DYNAMIC FOOTER (Never overlaps)
    // =====================================================
    let dpFooterY = dpTotalY + 80;

    if (dpFooterY > doc.page.height - 90) {
      dpFooterY = doc.page.height - 90;
    }

    doc.moveTo(45, dpFooterY).lineTo(545, dpFooterY).stroke("#e2e8f0");

    doc
      .roundedRect(45, dpFooterY + 5, 500, 45, 10)
      .fillOpacity(0.15)
      .fill("#e2e8f0")
      .strokeOpacity(0.3)
      .stroke("#cbd5e1");

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fill("#334155")
      .text(
        "Thank you for choosing Desert Planners Tourism",
        0,
        dpFooterY + 12,
        { align: "center" }
      );

    doc
      .font("Helvetica")
      .fontSize(10)
      .fill("#64748b")
      .text(
        "This invoice is auto-generated and does not require a signature.",
        0,
        dpFooterY + 28,
        { align: "center" }
      );

    doc.end();
  } catch (err) {
    console.log("Invoice Error:", err);
    res.status(500).json({ message: "Invoice generation failed" });
  }
};
