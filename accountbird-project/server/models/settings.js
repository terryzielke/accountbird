// server/models/Settings.js
const mongoose = require('mongoose');

// Schema for subscription types
const SubscriptionTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
});

// Schema for settings
const SettingsSchema = new mongoose.Schema({
    siteName: {
        type: String,
        required: true,
    },
    siteDomain: {
        type: String,
        required: true,
        default: 'http://localhost:3000',
    },
    version: {
        type: String,
        required: true,
    },
    // Field to store an array of subscription types
    subscriptionTypes: [SubscriptionTypeSchema],

    emailSettings: {
        host: { type: String, default: null },
        port: { type: Number, default: null },
        user: { type: String, default: null },
        pass: { type: String, default: null },
    },
    emailTemplates: {
        registrationEmail: { 
            type: String, 
            default: '<h2>Welcome!</h2><p>Your account has been created.</p>' 
        },
        accountStatusChanged: {
            type: String,
            default: '<h2>Account Status Changed</h2><p>Your account status has been changed to {{status}}.</p>'
        },
        subscriptionTypeChanged: {
            type: String,
            default: '<h2>Subscription Type Changed</h2><p>Your subscription type has been updated to {{subscriptionType}}.</p>'
        },
        userAddedToAccount: {
            type: String,
            default: '<h2>Welcome!</h2><p>Your email has been added to an account.</p>'
        },
        userRemovedFromAccount: {
            type: String,
            default: '<h2>Account Removal</h2><p>Your email has been removed from an account.</p>'
        },
    },
    // Stripe field to store platform credentials
    stripe: {
        accountId: {
            type: String,
            required: false, // Not required until an account is connected
        },
        accessToken: {
            type: String,
            required: false,
        },
        refreshToken: {
            type: String,
            required: false,
        },
    },
});

module.exports = mongoose.model('Settings', SettingsSchema);