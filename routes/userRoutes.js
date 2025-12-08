import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  deleteUser,
  updateUserByAdmin,
  promoteUserToAdmin,
} from "../controllers/userController.js";

import { protect } from "../middleware/authMiddleware.js";
import { adminAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// ====================== PUBLIC ROUTES ======================
router.post("/register", registerUser);
router.post("/login", loginUser);

// ====================== USER ROUTES ========================
router.get("/me", protect, getUserProfile);
router.put("/me", protect, updateUserProfile);

// ====================== ADMIN ONLY ROUTES ==================
router.get("/users", adminAuth, getAllUsers);                 // Get all users
router.put("/users/:id", adminAuth, updateUserByAdmin);        // Admin update user
router.delete("/users/:id", adminAuth, deleteUser);            // Admin delete user


router.put("/promote", adminAuth, promoteUserToAdmin);         // 🔥 Promote user to admin

export default router;
