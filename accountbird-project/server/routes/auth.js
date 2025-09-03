const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// Import both the Admin and User models, and the Account model
const Admin = require('../models/Admin');
const User = require('../models/User');
const Account = require('../models/Account');
// Import email sending utility for 2FA
const { sendTwoFactorCode } = require('../utils/email');

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate admin or user and initiate 2FA if enabled
 * @access  Public
 */
router.post('/login', async (req, res) => {
    const { email, password, deviceId } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: 'Please enter all fields.' });
    }

    try {
        let user = null;
        let isRegularUser = false;

        const adminUser = await Admin.findOne({ email });
        if (adminUser) {
            user = adminUser;
        } else {
            const regularUser = await User.findOne({ email });
            if (regularUser) {
                user = regularUser;
                isRegularUser = true;
            }
        }
        
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials.' });
        }

        if (isRegularUser) {
            if (user.status === 'Deactivated') {
                return res.status(403).json({ msg: 'Your user account is deactivated. Please contact your account administrator for assistance.' });
            }

            if (user.accountId) {
                const account = await Account.findById(user.accountId);
                if (!account) {
                    return res.status(404).json({ msg: 'Associated account not found.' });
                }

                if (account.status === 'Deactivated') {
                    if (user.role !== 'primary_user') {
                        return res.status(403).json({ msg: 'This account is currently deactivated. Only the primary user can log in.' });
                    }
                }
            }
        }
        
        // Check if the device is trusted to bypass 2FA
        const trustedDevice = user.trustedDevices?.find(
            (device) => device.deviceId === deviceId && device.expires > Date.now()
        );

        if (trustedDevice) {
            const payload = {
                user: {
                    id: user.id,
                    role: isRegularUser ? user.role : 'admin',
                    ...(isRegularUser && { accountId: user.accountId })
                }
            };
            jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: '1h' },
                (err, token) => {
                    if (err) throw err;
                    const userResponse = {
                        id: user.id,
                        email: user.email,
                        role: isRegularUser ? user.role : 'admin',
                        ...(isRegularUser ? {
                            firstName: user.firstName,
                            lastName: user.lastName,
                            accountId: user.accountId
                        } : {
                            userName: user.userName
                        })
                    };
                    res.json({ token, user: userResponse });
                }
            );
        } else {
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            user.twoFactorSecret = code;
            user.twoFactorExpiration = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
            await user.save();
            await sendTwoFactorCode(user.email, code);

            res.status(200).json({ msg: 'Verification code sent.', twoFactorRequired: true, email: user.email });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   POST /api/auth/two-step-verify
 * @desc    Verify 2FA code and issue JWT
 * @access  Public
 */
router.post('/two-step-verify', async (req, res) => {
    const { email, code, rememberDevice, deviceId } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) {
            user = await Admin.findOne({ email });
        }
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials.' });
        }
        
        if (user.twoFactorSecret !== code || user.twoFactorExpiration < Date.now()) {
            return res.status(400).json({ msg: 'Invalid or expired code.' });
        }
        
        if (rememberDevice) {
            // Check if the deviceId already exists to avoid duplicates
            const existingDevice = user.trustedDevices.find(
                (device) => device.deviceId === deviceId
            );

            if (!existingDevice) {
                user.trustedDevices.push({
                    deviceId,
                    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
                });
            }
        }

        user.twoFactorSecret = null;
        user.twoFactorExpiration = null;
        await user.save();
        
        const payload = {
            user: {
                id: user.id,
                role: user.role,
                ...(user.accountId && { accountId: user.accountId })
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                
                const userResponse = {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    ...(user.role !== 'admin' ? {
                        firstName: user.firstName,
                        lastName: user.lastName,
                        accountId: user.accountId
                    } : {
                        userName: user.userName
                    })
                };
                res.json({ token, user: userResponse });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;