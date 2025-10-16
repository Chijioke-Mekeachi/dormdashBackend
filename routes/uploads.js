const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// ✅ Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ✅ Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// ✅ Multiple file upload route
router.post("/", upload.array("files", 10), (req, res) => {
  if (!req.files || req.files.length === 0)
    return res.status(400).json({ error: "No files uploaded" });

  // Construct full URLs
  const urls = req.files.map(
    (file) => `${req.protocol}://${req.get("host")}/uploads/${file.filename}`
  );

  res.json({ urls });
});

module.exports = router;
