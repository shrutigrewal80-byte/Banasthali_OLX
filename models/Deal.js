const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
    productId: { type: String, required: true },
    title: { type: String, required: true },
    image: { type: String }, // NEW: Deal ki photo ke liye
    originalPrice: { type: Number },
    finalPrice: { type: Number, required: true },
    sellerId: { type: String, required: true },
    sellerName: { type: String, required: true },
    buyerId: { type: String, required: true },
    buyerName: { type: String, required: true },
    handoverLocation: { type: String, required: true },
    dealDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Deal', dealSchema);