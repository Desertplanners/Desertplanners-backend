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
      relatedTours,
    } = req.body;

    const featuredImage =
      req.files?.featuredImage?.[0]?.path || "";

    const authorImage =
      req.files?.authorImage?.[0]?.path || "";

      const blogData = {
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
      };
      
      // ✅ ONLY when published
      if (blogData.status === "published") {
        blogData.publishedAt = new Date();
      }
      
      const blog = await Blog.create(blogData);
      

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
      .sort({ publishedAt: -1, createdAt: -1 });


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
      relatedTours,
    } = req.body;

    // 🔹 STEP 1: Get existing blog
    const existingBlog = await Blog.findById(req.params.id);

    if (!existingBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // 🔹 STEP 2: Prepare update data
    const updateData = {
      title,
      content,
      category,
      status,
      seo,
      authorName,
      authorBio,
      relatedTours: Array.isArray(relatedTours)
        ? relatedTours
        : relatedTours
        ? [relatedTours]
        : [],
    };

    // 🔹 STEP 3: Update slug if title changed
    if (title && title !== existingBlog.title) {
      updateData.slug = slugify(title, {
        lower: true,
        strict: true,
      });
    }

    // 🔹 STEP 4: Draft → Published (FIRST TIME ONLY)
    if (
      status === "published" &&
      !existingBlog.publishedAt
    ) {
      updateData.publishedAt = new Date();
    }

    // 🔹 STEP 5: Featured Image update
    if (req.files?.featuredImage?.[0]?.path) {
      updateData.featuredImage =
        req.files.featuredImage[0].path;
    }

    // 🔹 STEP 6: Author Image update
    if (req.files?.authorImage?.[0]?.path) {
      updateData.authorImage =
        req.files.authorImage[0].path;
    }

    // 🔹 STEP 7: Update blog
    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

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
      .sort({ publishedAt: -1, createdAt: -1 });


    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};