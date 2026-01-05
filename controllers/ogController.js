import Tour from "../models/Tour.js";
import Blog from "../models/Blog.js";
import SEO from "../models/SEO.js";

const SITE_URL = "https://www.desertplanners.net";
const DEFAULT_IMAGE = `${SITE_URL}/default-og.jpg`;

export const renderOG = async (req, res) => {
  try {
    const url = req.originalUrl;

    let title = "Desert Planners | Dubai Tours & Experiences";
    let description =
      "Book Dubai tours, attractions, Burj Khalifa tickets & luxury experiences with Desert Planners.";
    let image = DEFAULT_IMAGE;
    let pageUrl = `${SITE_URL}${url}`;

    /* ================= TOUR ================= */
    if (url.startsWith("/tours/")) {
      const slug = url.split("/").pop();

      const tour = await Tour.findOne({ slug }).populate("category");
      if (tour) {
        const seo = await SEO.findOne({
          parentType: "tour",
          parentId: String(tour._id),
        });

        title = seo?.seoTitle || tour.title;
        description =
          seo?.seoDescription || tour.shortDescription || description;

        image = seo?.seoOgImage
          ? seo.seoOgImage.startsWith("http")
            ? seo.seoOgImage
            : `${SITE_URL}/${seo.seoOgImage}`
          : tour.mainImage?.startsWith("http")
          ? tour.mainImage
          : `${SITE_URL}/${tour.mainImage}`;
      }
    }

    /* ================= BLOG ================= */
    else if (url.startsWith("/blog/")) {
      const slug = url.split("/").pop();

      const blog = await Blog.findOne({ slug });
      if (blog) {
        const seo = await SEO.findOne({
          parentType: "blog",
          parentId: String(blog._id),
        });

        title = seo?.seoTitle || blog.title;
        description =
          seo?.seoDescription ||
          blog.excerpt ||
          blog.metaDescription ||
          description;

        image = seo?.seoOgImage
          ? `${SITE_URL}/${seo.seoOgImage}`
          : blog.coverImage
          ? `${SITE_URL}/${blog.coverImage}`
          : DEFAULT_IMAGE;
      }
    }

    /* ================= HOME ================= */
    else if (url === "/" || url === "") {
      const seo = await SEO.findOne({ parentType: "home" });
      if (seo) {
        title = seo.seoTitle || title;
        description = seo.seoDescription || description;
        image = seo.seoOgImage
          ? `${SITE_URL}/${seo.seoOgImage}`
          : image;
      }
    }

    /* ================= CATEGORY / OTHER ================= */
    else {
      const seo = await SEO.findOne({ pageUrl: url });
      if (seo) {
        title = seo.seoTitle || title;
        description = seo.seoDescription || description;
        image = seo.seoOgImage
          ? `${SITE_URL}/${seo.seoOgImage}`
          : image;
      }
    }

    /* ================= SEND HTML ================= */
    res.set("Content-Type", "text/html");
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${title}</title>

<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:image" content="${image}" />
<meta property="og:url" content="${pageUrl}" />
<meta property="og:type" content="website" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${image}" />

</head>
<body>
<div id="root"></div>
<script src="/assets/index.js"></script>
</body>
</html>
    `);
  } catch (err) {
    console.error("OG ERROR:", err);
    res.status(500).send("Server Error");
  }
};
