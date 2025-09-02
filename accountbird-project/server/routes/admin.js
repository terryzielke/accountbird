// server/routes/admin.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const sendEmail = require('../utils/email');
const jwt = require('jsonwebtoken');

// Import our models
const User = require('../models/User');
const Account = require('../models/Account');
const Settings = require('../models/Settings');

/**
 * @route   PUT /api/admin/settings/email
 * @desc    Update SMTP and email template settings
 * @access  Private (Admin only)
 */
router.put('/settings/email', auth(['admin']), async (req, res) => {
    const { emailHost, emailPort, emailUser, emailPass, registrationEmailHtml } = req.body;

    try {
        let settings = await Settings.findOne();
        if (!settings) {
            return res.status(404).json({ msg: 'Settings not found.' });
        }

        // Update SMTP settings
        settings.emailSettings.host = emailHost || settings.emailSettings.host;
        settings.emailSettings.port = emailPort || settings.emailSettings.port;
        settings.emailSettings.user = emailUser || settings.emailSettings.user;
        settings.emailSettings.pass = emailPass || settings.emailSettings.pass;

        // Update email templates
        settings.emailTemplates.registrationEmail = registrationEmailHtml || settings.emailTemplates.registrationEmail;

        await settings.save();
        res.json({ msg: 'Email settings updated successfully.', settings });

    } catch (err) {
        console.error('Email settings update error:', err.message);
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
        // Fetch all accounts
        const accounts = await Account.find().populate('primaryUser', 'firstName lastName email');
        
        // Fetch all subscription types from settings
        const settings = await Settings.findOne();
        const subscriptionTypes = settings ? settings.subscriptionTypes : [];
        
        // Manually map the subscription type name to each account
        const populatedAccounts = accounts.map(account => {
            const subscriptionType = subscriptionTypes.find(sub => String(sub._id) === String(account.accountType));
            return {
                ...account._doc,
                accountType: subscriptionType ? subscriptionType.name : 'Unknown'
            };
        });
        
        res.json(populatedAccounts);
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
        
        // Fetch all subscription types from settings
        const settings = await Settings.findOne();
        const subscriptionTypes = settings ? settings.subscriptionTypes : [];

        // Manually map the subscription type name to the account
        const subscriptionType = subscriptionTypes.find(sub => String(sub._id) === String(account.accountType));
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
 * @route   PUT /api/admin/accounts/:accountId/status
 * @desc    Admin updates an account's status
 * @access  Private (Admin only)
 */
router.put('/accounts/:accountId/status', auth(['admin']), async (req, res) => {
    const { status } = req.body;
    const { accountId } = req.params;

    // 1. Input Validation: Ensure the provided status is a valid option.
    if (status !== 'Active' && status !== 'Deactivated') {
        return res.status(400).json({ msg: 'Invalid status provided.' });
    }

    try {
        const account = await Account.findById(accountId);
        if (!account) {
            return res.status(404).json({ msg: 'Account not found.' });
        }
        
        // Find the primary user's details for the email notification
        const primaryUser = await User.findById(account.primaryUser);

        // 2. Authorization Check is handled by the auth middleware, ensuring only admins can reach this route.
        
        // 3. Update the account's status and save it.
        account.status = status;
        await account.save();

        // 4. Send email notification to the primary user
        if (primaryUser) {
            // Fetch the email template from the database
            const settings = await Settings.findOne();
            const emailTemplate = settings.emailTemplates.accountStatusChanged || '';

            // Dynamically replace variables in the email template
            const finalHtml = emailTemplate
                .replace(/{{firstName}}/g, primaryUser.firstName)
                .replace(/{{status}}/g, status);

            const siteName = settings.siteName || 'AccountBird';
            const subject = `Your ${siteName} Account Status Was Updated`;

            await sendEmail(primaryUser.email, subject, finalHtml);
        } else {
            console.warn('Primary user not found for account. Email notification not sent.');
        }

        res.json({ msg: `Account status updated to ${status}` });
    } catch (err) {
        console.error('Admin account status update error:', err.message);
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
        const { accountTypeId } = req.body;
        const account = await Account.findById(req.params.accountId);

        if (!account) {
            return res.status(404).json({ msg: 'Account not found' });
        }

        // Store the original account type for comparison
        const originalAccountType = account.accountType;

        if (accountTypeId) {
            account.accountType = accountTypeId;
        }

        await account.save();
        
        // After saving, we need to manually populate the accountType field
        const settings = await Settings.findOne();
        const siteName = settings.siteName || 'AccountBird';
        const subscriptionType = settings.subscriptionTypes.find(sub => String(sub._id) === String(account.accountType));
        
        const updatedAccount = {
            ...account._doc,
            accountType: subscriptionType ? subscriptionType.name : 'Unknown'
        };

        // Check if the subscription type has actually changed
        if (String(originalAccountType) !== String(updatedAccount.accountType._id)) {
            // Find the primary user's details for the email notification
            const primaryUser = await User.findById(account.primaryUser);

            if (primaryUser) {
                // Fetch the email template from the database
                const emailTemplate = settings.emailTemplates.subscriptionTypeChanged || '';
                const finalHtml = emailTemplate
                    .replace(/{{firstName}}/g, primaryUser.firstName)
                    .replace(/{{subscriptionType}}/g, updatedAccount.accountType);
                    
                // Append the additional message and link to the WYSIWYG content
                const appendedHtml = `
                    <div style="width: 100%; text-align: center; margin-bottom: 20px;padding: 50px 0;">
                        <div style="margin: auto; width: 80%; max-width: 600px; font-family: Arial, sans-serif; color: #333; text-align: left;">
                            <h3 style="margin: 0 10px;">${siteName}</h3>
                            <div style="margin-top: 20px; padding: 10px; border: 1px solid #eee; border-radius: 5px; background-color: #fff;">
                            ${finalHtml}
                                <p style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">If this change was not intentional, login, revert the changes, and update your account password for security.</p>
                                <p>The ${siteName} Team</p>
                            </div>
                        </div>
                    </div>
                `;
                
                const subject = `Your ${siteName} Subscription Has Changed`;

                await sendEmail(primaryUser.email, subject, appendedHtml);
            }
        }

        res.json(updatedAccount);
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
        // Find the account to be deleted
        const account = await Account.findById(req.params.accountId);

        if (!account) {
            return res.status(404).json({ msg: 'Account not found' });
        }

        // Find all users associated with this account before deleting them
        const usersToDelete = await User.find({ accountId: account._id });

        if (usersToDelete.length === 0) {
            // Handle the case where no users are found but the account exists
            await account.deleteOne();
            return res.status(200).json({ msg: 'Account deleted successfully, no users were associated.' });
        }

        // Find the primary user's details for the email notification
        const primaryUser = usersToDelete.find(user => user.role === 'primary_user');

        // Delete all users associated with this account
        await User.deleteMany({ accountId: account._id });

        // Delete the account itself
        await account.deleteOne();

        // Fetch settings to get the site name
        const settings = await Settings.findOne();
        const siteName = settings.siteName || 'AccountBird';

        // Send a notification email to the primary user
        // Check if the primary user was found before sending the email
        if (primaryUser) {
            const subject = `Your ${siteName} Account Has Been Deleted`;
            const htmlContent = `
                <div style="width: 100%; text-align: center; margin-bottom: 20px;padding: 50px 0;">
                    <div style="margin: auto; width: 80%; max-width: 600px; font-family: Arial, sans-serif; color: #333; text-align: left;">
                        <h3 style="margin: 0 10px;">${siteName}</h3>
                        <div style="margin-top: 20px; padding: 10px; border: 1px solid #eee; border-radius: 5px; background-color: #fff;">
                            <h2>Hello, ${primaryUser.firstName}!</h2>
                            <p>Your account with ${siteName} has been <strong>deleted</strong> by the administrator team.</p>
                            <p>Deletion is a permanent action, and all associated data has been removed from our system.</p>
                            <p>Likely reasons for deletion:</p>
                            <ul>
                                <li>Violation of terms of service</li>
                                <li>Request by account owner</li>
                                <li>Long standing inactivity</li>
                            </ul>
                            <p>If you believe this was a mistake or have any questions, please contact our support team.</p>
                            <p>Thank you for being a part of ${siteName}!</p>
                            <p>Best regards,</p>
                            <p>The ${siteName} Team</p>
                        </div>
                    </div>
                </div>
            `;
            await sendEmail(primaryUser.email, subject, htmlContent);
        } else {
            console.warn('Primary user not found for deleted account. Email notification not sent.');
        }

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
 * @desc    Admin updates a user's details, including bio and location
 * @access  Private (Admin only)
 */
router.put('/users/:userId', auth(['admin']), async (req, res) => {
    // Destructure all fields from the request body, including the new userBio.
    const { firstName, lastName, userName, email, role, status, location, userBio } = req.body;
    const userId = req.params.userId;
    
    // 1. Provide a more descriptive error for an empty userName field.
    if (userName === '') {
        return res.status(400).json({ msg: 'Username cannot be empty.' });
    }
    
    // Validate userName format if it's being updated
    if (userName) {
        const userNameRegex = /^[a-zA-Z0-9_-]+$/;
        if (!userNameRegex.test(userName)) {
            return res.status(400).json({ msg: 'Username can only contain letters, numbers, dashes, and underscores.' });
        }
    }

    try {
        // Find the user to be updated. An Admin can update any User or Admin.
        const userToUpdate = await User.findById(userId) || await Admin.findById(userId);

        if (!userToUpdate) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Prevent an Admin from changing their own role to something other than 'admin'
        if (String(userToUpdate.id) === String(req.user.id) && role && role !== 'admin') {
            return res.status(403).json({ msg: 'Admins cannot change their own role to a non-admin role.' });
        }
        
        // Prevent an Admin from deactivating their own account
        if (String(userToUpdate.id) === String(req.user.id) && status && status === 'Deactivated') {
            return res.status(403).json({ msg: 'Admins cannot deactivate their own account.' });
        }

        // Check for uniqueness of email and userName
        if (userName && userName !== userToUpdate.userName) {
            const existingUser = await User.findOne({ userName });
            if (existingUser) {
                return res.status(400).json({ msg: 'Username already in use.' });
            }
        }

        if (email && email !== userToUpdate.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ msg: 'Email already in use.' });
            }
        }
        
        // Apply updates directly to the user object
        if (firstName) userToUpdate.firstName = firstName;
        if (lastName) userToUpdate.lastName = lastName;
        if (userName) userToUpdate.userName = userName;
        if (email) userToUpdate.email = email;
        if (role) userToUpdate.role = role;
        if (status) userToUpdate.status = status;

        // Conditionally apply user-specific fields only if the user is a regular user.
        if (userToUpdate.role !== 'admin') {
            if (typeof userBio === 'string') {
                userToUpdate.userBio = userBio;
            }
    
            // 2. Allow location data to be empty.
            if (location && typeof location === 'object' && Object.keys(location).length > 0) {
                userToUpdate.location = {
                    ...userToUpdate.location,
                    ...location
                };
            }
        }
        
        await userToUpdate.save();

        // Retrieve the updated user, excluding the password
        const updatedUser = await userToUpdate.constructor.findById(userId).select('-password');
        res.json(updatedUser);

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
 * @route   PUT /api/admin/users/:userId/status
 * @desc    Admin updates a user's status
 * @access  Private (Admin only)
 */
router.put('/users/:userId/status', auth(['admin']), async (req, res) => {
    const { status } = req.body;
    const { userId } = req.params;

    // 1. Input Validation: Ensure the provided status is a valid option.
    if (status !== 'Active' && status !== 'Deactivated') {
        return res.status(400).json({ msg: 'Invalid status provided.' });
    }

    try {
        const userToUpdate = await User.findById(userId);
        if (!userToUpdate) {
            return res.status(404).json({ msg: 'User not found.' });
        }

        // 2. Authorization Check: Prevent an admin from deactivating themselves.
        if (String(userToUpdate._id) === String(req.user.id)) {
            return res.status(403).json({ msg: 'Access denied: Cannot change your own status.' });
        }

        // 3. Update the user's status and save.
        userToUpdate.status = status;
        await userToUpdate.save();

        res.json({ msg: `User status updated to ${status}` });
    } catch (err) {
        console.error('Admin user status update error:', err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   DELETE /api/admin/users/:userId
 * @desc    Delete a user by ID
 * @access  Private (Admin only)
 */
router.delete('/users/:userId', auth(['admin']), async (req, res) => {
    try {
        const userToDelete = await User.findById(req.params.userId);

        if (!userToDelete) {
            return res.status(404).json({ msg: 'User not found' });
        }
        
        // Find the account and its primary user before deleting the user
        const account = await Account.findById(userToDelete.accountId);
        
        // If the user being deleted is the primary user, do not proceed with deletion
        if (account && String(account.primaryUser) === String(userToDelete._id)) {
            return res.status(403).json({ msg: 'Cannot delete the primary user of an account.' });
        }

        await userToDelete.deleteOne();

        const settings = await Settings.findOne();
        const siteName = settings.siteName || 'AccountBird';
        
        // 1. Email to the deleted user (dynamic content from Wysiwyg)
        const emailTemplate = settings.emailTemplates.userRemovedFromAccount || '';
        const finalHtml = emailTemplate
            .replace(/{{firstName}}/g, userToDelete.firstName)
            .replace(/{{lastName}}/g, userToDelete.lastName)
            .replace(/{{email}}/g, userToDelete.email)
            .replace(/{{siteName}}/g, siteName);
            
        // Append the additional message and link to the WYSIWYG content
        const appendedHtml = `
            <div style="width: 100%; text-align: center; margin-bottom: 20px;padding: 50px 0;">
                <div style="margin: auto; width: 80%; max-width: 600px; font-family: Arial, sans-serif; color: #333; text-align: left;">
                    <h3 style="margin: 0 10px;">${siteName}</h3>
                    <div style="margin-top: 20px; padding: 10px; border: 1px solid #eee; border-radius: 5px; background-color: #fff;">
                    ${finalHtml}
                        <p style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">User deletion is a final action and cannot be undone.</p>
                        <p>The ${siteName} Team</p>
                    </div>
                </div>
            </div>
        `;

        const removedUserSubject = `Your user to ${siteName} has been permanently removed`;

        await sendEmail(userToDelete.email, removedUserSubject, appendedHtml);

        // 2. Email to the primary user (static HTML)
        if (account && account.primaryUser) {
            const primaryUser = await User.findById(account.primaryUser);
            if (primaryUser) {
                const primaryUserSubject = `A user has been removed from your ${siteName} account`;
                const primaryUserHtml = `
                <div style="width: 100%; text-align: center; margin-bottom: 20px;padding: 50px 0;">
                    <div style="margin: auto; width: 80%; max-width: 600px; font-family: Arial, sans-serif; color: #333; text-align: left;">
                        <h3 style="margin: 0 10px;">${siteName}</h3>
                        <div style="margin-top: 20px; padding: 10px; border: 1px solid #eee; border-radius: 5px; background-color: #fff;">
                            <h2>Hello, ${primaryUser.firstName}!</h2>
                            <p>A user, **${userToDelete.firstName} ${userToDelete.lastName}** (${userToDelete.email}), has been removed from your account by an administrator.</p>
                            <p>If you have any questions, please contact our support team.</p>
                            <p>Best regards,</p>
                            <p>The ${siteName} Team</p>
                        </div>
                    </div>
                </div>
                `;
                
                await sendEmail(primaryUser.email, primaryUserSubject, primaryUserHtml);
            }
        }

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
    const { firstName, lastName, email, password, userName } = req.body;
    const { accountId } = req.params;

    if (!firstName || !lastName || !email || !password || !accountId || !userName) {
        return res.status(400).json({ msg: 'Please enter all fields.' });
    }
    
    // Validate userName format using a regular expression
    const userNameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!userNameRegex.test(userName)) {
        return res.status(400).json({ msg: 'Username can only contain letters, numbers, dashes, and underscores.' });
    }

    try {
        // check for existing userName
        let userNameExists = await User.findOne({ userName });
        if (userNameExists) {
            return res.status(400).json({ msg: 'User with that username already exists.'});
        }
        // check for existing Email
        let userEmailExists = await User.findOne({ email });
        if (userEmailExists) {
            return res.status(400).json({ msg: 'User with that email already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            accountId: accountId,
            firstName,
            lastName,
            userName,
            email,
            password: hashedPassword,
            role: 'user',
        });

        const savedUser = await newUser.save();
        
        // 1. Generate a unique JWT for account removal for the new user
        const removalTokenPayload = { user: { id: savedUser.id } };
        const removalToken = jwt.sign(
            removalTokenPayload,
            process.env.JWT_SECRET,
            { expiresIn: '1d' } // Token expires in 1 day
        );
        
        // Find the primary user of the account to send the notification
        const account = await Account.findById(accountId);
        if (account && account.primaryUser) {
            const primaryUser = await User.findById(account.primaryUser);

            if (primaryUser) {
                const settings = await Settings.findOne();
                const siteName = settings.siteName || 'AccountBird';
                const siteDomain = settings.siteDomain || 'http://localhost:3000';
                const emailTemplate = settings.emailTemplates.userAddedToAccount || '';

                // 1. Email to the newly added user (dynamic content)
                const finalHtml = emailTemplate
                    .replace(/{{firstName}}/g, savedUser.firstName)
                    .replace(/{{lastName}}/g, savedUser.lastName)
                    .replace(/{{userName}}/g, savedUser.userName)
                    .replace(/{{siteName}}/g, siteName)
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

                const newuserSubject = `You have been added to an account on ${siteName}`;

                await sendEmail(savedUser.email, newuserSubject, appendedHtml);

                // 2. Email to the Primary User (static content with dynamic user details)
                const primaryUserSubject = `A new user has been added to your ${siteName} account`;
                const primaryUserHtml = `
                <div style="width: 100%; text-align: center; margin-bottom: 20px;padding: 50px 0;">
                    <div style="margin: auto; width: 80%; max-width: 600px; font-family: Arial, sans-serif; color: #333; text-align: left;">
                        <h3 style="margin: 0 10px;">${siteName}</h3>
                        <div style="margin-top: 20px; padding: 10px; border: 1px solid #eee; border-radius: 5px; background-color: #fff;">
                            <h2>Hello, ${primaryUser.firstName}!</h2>
                            <p>A new user, **${savedUser.firstName} ${savedUser.lastName}** (${savedUser.email}), has been added to your account by an administrator.</p>
                            <p>If you did not authorize this change, please contact our support team immediately.</p>
                            <p>Best regards,</p>
                            <p>The ${siteName} Team</p>
                        </div>
                    </div>
                </div>
                `;
                
                await sendEmail(primaryUser.email, primaryUserSubject, primaryUserHtml);
            } else {
                console.warn('Primary user not found. Email notification not sent.');
            }
        }

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
    const { firstName, lastName, email, password, accountTypeId, userName } = req.body;

    if (!firstName || !lastName || !email || !password || !accountTypeId || !userName) {
        return res.status(400).json({ msg: 'Please enter all fields.' });
    }

    try {
        let userNameExists = await User.findOne({ userName });
        if (userNameExists) {
            return res.status(400).json({ msg: 'User with that username already exists.' });
        }
        // find existing Email
        let userEmailExists = await User.findOne({ email });
        if (userEmailExists) {
            return res.status(400).json({ msg: 'User with that email already exists.' });
        }

        const salt = await bcrypt.genSalt(10); // Corrected function name
        const hashedPassword = await bcrypt.hash(password, salt);

        const newAccount = new Account({ accountType: accountTypeId });
        const savedAccount = await newAccount.save();

        const newUser = new User({
            accountId: savedAccount.id,
            firstName,
            lastName,
            userName,
            email,
            password: hashedPassword,
            role: 'primary_user',
        });

        const savedUser = await newUser.save();
        savedAccount.primaryUser = savedUser.id;
        await savedAccount.save();

        const populatedAccount = await savedAccount.populate('accountType');
        res.status(201).json({ msg: 'Account and primary user created successfully', user: savedUser, account: populatedAccount });
    } catch (err) {
        console.error('Admin account creation error:', err.message);
        res.status(500).send('Server Error');
    }
});

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
    const { siteName, siteDomain } = req.body;
    const settingsFields = {};
    if (siteName) settingsFields.siteName = siteName;
    if (siteDomain) settingsFields.siteDomain = siteDomain;

    try {
        let settings = await Settings.findOne();
        if (!settings) {
            return res.status(404).json({ msg: 'Settings not found' });
        }

        settings.siteName = settingsFields.siteName;
        settings.siteDomain = settingsFields.siteDomain;
        await settings.save();
        
        res.json(settings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   POST /api/admin/settings/subscriptions
 * @desc    Add a new subscription type
 * @access  Private (Admin only)
 */
router.post('/settings/subscriptions', auth(['admin']), async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ msg: 'Subscription type name is required.' });
    }

    try {
        const settings = await Settings.findOne();
        if (!settings) {
            return res.status(404).json({ msg: 'Settings not found' });
        }
        
        // Check if the subscription type already exists
        const exists = settings.subscriptionTypes.some(sub => sub.name === name);
        if (exists) {
            return res.status(400).json({ msg: 'Subscription type already exists.' });
        }

        settings.subscriptionTypes.push({ name });
        await settings.save();
        
        res.status(201).json(settings.subscriptionTypes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT /api/admin/settings/subscriptions/:id
 * @desc    Update a subscription type
 * @access  Private (Admin only)
 */
router.put('/settings/subscriptions/:id', auth(['admin']), async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ msg: 'Subscription type name is required.' });
    }

    try {
        const settings = await Settings.findOne();
        if (!settings) {
            return res.status(404).json({ msg: 'Settings not found' });
        }
        
        const subscription = settings.subscriptionTypes.id(req.params.id);
        if (!subscription) {
            return res.status(404).json({ msg: 'Subscription type not found.' });
        }
        
        subscription.name = name;
        await settings.save();
        
        res.json(subscription);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   DELETE /api/admin/settings/subscriptions/:id
 * @desc    Delete a subscription type
 * @access  Private (Admin only)
 */
router.delete('/settings/subscriptions/:id', auth(['admin']), async (req, res) => {
    try {
        const settings = await Settings.findOne();
        if (!settings) {
            return res.status(404).json({ msg: 'Settings not found' });
        }
        
        // Find and remove the subscription type by its ID
        settings.subscriptionTypes.id(req.params.id).deleteOne();
        await settings.save();

        res.json({ msg: 'Subscription type deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;