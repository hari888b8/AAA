import { navigate, showToast, showModal, closeModal } from '../main.js';
import { api } from '../api.js';
import { getRole } from '../store.js';
import { t } from '../i18n.js';
import { showCheckout } from '../payments.js';
import { showReviewsModal } from '../reviews.js';

/**
 * AgriGalaxy — Input Supplier Marketplace
 * Seeds · Fertilizers · Pesticides · Organic Inputs
 *
 * Two modes:
 *   Seller (supplier role) → List store, manage products, view orders
 *   Buyer  (farmer role)   → Browse stores, search products, compare prices
 *
 * "This is the initial app in this entire ecosystem platform"
 */

export function renderAgriGalaxy(container) {
  const role = getRole();
  let mode = (role === 'supplier') ? 'seller' : 'buyer'; // seller or buyer
  let tab = 'stores';
  let loading = false;
  let stores = [];
  let products = [];
  let myStore = null;
  let myProducts = [];
  let orders = [];
  let searchQ = '';
  let categoryFilter = '';
  let districtFilter = '';

  const CATEGORIES = [
    { id: 'seeds',       icon: '🌱', label: 'Seeds',       color: '#33691E' },
    { id: 'fertilizers', icon: '🧪', label: 'Fertilizers', color: '#E65100' },
    { id: 'pesticides',  icon: '🐛', label: 'Pesticides',  color: '#C62828' },
    { id: 'organic',     icon: '🍃', label: 'Organic',     color: '#2E7D32' },
    { id: 'tools',       icon: '🔧', label: 'Tools',       color: '#546E7A' },
    { id: 'irrigation',  icon: '💧', label: 'Irrigation',  color: '#0277BD' },
    { id: 'growth_promoters', icon: '🌿', label: 'Growth Promoters', color: '#00695C' },
    { id: 'soil_health', icon: '🏔️', label: 'Soil Health', color: '#795548' },
  ];

  const SEED_TYPES = ['Paddy','Wheat','Maize','Cotton','Groundnut','Soybean','Sunflower','Chilli','Tomato','Onion','Brinjal','Okra','Mango','Banana','Coconut','Sugarcane','Turmeric','Pulses (Toor)','Pulses (Moong)','Others'];

  // ── SAMPLE DATA ──────────────────────────────────────────────────────────
  const SAMPLE_STORES = [
    { id:'gs1', name:'Sri Lakshmi Agri Inputs', district:'Guntur', phone:'9876543210', categories:['seeds','fertilizers','pesticides'], verified:true, rating:4.7, description:'Established in 2005. Authorized dealer for Bayer, UPL, Mahyco. Wide range of seeds and crop protection chemicals.' },
    { id:'gs2', name:'Ravi Organic Farm Store', district:'Krishna', phone:'9988776655', categories:['organic','seeds','soil_health'], verified:true, rating:4.9, description:'100% organic products. Neem-based pesticides, vermicompost, bio-fertilizers. Certified organic seeds.' },
    { id:'gs3', name:'Sai Fertilizer Centre', district:'West Godavari', phone:'9445566778', categories:['fertilizers','growth_promoters'], verified:false, rating:4.3, description:'Bulk fertilizer dealer — DAP, Urea, Potash, Micronutrients. Home delivery for orders above ₹5000.' },
    { id:'gs4', name:'Kisan Seeds & Chemicals', district:'Prakasam', phone:'9123456789', categories:['seeds','pesticides','tools'], verified:true, rating:4.5, description:'Hybrid seeds specialist — BT Cotton, Paddy, Chilli, Maize. All major brands. Competitive pricing.' },
    { id:'gs5', name:'AquaGrow Inputs', district:'Nellore', phone:'9876501234', categories:['seeds','irrigation','tools'], verified:false, rating:4.1, description:'Specializing in paddy seeds and irrigation equipment. Drip systems, sprinklers, mulch films.' },
    { id:'gs6', name:'green Earth Agri Solutions', district:'East Godavari', phone:'9012345678', categories:['organic','growth_promoters','soil_health'], verified:true, rating:4.8, description:'Bio-inputs and growth promoters. Humic acid, seaweed extract, amino acids. Lab-tested products.' },
  ];
  const SAMPLE_PRODUCTS = [
    { id:'gp1', name:'BT Cotton Seeds (Bollgard II)', brand:'Mahyco', category:'seeds', price:1600, unit:'per packet (450g)', in_stock:true, store_name:'Kisan Seeds & Chemicals', store_id:'gs4', description:'High-yielding BT cotton hybrid. Bollworm resistant. Suitable for irrigated & rainfed conditions. 160-170 days crop duration.' },
    { id:'gp2', name:'DAP Fertilizer 50kg', brand:'IFFCO', category:'fertilizers', price:1350, unit:'per bag', in_stock:true, store_name:'Sai Fertilizer Centre', store_id:'gs3', description:'Di-ammonium phosphate. NPK ratio 18:46:0. Essential for root development and early plant growth.' },
    { id:'gp3', name:'Neem Oil Pesticide 1L', brand:'Biogrow', category:'organic', price:380, unit:'per litre', in_stock:true, store_name:'Ravi Organic Farm Store', store_id:'gs2', description:'Cold-pressed neem oil, 3000 PPM azadirachtin. Effective against aphids, whitefly, mites. Organic certified.' },
    { id:'gp4', name:'Paddy Seeds (BPT 5204)', brand:'APSSDC', category:'seeds', price:85, unit:'per kg', in_stock:true, store_name:'Sri Lakshmi Agri Inputs', store_id:'gs1', description:'Sona Masoori variety. Medium duration (130-135 days). Fine grain quality. Government approved seed.' },
    { id:'gp5', name:'Imidacloprid 17.8% SL', brand:'Bayer', category:'pesticides', price:520, unit:'per 250ml', in_stock:true, store_name:'Sri Lakshmi Agri Inputs', store_id:'gs1', description:'Systemic insecticide for controlling sucking pests — aphids, jassids, whitefly. Low dosage.' },
    { id:'gp6', name:'Vermicompost 50kg', brand:'Green Earth', category:'soil_health', price:450, unit:'per bag', in_stock:true, store_name:'green Earth Agri Solutions', store_id:'gs6', description:'Premium vermicompost. Improves soil structure, water holding capacity. Rich in NPK and micronutrients.' },
    { id:'gp7', name:'Drip Irrigation Kit (1 acre)', brand:'Jain', category:'irrigation', price:18500, unit:'per kit', in_stock:true, store_name:'AquaGrow Inputs', store_id:'gs5', description:'Complete drip irrigation system for 1 acre. Includes laterals, drippers, filters, fittings. 60% water savings.' },
    { id:'gp8', name:'Humic Acid Liquid', brand:'GreenEarth', category:'growth_promoters', price:650, unit:'per litre', in_stock:true, store_name:'green Earth Agri Solutions', store_id:'gs6', description:'12% humic acid concentrate. Improves nutrient uptake, root development. Use 2-3ml per litre of water.' },
    { id:'gp9', name:'Groundnut Seeds (K-6)', brand:'ICRISAT', category:'seeds', price:120, unit:'per kg', in_stock:false, store_name:'Kisan Seeds & Chemicals', store_id:'gs4', description:'High-yielding groundnut variety. 110-120 days duration. Drought tolerant. Suitable for Rayalaseema region.' },
    { id:'gp10', name:'Urea 45kg', brand:'IFFCO', category:'fertilizers', price:266, unit:'per bag', in_stock:true, store_name:'Sai Fertilizer Centre', store_id:'gs3', description:'46% Nitrogen. Essential for vegetative growth. Government subsidized rate. Apply in split doses.' },
  ];

  function render() {
    const isSeller = mode === 'seller';
    container.innerHTML = `
      <!-- HEADER -->
      <div style="background:linear-gradient(135deg,#6A1B9A,#4A148C);color:white;padding:14px 16px 10px">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:28px">🌐</span>
          <div>
            <div style="font-weight:800;font-size:18px">AgriGalaxy</div>
            <div style="font-size:11px;opacity:0.85">Input Supplier Marketplace · Seeds · Fertilizers · Pesticides</div>
          </div>
        </div>
      </div>

      <!-- MODE TOGGLE -->
      <div class="mode-toggle-bar" style="display:flex;margin:8px 14px;background:#F5F5F5;border-radius:12px;padding:3px;border:1px solid #E0E0E0">
        <button data-gmode="buyer" style="flex:1;padding:8px;border-radius:10px;font-size:12px;font-weight:600;border:none;cursor:pointer;${mode==='buyer'?'background:#6A1B9A;color:white;box-shadow:0 2px 6px rgba(0,0,0,0.15)':'background:transparent;color:#757575'}">🛒 Browse & Buy</button>
        <button data-gmode="seller" style="flex:1;padding:8px;border-radius:10px;font-size:12px;font-weight:600;border:none;cursor:pointer;${mode==='seller'?'background:#4A148C;color:white;box-shadow:0 2px 6px rgba(0,0,0,0.15)':'background:transparent;color:#757575'}">🏪 My Store</button>
      </div>

      <!-- TABS -->
      <div class="tab-bar" style="overflow-x:auto;white-space:nowrap">
        ${isSeller ? `
          <button class="tab-btn ${tab==='stores'?'active':''}" data-tab="stores">🏪 My Store</button>
          <button class="tab-btn ${tab==='products'?'active':''}" data-tab="products">📦 Products</button>
          <button class="tab-btn ${tab==='orders'?'active':''}" data-tab="orders">📋 Orders</button>
          <button class="tab-btn ${tab==='analytics'?'active':''}" data-tab="analytics">📊 Analytics</button>
        ` : `
          <button class="tab-btn ${tab==='stores'?'active':''}" data-tab="stores">🏪 Stores</button>
          <button class="tab-btn ${tab==='products'?'active':''}" data-tab="products">🌱 Products</button>
          <button class="tab-btn ${tab==='orders'?'active':''}" data-tab="orders">📋 My Orders</button>
        `}
      </div>

      <div style="padding-bottom:80px">
        ${loading ? '<div class="loading"><div class="spinner"></div></div>'
          : tab === 'stores' ? (isSeller ? renderMyStore() : renderStores())
          : tab === 'products' ? (isSeller ? renderMyProducts() : renderBrowseProducts())
          : tab === 'orders' ? renderOrders()
          : tab === 'analytics' ? renderAnalytics()
          : ''}
      </div>
    `;
    attachEvents();
  }

  // ─── BUYER: BROWSE STORES ────────────────────────────────────────────────
  function renderStores() {
    let filtered = stores;
    if (searchQ) filtered = filtered.filter(s => `${s.name} ${s.district} ${s.description}`.toLowerCase().includes(searchQ.toLowerCase()));
    if (districtFilter) filtered = filtered.filter(s => s.district === districtFilter);

    const districts = [...new Set(stores.map(s => s.district).filter(Boolean))].sort();

    return `
      <div style="padding:10px 14px 0">
        <!-- Stats -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px">
          <div style="text-align:center;background:white;border-radius:10px;padding:10px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
            <div style="font-weight:800;font-size:18px;color:#6A1B9A">${stores.length}</div>
            <div style="font-size:10px;color:#757575">Stores</div>
          </div>
          <div style="text-align:center;background:white;border-radius:10px;padding:10px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
            <div style="font-weight:800;font-size:18px;color:#6A1B9A">${products.length}</div>
            <div style="font-size:10px;color:#757575">Products</div>
          </div>
          <div style="text-align:center;background:white;border-radius:10px;padding:10px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
            <div style="font-weight:800;font-size:18px;color:#6A1B9A">${districts.length}</div>
            <div style="font-size:10px;color:#757575">Districts</div>
          </div>
        </div>

        <!-- Search -->
        <div style="display:flex;align-items:center;background:white;border:1px solid #E0E0E0;border-radius:10px;padding:8px 12px;margin-bottom:10px">
          <span style="margin-right:8px;font-size:16px">🔍</span>
          <input id="storeSearch" type="text" placeholder="Search stores by name, location…" value="${searchQ}" style="border:none;outline:none;flex:1;font-size:13px;background:transparent">
        </div>

        <!-- District filter -->
        <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;margin-bottom:10px">
          <button data-dist="" style="flex-shrink:0;padding:5px 12px;border-radius:20px;border:none;font-size:12px;font-weight:600;cursor:pointer;background:${!districtFilter?'#6A1B9A':'#F5F5F5'};color:${!districtFilter?'white':'#616161'}">All Districts</button>
          ${districts.map(d => `<button data-dist="${d}" style="flex-shrink:0;padding:5px 10px;border-radius:20px;border:none;font-size:12px;cursor:pointer;background:${districtFilter===d?'#6A1B9A':'#F5F5F5'};color:${districtFilter===d?'white':'#616161'}">${d}</button>`).join('')}
        </div>

        <!-- Store Cards -->
        ${filtered.length === 0 ? `
          <div style="text-align:center;padding:40px 20px">
            <div style="font-size:48px;margin-bottom:8px">🏪</div>
            <div style="font-weight:700;margin-bottom:4px">No stores found</div>
            <div style="font-size:12px;color:#757575">Try adjusting your search or filters</div>
          </div>
        ` : filtered.map(s => `
          <div class="store-card" data-sid="${s.id}" style="background:white;border-radius:12px;margin-bottom:10px;box-shadow:0 2px 6px rgba(0,0,0,0.07);overflow:hidden">
            <div style="height:4px;background:linear-gradient(90deg,#6A1B9A,#AB47BC)"></div>
            <div style="padding:12px 14px">
              <div style="display:flex;align-items:flex-start;gap:10px">
                <div style="width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg,#F3E5F5,#E1BEE7);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">🏪</div>
                <div style="flex:1">
                  <div style="font-weight:700;font-size:14px">${s.name}</div>
                  <div style="font-size:11px;color:#757575;margin-top:1px">📍 ${s.district || 'Location N/A'} · ${s.phone ? '📞 ' + s.phone : ''}</div>
                  <div style="display:flex;gap:4px;margin-top:5px;flex-wrap:wrap">
                    ${(s.categories || []).map(c => {
                      const cat = CATEGORIES.find(x => x.id === c);
                      return cat ? `<span style="background:${cat.color}15;color:${cat.color};padding:2px 7px;border-radius:8px;font-size:10px;font-weight:600">${cat.icon} ${cat.label}</span>` : '';
                    }).join('')}
                    ${s.verified ? `<span style="background:#E8F5E9;color:#2E7D32;padding:2px 7px;border-radius:8px;font-size:10px;font-weight:600">✅ Verified</span>` : ''}
                    ${s.rating ? `<span style="background:#FFF8E1;color:#F9A825;padding:2px 7px;border-radius:8px;font-size:10px">⭐ ${Number(s.rating).toFixed(1)}</span>` : ''}
                  </div>
                </div>
              </div>
              ${s.description ? `<div style="font-size:11px;color:#757575;margin-top:8px;line-height:1.5">${s.description.slice(0,120)}${s.description.length>120?'…':''}</div>` : ''}
              <div style="display:flex;gap:6px;margin-top:10px">
                <button class="view-store-btn" data-sid="${s.id}" style="flex:1;padding:8px;background:#6A1B9A;color:white;border:none;border-radius:8px;font-weight:600;font-size:12px;cursor:pointer">🏪 View Products</button>
                <button class="review-store-btn" data-sid="${s.id}" data-sname="${s.name}" style="padding:8px 10px;background:#FFF8E1;color:#F9A825;border:none;border-radius:8px;font-size:12px;cursor:pointer">⭐</button>
                ${s.phone ? `<button class="call-store-btn" data-phone="${s.phone}" style="padding:8px 12px;background:#F3E5F5;color:#6A1B9A;border:none;border-radius:8px;font-size:12px;cursor:pointer">📞</button>` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ─── BUYER: BROWSE PRODUCTS ──────────────────────────────────────────────
  function renderBrowseProducts() {
    let filtered = products;
    if (searchQ) filtered = filtered.filter(p => `${p.name} ${p.brand} ${p.store_name}`.toLowerCase().includes(searchQ.toLowerCase()));
    if (categoryFilter) filtered = filtered.filter(p => p.category === categoryFilter);

    return `
      <div style="padding:10px 14px 0">
        <!-- Search -->
        <div style="display:flex;align-items:center;background:white;border:1px solid #E0E0E0;border-radius:10px;padding:8px 12px;margin-bottom:10px">
          <span style="margin-right:8px;font-size:16px">🔍</span>
          <input id="prodSearch" type="text" placeholder="Search seeds, fertilizers, pesticides…" value="${searchQ}" style="border:none;outline:none;flex:1;font-size:13px;background:transparent">
        </div>

        <!-- Category chips -->
        <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;margin-bottom:10px">
          <button data-cat="" style="flex-shrink:0;padding:5px 12px;border-radius:20px;border:none;font-size:12px;font-weight:600;cursor:pointer;background:${!categoryFilter?'#6A1B9A':'#F5F5F5'};color:${!categoryFilter?'white':'#616161'}">All</button>
          ${CATEGORIES.map(c => `<button data-cat="${c.id}" style="flex-shrink:0;padding:5px 10px;border-radius:20px;border:none;font-size:12px;cursor:pointer;background:${categoryFilter===c.id?c.color:'#F5F5F5'};color:${categoryFilter===c.id?'white':'#616161'}">${c.icon} ${c.label}</button>`).join('')}
        </div>

        <!-- Promo banner -->
        <div style="background:linear-gradient(135deg,#F3E5F5,#E1BEE7);border-radius:10px;padding:10px 12px;margin-bottom:12px">
          <div style="font-size:12px;color:#6A1B9A;font-weight:700">🌱 ${filtered.length} products available from ${stores.length} stores</div>
          <div style="font-size:10px;color:#7B1FA2;margin-top:2px">Compare prices across stores · Buy directly from farmers' preferred dealers</div>
        </div>

        <!-- Product Cards -->
        ${filtered.length === 0 ? `
          <div style="text-align:center;padding:40px 20px">
            <div style="font-size:48px;margin-bottom:8px">🌱</div>
            <div style="font-weight:700;margin-bottom:4px">No products found</div>
            <div style="font-size:12px;color:#757575">Try a different category or search term</div>
          </div>
        ` : filtered.map(p => {
          const cat = CATEGORIES.find(c => c.id === p.category);
          return `
          <div style="background:white;border-radius:12px;margin-bottom:10px;box-shadow:0 2px 6px rgba(0,0,0,0.07);overflow:hidden">
            <div style="height:3px;background:${cat?.color || '#6A1B9A'}"></div>
            <div style="padding:12px 14px">
              <div style="display:flex;gap:10px">
                <div style="width:44px;height:44px;border-radius:10px;background:${cat?.color || '#6A1B9A'}15;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">${cat?.icon || '📦'}</div>
                <div style="flex:1">
                  <div style="font-weight:700;font-size:14px">${p.name}</div>
                  <div style="font-size:11px;color:#757575">${p.brand || ''} · ${p.store_name || 'Store'}</div>
                  <div style="display:flex;gap:4px;margin-top:5px;flex-wrap:wrap">
                    <span style="background:${cat?.color || '#6A1B9A'}15;color:${cat?.color || '#6A1B9A'};padding:2px 7px;border-radius:8px;font-size:10px;font-weight:600">${cat?.label || p.category}</span>
                    ${p.unit ? `<span style="background:#F5F5F5;color:#616161;padding:2px 7px;border-radius:8px;font-size:10px">${p.unit}</span>` : ''}
                    ${p.in_stock ? `<span style="background:#E8F5E9;color:#2E7D32;padding:2px 7px;border-radius:8px;font-size:10px;font-weight:600">In Stock</span>` : `<span style="background:#FFEBEE;color:#C62828;padding:2px 7px;border-radius:8px;font-size:10px">Out of Stock</span>`}
                  </div>
                </div>
                <div style="text-align:right;flex-shrink:0">
                  <div style="font-weight:800;font-size:16px;color:#6A1B9A">₹${Number(p.price||0).toLocaleString()}</div>
                  <div style="font-size:10px;color:#757575">${p.unit || 'per unit'}</div>
                </div>
              </div>
              ${p.description ? `<div style="font-size:11px;color:#757575;margin-top:8px;line-height:1.5">${p.description.slice(0,100)}${p.description.length>100?'…':''}</div>` : ''}
              <div style="display:flex;gap:6px;margin-top:10px">
                <button class="order-btn" data-pid="${p.id}" style="flex:1;padding:8px;background:#6A1B9A;color:white;border:none;border-radius:8px;font-weight:600;font-size:12px;cursor:pointer">🛒 Order Now</button>
                <button class="review-prod-btn" data-pid="${p.id}" data-pname="${p.name}" style="padding:8px 10px;background:#FFF8E1;color:#F9A825;border:none;border-radius:8px;font-size:12px;cursor:pointer">⭐</button>
                <button class="enquire-btn" data-pid="${p.id}" style="padding:8px 12px;background:#F3E5F5;color:#6A1B9A;border:none;border-radius:8px;font-size:12px;cursor:pointer">💬</button>
              </div>
            </div>
          </div>
        `; }).join('')}
      </div>
    `;
  }

  // ─── SELLER: MY STORE ────────────────────────────────────────────────────
  function renderMyStore() {
    if (!myStore) {
      return `
        <div style="padding:20px 14px;text-align:center">
          <div style="font-size:56px;margin-bottom:12px">🏪</div>
          <div style="font-weight:800;font-size:16px;margin-bottom:6px">Create Your Store</div>
          <div style="font-size:12px;color:#757575;margin-bottom:16px;line-height:1.5">
            List your agricultural input business on AgriGalaxy.<br>
            Reach thousands of farmers looking for seeds, fertilizers & pesticides.
          </div>
          <button id="createStoreBtn" style="padding:12px 32px;background:#6A1B9A;color:white;border:none;border-radius:12px;font-weight:700;font-size:14px;cursor:pointer">+ Create Store</button>
        </div>
      `;
    }

    return `
      <div style="padding:10px 14px 0">
        <!-- Store header card -->
        <div style="background:linear-gradient(135deg,#6A1B9A,#4A148C);border-radius:14px;padding:16px;color:white;margin-bottom:12px">
          <div style="font-weight:800;font-size:18px">${myStore.name}</div>
          <div style="font-size:12px;opacity:0.85;margin-top:4px">📍 ${myStore.district || 'Location not set'} · ${myStore.phone || ''}</div>
          <div style="display:flex;gap:12px;margin-top:12px">
            <div style="text-align:center"><div style="font-weight:800;font-size:20px">${myProducts.length}</div><div style="font-size:10px;opacity:0.8">Products</div></div>
            <div style="text-align:center"><div style="font-weight:800;font-size:20px">${orders.length}</div><div style="font-size:10px;opacity:0.8">Orders</div></div>
            <div style="text-align:center"><div style="font-weight:800;font-size:20px">${myStore.rating ? Number(myStore.rating).toFixed(1) : '-'}</div><div style="font-size:10px;opacity:0.8">Rating</div></div>
            <div style="text-align:center"><div style="font-weight:800;font-size:20px">${myStore.verified ? '✅' : '⏳'}</div><div style="font-size:10px;opacity:0.8">${myStore.verified ? 'Verified' : 'Pending'}</div></div>
          </div>
        </div>

        <!-- Quick actions -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
          <button id="addProductBtn" style="padding:12px;background:#F3E5F5;border:1px solid #CE93D8;border-radius:10px;font-weight:700;font-size:12px;cursor:pointer;color:#6A1B9A">+ Add Product</button>
          <button id="editStoreBtn" style="padding:12px;background:#F3E5F5;border:1px solid #CE93D8;border-radius:10px;font-weight:700;font-size:12px;cursor:pointer;color:#6A1B9A">✏️ Edit Store</button>
        </div>

        <!-- Store categories -->
        <div style="background:white;border-radius:10px;padding:12px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
          <div style="font-weight:700;font-size:13px;margin-bottom:8px">📦 Product Categories</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${(myStore.categories || []).map(c => {
              const cat = CATEGORIES.find(x => x.id === c);
              return cat ? `<span style="background:${cat.color}15;color:${cat.color};padding:4px 10px;border-radius:8px;font-size:11px;font-weight:600">${cat.icon} ${cat.label}</span>` : '';
            }).join('') || '<span style="font-size:11px;color:#757575">No categories set</span>'}
          </div>
        </div>

        ${myStore.description ? `
          <div style="background:white;border-radius:10px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
            <div style="font-weight:700;font-size:13px;margin-bottom:4px">About</div>
            <div style="font-size:12px;color:#757575;line-height:1.5">${myStore.description}</div>
          </div>
        ` : ''}
      </div>
    `;
  }

  // ─── SELLER: MY PRODUCTS ─────────────────────────────────────────────────
  function renderMyProducts() {
    return `
      <div style="padding:10px 14px 0">
        <button id="addProductBtn2" style="width:100%;padding:12px;background:#6A1B9A;color:white;border:none;border-radius:12px;font-weight:700;font-size:14px;cursor:pointer;margin-bottom:12px">+ Add New Product</button>

        ${myProducts.length === 0 ? `
          <div style="text-align:center;padding:30px 20px">
            <div style="font-size:48px;margin-bottom:8px">📦</div>
            <div style="font-weight:700;margin-bottom:4px">No products listed</div>
            <div style="font-size:12px;color:#757575">Add seeds, fertilizers, pesticides to your catalog</div>
          </div>
        ` : myProducts.map(p => {
          const cat = CATEGORIES.find(c => c.id === p.category);
          return `
          <div style="background:white;border-radius:12px;margin-bottom:10px;box-shadow:0 2px 6px rgba(0,0,0,0.07);overflow:hidden">
            <div style="height:3px;background:${cat?.color || '#6A1B9A'}"></div>
            <div style="padding:12px 14px">
              <div style="display:flex;gap:10px;align-items:flex-start">
                <div style="width:40px;height:40px;border-radius:8px;background:${cat?.color || '#6A1B9A'}15;display:flex;align-items:center;justify-content:center;font-size:20px">${cat?.icon || '📦'}</div>
                <div style="flex:1">
                  <div style="font-weight:700;font-size:14px">${p.name}</div>
                  <div style="font-size:11px;color:#757575">${p.brand || ''} · ${cat?.label || p.category} · ₹${Number(p.price||0).toLocaleString()}/${p.unit||'unit'}</div>
                  <div style="display:flex;gap:4px;margin-top:4px">
                    ${p.in_stock ? `<span style="background:#E8F5E9;color:#2E7D32;padding:2px 7px;border-radius:8px;font-size:10px;font-weight:600">In Stock</span>` : `<span style="background:#FFEBEE;color:#C62828;padding:2px 7px;border-radius:8px;font-size:10px">Out of Stock</span>`}
                    ${p.quantity ? `<span style="background:#F5F5F5;padding:2px 7px;border-radius:8px;font-size:10px">Qty: ${p.quantity}</span>` : ''}
                  </div>
                </div>
              </div>
              <div style="display:flex;gap:6px;margin-top:10px">
                <button class="prod-edit-btn" data-pid="${p.id}" style="flex:1;padding:7px;background:#F5F5F5;border:none;border-radius:8px;font-size:12px;cursor:pointer">✏️ Edit</button>
                <button class="toggle-stock-btn" data-pid="${p.id}" data-stock="${p.in_stock?1:0}" style="flex:1;padding:7px;background:${p.in_stock?'#FFEBEE':'#E8F5E9'};border:none;border-radius:8px;font-size:12px;cursor:pointer">${p.in_stock ? '❌ Mark Out of Stock' : '✅ Mark In Stock'}</button>
                <button class="prod-del-btn" data-pid="${p.id}" style="padding:7px 12px;background:#FFEBEE;color:#C62828;border:none;border-radius:8px;font-size:12px;cursor:pointer">🗑️</button>
              </div>
            </div>
          </div>
        `; }).join('')}
      </div>
    `;
  }

  // ─── ORDERS ──────────────────────────────────────────────────────────────
  function renderOrders() {
    const isSeller = mode === 'seller';
    return `
      <div style="padding:10px 14px 0">
        ${orders.length === 0 ? `
          <div style="text-align:center;padding:40px 20px">
            <div style="font-size:48px;margin-bottom:8px">📋</div>
            <div style="font-weight:700;margin-bottom:4px">${isSeller ? 'No orders received yet' : 'No orders placed yet'}</div>
            <div style="font-size:12px;color:#757575">${isSeller ? 'Orders from farmers will appear here' : 'Browse products and place your first order'}</div>
          </div>
        ` : orders.map(o => `
          <div style="background:white;border-radius:12px;margin-bottom:10px;padding:14px;box-shadow:0 2px 6px rgba(0,0,0,0.07)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <div style="font-weight:700;font-size:13px">Order #${String(o.id).slice(-6)}</div>
              <span style="background:${o.status==='completed'?'#E8F5E9':o.status==='pending'?'#FFF8E1':'#E3F2FD'};color:${o.status==='completed'?'#2E7D32':o.status==='pending'?'#F9A825':'#1565C0'};padding:3px 8px;border-radius:8px;font-size:10px;font-weight:700">${o.status?.toUpperCase() || 'PENDING'}</span>
            </div>
            <div style="font-size:12px;color:#757575">${o.product_name || 'Product'} · Qty: ${o.quantity || 1}</div>
            <div style="font-size:12px;color:#6A1B9A;font-weight:700;margin-top:4px">₹${Number(o.total||0).toLocaleString()}</div>
            ${isSeller && o.status === 'pending' ? `
              <div style="display:flex;gap:6px;margin-top:8px">
                <button class="order-accept" data-oid="${o.id}" style="flex:1;padding:7px;background:#2E7D32;color:white;border:none;border-radius:8px;font-size:12px;cursor:pointer">✅ Accept</button>
                <button class="order-reject" data-oid="${o.id}" style="padding:7px 12px;background:#FFEBEE;color:#C62828;border:none;border-radius:8px;font-size:12px;cursor:pointer">❌</button>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // ─── SELLER ANALYTICS ────────────────────────────────────────────────────
  function renderAnalytics() {
    const totalRevenue = orders.filter(o => o.status === 'completed').reduce((s, o) => s + Number(o.total || 0), 0);
    const pendingCount = orders.filter(o => o.status === 'pending').length;

    return `
      <div style="padding:10px 14px 0">
        <!-- Revenue card -->
        <div style="background:linear-gradient(135deg,#6A1B9A,#4A148C);border-radius:14px;padding:16px;color:white;margin-bottom:12px">
          <div style="font-size:12px;opacity:0.8">Total Revenue</div>
          <div style="font-weight:800;font-size:28px;margin-top:4px">₹${totalRevenue.toLocaleString()}</div>
          <div style="display:flex;gap:16px;margin-top:12px">
            <div><div style="font-weight:700;font-size:16px">${orders.length}</div><div style="font-size:10px;opacity:0.8">Total Orders</div></div>
            <div><div style="font-weight:700;font-size:16px">${pendingCount}</div><div style="font-size:10px;opacity:0.8">Pending</div></div>
            <div><div style="font-weight:700;font-size:16px">${myProducts.length}</div><div style="font-size:10px;opacity:0.8">Products</div></div>
          </div>
        </div>

        <!-- Category breakdown -->
        <div style="background:white;border-radius:12px;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
          <div style="font-weight:700;font-size:13px;margin-bottom:10px">📊 Products by Category</div>
          ${CATEGORIES.map(c => {
            const count = myProducts.filter(p => p.category === c.id).length;
            if (!count) return '';
            return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #F5F5F5">
              <span style="font-size:16px">${c.icon}</span>
              <span style="flex:1;font-size:12px;font-weight:600">${c.label}</span>
              <span style="background:${c.color}15;color:${c.color};padding:2px 8px;border-radius:8px;font-size:11px;font-weight:700">${count}</span>
            </div>`;
          }).join('')}
          ${myProducts.length === 0 ? '<div style="font-size:12px;color:#757575;text-align:center;padding:10px">No products listed yet</div>' : ''}
        </div>
      </div>
    `;
  }

  // ─── MODALS ──────────────────────────────────────────────────────────────
  function showCreateStore() {
    showModal(`
      <div class="modal-handle"></div>
      <h3 style="margin:0 0 14px">🏪 Create Your Store</h3>
      <div class="form-group"><label>Store Name *</label><input class="form-input" id="storeName" placeholder="e.g. Sri Lakshmi Agri Inputs"></div>
      <div class="form-group"><label>District *</label><input class="form-input" id="storeDistrict" placeholder="e.g. Krishna, West Godavari"></div>
      <div class="form-group"><label>Phone *</label><input class="form-input" id="storePhone" type="tel" placeholder="e.g. 9876543210"></div>
      <div class="form-group"><label>Address</label><input class="form-input" id="storeAddr" placeholder="Full address"></div>
      <div class="form-group"><label>Description</label><textarea class="form-input" id="storeDesc" rows="2" placeholder="Tell farmers about your store…"></textarea></div>
      <div class="form-group">
        <label>Categories (select all that apply)</label>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
          ${CATEGORIES.map(c => `<label style="display:flex;align-items:center;gap:4px;background:${c.color}10;padding:5px 10px;border-radius:8px;cursor:pointer;font-size:12px"><input type="checkbox" class="store-cat" value="${c.id}"> ${c.icon} ${c.label}</label>`).join('')}
        </div>
      </div>
      <button id="submitStore" style="width:100%;padding:12px;background:#6A1B9A;color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer;margin-top:8px">Create Store</button>
    `);
    document.querySelector('#submitStore')?.addEventListener('click', async () => {
      const name = document.querySelector('#storeName')?.value?.trim();
      const district = document.querySelector('#storeDistrict')?.value?.trim();
      const phone = document.querySelector('#storePhone')?.value?.trim();
      if (!name || !district || !phone) return showToast('Name, District & Phone required', 'error');
      const cats = [...document.querySelectorAll('.store-cat:checked')].map(c => c.value);
      try {
        await api.post('/agrigalaxy/stores', {
          name, district, phone,
          address: document.querySelector('#storeAddr')?.value || '',
          description: document.querySelector('#storeDesc')?.value || '',
          categories: cats,
        });
        showToast('Store created!', 'success');
        closeModal();
        loadData();
      } catch (e) { showToast(e.message, 'error'); }
    });
  }

  function showAddProduct() {
    showModal(`
      <div class="modal-handle"></div>
      <h3 style="margin:0 0 14px">📦 Add Product</h3>
      <div class="form-group"><label>Product Name *</label><input class="form-input" id="prodName" placeholder="e.g. BT Cotton Seeds (Bollgard II)"></div>
      <div class="form-group"><label>Brand</label><input class="form-input" id="prodBrand" placeholder="e.g. Mahyco, UPL, Bayer"></div>
      <div class="form-group"><label>Category *</label>
        <select class="form-input" id="prodCat">
          <option value="">Select category</option>
          ${CATEGORIES.map(c => `<option value="${c.id}">${c.icon} ${c.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Price (₹) *</label><input class="form-input" id="prodPrice" type="number" placeholder="e.g. 1500"></div>
      <div class="form-group"><label>Unit</label><input class="form-input" id="prodUnit" placeholder="e.g. per kg, per packet, per ltr"></div>
      <div class="form-group"><label>Quantity Available</label><input class="form-input" id="prodQty" type="number" placeholder="e.g. 100"></div>
      <div class="form-group"><label>Description</label><textarea class="form-input" id="prodDesc" rows="2" placeholder="Details about the product…"></textarea></div>
      <button id="submitProduct" style="width:100%;padding:12px;background:#6A1B9A;color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer;margin-top:8px">Add Product</button>
    `);
    document.querySelector('#submitProduct')?.addEventListener('click', async () => {
      const name = document.querySelector('#prodName')?.value?.trim();
      const category = document.querySelector('#prodCat')?.value;
      const price = Number(document.querySelector('#prodPrice')?.value);
      if (!name || !category || !price) return showToast('Name, Category & Price required', 'error');
      try {
        await api.post('/agrigalaxy/products', {
          name,
          brand: document.querySelector('#prodBrand')?.value || '',
          category,
          price,
          unit: document.querySelector('#prodUnit')?.value || 'per unit',
          quantity: Number(document.querySelector('#prodQty')?.value) || 0,
          description: document.querySelector('#prodDesc')?.value || '',
          in_stock: true,
        });
        showToast('Product added!', 'success');
        closeModal();
        loadData();
      } catch (e) { showToast(e.message, 'error'); }
    });
  }

  function showOrderModal(productId) {
    const product = products.find(p => p.id == productId);
    if (!product) return;
    showModal(`
      <div class="modal-handle"></div>
      <h3 style="margin:0 0 14px">🛒 Order — ${product.name}</h3>
      <div style="background:#F3E5F5;border-radius:10px;padding:10px;margin-bottom:12px">
        <div style="font-size:12px;color:#757575">Price: <strong style="color:#6A1B9A">₹${Number(product.price).toLocaleString()}</strong> ${product.unit || 'per unit'}</div>
        <div style="font-size:12px;color:#757575">Store: ${product.store_name || 'Store'}</div>
      </div>
      <div class="form-group"><label>Quantity *</label><input class="form-input" id="orderQty" type="number" value="1" min="1"></div>
      <div class="form-group"><label>Delivery Address</label><input class="form-input" id="orderAddr" placeholder="Your farm / village address"></div>
      <div class="form-group"><label>Notes</label><textarea class="form-input" id="orderNotes" rows="2" placeholder="Any special instructions…"></textarea></div>
      <div style="background:#E8F5E9;border-radius:10px;padding:10px;margin-bottom:10px">
        <div style="font-weight:700;color:#2E7D32;font-size:14px">Total: ₹<span id="orderTotal">${Number(product.price).toLocaleString()}</span></div>
      </div>
      <button id="submitOrder" style="width:100%;padding:12px;background:#6A1B9A;color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer">Place Order</button>
    `);
    const qtyInput = document.querySelector('#orderQty');
    qtyInput?.addEventListener('input', () => {
      const total = (Number(qtyInput.value) || 1) * Number(product.price);
      const totalEl = document.querySelector('#orderTotal');
      if (totalEl) totalEl.textContent = total.toLocaleString();
    });
    document.querySelector('#submitOrder')?.addEventListener('click', async () => {
      const qty = Number(document.querySelector('#orderQty')?.value) || 1;
      const total = qty * Number(product.price);
      closeModal();
      showCheckout({
        amount: total,
        description: `${product.name} x ${qty}`,
        order_type: 'agrigalaxy',
        reference_id: product.id,
        onSuccess: async () => {
          try {
            await api.post('/agrigalaxy/orders', {
              product_id: product.id,
              store_id: product.store_id,
              quantity: qty,
              total,
              delivery_address: document.querySelector('#orderAddr')?.value || '',
              notes: document.querySelector('#orderNotes')?.value || '',
            });
            showToast(t('order_placed') || 'Order placed! Seller will be notified.', 'success');
            loadData();
          } catch (e) { showToast(e.message, 'error'); }
        },
        onFailure: () => showToast(t('payment_failed') || 'Payment failed', 'error')
      });
    });
  }

  // ─── EVENTS ──────────────────────────────────────────────────────────────
  function attachEvents() {
    // Mode toggle
    container.querySelectorAll('[data-gmode]').forEach(b => {
      b.addEventListener('click', () => { mode = b.dataset.gmode; tab = 'stores'; render(); });
    });
    // Tabs
    container.querySelectorAll('.tab-btn').forEach(b => {
      b.addEventListener('click', () => { tab = b.dataset.tab; render(); });
    });
    // Buyer: search, filters
    container.querySelector('#storeSearch')?.addEventListener('input', e => { searchQ = e.target.value; render(); });
    container.querySelector('#prodSearch')?.addEventListener('input', e => { searchQ = e.target.value; render(); });
    container.querySelectorAll('[data-dist]').forEach(b => { b.addEventListener('click', () => { districtFilter = b.dataset.dist; render(); }); });
    container.querySelectorAll('[data-cat]').forEach(b => { b.addEventListener('click', () => { categoryFilter = b.dataset.cat; render(); }); });
    // Buyer: store actions
    container.querySelectorAll('.view-store-btn').forEach(b => { b.addEventListener('click', () => { tab = 'products'; searchQ = ''; categoryFilter=''; render(); }); });
    container.querySelectorAll('.call-store-btn').forEach(b => { b.addEventListener('click', () => showToast(`📞 Call: ${b.dataset.phone}`, 'info')); });
    // Buyer: product actions
    container.querySelectorAll('.order-btn').forEach(b => { b.addEventListener('click', () => showOrderModal(b.dataset.pid)); });
    container.querySelectorAll('.enquire-btn').forEach(b => { b.addEventListener('click', () => { navigate('chat'); }); });
    container.querySelectorAll('.review-prod-btn').forEach(b => { b.addEventListener('click', () => showReviewsModal({ target_type:'product', target_id:b.dataset.pid, target_name:b.dataset.pname })); });
    container.querySelectorAll('.review-store-btn').forEach(b => { b.addEventListener('click', () => showReviewsModal({ target_type:'store', target_id:b.dataset.sid, target_name:b.dataset.sname })); });
    // Seller: store actions
    container.querySelector('#createStoreBtn')?.addEventListener('click', showCreateStore);
    container.querySelector('#editStoreBtn')?.addEventListener('click', showCreateStore);
    container.querySelector('#addProductBtn')?.addEventListener('click', showAddProduct);
    container.querySelector('#addProductBtn2')?.addEventListener('click', showAddProduct);
    // Seller: product actions
    container.querySelectorAll('.prod-edit-btn').forEach(b => { b.addEventListener('click', () => showToast('Edit product — coming soon', 'info')); });
    container.querySelectorAll('.toggle-stock-btn').forEach(b => {
      b.addEventListener('click', async () => {
        const inStock = b.dataset.stock === '1';
        try {
          await api.patch(`/agrigalaxy/products/${b.dataset.pid}`, { in_stock: !inStock });
          showToast(inStock ? 'Marked out of stock' : 'Marked in stock', 'success');
          loadData();
        } catch (e) { showToast(e.message, 'error'); }
      });
    });
    container.querySelectorAll('.prod-del-btn').forEach(b => {
      b.addEventListener('click', async () => {
        if (!confirm('Delete this product?')) return;
        try { await api.del(`/agrigalaxy/products/${b.dataset.pid}`); showToast('Deleted', 'success'); loadData(); } catch(e) { showToast(e.message, 'error'); }
      });
    });
    // Orders
    container.querySelectorAll('.order-accept').forEach(b => {
      b.addEventListener('click', async () => {
        try { await api.patch(`/agrigalaxy/orders/${b.dataset.oid}`, { status: 'confirmed' }); showToast('Order accepted!', 'success'); loadData(); } catch(e) { showToast(e.message, 'error'); }
      });
    });
    container.querySelectorAll('.order-reject').forEach(b => {
      b.addEventListener('click', async () => {
        try { await api.patch(`/agrigalaxy/orders/${b.dataset.oid}`, { status: 'rejected' }); showToast('Order rejected', 'info'); loadData(); } catch(e) { showToast(e.message, 'error'); }
      });
    });
  }

  // ─── DATA ────────────────────────────────────────────────────────────────
  async function loadData() {
    loading = true; render();
    try {
      const [st, pr, ord, ms, mp] = await Promise.all([
        api.get('/agrigalaxy/stores?limit=50').catch(() => []),
        api.get('/agrigalaxy/products?limit=100').catch(() => []),
        api.get('/agrigalaxy/orders').catch(() => []),
        api.get('/agrigalaxy/my-store').catch(() => null),
        api.get('/agrigalaxy/my-products').catch(() => []),
      ]);
      stores     = Array.isArray(st) ? st : (st.stores || []);
      products   = Array.isArray(pr) ? pr : (pr.products || []);
      orders     = Array.isArray(ord) ? ord : (ord.orders || []);
      myStore    = ms?.store || ms || null;
      myProducts = Array.isArray(mp) ? mp : (mp.products || []);
      // Fallback to sample data if API returns empty
      if (stores.length === 0) stores = SAMPLE_STORES;
      if (products.length === 0) products = SAMPLE_PRODUCTS;
    } catch (e) {
      stores = SAMPLE_STORES;
      products = SAMPLE_PRODUCTS;
    }
    loading = false; render();
  }

  loadData();
}
