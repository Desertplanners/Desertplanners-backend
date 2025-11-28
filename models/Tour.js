// ⭐ UPDATED FULL FILE BELOW

import mongoose from "mongoose";

const tourSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String, required: true },

    priceAdult: { type: Number, required: true },
    priceChild: { type: Number, default: null },

    duration: { type: String, required: true },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    mainImage: { type: String, required: true },
    galleryImages: [{ type: String }],

    highlights: [{ type: String }],
    inclusions: [{ type: String }],
    exclusions: [{ type: String }],

    timings: { type: String },

    cancellationPolicy: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
      },
    ],

    location: { type: String },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    maxGuests: { type: Number, default: 12 },

    termsAndConditions: { type: String, default: "" },

    relatedTours: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tour",
      },
    ],
  },
  { timestamps: true }
);

// ⭐ FIX: CLEAN SEO-FRIENDLY SLUG GENERATOR
tourSchema.pre("save", function (next) {
  if (!this.slug || this.isModified("title")) {

    const cleanTitle = this.title
      .toLowerCase()
      .replace(/\+/g, "")        // remove +
      .replace(/&/g, "")         // remove &
      .replace(/\//g, "")        // remove /
      .replace(/%/g, "")         // remove %
      .replace(/[^a-z0-9\s-]/g, "")  // remove special chars
      .replace(/\s+/g, "-")      // spaces → dash
      .replace(/-+/g, "-")       // multiple dash → single dash
      .trim();

    this.slug = cleanTitle;
  }
  next();
});

const Tour = mongoose.model("Tour", tourSchema);
export default Tour;
  