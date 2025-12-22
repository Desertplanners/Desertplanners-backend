// controllers/holidayCategoryController.js
import HolidayCategory from "../models/holidayCategoryModel.js";
import HolidayTour from "../models/HolidayTour.js";
import slugify from "slugify";
import SEO from "../models/SEO.js";

// 🟢 Add new Holiday Category
export const addHolidayCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name)
      return res.status(400).json({ message: "Category name is required" });

    const exists = await HolidayCategory.findOne({ name });
    if (exists)
      return res.status(400).json({ message: "Category already exists" });

    const category = new HolidayCategory({ name });
    await category.save();

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🟢 Get All Categories
export const getHolidayCategories = async (req, res) => {
  try {
    const categories = await HolidayCategory.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🟠 Delete Category + delete related SEO
export const deleteHolidayCategory = async (req, res) => {
  try {
    const deleted = await HolidayCategory.findByIdAndDelete(req.params.id);

    if (!deleted)
      return res.status(404).json({ message: "Category not found" });

    await SEO.findOneAndDelete({
      parentType: "holidayCategory",
      parentId: deleted.slug,
    });

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🟢 Update Category + Update Slug + Update SEO parentId
export const updateHolidayCategory = async (req, res) => {
  try {
    const { name } = req.body;

    const category = await HolidayCategory.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    const oldSlug = category.slug;
    const newSlug = slugify(name, { lower: true, strict: true });

    category.name = name;
    category.slug = newSlug;
    await category.save();

    await SEO.findOneAndUpdate(
      { parentType: "holidayCategory", parentId: oldSlug },
      { parentId: newSlug }
    );

    res.json({
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🟢 Get Holiday Packages by Category Slug
export const getHolidayPackagesByCategory = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await HolidayCategory.findOne({ slug });
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    const packages = await HolidayTour.find({
      category: category._id,
    }).select("title slug priceAdult sliderImages");

    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🟣 Get single holiday category by slug (FRONTEND)
export const getHolidayCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await HolidayCategory.findOne({ slug });
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 🟣 Get single holiday category (for SEO / Content Editor)
export const getHolidayCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await HolidayCategory.findById(id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 🟣 Update holiday category description (HTML content)
export const updateHolidayCategoryDescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    const category = await HolidayCategory.findById(id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    category.description = description || "";
    await category.save();

    res.json({ message: "Holiday category content updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
