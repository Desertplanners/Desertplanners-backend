// config/db.js
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 60000, // ⬅️ important
      socketTimeoutMS: 60000,          // ⬅️ important
      family: 4,                        // ⬅️ MOST IMPORTANT (IPv4 fix)
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB Connection Error: ${err.message}`);
    throw err; // ⬅️ IMPORTANT (process.exit हटाओ)
  }
};

export default connectDB;