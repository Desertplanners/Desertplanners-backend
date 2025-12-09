import User from "../models/User.js";
import jwt from "jsonwebtoken";
import Tour from "../models/Tour.js"; // ✅ ADD THIS
import Booking from "../models/Booking.js"; // ✅ ADD THIS
import { Resend } from "resend";
import crypto from "crypto";

// const resend = new Resend(process.env.RESEND_API_KEY);
// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// ==================== ADMIN LOGIN (SEPARATE LOGIN) ====================
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 🚫 Block normal users
    if (!user.isAdmin) {
      return res.status(403).json({ message: "Admin access denied" });
    }

    // ✔ Admin allowed
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: true,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Admin Login Error:", error);
    res.status(500).json({ message: "Error logging in admin" });
  }
};

export const getAdminOverview = async (req, res) => {
  try {
    const totalTours = await Tour.countDocuments();
    const totalBookings = await Booking.countDocuments();

    const revenue = await Booking.aggregate([
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);

    const totalRevenue = revenue[0]?.total || 0;

    const activeUsers = await User.countDocuments();

    // Monthly booking stats
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
    res.status(500).json({ message: "Error fetching overview" });
  }
};

export const removeAdminAccess = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);

    // ❌ Only Super Admin can remove admin access
    if (!currentUser.isSuperAdmin) {
      return res.status(403).json({ message: "Only Super Admin can remove admin access" });
    }

    const { userId } = req.body;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    // ❌ A super admin cannot be removed
    if (user.isSuperAdmin) {
      return res.status(403).json({ message: "Super Admin cannot be demoted" });
    }

    user.isAdmin = false;
    await user.save();

    res.json({ message: "Admin access removed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error removing admin access" });
  }
};


export const forgotPassword = async (req, res) => {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY); // 👈 Yahin banao

    console.log("RESEND KEY:", process.env.RESEND_API_KEY);

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "Email not found" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    const resetURL = `${process.env.FRONTEND_URL}/admin/reset-password/${resetToken}`;
    await resend.emails.send({
      from: "no-reply@desertplanners.net", // ✔ Correct domain
      to: user.email,
      subject: "Admin Password Reset",
      html: `
  <div style="font-family: 'Arial', sans-serif; background:#f5f5f7; padding:30px;">
    <div style="max-width:500px; margin:auto; background:white; border-radius:12px; padding:30px; box-shadow:0 4px 10px rgba(0,0,0,0.1);">
      
      <div style="text-align:center; margin-bottom:20px;">
        <img src="https://desertplanners.net/desertplanners_logo.png"
     alt="Desert Planners" 
     style="width:120px; margin-bottom:10px;" />
        <h2 style="color:#d9232e; margin:0;">Password Reset Request</h2>
      </div>

      <p style="font-size:15px; color:#444;">
        Hello <strong>${user.name}</strong>,
      </p>

      <p style="font-size:15px; color:#444; line-height:1.6;">
        You requested to reset your admin password. Click the button below to proceed.  
        This link will expire in <strong>10 minutes</strong>.
      </p>

      <div style="text-align:center; margin:30px 0;">
        <a href="${resetURL}" 
          style="
            background:#d9232e;
            color:white;
            padding:12px 24px;
            text-decoration:none;
            border-radius:6px;
            font-size:15px;
            font-weight:bold;
            display:inline-block;
          "
        >
          Reset Password
        </a>
      </div>

      <p style="font-size:14px; color:#777; line-height:1.5;">
        Or copy the link below and open it in your browser:
      </p>

      <p style="font-size:13px; color:#d9232e; word-break:break-all;">
        ${resetURL}
      </p>

      <hr style="margin:30px 0; border:none; border-top:1px solid #eee;" />

      <p style="font-size:13px; color:#999; text-align:center;">
        If you did not request this, please ignore this email.  
      </p>

      <p style="font-size:13px; color:#999; text-align:center; margin-top:10px;">
        © ${new Date().getFullYear()} Desert Planners Tourism LLC. All rights reserved.
      </p>

    </div>
  </div>
`,
    });

    res.json({ message: "Password reset email sent" });
  } catch (e) {
    console.log("EMAIL ERROR:", e);
    res.status(500).json({ message: "Error sending reset email" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Token invalid or expired" });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ message: "Password updated successfully!" });
  } catch (e) {
    res.status(500).json({ message: "Error resetting password" });
  }
};
