import mongoose from "mongoose";

const seoSchema = new mongoose.Schema(
  {
    parentType: {
      type: String,
      required: true,
      enum: [
        "tour",
        "visa",
        "holiday",
        "tourCategory",
        "visaCategory",
        "holidayCategory",
        "page", // static pages
      ],
    },

    // Always store as string (ObjectId or slug)
    parentId: {
      type: String,
      required: true,
    },

    seoTitle: String,
    seoDescription: String,
    seoKeywords: String,
    seoOgImage: String,

    faqs: [
      {
        question: String,
        answer: String,
      },
    ],

    ratingAvg: { type: Number, default: 4.9 },
    ratingCount: { type: Number, default: 20 },
  },
  { timestamps: true }
);

const SEO = mongoose.model("SEO", seoSchema);
export default SEO;
