// server/routes/init.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Import our database models (we'll create these next)
const Settings = require('../models/Settings');
const Admin = require('../models/Admin');

/**
 * @route   GET /api/init/check
 * @desc    Check if the system has been initialized
 * @access  Public
 */
router.get('/check', async (req, res) => {
    try {
        // Check for the existence of the Settings collection
        const settingsCount = await mongoose.connection.db.collection('settings').countDocuments();
        
        // If the settings collection exists and has at least one document,
        // the system is considered initialized.
        if (settingsCount > 0) {
            return res.json({ initialized: true });
        } else {
            return res.json({ initialized: false });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   POST /api/init/setup
 * @desc    Initialize the system with an admin user and site settings
 * @access  Public
 */
router.post('/setup', async (req, res) => {
    const { siteName, adminUserName, adminEmail, adminPassword } = req.body;

    try {
        // First, check again to prevent re-initialization
        const settingsCount = await mongoose.connection.db.collection('settings').countDocuments();
        if (settingsCount > 0) {
            return res.status(400).json({ msg: 'System already initialized' });
        }

        // --- Step 1: Create the new Admin User ---
        // Validate input fields before proceeding
        if (!siteName || !adminUserName || !adminEmail || !adminPassword) {
            return res.status(400).json({ msg: 'All fields are required.' });
        }

        // Check if an admin with the same email already exists (even though we're checking if the system is initialized)
        let adminExists = await Admin.findOne({ email: adminEmail });
        if (adminExists) {
             return res.status(400).json({ msg: 'Admin with that email already exists.' });
        }

        // Generate a salt and hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        // Create a new Admin document
        const newAdmin = new Admin({
            userName: adminUserName,
            email: adminEmail,
            password: hashedPassword,
            createdDate: new Date(),
        });

        // Save the new admin to the database
        await newAdmin.save();
        
        // --- Step 2: Create the Settings Document ---
        const settings = new Settings({
            siteName: siteName,
            version: '1.0.0', // Initial version
        });

        // Save the settings to the database
        await settings.save();

        res.json({ msg: 'System initialized successfully', success: true });

    } catch (err) {
        // Log the full error object for detailed debugging
        console.error('Initialization Error:', err);
        // Respond with a more detailed message if possible, or a generic one
        res.status(500).json({ msg: 'An unexpected error occurred during initialization.' });
    }
});

module.exports = router;