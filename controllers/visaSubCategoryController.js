import VisaSubCategory from "../models/VisaSubCategoryModel.js";
import VisaCategory from "../models/visaCategoryModel.js";
import SEO from "../models/SEO.js";

// -------------------------------
// ADD SUB CATEGORY + SEO
// -------------------------------
export const addVisaSubCategory = async (req, res) => {
  try {
    const { name, visaCategory, countryCode } = req.body;

    if (!name || !visaCategory || !countryCode) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const category = await VisaCategory.findById(visaCategory);
    if (!category)
      return res.status(404).json({ message: "Visa category not found" });

    const sub = await VisaSubCategory.create({
      name,
      visaCategory,
      countryCode, // ⭐ NEW
    });

    res.status(201).json(sub);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// -------------------------------
// GET SUB CATEGORIES BY CATEGORY
// -------------------------------
export const getSubCategoriesByCategory = async (req, res) => {
  const subs = await VisaSubCategory.find({
    visaCategory: req.params.categoryId,
  }).sort({ createdAt: -1 });

  res.json(subs);
};

// -------------------------------
// UPDATE SUB CATEGORY DESCRIPTION (SEO PAGE)
// -------------------------------
export const updateSubCategoryDescription = async (req, res) => {
  const { description } = req.body;

  const sub = await VisaSubCategory.findById(req.params.id);
  if (!sub) return res.status(404).json({ message: "Not found" });

  sub.description = description || "";
  await sub.save();

  res.json({ message: "Sub category content updated" });
};

// -------------------------------
// UPDATE SUB CATEGORY NAME
// -------------------------------
export const updateVisaSubCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) return res.status(400).json({ message: "Name is required" });

    const sub = await VisaSubCategory.findById(req.params.id);
    if (!sub)
      return res.status(404).json({ message: "Sub category not found" });

    sub.name = name;
    await sub.save();

    res.json({
      message: "Sub category updated successfully",
      sub,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// -------------------------------
// DELETE SUB CATEGORY + SEO
// -------------------------------
export const deleteVisaSubCategory = async (req, res) => {
  try {
    const sub = await VisaSubCategory.findById(req.params.id);
    if (!sub)
      return res.status(404).json({ message: "Sub category not found" });

    // 🔥 delete SEO also
    await SEO.findOneAndDelete({
      parentType: "visaSubCategory",
      parentId: sub._id,
    });

    await sub.deleteOne();

    res.json({ message: "Sub category deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSubCategoriesByCategorySlug = async (req, res) => {
  try {
    const { categorySlug } = req.query;

    if (!categorySlug) {
      return res.status(400).json({ message: "Category slug required" });
    }

    const category = await VisaCategory.findOne({ slug: categorySlug });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const subCategories = await VisaSubCategory.find({
      visaCategory: category._id,
    });

    res.json(subCategories);
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllVisaSubCategories = async (req, res) => {
  try {
    const list = await VisaSubCategory.find()
      .populate("visaCategory", "name")
      .sort({ createdAt: -1 });

    res.json(list);
  } catch (err) {
    console.log("❌ Error fetching all visa sub categories:", err);
    res.status(500).json({ message: err.message });
  }
};
