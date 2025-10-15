const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const db = require('./database/SqliteAuto');

const app = express();
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Serve uploaded files
app.use('/uploads', express.static(uploadDir));

// Initialize database
db.init("dormDash.db", true);

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.use('/auth', require('./routes/auth'));
app.use('/profile', require('./routes/profile'));
app.use('/product', require('./routes/properties'));
app.use('/messages', require('./routes/messages'));
app.use('/payments', require('./routes/payments'));
app.use('/admin', require('./routes/admin'));
app.use('/agent', require('./routes/agent'));
app.use('/favorites', require('./routes/favorites'));
app.use('/reviews', require('./routes/landlord'));
app.use('/uploads', require('./routes/uploads'));
app.use('/meta', require('./routes/utility'));

// ✅ Export the app for Vercel
module.exports = app;
