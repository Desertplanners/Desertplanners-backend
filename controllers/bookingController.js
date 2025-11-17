// ⭐ COMPLETE UPDATED BOOKING CONTROLLER (Adult + Child Support)

import Booking from "../models/Booking.js";
import Cart from "../models/Cart.js";
import { Resend } from "resend";
import Tour from "../models/Tour.js"; // ⭐ IMPORTANT for price fetching
import PDFDocument from "pdfkit";

import path from "path";

// 🟢 Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// 🟢 Create Booking (Guest + Logged-in User)

export const createBooking = async (req, res) => {
  try {
    const {
      guestName,
      guestEmail,
      guestContact,
      items,
      pickupPoint,
      dropPoint,
      specialRequest,
    } = req.body;

    console.log("📩 BOOKING BODY RECEIVED:", req.body);
    console.log("📦 RECEIVED ITEMS:", items);

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Items required" });
    }

    let totalPrice = 0;
    const processedItems = [];

    for (const item of items) {
      console.log("\n=============================");
      console.log("🟡 Processing Item:", item);

      let tour = null;

      try {
        tour = await Tour.findById(item.tourId);
      } catch (err) {
        tour = null;
      }

      console.log(
        "🟢 Tour Found:",
        tour ? tour.title : "NO (Using fallback price)"
      );

      // ⭐ NEVER ALLOW NaN — fallback priority:
      const adultPrice = Number(
        item.adultPrice || (tour ? tour.priceAdult : 0) || 0
      );

      const childPrice = Number(
        item.childPrice || (tour ? tour.priceChild : 0) || 0
      );

      // ⭐ Always numbers
      const adultCount = Number(item.adultCount || 0);
      const childCount = Number(item.childCount || 0);

      console.log("💰 PRICE DEBUG:", {
        adultPrice,
        childPrice,
        adultCount,
        childCount,
      });

      const itemTotal = adultPrice * adultCount + childPrice * childCount;

      totalPrice += itemTotal;

      processedItems.push({
        tourId: item.tourId, // <-- ALWAYS PASS ORIGINAL ID (string)
        date: item.date,
        pickupPoint,
        dropPoint,
        adultCount,
        childCount,
        adultPrice,
        childPrice,
      });
    }

    console.log("📦 FINAL PROCESSED ITEMS:", processedItems);
    console.log("💰 FINAL TOTAL PRICE:", totalPrice);

    // ⭐ BUILD BOOKING DATA
    const bookingData = {
      items: processedItems,
      totalPrice,
      pickupPoint,
      dropPoint,
      specialRequest,
      status: "pending",
      paymentStatus: "pending",
    };

    if (req.user) {
      bookingData.user = req.user._id;
      bookingData.userEmail = req.user.email;
      bookingData.userName = req.user.name;
    } else {
      bookingData.guestName = guestName;
      bookingData.guestEmail = guestEmail;
      bookingData.guestContact = guestContact;
    }

    const booking = await new Booking(bookingData).save();

    await booking.populate("items.tourId", "title priceAdult priceChild");

    // 🧠 Clear logged-in user's cart
    if (req.user) {
      await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    }

    // =============== EMAIL SECTION ===============

    const userName = req.user ? req.user.name : guestName;

    const bookingDetails = booking.items
      .map(
        (item) => `
        <li style="margin-bottom:10px;">
          <b>Tour:</b> ${item.tourId?.title}<br/>
          <b>Date:</b> ${item.date}<br/>
          <b>Adults:</b> ${item.adultCount} × ${item.adultPrice}<br/>
          <b>Child:</b> ${item.childCount} × ${item.childPrice}<br/>
          <b>Pickup:</b> ${item.pickupPoint || "N/A"}<br/>
          <b>Drop:</b> ${item.dropPoint || "N/A"}
        </li>`
      )
      .join("");

    const emailHtml = `
<div style="font-family:'Segoe UI',Arial,sans-serif;line-height:1.7;background:#f7f7f7;padding:25px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 5px 18px rgba(0,0,0,0.1);">
    
    <div style="background:linear-gradient(90deg,#e82429,#721011);padding:22px 0;text-align:center;color:#fff;">
      <h1 style="margin:0;font-size:26px;font-weight:700;">🌴 Desert Planners Tourism LLC</h1>
      <p style="margin:5px 0 0;font-size:15px;opacity:0.9;">New Booking Received</p>
    </div>

    <div style="padding:28px 30px;">

      <h2 style="margin-top:0;color:#721011;">Booking by ${userName}</h2>

      <!-- ⭐ USER / GUEST DETAILS BLOCK ⭐ -->
      <div style="background:#fafafa;border:1px solid #eee;border-radius:12px;padding:18px 20px;margin-top:18px;">
        <h3 style="color:#721011;margin-top:0;">🧑 Customer Details</h3>
        <p style="margin:5px 0;"><b>Name:</b> ${userName}</p>
        <p style="margin:5px 0;"><b>Email:</b> ${
          req.user ? req.user.email : guestEmail
        }</p>
        <p style="margin:5px 0;"><b>Contact:</b> ${
          req.user ? "---" : guestContact
        }</p>
        <p style="margin:5px 0;"><b>Pickup Point:</b> ${pickupPoint}</p>
        <p style="margin:5px 0;"><b>Drop Point:</b> ${dropPoint}</p>
        <p style="margin:5px 0;"><b>Special Request:</b> ${
          specialRequest || "None"
        }</p>
        <p style="margin:5px 0;"><b>Booking ID:</b> ${booking._id}</p>
      </div>

      <!-- ⭐ BOOKING SUMMARY ⭐ -->
      <div style="background:#fafafa;border:1px solid #eee;border-radius:12px;padding:18px 20px;margin:20px 0;">
        <h3 style="color:#721011;margin-top:0;">🧾 Booking Summary</h3>
        <ul style="padding-left:18px;color:#404041;margin:0;">
          ${bookingDetails}
        </ul>
        <hr>
        <p><b>Total Price:</b> <span style="color:#e82429;">AED ${totalPrice}</span></p>
      </div>

    </div>
  </div>
</div>`;

    console.log("📧 ADMIN EMAIL:", process.env.ADMIN_EMAIL);

    await resend.emails.send({
      from: "Desert Planners Tourism LLC <onboarding@resend.dev>",
      to: process.env.ADMIN_EMAIL,
      subject: "🆕 New Booking Received - Desert Planners Tourism LLC",
      html: emailHtml,
    });

    // =====================================================

    res.status(200).json({
      success: true,
      message: "Booking successful",
      booking,
    });
  } catch (err) {
    console.error("❌ Error creating booking:", err);
    res.status(500).json({
      success: false,
      message: "Booking failed",
      error: err.message,
    });
  }
};
// 🟡 Get All Bookings (Admin - User + Guest)
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate("user", "name email")
      .populate("items.tourId", "title")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ message: "Error fetching bookings" });
  }
};

