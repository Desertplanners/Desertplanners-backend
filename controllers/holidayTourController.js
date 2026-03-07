import HolidayTour from "../models/HolidayTour.js";
import HolidayCategory from "../models/holidayCategoryModel.js";
import slugify from "slugify";
import SEO from "../models/SEO.js";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
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

    let itinerary = [];
    try {
      itinerary = JSON.parse(req.body.itinerary || "[]");
    } catch (e) {
      itinerary = [];
    }

    const uploadedImages = req.files?.itineraryImages || [];

    uploadedImages.forEach((file, i) => {
      if (itinerary[i]) {
        itinerary[i].image = file.path;
      }
    });

    itinerary = itinerary.map((day, index) => ({
      day: index + 1,
      title: day.title,
      image: day.image || "",
      points: Array.isArray(day.points) ? day.points : [],
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
      // 🔥 ADD
      status: req.body.status || "draft",
    });

    if (tour.status === "published") {
      tour.publishedAt = new Date();
    }

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
    const isAdmin = req.query.admin === "true" || req.user?.role === "admin";

    const filter = isAdmin ? {} : { status: "published" };

    const tours = await HolidayTour.find(filter)
      .populate("category")
      .sort({ createdAt: -1 });

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

    // 🔥 Draft → Published (FIRST TIME ONLY)
    if (req.body.status === "published" && !tour.publishedAt) {
      tour.publishedAt = new Date();
    }

    if (req.body.status) {
      tour.status = req.body.status;
    }
    tour.sliderImages = finalSlider;

    // -------- MODERN ITINERARY UPDATE --------

    // Parse itinerary JSON
    let itinerary = [];
    try {
      itinerary = JSON.parse(req.body.itinerary || "[]");
    } catch (e) {
      itinerary = [];
    }

    // New uploaded itinerary images
    const itineraryImages = req.files?.itineraryImages || [];

    // Indexes sent from frontend
    let imageIndexes = req.body.itineraryImageIndexes || [];

    if (!Array.isArray(imageIndexes)) {
      imageIndexes = [imageIndexes];
    }

    // Attach new images to correct index
    itineraryImages.forEach((file, i) => {
      const index = Number(imageIndexes[i]);
      if (!isNaN(index) && itinerary[index]) {
        itinerary[index].image = file.path;
      }
    });

    // Preserve old images if no new image uploaded
    tour.itinerary = itinerary.map((day, index) => ({
      day: index + 1,
      title: day.title || "",
      image: day.image || tour.itinerary[index]?.image || "",
      points: Array.isArray(day.points)
        ? day.points
        : typeof day.points === "string"
        ? [day.points]
        : [],
    }));

    // -------- OTHER ARRAYS --------
    tour.knowBefore = req.body.knowBefore || [];
    tour.inclusions = req.body.inclusions || [];
    tour.exclusions = req.body.exclusions || [];
    tour.cancellationPolicy = req.body.cancellationPolicy || [];
    tour.terms = req.body.terms || [];

    await tour.save();

    // ⭐ UPDATE SEO ON HOLIDAY UPDATE
    const existingSEO = await SEO.findOne({
      parentType: "holiday",
      parentId: tour._id.toString(),
    });

    if (!existingSEO) {
      await SEO.create({
        parentType: "holiday",
        parentId: tour._id.toString(),
        seoTitle: tour.title,
        seoDescription: tour.description?.slice(0, 160),
        seoOgImage: tour.sliderImages[0] || "",
      });
    }

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
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // ✅ PUBLIC = ONLY PUBLISHED
    const tours = await HolidayTour.find({
      category: category._id,
      status: "published",
    }).select("title slug priceAdult sliderImages duration");

    // ✅ RETURN ARRAY ONLY
    res.json(tours);
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

    const tour = await HolidayTour.findOne({
      slug: packageSlug,
      status: "published",
    }).populate("category");

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

export const downloadItinerary = async (req, res) => {
  try {
  const tour = await HolidayTour.findOne({ slug: req.params.slug });

  if (!tour) return res.status(404).send("Tour not found");

  const html = `
  <html>
  
  <head>
  <style>
  
  body{
  font-family: 'Arial';
  margin:0;
  padding:0;
  color:#333;
  background:#f5f5f5;
  }
  
  /* COVER */
  
  .cover{
  position:relative;
  height:420px;
  overflow:hidden;
  }
  
  .cover img{
  width:100%;
  height:420px;
  object-fit:cover;
  }
  
  .cover-overlay{
  position:absolute;
  top:0;
  left:0;
  right:0;
  bottom:0;
  background:linear-gradient(180deg,rgba(0,0,0,0.4),rgba(0,0,0,0.8));
  display:flex;
  flex-direction:column;
  justify-content:center;
  align-items:center;
  color:white;
  text-align:center;
  }
  
  .cover-title{
  font-size:40px;
  font-weight:bold;
  letter-spacing:1px;
  }
  
  .cover-duration{
  font-size:18px;
  margin-top:10px;
  }
  
  /* SECTION */
  
  .section{
  padding:40px;
  background:white;
  margin:30px;
  border-radius:12px;
  box-shadow:0 5px 20px rgba(0,0,0,0.08);
  }
  
  .section-title{
  font-size:26px;
  margin-bottom:20px;
  color:#721011;
  border-left:5px solid #e82429;
  padding-left:12px;
  }
  
  /* DESCRIPTION */
  
  .description{
  font-size:15px;
  line-height:1.7;
  color:#555;
  }

  /* HIGHLIGHTS */

.highlight-grid{
display:flex;
gap:20px;
margin-top:15px;
flex-wrap:wrap;
}

.highlight-card{
flex:1;
min-width:160px;
background:#fff4f4;
padding:20px;
border-radius:10px;
text-align:center;
border:1px solid #ffdcdc;
}

.highlight-number{
font-size:22px;
font-weight:bold;
color:#721011;
}

.highlight-label{
font-size:13px;
color:#666;
margin-top:5px;
}
  
  /* ITINERARY */
  
  .day-card{
  margin-bottom:35px;
  border-radius:12px;
  overflow:hidden;
  border:1px solid #eee;
  }
  
  .day-image img{
  width:100%;
  height:280px;
  object-fit:cover;
  }
  
  .day-content{
  padding:20px;
  }
  
  .day-title{
  font-size:20px;
  font-weight:bold;
  margin-bottom:10px;
  color:#721011;
  }
  
  ul{
  padding-left:20px;
  }
  
  li{
  margin-bottom:6px;
  line-height:1.6;
  }
  
  /* TWO COLUMN */
  
  .two-col{
  display:flex;
  gap:25px;
  }
  
  .card{
  flex:1;
  background:#fff4f4;
  padding:20px;
  border-radius:10px;
  border:1px solid #ffdcdc;
  }
  
  .card h3{
  margin-bottom:10px;
  color:#721011;
  }
  
  /* POLICY */
  
  .policy{
  background:#fafafa;
  padding:20px;
  border-radius:10px;
  margin-top:10px;
  border-left:4px solid #e82429;
  }
  
  /* FOOTER */
  
  .footer{
  text-align:center;
  padding:20px;
  color:#999;
  font-size:12px;
  }
  
  </style>
  </head>
  
  
  <body>
  
  
  <!-- COVER -->
  
  <div class="cover">
  
  <img src="${tour.sliderImages?.[0] || ""}" />
  
  <div class="cover-overlay">
  
  <div class="cover-title">
  ${tour.title}
  </div>
  
  <div class="cover-duration">
  ${tour.duration}
  </div>
  
  </div>
  
  </div>
  
  
  <!-- DESCRIPTION -->
  
  <div class="section">
  
  <div class="section-title">
  Tour Overview
  </div>
  
  <div class="description">
  ${tour.description || ""}
  </div>
  
  </div>
  
  <!-- HIGHLIGHTS -->

<div class="section">

<div class="section-title">
Package Highlights
</div>

<div class="highlight-grid">

<div class="highlight-card">
<div class="highlight-number">
${tour.highlights?.nights || "-"}
</div>
<div class="highlight-label">
Nights
</div>
</div>

<div class="highlight-card">
<div class="highlight-number">
${tour.highlights?.persons || "-"}
</div>
<div class="highlight-label">
Persons
</div>
</div>

<div class="highlight-card">
<div class="highlight-number">
${tour.highlights?.room || "-"}
</div>
<div class="highlight-label">
Rooms
</div>
</div>

<div class="highlight-card">
<div class="highlight-number">
${tour.highlights?.mealPlan || "-"}
</div>
<div class="highlight-label">
Meal Plan
</div>
</div>

</div>

</div>
  <!-- ITINERARY -->
  
  <div class="section">
  
  <div class="section-title">
  Day Wise Itinerary
  </div>
  
  ${tour.itinerary
    .map(
      (day) => `
  
  <div class="day-card">
  
  ${
    day.image
      ? `
  <div class="day-image">
  <img src="${day.image}" />
  </div>
  `
      : ""
  }
  
  <div class="day-content">
  
  <div class="day-title">
  Day ${day.day} - ${day.title}
  </div>
  
  <ul>
  ${day.points.map((p) => `<li>${p}</li>`).join("")}
  </ul>
  
  </div>
  
  </div>
  
  `
    )
    .join("")}
  
  </div>
  
  
  <!-- INCLUSION EXCLUSION -->
  
  <div class="section">
  
  <div class="section-title">
  Package Details
  </div>
  
  <div class="two-col">
  
  <div class="card">
  
  <h3>Inclusions</h3>
  
  <ul>
  ${tour.inclusions.map((i) => `<li>${i}</li>`).join("")}
  </ul>
  
  </div>
  
  
  <div class="card">
  
  <h3>Exclusions</h3>
  
  <ul>
  ${tour.exclusions.map((i) => `<li>${i}</li>`).join("")}
  </ul>
  
  </div>
  
  </div>
  
  </div>
  
  
  <!-- CANCELLATION -->
  
  <div class="section">
  
  <div class="section-title">
  Cancellation Policy
  </div>
  
  ${tour.cancellationPolicy
    .map((c) => `<div class="policy">${c}</div>`)
    .join("")}
  
  </div>
  
  
  <!-- TERMS -->
  
  <div class="section">
  
  <div class="section-title">
  Terms & Conditions
  </div>
  
  ${tour.terms.map((t) => `<div class="policy">${t}</div>`).join("")}
  
  </div>
  
  
  <div class="footer">
  Generated by Desert Planners
  </div>
  
  
  </body>
  </html>
  `;
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });
  const page = await browser.newPage();

  await page.setContent(html, {
    waitUntil: ["load", "networkidle0"]
  });

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "10mm",
      bottom: "10mm",
      left: "10mm",
      right: "10mm",
    },
  });

  await browser.close();

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename=${tour.slug}-itinerary.pdf`,
  });

  res.send(pdf);
} catch (error) {
  console.error("PDF Error:", error);
  res.status(500).json({ message: "Failed to generate itinerary PDF" });
}
};



export const downloadFlyerWithLogo = async (req, res) => {
  try {
    const tour = await HolidayTour.findOne({ slug: req.params.slug });

    if (!tour) return res.status(404).send("Tour not found");

    const logoUrl =
      "https://desertplanners-backend.onrender.com/public/desertplanners_logo.png";

    const heroImage = tour.sliderImages?.[0] || "";

    const html = `
    <html>
    <head>
    <style>

    body{
      margin:0;
      font-family:Arial;
      background:#f5f5f5;
      color:#333;
    }

    /* HEADER */

    .header{
      display:flex;
      justify-content:space-between;
      align-items:center;
      padding:20px 40px;
      background:white;
      border-bottom:1px solid #eee;
    }

    .logo img{
      height:55px;
    }

    .price{
      background:#e82429;
      color:white;
      padding:10px 20px;
      border-radius:30px;
      font-weight:bold;
      font-size:14px;
    }

    /* HERO */

    .hero{
      position:relative;
    }

    .hero img{
      width:100%;
      height:320px;
      object-fit:cover;
    }

    .hero-overlay{
      position:absolute;
      bottom:30px;
      left:40px;
      color:white;
    }

    .hero-title{
      font-size:34px;
      font-weight:bold;
      text-shadow:0 4px 12px rgba(0,0,0,.6);
    }

    .hero-duration{
      font-size:18px;
      margin-top:6px;
    }

    /* SECTION */

    .section{
      background:white;
      margin:25px;
      padding:30px;
      border-radius:10px;
      box-shadow:0 6px 18px rgba(0,0,0,0.08);
    }

    .section-title{
      font-size:22px;
      color:#721011;
      margin-bottom:15px;
    }

    /* DESCRIPTION */

    .desc{
      line-height:1.7;
      color:#555;
      font-size:14px;
    }

    /* HIGHLIGHTS */

    .highlight-grid{
      display:flex;
      gap:15px;
      margin-top:15px;
    }

    .highlight{
      flex:1;
      background:#fff4f4;
      padding:15px;
      text-align:center;
      border-radius:8px;
      border:1px solid #ffdcdc;
    }

    .highlight h3{
      margin:0;
      color:#721011;
    }

    .highlight p{
      margin:0;
      font-size:12px;
      color:#666;
    }

    /* ITINERARY */

    .day{
      border-left:4px solid #e82429;
      padding-left:15px;
      margin-bottom:15px;
    }

    .day-title{
      font-weight:bold;
      margin-bottom:6px;
      color:#721011;
    }

    ul{
      padding-left:18px;
      margin:0;
    }

    li{
      margin-bottom:5px;
      font-size:13px;
    }

    /* FOOTER */

    .footer{
      background:#721011;
      color:white;
      text-align:center;
      padding:25px;
      margin-top:20px;
    }

    .contact{
      margin-top:5px;
      font-size:14px;
    }

    </style>
    </head>

    <body>

    <!-- HEADER -->

    <div class="header">

      <div class="logo">
        <img src="${logoUrl}">
      </div>

      <div class="price">
        Starting From AED ${tour.priceAdult || "On Request"}
      </div>

    </div>


    <!-- HERO -->

    <div class="hero">

      <img src="${heroImage}">

      <div class="hero-overlay">
        <div class="hero-title">${tour.title}</div>
        <div class="hero-duration">${tour.duration}</div>
      </div>

    </div>


    <!-- OVERVIEW -->

    <div class="section">

      <div class="section-title">
        Tour Overview
      </div>

      <div class="desc">
        ${tour.description || ""}
      </div>

    </div>


    <!-- HIGHLIGHTS -->

    <div class="section">

      <div class="section-title">
        Package Highlights
      </div>

      <div class="highlight-grid">

        <div class="highlight">
          <h3>${tour.highlights?.nights || "-"}</h3>
          <p>Nights</p>
        </div>

        <div class="highlight">
          <h3>${tour.highlights?.persons || "-"}</h3>
          <p>Persons</p>
        </div>

        <div class="highlight">
          <h3>${tour.highlights?.room || "-"}</h3>
          <p>Rooms</p>
        </div>

        <div class="highlight">
          <h3>${tour.highlights?.mealPlan || "-"}</h3>
          <p>Meal Plan</p>
        </div>

      </div>

    </div>


    <!-- ITINERARY PREVIEW -->

    <div class="section">

      <div class="section-title">
        Itinerary Preview
      </div>

      ${tour.itinerary
        .slice(0,3)
        .map(
          (d) => `
          <div class="day">
            <div class="day-title">Day ${d.day} - ${d.title}</div>
            <ul>
              ${d.points.slice(0,3).map((p)=>`<li>${p}</li>`).join("")}
            </ul>
          </div>
        `
        )
        .join("")}

    </div>


    <!-- INCLUSIONS -->

    <div class="section">

      <div class="section-title">
        Package Inclusions
      </div>

      <ul>
        ${tour.inclusions.map((i)=>`<li>${i}</li>`).join("")}
      </ul>

    </div>


    <!-- FOOTER -->

    <div class="footer">

      <div>Desert Planners Tourism LLC</div>

      <div class="contact">
      📞 +971 4 354 6677 | 🌐 www.desertplanners.net
      </div>

    </div>

    </body>
    </html>
    `;

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: ["load", "networkidle0"]
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        bottom: "10mm",
        left: "10mm",
        right: "10mm",
      },
    });

    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${tour.slug}-flyer.pdf`
    });

    res.send(pdf);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const downloadFlyerWithoutLogo = async (req, res) => {
  try {
    const tour = await HolidayTour.findOne({ slug: req.params.slug });

    if (!tour) return res.status(404).send("Tour not found");

    const heroImage = tour.sliderImages?.[0] || "";

    const html = `
    <html>
    <head>

    <style>

    body{
      margin:0;
      font-family:Arial;
      background:#f5f5f5;
      color:#333;
    }

    /* HERO */

    .hero{
      position:relative;
    }

    .hero img{
      width:100%;
      height:340px;
      object-fit:cover;
    }

    .overlay{
      position:absolute;
      bottom:30px;
      left:40px;
      color:white;
    }

    .title{
      font-size:36px;
      font-weight:bold;
      text-shadow:0 4px 10px rgba(0,0,0,.6);
    }

    .duration{
      margin-top:6px;
      font-size:18px;
    }

    /* SECTION */

    .section{
      background:white;
      margin:25px;
      padding:30px;
      border-radius:10px;
      box-shadow:0 6px 20px rgba(0,0,0,.08);
    }

    .section-title{
      font-size:22px;
      color:#721011;
      margin-bottom:15px;
    }

    .desc{
      line-height:1.7;
      color:#555;
    }

    /* HIGHLIGHTS */

    .highlight-grid{
      display:flex;
      gap:15px;
      margin-top:15px;
    }

    .highlight{
      flex:1;
      background:#fff4f4;
      padding:15px;
      border-radius:8px;
      text-align:center;
    }

    .highlight h3{
      margin:0;
      color:#721011;
    }

    .highlight p{
      margin:0;
      font-size:12px;
      color:#666;
    }

    /* ITINERARY */

    .day{
      border-left:4px solid #e82429;
      padding-left:15px;
      margin-bottom:15px;
    }

    .day-title{
      font-weight:bold;
      color:#721011;
      margin-bottom:5px;
    }

    ul{
      padding-left:18px;
      margin:0;
    }

    li{
      font-size:13px;
      margin-bottom:5px;
    }

    /* CTA */

    .cta{
      background:#e82429;
      color:white;
      text-align:center;
      padding:25px;
      margin:25px;
      border-radius:10px;
      font-size:18px;
      font-weight:bold;
    }

    </style>

    </head>

    <body>

    <!-- HERO -->

    <div class="hero">

      <img src="${heroImage}">

      <div class="overlay">
        <div class="title">${tour.title}</div>
        <div class="duration">${tour.duration}</div>
      </div>

    </div>


    <!-- OVERVIEW -->

    <div class="section">

      <div class="section-title">
      Tour Overview
      </div>

      <div class="desc">
      ${tour.description || ""}
      </div>

    </div>


    <!-- HIGHLIGHTS -->

    <div class="section">

      <div class="section-title">
      Package Highlights
      </div>

      <div class="highlight-grid">

        <div class="highlight">
          <h3>${tour.highlights?.nights || "-"}</h3>
          <p>Nights</p>
        </div>

        <div class="highlight">
          <h3>${tour.highlights?.persons || "-"}</h3>
          <p>Persons</p>
        </div>

        <div class="highlight">
          <h3>${tour.highlights?.room || "-"}</h3>
          <p>Rooms</p>
        </div>

        <div class="highlight">
          <h3>${tour.highlights?.mealPlan || "-"}</h3>
          <p>Meal Plan</p>
        </div>

      </div>

    </div>


    <!-- ITINERARY PREVIEW -->

    <div class="section">

      <div class="section-title">
      Itinerary Preview
      </div>

      ${tour.itinerary
        .slice(0,3)
        .map(
          (d)=>`
          <div class="day">

            <div class="day-title">
            Day ${d.day} - ${d.title}
            </div>

            <ul>
            ${d.points.slice(0,3).map(p=>`<li>${p}</li>`).join("")}
            </ul>

          </div>
        `
        )
        .join("")}

    </div>


    <!-- INCLUSIONS -->

    <div class="section">

      <div class="section-title">
      Package Inclusions
      </div>

      <ul>
      ${tour.inclusions.map(i=>`<li>${i}</li>`).join("")}
      </ul>

    </div>


    <!-- CTA -->

    <div class="cta">

    Book This Holiday Now  
    Contact +971 4 354 6677

    </div>

    </body>
    </html>
    `;

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: ["load", "networkidle0"]
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        bottom: "10mm",
        left: "10mm",
        right: "10mm",
      },
    });

    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${tour.slug}-flyer.pdf`
    });

    res.send(pdf);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
