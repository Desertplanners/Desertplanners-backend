import mongoose from "mongoose";
import slugify from "slugify";

const holidayTourSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true }, // ⭐ MUST HAVE

    duration: { type: String, required: true },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HolidayCategory",
      required: true,
    },

    priceAdult: { type: mongoose.Schema.Types.Mixed, required: true },
    priceChild: { type: mongoose.Schema.Types.Mixed },

    description: { type: String, required: true },

    sliderImages: [
      {
        type: String,
        required: true,
      },
    ],

    highlights: {
      nights: { type: String },
      persons: { type: String },
      room: { type: String },
      mealPlan: { type: String },
    },

    itinerary: [
      {
        day: Number,
        title: String,
        image: String,
      },
    ],

    knowBefore: [{ type: String }],
    inclusions: [{ type: String }],
    exclusions: [{ type: String }],
    cancellationPolicy: [{ type: String }],
    terms: [{ type: String }],

    metaTitle: { type: String },
    metaDescription: { type: String },
  },
  { timestamps: true }
);

// ⭐ AUTO-SLUG GENERATION
holidayTourSchema.pre("save", function (next) {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

export default mongoose.model("HolidayTour", holidayTourSchema);
