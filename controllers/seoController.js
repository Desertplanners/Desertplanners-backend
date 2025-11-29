// controllers/seoController.js
import SEO from "../models/SEO.js";

// 🧠 Helper: Parse FAQ safely
const parseFAQ = (faqs) => {
  if (!faqs) return [];

  try {
    const parsed = JSON.parse(faqs);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// ⭐ SINGLE FUNCTION → CREATE + UPDATE (via upsert)
export const saveSEO = async (req, res) => {
  try {
    let body = req.body;

    // Ensure parentId is always a string
    if (body.parentId) {
      body.parentId = String(body.parentId);
    }

    // Parse FAQs if sent
    if (body.faqs) {
      body.faqs = parseFAQ(body.faqs);
    }

    // If new OG image uploaded, replace
    if (req.file) {
      body.seoOgImage = req.file.path;
    }

    // ⭐ Main logic — UPDATE if exists, CREATE if not (NO DUPLICATE)
    const seo = await SEO.findOneAndUpdate(
      {
        parentType: body.parentType,
        parentId: body.parentId,
      },
      { $set: body },
      {
        new: true,
        upsert: true, // 🔥 Create new if not found
      }
    );

    res.json({ success: true, seo });
  } catch (err) {
    console.log("❌ SEO Save Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ⭐ GET SEO BY PARENT
export const getSEO = async (req, res) => {
  try {
    const { parentType, parentId } = req.query;

    const seo = await SEO.findOne({
      parentType,
      parentId: String(parentId),
    });

    res.json({ success: true, seo });
  } catch (err) {
    console.log("❌ SEO Get Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ⭐ DELETE SEO
export const deleteSEO = async (req, res) => {
  try {
    const { parentType, parentId } = req.body;

    await SEO.findOneAndDelete({
      parentType,
      parentId: String(parentId),
    });

    res.json({ success: true, message: "SEO deleted successfully" });
  } catch (err) {
    console.log("❌ SEO Delete Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
