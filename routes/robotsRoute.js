import express from "express";

const router = express.Router();

router.get("/robots.txt", (req, res) => {
  res.type("text/plain");
  res.send(
`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /admin/dashboard
Disallow: /*?*

Sitemap: https://www.desertplanners.net/sitemap.xml`
  );
});

export default router;
