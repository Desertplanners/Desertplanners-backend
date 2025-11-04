import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "Top Cities to Visit"
    key: { type: String, unique: true }, // unique identifier like "top_cities_to_visit"
    description: { type: String },
    visible: { type: Boolean, default: true }, // show/hide section
  },
  { timestamps: true }
);

// 🪄 Auto-generate unique 'key' if not provided
sectionSchema.pre("save", function (next) {
  if (!this.key) {
    // generate a slugified + timestamp-based key
    const baseKey = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_") // replace spaces/special chars with "_"
      .replace(/^_+|_+$/g, ""); // trim underscores
    this.key = `${baseKey}_${Date.now()}`;
  }
  next();
});

export default mongoose.model("Section", sectionSchema);
