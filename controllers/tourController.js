import Tour from "../models/Tour.js";
import Category from "../models/categoryModel.js";
import slugify from "slugify";
import mongoose from "mongoose";
// 🧠 Helper function to safely parse arrays
const parseArray = (field) => {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === "string") {
    try {
      const parsed = JSON.parse(field);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return field
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return [];
};

// 🧠 Helper function for cancellation policy
const parseCancellationPolicy = (policy) => {
  if (!policy) return [];
  if (Array.isArray(policy)) return policy;
  if (typeof policy === "string") {
    try {
      const parsed = JSON.parse(policy);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === "object") {
        return Object.entries(parsed).map(([key, value]) => ({
          title: key.replace(/([A-Z])/g, " $1").trim(),
          description: value,
        }));
      }
    } catch {
      return [{ title: "Cancellation Policy", description: policy }];
    }
  }
  return [];
};

// 🟢 Add new tour
export const addTour = async (req, res) => {
  try {
    console.log("📦 Incoming addTour Request");
    console.log("🧾 Files received:", req.files);

    const {
      title,
      description,
      price,
      duration,
      category,
      highlights,
      inclusions,
      exclusions,
      timings,
      cancellationPolicy,
      location,
      startDate,
      endDate,
      maxGuests,
      termsAndConditions,
      relatedTours,
    } = req.body;

    // ✅ Field validation
    if (
      !title ||
      !description ||
      !price ||
      !duration ||
      !category ||
      !startDate ||
      !endDate
    ) {
      return res
        .status(400)
        .json({ message: "All required fields are required" });
    }

    // ✅ Category check
    const foundCategory = await Category.findById(category);
    if (!foundCategory)
      return res.status(404).json({ message: "Category not found" });

    // ✅ Image handling with full safety
    let mainImage = "";
    if (req.files?.mainImage?.length > 0) {
      const file = req.files.mainImage[0];
      mainImage = file.path || file.secure_url || "";
    } else {
      console.warn("⚠️ No main image uploaded, assigning default image");
      mainImage =
        "https://res.cloudinary.com/dmnzflxh6/image/upload/v1731234567/default-tour.webp";
    }

    const galleryImages =
      req.files?.galleryImages?.length > 0
        ? req.files.galleryImages.map((f) => f.path || f.secure_url || "")
        : [];

    const tour = new Tour({
      title,
      slug: slugify(title, { lower: true }),
      description,
      price,
      duration,
      category: foundCategory._id,
      mainImage,
      galleryImages,
      highlights: parseArray(highlights),
      inclusions: parseArray(inclusions),
      exclusions: parseArray(exclusions),
      timings,
      cancellationPolicy: parseCancellationPolicy(cancellationPolicy),
      location,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      maxGuests: maxGuests || 12,
      termsAndConditions: termsAndConditions || "",
      relatedTours: parseArray(relatedTours),
    });

    await tour.save();
    console.log("✅ Tour saved successfully:", tour.title);
    res.status(201).json({ message: "Tour added successfully", tour });
  } catch (err) {
    const plainError = `
==================== ❌ ADD TOUR ERROR ❌ ====================
MESSAGE: ${err?.message || "No message"}
NAME: ${err?.name || "No name"}
STACK: ${(err?.stack || "").split("\n").slice(0, 4).join("\n")}
BODY: ${JSON.stringify(req.body, null, 2)}
FILES: ${req.files ? Object.keys(req.files).join(", ") : "❌ No files"}
=============================================================
  `;

    // 🔥 Ye line Render pe 100% text print karegi
    process.stdout.write(plainError + "\n");

    // ✅ Also send back to frontend
    return res.status(500).json({ message: err?.message || "Server Error" });
  }
};

// 🟠 Update Tour

