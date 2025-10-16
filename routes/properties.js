const express = require("express");
const cors = require("cors");
const db = require("../database/SqliteAuto");
const multer = require("multer");
const path = require("path");

const route = express.Router();
route.use(cors());
route.use(express.json());

// Configure Multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../uploads")),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// ✅ Create table with typed columns
db.createTable("product", [
  "title",
  "type",
  "location:text",
  "rent:num",
  "bedrooms:int",
  "availability:text",
  "amenities:textarr",   // ✅ fixed spelling
  "boost:int",
  "description:text",
  "contactinfo:text",
  "pictures:textarr",
  "owneremail:text",
]);


// ✅ CREATE PRODUCT
route.post("/create", async (req, res) => {
  try {
    const product = req.body;
    if (!product.title || !product.type || !product.rent || !product.owneremail)
      return res.status(400).json({ error: "Missing required fields" });

    if (Array.isArray(product.amnities))
      product.amnities = JSON.stringify(product.amnities);
    if (Array.isArray(product.pictures))
      product.pictures = JSON.stringify(product.pictures);

    await db.insert("product", product);
    res.status(201).json({ message: "✅ Property created successfully" });
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ GET ALL PRODUCTS
route.get("/all", async (req, res) => {
  try {
    const data = await db.getAll("product");
    const parsed = data.map((p) => ({
      ...p,
      amnities: p.amnities ? JSON.parse(p.amnities) : [],
      pictures: p.pictures ? JSON.parse(p.pictures) : [],
    }));
    res.json(parsed);
  } catch (err) {
    console.error("Error fetching all products:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ SEARCH PRODUCTS
route.get("/search", async (req, res) => {
  try {
    const { q, location, propertyType, minPrice, maxPrice } = req.query;
    let data = await db.getAll("product");

    if (q) data = data.filter((p) => (p.title || "").toLowerCase().includes(q.toLowerCase()));
    if (location) data = data.filter((p) => (p.location || "").toLowerCase().includes(location.toLowerCase()));
    if (propertyType) data = data.filter((p) => (p.type || "").toLowerCase() === propertyType.toLowerCase());
    if (minPrice) data = data.filter((p) => Number(p.rent) >= Number(minPrice));
    if (maxPrice) data = data.filter((p) => Number(p.rent) <= Number(maxPrice));

    const parsed = data.map((p) => ({
      ...p,
      amnities: p.amnities ? JSON.parse(p.amnities) : [],
      pictures: p.pictures ? JSON.parse(p.pictures) : [],
    }));

    res.json({ results: parsed, total: parsed.length });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ GET PROPERTIES BY OWNER
route.get("/owner/:ownerEmail", async (req, res) => {
  try {
    const ownerEmail = req.params.ownerEmail;
    const data = await db.findAllBy("product", "owneremail", ownerEmail);
    const parsed = data.map((p) => ({
      ...p,
      amnities: p.amnities ? JSON.parse(p.amnities) : [],
      pictures: p.pictures ? JSON.parse(p.pictures) : [],
    }));
    res.json(parsed);
  } catch (err) {
    console.error("Owner fetch error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ MARK PROPERTY AS RENTED / AVAILABLE
route.put("/:id/availability", async (req, res) => {
  try {
    const id = req.params.id;
    const { availability } = req.body;

    if (!availability)
      return res.status(400).json({ error: "Availability status required" });

    await db.update("product", { availability }, "id", id);
    const updated = await db.findBy("product", "id", id);

    if (updated.amnities) updated.amnities = JSON.parse(updated.amnities);
    if (updated.pictures) updated.pictures = JSON.parse(updated.pictures);

    res.json({ message: `✅ Property marked as ${availability}`, updated });
  } catch (err) {
    console.error("Availability update error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ UPLOAD PROPERTY IMAGES
route.post("/:id/images", upload.array("images", 12), async (req, res) => {
  try {
    const id = req.params.id;
    const files = req.files.map((f) => `/uploads/${f.filename}`);
    const product = await db.findBy("product", "id", id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const pictures = product.pictures ? JSON.parse(product.pictures) : [];
    const newPictures = [...pictures, ...files];
    await db.update("product", { pictures: JSON.stringify(newPictures) }, "id", id);

    res.json({ uploaded: files });
  } catch (err) {
    console.error("Image upload error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ UPDATE PRODUCT DETAILS
route.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body;

    if (Array.isArray(updates.amnities))
      updates.amnities = JSON.stringify(updates.amnities);
    if (Array.isArray(updates.pictures))
      updates.pictures = JSON.stringify(updates.pictures);

    await db.update("product", updates, "id", id);
    const updated = await db.findBy("product", "id", id);
    res.json(updated);
  } catch (err) {
    console.error("PUT product error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ BOOST PRODUCT
route.post("/:id/boost", async (req, res) => {
  try {
    const id = req.params.id;
    const { duration } = req.body;
    const now = Date.now();
    const days = Number(duration) || 7;
    const expiresAt = now + days * 24 * 60 * 60 * 1000;

    await db.update("product", { boost: expiresAt }, "id", id);
    res.json({ status: "active", expiresAt });
  } catch (err) {
    console.error("Boost error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ GET PRODUCT BY ID
route.get("/get/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const product = await db.findBy("product", "id", id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    if (product.amnities) product.amnities = JSON.parse(product.amnities);
    if (product.pictures) product.pictures = JSON.parse(product.pictures);

    res.json(product);
  } catch (err) {
    console.error("Get product error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ DELETE PRODUCT — Only creator can delete
route.delete("/delete/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    // Authenticate user
    try {
      await db.authLogin({ email, password });
    } catch (err) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Find product
    const product = await db.findBy("product", "id", id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    // Check ownership
    if (product.owneremail !== email) {
      return res.status(403).json({ error: "⛔ You are not the creator of this product" });
    }

    // Delete product
    await db.delete("product", "id", id);

    return res.status(200).json({ message: "🗑️ Product deleted successfully" });
  } catch (err) {
    console.error("Error deleting product:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = route;
