// server/routes/users.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

// Import our new models
const User = require('../models/User');
const Account = require('../models/Account');
const Settings = require('../models/Settings');

/**
 * @route   POST /api/users/register
 * @desc    Register a new user and create a new account
 * @access  Public
 */
router.post('/register', async (req, res) => {
    const { firstName, lastName, email, password, accountType } = req.body;

    // 1. Input validation
    if (!firstName || !lastName || !email || !password || !accountType) {
        return res.status(400).json({ msg: 'Please enter all fields.' });
    }

    try {
        // 2. Check if a user with the same email already exists
        let userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ msg: 'User with that email already exists.' });
        }

        // 3. Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Create the new Account first
        const newAccount = new Account({
            accountType,
            // Billing, payment, and visibility settings will be added here
        });

        const savedAccount = await newAccount.save();

        // 5. Create the new User and link the accountId
        const newUser = new User({
            accountId: savedAccount.id,
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role: 'primary_user', // The first user is always the primary user for the account
        });

        const savedUser = await newUser.save();

        // 6. Update the Account with the primaryUser's ID
        savedAccount.primaryUser = savedUser.id;
        await savedAccount.save();

        // 7. Create and sign JWT for automatic login
        const payload = {
            user: {
                id: savedUser.id,
                role: savedUser.role,
                accountId: savedAccount.id
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.status(201).json({ 
                    msg: 'User and account created successfully',
                    token,
                    user: {
                        id: savedUser.id,
                        firstName: savedUser.firstName,
                        lastName: savedUser.lastName,
                        email: savedUser.email,
                        accountId: savedAccount.id
                    }
                });
            }
        );

    } catch (err) {
        console.error('User registration error:', err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   POST /api/users/invite
 * @desc    Invite a new user to an existing account
 * @access  Private
 */
router.post('/invite', auth(), async (req, res) => {
    const { firstName, lastName, email, password, accountId } = req.body;

    if (!firstName || !lastName || !email || !password || !accountId) {
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
            role: 'user',
        });

        const savedUser = await newUser.save();

        const payload = {
            user: {
                id: savedUser.id,
                role: savedUser.role,
                accountId: accountId
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.status(201).json({
                    msg: 'User invited and created successfully',
                    token,
                    user: {
                        id: savedUser.id,
                        firstName: savedUser.firstName,
                        lastName: savedUser.lastName,
                        email: savedUser.email,
                        accountId: savedUser.accountId,
                    },
                });
            }
        );
    } catch (err) {
        console.error('User invitation error:', err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/users/subscription-types
 * @desc    Get all available subscription types
 * @access  Public
 */
router.get('/subscription-types', async (req, res) => {
    try {
        const settings = await Settings.findOne();
        if (!settings || !settings.subscriptionTypes) {
            return res.json([]);
        }
        res.json(settings.subscriptionTypes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;