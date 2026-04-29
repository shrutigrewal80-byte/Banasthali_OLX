process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const User = require('./models/User'); 
const Product = require('./models/Product');
const Chat = require('./models/Chat');
const Report = require('./models/Report');
const Admin = require('./models/Admin');
const Deal = require('./models/Deal'); 

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

mongoose.connect('mongodb://127.0.0.1:27017/banasthali_olx')
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ DB Error:', err));

const SENDER_EMAIL = 'banasthalimarketplaces@gmail.com'; 
const SENDER_PASS = 'volfmrjjyhrkxwes'; 
let otpStore = {}; 

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// 1. Cloudinary Configure karo (Apni details dalo)
cloudinary.config({
    cloud_name: 'YOUR_CLOUD_NAME', 
    api_key: 'YOUR_API_KEY',
    api_secret: 'YOUR_API_SECRET'
});

// 2. Cloudinary Storage Setup
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'banasthali_olx', // Cloudinary mein is naam ka folder ban jayega
        allowed_formats: ['jpg', 'png', 'jpeg'],
    },
});

const uploadMulti = multer({ storage: storage }).array('images', 5);
const uploadSingle = multer({ storage: storage }).single('profilePic');

// 3. Add Product Route mein Change
app.post('/add-product', (req, res) => {
    uploadMulti(req, res, async (err) => {
        if (err) return res.json({ success: false, message: "Upload error" });
        try {
            // Cloudinary direct URL deta hai, localhost ki zaroorat nahi
            const imageUrls = req.files ? req.files.map(f => f.path) : [];
            
            const p = new Product({ 
                // ... baki sab same rahega
                images: imageUrls,
                // ...
            });
            await p.save();
            res.json({ success: true, message: "Item uploaded to Cloudinary!" });
        } catch (e) { res.json({ success: false, message: e.message }); }
    });
});

// ------------------- ADMIN LOGIN -------------------
app.post('/admin/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        if (email === SENDER_EMAIL && password === "volfmrjjyhrkxwes") return res.json({ success: true, user: { name: "Super Admin", role: 'admin', email: email } });
        const admin = await Admin.findOne({ email, password });
        if (admin) return res.json({ success: true, user: { name: admin.adminName, role: 'admin', email: admin.email } });
        res.json({ success: false, message: "Invalid Admin Credentials" });
    } catch (e) { res.json({ success: false, message: "Server Error" }); }
});

// ------------------- USER LOGIN -------------------
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email, password });
        if (!user) return res.json({ success: false, message: "Invalid Email or Password" });
        if (user.isBlocked) return res.json({ success: false, message: "Your Account is Blocked!" });
        res.json({ success: true, user });
    } catch (e) { res.json({ success: false, message: "Server Error" }); }
});

// ------------------- SEND OTP -------------------
app.post('/send-otp', (req, res) => {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000);
    otpStore[email] = otp;

    const transporter = nodemailer.createTransport({ 
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, 
        auth: { user: SENDER_EMAIL, pass: SENDER_PASS }
    });

    console.log(`\n⏳ OTP ${email} ko bhej raha hoon...`);

    transporter.sendMail({
        from: `"Banasthali_OLX" <${SENDER_EMAIL}>`, 
        to: email, 
        subject: 'Banasthali_OLX - Registration OTP',
        html: `<div style="text-align:center; padding:30px; background:#f4f7fe; border-radius:10px;"><h1 style="color:#800000;">Banasthali_OLX</h1><h3>Your OTP is:</h3><h1 style="color:#1565c0; font-size:40px;">${otp}</h1></div>`
    }, (err) => {
        if (err) {
            console.log("🔥 ERROR AAYA:", err.message);
            return res.json({ success: false, message: "Mail fail ho gayi. Apna naya App Password check karo.", error: err.message }); 
        }
        console.log("✅ SUCCESS: OTP Sent!");
        res.json({ success: true });
    });
});

