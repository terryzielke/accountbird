const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import both the Admin and User models, and the Account model
const Admin = require('../models/Admin');
const User = require('../models/User');
const Account = require('../models/Account');

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate admin or user and get token
 * @access  Public
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: 'Please enter all fields.' });
    }

    try {
        let user = null;
        let role = null;
        let isRegularUser = false;

        // Check for a regular user first
        const regularUser = await User.findOne({ email });
        if (regularUser) {
            user = regularUser;
            role = regularUser.role;
            isRegularUser = true;
            
            // 1. Check if the user's individual status is Deactivated
            if (user.status === 'Deactivated') {
                return res.status(403).json({ msg: 'Your user account is deactivated. Please contact your account administrator for assistance.' });
            }

            // 2. Check the account status based on the user's role
            if (user.accountId) {
                const account = await Account.findById(user.accountId);
                if (!account) {
                    return res.status(404).json({ msg: 'Associated account not found.' });
                }

                // If the account is deactivated
                if (account.status === 'Deactivated') {
                    // Allow the primary user to log in to manage the account
                    if (user.role === 'primary_user') {
                        // Continue with login
                    } else {
                        // Block all other users from a deactivated account
                        return res.status(403).json({ msg: 'This account is currently deactivated. Only the primary user can log in.' });
                    }
                }
            }

        } else {
            // If not a regular user, check for an admin
            const admin = await Admin.findOne({ email });
            if (admin) {
                user = admin;
                role = 'admin';
            }
        }

        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials.' });
        }

        const payload = {
            user: {
                id: user.id,
                role: role,
            },
        };

        if (isRegularUser) {
            payload.user.accountId = user.accountId;
        }

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;

                const userResponse = {
                    id: user.id,
                    email: user.email,
                    role: role,
                    ...(isRegularUser ? {
                        firstName: user.firstName,
                        lastName: user.lastName,
                        accountId: user.accountId
                    } : {
                        userName: user.userName
                    })
                };
                
                res.json({
                    token,
                    user: userResponse,
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;