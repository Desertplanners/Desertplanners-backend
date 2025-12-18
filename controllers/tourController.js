import Tour from "../models/Tour.js";
import Category from "../models/categoryModel.js";
import slugify from "slugify";
import mongoose from "mongoose";
import SEO from "../models/SEO.js";

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

// 🟢 Add new tour (UPDATED for Adult + Child Price)
export const addTour = async (req, res) => {
  try {
    console.log("\n=================== 📦 ADD TOUR START ===================");
    console.log("🧾 Request Body:", JSON.stringify(req.body, null, 2));
    console.log(
      "📸 Files Received:",
      req.files ? Object.keys(req.files) : "❌ No files"
    );

    const {
      title,
      description,

      // ⭐ ACTUAL PRICES
      priceAdult,
      priceChild,

      // ⭐ DISCOUNT PRICES
      discountPriceAdult,
      discountPriceChild,

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
      pickupDropRequired,
    } = req.body;

    // ⭐ REQUIRED FIELD CHECK
    if (
      !title ||
      !description ||
      priceAdult === undefined ||
      !duration ||
      !category ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({
        message: "All required fields must be filled.",
      });
    }

    // ⭐ CATEGORY VALIDATION
    let foundCategory = null;
    if (mongoose.Types.ObjectId.isValid(category)) {
      foundCategory = await Category.findById(category);
    } else {
      foundCategory = await Category.findOne({
        $or: [{ slug: category }, { name: category }],
      });
    }

    if (!foundCategory) {
      return res.status(404).json({
        message: `Category not found or invalid ID: ${category}`,
      });
    }

    // ⭐ IMAGE HANDLING
    let mainImage = "";
    if (req.files?.mainImage?.length > 0) {
      mainImage = req.files.mainImage[0].path;
    } else {
      mainImage =
        "https://res.cloudinary.com/dmnzflxh6/image/upload/v1731234567/default-tour.webp";
    }

    const galleryImages =
      req.files?.galleryImages?.length > 0
        ? req.files.galleryImages.map((f) => f.path)
        : [];

    // ⭐ DATE VALIDATION
    const parsedStart = new Date(startDate);
    const parsedEnd = new Date(endDate);

    if (isNaN(parsedStart) || isNaN(parsedEnd)) {
      return res.status(400).json({
        message: "Invalid startDate or endDate format.",
      });
    }

    // ⭐ DISCOUNT PRICE VALIDATION
    if (
      discountPriceAdult !== undefined &&
      Number(discountPriceAdult) >= Number(priceAdult)
    ) {
      return res.status(400).json({
        message: "Discount price (Adult) must be less than actual price",
      });
    }

    if (
      discountPriceChild !== undefined &&
      discountPriceChild !== null &&
      discountPriceChild !== "" &&
      priceChild !== undefined &&
      priceChild !== null &&
      priceChild !== "" &&
      Number(discountPriceChild) >= Number(priceChild)
    ) {
      return res.status(400).json({
        message: "Discount price (Child) must be less than actual price",
      });
    }

    // ⭐ CREATE NEW TOUR
    const tour = new Tour({
      title,
      slug: slugify(title, { lower: true, strict: true }),
      description,

      // ⭐ ACTUAL PRICES
      priceAdult: Number(priceAdult),
      priceChild: priceChild ? Number(priceChild) : null,

      // ⭐ DISCOUNT PRICES
      discountPriceAdult:
        discountPriceAdult === "" || discountPriceAdult === null
          ? null
          : Number(discountPriceAdult),

      discountPriceChild:
        discountPriceChild === "" || discountPriceChild === null
          ? null
          : Number(discountPriceChild),

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
      startDate: parsedStart,
      endDate: parsedEnd,

      maxGuests: maxGuests ? Number(maxGuests) : 12,
      termsAndConditions: termsAndConditions || "",
      relatedTours: parseArray(relatedTours),
      pickupDropRequired: pickupDropRequired === "true",
    });

    await tour.save();

    // ⭐ CREATE DEFAULT SEO
    await SEO.create({
      parentType: "tour",
      parentId: tour._id,
      seoTitle: title,
      seoDescription: description?.slice(0, 160),
      seoKeywords: "",
      seoOgImage: tour.mainImage,
      faqs: [],
      ratingAvg: 4.9,
      ratingCount: 20,
    });

    console.log("✅ Tour saved successfully:", tour.title);
    console.log("==================== ✅ ADD TOUR END ====================\n");

    res.status(201).json({
      message: "Tour added successfully",
      tour,
    });
  } catch (err) {
    console.error("\n❌ ADD TOUR ERROR:", err.message);
    return res.status(500).json({
      error: true,
      message: err.message || "Server Error in addTour",
    });
  }
};

