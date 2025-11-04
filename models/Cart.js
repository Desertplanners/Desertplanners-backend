import mongoose from "mongoose";

const CartItemSchema = new mongoose.Schema({
  tourId: { type: mongoose.Schema.Types.ObjectId, ref: "Tour", required: true },
  date: { type: Date, required: true },
  guests: { type: Number, required: true },
});

const CartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [CartItemSchema],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Cart", CartSchema);
