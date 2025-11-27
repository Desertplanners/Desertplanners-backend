import HolidayTour from "../models/HolidayTour.js";
import HolidayCategory from "../models/holidayCategoryModel.js";
import slugify from "slugify";
import SEO from "../models/SEO.js";

// =============================================================
// ⭐ CREATE HOLIDAY TOUR (SEO INCLUDED)
// =============================================================
export const createHolidayTour = async (req, res) => {
  try {
    const {
      title,
      duration,
      category,
      priceAdult,
      priceChild,
      description,
      highlights,
      knowBefore,
      inclusions,
      exclusions,
      cancellationPolicy,
      terms,
      itineraryTitle,
    } = req.body;

    // Slider Images
    const sliderImages = req.files?.sliderImages
      ? req.files.sliderImages.map((img) => img.path)
      : [];

    // Itinerary Images
    const itineraryImages = req.files?.itineraryImages
      ? req.files.itineraryImages.map((img) => img.path)
      : [];

    const itinerary = (itineraryTitle || []).map((t, index) => ({
      day: index + 1,
      title: t,
      image: itineraryImages[index] || "",
    }));

    const tour = new HolidayTour({
      title,
      slug: slugify(title, { lower: true, strict: true }),
      duration,
      category,
      priceAdult,
      priceChild,
      description,
      sliderImages,
      highlights: JSON.parse(highlights),
      knowBefore,
      inclusions,
      exclusions,
      cancellationPolicy,
      terms,
      itinerary,
    });

    await tour.save();

    // ⭐ AUTO-CREATE SEO ENTRY
    await SEO.create({
      parentType: "holiday",
      parentId: tour._id,
      seoTitle: title,
      seoDescription: description?.slice(0, 160),
      seoKeywords: "",
      seoOgImage: sliderImages[0] || "",
      faqs: [],
      ratingAvg: 4.9,
      ratingCount: 15,
    });

    res.status(201).json({ success: true, message: "Created", tour });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// =============================================================
// ⭐ GET ALL HOLIDAY TOURS
// =============================================================
export const getAllHolidayTours = async (req, res) => {
  try {
    const tours = await HolidayTour.find().populate("category");
    res.json({ success: true, tours });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// =============================================================
// ⭐ GET SINGLE HOLIDAY TOUR BY ID
// =============================================================
export const getHolidayTourById = async (req, res) => {
  try {
    const tour = await HolidayTour.findById(req.params.id).populate("category");
    if (!tour) return res.status(404).json({ message: "Tour not found" });

    res.json({ success: true, tour });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =============================================================
// ⭐⭐ UPDATE HOLIDAY TOUR + SEO UPDATE ⭐⭐
// =============================================================
export const updateHolidayTour = async (req, res) => {
  try {
    const tour = await HolidayTour.findById(req.params.id);
    if (!tour) return res.status(404).json({ message: "Tour not found" });

    // -------- BASIC FIELDS --------
    tour.title = req.body.title;
    tour.slug = slugify(req.body.title, { lower: true, strict: true });
    tour.duration = req.body.duration;
    tour.category = req.body.category;
    tour.priceAdult = req.body.priceAdult;
    tour.priceChild = req.body.priceChild;
    tour.description = req.body.description;
    tour.highlights = JSON.parse(req.body.highlights);

    // -------- SLIDER IMAGE UPDATE --------
    let finalSlider = [...tour.sliderImages];

    if (req.body.removeSliderImages) {
      const toRemove = JSON.parse(req.body.removeSliderImages);
      finalSlider = finalSlider.filter((img) => !toRemove.includes(img));
    }

    if (req.body.existingSliderImages) {
      finalSlider = JSON.parse(req.body.existingSliderImages);
    }

    if (req.files?.sliderImages?.length > 0) {
      const newSlider = req.files.sliderImages.map((img) => img.path);
      finalSlider = [...finalSlider, ...newSlider];
    }

    tour.sliderImages = finalSlider;

    // -------- ITINERARY IMAGES UPDATE --------
    const titles = Array.isArray(req.body.itineraryTitle)
      ? req.body.itineraryTitle
      : [req.body.itineraryTitle];

    let newImages = Array(titles.length).fill(null);

    if (req.files) {
      Object.keys(req.files).forEach((fieldName) => {
        if (fieldName.startsWith("itineraryImages_")) {
          const index = Number(fieldName.split("_")[1]);
          const file = req.files[fieldName][0];
          if (file) newImages[index] = file.path;
        }
      });
    }

    tour.itinerary = titles.map((t, index) => ({
      day: index + 1,
      title: t,
      image:
        newImages[index] === "__KEEP_OLD__"
          ? tour.itinerary[index]?.image || ""
          : newImages[index] || tour.itinerary[index]?.image || "",
    }));

    // -------- OTHER ARRAYS --------
    tour.knowBefore = req.body.knowBefore || [];
    tour.inclusions = req.body.inclusions || [];
    tour.exclusions = req.body.exclusions || [];
    tour.cancellationPolicy = req.body.cancellationPolicy || [];
    tour.terms = req.body.terms || [];

    await tour.save();

    // ⭐ UPDATE SEO ON HOLIDAY UPDATE
    await SEO.findOneAndUpdate(
      { parentType: "holiday", parentId: tour._id },
      {
        seoTitle: tour.title,
        seoDescription: tour.description?.slice(0, 160),
        seoOgImage: tour.sliderImages[0] || "",
      },
      { upsert: true }
    );

    res.json({ success: true, message: "Updated", tour });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

// =============================================================
// ⭐ DELETE HOLIDAY TOUR
// =============================================================
export const deleteHolidayTour = async (req, res) => {
  try {
    await HolidayTour.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =============================================================
// ⭐ GET TOURS BY CATEGORY SLUG
// =============================================================
export const getToursByCategory = async (req, res) => {
  try {
    const category = await HolidayCategory.findOne({ slug: req.params.slug });
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    const tours = await HolidayTour.find({ category: category._id }).select(
      "title slug priceAdult sliderImages duration"
    );

    res.json({ success: true, tours });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =============================================================
// ⭐ GET PACKAGE BY SLUG (SEO INCLUDED)
// =============================================================
export const getHolidayPackageBySlug = async (req, res) => {
  try {
    const { packageSlug } = req.params;

    const tour = await HolidayTour.findOne({ slug: packageSlug }).populate(
      "category"
    );

    if (!tour) return res.status(404).json({ message: "Package not found" });

    const seo = await SEO.findOne({
      parentType: "holiday",
      parentId: tour._id,
    });

    res.json({ success: true, tour, seo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
