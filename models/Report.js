const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    reporterId: { type: String, required: true },
    targetName: { type: String, required: true },   // Naya Field
    targetEmail: { type: String, required: true },  // Naya Field
    targetHostel: { type: String, required: true }, // Naya Field
    reason: { type: String, required: true },
    status: { type: String, default: 'open' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', reportSchema);