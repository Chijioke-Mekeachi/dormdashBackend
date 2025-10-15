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
db.createTable("profile", ["Fullname", "Email", "Mode", "Number", "level", "active:num", "rented:num", "studentMessage:num"]);

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
      active: 0,
      rented: 0,
      studentMessage:0,
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
      active: data.active,
      rented: data.rented,
      student: data.studentMessage
    });
  } catch (err) {
    console.error("Profile retrieval error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
route.put("/updateListingStatus", async (req, res) => {
  try {
    const { email, active , rented, student } = req.body;
    await db.update("profile", {active: active, rented: rented, studentMessage: student }, "Email", email);
    return res.status(201).json({ message: "Status updated successfully" });
  } catch (err) {
    console.error("Update listing error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
route.post('/getAnalysis', async (req, res)=>{
  try{
    const {email} = req.body;
    const analysis = await db.findBy("profile","Email",email);
    return res.status(200).json({active: analysis.active, rented: analysis.rented , student: analysis.studentMessage});
  }catch(err){
    console.error("Update listing error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
})

route.post('/updateListing',async (req, res)=>{
  // let rentedS ;
  try{
    const {email, rented, active} = req.body;
    if(rented > 1 && active > 1 || active < -1 || rented < -1 ){
      res.status(403).json({message: "Stop Trying to hack me.."})
    }
    const rentedData =  await db.findBy('profile','Email',email);
    console.log(`rented ${rented}, active : ${active}`);
      const newRent = rentedData.rented === 0  && rented <  0 ? 0  : rentedData.rented + rented;
      const newActive =  rentedData.active === 0 && active < 0 ? 0 : rentedData.active + active;
      console.log(`Original Rent : ${rentedData.rented} Original Active: ${rentedData.active}`)
      console.log(`newRent :${newRent}, newActive: ${newActive}`);
      await db.update('profile', {rented: newRent, active: newActive}, 'Email', email);
    // console.log(newRent);
    console.log("Updated the analysis")
    return res.status(201).json({message: "Successfully updated"})
  }catch(err){
    console.error("Update listing error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
})


// ✅ UPDATE PROFILE ENDPOINT
route.put("/updateProfile", async (req, res) => {
  try {
    const { email, password, fullName, mode, number, level, active, rented, messages } = req.body;

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