export const updateTour = async (req, res) => {
  try {
    debugger; // 🧠 VS Code debugger yahan se execution catch karega

    console.log("============== 🛠 UPDATE TOUR DEBUG START 🛠 ==============");
    console.log("📩 Request URL:", req.originalUrl);
    console.log("🆔 Tour ID Param:", req.params.id);
    console.log("🧾 Request Body:", JSON.stringify(req.body, null, 2));
    console.log(
      "📸 Files Received:",
      req.files ? Object.keys(req.files) : "❌ No files"
    );

    const { id } = req.params;
    const {
      title,
      description,
      price,
      duration,
      category,
      highlights,
      inclusions,
      exclusions,
      timings,
      cancellationPolicy,
      location,
      startDate,
      endDate,
      maxGuests,
      termsAndConditions,
      relatedTours,
    } = req.body;

    console.log("🔍 Finding Tour by ID...");
    const tour = await Tour.findById(id);
    if (!tour) {
      console.warn("⚠️ Tour not found with ID:", id);
      return res.status(404).json({ message: "Tour not found" });
    }

    // 🧩 File updates
    if (req.files && req.files.mainImage?.length > 0) {
      console.log("📷 Updating main image:", req.files.mainImage[0].path);
      tour.mainImage = req.files.mainImage[0].path;
    }

    if (req.files && req.files.galleryImages?.length > 0) {
      console.log(
        "🖼 Updating gallery images count:",
        req.files.galleryImages.length
      );
      tour.galleryImages = req.files.galleryImages.map((f) => f.path);
    }

    // 📝 Update fields
    if (title) {
      console.log("✏️ Updating title:", title);
      tour.title = title;
      tour.slug = slugify(title, { lower: true });
    }

    if (description) tour.description = description;
    if (price) tour.price = price;
    if (duration) tour.duration = duration;
    if (timings) tour.timings = timings;
    if (location) tour.location = location;
    if (termsAndConditions !== undefined)
      tour.termsAndConditions = termsAndConditions;

    if (cancellationPolicy !== undefined) {
      console.log("📜 Parsing cancellation policy...");
      tour.cancellationPolicy = parseCancellationPolicy(cancellationPolicy);
    }

    // 📅 Validate dates
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      console.error("❌ Invalid dates: endDate < startDate");
      return res.status(400).json({
        message: "End date cannot be before start date",
      });
    }

    if (startDate) tour.startDate = new Date(startDate);
    if (endDate) tour.endDate = new Date(endDate);
    if (maxGuests) tour.maxGuests = maxGuests;

    // 🧩 Category validation
    if (category) {
      console.log("🔗 Verifying category ID:", category);
      const foundCategory = await Category.findById(category);
      if (foundCategory) {
        tour.category = foundCategory._id;
      } else {
        console.warn("⚠️ Category not found:", category);
      }
    }

    // 🧮 Parse array fields safely
    console.log("📦 Parsing array fields...");
    tour.highlights = parseArray(highlights);
    tour.inclusions = parseArray(inclusions);
    tour.exclusions = parseArray(exclusions);
    tour.relatedTours = parseArray(relatedTours);

    if (price !== undefined) tour.price = Number(price);
    if (maxGuests !== undefined) tour.maxGuests = Number(maxGuests);
    if (cancellationPolicy !== undefined) {
      try {
        const parsedPolicy =
          typeof cancellationPolicy === "string"
            ? JSON.parse(cancellationPolicy)
            : cancellationPolicy;
        tour.cancellationPolicy = parsedPolicy;
      } catch (e) {
        console.warn("⚠️ Invalid cancellationPolicy format:", e.message);
      }
    }
    if (relatedTours !== undefined) {
      try {
        const parsedRelated =
          typeof relatedTours === "string"
            ? JSON.parse(relatedTours)
            : relatedTours;
        tour.relatedTours = parsedRelated.filter((id) =>
          mongoose.Types.ObjectId.isValid(id)
        );
      } catch (e) {
        console.warn("⚠️ Invalid relatedTours format:", e.message);
      }
    }

    console.log("💾 Saving updated tour...");
    await tour.save();

    console.log("✅ Tour updated successfully:", tour.title);
    console.log("============== ✅ UPDATE TOUR DEBUG END ✅ ==============");

    res.json({ message: "Tour updated successfully", tour });
  } catch (err) {
    console.error("============== ❌ UPDATE TOUR ERROR ❌ ==============");
    console.error("🧨 ERROR MESSAGE:", err.message);
    console.error("📂 STACK TRACE:", err.stack);
    console.error("📦 BODY AT FAILURE:", JSON.stringify(req.body, null, 2));
    console.error(
      "📸 FILES AT FAILURE:",
      req.files ? Object.keys(req.files) : "❌ No files"
    );
    console.error(
      "FULL ERROR JSON:",
      JSON.stringify(err, Object.getOwnPropertyNames(err), 2)
    );
    console.error("======================================================");

    return res.status(500).json({
      message: err.message,
      stack: err.stack,
    });
  }
};

// 🟡 Get All Tours
export const getTours = async (req, res) => {
  try {
    const tours = await Tour.find()
      .populate("category", "name")
      .populate("relatedTours", "title price mainImage");
    res.json(tours);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔵 Get single tour by slug

export const getTourBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const tour = await Tour.findOne({ slug })
      .populate({
        path: "category",
        model: "Category",
        select: "name slug",
      })
      .populate({
        path: "relatedTours",
        model: "Tour",
        select: "title price mainImage slug category",
        populate: {
          path: "category",
          model: "Category",
          select: "name slug",
        },
      });

    if (!tour) return res.status(404).json({ message: "Tour not found" });

    res.json(tour);
  } catch (err) {
    console.error("❌ Error fetching tour:", err);
    res.status(500).json({ message: err.message });
  }
};



// 🔴 Delete tour
export const deleteTour = async (req, res) => {
  try {
    const { id } = req.params;
    const tour = await Tour.findByIdAndDelete(id);
    if (!tour) return res.status(404).json({ message: "Tour not found" });
    res.json({ message: "Tour deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting tour:", err);
    res.status(500).json({ message: err.message });
  }
};

// 🟣 Check availability
export const checkAvailability = async (req, res) => {
  try {
    const { tourId, date, guests } = req.body;
    const tour = await Tour.findById(tourId);
    if (!tour) return res.status(404).json({ message: "Tour not found" });

    const selectedDate = new Date(date);
    const startDate = new Date(tour.startDate);
    const endDate = new Date(tour.endDate);

    const isDateAvailable =
      selectedDate >= startDate && selectedDate <= endDate;
    const isGuestAvailable = guests <= tour.maxGuests;

    res.json({
      available: isDateAvailable && isGuestAvailable,
      reason: !isDateAvailable
        ? "Selected date is not within tour dates"
        : !isGuestAvailable
        ? "Number of guests exceeds limit"
        : null,
    });
  } catch (error) {
    console.error("❌ Error checking availability:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔵 Get tours by category
export const getToursByCategory = async (req, res) => {
  try {
    const { categoryName } = req.params;
    const categories = await Category.find();
    const category = categories.find(
      (c) => slugify(c.name, { lower: true }) === categoryName.toLowerCase()
    );
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    const tours = await Tour.find({ category: category._id })
      .populate("category", "name")
      .populate("relatedTours", "title price mainImage");

    res.json(tours);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
