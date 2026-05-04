import { api } from '../api.js';
import { navigate, showToast, showModal, closeModal } from '../app-shell.js';
import { getRole } from '../store.js';
import { t } from '../i18n.js';

/**
 * AgriFlow — Crop Supply Chain (inside the Agri platform)
 *
 * DATA VISIBILITY RULES (strictly enforced):
 *   Farmer → Sees ONLY their own crops, declarations, listings, inquiries
 *             Cannot see other farmers' data
 *   FPO    → Sees ONLY their member farmers + their FPO's procurement/supply
 *             Cannot see other FPOs' data
 *   Buyer  → Sees ALL listings (paid access) — aggregated, farmer identity hidden
 *
 * TAB STRUCTURE:
 *   Farmer → My Crops (declarations + listings unified) | Inquiries | Prices
 *   FPO    → Members | Procurement | My Supply | Inquiries
 *   Buyer  → Search Supply | Watchlist | My Inquiries | Intelligence
 *
 * WHY "Marketplace" is removed from farmer view:
 *   Farmer's crops are INPUTS to the marketplace — they create data.
 *   The marketplace is the BUYER's view of that data.
 *   Mixing them creates confusion ("why can I see my neighbour's prices?")
 */

export function renderAgriFlow(container) {
  const role = getRole();
  const isBuyer  = role === 'buyer';
  const isFPO    = role === 'fpo';
  const isFarmer = !isBuyer && !isFPO;

  // Default tabs
  let tab = isBuyer ? 'search' : isFPO ? 'members' : 'mycrops';

  // Data
  let listings = [], crops = [], districts = [];
  let myListings = [], declarations = [], inquiries = [];
  let fpoMembers = [], fpoInventory = [], fpoStats = {}, fpoRecords = [], fpoProcSummary = [];
  let watchlist = [];
  let loading = true;
  let search = '', filterCrop = '';

  // SAMPLE DATA for new users
  const SAMPLE_CROPS = [
    { id:'sc1', name:'Paddy (BPT 5204)', category:'cereals' },
    { id:'sc2', name:'Cotton (BT Hybrid)', category:'cash_crops' },
    { id:'sc3', name:'Groundnut', category:'oilseeds' },
    { id:'sc4', name:'Red Chilli', category:'spices' },
    { id:'sc5', name:'Tomato', category:'vegetables' },
    { id:'sc6', name:'Maize', category:'cereals' },
    { id:'sc7', name:'Sugarcane', category:'cash_crops' },
    { id:'sc8', name:'Turmeric', category:'spices' },
  ];
  const SAMPLE_LISTINGS = [
    { id:'sl1', crop:'Paddy (BPT 5204)', quantity_tons:25, price_per_quintal:2180, location:'Guntur, AP', harvest_date:'2026-04-20', status:'available', farmer:'Raju Farms', quality:'Grade A', moisture:'12%' },
    { id:'sl2', crop:'Cotton (BT Hybrid)', quantity_tons:8, price_per_quintal:6850, location:'Adilabad, TS', harvest_date:'2026-04-15', status:'available', farmer:'Srinivas Cotton Farm', quality:'Long Staple', moisture:'8%' },
    { id:'sl3', crop:'Groundnut', quantity_tons:12, price_per_quintal:5650, location:'Kurnool, AP', harvest_date:'2026-04-18', status:'available', farmer:'Anantapur Agri Co-op', quality:'Bold', moisture:'6%' },
    { id:'sl4', crop:'Red Chilli', quantity_tons:5, price_per_quintal:14500, location:'Khammam, TS', harvest_date:'2026-04-10', status:'available', farmer:'Mirchi Growers FPO', quality:'Teja S17', moisture:'10%' },
    { id:'sl5', crop:'Tomato', quantity_tons:15, price_per_quintal:1420, location:'Madanapalle, AP', harvest_date:'2026-04-25', status:'available', farmer:'Rayalaseema Fresh', quality:'Export Grade', moisture:'—' },
    { id:'sl6', crop:'Maize', quantity_tons:30, price_per_quintal:2080, location:'Nizamabad, TS', harvest_date:'2026-04-22', status:'available', farmer:'Telangana Grains FPO', quality:'Yellow Dent', moisture:'14%' },
  ];
  const SAMPLE_MY_LISTINGS = [
    { id:'sml1', crop:'Paddy (BPT 5204)', quantity_tons:10, price_per_quintal:2200, status:'active', inquiries_count:3, created_at:'2026-04-15' },
    { id:'sml2', crop:'Groundnut', quantity_tons:5, price_per_quintal:5700, status:'active', inquiries_count:1, created_at:'2026-04-18' },
  ];
  const SAMPLE_DECLARATIONS = [
    { id:'sd1', crop:'Paddy (BPT 5204)', area_acres:5, expected_yield_tons:12, sowing_date:'2026-01-10', expected_harvest:'2026-04-20', status:'harvested' },
    { id:'sd2', crop:'Groundnut', area_acres:3, expected_yield_tons:4.5, sowing_date:'2026-01-15', expected_harvest:'2026-05-01', status:'growing' },
  ];
  const SAMPLE_INQUIRIES = [
    { id:'si1', crop:'Paddy (BPT 5204)', buyer_name:'Sri Lakshmi Rice Mill', quantity_needed:15, offered_price:2250, status:'pending', created_at:'2026-04-24' },
    { id:'si2', crop:'Groundnut', buyer_name:'Kurnool Oil Exports', quantity_needed:8, offered_price:5800, status:'pending', created_at:'2026-04-25' },
  ];

  function render() {
    const HEADER = {
      farmer: { bg:'linear-gradient(135deg,#2E7D32,#00796B)', title:'🌾 AgriFlow · My Crops', sub:'Your crops · Harvest listings · Buyer inquiries' },
      fpo:    { bg:'linear-gradient(135deg,#1565C0,#6A1B9A)', title:'🏢 AgriFlow · FPO Hub',  sub:'Member farmers · Procurement · Supply listings' },
      buyer:  { bg:'linear-gradient(135deg,#E65100,#BF360C)', title:'🔍 AgriFlow · Supply Search', sub:'Nationwide crop supply · Powered by Agri Intelligence' },
    };
    const h = HEADER[isBuyer?'buyer':isFPO?'fpo':'farmer'];

    container.innerHTML = `
      <!-- HEADER -->
      <div class="hero-v2" role="banner" style="background:${h.bg};color:white">
        <div style="font-weight:800;font-size:18px">${h.title}</div>
        <div style="font-size:11px;opacity:0.85;margin-top:2px">${h.sub}</div>
      </div>

      ${isBuyer ? `
        <!-- BUYER PRIVACY NOTE -->
        <div style="background:#FFF3E0;border-bottom:1px solid #FFE0B2;padding:8px 14px;font-size:11px;color:#E65100;display:flex;align-items:center;gap:6px">
          🔒 <strong>Paid Access</strong> — You see aggregated listings. Individual farmer identity hidden until deal is finalised.
        </div>
      ` : `
        <!-- FARMER / FPO PRIVACY NOTE -->
        <div style="background:#E8F5E9;border-bottom:1px solid #C8E6C9;padding:8px 14px;font-size:11px;color:#2E7D32;display:flex;align-items:center;gap:6px">
          🔒 <strong>Your data is private</strong> — Only you can see your ${isFPO ? 'FPO data' : 'crops and listings'}. Buyers see aggregated data only.
        </div>
      `}

      <!-- TABS -->
      <div class="tab-bar" role="tablist" style="overflow-x:auto;white-space:nowrap">
        ${isBuyer ? `
          <button role="tab" aria-selected="${tab==='search'}" class="tab-btn ${tab==='search'?'active':''}"      data-tab="search">🔍 Search Supply</button>
          <button role="tab" aria-selected="${tab==='watchlist'}" class="tab-btn ${tab==='watchlist'?'active':''}"   data-tab="watchlist">⭐ Watchlist</button>
          <button role="tab" aria-selected="${tab==='inquiries'}" class="tab-btn ${tab==='inquiries'?'active':''}"   data-tab="inquiries">💬 My Inquiries</button>
          <button role="tab" aria-selected="${tab==='intelligence'}" class="tab-btn ${tab==='intelligence'?'active':''}" data-tab="intelligence">📊 Intelligence</button>
        ` : isFPO ? `
          <button role="tab" aria-selected="${tab==='members'}" class="tab-btn ${tab==='members'?'active':''}"     data-tab="members">👥 Members</button>
          <button role="tab" aria-selected="${tab==='procurement'}" class="tab-btn ${tab==='procurement'?'active':''}" data-tab="procurement">📦 Procurement</button>
          <button role="tab" aria-selected="${tab==='mysupply'}" class="tab-btn ${tab==='mysupply'?'active':''}"    data-tab="mysupply">📋 My Supply</button>
          <button role="tab" aria-selected="${tab==='inquiries'}" class="tab-btn ${tab==='inquiries'?'active':''}"   data-tab="inquiries">💬 Inquiries</button>
        ` : `
          <button role="tab" aria-selected="${tab==='mycrops'}" class="tab-btn ${tab==='mycrops'?'active':''}"    data-tab="mycrops">🌾 My Crops</button>
          <button role="tab" aria-selected="${tab==='inquiries'}" class="tab-btn ${tab==='inquiries'?'active':''}"  data-tab="inquiries">💬 Inquiries</button>
          <button role="tab" aria-selected="${tab==='prices'}" class="tab-btn ${tab==='prices'?'active':''}"     data-tab="prices">💰 Mandi Prices</button>
        `}
      </div>

      <!-- CONTENT -->
      <div style="padding-bottom:80px">
        ${loading ? '<div class="loading"><div class="spinner"></div></div>'
          : tab === 'mycrops'      ? renderMyCrops()
          : tab === 'inquiries'    ? renderInquiries()
          : tab === 'prices'       ? renderPrices()
          : tab === 'search'       ? renderBuyerSearch()
          : tab === 'watchlist'    ? renderWatchlist()
          : tab === 'intelligence' ? renderIntelligenceReports()
          : tab === 'members'      ? renderFPOMembers()
          : tab === 'procurement'  ? renderFPOProcurement()
          : tab === 'mysupply'     ? renderFPOMySupply()
          : ''}
      </div>
    `;
    attachEvents();
  }

  // ─── FARMER: MY CROPS (unified declarations + listings) ───────────────────
  //
  // This single tab replaces the old confusing trio:
  //   "Marketplace" (removed — that's buyer's view)
  //   "My Listings"   ┐
  //   "Declarations"  ┘  merged here
  //
  // Flow: Declare crop (growing stage) → Automatically available to list for sale
  //       When you publish a listing, buyers can discover it in Search Supply
  //
  function renderMyCrops() {
    const growing   = declarations.filter(d => d.status !== 'harvested');
    const available = myListings.filter(l => l.status === 'active');
    const sold      = myListings.filter(l => l.status === 'sold');

    return `
      <div style="padding:12px 14px 0">
        <!-- Quick actions -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
          <button id="createDeclBtn" style="padding:12px;background:#2E7D32;color:white;border:none;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer">🌱 Declare Crop</button>
          <button id="createListingBtn" style="padding:12px;background:#0277BD;color:white;border:none;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer">📋 List for Sale</button>
        </div>

        <div style="font-size:11px;background:#F1F8E9;border-radius:8px;padding:8px 10px;margin-bottom:14px;color:#33691E;line-height:1.5">
          <strong>How it works:</strong><br>
          1. <strong>Declare</strong> a crop you're growing → adds to supply forecasts (anonymous)<br>
          2. <strong>List for Sale</strong> → buyers searching AgriFlow can discover and send inquiries<br>
          3. <strong>Respond to inquiries</strong> → agree on price → fulfil order
        </div>

        <!-- GROWING: Declarations -->
        <div style="font-weight:700;color:#2E7D32;font-size:13px;margin-bottom:8px">🌱 Currently Growing (${growing.length})</div>
        ${growing.length === 0 ? `
          <div style="background:#F1F8E9;border-radius:10px;padding:14px;text-align:center;margin-bottom:14px">
            <div style="font-size:28px;margin-bottom:6px">🌱</div>
            <div style="font-size:12px;color:#2E7D32;font-weight:600">No active crop declarations</div>
            <div style="font-size:11px;color:#558B2F;margin-top:3px">Declare what you're growing to appear in supply forecasts</div>
          </div>
        ` : `
          <div style="margin-bottom:14px">${growing.map(d => `
            <div style="background:white;border-radius:10px;margin-bottom:7px;box-shadow:0 1px 4px rgba(0,0,0,0.07);padding:12px 14px;border-left:4px solid #2E7D32">
              <div style="display:flex;justify-content:space-between;align-items:flex-start">
                <div>
                  <div style="font-weight:700;font-size:13px">${d.crop_name||'Crop'} ${d.icon_emoji||''}</div>
                  <div style="font-size:11px;color:#757575;margin-top:2px">${d.area_acres||0} acres · Expected: ${Number(d.expected_yield||0).toLocaleString()} kg · Grade ${d.quality_grade||'A'}</div>
                  <div style="font-size:11px;color:#757575">Sow: ${fmtDate(d.sow_date)} → Harvest: ${fmtDate(d.expected_harvest_date)}</div>
                </div>
                <div style="display:flex;gap:4px;margin-left:8px">
                  <button class="edit-decl-btn" data-id="${d.id}" style="padding:5px 8px;background:#F5F5F5;border:none;border-radius:6px;font-size:11px;cursor:pointer">✏️</button>
                  <button class="del-decl-btn" data-id="${d.id}" style="padding:5px 8px;background:#FFEBEE;color:#C62828;border:none;border-radius:6px;font-size:11px;cursor:pointer">🗑️</button>
                </div>
              </div>
              ${d.is_organic ? '<span style="font-size:10px;background:#E8F5E9;color:#2E7D32;padding:2px 7px;border-radius:8px;display:inline-block;margin-top:5px">🌿 Organic</span>' : ''}
            </div>`).join('')}
          </div>`}

        <!-- FOR SALE: Active listings -->
        <div style="font-weight:700;color:#0277BD;font-size:13px;margin-bottom:8px">📋 Listed for Sale (${available.length})</div>
        ${available.length === 0 ? `
          <div style="background:#E3F2FD;border-radius:10px;padding:14px;text-align:center;margin-bottom:14px">
            <div style="font-size:28px;margin-bottom:6px">📋</div>
            <div style="font-size:12px;color:#0277BD;font-weight:600">No active listings</div>
            <div style="font-size:11px;color:#1565C0;margin-top:3px">List your harvest — buyers across India can discover and inquire</div>
          </div>
        ` : `
          <div style="margin-bottom:14px">${available.map(l => `
            <div style="background:white;border-radius:10px;margin-bottom:7px;box-shadow:0 1px 4px rgba(0,0,0,0.07);padding:12px 14px;border-left:4px solid #0277BD">
              <div style="display:flex;justify-content:space-between;align-items:flex-start">
                <div>
                  <div style="font-weight:700;font-size:13px">${l.crop_name||'Crop'} ${l.icon_emoji||''}</div>
                  <div style="font-size:11px;color:#757575;margin-top:2px">${Number(l.quantity_kg||0).toLocaleString()} kg · ₹${Number(l.price_per_kg||0).toFixed(0)}/kg · Grade ${l.grade||'A'}</div>
                </div>
                <div style="display:flex;gap:4px;align-items:center;margin-left:8px">
                  <span style="font-size:10px;background:#E8F5E9;color:#2E7D32;padding:2px 7px;border-radius:8px;font-weight:700">Live</span>
                  <button class="edit-listing-btn" data-id="${l.id}" style="padding:5px 8px;background:#F5F5F5;border:none;border-radius:6px;font-size:11px;cursor:pointer">✏️</button>
                  <button class="del-listing-btn" data-id="${l.id}" style="padding:5px 8px;background:#FFEBEE;color:#C62828;border:none;border-radius:6px;font-size:11px;cursor:pointer">🗑️</button>
                </div>
              </div>
              <div style="font-size:10px;color:#0277BD;margin-top:4px">👀 Visible to buyers nationwide</div>
            </div>`).join('')}
          </div>`}

        ${sold.length > 0 ? `
          <div style="font-weight:700;color:#757575;font-size:13px;margin-bottom:8px">✅ Sold (${sold.length})</div>
          <div style="margin-bottom:14px">${sold.map(l=>`
            <div style="background:#FAFAFA;border-radius:10px;margin-bottom:6px;padding:10px 14px;border-left:4px solid #BDBDBD;opacity:0.8">
              <div style="font-weight:600;font-size:12px">${l.crop_name||'Crop'} — ${Number(l.quantity_kg||0).toLocaleString()} kg · ₹${Number(l.price_per_kg||0).toFixed(0)}/kg</div>
            </div>`).join('')}
          </div>` : ''}
      </div>
    `;
  }

  // ─── FARMER: INQUIRIES ────────────────────────────────────────────────────
  function renderInquiries() {
    return `
      <div style="padding:12px 14px 0">
        <div style="font-size:11px;color:#757575;margin-bottom:10px">${isBuyer ? 'Inquiries you sent to farmers/FPOs' : 'Inquiries received from buyers for your listings'}</div>
        ${inquiries.length === 0 ? `
          <div style="text-align:center;padding:40px 20px">
            <div style="font-size:40px;margin-bottom:8px">💬</div>
            <div style="font-weight:700;margin-bottom:4px">No inquiries yet</div>
            <div style="font-size:12px;color:#757575">${isBuyer ? 'Search for supply and send inquiries to sellers' : 'Buyers will send inquiries for your listed crops'}</div>
          </div>
        ` : inquiries.map(q => {
          const sc = {pending:'#FF6F00',accepted:'#2E7D32',rejected:'#757575',negotiating:'#0277BD'};
          return `
            <div style="background:white;border-radius:12px;margin-bottom:8px;box-shadow:0 1px 4px rgba(0,0,0,0.07);padding:12px 14px">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
                <strong style="font-size:13px">${q.crop_name||'Crop'}</strong>
                <span style="background:${sc[q.status]||'#757575'}20;color:${sc[q.status]||'#757575'};padding:2px 8px;border-radius:8px;font-size:11px;font-weight:700">${q.status}</span>
              </div>
              <div style="font-size:11px;color:#757575">Qty: ${q.quantity_needed||'N/A'} kg${q.offered_price?' · Offered: ₹'+Number(q.offered_price).toFixed(0)+'/kg':''}</div>
              ${!isBuyer ? `<div style="font-size:11px;color:#757575">Buyer: ${q.buyer_name||'Buyer'}</div>` : `<div style="font-size:11px;color:#757575">To: ${q.district_name||q.location_label||'Seller'}</div>`}
              ${q.message ? `<div style="font-size:11px;font-style:italic;color:#424242;margin-top:4px">"${q.message}"</div>` : ''}
              ${q.response_message ? `<div style="font-size:11px;color:#0277BD;margin-top:4px">↪ "${q.response_message}"</div>` : ''}
              ${!isBuyer && q.status === 'pending' ? `
                <div style="display:flex;gap:6px;margin-top:10px">
                  <button class="accept-inq-btn" data-id="${q.id}" style="flex:1;padding:7px;background:#2E7D32;color:white;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer">✅ Accept</button>
                  <button class="neg-inq-btn" data-id="${q.id}" style="flex:1;padding:7px;background:#E3F2FD;color:#0277BD;border:none;border-radius:8px;font-size:12px;cursor:pointer">💬 Counter</button>
                  <button class="reject-inq-btn" data-id="${q.id}" style="flex:1;padding:7px;background:#FFEBEE;color:#C62828;border:none;border-radius:8px;font-size:12px;cursor:pointer">❌</button>
                </div>
              ` : ''}
              ${!isBuyer && q.status === 'accepted' ? `
                <button class="create-order-btn" data-iq="${q.id}" style="width:100%;margin-top:8px;padding:8px;background:#0277BD;color:white;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer">📦 Create Order</button>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // ─── FARMER: PRICES ───────────────────────────────────────────────────────
  function renderPrices() {
    return `
      <div style="padding:12px 14px 0">
        <div style="font-weight:700;margin-bottom:10px">💰 Mandi Prices — Your Crops</div>
        <div style="background:#E8F5E9;border-radius:10px;padding:12px;margin-bottom:12px;font-size:12px;color:#2E7D32">
          Prices sourced from AGMARKNET &amp; district mandis. Updated daily.
          Compare with what buyers offer to negotiate better.
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          ${crops.slice(0,15).map(c=>`
            <div style="background:white;border-radius:10px;padding:10px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.05);display:flex;justify-content:space-between;align-items:center">
              <div>
                <div style="font-weight:700;font-size:13px">${c.icon_emoji||'🌾'} ${c.name}</div>
                <div style="font-size:10px;color:#757575">₹${Number(c.min_price||0).toLocaleString()} – ₹${Number(c.max_price||0).toLocaleString()} range</div>
              </div>
              <div style="text-align:right">
                <div style="font-weight:800;font-size:15px;color:#2E7D32">₹${Number(c.modal_price||c.min_price||0).toLocaleString()}</div>
                <div style="font-size:10px;color:#757575">modal/kg</div>
              </div>
            </div>`).join('')}
          ${crops.length === 0 ? '<div style="text-align:center;padding:30px;color:#757575;font-size:12px">No price data available</div>' : ''}
        </div>
      </div>
    `;
  }

  // ─── BUYER: SEARCH SUPPLY ─────────────────────────────────────────────────
  function renderBuyerSearch() {
    const filtered = listings.filter(l => {
      if (search && !`${l.crop_name} ${l.district_name} ${l.location_label}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCrop && l.crop_id != filterCrop) return false;
      return true;
    });
    return `
      <div style="padding:12px 14px 0">
        <div style="display:flex;align-items:center;background:white;border:1px solid #E0E0E0;border-radius:10px;padding:8px 12px;margin-bottom:8px">
          <span style="margin-right:8px">🔍</span>
          <input id="searchInput" type="search" placeholder="Search by crop, district…" aria-label="Search by crop, district…" value="${search}" style="border:none;outline:none;flex:1;font-size:13px;background:transparent">
        </div>
        <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;margin-bottom:10px">
          <button data-crop="" style="flex-shrink:0;padding:5px 12px;border-radius:20px;border:none;font-size:12px;cursor:pointer;background:${!filterCrop?'#E65100':'#F5F5F5'};color:${!filterCrop?'white':'#616161'}">All Crops</button>
          ${crops.slice(0,10).map(c=>`<button data-crop="${c.id}" style="flex-shrink:0;padding:5px 12px;border-radius:20px;border:none;font-size:12px;cursor:pointer;background:${filterCrop==c.id?'#E65100':'#F5F5F5'};color:${filterCrop==c.id?'white':'#616161'}">${c.icon_emoji||''} ${c.name}</button>`).join('')}
        </div>
        <div style="font-size:11px;color:#757575;margin-bottom:8px">${filtered.length} listing${filtered.length!==1?'s':''} found</div>
        ${filtered.length === 0 ? `
          <div style="text-align:center;padding:40px 20px">
            <div style="font-size:40px;margin-bottom:8px">🌾</div>
            <div style="font-weight:700;margin-bottom:4px">No listings found</div>
            <div style="font-size:12px;color:#757575">Try different crop or district</div>
          </div>
        ` : filtered.map(l => `
          <div class="supply-card" data-id="${l.id}" style="background:white;border-radius:12px;margin-bottom:8px;box-shadow:0 2px 6px rgba(0,0,0,0.07);padding:12px 14px;cursor:pointer">
            <div style="display:flex;align-items:flex-start;gap:10px">
              <div style="width:40px;height:40px;border-radius:10px;background:#FFF3E0;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">${l.icon_emoji||'🌾'}</div>
              <div style="flex:1">
                <div style="font-weight:700;font-size:14px">${l.crop_name||'Crop'}</div>
                <div style="font-size:11px;color:#757575;margin-top:2px">${l.district_name||l.location_label||'District'} · ${Number(l.quantity_kg||0).toLocaleString()} kg · Grade ${l.grade||'A'}</div>
                <div style="display:flex;gap:4px;margin-top:5px;flex-wrap:wrap">
                  ${l.is_organic?'<span style="background:#E8F5E9;color:#2E7D32;padding:2px 7px;border-radius:8px;font-size:10px;font-weight:600">🌿 Organic</span>':''}
                  <span style="background:#FFF3E0;color:#E65100;padding:2px 7px;border-radius:8px;font-size:10px">🔒 Aggregated</span>
                  <span style="background:#E8F5E9;color:#2E7D32;padding:2px 7px;border-radius:8px;font-size:10px">${l.status||'active'}</span>
                </div>
              </div>
              <div style="text-align:right;flex-shrink:0">
                <div style="font-weight:800;font-size:15px;color:#E65100">₹${Number(l.price_per_kg||0).toFixed(0)}/kg</div>
                <button class="bid-btn" data-lid="${l.id}" style="margin-top:5px;padding:6px 10px;background:#1B5E20;color:white;border:none;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer">🤝 Bid</button>
                <button class="offer-btn" data-lid="${l.id}" style="margin-top:4px;padding:6px 10px;background:#6A1B9A;color:white;border:none;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer">💰 Offer</button>
                <button class="inq-btn" data-lid="${l.id}" style="margin-top:4px;padding:6px 10px;background:#E65100;color:white;border:none;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer">Inquire</button>
                <button class="watch-btn" data-lid="${l.id}" style="margin-top:4px;display:block;width:100%;padding:4px 6px;background:#F5F5F5;border:none;border-radius:6px;font-size:10px;cursor:pointer">${watchlist.some(w=>w.listing_id==l.id)?'⭐ Watching':'☆ Watch'}</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ─── BUYER: WATCHLIST ─────────────────────────────────────────────────────
  function renderWatchlist() {
    return `
      <div style="padding:12px 14px 0">
        <div style="font-size:11px;color:#757575;margin-bottom:10px">Crops you're tracking for supply availability changes</div>
        ${watchlist.length === 0 ? `
          <div style="text-align:center;padding:40px 20px">
            <div style="font-size:40px;margin-bottom:8px">⭐</div>
            <div style="font-weight:700;margin-bottom:4px">No items in watchlist</div>
            <div style="font-size:12px;color:#757575">Use ☆ Watch on any listing to track supply changes</div>
          </div>
        ` : watchlist.map(w=>`
          <div style="background:white;border-radius:12px;margin-bottom:8px;padding:12px 14px;box-shadow:0 1px 4px rgba(0,0,0,0.07)">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div>
                <div style="font-weight:700;font-size:13px">${w.crop_name||'Crop'}</div>
                <div style="font-size:11px;color:#757575">${w.district_name||w.location||'District'}</div>
              </div>
              <button class="unwatch-btn" data-wid="${w.id}" style="padding:5px 10px;background:#FFEBEE;color:#C62828;border:none;border-radius:8px;font-size:11px;cursor:pointer">Remove</button>
            </div>
          </div>`).join('')}
      </div>
    `;
  }

  // ─── BUYER: INTELLIGENCE REPORTS ──────────────────────────────────────────
  function renderIntelligenceReports() {
    return `
      <div style="padding:12px 14px 0">
        <div style="background:linear-gradient(135deg,#E65100,#BF360C);color:white;border-radius:12px;padding:14px;margin-bottom:14px">
          <div style="font-weight:700;margin-bottom:4px">🧠 Agri Intelligence</div>
          <div style="font-size:12px;opacity:0.9">Powered by real crop declarations from 100K+ farmers. Updated daily.</div>
        </div>
        ${[
          {icon:'🗺️',title:'Supply Heatmap',desc:'District-wise crop availability across states. Privacy threshold: min 5 farmers per zone.',tier:'Explorer+'},
          {icon:'📈',title:'30-Day Harvest Forecast',desc:'Predicted volumes from sow declarations + weather. Know supply 30-90 days ahead.',tier:'Trader+'},
          {icon:'📊',title:'Demand-Supply Gap',desc:'Surplus vs deficit zones. Plan procurement before others see the opportunity.',tier:'Trader+'},
          {icon:'🏢',title:'FPO Directory',desc:'Verified FPOs with supply capacity, response rates & deal history.',tier:'Explorer+'},
          {icon:'🤖',title:'Custom Report',desc:'AI-tailored to your crop basket, target geography and deal size.',tier:'Enterprise'},
        ].map(r=>`
          <div style="background:white;border-radius:12px;margin-bottom:8px;padding:14px;box-shadow:0 1px 4px rgba(0,0,0,0.07)">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <div style="display:flex;gap:10px">
                <span style="font-size:24px">${r.icon}</span>
                <div>
                  <div style="font-weight:700;font-size:13px">${r.title}</div>
                  <div style="font-size:11px;color:#757575;margin-top:3px">${r.desc}</div>
                </div>
              </div>
              <span style="background:#E3F2FD;color:#0277BD;padding:2px 8px;border-radius:8px;font-size:10px;font-weight:700;flex-shrink:0;margin-left:8px">${r.tier}</span>
            </div>
            <button style="width:100%;margin-top:10px;padding:8px;background:#E65100;color:white;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer">View Report →</button>
          </div>
        `).join('')}
        <div style="background:#FFF8E1;border-radius:10px;padding:12px;margin-top:4px">
          <div style="font-weight:700;color:#F57F17;margin-bottom:6px">💰 Intelligence Subscription</div>
          ${[['Explorer','₹9,999/yr','5 states · Supply heatmaps + FPO directory'],['Trader','₹24,999/yr','10 states · Forecasts + gap analysis'],['Enterprise','₹59,999/yr','All-India + API access + custom reports']].map(([n,p,f])=>`
            <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #FFE0B2;font-size:12px">
              <div><strong>${n}</strong><div style="font-size:10px;color:#757575">${f}</div></div>
              <div style="font-weight:700;color:#E65100">${p}</div>
            </div>`).join('')}
        </div>
      </div>
    `;
  }

  // ─── FPO ──────────────────────────────────────────────────────────────────
  function renderFPOMembers() {
    return `
      <div style="padding:12px 14px 0">
        <button id="addMemberBtn" style="width:100%;padding:12px;background:#1565C0;color:white;border:none;border-radius:12px;font-weight:700;font-size:14px;cursor:pointer;margin-bottom:12px">+ Add Member Farmer</button>
        ${fpoMembers.length === 0 ? `
          <div style="text-align:center;padding:40px 20px">
            <div style="font-size:40px;margin-bottom:8px">👥</div>
            <div style="font-weight:700;margin-bottom:4px">No members yet</div>
            <div style="font-size:12px;color:#757575">Add your member farmers to track procurement and publish supply</div>
          </div>
        ` : fpoMembers.map(m=>`
          <div style="background:white;border-radius:10px;margin-bottom:6px;padding:10px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.06);display:flex;align-items:center;gap:10px">
            <div style="width:36px;height:36px;border-radius:50%;background:#1565C020;display:flex;align-items:center;justify-content:center;font-size:18px">👨‍🌾</div>
            <div style="flex:1">
              <div style="font-weight:700;font-size:13px">${m.name||'Farmer'}</div>
              <div style="font-size:10px;color:#757575">${m.phone||''} · ${m.location_label||m.district_name||''}</div>
            </div>
            <span style="background:#E3F2FD;color:#1565C0;padding:2px 8px;border-radius:8px;font-size:10px;font-weight:700">${m.status||'active'}</span>
          </div>`).join('')}
      </div>
    `;
  }

  function renderFPOProcurement() {
    const totalKg = fpoRecords.reduce((s,r) => s + Number(r.quantity_kg||0), 0);
    const totalVal = fpoRecords.reduce((s,r) => s + Number(r.gross_amount||r.price_per_kg*r.quantity_kg||0), 0);
    const pendingVal = fpoRecords.filter(r=>r.payment_status!=='paid').reduce((s,r) => s + Number(r.net_payable||0), 0);
    const paidVal = fpoRecords.filter(r=>r.payment_status==='paid').reduce((s,r) => s + Number(r.net_payable||0), 0);
    return `
      <div style="padding:12px 14px 0">
        <!-- Stats bar -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:12px">
          <div style="background:#E8F5E9;border-radius:10px;padding:10px;text-align:center">
            <div style="font-weight:800;font-size:15px;color:#2E7D32">${Number(totalKg).toLocaleString()} kg</div>
            <div style="font-size:10px;color:#558B2F">Total Procured</div>
          </div>
          <div style="background:#E3F2FD;border-radius:10px;padding:10px;text-align:center">
            <div style="font-weight:800;font-size:15px;color:#1565C0">₹${(totalVal/1000).toFixed(0)}K</div>
            <div style="font-size:10px;color:#1565C0">Total Value</div>
          </div>
          <div style="background:#FFF3E0;border-radius:10px;padding:10px;text-align:center">
            <div style="font-weight:800;font-size:15px;color:#E65100">₹${(pendingVal/1000).toFixed(0)}K</div>
            <div style="font-size:10px;color:#E65100">Pending Pay</div>
          </div>
        </div>
        <!-- Crop-wise summary -->
        ${fpoProcSummary.length > 0 ? `
          <div style="background:white;border-radius:10px;padding:10px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
            <div style="font-weight:700;font-size:12px;color:#1565C0;margin-bottom:8px">📊 Crop-wise Summary</div>
            ${fpoProcSummary.slice(0,4).map(s=>`
              <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #F5F5F5">
                <span style="font-size:11px;font-weight:600">${s.crop_name||'Unknown'}</span>
                <span style="font-size:11px;color:#757575">${Number(s.total_kg||0).toLocaleString()} kg</span>
                <span style="font-size:11px;color:#1565C0">₹${Number(s.avg_price_per_kg||0).toFixed(0)}/kg</span>
                <span style="font-size:10px;background:${Number(s.pending_amount||0)>0?'#FFF3E0':'#E8F5E9'};color:${Number(s.pending_amount||0)>0?'#E65100':'#2E7D32'};padding:2px 6px;border-radius:6px">${Number(s.pending_amount||0)>0?'Pending':'Settled'}</span>
              </div>`).join('')}
          </div>
        ` : ''}
        <button id="recordProcBtn" style="width:100%;padding:12px;background:#1565C0;color:white;border:none;border-radius:12px;font-weight:700;font-size:14px;cursor:pointer;margin-bottom:12px">+ Record Procurement</button>
        ${fpoRecords.length === 0 ? `
          <div style="text-align:center;padding:40px 20px">
            <div style="font-size:40px;margin-bottom:8px">📦</div>
            <div style="font-weight:700;margin-bottom:4px">No procurement recorded</div>
            <div style="font-size:12px;color:#757575">Record crop purchases from your member farmers</div>
          </div>
        ` : fpoRecords.map(r=>`
          <div style="background:white;border-radius:10px;margin-bottom:6px;padding:10px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <div>
                <div style="font-weight:700;font-size:13px">${r.crop_name||'Crop'}</div>
                <div style="font-size:11px;color:#757575">${Number(r.quantity_kg||0).toLocaleString()} kg · Grade ${r.quality_grade||'A'} · from ${r.farmer_name||r.farmer_name_fallback||'Farmer'}</div>
                <div style="font-size:10px;color:#757575">${r.procurement_date||r.created_at?new Date(r.procurement_date||r.created_at).toLocaleDateString('en-IN'):''}</div>
              </div>
              <div style="text-align:right">
                <div style="font-weight:700;color:#1565C0">₹${Number(r.price_per_kg||0).toFixed(0)}/kg</div>
                <div style="font-size:10px;color:#757575">₹${Number(r.gross_amount||(r.price_per_kg*r.quantity_kg)||0).toLocaleString()} total</div>
                <span style="font-size:10px;background:${r.payment_status==='paid'?'#E8F5E9':'#FFF3E0'};color:${r.payment_status==='paid'?'#2E7D32':'#E65100'};padding:2px 7px;border-radius:8px;font-weight:700">${r.payment_status==='paid'?'✓ Paid':'⏳ Pending'}</span>
              </div>
            </div>
            ${r.payment_status!=='paid' ? `<button class="mark-paid-btn" data-rid="${r.id}" style="width:100%;margin-top:8px;padding:7px;background:#E8F5E9;color:#2E7D32;border:none;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer">✓ Mark as Paid (₹${Number(r.net_payable||0).toLocaleString()})</button>` : ''}
          </div>`).join('')}
      </div>
    `;
  }

  function renderFPOMySupply() {
    return `
      <div style="padding:12px 14px 0">
        <div style="background:#E8EAF6;border-radius:10px;padding:10px 12px;margin-bottom:12px;font-size:12px;color:#1a237e;line-height:1.5">
          Supply listings published by your FPO are <strong>visible to buyers</strong> nationwide in Supply Search.
          These represent your aggregated procurement from member farmers.
        </div>
        <button id="publishSupplyBtn" style="width:100%;padding:12px;background:#1565C0;color:white;border:none;border-radius:12px;font-weight:700;font-size:14px;cursor:pointer;margin-bottom:12px">+ Publish Supply Listing</button>
        ${myListings.length === 0 ? `
          <div style="text-align:center;padding:30px 20px">
            <div style="font-size:40px;margin-bottom:8px">📋</div>
            <div style="font-weight:700;margin-bottom:4px">No supply listings yet</div>
            <div style="font-size:12px;color:#757575">Publish your FPO's aggregated supply to attract buyers</div>
          </div>
        ` : myListings.map(l=>`
          <div style="background:white;border-radius:10px;margin-bottom:6px;padding:10px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.06);border-left:4px solid #1565C0">
            <div style="display:flex;justify-content:space-between">
              <div>
                <div style="font-weight:700;font-size:13px">${l.crop_name||'Crop'}</div>
                <div style="font-size:11px;color:#757575">${Number(l.quantity_kg||0).toLocaleString()} kg · ₹${Number(l.price_per_kg||0).toFixed(0)}/kg</div>
              </div>
              <span style="background:#E8F5E9;color:#2E7D32;padding:2px 8px;border-radius:8px;font-size:10px;font-weight:700;align-self:flex-start">Live</span>
            </div>
          </div>`).join('')}
      </div>
    `;
  }

  // ─── EVENTS ───────────────────────────────────────────────────────────────
  function attachEvents() {
    container.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; render(); }));

    // Farmer: My Crops
    container.querySelector('#createDeclBtn')?.addEventListener('click', showCreateDeclaration);
    container.querySelector('#createListingBtn')?.addEventListener('click', showCreateListing);
    container.querySelectorAll('.edit-decl-btn').forEach(b => b.addEventListener('click', () => showEditDeclaration(b.dataset.id)));
    container.querySelectorAll('.del-decl-btn').forEach(b => b.addEventListener('click', async () => {
      if (!confirm('Delete declaration?')) return;
      try { await api.deleteDeclaration(b.dataset.id); showToast('Deleted','info'); loadData(); } catch(e){showToast(e.message,'error');}
    }));
    container.querySelectorAll('.edit-listing-btn').forEach(b => b.addEventListener('click', () => showEditListing(b.dataset.id)));
    container.querySelectorAll('.del-listing-btn').forEach(b => b.addEventListener('click', async () => {
      if (!confirm('Delete listing?')) return;
      try { await api.deleteListing(b.dataset.id); showToast('Deleted','info'); loadData(); } catch(e){showToast(e.message,'error');}
    }));

    // Inquiries
    container.querySelectorAll('.accept-inq-btn').forEach(b => b.addEventListener('click', async () => {
      try { await api.respondInquiry(b.dataset.id,{status:'accepted'}); showToast('Accepted!','success'); loadData(); } catch(e){showToast(e.message,'error');}
    }));
    container.querySelectorAll('.reject-inq-btn').forEach(b => b.addEventListener('click', async () => {
      try { await api.respondInquiry(b.dataset.id,{status:'rejected'}); showToast('Rejected','info'); loadData(); } catch(e){showToast(e.message,'error');}
    }));
    container.querySelectorAll('.neg-inq-btn').forEach(b => b.addEventListener('click', () => {
      const q = inquiries.find(x=>x.id==b.dataset.id);
      showModal(`<div class="modal-handle"></div><h3>💬 Counter Offer</h3>
        <div class="form-group"><label>Counter Price (₹/kg)</label><input class="form-input" type="number" id="negPrice"></div>
        <div class="form-group"><label>Message</label><textarea class="form-input" id="negMsg" rows="2" placeholder="Your terms…"></textarea></div>
        <button id="sendNeg" style="width:100%;padding:12px;background:#0277BD;color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer">Send Counter Offer</button>`);
      document.querySelector('#sendNeg')?.addEventListener('click', async () => {
        try {
          await api.respondInquiry(q.id,{status:'negotiating',counter_price:Number(document.querySelector('#negPrice').value),response_message:document.querySelector('#negMsg').value});
          showToast('Counter sent!','success'); closeModal(); loadData();
        } catch(e){showToast(e.message,'error');}
      });
    }));
    container.querySelectorAll('.create-order-btn').forEach(b => b.addEventListener('click', async () => {
      const q = inquiries.find(x=>x.id==b.dataset.iq);
      if (!q) return;
      try {
        await api.createOrder({inquiry_id:q.id,listing_id:q.listing_id,quantity_kg:q.quantity_needed,total_amount:(q.offered_price||0)*(q.quantity_needed||0)});
        showToast('Order created!','success'); loadData();
      } catch(e){showToast(e.message,'error');}
    }));

    // Buyer: search
    container.querySelector('#searchInput')?.addEventListener('input', e => { search = e.target.value; render(); });
    container.querySelectorAll('[data-crop]').forEach(b => b.addEventListener('click', () => { filterCrop = b.dataset.crop; render(); }));
    container.querySelectorAll('.inq-btn').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); showSendInquiry(b.dataset.lid); }));
    container.querySelectorAll('.bid-btn').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); showPlaceBid(b.dataset.lid); }));
    container.querySelectorAll('.offer-btn').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); showMakeOffer(b.dataset.lid); }));
    container.querySelectorAll('.watch-btn').forEach(b => b.addEventListener('click', async e => {
      e.stopPropagation();
      const l = listings.find(x=>x.id==b.dataset.lid);
      if (!l) return;
      const already = watchlist.some(w=>w.listing_id==l.id||w.crop_id==l.crop_id);
      try {
        if (already) { const w = watchlist.find(x=>x.listing_id==l.id); if(w) await api.removeWatchlist(w.id); showToast('Removed','info'); }
        else { await api.addWatchlist({crop_id:l.crop_id,listing_id:l.id}); showToast('Added to watchlist!','success'); }
        loadData();
      } catch(err){showToast(err.message,'error');}
    }));
    container.querySelectorAll('.unwatch-btn').forEach(b => b.addEventListener('click', async () => {
      try { await api.removeWatchlist(b.dataset.wid); showToast('Removed','info'); loadData(); } catch(e){showToast(e.message,'error');}
    }));

    // FPO
    container.querySelector('#addMemberBtn')?.addEventListener('click', () => {
      showModal(`<div class="modal-handle"></div><h3>Add Member Farmer</h3>
        <div class="form-group"><label>Phone</label><input class="form-input" type="tel" id="mPhone" placeholder="9876543210"></div>
        <div class="form-group"><label>Name</label><input class="form-input" id="mName" placeholder="Farmer name"></div>
        <button id="submitMember" style="width:100%;padding:12px;background:#1565C0;color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer">Add Member</button>`);
      document.querySelector('#submitMember')?.addEventListener('click', async () => {
        try { await api.addFPOMember({phone:document.querySelector('#mPhone').value,name:document.querySelector('#mName').value}); showToast('Member added!','success'); closeModal(); loadData(); } catch(e){showToast(e.message,'error');}
      });
    });
    container.querySelector('#recordProcBtn')?.addEventListener('click', () => {
      showModal(`<div class="modal-handle"></div><h3>Record Procurement</h3>
        <div class="form-group"><label>Crop</label><select class="form-input" id="procCrop">${crops.map(c=>`<option value="${c.id}">${c.icon_emoji||''} ${c.name}</option>`).join('')}</select></div>
        <div class="form-group"><label>Farmer Phone</label><input class="form-input" type="tel" id="procFarmer" placeholder="9876543210"></div>
        <div class="form-group"><label>Quantity (kg)</label><input class="form-input" type="number" id="procQty"></div>
        <div class="form-group"><label>Price per kg (₹)</label><input class="form-input" type="number" id="procPrice"></div>
        <div class="form-group"><label>Grade</label><select class="form-input" id="procGrade"><option>A</option><option>B</option><option>C</option></select></div>
        <button id="submitProc" style="width:100%;padding:12px;background:#1565C0;color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer">Record</button>`);
      document.querySelector('#submitProc')?.addEventListener('click', async () => {
        try { await api.recordProcurement({crop_id:Number(document.querySelector('#procCrop').value),farmer_phone:document.querySelector('#procFarmer').value,quantity_kg:Number(document.querySelector('#procQty').value),price_per_kg:Number(document.querySelector('#procPrice').value),grade:document.querySelector('#procGrade').value}); showToast('Recorded!','success'); closeModal(); loadData(); } catch(e){showToast(e.message,'error');}
      });
    });
    container.querySelector('#publishSupplyBtn')?.addEventListener('click', () => {
      showModal(`<div class="modal-handle"></div><h3>Publish Supply Listing</h3>
        <div class="form-group"><label>Crop</label><select class="form-input" id="slCrop">${crops.map(c=>`<option value="${c.id}">${c.icon_emoji||''} ${c.name}</option>`).join('')}</select></div>
        <div class="form-group"><label>Quantity (kg)</label><input class="form-input" type="number" id="slQty"></div>
        <div class="form-group"><label>Price per kg (₹)</label><input class="form-input" type="number" id="slPrice"></div>
        <div class="form-group"><label>Available From</label><input class="form-input" type="date" id="slDate"></div>
        <button id="submitSupply" style="width:100%;padding:12px;background:#1565C0;color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer">Publish</button>`);
      document.querySelector('#submitSupply')?.addEventListener('click', async () => {
        try { await api.createSupplyListing({crop_id:Number(document.querySelector('#slCrop').value),quantity_kg:Number(document.querySelector('#slQty').value),price_per_kg:Number(document.querySelector('#slPrice').value),available_from:document.querySelector('#slDate').value}); showToast('Published!','success'); closeModal(); loadData(); } catch(e){showToast(e.message,'error');}
      });
    });

    // FPO: Mark procurement payment as paid
    container.querySelectorAll('.mark-paid-btn').forEach(b => b.addEventListener('click', async () => {
      try {
        await api.updateFPOProcurement(b.dataset.rid, { payment_status: 'paid' });
        showToast('Payment marked as paid!', 'success'); loadData();
      } catch(e) { showToast(e.message, 'error'); }
    }));
  }

  // ─── MODALS ───────────────────────────────────────────────────────────────
  function showCreateDeclaration() {
    showModal(`<div class="modal-handle"></div><h3>🌱 Declare a Crop</h3>
      <div style="font-size:12px;color:#757575;margin-bottom:12px">Tell us what you're growing. This adds to national supply forecasts (anonymous). You can list it for sale later.</div>
      <div class="form-group"><label>Crop</label><select class="form-input" id="cdCrop">${crops.map(c=>`<option value="${c.id}">${c.icon_emoji||''} ${c.name}</option>`).join('')}</select></div>
      <div class="form-group"><label>Area (acres)</label><input class="form-input" type="number" id="cdArea" placeholder="5" step="0.5"></div>
      <div class="form-group"><label>Expected Yield (kg)</label><input class="form-input" type="number" id="cdYield" placeholder="5000"></div>
      <div class="form-group"><label>Sow Date</label><input class="form-input" type="date" id="cdSow"></div>
      <div class="form-group"><label>Expected Harvest</label><input class="form-input" type="date" id="cdHarvest"></div>
      <div class="form-group"><label>Grade</label><select class="form-input" id="cdGrade"><option>A</option><option>B</option><option>C</option></select></div>
      <button id="submitDecl" style="width:100%;padding:12px;background:#2E7D32;color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer">Declare Crop</button>`);
    document.querySelector('#submitDecl')?.addEventListener('click', async () => {
      try {
        await api.createDeclaration({crop_id:Number(document.querySelector('#cdCrop').value),area_acres:Number(document.querySelector('#cdArea').value),expected_yield:Number(document.querySelector('#cdYield').value)||undefined,sow_date:document.querySelector('#cdSow').value,expected_harvest_date:document.querySelector('#cdHarvest').value,quality_grade:document.querySelector('#cdGrade').value});
        showToast('Declaration created!','success'); closeModal(); loadData();
      } catch(e){showToast(e.message,'error');}
    });
  }

  function showEditDeclaration(id) {
    const d = declarations.find(x=>x.id==id);
    if (!d) return;
    showModal(`<div class="modal-handle"></div><h3>Edit Declaration</h3>
      <div class="form-group"><label>Area (acres)</label><input class="form-input" type="number" id="edArea" value="${d.area_acres||''}"></div>
      <div class="form-group"><label>Expected Yield (kg)</label><input class="form-input" type="number" id="edYield" value="${d.expected_yield||''}"></div>
      <div class="form-group"><label>Harvest Date</label><input class="form-input" type="date" id="edDate" value="${d.expected_harvest_date?d.expected_harvest_date.split('T')[0]:''}"></div>
      <button id="saveDecl" style="width:100%;padding:12px;background:#2E7D32;color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer">Save</button>`);
    document.querySelector('#saveDecl')?.addEventListener('click', async () => {
      try { await api.updateDeclaration(d.id,{area_acres:Number(document.querySelector('#edArea').value),expected_yield:Number(document.querySelector('#edYield').value),expected_harvest_date:document.querySelector('#edDate').value}); showToast('Updated!','success'); closeModal(); loadData(); } catch(e){showToast(e.message,'error');}
    });
  }

  function showCreateListing() {
    let uploadedPhotos = [];
    showModal(`<div class="modal-handle"></div><h3>📋 List Crop for Sale</h3>
      <div style="font-size:12px;color:#757575;margin-bottom:12px">Once listed, buyers across India can discover and send inquiries to you.</div>
      <div class="form-group"><label>Crop</label><select class="form-input" id="clCrop">${crops.map(c=>`<option value="${c.id}">${c.icon_emoji||''} ${c.name}</option>`).join('')}</select></div>
      <div class="form-group"><label>Quantity available (kg)</label><input class="form-input" type="number" id="clQty" placeholder="1000"></div>
      <div class="form-group"><label>Price per kg (₹)</label><input class="form-input" type="number" id="clPrice" placeholder="25" step="0.5"></div>
      <div class="form-group"><label>Grade</label><select class="form-input" id="clGrade"><option>A</option><option>B</option><option>C</option></select></div>
      <div class="form-group"><label>Organic?</label><select class="form-input" id="clOrganic"><option value="false">No</option><option value="true">Yes — certified organic</option></select></div>
      <div class="form-group"><label>Location label (optional)</label><input class="form-input" id="clLoc" placeholder="Near Guntur Mandi"></div>
      <div class="form-group"><label>📷 Photos (optional)</label>
        <input type="file" id="clPhotoInput" accept="image/*" multiple style="font-size:12px">
        <div id="clPhotoPreview" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"></div>
      </div>
      <button id="submitListing" style="width:100%;padding:12px;background:#0277BD;color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer">List for Sale</button>`);

    document.querySelector('#clPhotoInput')?.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      const preview = document.querySelector('#clPhotoPreview');
      for (const file of files) {
        const reader = new FileReader();
        reader.onload = async (ev) => {
          try {
            const res = await api.uploadBase64Image(ev.target.result, 'listing');
            const url = res.url || res.file_url || ev.target.result.slice(0, 50);
            uploadedPhotos.push(url);
            preview.innerHTML += `<div style="width:48px;height:48px;border-radius:6px;background:#E8F5E9;display:flex;align-items:center;justify-content:center;font-size:10px">📷</div>`;
          } catch(err) { showToast('Upload failed: ' + err.message, 'error'); }
        };
        reader.readAsDataURL(file);
      }
    });

    document.querySelector('#submitListing')?.addEventListener('click', async () => {
      try {
        await api.createListing({crop_id:Number(document.querySelector('#clCrop').value),quantity_kg:Number(document.querySelector('#clQty').value),price_per_kg:Number(document.querySelector('#clPrice').value),grade:document.querySelector('#clGrade').value,is_organic:document.querySelector('#clOrganic').value==='true',location_label:document.querySelector('#clLoc').value||undefined,photos:uploadedPhotos.length?uploadedPhotos:undefined});
        showToast('Listing created! Buyers can now discover it.','success'); closeModal(); loadData();
      } catch(e){showToast(e.message,'error');}
    });
  }

  function showEditListing(id) {
    const l = myListings.find(x=>x.id==id);
    if (!l) return;
    showModal(`<div class="modal-handle"></div><h3>Edit Listing</h3>
      <div class="form-group"><label>Quantity (kg)</label><input class="form-input" type="number" id="elQty" value="${l.quantity_kg||''}"></div>
      <div class="form-group"><label>Price per kg (₹)</label><input class="form-input" type="number" id="elPrice" value="${l.price_per_kg||''}" step="0.5"></div>
      <div class="form-group"><label>Status</label><select class="form-input" id="elStatus"><option value="active" ${l.status==='active'?'selected':''}>Active</option><option value="sold" ${l.status==='sold'?'selected':''}>Sold</option></select></div>
      <button id="saveListing" style="width:100%;padding:12px;background:#0277BD;color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer">Save</button>`);
    document.querySelector('#saveListing')?.addEventListener('click', async () => {
      try { await api.updateListing(l.id,{quantity_kg:Number(document.querySelector('#elQty').value),price_per_kg:Number(document.querySelector('#elPrice').value),status:document.querySelector('#elStatus').value}); showToast('Updated!','success'); closeModal(); loadData(); } catch(e){showToast(e.message,'error');}
    });
  }

  function showSendInquiry(lid) {
    const l = listings.find(x=>x.id==lid);
    if (!l) return;
    showModal(`<div class="modal-handle"></div><h3>Send Inquiry — ${l.crop_name}</h3>
      <div style="background:#FFF3E0;border-radius:8px;padding:10px;margin-bottom:10px;font-size:12px">
        ${l.crop_name} · ${l.district_name||l.location_label||'District'} · ${Number(l.quantity_kg||0).toLocaleString()} kg available
      </div>
      <div class="form-group"><label>Quantity needed (kg)</label><input class="form-input" type="number" id="iqQty" placeholder="500"></div>
      <div class="form-group"><label>Offered price (₹/kg)</label><input class="form-input" type="number" id="iqPrice" placeholder="${l.price_per_kg||''}"></div>
      <div class="form-group"><label>Message</label><textarea class="form-input" id="iqMsg" rows="2" placeholder="Your requirements…"></textarea></div>
      <button id="submitInq" style="width:100%;padding:12px;background:#E65100;color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer">Send Inquiry</button>
      <div style="font-size:10px;color:#757575;text-align:center;margin-top:6px">🔒 Farmer identity revealed only after they accept</div>`);
    document.querySelector('#submitInq')?.addEventListener('click', async () => {
      const qty = document.querySelector('#iqQty').value;
      if (!qty) { showToast('Enter quantity','error'); return; }
      try { await api.createInquiry({listing_id:l.id,quantity_needed:Number(qty),offered_price:Number(document.querySelector('#iqPrice').value)||undefined,message:document.querySelector('#iqMsg').value}); showToast('Inquiry sent!','success'); closeModal(); } catch(e){showToast(e.message,'error');}
    });
  }

  function showPlaceBid(lid) {
    const l = listings.find(x=>x.id==lid);
    if (!l) return;
    showModal(`<div class="modal-handle"></div><h3>🤝 Place Bid — ${l.crop_name||'Crop'}</h3>
      <div style="background:#E8F5E9;border-radius:8px;padding:10px;margin-bottom:10px;font-size:12px">
        ${l.crop_name||'Crop'} · ${l.district_name||l.location_label||'District'} · ${Number(l.quantity_kg||0).toLocaleString()} kg available @ ₹${l.price_per_kg||'—'}/kg
      </div>
      <div class="form-group"><label>Your bid price (₹/kg)</label><input class="form-input" type="number" id="bidPrice" placeholder="${l.price_per_kg||''}" step="0.5"></div>
      <div class="form-group"><label>Quantity (kg)</label><input class="form-input" type="number" id="bidQty" placeholder="${l.quantity_kg||500}"></div>
      <div class="form-group"><label>Delivery address</label><input class="form-input" type="text" id="bidAddr" placeholder="Your delivery location"></div>
      <button id="submitBid" style="width:100%;padding:12px;background:#1B5E20;color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer">Place Bid</button>
      <div style="font-size:10px;color:#757575;text-align:center;margin-top:6px">💰 If seller accepts, you'll fund escrow next</div>`);
    document.querySelector('#submitBid')?.addEventListener('click', async () => {
      const price = document.querySelector('#bidPrice').value;
      const qty = document.querySelector('#bidQty').value;
      if (!price || !qty) { showToast('Enter price and quantity','error'); return; }
      try {
        await api.placeBid({
          listing_id: l.id,
          price_per_kg: Number(price),
          quantity_kg: Number(qty),
          delivery_address: document.querySelector('#bidAddr')?.value || ''
        });
        showToast('Bid placed! Seller will review.','success');
        closeModal();
      } catch(e) { showToast(e.message,'error'); }
    });
  }

  function showMakeOffer(lid) {
    const l = listings.find(x=>x.id==lid);
    if (!l) return;
    showModal(`<div class="modal-handle"></div><h3>💰 Make Offer — ${l.crop_name||'Crop'}</h3>
      <div style="background:#EDE7F6;border-radius:8px;padding:10px;margin-bottom:10px;font-size:12px">
        ${l.crop_name||'Crop'} · ${l.district_name||l.location_label||'District'} · ${Number(l.quantity_kg||0).toLocaleString()} kg @ ₹${l.price_per_kg||'—'}/kg
      </div>
      <div class="form-group"><label>Your offered price (₹/kg)</label><input class="form-input" type="number" id="offerPrice" placeholder="${l.price_per_kg||''}" step="0.5"></div>
      <div class="form-group"><label>Quantity (kg)</label><input class="form-input" type="number" id="offerQty" placeholder="${l.quantity_kg||500}"></div>
      <div class="form-group"><label>Message to seller</label><textarea class="form-input" id="offerMsg" rows="2" placeholder="e.g. Can deliver in 3 days, immediate payment…"></textarea></div>
      <button id="submitOffer" style="width:100%;padding:12px;background:#6A1B9A;color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer">Send Offer</button>
      <div style="font-size:10px;color:#757575;text-align:center;margin-top:6px">Seller can accept, reject, or counter your offer</div>`);
    document.querySelector('#submitOffer')?.addEventListener('click', async () => {
      const price = document.querySelector('#offerPrice').value;
      const qty = document.querySelector('#offerQty').value;
      if (!price || !qty) { showToast('Enter price and quantity','error'); return; }
      try {
        await api.post(`/agriflow/listings/${l.id}/offers`, {
          offered_price: Number(price),
          quantity_kg: Number(qty),
          message: document.querySelector('#offerMsg')?.value,
        });
        showToast('Offer sent! Seller will review.','success');
        closeModal();
      } catch(e) { showToast(e.message,'error'); }
    });
  }

  // ─── DATA ─────────────────────────────────────────────────────────────────
  async function loadData() {
    loading = true; render();
    try {
      const [listRes, cropRes] = await Promise.all([
        isBuyer ? api.supplySearch().catch(()=>api.getListings('?limit=30')) : Promise.resolve([]),
        api.getCrops(),
      ]);
      listings  = Array.isArray(listRes) ? listRes : (listRes.listings||listRes.results||[]);
      crops     = Array.isArray(cropRes) ? cropRes : (cropRes.crops||[]);
    } catch(e) { console.error(e); }

    try {
      if (isBuyer) {
        const wl = await api.getWatchlist().catch(()=>[]);
        watchlist = Array.isArray(wl) ? wl : (wl.watchlist||[]);
      }
      if (isFPO) {
        const [memRes,recRes,summRes] = await Promise.all([
          api.getFPOMembers().catch(()=>[]),
          api.getFPOProcurement().catch(()=>[]),
          api.get('/fpo/procurement/summary').catch(()=>({})),
        ]);
        fpoMembers  = Array.isArray(memRes) ? memRes : (memRes.members||[]);
        fpoRecords  = Array.isArray(recRes) ? recRes : (recRes.records||[]);
        fpoProcSummary = Array.isArray(summRes) ? summRes : (summRes.summary||[]);
      }
      const [ml,dl,iq] = await Promise.all([
        (isFPO ? api.getFPOSupplyListings() : api.getMyListings()).catch(()=>[]),
        api.getDeclarations().catch(()=>[]),
        (isBuyer ? api.getBuyerInquiries() : api.getInquiries()).catch(()=>[]),
      ]);
      myListings   = Array.isArray(ml) ? ml : (ml.listings||ml.supply_listings||[]);
      declarations = Array.isArray(dl) ? dl : (dl.declarations||[]);
      inquiries    = Array.isArray(iq) ? iq : (iq.inquiries||[]);
    } catch(e) { console.error(e); }
    // Fallback to sample data for new users
    if (crops.length === 0) crops = SAMPLE_CROPS;
    if (isBuyer && listings.length === 0) listings = SAMPLE_LISTINGS;
    if (myListings.length === 0) myListings = SAMPLE_MY_LISTINGS;
    if (declarations.length === 0) declarations = SAMPLE_DECLARATIONS;
    if (inquiries.length === 0) inquiries = SAMPLE_INQUIRIES;
    loading = false; render();
  }

  loadData();
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {day:'numeric',month:'short'});
}
