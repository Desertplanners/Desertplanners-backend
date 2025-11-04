import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  deleteUser,
  updateUserByAdmin,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminAuth } from "../middleware/authMiddleware.js"; // Make sure this exists

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes (for logged-in user)
router.get("/me", protect, getUserProfile);
router.put("/me", protect, updateUserProfile);

// Admin routes (only accessible by admin)
router.get("/users", adminAuth, getAllUsers); // Get all users
router.put("/users/:id", adminAuth, updateUserByAdmin); // Update user
router.delete("/users/:id", adminAuth, deleteUser); // Delete user

export default router;
