import express from "express";
import {
  adminLogin,
  getAdminOverview,
  removeAdminAccess,
  forgotPassword,
  resetPassword,
} from "../controllers/adminLoginController.js";
import { adminAuth } from "../middleware/authMiddleware.js";
const router = express.Router();

// ====================== ADMIN LOGIN ROUTE ======================
router.post("/login", adminLogin);
router.put("/remove-admin", adminAuth, removeAdminAccess);
router.get("/overview", adminAuth, getAdminOverview);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;
