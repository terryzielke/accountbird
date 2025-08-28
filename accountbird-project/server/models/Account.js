// server/models/Account.js
const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
    primaryUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    accountType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Settings',
        required: true,
    },
    billingInfo: {
        type: Object,
    },
    paymentInfo: {
        type: Object,
    },
    visibilitySettings: {
        type: Object,
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

module.exports = mongoose.model('Account', AccountSchema);