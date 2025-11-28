import express from "express";
import Tour from "../models/Tour.js";
import Visa from "../models/Visa.js";
import HolidayTour from "../models/HolidayTour.js";

const router = express.Router();

router.get("/sitemap.xml", async (req, res) => {
  try {
    const baseUrl = "https://www.desertplanners.net";

    const formatDate = (date) => {
      if (!date) return "";
      return new Date(date).toISOString();
    };

    // ===== STATIC PAGES =====
    const staticPages = [
      "",
      "about-us",
      "contact-us",
      "faqs",
      "privacy-policy",
      "terms-conditions",
      "tours",
      "visa",
      "holidays",
    ];

    const staticUrls = staticPages.map(
      (p) => `
      <url>
        <loc>${baseUrl}/${p}</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
      </url>`
    );

    // ===== TOURS =====
    const tours = await Tour.find({}).populate("category", "slug");

    const tourUrls = tours.map(
      (t) => `
  <url>
    <loc>${baseUrl}/tours/${t.category?.slug}/${t.slug}</loc>
    <lastmod>${formatDate(t.updatedAt)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`
    );

    // TOUR CATEGORY URLs
    const tourCategories = [
      ...new Set(tours.map((t) => t.category?.slug)),
    ].filter(Boolean);

    const tourCategoryUrls = tourCategories.map(
      (cat) => `
  <url>
    <loc>${baseUrl}/tours/category/${cat}</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`
    );

    // ===== VISAS =====
    const visas = await Visa.find({}).populate("visaCategory", "slug");
    const visaUrls = visas.map(
      (v) => `
      <url>
        <loc>${baseUrl}/visa/${v.visaCategory?.slug}/${v.slug}</loc>
        <lastmod>${formatDate(v.updatedAt)}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
      </url>`
    );

    // VISA CATEGORIES
    const visaCategories = [
      ...new Set(visas.map((v) => v.visaCategory?.slug)),
    ].filter(Boolean);
    const visaCategoryUrls = visaCategories.map(
      (cat) => `
      <url>
        <loc>${baseUrl}/visa/${cat}</loc>
        <changefreq>daily</changefreq>
        <priority>0.7</priority>
      </url>`
    );

    // ===== HOLIDAY PACKAGES =====
    const holidays = await HolidayTour.find({}).populate("category", "slug");
    const holidayUrls = holidays.map(
      (h) => `
      <url>
        <loc>${baseUrl}/holidays/${h.category?.slug}/${h.slug}</loc>
        <lastmod>${formatDate(h.updatedAt)}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
      </url>`
    );

    // HOLIDAY CATEGORIES
    const holidayCategories = [
      ...new Set(holidays.map((h) => h.category?.slug)),
    ].filter(Boolean);
    const holidayCategoryUrls = holidayCategories.map(
      (cat) => `
      <url>
        <loc>${baseUrl}/holidays/${cat}</loc>
        <changefreq>daily</changefreq>
        <priority>0.7</priority>
      </url>`
    );

    // === FINAL XML ===
    const xml = `
      <urlset 
        xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
      >
        ${staticUrls.join("")}
        ${tourUrls.join("")}
        ${tourCategoryUrls.join("")}
        ${visaUrls.join("")}
        ${visaCategoryUrls.join("")}
        ${holidayUrls.join("")}
        ${holidayCategoryUrls.join("")}
      </urlset>
    `;

    res.header("Content-Type", "application/xml");
    res.send(xml.trim());
  } catch (error) {
    console.log("❌ Sitemap Error:", error);
    res.status(500).send("Error generating sitemap");
  }
});

