// controllers/bookingController.js
import Booking from "../models/Booking.js";
import Cart from "../models/Cart.js";
import nodemailer from "nodemailer";

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
      totalPrice,
      specialRequest,
    } = req.body;

    // 🧩 Prepare booking data
    let bookingData = {
      items,
      totalPrice,
      pickupPoint,
      dropPoint,
      specialRequest,
      status: "confirmed",
    };

    // ✅ If user is logged in
    if (req.user) {
      bookingData.user = req.user._id;
      bookingData.userEmail = req.user.email;
      bookingData.userName = req.user.name;
    } else {
      // ✅ Guest booking requires these fields
      if (!guestName || !guestEmail || !guestContact) {
        return res.status(400).json({ message: "Guest details are required." });
      }
      bookingData.guestName = guestName;
      bookingData.guestEmail = guestEmail;
      bookingData.guestContact = guestContact;
    }

    // ✅ Save booking to DB
    const booking = new Booking(bookingData);
    await booking.save();

    // 🧠 If user had items in cart — clear it (optional)
    if (req.user) {
      await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    }

    // ✅ Email setup
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // 🧾 Email details
    const userEmail = req.user ? req.user.email : guestEmail;
    const userName = req.user ? req.user.name : guestName;

    const bookingDetails = booking.items
      .map(
        (item) => `
          <li style="margin-bottom:10px;">
            <b>Tour:</b> ${item.tourId?.title || "Tour"}<br/>
            <b>Date:</b> ${item.date || "N/A"}<br/>
            <b>Guests:</b> ${item.guests || 1}<br/>
            <b>Pickup:</b> ${item.pickupPoint || pickupPoint || "N/A"}<br/>
            <b>Drop:</b> ${item.dropPoint || dropPoint || "N/A"}
          </li>`
      )
      .join("");

    // ✅ Send confirmation email to guest/user
    await transporter.sendMail({
      from: `"Desert Planner" <${process.env.ADMIN_EMAIL}>`,
      to: userEmail,
      subject: "Your Desert Planner Booking Confirmation",
      html: `
        <div style="font-family:sans-serif;line-height:1.6;">
          <h2>Dear ${userName},</h2>
          <p>Thank you for booking with <b>Desert Planner!</b> Your booking has been confirmed.</p>
          <h3>Booking Details:</h3>
          <ul>${bookingDetails}</ul>
          <p><b>Total Price:</b> AED ${totalPrice}</p>
          <p><b>Pickup Point:</b> ${pickupPoint || "N/A"}</p>
          <p><b>Drop Point:</b> ${dropPoint || "N/A"}</p>
          <p><b>Special Request:</b> ${specialRequest || "None"}</p>
          <br/>
          <p>We’ll contact you soon with more details.</p>
          <p>Warm regards,<br/>Desert Planner Team</p>
        </div>
      `,
    });

    // ✅ Send email to admin
    await transporter.sendMail({
      from: `"Desert Planner Website" <${process.env.ADMIN_EMAIL}>`,
      to: process.env.ADMIN_EMAIL,
      subject: "🆕 New Booking Received",
      html: `
        <h3>New Booking Received</h3>
        <p><b>Name:</b> ${userName}</p>
        <p><b>Email:</b> ${userEmail}</p>
        <p><b>Contact:</b> ${guestContact || req.user?.phone || "N/A"}</p>
        <ul>${bookingDetails}</ul>
        <p><b>Total Price:</b> AED ${totalPrice}</p>
      `,
    });

    res.status(200).json({
      success: true,
      message: "Booking confirmed successfully",
      booking,
    });
  } catch (err) {
    console.error("❌ Error creating booking:", err);
    res
      .status(500)
      .json({ success: false, message: "Booking failed", error: err.message });
  }
};

// 🟡 Get All Bookings (Admin)
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email")
      .populate("items.tourId", "title price")
      .sort({ createdAt: -1 });

    res.status(200).json({ bookings });
  } catch (err) {
    console.error("Error fetching all bookings:", err);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

// 🔵 Get Single Booking by ID
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("user", "name email")
      .populate("items.tourId", "title price location");

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    res.status(200).json({ booking });
  } catch (err) {
    console.error("Error fetching booking:", err);
    res.status(500).json({ message: "Failed to fetch booking" });
  }
};

// 🔴 Update Booking Status (Admin)
export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.status = status;
    await booking.save();

    res.status(200).json({ message: "Booking status updated", booking });
  } catch (err) {
    console.error("Error updating booking status:", err);
    res.status(500).json({ message: "Failed to update booking status" });
  }
};

// 🟣 Get My Bookings (for Logged-in Users)
export const getMyBookings = async (req, res) => {
  try {
    const userId = req.user._id;
    const bookings = await Booking.find({ user: userId })
      .populate("items.tourId", "title price location")
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (err) {
    console.error("Error fetching user bookings:", err);
    res.status(500).json({ message: "Failed to fetch user bookings" });
  }
};
