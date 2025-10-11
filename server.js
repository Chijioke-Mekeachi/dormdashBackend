const db = require('./database/SqliteAuto');
const express = require('express');
const cors = require('cors');
const { json } = require('stream/consumers');
// const { brotliDecompress } = require('zlib');
const port = 2100;

const app = express();
app.use(cors());
app.use(express.json())

// initializing the database
db.init("dormDash.db", true);
app.get('/', (req, res)=>{return res.json({message: "Server is Running"})})

app.use('/auth', require('./routes/auth'));
app.use('/profile', require('./routes/profile'));
app.use('/product', require('./routes/properties'));
app.use('/messages', require('./routes/messages'));
app.use('/payments', require('./routes/payments'));
app.use('/admin', require('./routes/admin'));
app.use('/agent', require('./routes/agent'));
app.use('/favorites', require('./routes/favorites'));
// serve uploaded files
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// mount utility routes under /meta to avoid root conflicts
app.use('/meta', require('./routes/utility'));

app.listen(port, ()=>{console.log(`Server Running At https://localhost${port}`)})
