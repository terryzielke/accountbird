// server/models/Admin.js
// open the mongoDB shell with: mongosh
// close the mongoDB shell with: exit
const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
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
    role: {
        type: String,
        default: 'admin',
    },
    createdDate: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Admin', AdminSchema);