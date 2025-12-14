import mongoose from "mongoose";
import slugify from "slugify";

const blogCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
  },
  { timestamps: true }
);

// ⭐ Auto-generate slug from name
blogCategorySchema.pre("save", function (next) {
  if (this.isModified("name") || !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

export default mongoose.model("BlogCategory", blogCategorySchema);
