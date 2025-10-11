const express = require("express");
const cors = require("cors");
const db = require("../database/SqliteAuto");

const route = express.Router();
route.use(cors());
route.use(express.json());

const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// Create table with typed columns
db.createTable("product", [
  "title",
  "type",
  "location:text",
  "rent:num",
  "bedrooms:int",
  "availability:text",
  "amnities:textarr",
  "boost:int",
  "description:text",
  "contactinfo:text",
  "pictures:textarr",
  "owneremail:text" // links product to creator
]);

// ✅ CREATE PRODUCT
route.post("/create", async (req, res) => {
  try {
    const product = req.body;

    if (!product.title || !product.type || !product.rent || !product.owneremail) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (Array.isArray(product.amnities))
      product.amnities = JSON.stringify(product.amnities);
    if (Array.isArray(product.pictures))
      product.pictures = JSON.stringify(product.pictures);

    await db.insert("product", product);

    return res.status(201).json({ message: "✅ Product created successfully" });
  } catch (err) {
    console.error("Error creating product:", err);
    return res.status(500).json({ error: "Internal server error" });
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

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("Error fetching products:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// SEARCH products
route.get('/search', async (req, res) => {
  try {
    const { q, location, propertyType, minPrice, maxPrice } = req.query;
    // Simple server-side filter: fetch all and filter in memory (small dataset)
    let data = await db.getAll('product');
    if (q) data = data.filter(p => (p.title||'').toLowerCase().includes(q.toLowerCase()));
    if (location) data = data.filter(p => (p.location||'').toLowerCase().includes(location.toLowerCase()));
    if (propertyType) data = data.filter(p => (p.type||'').toLowerCase() === propertyType.toLowerCase());
    if (minPrice) data = data.filter(p => Number(p.rent) >= Number(minPrice));
    if (maxPrice) data = data.filter(p => Number(p.rent) <= Number(maxPrice));

    const parsed = data.map((p) => ({
      ...p,
      amnities: p.amnities ? JSON.parse(p.amnities) : [],
      pictures: p.pictures ? JSON.parse(p.pictures) : [],
    }));

    return res.json({ results: parsed, total: parsed.length });
  } catch (err) {
    console.error('search error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET properties for owner (by auth or owneremail query)
route.get('/owner/:ownerEmail', async (req, res) => {
  try {
    const ownerEmail = req.params.ownerEmail || req.query.ownerEmail;
    if (!ownerEmail) return res.status(400).json({ error: 'ownerEmail required' });
    const data = await db.findAllBy('product', 'owneremail', ownerEmail);
    const parsed = data.map((p) => ({
      ...p,
      amnities: p.amnities ? JSON.parse(p.amnities) : [],
      pictures: p.pictures ? JSON.parse(p.pictures) : [],
    }));
    return res.json(parsed);
  } catch (err) {
    console.error('owner error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload images for property
route.post('/:id/images', upload.array('images', 12), async (req, res) => {
  try {
    const id = req.params.id;
    const files = req.files || [];
    const urls = files.map(f => `/uploads/${f.filename}`);
    // Append to existing pictures field
    const product = await db.findBy('product', 'id', id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const pictures = product.pictures ? JSON.parse(product.pictures) : [];
    const newPictures = pictures.concat(urls);
    await db.update('product', { pictures: JSON.stringify(newPictures) }, 'id', id);
    return res.json({ uploaded: urls });
  } catch (err) {
    console.error('upload images error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update product
route.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body;
    if (updates.amnities && Array.isArray(updates.amnities)) updates.amnities = JSON.stringify(updates.amnities);
    if (updates.pictures && Array.isArray(updates.pictures)) updates.pictures = JSON.stringify(updates.pictures);
    await db.update('product', updates, 'id', id);
    const updated = await db.findBy('product', 'id', id);
    if (updated.amnities) updated.amnities = JSON.parse(updated.amnities);
    if (updated.pictures) updated.pictures = JSON.parse(updated.pictures);
    return res.json(updated);
  } catch (err) {
    console.error('PUT product error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Boost product (simple implementation)
route.post('/:id/boost', async (req, res) => {
  try {
    const id = req.params.id;
    const { planId, duration, paymentRef } = req.body;
    // We'll store boost as a number timestamp in 'boost' column (expiresAt)
    const now = Date.now();
    const days = Number(duration) || 7;
    const expiresAt = now + days * 24 * 60 * 60 * 1000;
    await db.update('product', { boost: expiresAt }, 'id', id);
    return res.json({ boostId: `${id}-${Date.now()}`, expiresAt, status: 'active' });
  } catch (err) {
    console.error('boost error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get boost status
route.get('/:id/boost-status', async (req, res) => {
  try {
    const id = req.params.id;
    const product = await db.findBy('product', 'id', id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const expiresAt = Number(product.boost) || 0;
    const status = expiresAt > Date.now() ? 'active' : 'inactive';
    return res.json({ expiresAt, status });
  } catch (err) {
    console.error('boost-status error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ GET PRODUCT BY ID
route.get("/get/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const data = await db.findBy("product", "id", id);

    if (!data) return res.status(404).json({ error: "Product not found" });

    if (data.amnities) data.amnities = JSON.parse(data.amnities);
    if (data.pictures) data.pictures = JSON.parse(data.pictures);

    return res.status(200).json(data);
  } catch (err) {
    console.error("Error getting product:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ GET ALL PRODUCTS BY LOGIN (email + password)
route.post("/getByLogin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    try {
      await db.authLogin({ email, password });
    } catch (err) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const data = await db.findAllBy("product", "owneremail", email);

    if (!data || data.length === 0)
      return res.status(404).json({ message: "No products found for this user" });

    const parsed = data.map((p) => ({
      ...p,
      amnities: p.amnities ? JSON.parse(p.amnities) : [],
      pictures: p.pictures ? JSON.parse(p.pictures) : [],
    }));

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("Error fetching user products:", err);
    return res.status(500).json({ error: "Internal server error" });
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
