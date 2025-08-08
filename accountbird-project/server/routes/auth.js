// server/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import both the Admin and User models
const Admin = require('../models/Admin');
const User = require('../models/User');

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate admin or user and get token
 * @access  Public
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // 1. Input validation
    if (!email || !password) {
        return res.status(400).json({ msg: 'Please enter all fields.' });
    }

    try {
        let user = null;
        let role = null;

        // 2. Check for admin user first
        const admin = await Admin.findOne({ email });
        if (admin) {
            user = admin;
            role = 'admin';
        } else {
            // 3. If not an admin, check for a regular user
            const regularUser = await User.findOne({ email });
            if (regularUser) {
                user = regularUser;
                role = regularUser.role;
            }
        }

        // 4. If no user is found in either collection, return an error
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials.' });
        }

        // 5. Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials.' });
        }

        // 6. Create and sign JWT with a unified payload structure
        const payload = {
            user: {
                id: user.id,
                role: role,
            },
        };
        // If the user has an accountId, add it to the payload
        if (user.accountId) {
            payload.user.accountId = user.accountId;
        }

        // Sign the token with your secret from the .env file
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        role: role,
                        // If it's a regular user, include their name
                        firstName: user.firstName,
                        lastName: user.lastName,
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