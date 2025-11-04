import express from "express";
import {
  // Section CRUD
  createSection,
  getAllSections,
  getSectionById,
  updateSection,
  deleteSection,
  toggleSectionVisibility,

  // Section Items CRUD
  createSectionItem,
  getItemsBySection,
  updateSectionItem,
  deleteSectionItem,
} from "../controllers/sectionController.js";

const router = express.Router();

/* ----------------------------------
   🟦 SECTION ROUTES
---------------------------------- */

// ➕ Create new section
router.post("/", createSection);

// 📦 Get all sections
router.get("/", getAllSections);

// 🔍 Get single section by ID
router.get("/:id", getSectionById);

// ✏️ Update section
router.put("/:id", updateSection);

// ❌ Delete section
router.delete("/:id", deleteSection);

// 👁 Toggle visibility (show/hide section)
router.patch("/:id/visibility", toggleSectionVisibility);

/* ----------------------------------
   🟩 SECTION ITEM ROUTES
---------------------------------- */

// ➕ Add new item in section
router.post("/:sectionId/items", createSectionItem);

// 📦 Get all items under a section
router.get("/:sectionId/items", getItemsBySection);

// ✏️ Update item
router.put("/items/:itemId", updateSectionItem);

// ❌ Delete item
router.delete("/items/:itemId", deleteSectionItem);

export default router;
