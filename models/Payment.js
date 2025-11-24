import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    transactionId: String,
    amount: Number,
    currency: { type: String, default: "AED" },
    status: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },
    paymentInfo: Object,
    method: String, // card, wallet, etc.
    gateway: { type: String, default: "Paymennt" },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", PaymentSchema);
