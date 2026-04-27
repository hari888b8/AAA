import { api } from '../api.js';
import { getRole } from '../store.js';
import { showToast, showModal, closeModal } from '../main.js';
import { t } from '../i18n.js';

export function renderIntelligence(container) {
  const role = getRole();
  const isFPO = role === 'fpo';
  const isBuyer = role === 'buyer';
  const isFarmer = !isFPO && !isBuyer;

  let tab = isFPO ? 'fpo-dashboard' : isBuyer ? 'buyer-search' : 'farmer-dashboard';

  // Shared analytics
  let prices = [], supplyDemand = [], districts = [], recommendations = [], platformStats = {}, activities = [];
  // Farmer
  let farmerProfile = null, declarations = [], myInquiries = [], myListings = [], harvestCalendar = [];
  // FPO
  let fpoProfile = null, fpoMembers = [], procurement = [], inventory = [], fpoListings = [], fpoStats = {};
  // Buyer
  let buyerProfile = null, supplyResults = [], buyerInquiries = [], watchlist = [], buyerStats = {};
  let searchFilters = { crop: '', state: '', district: '', harvest_within_days: 30, min_quantity: 0 };
  let loading = true;

  function render() {
    container.innerHTML = `
      <div class="app-brand-header" style="padding:14px 16px 10px;background:linear-gradient(135deg,#e63946 0%,#9b59b6 100%);color:#fff">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:28px">📊</span>
          <div>
            <div style="font-size:18px;font-weight:800;letter-spacing:-0.3px">${isFPO?'🏢 AgriFlow · FPO Hub':isBuyer?'🔍 Buyer Intelligence Hub':'🌾 AgriFlow · My Farm Hub'}</div>
            <div style="font-size:11px;opacity:0.85">${isFPO?'Member management · Procurement · Supply listings':isBuyer?'Nationwide supply discovery · Forecasts · Watchlist':'Crop declarations · Harvest calendar · Inquiries'}</div>
          </div>
        </div>
      </div>
      <div class="tab-bar" style="overflow-x:auto;white-space:nowrap">
        ${isFPO ? renderFPOTabs() : isBuyer ? renderBuyerTabs() : renderFarmerTabs()}
      </div>
      ${loading ? '<div class="loading"><div class="spinner"></div></div>' : renderTab()}
    `;
    attachEvents();
  }

  function renderFarmerTabs() {
    return `
      <button class="tab-btn ${tab==='farmer-dashboard'?'active':''}" data-tab="farmer-dashboard">📊 Dashboard</button>
      <button class="tab-btn ${tab==='declarations'?'active':''}" data-tab="declarations">🌾 Declarations</button>
      <button class="tab-btn ${tab==='harvest-listings'?'active':''}" data-tab="harvest-listings">📦 My Harvests</button>
      <button class="tab-btn ${tab==='my-inquiries'?'active':''}" data-tab="my-inquiries">📩 Inquiries</button>
      <button class="tab-btn ${tab==='calendar'?'active':''}" data-tab="calendar">📅 Calendar</button>
      <button class="tab-btn ${tab==='prices'?'active':''}" data-tab="prices">💰 Prices</button>
      <button class="tab-btn ${tab==='plans'?'active':''}" data-tab="plans">💎 Plans</button>
    `;
  }
  function renderFPOTabs() {
    return `
      <button class="tab-btn ${tab==='fpo-dashboard'?'active':''}" data-tab="fpo-dashboard">📊 Dashboard</button>
      <button class="tab-btn ${tab==='members'?'active':''}" data-tab="members">👥 Members</button>
      <button class="tab-btn ${tab==='procurement'?'active':''}" data-tab="procurement">📥 Procurement</button>
      <button class="tab-btn ${tab==='inventory'?'active':''}" data-tab="inventory">📦 Inventory</button>
      <button class="tab-btn ${tab==='fpo-listings'?'active':''}" data-tab="fpo-listings">🛒 Supply Listings</button>
      <button class="tab-btn ${tab==='supply'?'active':''}" data-tab="supply">⚖️ Market</button>
      <button class="tab-btn ${tab==='prices'?'active':''}" data-tab="prices">💰 Prices</button>
    `;
  }
  function renderBuyerTabs() {
    return `
      <button class="tab-btn ${tab==='buyer-search'?'active':''}" data-tab="buyer-search">🔎 Supply Search</button>
      <button class="tab-btn ${tab==='buyer-intelligence'?'active':''}" data-tab="buyer-intelligence">🧠 Intelligence</button>
      <button class="tab-btn ${tab==='watchlist'?'active':''}" data-tab="watchlist">⭐ Watchlist</button>
      <button class="tab-btn ${tab==='buyer-inquiries'?'active':''}" data-tab="buyer-inquiries">📩 My Inquiries</button>
      <button class="tab-btn ${tab==='districts'?'active':''}" data-tab="districts">🗺️ Districts</button>
      <button class="tab-btn ${tab==='forecast'?'active':''}" data-tab="forecast">📈 Forecast</button>
      <button class="tab-btn ${tab==='prices'?'active':''}" data-tab="prices">💰 Prices</button>
      <button class="tab-btn ${tab==='plans'?'active':''}" data-tab="plans">💎 Plans</button>
    `;
  }

  function renderTab() {
    switch(tab) {
      case 'farmer-dashboard': return renderFarmerDashboard();
      case 'declarations': return renderDeclarations();
      case 'harvest-listings': return renderHarvestListings();
      case 'my-inquiries': return renderMyInquiries();
      case 'calendar': return renderCalendar();
      case 'fpo-dashboard': return renderFPODashboard();
      case 'members': return renderFPOMembers();
      case 'procurement': return renderProcurement();
      case 'inventory': return renderInventory();
      case 'fpo-listings': return renderFPOListings();
      case 'buyer-search': return renderBuyerSearch();
      case 'buyer-intelligence': return renderBuyerIntelligence();
      case 'watchlist': return renderWatchlist();
      case 'buyer-inquiries': return renderBuyerInquiries();
      case 'prices': return renderPrices();
      case 'supply': return renderSupply();
      case 'districts': return renderDistricts();
      case 'forecast': return renderForecast();
      case 'plans': return renderPlans();
      default: return renderFarmerDashboard();
    }
  }

  // ═══ FARMER VIEWS ═══
  function renderFarmerDashboard() {
    const totalArea = declarations.reduce((s,d)=>s+Number(d.area_acres||0),0);
    const expectedYield = declarations.reduce((s,d)=>s+Number(d.expected_yield||0),0);
    const upcoming = declarations.filter(d => {
      const days = Math.ceil((new Date(d.expected_harvest_date) - new Date()) / 86400000);
      return days >= 0 && days <= 30;
    });
    return `<div class="section" style="padding-top:8px">
      <div class="card" style="padding:14px;margin-bottom:12px;background:linear-gradient(135deg,#4CAF50 0%,#2196F3 100%);color:white">
        <div class="fw-700">${farmerProfile?.village || 'Your Farm'}, ${farmerProfile?.district_name || farmerProfile?.state || 'India'}</div>
        <div class="text-sm" style="opacity:0.9">${farmerProfile?.total_land_acres ? `${farmerProfile.total_land_acres} acres` : 'Set up your profile to get started'}</div>
      </div>
      <div class="stats-grid mb-lg">
        <div class="stat-card"><div class="stat-icon">🌾</div><div class="stat-value">${declarations.length}</div><div class="stat-label">Declarations</div></div>
        <div class="stat-card"><div class="stat-icon">📐</div><div class="stat-value">${totalArea.toFixed(1)}</div><div class="stat-label">Acres Planted</div></div>
        <div class="stat-card"><div class="stat-icon">📦</div><div class="stat-value">${expectedYield.toFixed(0)}</div><div class="stat-label">Tons Expected</div></div>
        <div class="stat-card"><div class="stat-icon">📩</div><div class="stat-value">${myInquiries.length}</div><div class="stat-label">Buyer Inquiries</div></div>
      </div>
      ${upcoming.length > 0 ? `
        <div class="section-title">📅 Upcoming Harvests (${upcoming.length})</div>
        ${upcoming.map(d => {
          const days = Math.ceil((new Date(d.expected_harvest_date) - new Date()) / 86400000);
          return `<div class="card" style="padding:12px;margin-bottom:8px">
            <div class="flex-between">
              <div><div class="fw-700">${d.crop_name||'Crop'}</div><div class="text-sm text-muted">${d.area_acres} acres · Est. ${d.expected_yield||'?'}t</div></div>
              <span class="tag tag-${days<=7?'orange':'blue'}">${days}d</span>
            </div>
          </div>`;
        }).join('')}
      ` : ''}
      <div class="card" style="padding:14px;margin-top:8px;background:var(--info-bg);border:1px solid var(--info)">
        <div class="fw-600 text-sm">💡 Why Declare Crops?</div>
        <div class="text-sm text-muted mt-sm">Declaring crops helps buyers find you BEFORE harvest. Farmers with active declarations get 3x more inquiries.</div>
      </div>
    </div>`;
  }

  function renderDeclarations() {
    return `<div class="section" style="padding-top:8px">
      <button class="btn btn-primary btn-small mb" id="addDeclBtn" style="width:100%">+ Declare New Crop</button>
      <div class="text-sm text-muted" style="margin:0 16px 12px;font-size:12px">Declare crops you've planted. This data feeds the national supply intelligence engine and connects you to buyers.</div>
      ${declarations.length === 0 ? `<div class="empty-state"><div class="es-icon">🌾</div><div class="es-title">No declarations yet</div><div class="es-text">Declare your first crop to be discovered by buyers</div></div>` :
        declarations.map(d => {
          const harvestDays = Math.ceil((new Date(d.expected_harvest_date) - new Date()) / 86400000);
          return `<div class="card" style="padding:12px;margin-bottom:10px">
            <div class="flex-between" style="margin-bottom:6px">
              <div class="fw-700">🌾 ${d.crop_name || 'Crop'}</div>
              <span class="tag tag-${harvestDays<=15?'orange':harvestDays<=30?'blue':'gray'}">${harvestDays >= 0 ? harvestDays + 'd to harvest' : 'Harvested'}</span>
            </div>
            <div class="text-sm text-muted">${d.area_acres} acres · ${d.expected_yield||'?'}t expected · ${d.is_organic?'🌱 Organic':''}</div>
            <div class="text-sm text-muted">Sown: ${new Date(d.sow_date).toLocaleDateString('en-IN')} · Harvest: ${new Date(d.expected_harvest_date).toLocaleDateString('en-IN')}</div>
            ${d.district_name ? `<div class="text-sm text-muted">📍 ${d.district_name}</div>` : ''}
            <div style="display:flex;gap:6px;margin-top:8px">
              <button class="btn btn-secondary btn-small decl-edit" data-did="${d.id}" style="flex:1">Edit</button>
              <button class="btn btn-small decl-del" data-did="${d.id}" style="flex:1;background:#FFEBEE;color:#C62828;border:none">Delete</button>
            </div>
          </div>`;
        }).join('')}
    </div>`;
  }

  function renderHarvestListings() {
    return `<div class="section" style="padding-top:8px">
      <button class="btn btn-primary btn-small mb" id="addListingBtn" style="width:100%">+ Post Harvest Listing</button>
      <div class="text-sm text-muted" style="margin:0 16px 12px;font-size:12px">Post when harvest is approaching. Buyers will discover and inquire.</div>
      ${myListings.length === 0 ? `<div class="empty-state"><div class="es-icon">📦</div><div class="es-title">No harvest listings</div><div class="es-text">Post a listing when your crop is ready</div></div>` :
        myListings.map(l => `
          <div class="card" style="padding:12px;margin-bottom:8px">
            <div class="flex-between">
              <div class="fw-700">${l.crop_name||'Crop'}</div>
              <span class="tag tag-${l.status==='active'?'green':'gray'}">${l.status||'active'}</span>
            </div>
            <div class="text-sm text-muted mt-sm">${Number(l.quantity_kg||0).toLocaleString()} kg · ₹${Number(l.price_per_kg||0).toFixed(0)}/kg · ${l.location_label||''}</div>
            <div class="text-sm text-muted">${l.inquiry_count||0} inquiries received</div>
          </div>
        `).join('')}
    </div>`;
  }

  function renderMyInquiries() {
    return `<div class="section" style="padding-top:8px">
      <div class="section-title">📩 Buyer Inquiries (${myInquiries.length})</div>
      ${myInquiries.length === 0 ? `<div class="empty-state"><div class="es-icon">📩</div><div class="es-title">No inquiries yet</div><div class="es-text">Buyers will reach out when you post listings</div></div>` :
        myInquiries.map(i => `
          <div class="card" style="padding:12px;margin-bottom:8px">
            <div class="flex-between">
              <div class="fw-700">${i.buyer_name||i.company_name||'Buyer'}</div>
              <span class="tag tag-${i.status==='pending'?'orange':i.status==='accepted'?'green':'gray'}">${i.status}</span>
            </div>
            <div class="text-sm text-muted mt-sm">Wants ${Number(i.quantity_needed||0).toLocaleString()}kg ${i.crop_name||'of crop'} · ${i.timeline||''}</div>
            ${i.message ? `<div class="text-sm mt-sm" style="padding:6px;background:var(--bg);border-radius:6px">"${i.message}"</div>` : ''}
            ${i.status === 'pending' ? `<div style="display:flex;gap:6px;margin-top:8px">
              <button class="btn btn-primary btn-small inq-respond" data-iid="${i.id}" data-action="accepted" style="flex:1">Accept</button>
              <button class="btn btn-small inq-respond" data-iid="${i.id}" data-action="rejected" style="flex:1;background:#FFEBEE;color:#C62828;border:none">Reject</button>
            </div>` : ''}
          </div>
        `).join('')}
    </div>`;
  }

  function renderCalendar() {
    if (harvestCalendar.length === 0 && declarations.length === 0) {
      return `<div class="section" style="padding-top:8px"><div class="empty-state"><div class="es-icon">📅</div><div class="es-title">No harvests scheduled</div></div></div>`;
    }
    const cal = harvestCalendar.length > 0 ? harvestCalendar : declarations.map(d => ({
      crop_name: d.crop_name, harvest_date: d.expected_harvest_date, area_acres: d.area_acres, expected_yield: d.expected_yield
    }));
    cal.sort((a,b) => new Date(a.harvest_date||a.expected_harvest_date) - new Date(b.harvest_date||b.expected_harvest_date));
    return `<div class="section" style="padding-top:8px">
      <div class="section-title">📅 Harvest Calendar</div>
      ${cal.map(c => {
        const date = c.harvest_date || c.expected_harvest_date;
        const days = Math.ceil((new Date(date) - new Date()) / 86400000);
        return `<div class="card" style="padding:12px;margin-bottom:8px;display:flex;gap:10px;align-items:center">
          <div style="width:50px;text-align:center;padding:6px;background:var(--primary);color:white;border-radius:8px">
            <div style="font-size:10px">${new Date(date).toLocaleDateString('en-IN',{month:'short'}).toUpperCase()}</div>
            <div style="font-size:18px;font-weight:700">${new Date(date).getDate()}</div>
          </div>
          <div style="flex:1">
            <div class="fw-700">${c.crop_name}</div>
            <div class="text-sm text-muted">${c.area_acres||0} acres · Est. ${c.expected_yield||'?'}t</div>
          </div>
          <span class="tag tag-${days<=7?'orange':days<=30?'blue':'gray'}">${days >= 0 ? days+'d' : 'Past'}</span>
        </div>`;
      }).join('')}
    </div>`;
  }

  // ═══ FPO VIEWS ═══
  function renderFPODashboard() {
    const s = fpoStats;
    return `<div class="section" style="padding-top:8px">
      <div class="card" style="padding:14px;margin-bottom:12px;background:linear-gradient(135deg,#2196F3 0%,#9C27B0 100%);color:white">
        <div class="fw-700">${fpoProfile?.fpo_name || 'Set Up Your FPO'}</div>
        <div class="text-sm" style="opacity:0.9">${fpoProfile?.district_name||''} ${fpoProfile?.state||''} · ${fpoProfile?.subscription_plan||'starter'} plan</div>
      </div>
      <div class="stats-grid mb-lg">
        <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-value">${fpoMembers.length}</div><div class="stat-label">Members</div></div>
        <div class="stat-card"><div class="stat-icon">📥</div><div class="stat-value">${procurement.length}</div><div class="stat-label">Procurements</div></div>
        <div class="stat-card"><div class="stat-icon">📦</div><div class="stat-value">${inventory.length}</div><div class="stat-label">Stock Items</div></div>
        <div class="stat-card"><div class="stat-icon">🛒</div><div class="stat-value">${fpoListings.length}</div><div class="stat-label">Listings</div></div>
      </div>
      <div class="card" style="padding:14px;margin-bottom:8px">
        <div class="fw-700" style="margin-bottom:8px">📊 Operations Snapshot</div>
        ${[
          { label: 'Total Procured Volume', val: `${(procurement.reduce((s,p)=>s+Number(p.quantity_kg||0),0)/1000).toFixed(1)}T` },
          { label: 'Total Procurement Value', val: `₹${procurement.reduce((s,p)=>s+Number(p.gross_amount||0),0).toLocaleString()}` },
          { label: 'Pending Payments', val: procurement.filter(p=>p.payment_status==='pending').length },
          { label: 'Active Inventory', val: `${(inventory.reduce((s,i)=>s+Number(i.quantity_kg||0),0)/1000).toFixed(1)}T` },
        ].map(r => `<div class="flex-between" style="padding:6px 0;border-bottom:1px solid var(--border)"><span class="text-sm">${r.label}</span><span class="fw-700">${r.val}</span></div>`).join('')}
      </div>
    </div>`;
  }

  function renderFPOMembers() {
    return `<div class="section" style="padding-top:8px">
      <button class="btn btn-primary btn-small mb" id="addMemberBtn" style="width:100%">+ Add Member Farmer</button>
      ${fpoMembers.length === 0 ? `<div class="empty-state"><div class="es-icon">👥</div><div class="es-title">No members yet</div><div class="es-text">Add member farmers to your FPO</div></div>` :
        fpoMembers.map(m => `
          <div class="card" style="padding:12px;margin-bottom:8px;display:flex;gap:10px;align-items:center">
            <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#4CAF50,#2196F3);display:flex;align-items:center;justify-content:center;color:white;font-weight:700">${(m.name||'?')[0].toUpperCase()}</div>
            <div style="flex:1">
              <div class="fw-700">${m.name}</div>
              <div class="text-sm text-muted">${m.village||''} ${m.district_name?'· '+m.district_name:''}</div>
              <div class="text-sm text-muted">${m.total_land_acres||0} acres · ${(m.primary_crops||[]).slice(0,3).join(', ')||'no crops'}</div>
            </div>
            <span class="tag tag-${m.status==='active'?'green':'gray'}">${m.status}</span>
          </div>
        `).join('')}
    </div>`;
  }

  function renderProcurement() {
    return `<div class="section" style="padding-top:8px">
      <button class="btn btn-primary btn-small mb" id="addProcBtn" style="width:100%">+ Record Procurement</button>
      ${procurement.length === 0 ? `<div class="empty-state"><div class="es-icon">📥</div><div class="es-title">No procurements recorded</div></div>` :
        procurement.map(p => `
          <div class="card" style="padding:12px;margin-bottom:8px">
            <div class="flex-between">
              <div class="fw-700">${p.crop_name||'Crop'} · ${Number(p.quantity_kg||0).toLocaleString()}kg</div>
              <span class="tag tag-${p.payment_status==='paid'?'green':p.payment_status==='pending'?'orange':'blue'}">${p.payment_status}</span>
            </div>
            <div class="text-sm text-muted mt-sm">From: ${p.farmer_name||'Farmer'} · Grade ${p.quality_grade||'A'}</div>
            <div class="text-sm text-muted">@ ₹${Number(p.price_per_kg||0).toFixed(2)}/kg = ₹${Number(p.gross_amount||0).toLocaleString()}</div>
            <div class="text-sm text-muted">${new Date(p.procurement_date||p.created_at).toLocaleDateString('en-IN')}</div>
          </div>
        `).join('')}
    </div>`;
  }

  function renderInventory() {
    return `<div class="section" style="padding-top:8px">
      <button class="btn btn-primary btn-small mb" id="addInvBtn" style="width:100%">+ Add to Inventory</button>
      ${inventory.length === 0 ? `<div class="empty-state"><div class="es-icon">📦</div><div class="es-title">Inventory empty</div></div>` :
        inventory.map(inv => `
          <div class="card" style="padding:12px;margin-bottom:8px">
            <div class="flex-between">
              <div class="fw-700">${inv.crop_name||'Crop'}</div>
              <span class="tag tag-${inv.freshness_status==='fresh'?'green':'orange'}">${inv.freshness_status||'fresh'}</span>
            </div>
            <div class="text-sm text-muted mt-sm">${Number(inv.quantity_kg||0).toLocaleString()} kg · Grade ${inv.quality_grade||'A'}</div>
            <div class="text-sm text-muted">📍 ${inv.storage_location||'Warehouse'} (${inv.storage_type||'general'})</div>
            <div class="text-sm text-muted">Stored: ${new Date(inv.entry_date||inv.created_at).toLocaleDateString('en-IN')}</div>
          </div>
        `).join('')}
    </div>`;
  }

  function renderFPOListings() {
    return `<div class="section" style="padding-top:8px">
      <button class="btn btn-primary btn-small mb" id="addFpoListBtn" style="width:100%">+ Publish Supply Listing</button>
      <div class="text-sm text-muted" style="margin:0 16px 12px;font-size:12px">Publish aggregated supply for buyers to discover.</div>
      ${fpoListings.length === 0 ? `<div class="empty-state"><div class="es-icon">🛒</div><div class="es-title">No supply listings</div></div>` :
        fpoListings.map(l => `
          <div class="card" style="padding:12px;margin-bottom:8px">
            <div class="flex-between">
              <div class="fw-700">${l.crop_name||'Crop'}</div>
              <span class="tag tag-${l.status==='active'?'green':'gray'}">${l.status}</span>
            </div>
            <div class="text-sm text-muted mt-sm">${Number(l.quantity_kg||0).toLocaleString()} kg · Grade ${l.grade||'A'} ${l.is_organic?'· 🌱 Organic':''}</div>
            <div class="text-sm text-muted">@ ₹${Number(l.price_per_kg||0).toFixed(2)}/kg · Min: ${l.min_order_kg||100}kg</div>
            <div class="text-sm text-muted">📍 ${l.collection_center||l.location_label||''}</div>
          </div>
        `).join('')}
    </div>`;
  }

  // ═══ BUYER VIEWS ═══
  function renderBuyerSearch() {
    return `<div class="section" style="padding-top:8px">
      <div class="card" style="padding:12px;margin-bottom:12px">
        <div class="fw-700" style="margin-bottom:8px">🔎 Search Crop Supply Across India</div>
        <div class="form-group" style="margin-bottom:8px"><input class="form-input" id="bsCrop" placeholder="Crop (tomato, onion, rice…)" value="${searchFilters.crop||''}"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <input class="form-input" id="bsState" placeholder="State" value="${searchFilters.state||''}">
          <input class="form-input" id="bsDist" placeholder="District" value="${searchFilters.district||''}">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <input class="form-input" type="number" id="bsDays" placeholder="Harvest within (days)" value="${searchFilters.harvest_within_days||30}">
          <input class="form-input" type="number" id="bsMinQty" placeholder="Min qty (kg)" value="${searchFilters.min_quantity||''}">
        </div>
        <button class="btn btn-primary" id="bsSearch" style="width:100%">🔎 Search Supply</button>
      </div>
      <div class="text-sm text-muted" style="margin:0 16px 8px">${supplyResults.length} results</div>
      ${supplyResults.length === 0 ? `<div class="empty-state"><div class="es-icon">🔎</div><div class="es-title">No matching supply</div><div class="es-text">Adjust filters and search again</div></div>` :
        supplyResults.map(r => `
          <div class="card" style="padding:12px;margin-bottom:8px">
            <div class="flex-between">
              <div class="fw-700">${r.crop_name||'Crop'} · ${Number(r.quantity_kg||r.quantity_available||0).toLocaleString()}kg</div>
              <span class="tag tag-${r.source_type==='fpo'?'blue':'green'}">${r.source_type||'farmer'}</span>
            </div>
            <div class="text-sm text-muted mt-sm">${r.fpo_name||r.farmer_name||r.location_label||''} · ${r.district_name||r.state||''}</div>
            <div class="text-sm text-muted">${r.harvest_from_date?'Harvest: '+new Date(r.harvest_from_date).toLocaleDateString('en-IN'):''} ${r.is_organic?'· 🌱 Organic':''}</div>
            <div class="flex-between mt-sm">
              <span class="fw-700" style="color:var(--primary)">₹${Number(r.price_per_kg||0).toFixed(2)}/kg</span>
              <button class="btn btn-primary btn-small inquire-btn" data-listing="${r.id}" data-seller="${r.seller_id||r.fpo_user_id||r.farmer_id}" data-crop="${r.crop_id||''}">Send Inquiry</button>
            </div>
          </div>
        `).join('')}
    </div>`;
  }

  function renderBuyerIntelligence() {
    return `<div class="section" style="padding-top:8px">
      <div class="stats-grid mb-lg">
        <div class="stat-card"><div class="stat-icon">📩</div><div class="stat-value">${buyerStats.total_inquiries||buyerInquiries.length}</div><div class="stat-label">Inquiries Sent</div></div>
        <div class="stat-card"><div class="stat-icon">⭐</div><div class="stat-value">${watchlist.length}</div><div class="stat-label">Watchlist</div></div>
        <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-value">${buyerStats.accepted||buyerInquiries.filter(i=>i.status==='accepted').length}</div><div class="stat-label">Accepted</div></div>
      </div>
      <div class="card" style="padding:14px;margin-bottom:12px">
        <div class="fw-700" style="margin-bottom:10px">📊 Supply Forecast (next 30 days)</div>
        ${supplyDemand.length === 0 ? '<div class="text-sm text-muted">Loading…</div>' :
          supplyDemand.slice(0,8).map(s => {
            const signal = s.signal || 'Balanced';
            const color = signal==='Surplus'?'#2E7D32':signal==='Deficit'?'#C62828':'#E65100';
            return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)">
              <span style="font-size:18px">${s.icon_emoji||'🌾'}</span>
              <div style="flex:1">
                <div class="fw-600 text-sm">${s.crop||s.name}</div>
                <div style="font-size:10px;color:${color}">${signal} · ${Math.abs(Number(s.gap_tonnes||0))}t gap</div>
              </div>
              <div class="fw-700 text-sm">${Number(s.expected_supply_tonnes||s.supply_tonnes||0).toLocaleString()}t</div>
            </div>`;
          }).join('')}
      </div>
      <div class="card" style="padding:14px;background:var(--accent-light);border:1px solid var(--accent)">
        <div class="fw-600 text-sm">🧠 Premium Intelligence</div>
        <div class="text-sm text-muted mt-sm">Upgrade to Buyer Pro (₹50,000/yr) for: nationwide heatmaps, demand signals, price predictions, direct farmer contact, supply alerts.</div>
      </div>
    </div>`;
  }

  function renderWatchlist() {
    return `<div class="section" style="padding-top:8px">
      <div class="text-sm text-muted" style="margin:0 16px 12px">Track listings and get notified of changes</div>
      ${watchlist.length === 0 ? `<div class="empty-state"><div class="es-icon">⭐</div><div class="es-title">Watchlist empty</div><div class="es-text">Star listings while browsing</div></div>` :
        watchlist.map(w => `
          <div class="card" style="padding:12px;margin-bottom:8px">
            <div class="flex-between">
              <div class="fw-700">${w.crop_name||'Crop'}</div>
              <button class="btn btn-small wl-remove" data-wid="${w.id}" style="background:#FFEBEE;color:#C62828;border:none">Remove</button>
            </div>
            <div class="text-sm text-muted mt-sm">${Number(w.quantity_kg||0).toLocaleString()}kg @ ₹${Number(w.price_per_kg||0).toFixed(0)}/kg</div>
          </div>
        `).join('')}
    </div>`;
  }

  function renderBuyerInquiries() {
    return `<div class="section" style="padding-top:8px">
      <div class="section-title">📩 My Inquiries (${buyerInquiries.length})</div>
      ${buyerInquiries.length === 0 ? `<div class="empty-state"><div class="es-icon">📩</div><div class="es-title">No inquiries sent</div></div>` :
        buyerInquiries.map(i => `
          <div class="card" style="padding:12px;margin-bottom:8px">
            <div class="flex-between">
              <div class="fw-700">${i.crop_name||'Crop'} · ${Number(i.quantity_needed||0).toLocaleString()}kg</div>
              <span class="tag tag-${i.status==='pending'?'orange':i.status==='accepted'?'green':'gray'}">${i.status}</span>
            </div>
            <div class="text-sm text-muted mt-sm">To: ${i.seller_name||'Seller'} · ${i.timeline||''}</div>
            ${i.response_message ? `<div class="text-sm mt-sm" style="padding:6px;background:var(--bg);border-radius:6px">Response: "${i.response_message}"</div>` : ''}
          </div>
        `).join('')}
    </div>`;
  }

  // ═══ SHARED ANALYTICS ═══
  function renderPrices() {
    return `<div class="section" style="padding-top:8px">
      <div class="section-title">💰 Live Mandi Prices</div>
      ${prices.length === 0 ? '<div class="text-sm text-muted">Loading…</div>' :
        prices.slice(0,30).map(p => {
          const pct = Number(p.change_pct||0);
          const up = pct >= 0;
          return `<div class="card" style="padding:10px 12px;margin-bottom:6px;display:flex;align-items:center;gap:10px">
            <span style="font-size:20px">${p.icon_emoji||'🌾'}</span>
            <div style="flex:1">
              <div class="fw-600">${p.crop||p.crop_name||''}</div>
              <div class="text-sm text-muted">${p.market_name||p.market_district||''}</div>
            </div>
            <div style="text-align:right">
              <div class="fw-700">₹${Number(p.live_price||p.price_per_quintal||0).toLocaleString()}/q</div>
              <div style="font-size:12px;color:${up?'#4CAF50':'#F44336'};font-weight:600">${up?'▲':'▼'} ${Math.abs(pct)}%</div>
            </div>
          </div>`;
        }).join('')}
    </div>`;
  }

  function renderSupply() {
    return `<div class="section" style="padding-top:8px">
      <div class="section-title">⚖️ Supply-Demand Signals</div>
      ${supplyDemand.length === 0 ? '<div class="text-sm text-muted">Loading…</div>' :
        supplyDemand.map(s => {
          const signal = s.signal||'Balanced';
          const bg = signal==='Surplus'?'#E8F5E9':signal==='Deficit'?'#FFEBEE':'#FFF3E0';
          const fg = signal==='Surplus'?'#2E7D32':signal==='Deficit'?'#C62828':'#E65100';
          return `<div class="card" style="padding:12px;margin-bottom:8px;background:${bg}">
            <div class="flex-between">
              <div class="fw-700">${s.icon_emoji||'🌾'} ${s.crop||s.name}</div>
              <span class="tag" style="background:${fg};color:white">${signal}</span>
            </div>
            <div class="text-sm" style="color:${fg};margin-top:4px">Gap: ${Number(s.gap_tonnes||0)}t · Supply: ${Number(s.supply_tonnes||s.expected_supply_tonnes||0)}t</div>
          </div>`;
        }).join('')}
    </div>`;
  }

  function renderDistricts() {
    return `<div class="section" style="padding-top:8px">
      <div class="section-title">🗺️ District Heatmap</div>
      ${districts.length === 0 ? '<div class="text-sm text-muted">Loading…</div>' :
        districts.slice(0,20).map(d => `
          <div class="card" style="padding:12px;margin-bottom:6px">
            <div class="flex-between">
              <div class="fw-700">📍 ${d.district_name||d.name}</div>
              <span class="tag tag-blue">${d.farmer_count||0} farmers</span>
            </div>
            <div class="text-sm text-muted mt-sm">${d.state||''} · ${(d.crops||[]).slice(0,3).join(', ')||''}</div>
            <div class="text-sm text-muted">Active declarations: ${d.declaration_count||0} · Listings: ${d.listing_count||0}</div>
          </div>
        `).join('')}
    </div>`;
  }

  function renderForecast() {
    return `<div class="section" style="padding-top:8px">
      <div class="section-title">📈 30-Day Supply Forecast</div>
      <div class="card" style="padding:14px;margin-bottom:12px">
        <div class="fw-700" style="margin-bottom:10px">National Outlook</div>
        ${supplyDemand.slice(0,10).map(s => {
          const v = Number(s.expected_supply_tonnes||s.supply_tonnes||0);
          const max = Math.max(...supplyDemand.map(x=>Number(x.expected_supply_tonnes||x.supply_tonnes||1)));
          const pct = (v/max)*100;
          return `<div style="margin-bottom:8px">
            <div class="flex-between"><span class="text-sm">${s.icon_emoji||'🌾'} ${s.crop||s.name}</span><span class="fw-700 text-sm">${v.toLocaleString()}t</span></div>
            <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden;margin-top:4px"><div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#4CAF50,#2196F3);border-radius:3px"></div></div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }

  function renderPlans() {
    const plans = isFPO ? [
      { name: 'Starter', price: 'Free', features: ['Up to 50 members', 'Basic procurement', 'Community access'], color:'#9E9E9E' },
      { name: 'Pro', price: '₹2,999/mo', features: ['Up to 500 members', 'Full procurement & inventory', 'Supply listings', 'Payment tracking'], color:'#4CAF50', popular:true },
      { name: 'Business', price: '₹4,999/mo', features: ['Unlimited members', 'Multi-warehouse', 'API access', 'Priority support'], color:'#2196F3' },
    ] : isBuyer ? [
      { name: 'Explorer', price: 'Free', features: ['Browse listings', 'Limited search', 'Basic stats'], color:'#9E9E9E' },
      { name: 'Pro', price: '₹15,000/yr', features: ['Full supply search', 'Watchlist alerts', 'District insights', 'Direct inquiries'], color:'#4CAF50', popular:true },
      { name: 'Enterprise', price: '₹50,000/yr', features: ['Everything in Pro', 'Heatmaps & forecasting', 'Direct farmer contact', 'API access', 'Dedicated manager'], color:'#9C27B0' },
    ] : [
      { name: 'Free Farmer', price: '₹0', features: ['Crop declarations', 'Listings', 'Buyer inquiries', 'Community', 'Mandi prices'], color:'#4CAF50', popular:true },
      { name: 'Premium', price: '₹100/yr', features: ['Everything free', 'Advanced advisory', 'Insurance access', 'Priority listings'], color:'#FF9800' },
    ];
    return `<div class="section" style="padding-top:8px">
      <div class="section-title">💎 Plans</div>
      ${plans.map(p => `
        <div class="card" style="padding:16px;margin-bottom:12px">
          ${p.popular?'<div style="background:var(--primary);color:white;text-align:center;padding:4px;font-size:11px;font-weight:700;margin:-16px -16px 12px;border-radius:12px 12px 0 0">⭐ MOST POPULAR</div>':''}
          <div class="fw-700" style="font-size:16px">${p.name}</div>
          <div class="fw-700" style="color:${p.color};font-size:14px">${p.price}</div>
          <div style="display:grid;gap:4px;margin-top:8px">
            ${p.features.map(f=>`<div class="text-sm" style="display:flex;gap:6px"><span style="color:${p.color}">✅</span>${f}</div>`).join('')}
          </div>
        </div>
      `).join('')}
    </div>`;
  }

  // ═══ EVENT HANDLERS ═══
  function attachEvents() {
    container.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; if (tab==='buyer-search' && supplyResults.length===0) doSupplySearch(); else render(); }));
    container.querySelector('#addDeclBtn')?.addEventListener('click', showAddDeclaration);
    container.querySelector('#addListingBtn')?.addEventListener('click', showAddListing);
    container.querySelector('#addMemberBtn')?.addEventListener('click', showAddMember);
    container.querySelector('#addProcBtn')?.addEventListener('click', showAddProcurement);
    container.querySelector('#addInvBtn')?.addEventListener('click', showAddInventory);
    container.querySelector('#addFpoListBtn')?.addEventListener('click', showAddSupplyListing);
    container.querySelector('#bsSearch')?.addEventListener('click', () => {
      searchFilters = {
        crop: document.querySelector('#bsCrop')?.value,
        state: document.querySelector('#bsState')?.value,
        district: document.querySelector('#bsDist')?.value,
        harvest_within_days: Number(document.querySelector('#bsDays')?.value) || 30,
        min_quantity: Number(document.querySelector('#bsMinQty')?.value) || 0,
      };
      doSupplySearch();
    });
    container.querySelectorAll('.decl-edit').forEach(b => b.addEventListener('click', () => {
      const d = declarations.find(x=>x.id===b.dataset.did);
      if (d) showAddDeclaration(d);
    }));
    container.querySelectorAll('.decl-del').forEach(b => b.addEventListener('click', async () => {
      if (!confirm('Delete this declaration?')) return;
      try { await api.deleteDeclaration(b.dataset.did); showToast('Deleted','success'); loadData(); } catch(e){ showToast(e.message,'error'); }
    }));
    container.querySelectorAll('.inq-respond').forEach(b => b.addEventListener('click', async () => {
      try { await api.respondInquiry(b.dataset.iid, { status: b.dataset.action }); showToast('Updated','success'); loadData(); } catch(e){ showToast(e.message,'error'); }
    }));
    container.querySelectorAll('.inquire-btn').forEach(b => b.addEventListener('click', () => showSendInquiry(b.dataset.listing, b.dataset.seller, b.dataset.crop)));
    container.querySelectorAll('.wl-remove').forEach(b => b.addEventListener('click', async () => {
      try { await api.removeWatchlist(b.dataset.wid); showToast('Removed','success'); loadData(); } catch(e){ showToast(e.message,'error'); }
    }));
  }

  // ═══ MODALS ═══
  function showAddDeclaration(existing) {
    const isEdit = !!existing;
    const d = existing || {};
    showModal(`<div class="modal-handle"></div><h3>${isEdit?'Edit':'+ Declare'} Crop</h3>
      <div class="form-group"><label>Crop</label><input class="form-input" id="dCrop" value="${d.crop_name||''}" placeholder="Tomato, Onion, Rice…"></div>
      <div class="form-group"><label>Crop ID (catalog)</label><input class="form-input" type="number" id="dCropId" value="${d.crop_id||''}" placeholder="1"></div>
      <div class="form-group"><label>Area (acres)</label><input class="form-input" type="number" step="0.1" id="dArea" value="${d.area_acres||''}" placeholder="2.5"></div>
      <div class="form-group"><label>Expected Yield (tons)</label><input class="form-input" type="number" step="0.1" id="dYield" value="${d.expected_yield||''}" placeholder="5"></div>
      <div class="form-group"><label>Sow Date</label><input class="form-input" type="date" id="dSow" value="${d.sow_date?d.sow_date.split('T')[0]:''}"></div>
      <div class="form-group"><label>Expected Harvest</label><input class="form-input" type="date" id="dHarvest" value="${d.expected_harvest_date?d.expected_harvest_date.split('T')[0]:''}"></div>
      <div class="form-group"><label><input type="checkbox" id="dOrganic" ${d.is_organic?'checked':''}> Organic certified</label></div>
      <button class="btn btn-primary" id="submitDecl" style="width:100%">${isEdit?'Update':'Declare'}</button>`);
    document.querySelector('#submitDecl')?.addEventListener('click', async () => {
      const data = {
        crop_id: Number(document.querySelector('#dCropId')?.value)||1,
        area_acres: Number(document.querySelector('#dArea')?.value),
        expected_yield: Number(document.querySelector('#dYield')?.value)||undefined,
        sow_date: document.querySelector('#dSow')?.value,
        expected_harvest_date: document.querySelector('#dHarvest')?.value,
        is_organic: document.querySelector('#dOrganic')?.checked,
      };
      if (!data.area_acres || !data.sow_date || !data.expected_harvest_date) { showToast('Required fields missing','error'); return; }
      try {
        if (isEdit) await api.updateDeclaration(d.id, data);
        else await api.createDeclaration(data);
        showToast('Saved','success'); closeModal(); loadData();
      } catch(e){ showToast(e.message,'error'); }
    });
  }

  function showAddListing() {
    showModal(`<div class="modal-handle"></div><h3>+ Post Harvest</h3>
      <div class="form-group"><label>Crop ID</label><input class="form-input" type="number" id="lCropId" placeholder="1"></div>
      <div class="form-group"><label>Quantity (kg)</label><input class="form-input" type="number" id="lQty" placeholder="2000"></div>
      <div class="form-group"><label>Price (₹/kg)</label><input class="form-input" type="number" id="lPrice" placeholder="25"></div>
      <div class="form-group"><label>Harvest Date</label><input class="form-input" type="date" id="lDate"></div>
      <div class="form-group"><label>Location</label><input class="form-input" id="lLoc" placeholder="Village, District"></div>
      <button class="btn btn-primary" id="submitList" style="width:100%">Post Listing</button>`);
    document.querySelector('#submitList')?.addEventListener('click', async () => {
      try {
        await api.createSupplyListing({
          crop_id: Number(document.querySelector('#lCropId')?.value)||1,
          quantity_kg: Number(document.querySelector('#lQty')?.value),
          price_per_kg: Number(document.querySelector('#lPrice')?.value),
          harvest_from_date: document.querySelector('#lDate')?.value,
          location_label: document.querySelector('#lLoc')?.value,
        });
        showToast('Listed','success'); closeModal(); loadData();
      } catch(e){ showToast(e.message,'error'); }
    });
  }

  function showAddMember() {
    showModal(`<div class="modal-handle"></div><h3>+ Add Member Farmer</h3>
      <div class="form-group"><label>Farmer User ID or Phone</label><input class="form-input" id="mFarmer" placeholder="UUID or phone"></div>
      <button class="btn btn-primary" id="submitMember" style="width:100%">Add Member</button>`);
    document.querySelector('#submitMember')?.addEventListener('click', async () => {
      try {
        await api.addFPOMember({ farmer_id: document.querySelector('#mFarmer')?.value });
        showToast('Member added','success'); closeModal(); loadData();
      } catch(e){ showToast(e.message,'error'); }
    });
  }

  function showAddProcurement() {
    showModal(`<div class="modal-handle"></div><h3>+ Record Procurement</h3>
      <div class="form-group"><label>Farmer ID</label><input class="form-input" id="pFarmer"></div>
      <div class="form-group"><label>Crop ID</label><input class="form-input" type="number" id="pCrop" placeholder="1"></div>
      <div class="form-group"><label>Quantity (kg)</label><input class="form-input" type="number" id="pQty"></div>
      <div class="form-group"><label>Quality Grade</label><select class="form-input" id="pGrade"><option>A</option><option>B</option><option>C</option><option>ungraded</option></select></div>
      <div class="form-group"><label>Price (₹/kg)</label><input class="form-input" type="number" step="0.01" id="pPrice"></div>
      <button class="btn btn-primary" id="submitProc" style="width:100%">Record</button>`);
    document.querySelector('#submitProc')?.addEventListener('click', async () => {
      try {
        await api.recordProcurement({
          farmer_id: document.querySelector('#pFarmer')?.value,
          crop_id: Number(document.querySelector('#pCrop')?.value),
          quantity_kg: Number(document.querySelector('#pQty')?.value),
          quality_grade: document.querySelector('#pGrade')?.value,
          price_per_kg: Number(document.querySelector('#pPrice')?.value),
        });
        showToast('Recorded','success'); closeModal(); loadData();
      } catch(e){ showToast(e.message,'error'); }
    });
  }

  function showAddInventory() {
    showModal(`<div class="modal-handle"></div><h3>+ Add to Inventory</h3>
      <div class="form-group"><label>Crop ID</label><input class="form-input" type="number" id="iCrop" placeholder="1"></div>
      <div class="form-group"><label>Quantity (kg)</label><input class="form-input" type="number" id="iQty"></div>
      <div class="form-group"><label>Storage Location</label><input class="form-input" id="iLoc" placeholder="Warehouse #1"></div>
      <div class="form-group"><label>Storage Type</label><select class="form-input" id="iType"><option>warehouse</option><option>cold_storage</option><option>aggregation_center</option></select></div>
      <div class="form-group"><label>Quality Grade</label><select class="form-input" id="iGrade"><option>A</option><option>B</option><option>C</option></select></div>
      <button class="btn btn-primary" id="submitInv" style="width:100%">Add Stock</button>`);
    document.querySelector('#submitInv')?.addEventListener('click', async () => {
      try {
        await api.addInventory({
          crop_id: Number(document.querySelector('#iCrop')?.value),
          quantity_kg: Number(document.querySelector('#iQty')?.value),
          storage_location: document.querySelector('#iLoc')?.value,
          storage_type: document.querySelector('#iType')?.value,
          quality_grade: document.querySelector('#iGrade')?.value,
        });
        showToast('Added','success'); closeModal(); loadData();
      } catch(e){ showToast(e.message,'error'); }
    });
  }

  function showAddSupplyListing() {
    showModal(`<div class="modal-handle"></div><h3>+ Publish Supply Listing</h3>
      <div class="form-group"><label>Crop ID</label><input class="form-input" type="number" id="sCrop" placeholder="1"></div>
      <div class="form-group"><label>Quantity (kg)</label><input class="form-input" type="number" id="sQty"></div>
      <div class="form-group"><label>Quality</label><select class="form-input" id="sGrade"><option>A</option><option>B</option><option>C</option></select></div>
      <div class="form-group"><label>Price (₹/kg)</label><input class="form-input" type="number" step="0.01" id="sPrice"></div>
      <div class="form-group"><label>Min Order (kg)</label><input class="form-input" type="number" id="sMin" placeholder="100"></div>
      <div class="form-group"><label>Collection Center</label><input class="form-input" id="sLoc"></div>
      <div class="form-group"><label><input type="checkbox" id="sOrg"> Organic</label></div>
      <button class="btn btn-primary" id="submitFpoList" style="width:100%">Publish</button>`);
    document.querySelector('#submitFpoList')?.addEventListener('click', async () => {
      try {
        await api.createSupplyListing({
          crop_id: Number(document.querySelector('#sCrop')?.value),
          quantity_kg: Number(document.querySelector('#sQty')?.value),
          grade: document.querySelector('#sGrade')?.value,
          price_per_kg: Number(document.querySelector('#sPrice')?.value),
          min_order_kg: Number(document.querySelector('#sMin')?.value)||100,
          collection_center: document.querySelector('#sLoc')?.value,
          is_organic: document.querySelector('#sOrg')?.checked,
        });
        showToast('Published','success'); closeModal(); loadData();
      } catch(e){ showToast(e.message,'error'); }
    });
  }

  function showSendInquiry(listingId, sellerId, cropId) {
    showModal(`<div class="modal-handle"></div><h3>📩 Send Inquiry</h3>
      <div class="form-group"><label>Quantity Needed (kg)</label><input class="form-input" type="number" id="iqQty" placeholder="500"></div>
      <div class="form-group"><label>Timeline</label><input class="form-input" id="iqTime" placeholder="Need within 7 days"></div>
      <div class="form-group"><label>Message</label><textarea class="form-input" id="iqMsg" rows="3" placeholder="We're interested in regular supply…"></textarea></div>
      <button class="btn btn-primary" id="submitIq" style="width:100%">Send Inquiry</button>`);
    document.querySelector('#submitIq')?.addEventListener('click', async () => {
      try {
        await api.createBuyerInquiry({
          listing_id: listingId || undefined,
          seller_id: sellerId,
          crop_id: Number(cropId)||undefined,
          quantity_needed: Number(document.querySelector('#iqQty')?.value),
          timeline: document.querySelector('#iqTime')?.value,
          message: document.querySelector('#iqMsg')?.value,
        });
        showToast('Inquiry sent','success'); closeModal(); loadData();
      } catch(e){ showToast(e.message,'error'); }
    });
  }

  // ═══ DATA ═══
  async function doSupplySearch() {
    loading = true; render();
    try {
      const params = new URLSearchParams();
      Object.entries(searchFilters).forEach(([k,v]) => { if (v) params.append(k, v); });
      const res = await api.supplySearch('?' + params.toString());
      supplyResults = res.results || res.listings || [];
    } catch(e) { console.error(e); }
    loading = false; render();
  }

  async function loadData() {
    loading = true; render();
    try {
      const sharedTasks = [
        api.getPrices('?limit=30').catch(() => []),
        api.getSupplyDemand().catch(() => []),
        api.getDistrictHeatmap().catch(() => []),
        api.getPlatformStats().catch(() => ({})),
      ];

      if (isFPO) {
        const [pr, sd, dt, ps, fp, fm, prc, inv, fl, fs] = await Promise.all([
          ...sharedTasks,
          api.getFPOProfile().catch(() => ({ profile: null })),
          api.getFPOMembers().catch(() => ({ members: [] })),
          api.getFPOProcurement().catch(() => ({ procurement: [] })),
          api.getFPOInventory().catch(() => ({ inventory: [] })),
          api.getFPOSupplyListings().catch(() => ({ listings: [] })),
          api.getFPOStats().catch(() => ({})),
        ]);
        prices = pr.prices || pr || []; supplyDemand = sd.data || sd.crops || sd || []; districts = dt.heatmap || dt || []; platformStats = ps.stats || ps || {};
        fpoProfile = fp.profile || fp || null;
        fpoMembers = fm.members || fm || [];
        procurement = prc.procurement || prc || [];
        inventory = inv.inventory || inv || [];
        fpoListings = fl.listings || fl || [];
        fpoStats = fs.stats || fs || {};
      } else if (isBuyer) {
        const [pr, sd, dt, ps, bp, bi, wl, bs] = await Promise.all([
          ...sharedTasks,
          api.getBuyerProfile().catch(() => ({ profile: null })),
          api.getBuyerInquiries().catch(() => ({ inquiries: [] })),
          api.getWatchlist().catch(() => ({ watchlist: [] })),
          api.getBuyerStats().catch(() => ({})),
        ]);
        prices = pr.prices || pr || []; supplyDemand = sd.data || sd.crops || sd || []; districts = dt.heatmap || dt || []; platformStats = ps.stats || ps || {};
        buyerProfile = bp.profile || bp || null;
        buyerInquiries = bi.inquiries || bi || [];
        watchlist = wl.watchlist || wl || [];
        buyerStats = bs.stats || bs || {};
        if (supplyResults.length === 0) doSupplySearch();
      } else {
        const [pr, sd, dt, ps, fp, decl, mi, ml, hc] = await Promise.all([
          ...sharedTasks,
          api.getFarmerProfile().catch(() => ({ profile: null })),
          api.getDeclarations().catch(() => ({ declarations: [] })),
          api.getMyInquiries().catch(() => ({ inquiries: [] })),
          api.getMyListings().catch(() => ({ listings: [] })),
          api.getHarvestCalendar().catch(() => ({ calendar: [] })),
        ]);
        prices = pr.prices || pr || []; supplyDemand = sd.data || sd.crops || sd || []; districts = dt.heatmap || dt || []; platformStats = ps.stats || ps || {};
        farmerProfile = fp.profile || fp || null;
        declarations = decl.declarations || decl || [];
        myInquiries = mi.inquiries || mi || [];
        myListings = ml.listings || ml || [];
        harvestCalendar = hc.calendar || hc || [];
      }
    } catch(e) { console.error('Intelligence load:', e); }
    loading = false; render();
  }

  loadData();
}
