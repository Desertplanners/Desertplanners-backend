import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import Admin from "../models/adminModel.js";

// Protect admin routes
export const protectAdmin = asyncHandler(async (req, res, next) => {
  let token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select("-password");
    if (!admin) {
      res.status(401);
      throw new Error("Admin not found");
    }
    req.admin = admin;
    next();
  } catch (err) {
    res.status(401);
    throw new Error("Not authorized, token failed");
  }
});