// 🔵 Get Single Booking
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("user", "name email")
      .populate("items.tourId", "title priceAdult priceChild location");

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    res.status(200).json({ booking });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch booking" });
  }
};

// 🔴 Update Booking Status
export const updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.status = req.body.status;
    await booking.save();

    res.status(200).json({ message: "Booking status updated", booking });
  } catch (err) {
    res.status(500).json({ message: "Failed to update booking status" });
  }
};

// 🟣 Get My Bookings
export const getMyBookings = async (req, res) => {
  try {
    const userId = req.user._id;
    const bookings = await Booking.find({ user: userId })
      .populate("items.tourId", "title priceAdult priceChild location")
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user bookings" });
  }
};

export const lookupBooking = async (req, res) => {
  try {
    const { bookingId, email } = req.query;

    if (!bookingId || !email) {
      return res.status(400).json({
        success: false,
        message: "Booking ID and Email are required",
      });
    }

    const booking = await Booking.findById(bookingId).populate(
      "items.tourId",
      "title priceAdult priceChild"
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "No booking found with this ID",
      });
    }

    if (booking.guestEmail !== email.toLowerCase()) {
      return res.status(401).json({
        success: false,
        message: "Email does not match this booking",
      });
    }

    return res.status(200).json({
      success: true,
      booking,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const downloadInvoice = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate(
      "items.tourId",
      "title"
    );

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const doc = new PDFDocument({ size: "A4", margin: 0 });
    res.setHeader(
      "Content-disposition",
      `attachment; filename=invoice-${booking._id}.pdf`
    );
    res.setHeader("Content-type", "application/pdf");
    doc.pipe(res);

    // ==========================
    // LIGHT PREMIUM HEADER
    // ==========================
    // =============================
    // PERFECT PREMIUM HEADER
    // =============================
    doc.rect(0, 0, 595, 120).fill("#f1f5f9"); // light header background

    // ---- LOGO LEFT ----
    try {
      const logoPath = path.join(
        process.cwd(),
        "public",
        "desertplanners_logo.png"
      );
      doc.image(logoPath, 40, 30, { width: 140 });
    } catch {}

    // ---- RIGHT HEADER CONTENT (PERFECT ALIGNED) ----

    // FIXED POSITION (x=330)
    const headerX = 330;

    doc
      .fill("#1e293b")
      .font("Helvetica-Bold")
      .fontSize(26)
      .text("BOOKING RECEIPT", headerX, 35); // title position

    doc
      .font("Helvetica")
      .fontSize(11)
      .fill("#475569")
      .text(`Invoice ID: ${booking._id}`, headerX, 75)
      .text(`Payment Status: ${booking.paymentStatus}`, headerX, 92)
      .text(
        `Date: ${new Date(booking.createdAt).toLocaleString()}`,
        headerX,
        110
      );

    // ==========================
    // MAIN CONTENT CARD
    // ==========================
    doc.roundedRect(30, 140, 535, 690, 14).fill("#ffffff").stroke("#e2e8f0");

    let y = 170;

    // ==========================
    // FROM + BILL TO SECTION
    // ==========================
    doc.font("Helvetica-Bold").fontSize(14).fill("#3b82f6").text("From", 50, y);

    doc
      .font("Helvetica")
      .fontSize(11)
      .fill("#475569")
      .text("Desert Planners Tourism LLC", 50, y + 20)
      .text("Dubai, UAE", 50, y + 35)
      .text("info@desertplanners.net", 50, y + 50)
      .text("+97143546677", 50, y + 65);

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fill("#3b82f6")
      .text("Bill To", 330, y);

    doc
      .font("Helvetica")
      .fontSize(11)
      .fill("#475569")
      .text(booking.guestName || booking.userName, 330, y + 20)
      .text(booking.guestEmail || booking.userEmail, 330, y + 35)
      .text(booking.guestContact || "—", 330, y + 50);

    // ==========================
    // TABLE HEADER
    // ==========================
    y += 120;

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fill("#1e293b")
      .text("Description", 50, y)
      .text("Qty", 260, y)
      .text("Price", 360, y)
      .text("Amount", 460, y);

    doc
      .moveTo(50, y + 18)
      .lineTo(550, y + 18)
      .stroke("#e2e8f0");

    // ==========================
    // TABLE ROWS (Clean + Light)
    // ==========================
    y += 30;

    booking.items.forEach((item, i) => {
      const bg = i % 2 === 0 ? "#f8fafc" : "#ffffff";

      doc
        .save()
        .fill(bg)
        .rect(50, y - 10, 500, 28)
        .fill()
        .restore();

      const qty = item.adultCount + item.childCount;
      const amount =
        item.adultCount * item.adultPrice + item.childCount * item.childPrice;

      doc
        .font("Helvetica")
        .fontSize(11)
        .fill("#1e293b")
        .text(item.tourId?.title, 55, y, { width: 200 })
        .text(qty, 260, y)
        .text(`AED ${item.adultPrice}`, 360, y)
        .text(`AED ${amount}`, 460, y);

      y += 30;
    });

    // ==========================
    // TOTAL AMOUNT (Light Blue Card)
    // ==========================
    y += 30;

    doc
      .roundedRect(320, y, 200, 80, 12)
      .fill("#eef6ff") // light cool blue
      .stroke("#bfdbfe");

    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .fill("#3b82f6")
      .text(`AED ${booking.totalPrice}`, 335, y + 18);

    doc
      .font("Helvetica")
      .fontSize(11)
      .fill("#475569")
      .text("Total Amount", 335, y + 48);

    // ==========================
    // FOOTER
    // ==========================
    doc
      .font("Helvetica")
      .fontSize(10)
      .fill("#64748b")
      .text(
        "This invoice is computer-generated and does not require a signature.",
        0,
        810,
        { align: "center" }
      );

    doc.end();
  } catch (err) {
    res.status(500).json({ message: "Invoice failed" });
  }
};
