// models/Visa.js
import mongoose from "mongoose";

const visaSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    price: { type: Number, required: true },

    // ✅ overview ab list wise
    overview: {
      type: [String],
      required: true,
      default: [],
    },

    // ❌ details hata diya (jo pehle string tha)
    // details: { type: String },

    // ✅ new: how to apply (list)
    howToApply: {
      type: [String],
      default: [],
    },

    // ✅ new: terms & conditions (list)
    termsAndConditions: {
      type: [String],
      default: [],
    },

    gallery: [{ type: String }],
    img: { type: String },

    // Quick Facts
    processingTime: { type: String, default: "2–5 Days" },
    visaType: { type: String, default: "Tourist Visa" },
    entryType: { type: String, default: "Single / Multiple" },
    validity: { type: String, default: "60 Days" },
    stayDuration: { type: String, default: "30 Days" },

    // Lists
    inclusions: [{ type: String }],
    exclusions: [{ type: String }],
    documents: [{ type: String }],

    // Related visas
    relatedVisas: [{ type: mongoose.Schema.Types.ObjectId, ref: "Visa" }],

    // ✅ Visa Category Reference (required)
    visaCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VisaCategory",
      required: true,
    },
    // ⭐ DRAFT / PUBLISH SYSTEM
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    publishedAt: {
      type: Date,
      default: null,
    },

    // Reviews
    reviews: [
      {
        name: String,
        date: String,
        rating: Number,
        review: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Visa", visaSchema);