// ------------------- REGISTER -------------------
app.post('/register', async (req, res) => {
    const { email, otp, password, name, course, year, contact, hostel } = req.body;
    if (parseInt(otpStore[email]) !== parseInt(otp)) return res.json({ success: false, message: "Invalid OTP" });
    try {
        const newUser = new User({ name, email, password, course, year, contact, hostel });
        await newUser.save(); delete otpStore[email];
        res.json({ success: true });
    } catch (e) { res.json({ success: false, message: "User already exists." }); }
});

// ------------------- ADMIN DATA -------------------
app.get('/admin/data', async (req, res) => {
    try {
        // Lean() use karne se data simple object ban jata hai jisme hum changes kar sakte hain
        const deals = await Deal.find().sort({ dealDate: -1 }).lean();
        const legacySoldProducts = await Product.find({ dealStatus: 'sold', isDeleted: { $ne: true } }).lean();
        
        const existingDealIds = deals.map(d => d.productId.toString());
        
        const filteredLegacy = legacySoldProducts.filter(p => !existingDealIds.includes(p._id.toString())).map(p => ({
            _id: p._id, 
            productId: p._id, 
            title: p.title, 
            // Fallback image logic
            image: (p.images && p.images.length > 0) ? p.images[0] : (p.image || ''), 
            originalPrice: p.price, 
            finalPrice: p.finalPrice || p.price, 
            sellerName: p.sellerName, 
            buyerName: p.buyerName || 'Unknown User', 
            handoverLocation: p.handoverLocation || 'Unknown Location', 
            dealDate: p.handoverTime || p.createdAt
        }));
        
        // Dono list ko jodd do
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

app.get('/admin/user/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        const ads = await Product.find({ sellerId: req.params.id });
        res.json({ success: true, user, ads });
    } catch(e) { res.json({ success: false }); }
});

// ------------------- GET PRODUCTS -------------------
app.get('/products', async (req, res) => {
    const products = await Product.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    res.json(products);
});

// ------------------- ADD PRODUCT (SELL ITEM) -------------------
app.post('/add-product', (req, res) => {
    uploadMulti(req, res, async (err) => {
        if (err) return res.json({ success: false, message: "Upload error" });
        try {
            if (!req.body.sellerId) return res.json({ success: false, message: "Seller ID is required!" });

            const imageUrls = req.files && req.files.length > 0 ? req.files.map(f => 'http://localhost:5000/uploads/' + f.filename) : [];
            const p = new Product({ 
                title: req.body.title || 'Untitled', price: Number(req.body.price) || 0, category: req.body.category || 'Others', 
                description: req.body.description || '', condition: req.body.condition || 'Good',
                sellerId: req.body.sellerId, sellerName: req.body.sellerName || 'Student', 
                sellerContact: req.body.sellerContact || 'N/A', hostel: req.body.hostel || 'Campus',            
                images: imageUrls, status: 'pending' 
            });
            await p.save(); 
            res.json({ success: true, message: "Item submitted and is pending approval." });
        } catch (e) { res.json({ success: false, message: e.message }); }
    });
});

// ------------------- ADMIN PRODUCT ACTION (APPROVE / REJECT) -------------------
app.post('/admin/product-action', async (req, res) => {
    const { productId, action } = req.body;
    try {
        if (action === 'approve') {
            await Product.findByIdAndUpdate(productId, { status: 'approved' });
            res.json({ success: true, message: "Product approved!" });
        } else if (action === 'reject') {
            await Product.findByIdAndUpdate(productId, { status: 'rejected', isDeleted: true });
            res.json({ success: true, message: "Product rejected!" });
        }
    } catch (e) { res.json({ success: false, message: "Server error" }); }
});

// ------------------- UPDATE PRODUCT -------------------
app.post('/update-product/:id', (req, res) => {
    uploadMulti(req, res, async (err) => {
        if (err) return res.json({ success: false });
        try {
            const p = await Product.findById(req.params.id);
            if(!p) return res.json({ success: false, message: "Not found" });

            const updateData = {
                title: req.body.title || p.title, price: req.body.price || p.price, category: req.body.category || p.category,
                condition: req.body.condition || p.condition, description: req.body.description || p.description
            };
            if (req.files && req.files.length > 0) updateData.images = req.files.map(f => 'http://localhost:5000/uploads/' + f.filename);
            await Product.findByIdAndUpdate(req.params.id, updateData);
            res.json({ success: true, message: "Product updated successfully!" });
        } catch (e) { res.json({ success: false, message: "Server error" }); }
    });
});

// ========================================================
// 🚨 SARE NAYE ROUTES YAHAN HAIN (MARK BOUGHT, DELETE, ETC)
// ========================================================

// ------------------- MARK BOUGHT -------------------
app.post('/mark-bought', async (req, res) => {
    const { productId, buyerId, buyerName, finalPrice, location } = req.body;
    try {
        await Product.findByIdAndUpdate(productId, {
            dealStatus: 'pending_verification',
            buyerId: buyerId,
            buyerName: buyerName,
            finalPrice: finalPrice,
            handoverLocation: location,
            handoverTime: new Date()
        });
        console.log(`🤝 Deal Alert: ${buyerName} want to buy item!`);
        res.json({ success: true, message: "Request sent to seller!" });
    } catch (e) { res.json({ success: false, message: e.message }); }
});

// ------------------- VERIFY DEAL (YES/NO) -------------------
// ------------------- VERIFY DEAL (YES/NO) -------------------
app.post('/verify-handover', async (req, res) => {
    const { productId, action } = req.body;
    try {
        const product = await Product.findById(productId);
        if (!product) return res.json({ success: false, message: "Product not found" });

        if (action === 'confirm') {
            product.dealStatus = 'sold';
            await product.save();

            // FIX: Deal save karte waqt image ko pakka store karna
            const newDeal = new Deal({
                productId: product._id, 
                title: product.title,
                // Agar images array hai toh pehli photo lo, warna empty string
                image: (product.images && product.images.length > 0) ? product.images[0] : '',
                originalPrice: product.price, 
                finalPrice: product.finalPrice,
                sellerId: product.sellerId, 
                sellerName: product.sellerName,
                buyerId: product.buyerId, 
                buyerName: product.buyerName,
                handoverLocation: product.handoverLocation
            });
            
            await newDeal.save();
            console.log(`✅ Deal Confirmed & Saved with Image: ${product.title}`);
            res.json({ success: true, message: "Deal Locked!" });

        } else if (action === 'reject') {
            product.dealStatus = 'available'; 
            product.buyerId = null; product.buyerName = null; 
            product.finalPrice = null; product.handoverLocation = null;
            await product.save();
            res.json({ success: true, message: "Deal Rejected!" });
        }
    } catch (e) { 
        console.error("❌ Handover Error:", e.message);
        res.json({ success: false, message: e.message }); 
    }
});

// ------------------- CHAT & REPORT -------------------
app.post('/record-chat', async (req, res) => {
    try {
        const chat = new Chat(req.body);
        await chat.save();
        res.json({ success: true });
    } catch (e) { res.json({ success: false }); }
});

app.post('/submit-report', async (req, res) => {
    try {
        const targetUser = await User.findById(req.body.targetId);
        const report = new Report({
            reporterId: req.body.reporterId, targetName: req.body.targetName,
            targetEmail: targetUser ? targetUser.email : 'N/A', targetHostel: targetUser ? targetUser.hostel : 'N/A',
            reason: req.body.reason
        });
        await report.save();
        res.json({ success: true });
    } catch (e) { res.json({ success: false }); }
});

// ------------------- UPDATE PROFILE -------------------
app.post('/update-profile-details', (req, res) => {
    uploadSingle(req, res, async (err) => {
        if (err) return res.json({ success: false });
        try {
            const updateData = { name: req.body.name, course: req.body.course, year: req.body.year, hostel: req.body.hostel, contact: req.body.contact };
            if (req.file) updateData.profilePic = 'http://localhost:5000/uploads/' + req.file.filename;
            const user = await User.findOneAndUpdate({ email: req.body.email }, updateData, { new: true });
            res.json({ success: true, user });
        } catch (e) { res.json({ success: false }); }
    });
});

// ------------------- START SERVER -------------------
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`✅ SARE ROUTES READY HAIN! Aag laga do!`);
});