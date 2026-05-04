const API_URL = 'http://localhost:5000';
let allProducts = [];
let currentRole = 'student';

// Landing Page Logic
window.showLandingSection = (sectionId) => {
    document.querySelectorAll('.landing-section').forEach(el => el.style.display = 'none');
    document.getElementById(sectionId + '-section').style.display = 'block';
};

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if(user && document.getElementById('home-section')) {
        if(user.role === 'admin') window.location.href = 'admin.html';
        else window.location.href = 'dashboard.html';
    }
});

// Auth Logic
window.logout = () => { localStorage.removeItem('user'); window.location.href = 'index.html'; };
window.openModal = (id) => document.getElementById(id).style.display = 'flex';
window.closeModal = (id) => document.getElementById(id).style.display = 'none';

window.switchRole = (r) => { 
    currentRole = r; 
    document.getElementById('btnStudent').className = r==='student'?'role-btn active':'role-btn';
    document.getElementById('btnAdmin').className = r==='admin'?'role-btn active':'role-btn';
    document.getElementById('formTitle').innerText = r==='student' ? "Student Login" : "Admin Login";
    const sl = document.getElementById('signupLinkText');
    if(sl) sl.style.display = r==='student' ? 'block' : 'none';
};

window.handleLogin = async (e) => {
    if(e) e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    if(!email || !password) return alert("Please enter email and password");
    
    const btn = document.querySelector('#loginForm button');
    btn.innerText = "Logging in...";
    
    const endpoint = (currentRole === 'admin') ? `${API_URL}/admin/login` : `${API_URL}/login`;
    try {
        const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
        const r = await res.json();
        if (r.success) {
            localStorage.setItem('user', JSON.stringify(r.user));
            if (currentRole === 'admin') window.location.href = 'admin.html';
            else window.location.href = 'dashboard.html';
        } else {
            alert(r.message || "Login Failed");
            btn.innerText = "Login";
        }
    } catch (err) { alert("Server Error!"); btn.innerText = "Login"; }
};

window.showSignup = () => { document.getElementById('loginForm').style.display = 'none'; document.getElementById('signupForm').style.display = 'block'; document.getElementById('formTitle').innerText = "Create Account"; };
window.showLogin = () => { document.getElementById('signupForm').style.display = 'none'; document.getElementById('loginForm').style.display = 'block'; document.getElementById('formTitle').innerText = "Student Login"; };

