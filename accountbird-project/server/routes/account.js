// server/routes/account.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Import models
const User = require('../models/User');
const Account = require('../models/Account');
const Settings = require('../models/Settings');

const { populateAccountType } = require('../utils/accountHelpers');

/**
 * @route   GET /api/account/users
 * @desc    Get all users for the authenticated user's account
 * @access  Private (Primary User only)
 */
router.get('/users', auth(), async (req, res) => {
    try {
        const users = await User.find({ accountId: req.user.accountId }).select('-password');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   POST /api/account/users
 * @desc    Primary user adds a new user to their account
 * @access  Private (Primary User only)
 */
router.post('/users', auth(), async (req, res) => {
    const { firstName, lastName, email, role, password } = req.body;
    const { accountId } = req.user;

    const account = await Account.findById(accountId);
    if (String(account.primaryUser) !== String(req.user.id)) {
        return res.status(403).json({ msg: 'Access denied: You are not the primary user for this account' });
    }

    if (!firstName || !lastName || !email || !role || !password) {
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
        console.error('User creation error:', err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT /api/account/users/:userId
 * @desc    Primary user updates a user's details
 * @access  Private (Primary User only)
 */
router.put('/users/:userId', auth(), async (req, res) => {
    const { firstName, lastName, email, role } = req.body;
    const { accountId, id } = req.user;

    const userFields = {};
    if (firstName) userFields.firstName = firstName;
    if (lastName) userFields.lastName = lastName;
    if (email) userFields.email = email;
    if (role) userFields.role = role;

    try {
        const userToUpdate = await User.findById(req.params.userId);

        if (!userToUpdate) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Ensure the user to update belongs to the authenticated user's account
        if (String(userToUpdate.accountId) !== String(accountId)) {
            return res.status(403).json({ msg: 'Access denied: You can only manage users on your own account' });
        }

        // Prevent primary user from changing their own role
        if (String(userToUpdate.id) === String(id) && userFields.role) {
            return res.status(403).json({ msg: 'Access denied: Cannot change your own role' });
        }

        if (email && email !== userToUpdate.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ msg: 'Email already in use.' });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.userId,
            { $set: userFields },
            { new: true }
        ).select('-password');

        res.json(updatedUser);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   DELETE /api/account/users/:userId
 * @desc    Primary user deletes a user from their account
 * @access  Private (Primary User only)
 */
router.delete('/users/:userId', auth(), async (req, res) => {
    const { accountId, id } = req.user;

    try {
        const userToDelete = await User.findById(req.params.userId);

        if (!userToDelete) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Prevent a user from deleting themselves
        if (String(userToDelete.id) === String(id)) {
            return res.status(403).json({ msg: 'Access denied: Cannot delete yourself' });
        }

        // Ensure the user to delete belongs to the authenticated user's account
        if (String(userToDelete.accountId) !== String(accountId)) {
            return res.status(403).json({ msg: 'Access denied: You can only manage users on your own account' });
        }

        await userToDelete.deleteOne();

        res.json({ msg: 'User deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT /api/account/users/:userId/password
 * @desc    Primary user updates a user's password
 * @access  Private (Primary User only)
 */
router.put('/users/:userId/password', auth(), async (req, res) => {
    const { newPassword } = req.body;
    const { accountId } = req.user;

    if (!newPassword) {
        return res.status(400).json({ msg: 'New password is required.' });
    }

    try {
        let user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({ msg: 'User not found.' });
        }

        // Ensure the user to update belongs to the authenticated user's account
        if (String(user.accountId) !== String(accountId)) {
            return res.status(403).json({ msg: 'Access denied: You can only manage users on your own account' });
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
 * @route   GET /api/account/details
 * @desc    Get the authenticated user's account details
 * @access  Private
 */
router.get('/details', auth(), async (req, res) => {
    try {
        const account = await Account.findById(req.user.accountId);
        if (!account) {
            return res.status(404).json({ msg: 'Account not found' });
        }
        
        // Fetch all subscription types from settings
        const settings = await Settings.findOne();
        const subscriptionType = settings.subscriptionTypes.find(sub => String(sub._id) === String(account.accountType));
        
        const populatedAccount = {
            ...account._doc,
            accountType: subscriptionType ? { name: subscriptionType.name, _id: subscriptionType._id } : { name: 'Unknown', _id: 'Unknown' }
        };

        res.json(populatedAccount);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT /api/account/:accountId
 * @desc    Primary user updates their account details
 * @access  Private (Primary User only)
 */
router.put('/:accountId', auth(), async (req, res) => {
    const { accountTypeId } = req.body;
    const { accountId } = req.params;
    const { id } = req.user;

    try {
        const accountToUpdate = await Account.findById(accountId);
        if (!accountToUpdate) {
            return res.status(404).json({ msg: 'Account not found' });
        }

        // Ensure the authenticated user is the primary user
        if (String(accountToUpdate.primaryUser) !== String(id)) {
            return res.status(403).json({ msg: 'Access denied: You are not the primary user for this account' });
        }

        if (accountTypeId) {
            accountToUpdate.accountType = accountTypeId;
        }

        await accountToUpdate.save();
        res.json({ msg: 'Account updated successfully' });
    } catch (err) {
        console.error('Account update error:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;