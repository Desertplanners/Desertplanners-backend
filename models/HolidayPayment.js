import mongoose from "mongoose";

const HolidayPaymentSchema = new mongoose.Schema(
{
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "HolidayBooking",
    required: true
  },

  transactionId: String,

  amount: Number,

  currency: {
    type: String,
    default: "AED"
  },

  status: {
    type: String,
    enum: ["Pending","Paid","Failed"],
    default: "Pending"
  },

  paymentInfo: Object,

  method: String,

  gateway: {
    type: String,
    default: "Paymennt"
  }

},
{timestamps:true}
);

export default mongoose.model("HolidayPayment",HolidayPaymentSchema);