// FIXED: EMERGENCY OTP FALLBACK FOR PRESENTATION
window.sendOTP = async () => {
    const email = document.getElementById('regEmail').value;
    if(!email.endsWith('@banasthali.in')) return alert("Use @banasthali.in email");
    document.getElementById('otpStatus').innerText = "Sending OTP via secure mail... please wait.";
    
    try {
        const res = await fetch(`${API_URL}/send-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
        const d = await res.json();
        if(d.success) { 
            if(d.devOTP) {
                // Network blocked the email, but we bypass for presentation
                alert("⚠️ Network Firewall detected. Generating Emergency Presentation OTP: " + d.devOTP);
                document.getElementById('otpInput').value = d.devOTP; // Autofill
            } else {
                alert("OTP Sent! Check your Email.");
            }
            document.getElementById('otpStatus').innerText = "OTP Ready!"; 
            document.getElementById('signupStep2').style.display = 'block'; 
        } 
        else alert(d.message || "Failed to send OTP");
    } catch(err) {
        alert("Server Error! Check internet connection.");
        document.getElementById('otpStatus').innerText = "";
    }
};

window.verifyAndRegister = async () => {
    const data = {
        name: document.getElementById('regName').value, email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value, course: document.getElementById('regCourse').value,
        year: document.getElementById('regYear').value, contact: document.getElementById('regPhone').value,
        hostel: document.getElementById('regHostel').value, otp: document.getElementById('otpInput').value
    };
    const res = await fetch(`${API_URL}/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const d = await res.json();
    if(d.success) { alert("Registered Successfully! Login Now."); window.showLogin(); } else alert(d.message);
};

// Custom Category Logic
window.toggleCustomCategory = () => {
    const cat = document.getElementById('prodCategory').value;
    document.getElementById('prodCustomCategory').style.display = (cat === 'Other') ? 'block' : 'none';
};

// IMAGE SLIDER LOGIC
let sliderImages = [];
let currSlideIndex = 0;
window.openProductView = (id) => {
    const p = allProducts.find(x => x._id === id);
    if(!p) return;
    sliderImages = p.images && p.images.length > 0 ? p.images : [p.image || 'https://via.placeholder.com/400x200?text=No+Image']; 
    currSlideIndex = 0;
    document.getElementById('viewTitle').innerText = p.title; document.getElementById('viewPrice').innerText = `₹${p.price}`;
    document.getElementById('viewSellerName').innerText = p.sellerName; document.getElementById('viewHostel').innerText = p.hostel;
    document.getElementById('viewDesc').innerText = p.description || "No description provided.";
    renderSlide(); window.openModal('productViewModal');
};

window.changeSlide = (n) => { currSlideIndex += n; if (currSlideIndex >= sliderImages.length) currSlideIndex = 0; if (currSlideIndex < 0) currSlideIndex = sliderImages.length - 1; renderSlide(); };
window.goToSlide = (n) => { currSlideIndex = n; renderSlide(); };
function renderSlide() {
    document.getElementById('viewImage').src = sliderImages[currSlideIndex];
    let dotsHtml = '';
    sliderImages.forEach((img, i) => { dotsHtml += `<span class="dot ${i === currSlideIndex ? 'active' : ''}" onclick="goToSlide(${i})"></span>`; });
    document.getElementById('sliderDots').innerHTML = dotsHtml;
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('marketSection')) {
        let user = JSON.parse(localStorage.getItem('user'));
        if(!user) window.location.href = 'index.html';

        document.getElementById('welcomeName').innerText = user.name.split(' ')[0];
        document.getElementById('sideName').innerText = user.name;
        document.getElementById('sideProfileImg').src = user.profilePic || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
        document.getElementById('profNameDisplay').innerText = user.name;
        document.getElementById('profEmailDisplay').innerText = user.email;
        document.getElementById('profImgDisplay').src = user.profilePic || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
        
        ['Course','Year','Hostel','Contact'].forEach(k => {
            if(document.getElementById('d'+k)) document.getElementById('d'+k).innerText = user[k.toLowerCase()] || '-';
            if(document.getElementById('edit'+k)) document.getElementById('edit'+k).value = user[k.toLowerCase()] || '';
        });
        document.getElementById('editName').value = user.name;

        const load = async () => {
            const res = await fetch(`${API_URL}/products`);
            allProducts = await res.json();
            window.filterCategory('All');
            renderGrid(allProducts.filter(p=>p.sellerId===user._id), 'myGrid');
        };
        load();

        window.toggleEditMode = () => {
            const v = document.getElementById('viewMode'); const e = document.getElementById('editMode');
            if(e.style.display==='none') { v.style.display='none'; e.style.display='block'; } else { v.style.display='block'; e.style.display='none'; }
        };

        window.updateProfile = async (e) => {
            e.preventDefault();
            const fd = new FormData();
            fd.append('email', user.email); fd.append('name', document.getElementById('editName').value);
            fd.append('course', document.getElementById('editCourse').value); fd.append('year', document.getElementById('editYear').value);
            fd.append('hostel', document.getElementById('editHostel').value); fd.append('contact', document.getElementById('editContact').value);
            const fileInput = document.getElementById('editProfilePic');
            if (fileInput.files.length > 0) fd.append('profilePic', fileInput.files[0]);

            const res = await fetch(`${API_URL}/update-profile-details`, {method:'POST', body: fd});
            const data = await res.json();
            if(data.success) { localStorage.setItem('user', JSON.stringify(data.user)); alert("Profile Updated!"); window.location.reload(); }
        };

        window.openEditAd = (id) => {
            const p = allProducts.find(x => x._id === id);
            if(!p) return;
            document.getElementById('editAdId').value = id; document.getElementById('updTitle').value = p.title;
            document.getElementById('updPrice').value = p.price; document.getElementById('updCondition').value = p.condition || 'Good';
            document.getElementById('updCategory').value = p.category; document.getElementById('updDesc').value = p.description || '';
            window.openModal('editAdModal');
        };

        window.submitEditAd = async (e) => {
            e.preventDefault();
            const id = document.getElementById('editAdId').value;
            const fd = new FormData();
            fd.append('title', document.getElementById('updTitle').value); fd.append('price', document.getElementById('updPrice').value);
            fd.append('category', document.getElementById('updCategory').value); fd.append('condition', document.getElementById('updCondition').value);
            fd.append('description', document.getElementById('updDesc').value); 
            const fileInput = document.getElementById('updImage');
            for(let i=0; i < fileInput.files.length; i++) { fd.append('images', fileInput.files[i]); }
            
            await fetch(`${API_URL}/update-product/${id}`, {method:'POST', body:fd});
            alert("Ad Updated!."); window.closeModal('editAdModal'); location.reload();
        };

      window.delItem = async (id) => { 
    if(confirm("Are you sure you want to delete this?")) { 
        try {
            const res = await fetch(`${API_URL}/delete-product/${id}`, { method: 'DELETE' }); 
            const data = await res.json();
            
            if(data.success) {
                alert("Item deleted successfully!");
                location.reload(); 
            } else {
                alert("Failed to delete item: " + data.message);
            }
        } catch (err) {
            console.error("Fetch Error:", err);
            alert("Network/Server Crash Error: " + err.message);
        }
    } 
};

        window.openReportModal = async (sellerId, productId, targetName) => {
            window.openModal('reportModal'); document.getElementById('repTargetId').value = sellerId;
            document.getElementById('repProductId').value = productId; document.getElementById('repName').value = targetName;
        };

        window.submitComplaint = async (e) => {
            e.preventDefault();
            const data = { reporterId: user._id, targetName: document.getElementById('repName').value, targetId: document.getElementById('repTargetId').value, productId: document.getElementById('repProductId').value, reason: document.getElementById('repReason').value };
            await fetch(`${API_URL}/submit-report`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
            alert("Report Sent!"); window.closeModal('reportModal');
        };
    }

    if (document.getElementById('overviewSection')) {
        const loadAdmin = async () => {
            const res = await fetch(`${API_URL}/admin/data`);
            const d = await res.json();
            
            document.getElementById('totalUsers').innerText = d.stats.totalUsers;
            document.getElementById('activeAds').innerText = d.stats.activeListings;
            document.getElementById('pendingAds').innerText = d.pendingItems.length;
            document.getElementById('totalSalesCount').innerText = d.stats.totalSales || 0; 

            const pt = document.getElementById('pendingTable').querySelector('tbody'); pt.innerHTML='';
            d.pendingItems.forEach(i => {
                const img = (i.images && i.images.length>0) ? i.images[0] : (i.image || 'https://via.placeholder.com/40');
                pt.innerHTML+=`<tr><td><img src="${img}" onerror="this.src='https://via.placeholder.com/40'" style="width:40px;height:40px;object-fit:cover;border-radius:5px;"></td><td>${i.sellerName}</td><td>${i.title}</td><td>₹${i.price}</td><td><button onclick="act('${i._id}','approve')" style="color:white; background:green; border:none; padding:5px 10px; border-radius:5px;">Approve</button> <button onclick="act('${i._id}','reject')" style="color:white; background:red; border:none; padding:5px 10px; border-radius:5px;">Reject</button></td></tr>`;
            });

            const at = document.getElementById('allAdsTable').querySelector('tbody'); at.innerHTML='';
            d.allProducts.filter(p=>p.status==='approved').forEach(i => {
                const img = (i.images && i.images.length>0) ? i.images[0] : (i.image || 'https://via.placeholder.com/40');
                at.innerHTML+=`<tr><td><img src="${img}" onerror="this.src='https://via.placeholder.com/40'" style="width:40px;height:40px;object-fit:cover;border-radius:5px;"></td><td>${i.title}</td><td>${i.sellerName}</td><td>₹${i.price}</td><td>${new Date(i.createdAt).toLocaleDateString()}</td><td><button onclick="act('${i._id}','reject')" style="color:white; background:maroon; border:none; padding:5px; border-radius:3px;">Delete Ad</button></td></tr>`;
            });

            const ut = document.getElementById('usersTable').querySelector('tbody'); ut.innerHTML='';
            d.allUsers.forEach(u => ut.innerHTML+=`<tr><td><strong>${u.name}</strong></td><td>${u.email}</td><td>${u.course}</td><td>${u.itemCount}</td><td><button onclick="admAct('${u._id}','block')" style="color:red; border:1px solid red; padding:3px 8px; border-radius:5px; background:white;">Block</button></td><td><button onclick="showUserModal('${u._id}')" style="background:#1565c0; color:white; border:none; padding:5px 10px; border-radius:5px;">👁️ View Profile & Ads</button></td></tr>`);

            window.allDealsData = d.soldItems || [];
            window.renderDealsTable(window.allDealsData);

            const dlt = document.getElementById('deletedTable').querySelector('tbody'); dlt.innerHTML='';
            if(d.deletedItems && d.deletedItems.length > 0) {
                d.deletedItems.forEach(i => dlt.innerHTML+=`<tr><td>${i.title}</td><td>${i.sellerName}</td><td>${i.sellerContact}</td><td>₹${i.price}</td><td>${new Date().toLocaleDateString()}</td></tr>`);
            } else { dlt.innerHTML = `<tr><td colspan="5" style="text-align:center;">No deleted items found.</td></tr>`; }

            const rt = document.getElementById('reportsTable').querySelector('tbody'); rt.innerHTML='';
            d.reports.forEach(r => rt.innerHTML+=`<tr><td>${r.reporterId}</td><td>${r.targetName}</td><td>${r.reason}</td></tr>`);
            
            const ct = document.getElementById('chatLogsTable').querySelector('tbody'); ct.innerHTML='';
            d.chatLogs.forEach(c => ct.innerHTML+=`<tr><td>${c.productName || 'Item'}</td><td>${c.senderName || 'Unknown'} (${c.senderId})</td><td>${c.receiverName || 'Unknown'} (${c.receiverId})</td><td>${c.message}</td><td>${new Date(c.timestamp).toLocaleDateString()}</td></tr>`);
        };
        loadAdmin();
        window.act = async(id,a) => { await fetch(`${API_URL}/admin/product-action`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({productId:id,action:a})}); location.reload(); };
        window.admAct = async(id,a) => { await fetch(`${API_URL}/admin/user-action`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:id,action:a})}); location.reload(); };
        
        window.showUserModal = async (userId) => {
            const res = await fetch(`${API_URL}/admin/user/${userId}`);
            const data = await res.json();
            if(data.success) {
                const u = data.user;
                document.getElementById('popUserName').innerText = u.name + "'s Profile";
                document.getElementById('popUserInfo').innerHTML = `<div style="display:flex; gap:15px; align-items:center;"><img src="${u.profilePic}" style="width:70px; height:70px; border-radius:50%; object-fit:cover;"><div><p><strong>Email:</strong> ${u.email}</p><p><strong>Contact:</strong> ${u.contact}</p><p><strong>Hostel:</strong> ${u.hostel}</p><p><strong>Course:</strong> ${u.course} (${u.year})</p></div></div>`;
                
                const pt = document.getElementById('popUserAdsTable').querySelector('tbody'); pt.innerHTML='';
                if(data.ads.length > 0) {
                    data.ads.forEach(ad => { 
                        const img = (ad.images && ad.images.length>0) ? ad.images[0] : (ad.image || 'https://via.placeholder.com/40');
                        const statusTxt = ad.isDeleted ? 'Deleted' : (ad.dealStatus === 'sold' ? 'Sold Out' : ad.status);
                        const statusBg = ad.isDeleted ? '#ffebee' : (ad.dealStatus === 'sold' ? '#d4edda' : (ad.status==='approved'?'#e8f5e9':'#fff3cd'));
                        const statusCol = ad.isDeleted ? 'red' : (ad.dealStatus === 'sold' ? 'green' : '#ff9800');
                        pt.innerHTML += `<tr><td><img src="${img}" onerror="this.src='https://via.placeholder.com/40'" style="width:40px;height:40px;object-fit:cover;border-radius:5px;"></td><td>${ad.title}</td><td><span style="background:${statusBg}; color:${statusCol}; padding:3px 8px; border-radius:5px; font-weight:bold;">${statusTxt}</span></td><td>₹${ad.price}</td></tr>`; 
                    });
                } else { pt.innerHTML = `<tr><td colspan="4">No ads posted yet.</td></tr>`; }
                window.openModal('userDetailsModal');
            }
        };

        window.showDealModal = (dealId) => {
            const d = window.allDealsData.find(x => x._id === dealId);
            if(d) {
                document.getElementById('dealPopImg').src = d.image || 'https://via.placeholder.com/400x200?text=No+Image';
                document.getElementById('dealPopTitle').innerText = d.title;
                document.getElementById('dealPopPrice').innerText = `₹${d.finalPrice}`;
                document.getElementById('dealPopSeller').innerText = d.sellerName;
                document.getElementById('dealPopBuyer').innerText = d.buyerName;
                document.getElementById('dealPopLoc').innerText = d.handoverLocation;
                document.getElementById('dealPopDate').innerText = new Date(d.dealDate).toLocaleDateString();
                window.openModal('dealViewModal');
            }
        };

        window.renderDealsTable = (deals) => {
            const dt = document.getElementById('dealsTable').querySelector('tbody'); dt.innerHTML='';
            if(deals.length > 0) {
                deals.forEach(s => {
                    const img = s.image || 'https://via.placeholder.com/40';
                    dt.innerHTML+=`<tr><td><img src="${img}" onerror="this.src='https://via.placeholder.com/40'" style="width:40px;height:40px;object-fit:cover;border-radius:5px;"></td><td><strong>${s.title}</strong><br><span style="font-size:11px;color:gray;">M.R.P: ₹${s.originalPrice}</span></td><td><span style="background:#e3f2fd; color:#1565c0; padding:3px 8px; border-radius:10px; font-size:12px;">${s.sellerName}</span></td><td><span style="background:#fce4ec; color:#c2185b; padding:3px 8px; border-radius:10px; font-size:12px;">${s.buyerName}</span></td><td style="color:green; font-weight:bold;">₹${s.finalPrice}</td><td>${new Date(s.dealDate).toLocaleDateString()}</td><td><button onclick="showDealModal('${s._id}')" style="background:green; color:white; border:none; padding:5px 10px; border-radius:5px;">👁️ View Deal</button></td></tr>`;
                });
            } else { dt.innerHTML = `<tr><td colspan="7" style="text-align:center; color:gray;">No matching deals.</td></tr>`; }
        };

        window.filterDeals = () => {
            const sq = document.getElementById('searchSeller').value.toLowerCase(); const bq = document.getElementById('searchBuyer').value.toLowerCase();
            const filtered = window.allDealsData.filter(d => d.sellerName.toLowerCase().includes(sq) && d.buyerName.toLowerCase().includes(bq));
            renderDealsTable(filtered);
        };
    }
});

