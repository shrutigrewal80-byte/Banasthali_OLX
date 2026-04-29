const mongoose = require('mongoose');
const chatSchema = new mongoose.Schema({
    productId: { type: String, default: "CHAT_PROOF" },
    productName: { type: String },
    senderId: { type: String, required: true },    // Buyer Email
    senderName: { type: String, required: true },  // Fixed: Added Buyer Name
    receiverId: { type: String, required: true },  // Seller Email
    receiverName: { type: String, required: true },// Added Seller Name
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Chat', chatSchema);