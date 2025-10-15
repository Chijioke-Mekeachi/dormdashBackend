const db = require('./database/SqliteAuto');
const multer = require('multer');
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path'); // Add path module
const port = 2100;

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

// Initialize the database
db.init("dormDash.db", true);

// Health check route 
app.get('/', (req, res) => {
  return res.json({message: "Server is Running"})
});

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/profile', require('./routes/profile'));
app.use('/product', require('./routes/properties'));
app.use('/messages', require('./routes/messages'));
app.use('/payments', require('./routes/payments'));
app.use('/admin', require('./routes/admin'));
app.use('/agent', require('./routes/agent'));
app.use('/favorites', require('./routes/favorites'));
app.use('/reviews', require('./routes/landlord'));
app.use('/uploads', require('./routes/uploads')); // Add new upload route

// Mount utility routes under /meta to avoid root conflicts
app.use('/meta', require('./routes/utility'));

app.listen(port, () => {
  console.log(`Server Running At http://localhost:${port}`)
});