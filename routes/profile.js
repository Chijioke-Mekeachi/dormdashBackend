const express = require("express");
const cors = require("cors");
const db = require("../database/SqliteAuto"); // your custom SQLite wrapper

const route = express.Router();

route.use(cors());
route.use(express.json());

// Ensure the table exists
db.createTable("profile", ["Fullname", "Email", "Mode", "Number","level"]);

// ✅ CREATE PROFILE ENDPOINT
route.post("/createProfile", async (req, res) => {
  try {
    const { fullName, email, mode, number, password , level} = req.body;

    if (!fullName || !email || !mode || !number || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    try {
      await db.authLogin({ email, password });
    } catch (err) {
      return res.status(400).json({ error: "User has no account" });
    }

    const existing = await db.findBy("profile", "Email", email);
    if (existing) {
      return res.status(400).json({ error: "Profile already exists" });
    }

    await db.insert("profile", {
      Fullname: fullName,
      Email: email,
      Mode: mode,
      Number: number,
      level:level,
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

module.exports = route;
