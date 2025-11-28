import SEO from "../models/SEO.js";

// ⭐ CREATE SEO
export const createSEO = async (req, res) => {
  try {
    const body = req.body;

    // Always convert parentId to string
    if (body.parentId) {
      body.parentId = String(body.parentId);
    }

    // Parse FAQ
    if (body.faqs) {
      try {
        body.faqs = JSON.parse(body.faqs);
      } catch {
        body.faqs = [];
      }
    }

    // OG Image
    if (req.file) {
      body.seoOgImage = req.file.path;
    }

    const seo = await SEO.create(body);

    res.json({ success: true, seo });
  } catch (err) {
    console.log("❌ SEO Create Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ⭐ UPDATE SEO
export const updateSEO = async (req, res) => {
  try {
    const body = req.body;

    // Ensure parentId is always string
    if (body.parentId) {
      body.parentId = String(body.parentId);
    }

    // Parse FAQs
    if (body.faqs) {
      try {
        body.faqs = JSON.parse(body.faqs);
      } catch {
        body.faqs = [];
      }
    }

    // OG Image replace
    if (req.file) {
      body.seoOgImage = req.file.path;
    }

    const seo = await SEO.findOneAndUpdate(
      {
        parentType: body.parentType,
        parentId: body.parentId,
      },
      body,
      { new: true, upsert: true }
    );

    res.json({ success: true, seo });
  } catch (err) {
    console.log("❌ SEO Update Error:", err);
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
