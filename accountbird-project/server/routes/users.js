// server/routes/users.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const {sendEmail} = require('../utils/email');

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
    const { firstName, lastName, email, password, accountType, userName } = req.body;

    // Input validation
    if (!firstName || !lastName || !email || !password || !accountType || !userName) {
        return res.status(400).json({ msg: 'Please enter all fields.' });
    }

    // Validate userName format using a regular expression
    const userNameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!userNameRegex.test(userName)) {
        return res.status(400).json({ msg: 'Username can only contain letters, numbers, dashes, and underscores.' });
    }

    try {
        // Check if a user with the same userName already exists
        let userNameExists = await User.findOne({ userName });
        if (userNameExists) {
            return res.status(400).json({ msg: 'User with that username already exists.' });
        }

        // Check if a user with the same email already exists
        let userEmailExists = await User.findOne({ email });
        if (userEmailExists) {
            return res.status(400).json({ msg: 'User with that email already exists.' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create the new Account first
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
            userName,
            email,
            password: hashedPassword,
            role: 'primary_user', // The first user is always the primary user for the account
        });

        const savedUser = await newUser.save();

        // Update the Account with the primaryUser's ID
        savedAccount.primaryUser = savedUser.id;
        await savedAccount.save();


        // Generate a unique JWT for account removal
        const removalTokenPayload = { user: { id: savedUser.id } };
        const removalToken = jwt.sign(
            removalTokenPayload,
            process.env.JWT_SECRET,
            { expiresIn: '1d' } // Token expires in 1 day
        );
        // get settings
        const settings = await Settings.findOne();
        // Create the email removal link
        const siteDomain = settings.siteDomain || 'http://localhost:3000';
        const removalLink = `${siteDomain}/remove-account?token=${removalToken}`;

        // Fetch the email template from the database
        const siteName = settings.siteName || 'AccountBird';
        const emailTemplate = settings.emailTemplates.registrationEmail || '';
        
        // Dynamically replace variables in the email template
        const finalHtml = emailTemplate
            .replace(/{{firstName}}/g, savedUser.firstName)
            .replace(/{{lastName}}/g, savedUser.lastName)
            .replace(/{{email}}/g, savedUser.email);
            
        // Append the additional message and link to the WYSIWYG content
        const appendedHtml = `
            <div style="width: 100%; text-align: center; margin-bottom: 20px;padding: 50px 0;">
                <div style="margin: auto; width: 80%; max-width: 600px; font-family: Arial, sans-serif; color: #333; text-align: left;">
                    <h3 style="margin: 0 10px;">${siteName}</h3>
                    <div style="margin-top: 20px; padding: 10px; border: 1px solid #eee; border-radius: 5px; background-color: #fff;">
                    ${finalHtml}
                        <p style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">If you did not authorize this action, please click the button below to have your user removed.</p>
                        <a href="${siteDomain}/remove-account?token=${removalToken}" style="
                            background-color: #FF4E4E; 
                            color: white; 
                            padding: 10px 20px; 
                            text-decoration: none; 
                            border-radius: 5px; 
                            display: inline-block;
                        ">Remove My User</a>
                        <p>The ${siteName} Team</p>
                    </div>
                </div>
            </div>
        `;
            
        // Send the notification email
        const subject = `Welcome to ${siteName}!`;
        await sendEmail(savedUser.email, subject, appendedHtml);

        // Create and sign JWT for automatic login
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
 * @route   POST /api/users/remove-account
 * @desc    Removes a user and their account using a unique token from an email link
 * @access  Public
 */
router.post('/remove-account', async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ msg: 'No token provided.' });
    }

    try {
        // 1. Verify the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.user.id;
        
        // 2. Find the user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found or already deleted.' });
        }

        // 3. Find the associated account
        const account = await Account.findById(user.accountId);

        // 4. Delete the user
        await User.findByIdAndDelete(userId);

        // 5. Delete the account if it's no longer attached to any users
        const remainingUsers = await User.countDocuments({ accountId: user.accountId });
        if (remainingUsers === 0) {
            await Account.findByIdAndDelete(user.accountId);
        }

        res.status(200).json({ msg: 'Your user account and associated data have been successfully removed.' });

    } catch (err) {
        console.error('Account removal error:', err.message);
        res.status(401).json({ msg: 'Invalid or expired token.' });
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