// 🟠 Update Tour (UPDATED for Adult + Child Price)
export const updateTour = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      description,

      // ⭐ ACTUAL PRICES
      priceAdult,
      priceChild,

      // ⭐ DISCOUNT PRICES
      discountPriceAdult,
      discountPriceChild,

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
      removeGalleryImages,
      pickupDropRequired,
    } = req.body;

    console.log("🟠 Updating Tour:", id);

    const tour = await Tour.findById(id);
    if (!tour) {
      return res.status(404).json({ message: "Tour not found" });
    }

    // ⭐ MAIN IMAGE UPDATE
    if (req.files?.mainImage?.length > 0) {
      tour.mainImage = req.files.mainImage[0].path;
    }

    // ⭐⭐⭐ GALLERY IMAGES UPDATE
    let updatedGallery = [...tour.galleryImages];

    // Remove images
    if (removeGalleryImages) {
      try {
        const removeList = JSON.parse(removeGalleryImages);
        updatedGallery = updatedGallery.filter(
          (img) => !removeList.includes(img)
        );
      } catch (err) {
        console.log("❌ Error parsing removeGalleryImages:", err);
      }
    }

    // Add new images
    if (req.files?.galleryImages?.length > 0) {
      const newImages = req.files.galleryImages.map((f) => f.path);
      updatedGallery = [...updatedGallery, ...newImages];
    }

    tour.galleryImages = updatedGallery;

    // ⭐ BASIC FIELDS UPDATE
    if (title) {
      tour.title = title;
      tour.slug = slugify(title, { lower: true });
    }
    if (pickupDropRequired !== undefined) {
      tour.pickupDropRequired = pickupDropRequired === "true";
    }
    if (description) tour.description = description;
    if (duration) tour.duration = duration;
    if (timings) tour.timings = timings;
    if (location) tour.location = location;
    if (termsAndConditions !== undefined)
      tour.termsAndConditions = termsAndConditions;

    // ⭐ DISCOUNT PRICE VALIDATION
    // ⭐ DISCOUNT PRICE VALIDATION (CLEAN)

    if (
      discountPriceAdult &&
      Number(discountPriceAdult) >= Number(priceAdult ?? tour.priceAdult)
    ) {
      return res.status(400).json({
        message: "Discount price (Adult) must be less than actual price",
      });
    }

    if (
      discountPriceChild &&
      Number(discountPriceChild) >= Number(priceChild ?? tour.priceChild)
    ) {
      return res.status(400).json({
        message: "Discount price (Child) must be less than actual price",
      });
    }

    // ⭐ PRICE UPDATE (FINAL & CLEAN)

    if (priceAdult !== undefined) {
      tour.priceAdult = Number(priceAdult);
    }

    if (discountPriceAdult !== undefined) {
      tour.discountPriceAdult =
        discountPriceAdult === "" || discountPriceAdult === null
          ? null
          : Number(discountPriceAdult);
    }

    if (priceChild !== undefined) {
      tour.priceChild =
        priceChild === "" || priceChild === null ? null : Number(priceChild);
    }

    if (discountPriceChild !== undefined) {
      tour.discountPriceChild =
        discountPriceChild === "" || discountPriceChild === null
          ? null
          : Number(discountPriceChild);
    }

    // ⭐ DATE VALIDATION
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({
        message: "End date cannot be before start date",
      });
    }

    if (startDate) tour.startDate = new Date(startDate);
    if (endDate) tour.endDate = new Date(endDate);

    if (maxGuests) tour.maxGuests = Number(maxGuests);

    // ⭐ CATEGORY
    if (category) {
      const cat = await Category.findById(category);
      if (cat) tour.category = cat._id;
    }

    // ⭐ ARRAY FIELDS
    tour.highlights = parseArray(highlights);
    tour.inclusions = parseArray(inclusions);
    tour.exclusions = parseArray(exclusions);
    tour.relatedTours = parseArray(relatedTours);

    // ⭐ CANCELLATION POLICY
    if (cancellationPolicy !== undefined) {
      tour.cancellationPolicy = parseCancellationPolicy(cancellationPolicy);
    }

    // ⭐ SEO UPDATE
    await SEO.findOneAndUpdate(
      { parentType: "tour", parentId: tour._id },
      {
        seoTitle: title || tour.title,
        seoDescription: description
          ? description.slice(0, 160)
          : tour.description.slice(0, 160),
        seoOgImage: tour.mainImage,
      },
      { upsert: true }
    );

    await tour.save();

    console.log("✅ Tour updated successfully:", tour.title);

    res.json({
      message: "Tour updated successfully",
      tour,
    });
  } catch (err) {
    console.error("❌ UPDATE TOUR ERROR:", err);
    return res.status(500).json({
      message: err.message,
    });
  }
};

// 🟡 Get All Tours
export const getTours = async (req, res) => {
  try {
    const tours = await Tour.find()
      .populate("category", "name")
      .populate(
        "relatedTours",
        "title priceAdult discountPriceAdult mainImage slug"
      );
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

    // ⭐ STAR – THIS ALREADY RETURNS SEO
    const seo = await SEO.findOne({
      parentType: "tour",
      parentId: tour._id.toString(),
    });

    res.json({
      tour,
      seo,
    });
  } catch (err) {
    console.error("❌ Error fetching tour:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getTourById = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);

    if (!tour) {
      return res.status(404).json({ message: "Tour not found" });
    }

    res.json(tour);
  } catch (err) {
    console.error("❌ GET_TOUR_BY_ID ERROR:", err);
    res.status(500).json({ message: "Server error" });
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
      .populate(
        "relatedTours",
        "title priceAdult discountPriceAdult mainImage slug"
      );

    res.json(tours);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
