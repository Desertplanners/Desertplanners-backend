import Coupon from "../models/Coupon.js";

/**
 * ===============================
 *  CREATE COUPON (ADMIN)
 * ===============================
 */
export const createCoupon = async (req, res) => {
    try {
      const {
        code,
        discountType,
        discountValue,
        minOrderAmount,
        maxDiscountAmount,
        expiryDate,
        totalUsageLimit,
        applicableTours, // ⭐ ADD THIS
      } = req.body;
  
      if (!code || !discountType || !discountValue || !expiryDate) {
        return res.status(400).json({ message: "Required fields missing" });
      }
  
      const existing = await Coupon.findOne({ code: code.toUpperCase() });
      if (existing) {
        return res.status(400).json({ message: "Coupon already exists" });
      }
  
      const coupon = await Coupon.create({
        code: code.toUpperCase(),
        discountType,
        discountValue,
        minOrderAmount,
        maxDiscountAmount,
        expiryDate,
        totalUsageLimit,
  
        // ⭐ IMPORTANT
        applicableTours:
          Array.isArray(applicableTours) && applicableTours.length > 0
            ? applicableTours
            : [],
      });
  
      res.status(201).json({
        success: true,
        message: "Coupon created successfully",
        coupon,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  

/**
 * ===============================
 *  GET ALL COUPONS (ADMIN)
 * ===============================
 */
export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ===============================
 *  GET SINGLE COUPON
 * ===============================
 */
export const getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    res.json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ===============================
 *  UPDATE COUPON (ADMIN)
 * ===============================
 */
export const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    Object.assign(coupon, req.body);
    await coupon.save();

    res.json({
      success: true,
      message: "Coupon updated successfully",
      coupon,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ===============================
 *  ENABLE / DISABLE COUPON
 * ===============================
 */
export const toggleCouponStatus = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.json({
      success: true,
      message: `Coupon ${coupon.isActive ? "activated" : "deactivated"}`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ===============================
 *  DELETE COUPON
 * ===============================
 */
export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    await coupon.deleteOne();
    res.json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ===============================
 *  APPLY COUPON (CHECKOUT)
 * ===============================
 */
export const applyCoupon = async (req, res) => {
    try {
      const { code, orderAmount, tourId } = req.body;
  
      if (!code || !orderAmount) {
        return res.status(400).json({ message: "Invalid request" });
      }
  
      const coupon = await Coupon.findOne({
        code: code.toUpperCase(),
        isActive: true,
      });
  
      if (!coupon) {
        return res.status(400).json({ message: "Invalid coupon code" });
      }
  
      // ❌ Expired
      if (new Date() > coupon.expiryDate) {
        return res.status(400).json({ message: "Coupon expired" });
      }
  
      // ❌ Usage limit
      if (
        coupon.totalUsageLimit &&
        coupon.usedCount >= coupon.totalUsageLimit
      ) {
        return res
          .status(400)
          .json({ message: "Coupon usage limit reached" });
      }
  
      // ❌ Minimum order
      if (orderAmount < coupon.minOrderAmount) {
        return res.status(400).json({
          message: `Minimum order amount is ${coupon.minOrderAmount}`,
        });
      }
  
      // ================= TOUR SPECIFIC CHECK =================
      if (coupon.applicableTours && coupon.applicableTours.length > 0) {
        if (!tourId) {
          return res.status(400).json({
            message: "This coupon is valid only for specific tours",
          });
        }
  
        const isAllowed = coupon.applicableTours.some(
          (t) => t.toString() === tourId
        );
  
        if (!isAllowed) {
          return res.status(400).json({
            message: "Coupon not applicable for this tour",
          });
        }
      }
  
      // ================= DISCOUNT CALC =================
      let discount = 0;
  
      if (coupon.discountType === "percentage") {
        discount = (orderAmount * coupon.discountValue) / 100;
  
        if (coupon.maxDiscountAmount) {
          discount = Math.min(discount, coupon.maxDiscountAmount);
        }
      } else {
        discount = coupon.discountValue;
      }
  
      const finalAmount = Math.max(orderAmount - discount, 0);
  
      res.json({
        success: true,
        couponId: coupon._id,
        discount,
        finalAmount,
        couponType:
          coupon.applicableTours.length > 0 ? "tour-specific" : "general",
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  

/**
 * ===============================
 *  INCREASE COUPON USAGE (AFTER PAYMENT)
 * ===============================
 */
export const markCouponUsed = async (couponId) => {
  if (!couponId) return;

  const coupon = await Coupon.findById(couponId);
  if (!coupon) return;

  coupon.usedCount += 1;
  await coupon.save();
};


/**
 * ===============================
 *  GET AVAILABLE COUPONS (PUBLIC)
 * ===============================
 */
export const getAvailableCoupons = async (req, res) => {
  try {
    const { tourId } = req.query;
    const now = new Date();

    let query = {
      isActive: true,
      expiryDate: { $gte: now },
    };

    // ⭐ agar tourId aaya hai
    if (tourId) {
      query.$or = [
        { applicableTours: { $size: 0 } }, // GENERAL coupons
        { applicableTours: tourId },        // THIS tour coupons
      ];
    } else {
      // fallback — sirf general
      query.applicableTours = { $size: 0 };
    }

    const coupons = await Coupon.find(query)
      .select(
        "code discountType discountValue minOrderAmount expiryDate applicableTours"
      )
      .sort({ discountValue: -1 });

    res.json({
      success: true,
      coupons,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
