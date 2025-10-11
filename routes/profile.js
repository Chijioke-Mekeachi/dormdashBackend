const express = require("express");
const cors = require("cors");
const db = require("../database/SqliteAuto"); // your custom SQLite wrapper

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

// Ensure the table exists
db.createTable("profile", ["Fullname", "Email", "Mode", "Number", "level"]);

// ✅ CREATE PROFILE ENDPOINT
route.post("/createProfile", async (req, res) => {
  try {
    const { fullName, email, mode, number, password, level } = req.body;

    if (!fullName || !email || !mode || !number || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Authenticate user first
    try {
      await db.authLogin({ email, password });
    } catch (err) {
      return res.status(400).json({ error: "User has no account" });
    }

    // Check if profile exists already
    const existing = await db.findBy("profile", "Email", email);
    if (existing) {
      return res.status(400).json({ error: "Profile already exists" });
    }

    await db.insert("profile", {
      Fullname: fullName,
      Email: email,
      Mode: mode,
      Number: number,
      level: level,
    });

    return res.status(201).json({ message: "Profile created successfully" });
  } catch (err) {
    console.error("Profile creation error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ GET PROFILE ENDPOINT
route.post("/getProfile", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    try {
      await db.authLogin({ email, password });
    } catch (err) {
      return res.status(400).json({ error: "User has no account" });
    }

    const data = await db.findBy("profile", "Email", email);
    if (!data) {
      return res.status(404).json({ error: "Profile not found" });
    }

    return res.status(200).json({
      Fullname: data.Fullname,
      Email: data.Email,
      Mode: data.Mode,
      Number: data.Number,
      level: data.level,
    });
  } catch (err) {
    console.error("Profile retrieval error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ UPDATE PROFILE ENDPOINT
route.put("/updateProfile", async (req, res) => {
  try {
    const { email, password, fullName, mode, number, level } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    // Authenticate user
    try {
      await db.authLogin({ email, password });
    } catch (err) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if profile exists
    const existing = await db.findBy("profile", "Email", email);
    if (!existing) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // Build update object dynamically (only update provided fields)
    const updateData = {};
    if (fullName) updateData.Fullname = fullName;
    if (mode) updateData.Mode = mode;
    if (number) updateData.Number = number;
    if (level) updateData.level = level;

    // Update in database
    await db.update("profile", updateData, "Email", email);

    return res.status(200).json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error("Profile update error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET profile by id
route.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const data = await db.findBy('profile', 'id', id);
    if (!data) return res.status(404).json({ error: 'Profile not found' });
    return res.json(data);
  } catch (err) {
    console.error('GET /profile/:id error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT profile by id (partial update)
route.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body;
    // Prevent password updates here
    delete updates.password;
    await db.update('profile', updates, 'id', id);
    const updated = await db.findBy('profile', 'id', id);
    return res.json(updated);
  } catch (err) {
    console.error('PUT /profile/:id error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload avatar
route.post('/upload-avatar', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file required' });
    const url = `/uploads/${req.file.filename}`;
    return res.json({ url });
  } catch (err) {
    console.error('upload-avatar error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = route;

