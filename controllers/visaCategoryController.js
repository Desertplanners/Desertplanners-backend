// controllers/visaCategoryController.js
import VisaCategory from "../models/visaCategoryModel.js";
import slugify from "slugify";
import Visa from "../models/Visa.js"; // ⭐ FIX — Missing import added

// ---------------------------------------------
// ⭐ ADD NEW VISA CATEGORY
// ---------------------------------------------
export const addVisaCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name)
      return res.status(400).json({ message: "Visa category name is required" });

    const existing = await VisaCategory.findOne({ name });
    if (existing)
      return res.status(400).json({ message: "Visa category already exists" });

    const category = new VisaCategory({
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
// ⭐ GET ALL VISA CATEGORIES
// ---------------------------------------------
export const getVisaCategories = async (req, res) => {
  try {
    const categories = await VisaCategory.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------------------------------------
// ⭐ DELETE VISA CATEGORY
// ---------------------------------------------
export const deleteVisaCategory = async (req, res) => {
  try {
    const deleted = await VisaCategory.findByIdAndDelete(req.params.id);

    if (!deleted)
      return res.status(404).json({ message: "Visa category not found" });

    res.json({ message: "Visa category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------------------------------------
// ⭐ UPDATE VISA CATEGORY (name + slug update)
// ---------------------------------------------
export const updateVisaCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name)
      return res.status(400).json({ message: "Category name is required" });

    const updated = await VisaCategory.findByIdAndUpdate(
      req.params.id,
      {
        name,
        slug: slugify(name, { lower: true, strict: true }),
      },
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ message: "Visa category not found" });

    res.json({
      message: "Visa category updated successfully",
      category: updated,
    });
  } catch (error) {
    console.error("❌ Error updating visa category:", error);
    res.status(500).json({ error: error.message });
  }
};

// ---------------------------------------------
// ⭐ GET VISAS OF A CATEGORY BY SLUG
// ---------------------------------------------
export const getVisasByCategory = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await VisaCategory.findOne({ slug });
    if (!category)
      return res.status(404).json({ message: "Visa category not found" });

    const visas = await Visa.find({ visaCategory: category._id }).select(
      "title slug price img"
    );

    res.json(visas);
  } catch (error) {
    console.error("❌ Error fetching visas by category:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------------------------------------
// ⭐ GET SINGLE VISA CATEGORY (for SEO / Editor)
// ---------------------------------------------
export const getVisaCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await VisaCategory.findById(id);
    if (!category)
      return res.status(404).json({ message: "Visa category not found" });

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ---------------------------------------------
// ⭐ UPDATE VISA CATEGORY DESCRIPTION (CONTENT)
// ---------------------------------------------
export const updateVisaCategoryDescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    const category = await VisaCategory.findById(id);
    if (!category)
      return res.status(404).json({ message: "Visa category not found" });

    category.description = description || "";
    await category.save();

    res.json({ message: "Visa category content updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
