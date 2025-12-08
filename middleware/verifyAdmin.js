import jwt from "jsonwebtoken";
// import Admin from "../models/adminModel.js";

export default async function verifyAdmin(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(403).json({ message: "Access denied" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id);
    if (!admin) return res.status(403).json({ message: "Access denied" });

    req.admin = admin;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
}
