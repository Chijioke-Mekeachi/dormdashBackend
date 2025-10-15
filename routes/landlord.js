const express = require("express");
const cors = require("cors");
const db = require("../database/SqliteAuto");

const route = express.Router();
route.use(cors());
route.use(express.json());

// 🧱 Ensure necessary tables exist
db.createTable("listings", ["LandlordEmail", "Title", "Status"]); 
// Status: active | pending | rented

db.createTable("students", ["LandlordEmail", "Name", "PropertyID"]);

// ✅ CREATE LISTING (for landlord)
route.post("/createListing", async (req, res) => {
  try {
    const { landlordEmail, title, status } = req.body;
    if (!landlordEmail || !title || !status)
      return res.status(400).json({ error: "All fields are required" });

    await db.insert("listings", {
      LandlordEmail: landlordEmail,
      Title: title,
      Status: status,
    });

    return res.status(201).json({ message: "Listing created successfully" });
  } catch (err) {
    console.error("Create listing error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ UPDATE LISTING STATUS (approve, rent, etc.)
route.put("/updateListingStatus", async (req, res) => {
  try {
    const { id, status } = req.body;
    if (!id || !status)
      return res.status(400).json({ error: "id and status required" });

    await db.update("listings", { Status: status }, "id", id);
    return res.status(200).json({ message: "Status updated successfully" });
  } catch (err) {
    console.error("Update listing error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ FETCH DASHBOARD STATS
route.post("/dashboard", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    // Get counts for this landlord
    const active = await db.countWhere("listings", "LandlordEmail", email, "Status", "active");
    const pending = await db.countWhere("listings", "LandlordEmail", email, "Status", "pending");
    const rented = await db.countWhere("listings", "LandlordEmail", email, "Status", "rented");
    const students = await db.countWhereSimple("students", "LandlordEmail", email);

    return res.status(200).json({
      email,
      activeListings: active || 0,
      pendingApprovals: pending || 0,
      rentedProperties: rented || 0,
      totalStudents: students || 0,
    });
  } catch (err) {
    console.error("Dashboard fetch error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ FETCH ALL LISTINGS FOR LANDLORD
route.post("/getListings", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    const listings = await db.findAllBy("listings", "LandlordEmail", email);
    return res.json(listings);
  } catch (err) {
    console.error("getListings error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = route;
