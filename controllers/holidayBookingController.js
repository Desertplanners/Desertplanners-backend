import HolidayBooking from "../models/HolidayBooking.js";
import HolidayPackage from "../models/HolidayTour.js";

// ======================================================
// CREATE HOLIDAY BOOKING
// ======================================================

export const createHolidayBooking = async (req, res) => {
  try {
    const {
      packageId,
      guestName,
      guestEmail,
      guestContact,
      travelDate,
      adults,
      children,
    } = req.body;

    if (!packageId) {
      return res.status(400).json({
        success: false,
        message: "Package ID is required",
      });
    }

    const holidayPackage = await HolidayPackage.findById(packageId);

    if (!holidayPackage) {
      return res.status(404).json({
        success: false,
        message: "Holiday package not found",
      });
    }

    // Prices from package
    const adultPrice = Number(holidayPackage.priceAdult || 0);
    const childPrice = Number(holidayPackage.priceChild || 0);

    const subtotal =
      adults * adultPrice +
      children * childPrice;

    const transactionFee = 0;
    const couponDiscount = 0;

    const totalPrice =
      subtotal + transactionFee - couponDiscount;

    const booking = new HolidayBooking({
      packageId,
      packageTitle: holidayPackage.title,

      guestName,
      guestEmail,
      guestContact,

      travelDate,

      adults,
      children,

      adultPrice,
      childPrice,

      subtotal,
      transactionFee,
      couponDiscount,
      totalPrice,
    });

    await booking.save();

    return res.status(201).json({
      success: true,
      message: "Holiday booking created successfully",
      booking,
    });
  } catch (err) {
    console.error("Holiday booking error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================================================
// GET ALL HOLIDAY BOOKINGS (ADMIN)
// ======================================================

export const getAllHolidayBookings = async (req, res) => {
  try {
    const bookings = await HolidayBooking.find()
      .populate("packageId", "title")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      bookings,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================================================
// GET SINGLE HOLIDAY BOOKING
// ======================================================

export const getHolidayBooking = async (req, res) => {
  try {
    const booking = await HolidayBooking.findById(req.params.id).populate(
      "packageId"
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.json({
      success: true,
      booking,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};