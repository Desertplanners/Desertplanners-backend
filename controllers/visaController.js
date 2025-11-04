import Visa from "../models/Visa.js";

// ✅ Get all visas
export const getAllVisas = async (req, res) => {
  try {
    const visas = await Visa.find();
    res.json(visas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get single visa by slug
export const getVisaBySlug = async (req, res) => {
  try {
    const visa = await Visa.findOne({ slug: req.params.slug });
    if (!visa) return res.status(404).json({ message: "Visa not found" });
    res.json(visa);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Add new visa
export const createVisa = async (req, res) => {
  try {
    const newVisa = new Visa(req.body);
    await newVisa.save();
    res.status(201).json(newVisa);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update visa
export const updateVisa = async (req, res) => {
  try {
    const updatedVisa = await Visa.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedVisa);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete visa
export const deleteVisa = async (req, res) => {
  try {
    await Visa.findByIdAndDelete(req.params.id);
    res.json({ message: "Visa deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
