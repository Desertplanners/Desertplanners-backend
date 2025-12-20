import mongoose from "mongoose";
import slugify from "slugify";

const blogSchema = new mongoose.Schema(
  {
    // 📝 Blog Title
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // 🔗 SEO Friendly URL
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },

    // ✍️ HTML content from editor
    content: {
      type: String,
      required: true,
    },

    // 🗂️ Blog Category
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BlogCategory",
      required: true,
    },

    // 👤 Author (auto from logged-in user)
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    authorName: {
      type: String,
      required: true,
    },

    // 🖼️ Featured Image (optional)
    featuredImage: {
      type: String,
      default: "",
    },

    // 👀 Views Counter
    views: {
      type: Number,
      default: 0,
    },

    // 🟢 Draft / Publish
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
    },

    // 🔍 SEO Fields
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: String,
    },
  },
  { timestamps: true }
);

// 🔥 Auto-generate slug
blogSchema.pre("save", function (next) {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title, {
      lower: true,
      strict: true,
    });
  }
  next();
});

export default mongoose.model("Blog", blogSchema);
