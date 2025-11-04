import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      tourId: { type: mongoose.Schema.Types.ObjectId, ref: "Tour" },
      date: Date,
      guests: Number,
    },
  ],
  totalPrice: { type: Number, required: true },
  status: { type: String, default: "confirmed" }, // confirmed / pending / cancelled
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Booking", BookingSchema);
