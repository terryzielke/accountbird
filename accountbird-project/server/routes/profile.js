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
 * @desc    Get the current user's profile
 * @access  Private
 */
router.get('/', auth(), async (req, res) => {
    try {
        const { id, role } = req.user;

        let user;
        if (role === 'admin') {
            user = await Admin.findById(id).select('-password');
        } else {
            user = await User.findById(id).select('-password');
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
    const { firstName, lastName, userName, email } = req.body;
    
    // Validate userName format if it's being updated
    if (userName) {
        const userNameRegex = /^[a-zA-Z0-9_-]+$/;
        if (!userNameRegex.test(userName)) {
            return res.status(400).json({ msg: 'Username can only contain letters, numbers, dashes, and underscores.' });
        }
    }
    
    const profileFields = {};
    if (firstName) profileFields.firstName = firstName;
    if (lastName) profileFields.lastName = lastName;
    if (userName) profileFields.userName = userName;
    if (email) profileFields.email = email;

    try {
        let user;
        // Check if the authenticated user is an admin or a regular user
        if (req.user.role === 'admin') {
            user = await Admin.findById(req.user.id);
        } else {
            user = await User.findById(req.user.id);
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
        
        // Update the user profile
        let updatedUser = await user.constructor.findByIdAndUpdate(
            req.user.id,
            { $set: profileFields },
            { new: true, runValidators: true }
        ).select('-password');

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