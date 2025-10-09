const db = require('./database/SqliteAuto');
const express = require('express');
const cors = require('cors');
// const { brotliDecompress } = require('zlib');
const port = 2100;

const app = express();
app.use(cors());
app.use(express.json())

// initializing the database
db.init("dormDash.db", true);

app.use('/auth',require('./routes/auth'));
app.use('/profile',require('./routes/profile'));
app.use('/product', require('./routes/properties'))

app.listen(port, ()=>{console.log(`Server Running At https://localhost${port}`)})
