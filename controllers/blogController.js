import Blog from "../models/Blog.js";
import slugify from "slugify";
import BlogCategory from "../models/blogCategoryModel.js";

/* ================================
   ➕ CREATE BLOG (Admin)
================================ */
export const createBlog = async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      status,
      seo,
      authorName,
      authorBio,
      authorImage,
      relatedTours,
    } = req.body;

    const featuredImage =
      req.files?.featuredImage?.[0]?.path || "";

    const blog = await Blog.create({
      title,
      content,
      category,
      status: status || "draft",
      seo,
      authorName: authorName || req.user.name,
      authorBio,
      authorImage,
      relatedTours: Array.isArray(relatedTours)
        ? relatedTours
        : relatedTours
        ? [relatedTours]
        : [],
      featuredImage,

      author: req.user._id,
    });

    res.status(201).json(blog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/* ================================
   📄 GET ALL BLOGS (Admin)
================================ */
export const getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate("category", "name slug")
      .sort({ createdAt: -1 });

    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================================
   📦 GET BLOG BY SLUG (Frontend)
================================ */
export const getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOneAndUpdate(
      { slug: req.params.slug, status: "published" },
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate("category", "name slug")
      .populate({
        path: "relatedTours",
        select: "title slug mainImage priceAdult discountPriceAdult",
      });

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ================================
   📝 UPDATE BLOG (Admin)
================================ */
export const updateBlog = async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      status,
      seo,
      authorName,
      authorBio,
      authorImage,
      relatedTours,
    } = req.body;

    const updateData = {
      title,
      content,
      category,
      status,
      seo,
      authorName,
      authorBio,
      authorImage,
      relatedTours: Array.isArray(relatedTours)
        ? relatedTours
        : relatedTours
        ? [relatedTours]
        : [],
    };

    // 🔥 Update slug if title changed
    if (title) {
      updateData.slug = slugify(title, {
        lower: true,
        strict: true,
      });
    }

    // 🟡 If new image uploaded
    if (req.files?.featuredImage?.[0]?.path) {
      updateData.featuredImage =
        req.files.featuredImage[0].path;
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.json(updatedBlog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/* ================================
   ❌ DELETE BLOG (Admin)
================================ */
export const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ================================
   📂 GET BLOGS BY CATEGORY (🔥 FIX)
================================ */
export const getBlogsByCategory = async (req, res) => {
  try {
    const { slug } = req.params;

    // 🔹 Step 1: Find category by slug
    const category = await BlogCategory.findOne({ slug });

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    // 🔹 Step 2: Find blogs using category _id
    const blogs = await Blog.find({
      status: "published",
      category: category._id,
    })
      .populate("category", "name slug")
      .sort({ createdAt: -1 });

    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};