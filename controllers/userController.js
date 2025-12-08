import User from "../models/User.js";
import jwt from "jsonwebtoken";
import Tour from "../models/Tour.js";
import Booking from "../models/Booking.js";


// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// ===================== REGISTER USER =====================
export const registerUser = async (req, res) => {
  try {
    let { name, email, password, mobile, country } = req.body;

    email = email.toLowerCase(); // 🔥 Force lowercase

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const user = await User.create({
      name,
      email,
      password,
      mobile,
      country,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      country: user.country,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: "Error registering user" });
  }
};


// ===================== LOGIN USER (WEBSITE) =====================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      isAdmin: user.isAdmin,     // 🔥 now admin flag included!
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: "Error logging in" });
  }
};

// ===================== GET USER PROFILE =====================
export const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user.id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile || "",
      country: user.country || "",
      profilePhoto: user.profilePhoto || "",
      isAdmin: user.isAdmin,
    });
  } else {
    res.status(404).json({ message: "User not found" });
  }
};

// ===================== UPDATE USER PROFILE =====================
export const updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.mobile = req.body.mobile || user.mobile;
    user.country = req.body.country || user.country;

    if (req.body.profilePhoto) user.profilePhoto = req.body.profilePhoto;
    if (req.body.password) user.password = req.body.password;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      mobile: updatedUser.mobile,
      country: updatedUser.country,
      profilePhoto: updatedUser.profilePhoto,
      isAdmin: updatedUser.isAdmin,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404).json({ message: "User not found" });
  }
};

// ===================== GET ALL USERS (ADMIN ONLY) =====================
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users" });
  }
};

// ===================== DELETE USER (ADMIN ONLY) =====================
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting user" });
  }
};

// ===================== UPDATE USER BY ADMIN =====================
export const updateUserByAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.mobile = req.body.mobile || user.mobile;
    user.country = req.body.country || user.country;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      mobile: updatedUser.mobile,
      country: updatedUser.country,
      isAdmin: updatedUser.isAdmin,
    });
  } catch (err) {
    res.status(500).json({ message: "Error updating user" });
  }
};

// ===================== PROMOTE USER TO ADMIN (ADMIN ONLY) =====================
export const promoteUserToAdmin = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isAdmin = true; // 🔥 HERE USER BECOMES ADMIN
    await user.save();

    res.json({ message: "User promoted to admin successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error promoting user" });
  }
};


