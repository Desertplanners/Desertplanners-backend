import SEO from "../models/SEO.js";

// ⭐ CREATE SEO
export const createSEO = async (req, res) => {
  try {
    const body = req.body;

    // FAQ ko JSON parse karna (FormData me string aata hai)
    if (body.faqs) {
      try {
        body.faqs = JSON.parse(body.faqs);
      } catch (err) {
        body.faqs = [];
      }
    }

    // ⭐ OG Image Cloudinary se aayi hai
    if (req.file) {
      body.seoOgImage = req.file.path; // Cloudinary URL
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

    // FAQ parse
    if (body.faqs) {
      try {
        body.faqs = JSON.parse(body.faqs);
      } catch (err) {
        body.faqs = [];
      }
    }

    // ⭐ New OG Image upload hua ho to replace karo
    if (req.file) {
      body.seoOgImage = req.file.path; // Cloudinary URL
    }

    const seo = await SEO.findOneAndUpdate(
      { parentType: body.parentType, parentId: body.parentId },
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

    const seo = await SEO.findOne({ parentType, parentId });

    res.json({ success: true, seo });
  } catch (err) {
    console.log("❌ SEO Get Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};



// ⭐ DELETE SEO ENTRY
export const deleteSEO = async (req, res) => {
  try {
    const { parentType, parentId } = req.body;

    await SEO.findOneAndDelete({ parentType, parentId });

    res.json({ success: true, message: "SEO deleted successfully" });
  } catch (err) {
    console.log("❌ SEO Delete Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
