process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2; // ADDED
const { CloudinaryStorage } = require('multer-storage-cloudinary'); // ADDED

const User = require('./models/User'); 
const Product = require('./models/Product');
const Chat = require('./models/Chat');
const Report = require('./models/Report');
const Admin = require('./models/Admin');
const Deal = require('./models/Deal'); 

const app = express();
const PORT = process.env.PORT || 10000;

// --- CLOUDINARY CONFIGURATION ---
// Inhe Render Dashboard -> Environment Variables mein daalna
cloudinary.config({ 
  cloud_name: 'dlsqjgb68', 
  api_key: '658982783727195', 
  api_secret: 'WPSuh4e9JlZCO3dEhGoTCLTMngA' 
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'banasthali_olx',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});
// --------------------------------

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

const MONGO_URI = 'mongodb+srv://shruti_admin:radhe_radhe@cluster0.oo11flx.mongodb.net/banasthali_olx?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ DB Error:', err));

const SENDER_EMAIL = 'banasthalimarketplaces@gmail.com'; 
const SENDER_PASS = 'volfmrjjyhrkxwes'; 
let otpStore = {}; 

const uploadMulti = multer({ storage: storage }).array('images', 5);
const uploadSingle = multer({ storage: storage }).single('profilePic');

// --- ROUTES ---
app.post('/admin/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        if (email === SENDER_EMAIL && password === "volfmrjjyhrkxwes") return res.json({ success: true, user: { name: "Super Admin", role: 'admin', email: email } });
        const admin = await Admin.findOne({ email, password });
        if (admin) return res.json({ success: true, user: { name: admin.adminName, role: 'admin', email: admin.email } });
        res.json({ success: false, message: "Invalid Admin Credentials" });
    } catch (e) { res.json({ success: false, message: "Server Error" }); }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email, password });
        if (!user) return res.json({ success: false, message: "Invalid Email or Password" });
        if (user.isBlocked) return res.json({ success: false, message: "Your Account is Blocked!" });
        res.json({ success: true, user });
    } catch (e) { res.json({ success: false, message: "Server Error" }); }
});

app.post('/send-otp', (req, res) => {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000);
    otpStore[email] = otp;
    const transporter = nodemailer.createTransport({ 
        host: 'smtp.gmail.com', port: 465, secure: true, auth: { user: SENDER_EMAIL, pass: SENDER_PASS }
    });
    transporter.sendMail({
        from: `"Banasthali_OLX" <${SENDER_EMAIL}>`, to: email, subject: 'Banasthali_OLX - Registration OTP',
        html: `<div style="text-align:center; padding:30px; background:#f4f7fe; border-radius:10px;"><h1>Banasthali_OLX</h1><h3>OTP:</h3><h1>${otp}</h1></div>`
    }, (err) => {
        if (err) return res.json({ success: false, message: "Mail fail", error: err.message }); 
        res.json({ success: true });
    });
});

app.post('/register', async (req, res) => {
    const { email, otp, password, name, course, year, contact, hostel } = req.body;
    if (parseInt(otpStore[email]) !== parseInt(otp)) return res.json({ success: false, message: "Invalid OTP" });
    try {
        const newUser = new User({ name, email, password, course, year, contact, hostel });
        await newUser.save(); delete otpStore[email];
        res.json({ success: true });
    } catch (e) { res.json({ success: false, message: "User exists." }); }
});

app.get('/admin/data', async (req, res) => {
    try {
        const deals = await Deal.find().sort({ dealDate: -1 }).lean();
        const legacySoldProducts = await Product.find({ dealStatus: 'sold', isDeleted: { $ne: true } }).lean();
        const existingDealIds = deals.map(d => d.productId.toString());
        const filteredLegacy = legacySoldProducts.filter(p => !existingDealIds.includes(p._id.toString())).map(p => ({
            _id: p._id, productId: p._id, title: p.title, 
            image: (p.images && p.images.length > 0) ? p.images[0] : (p.image || ''), 
            originalPrice: p.price, finalPrice: p.finalPrice || p.price, sellerName: p.sellerName, 
            buyerName: p.buyerName || 'Unknown User', handoverLocation: p.handoverLocation || 'Unknown Location', 
            dealDate: p.handoverTime || p.createdAt
        }));
        const soldItems = [...deals, ...filteredLegacy].sort((a,b) => new Date(b.dealDate) - new Date(a.dealDate));
        const allProducts = await Product.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
        const deletedItems = await Product.find({ isDeleted: true }).sort({ createdAt: -1 });
        const pendingItems = await Product.find({ status: 'pending', isDeleted: { $ne: true } }).sort({ createdAt: -1 });
        const stats = { 
            totalUsers: await User.countDocuments({role:{$ne:'admin'}}), 
            activeListings: await Product.countDocuments({status:'approved', isDeleted: { $ne: true }}),
            totalSales: soldItems.length 
        };
        const reports = await Report.find().sort({ createdAt: -1 });
        const chatLogs = await Chat.find().sort({ timestamp: -1 });
        const allUsersRaw = await User.find({ role: { $ne: 'admin' } });
        const allUsers = await Promise.all(allUsersRaw.map(async (u) => {
            const count = await Product.countDocuments({ sellerId: u._id, isDeleted: { $ne: true } });
            return { ...u._doc, itemCount: count };
        }));
        res.json({ success: true, stats, pendingItems, reports, allUsers, chatLogs, soldItems, deletedItems, allProducts });
    } catch(e) { res.json({ success: false }); }
});

