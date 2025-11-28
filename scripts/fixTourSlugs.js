import dotenv from "dotenv";
import mongoose from "mongoose";
import Tour from "../models/Tour.js";

dotenv.config();

const cleanSlug = (str) => {
  return str
    .toLowerCase()
    .replace(/\+/g, "")
    .replace(/&/g, "")
    .replace(/\//g, "")
    .replace(/%/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const tours = await Tour.find({});
    console.log(`Found ${tours.length} tours`);

    for (let tour of tours) {
      const newSlug = cleanSlug(tour.title);

      if (tour.slug !== newSlug) {
        console.log(`Updating: ${tour.slug} → ${newSlug}`);
        tour.slug = newSlug;

        // ⭐ FIX: Skip validation
        await tour.save({ validateBeforeSave: false });
      }
    }

    console.log("All tour slugs cleaned successfully! 🚀");
    process.exit();
  } catch (error) {
    console.log("❌ ERROR:", error);
    process.exit(1);
  }
};

run();
