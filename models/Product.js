const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    condition: { type: String, default: 'Good' },
    description: { type: String },
    
    // YEH LINE IMPORTANT HAI (Purane mein sirf 'image' tha, ab 'images' array hai)
    images: [{ type: String }], 
    
    hostel: { type: String, required: true },
    sellerId: { type: String, required: true },
    sellerName: { type: String, required: true },
    sellerContact: { type: String, required: true },
    status: { type: String, default: 'pending' }, 
    isDeleted: { type: Boolean, default: false }, 
    dealStatus: { type: String, default: 'available' },
    buyerId: { type: String },
    buyerName: { type: String },
    finalPrice: { type: Number },
    handoverLocation: { type: String },
    handoverTime: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);