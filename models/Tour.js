import mongoose from "mongoose";
import slugify from "slugify";

const tourSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    mainImage: {
      type: String,
      required: true,
    },
    galleryImages: [
      {
        type: String,
      },
    ],

    // ✅ highlights as an array (list)
    highlights: [
      {
        type: String,
      },
    ],

    // ✅ new fields replacing needToKnow
    inclusions: [
      {
        type: String,
      },
    ],
    exclusions: [
      {
        type: String,
      },
    ],

    timings: {
      type: String,
    },

    // 🔄 UPDATED - Structured Cancellation Policy
    // cancellationPolicy ko array of objects banao
    cancellationPolicy: [
      {
        title: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
      },
    ],

    location: {
      type: String,
    },

    // 🔵 Available dates ki jagah startDate aur endDate
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    maxGuests: { type: Number, default: 12 },

    // ✅ Terms and Conditions
    termsAndConditions: {
      type: String,
      default: "",
    },

    // ✅ Related tours (reference same model)
    relatedTours: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tour",
      },
    ],
  },
  { timestamps: true }
);

// 🟢 Automatically create slug before saving
tourSchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug = slugify(this.title, { lower: true });
  }
  next();
});

const Tour = mongoose.model("Tour", tourSchema);
export default Tour;
