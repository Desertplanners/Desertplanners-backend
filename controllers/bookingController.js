import Booking from "../models/Booking.js";
import Cart from "../models/Cart.js";

// 🟢 Create Booking (User must be logged in)
export const createBooking = async (req, res) => {
  try {
    const userId = req.user._id; // ✅ From token (protect middleware)
    const cart = await Cart.findOne({ user: userId }).populate("items.tourId");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const totalPrice = cart.items.reduce(
      (sum, item) => sum + (item.tourId.price || 0) * item.guests,
      0
    );

    const booking = new Booking({
      user: userId,
      items: cart.items,
      totalPrice,
    });

    await booking.save();
    cart.items = [];
    await cart.save();

    res.status(200).json({ message: "Booking confirmed", booking });
  } catch (err) {
    console.error("Error creating booking:", err);
    res.status(500).json({ message: "Booking failed" });
  }
};

// 🟡 Get All Bookings (Admin only)
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

// 🔵 Get Single Booking
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("user", "name email")
      .populate("items.tourId", "title price location");

    if (!booking)
      return res.status(404).json({ message: "Booking not found" });

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

// 🟣 Get My Bookings (User)
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
