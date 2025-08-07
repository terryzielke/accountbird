// server/index.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables from .env file
dotenv.config();

const app = express();

// --- CRITICAL STEP ---
// The cors middleware MUST be placed here, BEFORE any routes are defined.
app.use(cors());

// The express.json() middleware must also be here
app.use(express.json());

// Database Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected successfully.');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

connectDB();

// API Routes
// Your routes should be defined after the middleware
app.use('/api/init', require('./routes/init'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));