// server/models/Settings.js
const mongoose = require('mongoose');

const SubscriptionTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
});

const SettingsSchema = new mongoose.Schema({
    siteName: {
        type: String,
        required: true,
    },
    version: {
        type: String,
        required: true,
    },
    // New field to store an array of subscription types
    subscriptionTypes: [SubscriptionTypeSchema],

    emailSettings: {
        host: { type: String, default: null },
        port: { type: Number, default: null },
        user: { type: String, default: null },
        pass: { type: String, default: null },
    },
    emailTemplates: {
        registrationEmail: { type: String, default: '<h2>Welcome!</h2><p>Your account has been created.</p>' },
        // ... other email templates will go here
    }
});

module.exports = mongoose.model('Settings', SettingsSchema);