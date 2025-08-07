// server/models/Settings.js
const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
    siteName: {
        type: String,
        required: true,
    },
    version: {
        type: String,
        required: true,
    },
});

module.exports = mongoose.model('Settings', SettingsSchema);