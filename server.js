// ==========================
// 🌍 Desert Planners Backend Server
// ==========================

// 🧩 Load environment variables FIRST
import dotenv from "dotenv";
dotenv.config();

// ==========================
// 🧱 Core Imports
// ==========================
import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";

// ✅ Database Connection
import connectDB from "./config/db.js";

// ✅ Routes Imports
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import tourRoutes from "./routes/tourRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import enquiryRoutes from "./routes/enquiryRoutes.js";
import visaRoutes from "./routes/visaRoutes.js";
import sectionRoutes from "./routes/sectionRoutes.js";
import visaCategoryRoutes from "./routes/visaCategoryRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import bannerRoutes from "./routes/bannerRoutes.js";
import visaBookingRoutes from "./routes/visaBookingRoutes.js";
import visaPaymentRoutes from "./routes/visaPaymentRoutes.js";
import holidayCategoryRoutes from "./routes/holidayCategoryRoutes.js";
import holidayTourRoutes from "./routes/holidayTourRoutes.js";
import seoRoutes from "./routes/seoRoutes.js"
import sitemapRoute from "./routes/sitemapRoute.js";
import robotsRoute from "./routes/robotsRoute.js";
import blogCategoryRoutes from "./routes/blogCategoryRoutes.js";

// Cloudinary
import "./config/cloudinary.js";

// ==========================
// 🟢 Connect Database
// ==========================
connectDB();

// ==========================
// ⚙️ Express App Setup
// ==========================
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// ==========================
// 🌍 FIXED CORS (LOCAL + VERCEL + DOMAIN)
// ==========================

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",

  // OLD Vercel frontend preview
  "https://desertplanners-five.vercel.app",

  // PRODUCTION domain (NEW)
  "https://desertplanners.net",
  "https://www.desertplanners.net",

  // Render backend (just in case of internal calls)
  "https://desertplanners-backend.onrender.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Allow Postman & mobile
      if (allowedOrigins.includes(origin)) return callback(null, true);

      console.warn("❌ Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

// ==========================
// 🧭 Routes
// ==========================
app.use("/", robotsRoute);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tours", tourRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/visas", visaRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/visa-categories", visaCategoryRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/banner", bannerRoutes);
app.use("/api/visa-bookings", visaBookingRoutes);
app.use("/api/visa-payment", visaPaymentRoutes);
app.use("/api/holiday-categories", holidayCategoryRoutes);
app.use("/api/blog-categories", blogCategoryRoutes);
app.use("/api/holiday-tour", holidayTourRoutes);
app.use("/", sitemapRoute);
// ⭐ ADD THIS LINE → SEO API
app.use("/api/seo", seoRoutes);
app.get("/", (req, res) => {
  res.send("✅ Desert Planners API is running...");
});

// ==========================
// 📁 Serve Uploaded Files
// ==========================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ==========================
// 🚀 HTTP + Socket.io setup
// ==========================
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);
  socket.on("disconnect", () =>
    console.log("🔴 Client disconnected:", socket.id)
  );
});

app.set("io", io);

// ==========================
// 🟢 Start server
// ==========================
console.log("RESEND KEY:", process.env.RESEND_API_KEY);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
