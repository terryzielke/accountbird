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
});

module.exports = mongoose.model('User', UserSchema);