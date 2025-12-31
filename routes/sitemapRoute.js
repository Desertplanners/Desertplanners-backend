import express from "express";
import Tour from "../models/Tour.js";
import Visa from "../models/Visa.js";
import HolidayTour from "../models/HolidayTour.js";
import Blog from "../models/Blog.js";
import BlogCategory from "../models/blogCategoryModel.js";

const router = express.Router();
const baseUrl = "https://www.desertplanners.net";

// ===============================
// COMMON DATE FORMATTER
// ===============================
const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toISOString();
};

// ======================================================
// 1️⃣ SITEMAP INDEX (MAIN ENTRY POINT)
// URL: /sitemap.xml
// ======================================================
router.get("/sitemap.xml", (req, res) => {
  const xml = `
  <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <sitemap>
      <loc>${baseUrl}/sitemap-main.xml</loc>
    </sitemap>
    <sitemap>
      <loc>${baseUrl}/sitemap-blog.xml</loc>
    </sitemap>
  </sitemapindex>
  `;

  res.header("Content-Type", "application/xml");
  res.send(xml.trim());
});

// ======================================================
// 2️⃣ MAIN SITEMAP (PAGES + TOURS + VISA + HOLIDAYS)
// URL: /sitemap-main.xml
// ======================================================
router.get("/sitemap-main.xml", async (req, res) => {
  try {
    // ---------- STATIC PAGES ----------
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

    // ---------- TOURS ----------
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

    // TOUR CATEGORIES
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

    // ---------- VISAS ----------
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

    // ---------- HOLIDAYS ----------
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

    // ---------- FINAL XML ----------
    const xml = `
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
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
    console.log("❌ Main Sitemap Error:", error);
    res.status(500).send("Error generating main sitemap");
  }
});

// ======================================================
// 3️⃣ BLOG SITEMAP (ONLY BLOGS)
// URL: /sitemap-blog.xml
// ======================================================
router.get("/sitemap-blog.xml", async (req, res) => {
  try {
    // ===============================
    // 1️⃣ BLOG MAIN PAGE
    // ===============================
    const blogMainPage = `
      <url>
        <loc>${baseUrl}/blog</loc>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
      </url>
    `;

    // ===============================
    // 2️⃣ BLOG CATEGORIES
    // ===============================
    const categories = await BlogCategory.find({});

    const categoryUrls = categories.map(
      (c) => `
      <url>
        <loc>${baseUrl}/blog/category/${c.slug}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
      </url>`
    );

    // ===============================
    // 3️⃣ BLOG POSTS
    // ===============================
    const blogs = await Blog.find({});

    const blogUrls = blogs.map(
      (b) => `
      <url>
        <loc>${baseUrl}/blog/${b.slug}</loc>
        <lastmod>${formatDate(b.updatedAt)}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
      </url>`
    );

    // ===============================
    // FINAL XML
    // ===============================
    const xml = `
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${blogMainPage}
      ${categoryUrls.join("")}
      ${blogUrls.join("")}
    </urlset>
    `;

    res.header("Content-Type", "application/xml");
    res.send(xml.trim());
  } catch (error) {
    console.log("❌ Blog Sitemap Error:", error);
    res.status(500).send("Error generating blog sitemap");
  }
});

// ======================================================
// 4️⃣ HTML SITEMAP (USER FRIENDLY)
// URL: /sitemap.html
// ======================================================
router.get("/sitemap.html", async (req, res) => {
  try {
    const baseUrl = "https://www.desertplanners.net";

    // =========================
    // STATIC PAGES
    // =========================
    const staticPages = [
      { name: "Home", url: `${baseUrl}/` },
      { name: "About Us", url: `${baseUrl}/about-us` },
      { name: "Contact", url: `${baseUrl}/contact-us` },
      { name: "Privacy Policy", url: `${baseUrl}/privacy-policy` },
      { name: "Terms & Conditions", url: `${baseUrl}/terms-conditions` },
      { name: "Tours", url: `${baseUrl}/tours` },
      { name: "Visa", url: `${baseUrl}/visa` },
      { name: "Holidays", url: `${baseUrl}/holidays` },
      { name: "Blog", url: `${baseUrl}/blog` }
    ];

    // =========================
    // TOURS
    // =========================
    const tours = await Tour.find({}).populate("category", "slug name").lean();

    const tourList = tours.map((t) => ({
      name: t.title,
      url: `${baseUrl}/tours/${t.category?.slug}/${t.slug}`,
    }));

    const tourCategoryList = [
      ...new Set(tours.map((t) => t.category?.slug)),
    ]
      .filter(Boolean)
      .map((c) => ({
        name: c,
        url: `${baseUrl}/tours/category/${c}`,
      }));

    // =========================
    // VISAS
    // =========================
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
        name: c,
        url: `${baseUrl}/visa/${c}`,
      }));

    // =========================
    // HOLIDAYS
    // =========================
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
        name: c,
        url: `${baseUrl}/holidays/${c}`,
      }));

    // =========================
    // BLOGS
    // =========================
    const blogs = await Blog.find({});
    const blogList = blogs.map((b) => ({
      name: b.title,
      url: `${baseUrl}/blog/${b.slug}`,
    }));

    const blogCategories = await BlogCategory.find({});
    const blogCategoryList = blogCategories.map((c) => ({
      name: c.name,
      url: `${baseUrl}/blog/category/${c.slug}`,
    }));

    // =========================
    // HTML TEMPLATE
    // =========================
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>HTML Sitemap - Desert Planners</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #f7f7f7;
      padding: 40px;
      color: #333;
    }
    .container {
      max-width: 900px;
      margin: auto;
      background: #fff;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 5px 20px rgba(0,0,0,0.08);
    }
    h1 {
      text-align: center;
      color: #b40303;
      margin-bottom: 30px;
    }
    .section {
      margin-top: 40px;
      border-left: 5px solid #b40303;
      padding-left: 15px;
    }
    .section h2 {
      color: #b40303;
      margin-bottom: 15px;
    }
    ul {
      list-style: none;
      padding-left: 0;
    }
    li {
      padding: 6px 0;
      border-bottom: 1px solid #eee;
    }
    a {
      color: #0066cc;
      text-decoration: none;
    }
    a:hover {
      color: #b40303;
      text-decoration: underline;
    }
    .footer-note {
      text-align: center;
      margin-top: 40px;
      font-size: 14px;
      color: #666;
    }
  </style>
</head>

<body>
  <div class="container">
    <h1>HTML Sitemap</h1>

    <div class="section">
      <h2>Pages</h2>
      <ul>${staticPages.map(p => `<li><a href="${p.url}" target="_blank">${p.name}</a></li>`).join("")}</ul>
    </div>

    <div class="section">
      <h2>Tours</h2>
      <ul>${tourList.map(p => `<li><a href="${p.url}" target="_blank">${p.name}</a></li>`).join("")}</ul>
    </div>

    <div class="section">
      <h2>Tour Categories</h2>
      <ul>${tourCategoryList.map(p => `<li><a href="${p.url}" target="_blank">${p.name}</a></li>`).join("")}</ul>
    </div>

    <div class="section">
      <h2>Visas</h2>
      <ul>${visaList.map(p => `<li><a href="${p.url}" target="_blank">${p.name}</a></li>`).join("")}</ul>
    </div>

    <div class="section">
      <h2>Visa Categories</h2>
      <ul>${visaCategoryList.map(p => `<li><a href="${p.url}" target="_blank">${p.name}</a></li>`).join("")}</ul>
    </div>

    <div class="section">
      <h2>Holiday Packages</h2>
      <ul>${holidayList.map(p => `<li><a href="${p.url}" target="_blank">${p.name}</a></li>`).join("")}</ul>
    </div>

    <div class="section">
      <h2>Holiday Categories</h2>
      <ul>${holidayCategoryList.map(p => `<li><a href="${p.url}" target="_blank">${p.name}</a></li>`).join("")}</ul>
    </div>

    <div class="section">
      <h2>Blog Categories</h2>
      <ul>${blogCategoryList.map(p => `<li><a href="${p.url}" target="_blank">${p.name}</a></li>`).join("")}</ul>
    </div>

    <div class="section">
      <h2>Blogs</h2>
      <ul>${blogList.map(p => `<li><a href="${p.url}" target="_blank">${p.name}</a></li>`).join("")}</ul>
    </div>

    <p class="footer-note">
      Desert Planners Tourism LLC – Sitemap Generated Automatically
    </p>
  </div>
</body>
</html>
`;

    res.header("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    console.log("❌ HTML sitemap error:", error);
    res.status(500).send("Error generating HTML sitemap");
  }
});

export default router;
