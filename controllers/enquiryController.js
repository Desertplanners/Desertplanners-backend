// backend/controllers/enquiryController.js
import Enquiry from "../models/Enquiry.js";
import nodemailer from "nodemailer";

// Create new enquiry
export const createEnquiry = async (req, res) => {
  try {
    const enquiry = new Enquiry(req.body);
    await enquiry.save();

    // Nodemailer setup
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.ADMIN_EMAIL,
      to: process.env.ADMIN_EMAIL,
      subject: `New Enquiry: ${enquiry.services}`,
      html: `<p><b>Name:</b> ${enquiry.name}</p>
             <p><b>Email:</b> ${enquiry.email}</p>
             <p><b>Contact:</b> ${enquiry.contactNumber}</p>
             <p><b>Service:</b> ${enquiry.services}</p>
             <p><b>Message:</b> ${enquiry.message}</p>`,
    });

    res.status(201).json({ success: true, message: "Enquiry submitted successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all enquiries (admin only)
export const getEnquiries = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status = "" } = req.query;

    const query = {
      $and: [
        search ? { name: { $regex: search, $options: "i" } } : {},
        status ? { status } : {},
      ],
    };

    const enquiries = await Enquiry.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Enquiry.countDocuments(query);

    res.status(200).json({ enquiries, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update enquiry status
export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.status(200).json({ success: true, enquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete enquiry
export const deleteEnquiry = async (req, res) => {
  try {
    await Enquiry.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Enquiry deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