window.switchTab = (id, el) => { document.querySelectorAll('.tab-section').forEach(s=>s.classList.remove('active')); document.getElementById(id+'Section').classList.add('active'); if(el) { document.querySelectorAll('.nav-links li').forEach(l=>l.classList.remove('active')); el.classList.add('active'); } };
window.switchAdminTab = window.switchTab;

window.filterCategory = (cat, el) => { 
    if(el) { document.querySelectorAll('.cat-pill').forEach(p=>p.classList.remove('active')); el.classList.add('active'); } 
    const user = JSON.parse(localStorage.getItem('user'));
    let list = allProducts.filter(p=>p.status==='approved' && p.sellerId !== user._id); 
    if(cat !== 'All') list = list.filter(p=>p.category===cat);
    renderGrid(list, 'marketGrid'); 
};

window.filterProducts = () => { 
    const v = document.getElementById('searchInput').value.toLowerCase(); 
    const user = JSON.parse(localStorage.getItem('user'));
    renderGrid(allProducts.filter(p=>p.title.toLowerCase().includes(v) && p.status==='approved' && p.sellerId !== user._id), 'marketGrid'); 
};

window.startChat = async (sName, sId, sContact, pTitle, pId) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const payload = { productId: pId, productName: pTitle, senderId: user.email, senderName: user.name, receiverId: sId, receiverName: sName, message: `WhatsApp redirect for ${pTitle}` };
    await fetch(`${API_URL}/record-chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    window.open(`https://api.whatsapp.com/send?phone=91${sContact}&text=${encodeURIComponent(`Hi ${sName}, I saw your ad for "${pTitle}" on Banasthali_OLX.`)}`);
};

