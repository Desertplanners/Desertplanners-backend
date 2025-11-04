import Admin from "../models/adminModel.js";
import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import Tour from "../models/Tour.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";


// Generate JWT
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// @desc    Register new admin
// @route   POST /api/admin/register
// @access  Public (initially)
export const registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const adminExists = await Admin.findOne({ email });
  if (adminExists) {
    res.status(400);
    throw new Error("Admin already exists");
  }

  const admin = await Admin.create({ name, email, password });

  if (admin) {
    res.status(201).json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      token: generateToken(admin._id),
    });
  } else {
    res.status(400);
    throw new Error("Invalid admin data");
  }
});

// @desc    Admin login
// @route   POST /api/admin/login
// @access  Public
export const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email });

  if (admin && (await admin.matchPassword(password))) {
    res.json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      token: generateToken(admin._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// @desc    Get logged-in admin profile
// @route   GET /api/admin/me
// @access  Private (admin)
export const getAdminProfile = asyncHandler(async (req, res) => {
  const admin = req.admin;
  res.json({
    _id: admin._id,
    name: admin.name,
    email: admin.email,
  });
});

// @desc    Update admin profile
// @route   PUT /api/admin/me
// @access  Private (admin)
export const updateAdminProfile = asyncHandler(async (req, res) => {
  const admin = req.admin;
  const { name, password } = req.body;

  if (name) admin.name = name;
  if (password && password.length >= 6) admin.password = password; // hashing handled by pre-save

  const updatedAdmin = await admin.save();
  res.json({
    _id: updatedAdmin._id,
    name: updatedAdmin.name,
    email: updatedAdmin.email,
  });
});

export const getAdminOverview = async (req, res) => {
  try {
    const totalTours = await Tour.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalRevenueAgg = await Booking.aggregate([
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);
    const totalRevenue = totalRevenueAgg[0]?.total || 0;

    // 🟢 Active Users = all registered users (since you don’t have isActive)
    const activeUsers = await User.countDocuments();

    // 📅 Monthly booking stats (past 6 months)
    const monthlyStats = await Booking.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          total: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Format data for chart
    const formattedStats = monthlyStats.map((item) => ({
      month: new Date(0, item._id.month - 1).toLocaleString("default", {
        month: "short",
      }),
      total: item.total,
    }));

    res.json({
      totalTours,
      totalBookings,
      totalRevenue,
      activeUsers,
      monthlyStats: formattedStats,
    });
  } catch (error) {
    console.error("Error fetching overview:", error);
    res.status(500).json({ message: "Error fetching overview data" });
  }
};
