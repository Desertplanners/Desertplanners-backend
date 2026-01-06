import Tour from "../models/Tour.js";
import Blog from "../models/Blog.js";
import SEO from "../models/SEO.js";

const SITE_URL = "https://www.desertplanners.net";

export const renderOG = async (req, res) => {
  try {
    const url = req.originalUrl;

    let title = "Desert Planners | Dubai Tours & Experiences";
    let description =
      "Book Dubai tours, attractions, Burj Khalifa tickets & luxury experiences with Desert Planners.";
    let image = null; // 🔴 NO DEFAULT IMAGE
    let pageUrl = `${SITE_URL}${url}`;

    /* ================= TOUR ================= */
    if (url.startsWith("/tours/")) {
      const slug = url.split("/").pop();

      const tour = await Tour.findOne({ slug });
      if (tour) {
        const seo = await SEO.findOne({
          parentType: "tour",
          parentId: String(tour._id),
        });

        title = seo?.seoTitle || tour.title;
        description =
          seo?.seoDescription || tour.shortDescription || description;

        if (seo?.seoOgImage) {
          image = seo.seoOgImage.startsWith("http")
            ? seo.seoOgImage
            : `${SITE_URL}/${seo.seoOgImage}`;
        } else if (tour.mainImage) {
          image = tour.mainImage.startsWith("http")
            ? tour.mainImage
            : `${SITE_URL}/${tour.mainImage}`;
        }
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

        if (seo?.seoOgImage) {
          image = `${SITE_URL}/${seo.seoOgImage}`;
        } else if (blog.coverImage) {
          image = `${SITE_URL}/${blog.coverImage}`;
        }
      }
    }

    /* ================= HOME ================= */
    else if (url === "/" || url === "") {
      const seo = await SEO.findOne({ parentType: "home" });
      if (seo) {
        title = seo.seoTitle || title;
        description = seo.seoDescription || description;

        if (seo.seoOgImage) {
          image = `${SITE_URL}/${seo.seoOgImage}`;
        }
      }
    }

    /* ================= OTHER PAGES ================= */
    else {
      const seo = await SEO.findOne({ pageUrl: url });
      if (seo) {
        title = seo.seoTitle || title;
        description = seo.seoDescription || description;

        if (seo.seoOgImage) {
          image = `${SITE_URL}/${seo.seoOgImage}`;
        }
      }
    }

    /* ================= BUILD META TAGS ================= */
    const ogImageTag = image
      ? `<meta property="og:image" content="${image}" />
         <meta name="twitter:image" content="${image}" />`
      : "";

    res.set("Content-Type", "text/html");
    res.send(`
<!DOCTYPE html>
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

${ogImageTag}
</head>
<body>
<div id="root"></div>
</body>
</html>
    `);
  } catch (err) {
    console.error("OG ERROR:", err);
    res.status(500).send("Server Error");
  }
};