function renderGrid(list, id) {
    const container = document.getElementById(id); if(!container) return; container.innerHTML = '';
    const user = JSON.parse(localStorage.getItem('user'));
    
    list.forEach(p => {
        const isMineItem = (p.sellerId === user._id); 
        if(!isMineItem && p.dealStatus !== 'available') return;
        const mainImage = p.images && p.images.length > 0 ? p.images[0] : (p.image || 'https://via.placeholder.com/150'); 

        let actionHtml = '';
        if (isMineItem) {
            if (p.dealStatus === 'pending_verification') {
                actionHtml = `<div style="background:#fff3cd; padding:10px; border-radius:8px; margin-top:10px; font-size:12px;"><b>Deal Alert!</b><br>${p.buyerName} claims they bought this for ₹${p.finalPrice}.<div style="display:flex; gap:5px; margin-top:5px;"><button onclick="verifyDeal('${p._id}', 'confirm')" style="background:green; color:white; flex:1; border:none; padding:5px; border-radius:5px;">✅ Yes</button><button onclick="verifyDeal('${p._id}', 'reject')" style="background:red; color:white; flex:1; border:none; padding:5px; border-radius:5px;">❌ No</button></div></div>`;
            } else if (p.dealStatus === 'sold') { 
                actionHtml = `<div style="background:#d4edda; color:green; padding:8px; text-align:center; border-radius:5px; font-weight:bold;">SOLD OUT</div><button onclick="event.stopPropagation(); delItem('${p._id}')" style="width:100%; margin-top:5px; padding:8px; background:#FFEBEE; color:red; border:none; border-radius:5px;">🗑️ Hide Record</button>`;
            } else { 
                actionHtml = `<div style="display:flex; gap:5px; margin-top:10px;"><button onclick="event.stopPropagation(); openEditAd('${p._id}')" style="flex:1; padding:8px; background:#E3F2FD; color:#1565C0; border:none; border-radius:5px;">✏️ Edit</button><button onclick="event.stopPropagation(); delItem('${p._id}')" style="flex:1; padding:8px; background:#FFEBEE; color:red; border:none; border-radius:5px;">🗑️ Delete</button></div>`; 
            }
        } else {
            actionHtml = `<div style="font-size:12px; margin-bottom:5px;"><b>Seller:</b> ${p.sellerName} | ${p.hostel}</div>
            <div style="display:flex; gap:5px;"><button style="background:#25D366; color:white; flex:1; border:none; padding:8px; border-radius:5px;" onclick="event.stopPropagation(); startChat('${p.sellerName}','${p.sellerId}','${p.sellerContact}','${p.title}','${p._id}')">WhatsApp</button><button style="background:var(--maroon); color:white; flex:1; border:none; padding:8px; border-radius:5px;" onclick="event.stopPropagation(); openHandover('${p._id}')">Mark Bought</button></div>
            <button style="background:transparent; color:#888; width:100%; border:none; padding:5px; font-size:11px; margin-top:5px; text-decoration:underline;" onclick="event.stopPropagation(); openReportModal('${p.sellerId}', '${p._id}', '${p.sellerName}')">Report</button>`;
        }

        container.innerHTML += `<div class="product-card" style="cursor:pointer; ${p.dealStatus==='sold'?'opacity:0.6':''}" onclick="openProductView('${p._id}')">
            <img src="${mainImage}" onerror="this.src='https://via.placeholder.com/150'" style="width:100%; height:150px; object-fit:cover;">
            <div class="card-body"><h4>${p.title}</h4><p style="color:maroon; font-weight:bold; font-size:18px;">₹${p.price}</p>${actionHtml}</div>
        </div>`;
    });
}

