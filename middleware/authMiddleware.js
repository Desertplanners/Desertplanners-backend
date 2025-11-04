// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Admin from "../models/adminModel.js"; // ✅ Needed for adminAuth

// Protect normal user routes
export const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      next();
    } catch (err) {
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }
  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

// Middleware to check if user is admin (used with user routes)
export const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) next();
  else {
    res.status(403);
    throw new Error("Not authorized as admin");
  }
};

// Admin route protection (used with admin routes)
export const adminAuth = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Not authorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id); // ✅ Fix: use Admin model
    if (!admin) return res.status(401).json({ message: "Not authorized" });

    req.admin = admin; // store admin info
    next();
  } catch (err) {
    console.log(err); // optional: log for debugging
    res.status(401).json({ message: "Invalid token" });
  }
};
