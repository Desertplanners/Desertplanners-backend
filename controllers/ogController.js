import Tour from "../models/Tour.js";
import Blog from "../models/Blog.js";
import SEO from "../models/SEO.js";

const SITE_URL = "https://www.desertplanners.net";

export const renderOG = async (req, res) => {
  try {
    const url = req.originalUrl.split("?")[0]; // remove query params
    const pageUrl = `${SITE_URL}${url}`;

    let title = "Desert Planners | Dubai Tours & Experiences";
    let description =
      "Book Dubai tours, attractions, Burj Khalifa tickets & luxury experiences with Desert Planners.";
    let image = null; // ✅ NO DEFAULT IMAGE

    /* =====================================================
       🟢 TOUR PAGES  → /tours/:categorySlug/:tourSlug
    ===================================================== */
    if (url.startsWith("/tours/")) {
      const parts = url.split("/").filter(Boolean);
      const tourSlug = parts[parts.length - 1]; // ✅ SAFE SLUG

      const tour = await Tour.findOne({ slug: tourSlug }).lean();
      if (tour) {
        const seo = await SEO.findOne({
          parentType: "tour",
          parentId: String(tour._id),
        }).lean();

        title = seo?.seoTitle || tour.title;
        description =
          seo?.seoDescription ||
          tour.shortDescription ||
          description;

        if (seo?.seoOgImage) {
          image = seo.seoOgImage; // ✅ Cloudinary full URL
        } else if (tour.mainImage) {
          image = tour.mainImage;
        }
      }
    }

    /* =====================================================
       🟢 BLOG PAGES → /blog/:slug
    ===================================================== */
    else if (url.startsWith("/blog/")) {
      const parts = url.split("/").filter(Boolean);
      const blogSlug = parts[parts.length - 1];

      const blog = await Blog.findOne({ slug: blogSlug }).lean();
      if (blog) {
        const seo = await SEO.findOne({
          parentType: "blog",
          parentId: String(blog._id),
        }).lean();

        title = seo?.seoTitle || blog.title;
        description =
          seo?.seoDescription ||
          blog.excerpt ||
          blog.metaDescription ||
          description;

        if (seo?.seoOgImage) {
          image = seo.seoOgImage;
        } else if (blog.coverImage) {
          image = blog.coverImage;
        }
      }
    }

    /* =====================================================
       🟢 HOME PAGE → /
    ===================================================== */
    else if (url === "/" || url === "") {
      const seo = await SEO.findOne({ parentType: "home" }).lean();
      if (seo) {
        title = seo.seoTitle || title;
        description = seo.seoDescription || description;
        if (seo.seoOgImage) {
          image = seo.seoOgImage;
        }
      }
    }

    /* =====================================================
       🟢 OTHER STATIC / CMS PAGES
    ===================================================== */
    else {
      const seo = await SEO.findOne({ pageUrl: url }).lean();
      if (seo) {
        title = seo.seoTitle || title;
        description = seo.seoDescription || description;
        if (seo.seoOgImage) {
          image = seo.seoOgImage;
        }
      }
    }

    /* =====================================================
       🖼 OPTIONAL: Force OG Image size (FB / WhatsApp best)
       1200 x 630
    ===================================================== */
    if (image && image.includes("/upload/")) {
      image = image.replace(
        "/upload/",
        "/upload/w_1200,h_630,c_fill/"
      );
    }

    /* =====================================================
       🧩 BUILD OG IMAGE TAGS ONLY IF IMAGE EXISTS
    ===================================================== */
    const ogImageTags = image
      ? `
<meta property="og:image" content="${image}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:image" content="${image}" />
`
      : "";

    /* =====================================================
       🚀 SEND HTML (SERVER-SIDE OG)
    ===================================================== */
    res.set("Content-Type", "text/html");
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${title}</title>

<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:url" content="${pageUrl}" />
<meta property="og:type" content="website" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />

${ogImageTags}
</head>
<body>
<div id="root"></div>
</body>
</html>`);
  } catch (err) {
    console.error("❌ OG ERROR:", err);
    res.status(500).send("Server Error");
  }
};
