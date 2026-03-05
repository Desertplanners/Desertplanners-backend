import mongoose from "mongoose";

const HolidayBookingSchema = new mongoose.Schema(
{
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "HolidayTour",   // ⭐ FIXED
    required: true,
  },

  packageTitle: {
    type: String,
  },

  guestName: {
    type: String,
    required: true,
  },

  guestEmail: {
    type: String,
    required: true,
  },

  guestContact: {
    type: String,
    required: true,
  },

  travelDate: {
    type: Date,
    required: true,
  },

  adults: {
    type: Number,
    default: 1,
  },

  children: {
    type: Number,
    default: 0,
  },

  adultPrice: {
    type: Number,
    default: 0,
  },

  childPrice: {
    type: Number,
    default: 0,
  },

  subtotal: {
    type: Number,
    default: 0,
  },

  transactionFee: {
    type: Number,
    default: 0,
  },

  couponDiscount: {
    type: Number,
    default: 0,
  },

  totalPrice: {
    type: Number,
    required: true,
  },

  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Failed"],
    default: "Pending",
  },

  status: {
    type: String,
    enum: ["Pending", "Confirmed", "Cancelled"],
    default: "Pending",
  },
},
{ timestamps: true }
);

export default mongoose.model("HolidayBooking", HolidayBookingSchema);