app.get('/products', async (req, res) => {
    const products = await Product.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    res.json(products);
});

// --- UPDATED ADD PRODUCT WITH CLOUDINARY ---
app.post('/add-product', (req, res) => {
    uploadMulti(req, res, async (err) => {
        if (err) return res.json({ success: false, message: "Upload error" });
        try {
            if (!req.body.sellerId) return res.json({ success: false, message: "Seller ID required" });

            // Cloudinary returns .path for the URL
            const imageUrls = req.files && req.files.length > 0 ? req.files.map(f => f.path) : [];
            
            const p = new Product({ 
                title: req.body.title, price: Number(req.body.price), category: req.body.category, 
                description: req.body.description, condition: req.body.condition,
                sellerId: req.body.sellerId, sellerName: req.body.sellerName, 
                sellerContact: req.body.sellerContact, hostel: req.body.hostel,            
                images: imageUrls, status: 'pending' 
            });
            await p.save(); 
            res.json({ success: true, message: "Item pending approval." });
        } catch (e) { res.json({ success: false, message: e.message }); }
    });
});

app.post('/update-product/:id', (req, res) => {
    uploadMulti(req, res, async (err) => {
        if (err) return res.json({ success: false });
        try {
            const p = await Product.findById(req.params.id);
            const updateData = {
                title: req.body.title || p.title, price: req.body.price || p.price, category: req.body.category || p.category,
                condition: req.body.condition || p.condition, description: req.body.description || p.description
            };
            if (req.files && req.files.length > 0) updateData.images = req.files.map(f => f.path);
            await Product.findByIdAndUpdate(req.params.id, updateData);
            res.json({ success: true, message: "Updated!" });
        } catch (e) { res.json({ success: false }); }
    });
});

app.delete('/delete-product/:id', async (req, res) => {
    try {
        await Product.findByIdAndUpdate(req.params.id, { isDeleted: true });
        res.json({ success: true });
    } catch (e) { res.json({ success: false }); }
});

app.post('/update-profile-details', (req, res) => {
    uploadSingle(req, res, async (err) => {
        if (err) return res.json({ success: false });
        try {
            const updateData = { name: req.body.name, course: req.body.course, year: req.body.year, hostel: req.body.hostel, contact: req.body.contact };
            if (req.file) updateData.profilePic = req.file.path;
            const user = await User.findOneAndUpdate({ email: req.body.email }, updateData, { new: true });
            res.json({ success: true, user });
        } catch (e) { res.json({ success: false }); }
    });
});

// All other routes (Mark-bought, chat, etc.) keep them as they were in your code
app.post('/mark-bought', async (req, res) => {
    const { productId, buyerId, buyerName, finalPrice, location } = req.body;
    try {
        await Product.findByIdAndUpdate(productId, {
            dealStatus: 'pending_verification', buyerId, buyerName, finalPrice, handoverLocation: location, handoverTime: new Date()
        });
        res.json({ success: true });
    } catch (e) { res.json({ success: false }); }
});

app.post('/verify-handover', async (req, res) => {
    const { productId, action } = req.body;
    try {
        const product = await Product.findById(productId);
        if (action === 'confirm') {
            product.dealStatus = 'sold'; await product.save();
            const newDeal = new Deal({
                productId: product._id, title: product.title,
                image: (product.images && product.images.length > 0) ? product.images[0] : '',
                originalPrice: product.price, finalPrice: product.finalPrice,
                sellerId: product.sellerId, sellerName: product.sellerName,
                buyerId: product.buyerId, buyerName: product.buyerName, handoverLocation: product.handoverLocation
            });
            await newDeal.save();
            res.json({ success: true });
        } else {
            product.dealStatus = 'available'; await product.save();
            res.json({ success: true });
        }
    } catch (e) { res.json({ success: false }); }
});

app.post('/record-chat', async (req, res) => {
    try { const chat = new Chat(req.body); await chat.save(); res.json({ success: true }); } 
    catch (e) { res.json({ success: false }); }
});

app.post('/submit-report', async (req, res) => {
    try {
        const targetUser = await User.findById(req.body.targetId);
        const report = new Report({
            reporterId: req.body.reporterId, targetName: req.body.targetName,
            targetEmail: targetUser ? targetUser.email : 'N/A', reason: req.body.reason
        });
        await report.save(); res.json({ success: true });
    } catch (e) { res.json({ success: false }); }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});