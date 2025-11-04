import Section from "../models/Section.js";
import SectionItem from "../models/SectionItem.js";

/* ---------------------------------------------
   🟦 SECTION CONTROLLERS
--------------------------------------------- */

// ➕ Create Section
export const createSection = async (req, res) => {
  try {
    const section = new Section(req.body);
    await section.save();
    res.status(201).json(section);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 📦 Get All Sections
export const getAllSections = async (req, res) => {
  try {
    const sections = await Section.find().sort({ createdAt: -1 });
    res.json(sections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔍 Get Single Section by ID
export const getSectionById = async (req, res) => {
  try {
    const section = await Section.findById(req.params.id);
    if (!section) return res.status(404).json({ message: "Section not found" });
    res.json(section);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✏️ Update Section
export const updateSection = async (req, res) => {
  try {
    const section = await Section.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!section) return res.status(404).json({ message: "Section not found" });
    res.json(section);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ❌ Delete Section (with all items)
export const deleteSection = async (req, res) => {
  try {
    const section = await Section.findById(req.params.id);
    if (!section) return res.status(404).json({ message: "Section not found" });

    // delete all items related to this section
    await SectionItem.deleteMany({ sectionId: section._id });
    await Section.findByIdAndDelete(req.params.id);

    res.json({ message: "Section and its items deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 👁 Toggle Visibility (show/hide)
export const toggleSectionVisibility = async (req, res) => {
  try {
    const section = await Section.findById(req.params.id);
    if (!section) return res.status(404).json({ message: "Section not found" });

    section.visible = !section.visible;
    await section.save();
    res.json(section);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/* ---------------------------------------------
   🟩 SECTION ITEM CONTROLLERS
--------------------------------------------- */

// ➕ Create new item
export const createSectionItem = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const item = new SectionItem({ ...req.body, sectionId });
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 📦 Get items by sectionId
export const getItemsBySection = async (req, res) => {
  try {
    const items = await SectionItem.find({ sectionId: req.params.sectionId });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✏️ Update item
export const updateSectionItem = async (req, res) => {
  try {
    const item = await SectionItem.findByIdAndUpdate(req.params.itemId, req.body, {
      new: true,
    });
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ❌ Delete item
export const deleteSectionItem = async (req, res) => {
  try {
    const item = await SectionItem.findByIdAndDelete(req.params.itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
