import Category from "../models/categoryModel.js";
import slugify from "slugify";
import SEO from "../models/SEO.js";

// 🟢 Add new category
export const addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name)
      return res.status(400).json({ message: "Category name is required" });

    const existing = await Category.findOne({ name });
    if (existing)
      return res.status(400).json({ message: "Category already exists" });

    const category = new Category({
      name,
      slug: slugify(name, { lower: true, strict: true }),
    });

    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🟢 Get all categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔵 Edit category + SEO UPDATE (IMPORTANT)
export const editCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name)
      return res.status(400).json({ message: "Category name is required" });

    const category = await Category.findById(id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    // OLD slug
    const oldSlug = category.slug;

    // NEW slug
    const newSlug = slugify(name, { lower: true, strict: true });

    // Update category
    category.name = name;
    category.slug = newSlug;
    await category.save();

    // ⭐ UPDATE SEO parentId (if exists)
    await SEO.findOneAndUpdate(
      { parentType: "tourCategory", parentId: oldSlug },
      { parentId: newSlug }
    );

    res.json({ message: "Category updated", category });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🟠 Delete category + delete SEO for category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    const slug = category.slug;

    await Category.findByIdAndDelete(id);

    // ⭐ DELETE SEO RELATED TO CATEGORY
    await SEO.findOneAndDelete({
      parentType: "tourCategory",
      parentId: slug,
    });

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
