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
 * @desc    Update the current user's profile
 * @access  Private
 */
router.put('/', auth(), async (req, res) => {
    const { id, role } = req.user;
    const { firstName, lastName, email, userName } = req.body;

    // Build user update object
    const userFields = {};
    if (firstName) userFields.firstName = firstName;
    if (lastName) userFields.lastName = lastName;
    if (email) userFields.email = email;
    if (userName) userFields.userName = userName;

    try {
        let user;
        if (role === 'admin') {
            user = await Admin.findById(id);
            if (userName) userFields.userName = userName;
        } else {
            user = await User.findById(id);
            if (firstName) userFields.firstName = firstName;
            if (lastName) userFields.lastName = lastName;
        }

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Check if a user with the new email already exists
        if (email && email !== user.email) {
            const existingUser = await (role === 'admin' ? Admin : User).findOne({ email });
            if (existingUser) {
                return res.status(400).json({ msg: 'Email already in use.' });
            }
            userFields.email = email;
        }

        // Update the user
        const updatedUser = await (role === 'admin' ? Admin : User).findByIdAndUpdate(
            id,
            { $set: userFields },
            { new: true } // Return the updated document
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