// ⭐ COMPLETE UPDATED VISA BOOKING CONTROLLER WITH EMAIL NOTIFICATION

import VisaBooking from "../models/VisaBooking.js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper: Get file URL from multer
const fileUrl = (req, field) => req.files?.[field]?.[0]?.path || "";

// 🟢 CREATE VISA BOOKING
export const createVisaBooking = async (req, res) => {
  try {
    const data = req.body;

    // ⭐ Create booking with file uploads
    const booking = new VisaBooking({
      ...data,
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
    // ⭐ SEND EMAIL TO ADMIN (SAME DESIGN AS TOUR BOOKING)
    // ====================================================================

    const filesHtml = `
      ${booking.passportFront ? `<li>Passport Front: ${booking.passportFront}</li>` : ""}
      ${booking.passportBack ? `<li>Passport Back: ${booking.passportBack}</li>` : ""}
      ${booking.passportCover ? `<li>Passport Cover: ${booking.passportCover}</li>` : ""}
      ${booking.photo ? `<li>Photo: ${booking.photo}</li>` : ""}
      ${booking.accommodation ? `<li>Accommodation: ${booking.accommodation}</li>` : ""}
      ${booking.emiratesId ? `<li>Emirates ID: ${booking.emiratesId}</li>` : ""}
      ${booking.extraId ? `<li>Extra ID: ${booking.extraId}</li>` : ""}
      ${booking.oldVisa ? `<li>Old Visa: ${booking.oldVisa}</li>` : ""}
      ${booking.flightTicket ? `<li>Flight Ticket: ${booking.flightTicket}</li>` : ""}
    `;

    const emailHtml = `
<div style="font-family:'Segoe UI',Arial,sans-serif;line-height:1.7;background:#f7f7f7;padding:25px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 5px 18px rgba(0,0,0,0.1);">
    
    <div style="background:linear-gradient(90deg,#e82429,#721011);padding:22px 0;text-align:center;color:#fff;">
      <h1 style="margin:0;font-size:26px;font-weight:700;">📄 UAE Visa Application</h1>
      <p style="margin:5px 0 0;font-size:15px;opacity:0.9;">New Visa Booking Received</p>
    </div>

    <div style="padding:28px 30px;">

      <h2 style="margin-top:0;color:#721011;">Applicant: ${booking.fullName}</h2>

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
      </div>

      <!-- ⭐ FILE LINKS -->
      <div style="background:#fafafa;border:1px solid #eee;border-radius:12px;padding:18px 20px;margin:20px 0;">
        <h3 style="color:#721011;margin-top:0;">📎 Uploaded Documents</h3>
        <ul style="padding-left:18px;color:#404041;margin:0;">
          ${filesHtml}
        </ul>
      </div>

    </div>
  </div>
</div>
`;

    // ⭐ SEND EMAIL
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
