import express from "express";
import { renderOG } from "../controllers/ogController.js";

const router = express.Router();

/**
 * 🤖 UNIVERSAL OG HANDLER (Express v5 SAFE)
 * ❌ api, uploads, socket.io ko skip karega
 * ✅ tours, blogs, home, pages sab handle karega
 */
router.get(
  /^\/(?!api|uploads|socket\.io|favicon\.ico).*/,
  renderOG
);

export default router;
