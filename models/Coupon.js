// models/Coupon.js
import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    // ================= BASIC =================
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    discountType: {
      type: String,
      enum: ["percentage", "flat"],
      required: true,
    },

    discountValue: {
      type: Number,
      required: true,
    },

    // ================= CONDITIONS =================
    minOrderAmount: {
      type: Number,
      default: 0,
    },

    maxDiscountAmount: {
      type: Number,
      default: null, // only for percentage
    },

    expiryDate: {
      type: Date,
      required: true,
    },

    // ================= USAGE =================
    totalUsageLimit: {
      type: Number,
      default: null,
    },

    usedCount: {
      type: Number,
      default: 0,
    },

    // ================= TOUR SPECIFIC =================
    applicableTours: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tour",
      },
    ],
    /*
      RULE:
      - []  => General coupon (all tours)
      - [tourId] => Only selected tour(s)
    */

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Coupon", couponSchema);
