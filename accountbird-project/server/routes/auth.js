// server/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import the Admin model (we'll need this to find the user)
const Admin = require('../models/Admin');

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate admin and get token
 * @access  Public
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // 1. Input validation
    if (!email || !password) {
        return res.status(400).json({ msg: 'Please enter all fields.' });
    }

    try {
        // 2. Check for existing admin
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(400).json({ msg: 'Invalid credentials.' });
        }

        // 3. Validate password
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials.' });
        }

        // 4. Create and sign JWT
        const payload = {
            admin: {
                id: admin.id,
                // We'll add roles later for access control
                // role: 'admin',
            },
        };

        // Sign the token with your secret from the .env file
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' }, // Token expires in 1 hour
            (err, token) => {
                if (err) throw err;
                // Return the token and user data
                res.json({
                    token,
                    user: {
                        id: admin.id,
                        userName: admin.userName,
                        email: admin.email,
                    },
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;