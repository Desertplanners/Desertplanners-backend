import Tour from "../models/Tour.js";
import Category from "../models/categoryModel.js";
import slugify from "slugify";

// 🧠 Helper function to safely parse arrays
const parseArray = (field) => {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === "string") {
    try {
      const parsed = JSON.parse(field);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // not JSON, fallback to comma-split
    }
    return field
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return [];
};

// 🧠 Helper function for cancellation policy - ARRAY FORMAT
const parseCancellationPolicy = (policy) => {
  if (!policy) return [];

  // Agar already array hai
  if (Array.isArray(policy)) return policy;

  // Agar string hai toh JSON parse try karo
  if (typeof policy === "string") {
    try {
      const parsed = JSON.parse(policy);
      if (Array.isArray(parsed)) return parsed;

      // Agar object format mein hai (purana format), convert to array
      if (typeof parsed === "object") {
        return Object.entries(parsed)
          .filter(([_, value]) => value && value.trim() !== "")
          .map(([key, value]) => {
            const title = key
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (str) => str.toUpperCase())
              .trim();
            return { title, description: value };
          });
      }
    } catch {
      // Agar simple string hai, ek section banao
      return [{ title: "Cancellation Policy", description: policy }];
    }
  }

  // Agar object hai (purana format), convert to array
  if (typeof policy === "object") {
    return Object.entries(policy)
      .filter(([_, value]) => value && value.trim() !== "")
      .map(([key, value]) => {
        const title = key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase())
          .trim();
        return { title, description: value };
      });
  }

  return [];
};

// 🟢 Add new tour
export const addTour = async (req, res) => {
  try {
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
      cancellationPolicy, // 🔄 UPDATED - Now structured
      location,
      startDate,
      endDate,
      maxGuests,
      termsAndConditions,
      relatedTours,
    } = req.body;

    if (
      !title ||
      !description ||
      !price ||
      !duration ||
      !category ||
      !startDate ||
      !endDate ||
      !req.files?.mainImage
    ) {
      return res
        .status(400)
        .json({ message: "All required fields are required" });
    }

    // ✅ Check category exists
    const foundCategory = await Category.findById(category);
    if (!foundCategory)
      return res.status(404).json({ message: "Category not found" });

    // ✅ Date validation
    if (new Date(endDate) < new Date(startDate)) {
      return res
        .status(400)
        .json({ message: "End date cannot be before start date" });
    }

    // ✅ Handle image uploads
    const mainImage = req.files.mainImage[0].path.replace(/\\/g, "/");
    const galleryImages = req.files.galleryImages
      ? req.files.galleryImages.map((file) => file.path.replace(/\\/g, "/"))
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
      cancellationPolicy: parseCancellationPolicy(cancellationPolicy), // 🔄 UPDATED - Now ARRAY format
      location,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      maxGuests: maxGuests || 12,
      termsAndConditions: termsAndConditions || "",
      relatedTours: parseArray(relatedTours),
    });

    await tour.save();
    res.status(201).json({ message: "Tour added successfully", tour });
  } catch (err) {
    console.error("❌ Error adding tour:", err);
    res.status(500).json({ message: err.message });
  }
};

// 🟡 Get all tours
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

// 🔵 Get single tour by slug
export const getTourBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const tour = await Tour.findOne({ slug })
      .populate("category", "name slug")
      .populate({
        path: "relatedTours",
        populate: { path: "category", select: "name slug" },
        select: "title price mainImage slug",
      });

    if (!tour) return res.status(404).json({ message: "Tour not found" });

    res.json(tour);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔴 Delete a tour
export const deleteTour = async (req, res) => {
  try {
    const { id } = req.params;
    const tour = await Tour.findByIdAndDelete(id);
    if (!tour) return res.status(404).json({ message: "Tour not found" });

    res.json({ message: "Tour deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🟠 Update/Edit a tour
export const updateTour = async (req, res) => {
  try {
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
      cancellationPolicy, // 🔄 UPDATED - Now structured
      location,
      startDate,
      endDate,
      maxGuests,
      termsAndConditions,
      relatedTours,
    } = req.body;

    const tour = await Tour.findById(id);
    if (!tour) return res.status(404).json({ message: "Tour not found" });

    // ✅ Date validation
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return res
        .status(400)
        .json({ message: "End date cannot be before start date" });
    }

    // ✅ Category update
    if (category) {
      const foundCategory = await Category.findById(category);
      if (!foundCategory)
        return res.status(404).json({ message: "Category not found" });
      tour.category = foundCategory._id;
    }

    // ✅ Basic fields
    if (title) {
      tour.title = title;
      tour.slug = slugify(title, { lower: true });
    }
    if (description) tour.description = description;
    if (price) tour.price = price;
    if (duration) tour.duration = duration;
    if (timings) tour.timings = timings;
    if (location) tour.location = location;

    // ✅ NAYA FIELD - Terms and Conditions
    if (termsAndConditions !== undefined)
      tour.termsAndConditions = termsAndConditions;

    if (cancellationPolicy !== undefined) {
      tour.cancellationPolicy = parseCancellationPolicy(cancellationPolicy);
    }

    // ✅ Date fields
    if (startDate) tour.startDate = new Date(startDate);
    if (endDate) tour.endDate = new Date(endDate);

    // ✅ Array fields (safe parser)
    tour.highlights = parseArray(highlights);
    tour.inclusions = parseArray(inclusions);
    tour.exclusions = parseArray(exclusions);
    tour.relatedTours = parseArray(relatedTours);

    if (maxGuests) tour.maxGuests = maxGuests;

    // ✅ Image update
    if (req.files?.mainImage) {
      tour.mainImage = req.files.mainImage[0].path.replace(/\\/g, "/");
    }
    if (req.files?.galleryImages) {
      tour.galleryImages = req.files.galleryImages.map((file) =>
        file.path.replace(/\\/g, "/")
      );
    }

    await tour.save();
    res.json({ message: "Tour updated successfully", tour });
  } catch (err) {
    console.error("❌ Error updating tour:", err);
    res.status(500).json({ message: err.message });
  }
};

// 🟣 Check Availability
export const checkAvailability = async (req, res) => {
  try {
    const { tourId, date, guests } = req.body;

    const tour = await Tour.findById(tourId);
    if (!tour) return res.status(404).json({ message: "Tour not found" });

    const selectedDate = new Date(date);
    const startDate = new Date(tour.startDate);
    const endDate = new Date(tour.endDate);

    // Check if selected date is within tour date range
    const isDateAvailable =
      selectedDate >= startDate && selectedDate <= endDate;
    const isGuestAvailable = guests <= tour.maxGuests;

    if (isDateAvailable && isGuestAvailable) {
      return res.json({ available: true });
    } else {
      return res.json({
        available: false,
        reason: !isDateAvailable
          ? "Selected date is not within tour dates"
          : "Number of guests exceeds limit",
      });
    }
  } catch (error) {
    console.error("❌ Error checking availability:", error);
    res.status(500).json({ message: "Server error" });
  }
};
