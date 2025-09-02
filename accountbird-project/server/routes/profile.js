// server/routes/profile.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth'); // Import our auth middleware

// Import our models
const User = require('../models/User');
const Admin = require('../models/Admin');

/**
 * @route   GET /api/profile
 * @desc    Get the current authenticated user's profile
 * @access  Private
 */
router.get('/', auth(), async (req, res) => {
    try {
        let user;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Find the user based on their role
        if (userRole === 'admin') {
            user = await Admin.findById(userId).select('-password');
        } else {
            user = await User.findById(userId).select('-password');
        }

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT /api/profile
 * @desc    Update authenticated user's profile
 * @access  Private
 */
router.put('/', auth(), async (req, res) => {
    // Destructure all fields, including the nested location object.
    const { firstName, lastName, userName, email, userBio, location } = req.body;
    
    // Validate userName format if it's being updated
    if (userName) {
        const userNameRegex = /^[a-zA-Z0-9_-]+$/;
        if (!userNameRegex.test(userName)) {
            return res.status(400).json({ msg: 'Username can only contain letters, numbers, dashes, and underscores.' });
        }
    }

    try {
        let user;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Check user's role to determine which model to use
        if (userRole === 'admin') {
            user = await Admin.findById(userId);
        } else {
            user = await User.findById(userId);
        }

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        
        // Check for uniqueness of email and userName if they are being updated
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ msg: 'Email is already in use.' });
            }
        }
        
        if (userName && userName !== user.userName) {
            const existingUser = await User.findOne({ userName });
            if (existingUser) {
                return res.status(400).json({ msg: 'Username is already in use.' });
            }
        }
        
        // Update fields directly on the user object to handle partial updates correctly.
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (userName) user.userName = userName;
        if (email) user.email = email;

        // Handle userBio field
        if (typeof userBio === 'string') {
            user.userBio = userBio;
        }

        // Handle the nested location object
        if (location && typeof location === 'object') {
            user.location = {
                ...user.location, // Spread existing location data
                ...location       // Overwrite with new data from the request body
            };
        }

        // Save the updated user document
        await user.save();
        
        // Retrieve the updated user, excluding the password
        const updatedUser = await user.constructor.findById(userId).select('-password');

        res.json(updatedUser);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT /api/profile/password
 * @desc    Update the current user's password
 * @access  Private
 */
router.put('/password', auth(), async (req, res) => {
    const { id, role } = req.user;
    const { oldPassword, newPassword } = req.body;

    // Validate input
    if (!oldPassword || !newPassword) {
        return res.status(400).json({ msg: 'Please enter both old and new passwords.' });
    }

    try {
        let user;
        if (role === 'admin') {
            user = await Admin.findById(id);
        } else {
            user = await User.findById(id);
        }

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Check if the old password is correct
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Incorrect old password.' });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();
        res.json({ msg: 'Password updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;