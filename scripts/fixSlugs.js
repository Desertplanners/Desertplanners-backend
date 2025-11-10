// scripts/fixSlugs.js
import dotenv from "dotenv";
import mongoose from "mongoose";
import slugify from "slugify";
import Category from "../models/categoryModel.js";

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const categories = await Category.find({ $or: [{ slug: "" }, { slug: { $exists: false } }] });
  for (const cat of categories) {
    cat.slug = slugify(cat.name, { lower: true, strict: true });
    await cat.save();
    console.log(`✅ Fixed slug for ${cat.name} → ${cat.slug}`);
  }
  console.log("🎉 Done");
  process.exit(0);
};
run();
