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
});

module.exports = mongoose.model('Settings', SettingsSchema);