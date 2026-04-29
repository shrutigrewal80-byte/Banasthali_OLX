const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    adminName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'Moderator' }, // Moderator or SuperAdmin
    accountStatus: { type: String, required: true, default: 'Active' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Admin', adminSchema);