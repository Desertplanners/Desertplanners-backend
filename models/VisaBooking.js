import mongoose from "mongoose";

const VisaBookingSchema = new mongoose.Schema(
  {
    // Link to actual Visa
    visaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Visa",
      required: true,
    },

    visaTitle: String,

    // ⭐ NEW PRICING FIELDS
    basePrice: { type: Number, default: 0 },
    transactionFee: { type: Number, default: 0 },
    finalAmount: { type: Number, default: 0 },

    totalPrice: {
      type: Number,
      required: true,
      default: 0,
    },

    processingTime: String,

    // Personal Info
    fullName: String,
    email: String,
    phone: String,
    whatsapp: String,
    dob: String,
    gender: String,

    // Passport Info
    passportNumber: String,
    issuePlace: String,
    issueDate: String,
    expiryDate: String,

    // Travel Info
    visaType: String,
    entryDate: String,
    returnDate: String,
    purpose: String,

    // Documents (Cloudinary URLs)
    passportFront: String,
    passportBack: String,
    passportCover: String,
    photo: String,
    accommodation: String,
    emiratesId: String,
    extraId: String,
    oldVisa: String,
    flightTicket: String,

    // Payment / Status
    paymentStatus: {
      type: String,
      default: "paid",
    },

    status: {
      type: String,
      enum: ["pending", "processing", "completed", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("VisaBooking", VisaBookingSchema);
