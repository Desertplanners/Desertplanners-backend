import SEO from "../models/SEO.js";

export const createSEO = async (req, res) => {
  try {
    const seo = await SEO.create(req.body);
    res.json({ success: true, seo });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateSEO = async (req, res) => {
  try {
    const seo = await SEO.findOneAndUpdate(
      { parentType: req.body.parentType, parentId: req.body.parentId },
      req.body,
      { new: true, upsert: true }
    );
    res.json({ success: true, seo });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getSEO = async (req, res) => {
  try {
    const { parentType, parentId } = req.query;
    const seo = await SEO.findOne({ parentType, parentId });
    res.json({ success: true, seo });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteSEO = async (req, res) => {
  try {
    const { parentType, parentId } = req.body;
    await SEO.findOneAndDelete({ parentType, parentId });
    res.json({ success: true, message: "SEO deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
