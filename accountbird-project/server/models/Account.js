// server/models/Account.js
const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
    // The user who created the account will be the primary user
    primaryUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    accountType: {
        type: String,
        enum: ['contributor', 'subscriber'],
        required: true,
    },
    billingInfo: {
        // We'll add this structure later, for now it's just a placeholder
        type: Object,
    },
    paymentInfo: {
        type: Object,
    },
    visibilitySettings: {
        type: Object,
    },
    createdDate: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Account', AccountSchema);