// server/routes/admin.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Import our models
const User = require('../models/User');
const Account = require('../models/Account');

/**
 * @route   GET /api/admin/users
 * @desc    Get a list of all regular users
 * @access  Private (Admin only)
 */
router.get('/users', auth(['admin']), async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/admin/accounts
 * @desc    Get a list of all accounts
 * @access  Private (Admin only)
 */
router.get('/accounts', auth(['admin']), async (req, res) => {
    try {
        const accounts = await Account.find().populate('primaryUser', 'firstName lastName email');
        res.json(accounts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/admin/accounts/:accountId
 * @desc    Get a single account's details by ID
 * @access  Private (Admin only)
 */
router.get('/accounts/:accountId', auth(['admin']), async (req, res) => {
    try {
        const account = await Account.findById(req.params.accountId).populate('primaryUser', 'firstName lastName email');

        if (!account) {
            return res.status(404).json({ msg: 'Account not found' });
        }

        res.json(account);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT /api/admin/accounts/:accountId
 * @desc    Update an account's details
 * @access  Private (Admin only)
 */
router.put('/accounts/:accountId', auth(['admin']), async (req, res) => {
    try {
        const { accountType } = req.body;
        const account = await Account.findById(req.params.accountId);

        if (!account) {
            return res.status(404).json({ msg: 'Account not found' });
        }

        // Update the account type if provided
        if (accountType) {
            account.accountType = accountType;
        }

        await account.save();
        res.json(account);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   DELETE /api/admin/accounts/:accountId
 * @desc    Delete an account and all associated users
 * @access  Private (Admin only)
 */
router.delete('/accounts/:accountId', auth(['admin']), async (req, res) => {
    try {
        const account = await Account.findById(req.params.accountId);

        if (!account) {
            return res.status(404).json({ msg: 'Account not found' });
        }

        // Delete all users associated with this account
        await User.deleteMany({ accountId: account._id });

        // Delete the account itself
        await account.deleteOne();

        res.json({ msg: 'Account and associated users deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/admin/user/:userId
 * @desc    Get a single user's details by ID
 * @access  Private (Admin only)
 */
router.get('/user/:userId', auth(['admin']), async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('-password');
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
 * @route   PUT /api/admin/user/:userId
 * @desc    Update a user's details (name, email, role)
 * @access  Private (Admin only)
 */
router.put('/user/:userId', auth(['admin']), async (req, res) => {
    const { firstName, lastName, email, role } = req.body;
    const userFields = {};
    if (firstName) userFields.firstName = firstName;
    if (lastName) userFields.lastName = lastName;
    if (email) userFields.email = email;
    if (role) userFields.role = role;

    try {
        let user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Check if a user with the new email already exists
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ msg: 'Email already in use.' });
            }
        }

        // Update the user
        user = await User.findByIdAndUpdate(
            req.params.userId,
            { $set: userFields },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   DELETE /api/admin/user/:userId
 * @desc    Delete a user by ID
 * @access  Private (Admin only)
 */
router.delete('/user/:userId', auth(['admin']), async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        await user.deleteOne();

        res.json({ msg: 'User deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/admin/accounts/:accountId/users
 * @desc    Get all users for a specific account
 * @access  Private (Admin only)
 */
router.get('/accounts/:accountId/users', auth(['admin']), async (req, res) => {
    try {
        const users = await User.find({ accountId: req.params.accountId }).select('-password');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;