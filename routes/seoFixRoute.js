import express from "express";
import Tour from "../models/Tour.js";
import SEO from "../models/SEO.js";

const router = express.Router();

// 🚀 Auto-Fix SEO for all tours
router.get("/fix-seo", async (req, res) => {
  try {
    const tours = await Tour.find();

    let created = 0;
    let skipped = 0;

    for (const tour of tours) {
      const exists = await SEO.findOne({
        parentType: "tour",
        parentId: tour._id.toString(),
      });

      if (exists) {
        skipped++;
        continue;
      }

      await SEO.create({
        parentType: "tour",
        parentId: tour._id.toString(),
        seoTitle: tour.title,
        seoDescription: tour.description?.slice(0, 160) || "",
        seoKeywords: "",
        seoOgImage: tour.mainImage || "",
        faqs: [],
        ratingAvg: 4.9,
        ratingCount: 20,
      });

      created++;
    }

    return res.json({
      success: true,
      message: "SEO fix completed!",
      created,
      skipped,
    });

  } catch (err) {
    console.error("SEO FIX ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Error fixing SEO",
      error: err.message,
    });
  }
});

export default router;
