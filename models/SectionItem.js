import mongoose from "mongoose";

const sectionItemSchema = new mongoose.Schema(
  {
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
    },
    name: { type: String, required: true }, // example: city name, attraction title, etc.
    img: { type: String, required: true },
    link: { type: String },
    title: { type: String },
    price: { type: Number },
    duration: { type: String },
    description: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("SectionItem", sectionItemSchema);
