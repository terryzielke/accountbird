// server/routes/admin.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Import our models
const User = require('../models/User');
const Account = require('../models/Account');
const Settings = require('../models/Settings');

/**
 * @route   GET /api/admin/settings
 * @desc    Get site-wide settings
 * @access  Private (Admin only)
 */
router.get('/settings', auth(['admin']), async (req, res) => {
    try {
        const settings = await Settings.findOne();
        if (!settings) {
            return res.status(404).json({ msg: 'Settings not found' });
        }
        res.json(settings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT /api/admin/settings
 * @desc    Update site-wide settings
 * @access  Private (Admin only)
 */
router.put('/settings', auth(['admin']), async (req, res) => {
    const { siteName, version } = req.body;
    const settingsFields = {};
    if (siteName) settingsFields.siteName = siteName;
    if (version) settingsFields.version = version;

    try {
        let settings = await Settings.findOne();
        if (!settings) {
            // If settings don't exist, create them (should be handled during initialization)
            settings = new Settings(settingsFields);
            await settings.save();
        } else {
            // Update existing settings
            settings = await Settings.findOneAndUpdate({}, { $set: settingsFields }, { new: true });
        }

        res.json(settings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

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
 * @route   GET /api/admin/users/:userId
 * @desc    Get a single user's details by ID
 * @access  Private (Admin only)
 */
router.get('/users/:userId', auth(['admin']), async (req, res) => {
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
 * @route   PUT /api/admin/users/:userId
 * @desc    Update a user's details (name, email, role)
 * @access  Private (Admin only)
 */
router.put('/users/:userId', auth(['admin']), async (req, res) => {
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
 * @route   PUT /api/admin/users/:userId/password
 * @desc    Admin updates a user's password
 * @access  Private (Admin only)
 */
router.put('/users/:userId/password', auth(['admin']), async (req, res) => {
    const { newPassword } = req.body;

    if (!newPassword) {
        return res.status(400).json({ msg: 'New password is required.' });
    }

    try {
        let user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({ msg: 'User not found.' });
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

/**
 * @route   DELETE /api/admin/user/:userId
 * @desc    Delete a user by ID
 * @access  Private (Admin only)
 */
router.delete('/users/:userId', auth(['admin']), async (req, res) => {
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

/**
 * @route   POST /api/admin/accounts/:accountId/users
 * @desc    Admin adds a new user to a specific account
 * @access  Private (Admin only)
 */
router.post('/accounts/:accountId/users', auth(['admin']), async (req, res) => {
    const { firstName, lastName, email, role, password } = req.body;
    const { accountId } = req.params;

    if (!firstName || !lastName || !email || !role || !password || !accountId) {
        return res.status(400).json({ msg: 'Please enter all fields.' });
    }

    try {
        let userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ msg: 'User with that email already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            accountId: accountId,
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role,
        });

        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    } catch (err) {
        console.error('Admin user creation error:', err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   POST /api/admin/accounts
 * @desc    Admin creates a new account with a primary user
 * @access  Private (Admin only)
 */
router.post('/accounts', auth(['admin']), async (req, res) => {
    const { firstName, lastName, email, password, accountType } = req.body;

    if (!firstName || !lastName || !email || !password || !accountType) {
        return res.status(400).json({ msg: 'Please enter all fields.' });
    }

    try {
        let userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ msg: 'User with that email already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newAccount = new Account({ accountType });
        const savedAccount = await newAccount.save();

        const newUser = new User({
            accountId: savedAccount.id,
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role: 'primary_user',
        });

        const savedUser = await newUser.save();
        savedAccount.primaryUser = savedUser.id;
        await savedAccount.save();

        res.status(201).json({ msg: 'Account and primary user created successfully', user: savedUser, account: savedAccount });
    } catch (err) {
        console.error('Admin account creation error:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;