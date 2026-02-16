import mongoose from "mongoose";
import slugify from "slugify";

const visaSubCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      lowercase: true,
    },

    description: {
      type: String,
      default: "",
    },

    // 🌍 COUNTRY CODE (IN, US, AE etc.)
    countryCode: {
      type: String,
      uppercase: true,
      trim: true,
      required: true,
    },
    // 🔗 Parent Visa Category
    visaCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VisaCategory",
      required: true,
    },
  },
  { timestamps: true }
);

// auto slug
visaSubCategorySchema.pre("save", function (next) {
  if (this.isModified("name") || !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

visaSubCategorySchema.index({ visaCategory: 1, slug: 1 }, { unique: true });

export default mongoose.models.VisaSubCategory ||
  mongoose.model("VisaSubCategory", visaSubCategorySchema);
