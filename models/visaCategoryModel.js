// models/visaCategoryModel.js
import mongoose from "mongoose";
import slugify from "slugify";

const visaCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
  },
  { timestamps: true }
);

// Auto-generate slug from name
visaCategorySchema.pre("save", function (next) {
  if (this.isModified("name") || !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

export default mongoose.model("VisaCategory", visaCategorySchema);
