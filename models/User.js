const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    hostel: { type: String, required: true },
    contact: { type: String, required: true },
    course: { type: String, required: true }, 
    year: { type: String, required: true },   
    profilePic: { type: String, default: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }, // Updated
    role: { type: String, default: 'student' },
    warnings: [{ message: String, date: { type: Date, default: Date.now } }],
    isBlocked: { type: Boolean, default: false }
});
module.exports = mongoose.model('User', userSchema);