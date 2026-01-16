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

    // ✍️ HTML content
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

    // 👤 AUTHOR DETAILS (MANUAL FROM ADMIN)
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    authorName: {
      type: String,
      required: true,
    },

    authorBio: {
      type: String,
      default: "",
    },

    authorImage: {
      type: String,
      default: "",
    },

    // 🖼️ Featured Image
    featuredImage: {
      type: String,
      default: "",
    },

    // 🎯 SELECTED TOURS (MANUAL SELECTION)
    relatedTours: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tour",
      },
    ],

    // 👀 Views
    views: {
      type: Number,
      default: 0,
    },

    // 🟢 Status
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
    },

    // 📅 Publish Date
    publishedAt: {
      type: Date,
      default: null,
    },

    // 🔍 SEO
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: String,
    },
  },
  { timestamps: true }
);

// 🔥 Auto Slug
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
