import express from "express";
import { renderOG } from "../controllers/ogController.js";

const router = express.Router();

/**
 * 🤖 UNIVERSAL OG HANDLER (SAFE + FINAL)
 *
 * ❌ OG ko in sab se door rakho:
 * - API routes
 * - uploads (images, files)
 * - socket.io
 * - favicon
 * - robots.txt
 * - ALL sitemap files (xml + html)
 *
 * ✅ OG sirf real frontend pages pe chale:
 * - /
 * - /tours/*
 * - /blog/*
 * - /about-us etc
 */
router.get(
  /^\/(?!api\/|uploads\/|socket\.io\/|favicon\.ico$|robots\.txt$|sitemap.*\.xml$|sitemap\.html$).*/,
  renderOG
);

export default router;
