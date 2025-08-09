// server/routes/auth-user.js
const express = require('express');
const router = express.Router();
// Import the modified auth middleware
const auth = require('../middleware/auth');
const Admin = require('../models/Admin');

/**
 * @route   GET /api/auth/user/admin
 * @desc    Get Admin user data by token (protected by RBAC)
 * @access  Private
 */
router.get('/admin', auth(['admin']), async (req, res) => {
    try {
        // Find the admin user by the ID attached to the request by the auth middleware
        // We ensure the user is an admin by using the RBAC middleware
        const admin = await Admin.findById(req.user.id).select('-password');
        if (!admin) {
            return res.status(404).json({ msg: 'Admin user not found' });
        }
        res.json(admin);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;