// server/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    // The user's account will be linked here
    accountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true
    },
    // The user's role within their account
    role: {
        type: String,
        enum: ['primary_user', 'user'],
        default: 'primary_user',
        required: true,
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    userName: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        default: 'Active',
        enum: ['Active', 'Deactivated'],
    },
    createdDate: {
        type: Date,
        default: Date.now,
    },
    location: {
        address: {
            type: String,
            trim: true
        },
        city: {
            type: String,
            trim: true
        },
        stateProvince: {
            type: String,
            trim: true
        },
        country: {
            type: String,
            enum: ['Canada', 'USA'],
            trim: true
        },
        zipPostalCode: {
            type: String,
            trim: true
        }
    },
    userBio: {
        type: String,
        trim: true,
        default: ''
    },
    twoFactorSecret: {
        type: String,
        default: null
    },
    twoFactorExpiration: {
        type: Date,
        default: null
    },
    trustedDevices: [{
        deviceId: String,
        expires: Date
    }]
});

module.exports = mongoose.model('User', UserSchema);