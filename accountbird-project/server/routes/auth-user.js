// server/routes/auth-user.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

/**
 * @route   GET /api/auth/user
 * @desc    Get user data by token
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
    try {
        // Find the user by the ID attached to the request by the auth middleware
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;