// models/holidayCategoryModel.js
import mongoose from "mongoose";
import slugify from "slugify";

const holidayCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, trim: true, lowercase: true },
  },
  { timestamps: true }
);

// Auto-generate slug whenever name changes
holidayCategorySchema.pre("save", function (next) {
  if (this.isModified("name") || !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

export default mongoose.model("HolidayCategory", holidayCategorySchema);
