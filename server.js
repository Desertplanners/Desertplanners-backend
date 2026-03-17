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
import https from "https";
// ==========================
// 📁 __dirname FIX (VERY IMPORTANT)
// ==========================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================
// ✅ Database Connection
// ==========================
import connectDB from "./config/db.js";

// ==========================
// ✅ Routes Imports
// ==========================
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
import visaSubCategoryRoutes from "./routes/visaSubCategoryRoutes.js"
import paymentRoutes from "./routes/paymentRoutes.js";
import bannerRoutes from "./routes/bannerRoutes.js";
import visaBookingRoutes from "./routes/visaBookingRoutes.js";
import holidayBookingRoutes from "./routes/holidayBookingRoutes.js";
import visaPaymentRoutes from "./routes/visaPaymentRoutes.js";
import holidayCategoryRoutes from "./routes/holidayCategoryRoutes.js";
import holidayTourRoutes from "./routes/holidayTourRoutes.js";
import seoRoutes from "./routes/seoRoutes.js";
import sitemapRoute from "./routes/sitemapRoute.js";
import robotsRoute from "./routes/robotsRoute.js";
import blogCategoryRoutes from "./routes/blogCategoryRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import holidayPaymentRoutes from "./routes/holidayPaymentRoutes.js";
// import ogRoutes from "./routes/ogRoutes.js"; // ⭐ OG ROUTE (CRITICAL)

// ==========================
// ☁️ Cloudinary
// ==========================
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
// 🌍 CORS CONFIG
// ==========================
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://desertplanners-five.vercel.app",
  "https://desertplanners.net",
  "https://www.desertplanners.net",
  "https://desertplanners-backend.onrender.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

// ==========================
//  HEALTH CHECK (VERY IMPORTANT)
// ==========================
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// ==========================
// 🧭 ROUTES ORDER (VERY IMPORTANT)
// ==========================

// 🤖 1️⃣ OG ROUTES (SABSE UPAR)
// app.use("/", ogRoutes);

// 🤖 2️⃣ Robots & Sitemap
app.use("/", robotsRoute);
app.use("/", sitemapRoute);

// 🔐 3️⃣ API ROUTES
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
app.use("/api/visa-sub-categories", visaSubCategoryRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/banner", bannerRoutes);
app.use("/api/visa-bookings", visaBookingRoutes);
app.use("/api/holiday-booking", holidayBookingRoutes);
app.use("/api/visa-payment", visaPaymentRoutes);
app.use("/api/holiday-payment", holidayPaymentRoutes);
app.use("/api/holiday-categories", holidayCategoryRoutes);
app.use("/api/holiday-tour", holidayTourRoutes);
app.use("/api/blog-categories", blogCategoryRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/seo", seoRoutes);

// ==========================
// 📁 Serve Uploaded Files
// ==========================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ==========================
// 📁 Serve Public Files (LOGO / STATIC)
// ==========================
app.use("/public", express.static(path.join(__dirname, "public")));

// ==========================
// 🌐 SERVE FRONTEND (VITE BUILD)
// ==========================

const FRONTEND_DIST = path.join(
  __dirname,
  "../DesertPlanners_Frontend/dist"
);

// Serve static assets
app.use(express.static(FRONTEND_DIST));

// SPA fallback (Node 24 SAFE)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(FRONTEND_DIST, "index.html"));
});

// ==========================
// 🚀 HTTP + Socket.io Setup
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
// 🟢 Start Server
// ==========================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});


// ==========================
// 🔁 SELF PING (KEEP SERVER AWAKE)
// ==========================


setInterval(() => {
  https
    .get("https://desertplanners-backend.onrender.com/health", (res) => {
      console.log("🔁 Self ping success");
    })
    .on("error", (err) => {
      console.log("❌ Self ping error:", err.message);
    });
}, 4 * 60 * 1000); // हर 4 मिनट