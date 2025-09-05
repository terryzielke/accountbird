// server/routes/account.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const {sendEmail} = require('../utils/email');
const jwt = require('jsonwebtoken');

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
    const { firstName, lastName, email, role, password, userName } = req.body;
    const { accountId } = req.user;

    const account = await Account.findById(accountId);
    if (String(account.primaryUser) !== String(req.user.id)) {
        return res.status(403).json({ msg: 'Access denied: You are not the primary user for this account' });
    }

    if (!firstName || !lastName || !email || !role || !password || !userName) {
        return res.status(400).json({ msg: 'Please enter all fields.' });
    }
    
    // Validate userName format using a regular expression
    const userNameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!userNameRegex.test(userName)) {
        return res.status(400).json({ msg: 'Username can only contain letters, numbers, dashes, and underscores.' });
    }

    try {
        // check for existing userName
        let userUserNameExists = await User.findOne({ userName });
        if (userUserNameExists) {
            return res.status(400).json({ msg: 'User with that username already exists.' });
        }
        // check for existing email
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
            role,
        });

        const savedUser = await newUser.save();
        
        // 1. Generate a unique JWT for account removal for the new user
        const removalTokenPayload = { user: { id: savedUser.id } };
        const removalToken = jwt.sign(
            removalTokenPayload,
            process.env.JWT_SECRET,
            { expiresIn: '1d' } // Token expires in 1 day
        );
        
        // Fetch settings to get the site name and email template
        const settings = await Settings.findOne();
        const siteName = settings.siteName || 'AccountBird';
        const emailTemplate = settings.emailTemplates.userAddedToAccount || '';
        const siteDomain = settings.siteDomain || 'http://localhost:5001';

        // Dynamically replace variables in the email template
        const finalHtml = emailTemplate
            .replace(/{{firstName}}/g, savedUser.firstName)
            .replace(/{{lastName}}/g, savedUser.lastName)
            .replace(/{{userName}}/g, savedUser.userName)
            .replace(/{{newUserEmail}}/g, savedUser.email)
            .replace(/{{siteName}}/g, siteName);
            
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

        const subject = `You have been added to an account on ${siteName}`;
        
        // Send a notification email to the new user
        await sendEmail(savedUser.email, subject, appendedHtml);

        // Explicitly send a 201 status for successful creation.
        res.status(201).json({ msg: 'User added successfully!', user: savedUser });

    } catch (err) {
        console.error('User creation error:', err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT /api/account/users/:userId
 * @desc    Primary user updates a user's details, including bio and location
 * @access  Private (Primary User only)
 */
router.put('/users/:userId', auth(), async (req, res) => {
    // Destructure all fields from the request body, including the new userBio.
    const { firstName, lastName, userName, email, role, location, userBio } = req.body;
    const { accountId, id } = req.user;

    // 1. Provide a more descriptive error for an empty userName field.
    if (userName === '') {
        return res.status(400).json({ msg: 'Username cannot be empty.' });
    }
    
    // Validate userName format using a regular expression
    if (userName) {
        const userNameRegex = /^[a-zA-Z0-9_-]+$/;
        if (!userNameRegex.test(userName)) {
            return res.status(400).json({ msg: 'Username can only contain letters, numbers, dashes, and underscores.' });
        }
    }

    try {
        const userToUpdate = await User.findById(req.params.userId);

        if (!userToUpdate) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Ensure the user to update belongs to the authenticated user's account
        if (String(userToUpdate.accountId) !== String(accountId)) {
            return res.status(403).json({ msg: 'Access denied: You can only manage users on your own account' });
        }

        // Prevent a primary user from changing their own role
        if (String(userToUpdate.id) === String(id) && req.body.role) {
            return res.status(403).json({ msg: 'Access denied: Cannot change your own role' });
        }

        // Check for uniqueness of email and userName if they are being updated
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
        
        // Handle the new userBio field
        if (typeof userBio === 'string') {
            userToUpdate.userBio = userBio;
        }

        // Conditionally apply the location update only if it exists in the request body
        if (location && typeof location === 'object' && Object.keys(location).length > 0) {
            userToUpdate.location = {
                ...userToUpdate.location,
                ...location
            };
        } else if (location && Object.keys(location).length === 0) {
            // Explicitly set location to an empty object if an empty object is sent
            // This allows the user to clear all location fields
            userToUpdate.location = {};
        }

        await userToUpdate.save();

        const updatedUser = await User.findById(req.params.userId).select('-password');
        res.json(updatedUser);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT /api/account/users/:userId/status
 * @desc    Primary user updates a user's status
 * @access  Private (Primary User only)
 */
router.put('/users/:userId/status', auth(), async (req, res) => {
    const { status } = req.body;
    const { userId } = req.params;
    const { accountId, id } = req.user;

    // 1. Input Validation: Ensure the status is a valid option.
    if (status !== 'Active' && status !== 'Deactivated') {
        return res.status(400).json({ msg: 'Invalid status provided.' });
    }

    try {
        const userToUpdate = await User.findById(userId);
        if (!userToUpdate) {
            return res.status(404).json({ msg: 'User not found.' });
        }

        // 2. Authorization Check: Ensure the user being updated is on the primary user's account.
        if (String(userToUpdate.accountId) !== String(accountId)) {
            return res.status(403).json({ msg: 'Access denied: You can only manage users on your own account.' });
        }

        // 3. Prevent a primary user from deactivating themselves.
        if (String(userToUpdate._id) === String(id)) {
            return res.status(403).json({ msg: 'Access denied: Cannot change your own status.' });
        }

        // 4. Update the user's status and save.
        userToUpdate.status = status;
        await userToUpdate.save();

        res.json({ msg: `User status updated to ${status}` });
    } catch (err) {
        console.error('User status update error:', err.message);
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
        
        // Find the primary user's details for the email content
        const primaryUser = await User.findById(id);

        await userToDelete.deleteOne();
        
        // Fetch settings to get site name and email template
        const settings = await Settings.findOne();
        const siteName = settings.siteName || 'AccountBird';
        const emailTemplate = settings.emailTemplates.userRemovedFromAccount || '';

        // Dynamically replace variables in the email template
        const finalHtml = emailTemplate
            .replace(/{{firstName}}/g, userToDelete.firstName)
            .replace(/{{lastName}}/g, userToDelete.lastName)
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
        
        const subject = `Your user to ${siteName} has been permanently removed`;

        // Send a notification email to the deleted user
        await sendEmail(userToDelete.email, subject, appendedHtml);

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
 * @route   PUT /api/account/status
 * @desc    Primary user updates their account status
 * @access  Private (Primary User only)
 */
router.put('/status', auth(), async (req, res) => {
    const { status } = req.body;
    const { accountId, id } = req.user;

    // 1. Input Validation: Ensure the status is a valid option.
    if (status !== 'Active' && status !== 'Deactivated') {
        return res.status(400).json({ msg: 'Invalid status provided.' });
    }

    try {
        const account = await Account.findById(accountId);
        const primaryUser = await User.findById(id); // Fetch the user's details

        if (!account) {
            return res.status(404).json({ msg: 'Account not found.' });
        }

        // 2. Authorization Check: Ensure the authenticated user is the primary user.
        if (String(account.primaryUser) !== String(id)) {
            return res.status(403).json({ msg: 'Access denied: You are not the primary user for this account.' });
        }
        
        // 3. Update the account status.
        account.status = status;
        await account.save();

        // 4. Fetch the email template from the database and dynamically replace content
        const settings = await Settings.findOne();
        const emailTemplate = settings.emailTemplates.accountStatusChanged || '';

        const finalHtml = emailTemplate
            .replace(/{{firstName}}/g, primaryUser.firstName)
            .replace(/{{status}}/g, status);

        const subject = `Your AccountBird Account Status Has Been Changed`;

        // 5. Send email notification to the primary user
        await sendEmail(primaryUser.email, subject, finalHtml);

        res.json({ msg: `Account status updated to ${status}.` });
    } catch (err) {
        console.error('Account status update error:', err.message);
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

        // Store the original account type for comparison
        const originalAccountType = accountToUpdate.accountType;

        // Ensure the authenticated user is the primary user
        if (String(accountToUpdate.primaryUser) !== String(id)) {
            return res.status(403).json({ msg: 'Access denied: You are not the primary user for this account' });
        }

        if (accountTypeId) {
            accountToUpdate.accountType = accountTypeId;
        }

        await accountToUpdate.save();

        // Check if the subscription type has actually changed
        if (String(originalAccountType) !== String(accountToUpdate.accountType)) {
            const primaryUser = await User.findById(id);
            const settings = await Settings.findOne();
            const siteName = settings.siteName || 'AccountBird';
            
            // Find the name of the new subscription type for the email
            const newSubscriptionType = settings.subscriptionTypes.find(sub => String(sub._id) === String(accountToUpdate.accountType));
            const newSubscriptionName = newSubscriptionType ? newSubscriptionType.name : 'Unknown';

            // Fetch the email template from the database and populate variables
            const emailTemplate = settings.emailTemplates.subscriptionTypeChanged || '';
            const finalHtml = emailTemplate
                .replace(/{{firstName}}/g, primaryUser.firstName)
                .replace(/{{subscriptionType}}/g, newSubscriptionName);

            const subject = `Your ${siteName} Subscription Has Changed`;
            
            await sendEmail(primaryUser.email, subject, finalHtml);
        }

        res.json({ msg: 'Account updated successfully' });
    } catch (err) {
        console.error('Account update error:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;