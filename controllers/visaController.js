  import Visa from "../models/Visa.js";
  import VisaCategory from "../models/visaCategoryModel.js";
  import slugify from "slugify";
  import { visaUpload } from "../middleware/visaUpload.js";
  import SEO from "../models/SEO.js"; // ✅ SEO MODEL IMPORTED

  // -------------------------------------
  // Helper Functions
  // -------------------------------------

  // Normalize to array
  const toArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
      } catch {}
      if (val.includes(",")) return val.split(",").map((v) => v.trim());
      return [val];
    }
    return [];
  };

  // -------------------------------------
  // CREATE VISA (⭐ SEO AUTO-CREATE)
  // -------------------------------------
  export const createVisa = async (req, res) => {
    try {
      const {
        title,
        price,
        overview,
        processingTime,
        visaType,
        entryType,
        validity,
        stayDuration,
        inclusions,
        exclusions,
        documents,
        relatedVisas,
        visaCategory,
        howToApply,
        termsAndConditions,
        status,
      } = req.body;

      if (!title || !price || !visaCategory) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Image handling
      let mainImage = "";
      if (req.file) mainImage = req.file.path;

      // Create slug
      const slug = slugify(title, { lower: true, strict: true });

      // Validate category
      const foundCategory = await VisaCategory.findById(visaCategory);
      if (!foundCategory)
        return res.status(404).json({ message: "Visa category not found" });

      // Create visa entry
      const newVisa = new Visa({
        title,
        slug,
        price,
        img: mainImage,
        overview: toArray(overview),
        processingTime,
        visaType,
        entryType,
        validity,
        stayDuration,
        inclusions: toArray(inclusions),
        exclusions: toArray(exclusions),
        documents: toArray(documents),
        relatedVisas: toArray(relatedVisas),
        howToApply: toArray(howToApply),
        termsAndConditions: toArray(termsAndConditions),
        visaCategory: foundCategory._id,
        status: status || "draft", // ⭐ DEFAULT DRAFT
      });
      if (newVisa.status === "published") {
        newVisa.publishedAt = new Date();
      }
      await newVisa.save();

      // ⭐ CREATE DEFAULT SEO ENTRY
      await SEO.create({
        parentType: "visa",
        parentId: newVisa._id,
        seoTitle: newVisa.title,
        seoDescription:
          typeof overview === "string"
            ? overview.slice(0, 160)
            : (overview?.[0] || "").slice(0, 160),
        seoKeywords: "",
        seoOgImage: newVisa.img,
        faqs: [],
        ratingAvg: 4.9,
        ratingCount: 15,
      });

      res.status(201).json({
        message: "Visa created successfully",
        visa: newVisa,
      });
    } catch (err) {
      console.error("❌ Error creating visa:", err);
      res.status(500).json({ error: err.message });
    }
  };

  // -------------------------------------
  // UPDATE VISA (⭐ SEO AUTO-UPDATE)
  // -------------------------------------
  export const updateVisa = async (req, res) => {
    try {
      const { id } = req.params;

      const {
        title,
        visaCategory,
        overview,
        inclusions,
        exclusions,
        documents,
        relatedVisas,
        howToApply,
        termsAndConditions,
        status, // ⭐ ADD
      } = req.body;

      const visa = await Visa.findById(id);
      if (!visa) return res.status(404).json({ message: "Visa not found" });

      // Image update
      if (req.file) visa.img = req.file.path;

      // Update fields
      if (title) visa.title = title;
      if (visaCategory) visa.visaCategory = visaCategory;
      if (overview) visa.overview = toArray(overview);
      if (inclusions) visa.inclusions = toArray(inclusions);
      if (exclusions) visa.exclusions = toArray(exclusions);
      if (documents) visa.documents = toArray(documents);
      if (relatedVisas) visa.relatedVisas = toArray(relatedVisas);
      if (howToApply) visa.howToApply = toArray(howToApply);
      if (termsAndConditions)
        visa.termsAndConditions = toArray(termsAndConditions);

      // 🔥 Draft → Published (FIRST TIME ONLY)
      if (status === "published" && !visa.publishedAt) {
        visa.publishedAt = new Date();
      }

      if (status) {
        visa.status = status;
      }
      await visa.save();

      const existingSEO = await SEO.findOne({
        parentType: "visa",
        parentId: visa._id.toString(),
      });

      if (!existingSEO) {
        await SEO.create({
          parentType: "visa",
          parentId: visa._id.toString(),
          seoTitle: visa.title,
          seoDescription: visa.overview?.[0]?.slice(0, 160) || "",
          seoOgImage: visa.img,
        });
      }

      res.json({ message: "Visa updated successfully", visa });
    } catch (err) {
      console.error("❌ Error updating visa:", err);
      res.status(500).json({ error: err.message });
    }
  };

  // -------------------------------------
  // GET ALL VISAS
  // -------------------------------------
  export const getAllVisas = async (req, res) => {
    try {
      const isAdmin = req.query.admin === "true" || req.user?.role === "admin";

      const filter = isAdmin
        ? {} // 👨‍💼 admin → draft + published
        : { status: "published" }; // 🌍 public → only published

      const visas = await Visa.find(filter)
        .populate("visaCategory", "name slug")
        .sort({ createdAt: -1 });

      res.json(visas);
    } catch (err) {
      console.error("❌ Error fetching visas:", err);
      res.status(500).json({ error: err.message });
    }
  };

  // -------------------------------------
  // GET VISA BY SLUG (⭐ SEO INCLUDED)
  // -------------------------------------
  export const getVisaBySlug = async (req, res) => {
    try {
      const visa = await Visa.findOne({
        slug: req.params.slug,
        status: "published", // 🔥 IMPORTANT
      }).populate("visaCategory", "name slug");

      if (!visa) return res.status(404).json({ message: "Visa not found" });

      const seo = await SEO.findOne({
        parentType: "visa",
        parentId: visa._id,
      });

      res.json({ visa, seo });
    } catch (err) {
      console.error("❌ Error fetching visa by slug:", err);
      res.status(500).json({ error: err.message });
    }
  };

  // -------------------------------------
  // DELETE VISA (⭐ DELETE SEO TOO)
  // -------------------------------------
  export const deleteVisa = async (req, res) => {
    try {
      const visa = await Visa.findByIdAndDelete(req.params.id);
      if (!visa) return res.status(404).json({ message: "Visa not found" });

      // Delete its SEO
      await SEO.findOneAndDelete({
        parentType: "visa",
        parentId: req.params.id,
      });

      res.json({ message: "Visa deleted successfully" });
    } catch (err) {
      console.error("❌ Error deleting visa:", err);
      res.status(500).json({ error: err.message });
    }
  };

  // -------------------------------------
  // GET VISA BY ID
  // -------------------------------------
  export const getVisaById = async (req, res) => {
    try {
      const visa = await Visa.findById(req.params.id).populate("visaCategory");

      if (!visa) {
        return res.status(404).json({
          success: false,
          message: "Visa not found",
        });
      }

      res.status(200).json({
        success: true,
        visa,
      });
    } catch (err) {
      console.error("❌ Error fetching visa by ID:", err);
      res.status(500).json({
        success: false,
        message: "Server error while fetching visa",
        error: err.message,
      });
    }
  };

  // -------------------------------------
  // GET VISAS BY CATEGORY SLUG
  // -------------------------------------
  export const getVisasByCategory = async (req, res) => {
    try {
      const category = await VisaCategory.findOne({ slug: req.params.slug });

      if (!category)
        return res.status(404).json({ message: "Visa category not found" });

      const visas = await Visa.find({ visaCategory: category._id })
        .populate("visaCategory", "name slug")
        .select("title slug price img");

      res.json(visas);
    } catch (err) {
      console.error("❌ Error fetching visas by category:", err);
      res.status(500).json({ error: err.message });
    }
  };