router.get("/sitemap.html", async (req, res) => {
  try {
    const baseUrl = "https://www.desertplanners.net";

    // STATIC PAGES
    const staticPages = [
      { name: "Home", url: `${baseUrl}/` },
      { name: "About Us", url: `${baseUrl}/about-us` },
      { name: "Contact", url: `${baseUrl}/contact-us` },
      { name: "Privacy Policy", url: `${baseUrl}/privacy-policy` },
      { name: "Terms & Conditions", url: `${baseUrl}/terms-conditions` },
      { name: "Tours", url: `${baseUrl}/tours` },
      { name: "Visa", url: `${baseUrl}/visa` },
      { name: "Holidays", url: `${baseUrl}/holidays` },
    ];

    // TOURS
    const tours = await Tour.find({});
    const tourList = tours.map((t) => ({
      name: t.title,
      url: `${baseUrl}/tours/${t.slug}`,
    }));

    const tourCategoryList = [...new Set(tours.map((t) => t.category?.slug))]
      .filter(Boolean)
      .map((c) => ({
        name: `Tour Category: ${c}`,
        url: `${baseUrl}/tours/category/${c}`,
      }));

    // VISAS
    const visas = await Visa.find({}).populate("visaCategory", "slug");

    const visaList = visas.map((v) => ({
      name: v.title,
      url: `${baseUrl}/visa/${v.visaCategory?.slug}/${v.slug}`,
    }));

    const visaCategoryList = [
      ...new Set(visas.map((v) => v.visaCategory?.slug)),
    ]
      .filter(Boolean)
      .map((c) => ({
        name: `Visa Category: ${c}`,
        url: `${baseUrl}/visa/${c}`,
      }));

    // HOLIDAYS
    const holidays = await HolidayTour.find({}).populate("category", "slug");

    const holidayList = holidays.map((h) => ({
      name: h.title,
      url: `${baseUrl}/holidays/${h.category?.slug}/${h.slug}`,
    }));

    const holidayCategoryList = [
      ...new Set(holidays.map((h) => h.category?.slug)),
    ]
      .filter(Boolean)
      .map((c) => ({
        name: `Holiday Category: ${c}`,
        url: `${baseUrl}/holidays/${c}`,
      }));

    // HTML TEMPLATE
    let html = `
        <html>
        <head>
          <title>HTML Sitemap - Desert Planners</title>
          <style>
            body { font-family: Arial; padding: 20px; line-height: 1.7; }
            h2 { color: #b40303; margin-top: 30px; }
            a { color: #0077cc; text-decoration: none; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <h1>HTML Sitemap</h1>
  
          <h2>Static Pages</h2>
          <ul>
            ${staticPages
              .map((p) => `<li><a href="${p.url}">${p.name}</a></li>`)
              .join("")}
          </ul>
  
          <h2>Tours</h2>
          <ul>
            ${tourList
              .map((p) => `<li><a href="${p.url}">${p.name}</a></li>`)
              .join("")}
          </ul>
  
          <h2>Tour Categories</h2>
          <ul>
            ${tourCategoryList
              .map((p) => `<li><a href="${p.url}">${p.name}</a></li>`)
              .join("")}
          </ul>
  
          <h2>Visas</h2>
          <ul>
            ${visaList
              .map((p) => `<li><a href="${p.url}">${p.name}</a></li>`)
              .join("")}
          </ul>
  
          <h2>Visa Categories</h2>
          <ul>
            ${visaCategoryList
              .map((p) => `<li><a href="${p.url}">${p.name}</a></li>`)
              .join("")}
          </ul>
  
          <h2>Holiday Packages</h2>
          <ul>
            ${holidayList
              .map((p) => `<li><a href="${p.url}">${p.name}</a></li>`)
              .join("")}
          </ul>
  
          <h2>Holiday Categories</h2>
          <ul>
            ${holidayCategoryList
              .map((p) => `<li><a href="${p.url}">${p.name}</a></li>`)
              .join("")}
          </ul>
  
        </body>
        </html>
      `;

    res.header("Content-Type", "text/html");
    res.send(html);
  } catch (err) {
    console.log("HTML sitemap error:", err);
    res.status(500).send("Error generating HTML sitemap");
  }
});

export default router;