// FIXED: PostAd explicitly mapped out globally so it fires 100%
window.postAd = async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user'));
    if(!user) return alert("Please Login First!");

    const fd = new FormData();
    fd.append('title', document.getElementById('prodTitle').value);
    fd.append('price', document.getElementById('prodPrice').value);
    
    let cat = document.getElementById('prodCategory').value;
    if(cat === 'Other') cat = document.getElementById('prodCustomCategory').value || 'Others';
    fd.append('category', cat);
    
    fd.append('condition', document.getElementById('prodCondition').value);
    fd.append('description', document.getElementById('prodDesc').value); 
    
    const fileInput = document.getElementById('prodImage');
    if(fileInput.files.length === 0) return alert("Please select at least 1 image");
    if(fileInput.files.length > 5) return alert("Max 5 images allowed.");
    for(let i=0; i < fileInput.files.length; i++) { fd.append('images', fileInput.files[i]); }

    fd.append('sellerId', user._id); 
    fd.append('sellerName', user.name); 
    fd.append('sellerContact', user.contact || user.email); 
    fd.append('hostel', user.hostel || 'N/A');
    
    try {
        const res = await fetch(`${API_URL}/add-product`, {method:'POST', body:fd});
        const d = await res.json();
        if(d.success){ alert("Ad Submitted for Admin Approval!"); window.closeModal('sellModal'); location.reload(); }
        else { alert("Failed to post ad: " + (d.message || "Unknown error")); }
    } catch(err) {
        alert("Server Error while posting ad!");
    }
};

window.openHandover = (id) => { document.getElementById('hoProductId').value = id; window.openModal('handoverModal'); };
window.submitHandover = async (e) => { e.preventDefault(); const user = JSON.parse(localStorage.getItem('user')); const data = { productId: document.getElementById('hoProductId').value, buyerId: user._id, buyerName: user.name, finalPrice: document.getElementById('hoPrice').value, location: document.getElementById('hoLocation').value }; await fetch(`${API_URL}/mark-bought`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) }); alert("Request sent to seller!"); window.closeModal('handoverModal'); location.reload(); };
window.verifyDeal = async (productId, action) => { await fetch(`${API_URL}/verify-handover`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({productId, action}) }); alert(action === 'confirm' ? "Deal Locked!" : "Deal Rejected!"); location.reload(); };