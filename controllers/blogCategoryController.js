import BlogCategory from "../models/blogCategoryModel.js";
import slugify from "slugify";
import Blog from "../models/Blog.js"; // ⭐ Blog model (important)

// ---------------------------------------------
// ⭐ ADD NEW BLOG CATEGORY
// ---------------------------------------------
export const addBlogCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name)
      return res.status(400).json({ message: "Blog category name is required" });

    const existing = await BlogCategory.findOne({ name });
    if (existing)
      return res.status(400).json({ message: "Blog category already exists" });

    const category = new BlogCategory({
      name,
      slug: slugify(name, { lower: true, strict: true }),
    });

    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------------------------------------
// ⭐ GET ALL BLOG CATEGORIES
// ---------------------------------------------
export const getBlogCategories = async (req, res) => {
  try {
    const categories = await BlogCategory.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------------------------------------
// ⭐ UPDATE BLOG CATEGORY
// ---------------------------------------------
export const updateBlogCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name)
      return res.status(400).json({ message: "Category name is required" });

    const updated = await BlogCategory.findByIdAndUpdate(
      req.params.id,
      {
        name,
        slug: slugify(name, { lower: true, strict: true }),
      },
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ message: "Blog category not found" });

    res.json({
      message: "Blog category updated successfully",
      category: updated,
    });
  } catch (error) {
    console.error("❌ Error updating blog category:", error);
    res.status(500).json({ error: error.message });
  }
};

// ---------------------------------------------
// ⭐ DELETE BLOG CATEGORY
// ---------------------------------------------
export const deleteBlogCategory = async (req, res) => {
  try {
    const deleted = await BlogCategory.findByIdAndDelete(req.params.id);

    if (!deleted)
      return res.status(404).json({ message: "Blog category not found" });

    res.json({ message: "Blog category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------------------------------------
// ⭐ GET BLOGS BY CATEGORY SLUG
// ---------------------------------------------
export const getBlogsByCategory = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await BlogCategory.findOne({ slug });
    if (!category)
      return res.status(404).json({ message: "Blog category not found" });

    const blogs = await Blog.find({ category: category._id })
      .select("title slug image excerpt createdAt")
      .sort({ createdAt: -1 });

    res.json(blogs);
  } catch (error) {
    console.error("❌ Error fetching blogs by category:", error);
    res.status(500).json({ message: "Server error" });
  }
};
