import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,   // 👈 Normalize email
    trim: true
  },

  password: { 
    type: String, 
    required: true 
  },

  mobile: { type: String },
  country: { type: String },

  profilePhoto: { 
    type: String, 
    default: "" 
  },

  // 🔥 ADMIN FLAG
  isAdmin: { 
    type: Boolean, 
    default: false 
  },

  // ⭐ FORGOT PASSWORD SYSTEM
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },

  createdAt: { 
    type: Date, 
    default: Date.now 
  },
});

// ================== HASH PASSWORD BEFORE SAVE ==================
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

// ================== COMPARE PASSWORD ==================
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", UserSchema);
