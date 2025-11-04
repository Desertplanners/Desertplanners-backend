// backend/models/Enquiry.js
import mongoose from "mongoose";
import validator from "validator";

const EnquirySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    trim: true,
    validate: [validator.isEmail, "Invalid email address"]
  },
  contactNumber: {
    type: String,
    required: true,
    validate: [value => validator.isMobilePhone(value), "Invalid phone number"]
  },
  services: { type: String, required: true },
  message: { type: String, required: true, minlength: 5 },
  status: { type: String, enum: ["Pending", "Responded", "Closed"], default: "Pending" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Enquiry", EnquirySchema);
