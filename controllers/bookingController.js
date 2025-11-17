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

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Items required" });
    }

    let subtotal = 0;
    const processedItems = [];

    // ⭐ PROCESS EACH ITEM
    for (const item of items) {
      let tour = null;

      try {
        tour = await Tour.findById(item.tourId);
      } catch (error) {
        tour = null;
      }

      const adultPrice = Number(item.adultPrice || tour?.priceAdult || 0);
      const childPrice = Number(item.childPrice || tour?.priceChild || 0);

      const adultCount = Number(item.adultCount || 0);
      const childCount = Number(item.childCount || 0);

      const itemTotal = adultPrice * adultCount + childPrice * childCount;
      subtotal += itemTotal;

      // 🚫 pickup/drop per-item nahi hona chahiye
      processedItems.push({
        tourId: item.tourId,
        date: item.date,
        adultCount,
        childCount,
        adultPrice,
        childPrice,
      });
    }

    // ⭐ ADD TRANSACTION FEE
    const transactionFee = Number((subtotal * 0.0375).toFixed(2));
    const finalTotal = Number((subtotal + transactionFee).toFixed(2));

    console.log("💰 SUBTOTAL:", subtotal);
    console.log("💰 FEE 3.75%:", transactionFee);
    console.log("💰 FINAL:", finalTotal);

    // ⭐ SAVE BOOKING DATA (ROOT LEVEL)
    const bookingData = {
      items: processedItems,
      subtotal,
      transactionFee,
      totalPrice: finalTotal,
      pickupPoint, // FIXED
      dropPoint, // FIXED
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

    // ⭐ SAVE BOOKING
    const booking = await new Booking(bookingData).save();
    await booking.populate("items.tourId", "title priceAdult priceChild");

    // CLEAR CART IF LOGGED-IN
    if (req.user) {
      await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    }

    // EMAIL FORMAT
    const bookingDetails = booking.items
      .map(
        (item) => `
      <li>
        <b>Tour:</b> ${item.tourId?.title} <br/>
        <b>Date:</b> ${item.date} <br/>
        <b>Adults:</b> ${item.adultCount} × ${item.adultPrice} <br/>
        <b>Children:</b> ${item.childCount} × ${item.childPrice} <br/>
      </li>
      `
      )
      .join("");

    const emailHtml = `
      <div style="font-family:Arial;padding:20px;">
        <h2>New Booking Received</h2>
        <p><b>Name:</b> ${booking.guestName || booking.userName}</p>
        <p><b>Email:</b> ${booking.guestEmail || booking.userEmail}</p>
        <p><b>Pickup:</b> ${pickupPoint}</p>
        <p><b>Drop:</b> ${dropPoint}</p>
        <hr/>
        <h3>Booking Summary</h3>
        <ul>${bookingDetails}</ul>
        <hr/>
        <p><b>Subtotal:</b> AED ${subtotal}</p>
        <p><b>Transaction Fee :</b> AED ${transactionFee}</p>
        <p><b>Total Payable:</b> AED ${finalTotal}</p>
        <p><b>Booking ID:</b> ${booking._id}</p>
      </div>
    `;

    await resend.emails.send({
      from: "Desert Planners <onboarding@resend.dev>",
      to: process.env.ADMIN_EMAIL,
      subject: "New Booking Received",
      html: emailHtml,
    });

    return res.status(200).json({
      success: true,
      message: "Booking successful",
      booking,
    });
  } catch (err) {
    console.error("❌ Error creating booking:", err);
    return res.status(500).json({
      success: false,
      message: "Error",
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
      `attachment; filename=tour-invoice-${booking._id}.pdf`
    );
    res.setHeader("Content-type", "application/pdf");

    doc.pipe(res);

    // =====================================================
    // HEADER (Soft Gradient)
    // =====================================================
    const headerBand = doc.linearGradient(0, 0, 595, 120);
    headerBand.stop(0, "#e0f2fe").stop(1, "#f0f9ff");

    doc.rect(0, 0, 595, 120).fill(headerBand);

    // Logo
    try {
      const logoPath = path.resolve("public/desertplanners_logo.png");
      doc.image(logoPath, 40, 32, { width: 120 });
    } catch (err) {}

    // Header Right
    const hdrX = 330;
    const hdrW = 220;

    doc
      .fill("#0f172a")
      .font("Helvetica-Bold")
      .fontSize(26)
      .text("TOUR INVOICE", hdrX, 30, { width: hdrW, align: "right" });

    doc
      .font("Helvetica")
      .fontSize(11)
      .fill("#334155")
      .text(`Invoice ID: ${booking._id}`, hdrX, 70, { width: hdrW, align: "right" })
      .text(`Payment: ${booking.paymentStatus}`, hdrX, 88, {
        width: hdrW,
        align: "right",
      })
      .text(`Date: ${new Date(booking.createdAt).toLocaleDateString()}`, hdrX, 106, {
        width: hdrW,
        align: "right",
      });

    // =====================================================
    // FROM + BILL TO
    // =====================================================
    let y = 160;

    doc.fill("#0ea5e9").font("Helvetica-Bold").fontSize(15).text("FROM", 50, y);

    doc
      .font("Helvetica")
      .fontSize(11)
      .fill("#334155")
      .text("Desert Planners Tourism LLC", 50, y + 22)
      .text("Dubai, UAE", 50, y + 38)
      .text("info@desertplanners.net", 50, y + 54)
      .text("+971 4354 6677", 50, y + 70);

    // Bill To (Right with 25px padding)
    const billX = 330;
    const billWidth = 215;

    doc
      .fill("#0ea5e9")
      .font("Helvetica-Bold")
      .fontSize(15)
      .text("BILL TO", billX, y, { width: billWidth, align: "right" });

    doc
      .font("Helvetica")
      .fontSize(11)
      .fill("#334155")
      .text(booking.guestName || booking.userName, billX, y + 22, {
        width: billWidth,
        align: "right",
      })
      .text(booking.guestEmail || booking.userEmail, billX, y + 38, {
        width: billWidth,
        align: "right",
      })
      .text(booking.guestContact || "—", billX, y + 54, {
        width: billWidth,
        align: "right",
      });

    // =====================================================
    // 🌟 MODERN TOUR SUMMARY TABLE
    // =====================================================
    let tableY = y + 120;

    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fill("#0f172a")
      .text("Tour Summary", 50, tableY);

    tableY += 35;

    // Header Bar
    doc.roundedRect(45, tableY, 500, 38, 12).fill("#eef6ff").stroke("#cfe0f6");

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fill("#0f172a")
      .text("Tour", 60, tableY + 12)
      .text("Guests", 240, tableY + 12)
      .text("Unit Price", 350, tableY + 12)
      .text("Total", 470, tableY + 12, { width: 60, align: "right" });

    tableY += 45;

    const safeItems = Array.isArray(booking.items) ? booking.items : [];
    const rowHeight = 52;

    safeItems.forEach((item, index) => {
      const rowY = tableY + index * rowHeight;

      doc
        .save()
        .roundedRect(45, rowY, 500, rowHeight - 8, 10)
        .fill(index % 2 === 0 ? "#ffffff" : "#f9fbff")
        .restore();

      const tourName = item?.tourId?.title || "Tour";
      const adultCount = Number(item?.adultCount || 0);
      const childCount = Number(item?.childCount || 0);
      const adultPrice = Number(item?.adultPrice || 0);
      const childPrice = Number(item?.childPrice || 0);

      const qtyText =
        adultCount > 0 || childCount > 0
          ? `${adultCount} Adult${adultCount > 1 ? "s" : ""}${
              childCount > 0 ? `, ${childCount} Child` : ""
            }`
          : "0 Guests";

      const priceText =
        childCount > 0
          ? `A: ${adultPrice} / C: ${childPrice}`
          : `AED ${adultPrice}`;

      const totalAmount = adultPrice * adultCount + childPrice * childCount;

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fill("#0f172a")
        .text(`•  ${tourName}`, 60, rowY + 14);

      doc
        .font("Helvetica")
        .fontSize(10)
        .fill("#334155")
        .text(qtyText, 240, rowY + 14);

      doc
        .font("Helvetica")
        .fontSize(10)
        .fill("#334155")
        .text(priceText, 350, rowY + 14);

      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fill("#0ea5e9")
        .text(`AED ${totalAmount}`, 470, rowY + 12, {
          width: 60,
          align: "right",
        });
    });

    tableY += safeItems.length * rowHeight;

    // =====================================================
    // 🌟 PREMIUM TOTALS SUMMARY BOX
    // =====================================================
    const invSubtotal = Number(booking.subtotal || 0);
    const invFee = Number(booking.transactionFee || 0);
    const invGrandTotal = Number(booking.totalPrice || 0);

    let totalsBoxStartY = tableY + 60;

    // Total Box Background
    doc
      .roundedRect(45, totalsBoxStartY, 500, 155, 16)
      .fill("#f9fbff")
      .stroke("#dbeafe");

    // Top Gradient Bar
    const totalsHeaderBar = doc.linearGradient(
      45,
      totalsBoxStartY,
      545,
      totalsBoxStartY + 40
    );
    totalsHeaderBar.stop(0, "#e0f2fe").stop(1, "#f0f9ff");

    doc
      .roundedRect(45, totalsBoxStartY, 500, 40, 16)
      .fill(totalsHeaderBar)
      .stroke("#cfe0f6");

    doc
      .font("Helvetica-Bold")
      .fontSize(15)
      .fill("#0f172a")
      .text("Payment Summary", 60, totalsBoxStartY + 12);

    // Lines
    let totalsLineY = totalsBoxStartY + 55;

    // Subtotal
    doc.font("Helvetica").fontSize(12).fill("#475569").text("Subtotal", 60, totalsLineY);

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fill("#0284c7")
      .text(`AED ${invSubtotal.toFixed(2)}`, 300, totalsLineY - 2, {
        width: 200,
        align: "right",
      });

    totalsLineY += 28;

    // Transaction Fee
    doc
      .font("Helvetica")
      .fontSize(12)
      .fill("#475569")
      .text("Transaction Fee ", 60, totalsLineY);

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fill("#0284c7")
      .text(`AED ${invFee.toFixed(2)}`, 300, totalsLineY - 2, {
        width: 200,
        align: "right",
      });

    totalsLineY += 35;

    doc.moveTo(60, totalsLineY).lineTo(525, totalsLineY).stroke("#dbeafe");

    totalsLineY += 18;

    // Grand Total
    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fill("#0f172a")
      .text("Total Payable", 60, totalsLineY);

    doc
      .font("Helvetica-Bold")
      .fontSize(22)
      .fill("#0ea5e9")
      .text(`AED ${invGrandTotal.toFixed(2)}`, 300, totalsLineY - 6, {
        width: 200,
        align: "right",
      });

    // =====================================================
    // FOOTER (FIXED)
    // =====================================================
    let footerY = totalsLineY + 80;

    if (footerY > doc.page.height - 90) {
      footerY = doc.page.height - 90;
    }

    doc.moveTo(45, footerY).lineTo(545, footerY).stroke("#e2e8f0");

    doc
      .roundedRect(45, footerY + 5, 500, 45, 10)
      .fillOpacity(0.15)
      .fill("#e2e8f0")
      .strokeOpacity(0.3)
      .stroke("#cbd5e1");

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fill("#334155")
      .text("Thank you for choosing Desert Planners Tourism", 0, footerY + 12, {
        align: "center",
      });

    doc
      .font("Helvetica")
      .fontSize(10)
      .fill("#64748b")
      .text(
        "This invoice is auto-generated and does not require a signature.",
        0,
        footerY + 28,
        { align: "center" }
      );

    doc.end();
  } catch (err) {
    console.log("Invoice Error:", err);
    res.status(500).json({ message: "Invoice failed" });
  }
};
