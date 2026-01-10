const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname))); // Serve static files


// Routes placeholders
const authRoutes = require('./routes/auth');
const searchRoutes = require('./routes/search');
const listRoutes = require('./routes/list');

app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/list', listRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
