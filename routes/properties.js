const express = require("express");
const cors = require("cors");
const db = require("../database/SqliteAuto");

const route = express.Router();
route.use(cors());
route.use(express.json());

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
