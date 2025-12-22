import express from "express";
import {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon,
  applyCoupon,
  getAvailableCoupons,
} from "../controllers/couponController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * ===============================
 *  PUBLIC ROUTES (ALWAYS TOP)
 * ===============================
 */

// ✅ VERY IMPORTANT — STATIC ROUTE FIRST
router.get("/available", getAvailableCoupons);

// Checkout
router.post("/apply", applyCoupon);

/**
 * ===============================
 *  ADMIN ROUTES
 * ===============================
 */

router.post("/create", protect, createCoupon);
router.get("/all", protect, getAllCoupons);

// ❗❗ DYNAMIC ROUTES ALWAYS LAST
router.get("/:id", protect, getCouponById);
router.put("/:id", protect, updateCoupon);
router.patch("/:id/toggle", protect, toggleCouponStatus);
router.delete("/:id", protect, deleteCoupon);

export default router;
