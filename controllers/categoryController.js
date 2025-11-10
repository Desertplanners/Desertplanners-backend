import Category from "../models/categoryModel.js";
import slugify from "slugify";

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

// 🔵 Edit (Update) category — with slug regeneration
export const editCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name)
      return res.status(400).json({ message: "Category name is required" });

    const category = await Category.findById(id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    category.name = name;
    category.slug = slugify(name, { lower: true, strict: true });
    await category.save();

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🟠 Delete category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted)
      return res.status(404).json({ message: "Category not found" });

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
