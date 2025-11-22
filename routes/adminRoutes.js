import express from "express";
import {
  registerAdmin,
  loginAdmin,
  getAdminProfile,
  updateAdminProfile,
  getAdminOverview,
} from "../controllers/adminController.js";

import { protectAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

// There are Admin Routes 
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.get("/overview", protectAdmin, getAdminOverview);
// new routes for logged-in admin
router.get("/me", protectAdmin, getAdminProfile);
router.put("/me", protectAdmin, updateAdminProfile);

export default router;
//  There are admin Routes 