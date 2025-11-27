import express from "express";
import Tour from "../models/Tour.js";
import Visa from "../models/Visa.js";
import HolidayTour from "../models/HolidayTour.js";

const router = express.Router();

router.get("/sitemap.xml", async (req, res) => {
  try {
    const baseUrl = "https://www.desertplanners.net";

    // ===== STATIC PAGES =====
    const staticUrls = [
      "",
      "about",
      "contact",
      "faqs",
      "privacy-policy",
      "terms-conditions",
      "tours",
      "visa",
      "holidays",
    ].map((page) => `<url><loc>${baseUrl}/${page}</loc></url>`);

    // ===== DYNAMIC TOUR PAGES =====
    const tours = await Tour.find({}, "slug category")
      .populate("category", "slug");

    const tourUrls = tours.map(
      (t) => `<url><loc>${baseUrl}/tours/${t.slug}</loc></url>`
    );

    const tourCategoryUrls = [
      ...new Set(tours.map((t) => t.category?.slug)),
    ]
      .filter(Boolean)
      .map(
        (cat) => `<url><loc>${baseUrl}/tours/category/${cat}</loc></url>`
      );

    // ===== DYNAMIC VISA PAGES =====
    const visas = await Visa.find({}, "slug categorySlug");
    
    const visaUrls = visas.map(
      (v) => `<url><loc>${baseUrl}/visa/${v.categorySlug}/${v.slug}</loc></url>`
    );

    const visaCategoryUrls = [
      ...new Set(visas.map((v) => v.categorySlug)),
    ]
      .filter(Boolean)
      .map(
        (cat) => `<url><loc>${baseUrl}/visa/${cat}</loc></url>`
      );

    // ===== HOLIDAY PACKAGES PAGES =====
    const holidays = await HolidayTour.find({}, "slug category")
      .populate("category", "slug");

    const holidayUrls = holidays.map(
      (h) =>
        `<url><loc>${baseUrl}/holidays/${h.category?.slug}/${h.slug}</loc></url>`
    );

    const holidayCategoryUrls = [
      ...new Set(holidays.map((h) => h.category?.slug)),
    ]
      .filter(Boolean)
      .map(
        (cat) => `<url><loc>${baseUrl}/holidays/${cat}</loc></url>`
      );

    // ==== FINAL MERGE ====
    const finalUrls = [
      ...staticUrls,
      ...tourUrls,
      ...tourCategoryUrls,
      ...visaUrls,
      ...visaCategoryUrls,
      ...holidayUrls,
      ...holidayCategoryUrls,
    ].join("");

    const xml = `
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${finalUrls}
      </urlset>
    `;

    res.header("Content-Type", "application/xml");
    return res.send(xml.trim());
  } catch (err) {
    console.error("❌ Sitemap Error:", err);
    res.status(500).send("Error generating sitemap");
  }
});

export default router;
