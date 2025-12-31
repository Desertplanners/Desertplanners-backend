import BlogCategory from "../models/blogCategoryModel.js";
import slugify from "slugify";
import Blog from "../models/Blog.js";
import SEO from "../models/SEO.js"; // ⭐ IMPORTANT

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
// ⭐ GET SINGLE BLOG CATEGORY BY SLUG (🔥 REQUIRED FOR SEO)
// ---------------------------------------------
export const getBlogCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await BlogCategory.findOne({ slug });
    if (!category)
      return res.status(404).json({ message: "Blog category not found" });

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------------------------------------
// ⭐ UPDATE BLOG CATEGORY + SEO SYNC (🔥 IMPORTANT)
// ---------------------------------------------
export const updateBlogCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const { id } = req.params;

    if (!name)
      return res.status(400).json({ message: "Category name is required" });

    const category = await BlogCategory.findById(id);
    if (!category)
      return res.status(404).json({ message: "Blog category not found" });

    const oldSlug = category.slug;
    const newSlug = slugify(name, { lower: true, strict: true });

    category.name = name;
    category.slug = newSlug;
    await category.save();

    // ⭐ SEO SYNC (slug based SEO purana ho to)
    await SEO.findOneAndUpdate(
      {
        parentType: "blogCategory",
        parentId: oldSlug,
      },
      {
        parentId: category._id.toString(),
      }
    );

    res.json({
      message: "Blog category updated successfully",
      category,
    });
  } catch (error) {
    console.error("❌ Error updating blog category:", error);
    res.status(500).json({ error: error.message });
  }
};

// ---------------------------------------------
// ⭐ DELETE BLOG CATEGORY + SEO CLEANUP
// ---------------------------------------------
export const deleteBlogCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await BlogCategory.findById(id);
    if (!category)
      return res.status(404).json({ message: "Blog category not found" });

    await BlogCategory.findByIdAndDelete(id);

    // ⭐ DELETE RELATED SEO
    await SEO.findOneAndDelete({
      parentType: "blogCategory",
      parentId: category._id.toString(),
    });

    res.json({ message: "Blog category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------------------------------------
// ⭐ GET BLOGS BY CATEGORY SLUG (NO CHANGE)
// ---------------------------------------------
export const getBlogsByCategory = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await BlogCategory.findOne({ slug });
    if (!category)
      return res.status(404).json({ message: "Blog category not found" });

    const blogs = await Blog.find({ category: category._id })
      .select("title slug featuredImage excerpt createdAt category authorName")
      .sort({ createdAt: -1 });

    res.json(blogs);
  } catch (error) {
    console.error("❌ Error fetching blogs by category:", error);
    res.status(500).json({ message: "Server error" });
  }
};
