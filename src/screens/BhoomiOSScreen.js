import { navigate, showToast, showModal, closeModal } from '../app-shell.js';
import { api } from '../api.js';
import { getRole } from '../store.js';
import { t } from '../i18n.js';

/**
 * BhoomiOS — Agricultural Land Marketplace
 * Buy · Sell · Rent/Lease farmland
 *
 * Three modes:
 *   Buy  — Search & purchase agricultural land
 *   Sell — List your land for sale
 *   Rent — Find or list land for lease
 */

export function renderBhoomiOS(container) {
  let mode = 'buy'; // buy | sell | rent
  let tab = 'listings';
  let loading = false;
  let listings = [];
  let myListings = [];
  let enquiries = [];
  let searchQ = '';
  let districtFilter = '';
  let landTypeFilter = '';
  let priceRange = '';
  let areaRange = '';

  const LAND_TYPES = [
    { id: 'agricultural', icon: '🌾', label: 'Agricultural', color: '#2E7D32' },
    { id: 'farmhouse',    icon: '🏡', label: 'Farm House',   color: '#795548' },
    { id: 'plantation',   icon: '🌴', label: 'Plantation',   color: '#33691E' },
    { id: 'orchard',      icon: '🍎', label: 'Orchard',      color: '#E65100' },
    { id: 'dairy_farm',   icon: '🐄', label: 'Dairy Farm',   color: '#1565C0' },
    { id: 'poultry_farm', icon: '🐔', label: 'Poultry Farm', color: '#546E7A' },
    { id: 'pond_land',    icon: '🐟', label: 'Pond / Aqua',  color: '#0277BD' },
    { id: 'commercial',   icon: '🏢', label: 'Commercial',   color: '#6A1B9A' },
  ];

  const WATER_SOURCES = ['Borewell','Canal','River Proximity','Rain-fed','Tank/Pond','Tube Well','None'];
  const SOIL_TYPES = ['Black Cotton','Red Soil','Alluvial','Sandy','Laterite','Clay','Loamy','Mixed'];

  // ── SAMPLE DATA ──────────────────────────────────────────────────────────
  const SAMPLE_LISTINGS = [
    { id:'bl1', title:'5 Acre Paddy Land — Canal Irrigated', listing_type:'sale', land_type:'agricultural', area_acres:5, price:1800000, district:'Krishna', mandal:'Vijayawada Rural', village:'Gollapudi', water_source:'Canal', soil_type:'Black Cotton', road_access:true, fenced:true, status:'active', views:342, description:'Prime paddy land on main canal. 2 crops/year. 30ft road access. All documents clear. Near Vijayawada city.' },
    { id:'bl2', title:'3.5 Acre Mango Orchard — Bearing Trees', listing_type:'sale', land_type:'orchard', area_acres:3.5, price:2800000, district:'Chittoor', mandal:'Madanapalle', village:'Gurramkonda', water_source:'Borewell', soil_type:'Red Soil', road_access:true, fenced:true, status:'active', views:215, description:'180 mango trees (Banganapalli, Totapuri), all bearing. Borewell with 3-inch motor. Fenced compound wall.' },
    { id:'bl3', title:'10 Acre Agricultural Land — Rain-fed', listing_type:'sale', land_type:'agricultural', area_acres:10, price:3200000, district:'Anantapur', mandal:'Kadiri', village:'Gandlapenta', water_source:'Rain-fed', soil_type:'Red Soil', road_access:true, fenced:false, status:'active', views:178, description:'Suitable for groundnut, sunflower, cotton. 2 borewells (low yield). Near NH-44. Peaceful location.' },
    { id:'bl4', title:'2 Acre Farm House Plot — Highway Facing', listing_type:'sale', land_type:'farmhouse', area_acres:2, price:4500000, district:'Ranga Reddy', mandal:'Chevella', village:'Mankhal', water_source:'Borewell', soil_type:'Loamy', road_access:true, fenced:true, status:'active', views:520, description:'Premium plot on Hyderabad-Bangalore highway. Ideal for farmhouse/weekend home. DTCP layout. Electricity available.' },
    { id:'bl5', title:'8 Acre Aqua Land with Ponds', listing_type:'rent', land_type:'pond_land', area_acres:8, price:240000, rent_per_year:240000, district:'West Godavari', mandal:'Bhimavaram', village:'Veeravasaram', water_source:'Canal', soil_type:'Clay', road_access:true, fenced:true, status:'active', views:145, description:'3 existing shrimp ponds (1.5 acre each) + open land. Canal water available. Previous harvest: 8 tons/crop.' },
    { id:'bl6', title:'4 Acre Coconut Plantation', listing_type:'rent', land_type:'plantation', area_acres:4, price:180000, rent_per_year:180000, district:'East Godavari', mandal:'Amalapuram', village:'Mummidivaram', water_source:'Canal', soil_type:'Alluvial', road_access:true, fenced:false, status:'active', views:98, description:'120 coconut trees, 15 years old, yielding 150 nuts/tree/year. Canal irrigated. Copra or tender coconut.' },
    { id:'bl7', title:'15 Acre Dry Land for Lease', listing_type:'rent', land_type:'agricultural', area_acres:15, price:90000, rent_per_year:90000, district:'Kurnool', mandal:'Adoni', village:'Halaharvi', water_source:'Rain-fed', soil_type:'Black Cotton', road_access:true, fenced:false, status:'active', views:67, description:'Suitable for cotton, sunflower, jowar. Black cotton soil. Good for mechanized farming. 3-year lease preferred.' },
    { id:'bl8', title:'1.5 Acre Land Near Town', listing_type:'sale', land_type:'commercial', area_acres:1.5, price:7500000, district:'Guntur', mandal:'Tenali', village:'Tsundur', water_source:'Borewell', soil_type:'Alluvial', road_access:true, fenced:true, status:'active', views:890, description:'On 60ft road, 2km from Tenali town. Suitable for cold storage, warehouse, agri-business. Commercial zone.' },
  ];

  function render() {
    const isOwner = mode === 'sell';
    const isRentMode = mode === 'rent';

    container.innerHTML = `
      <!-- HEADER -->
      <div class="hero-v2" role="banner" style="background:linear-gradient(135deg,#795548,#4E342E);color:white">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:28px">🏡</span>
          <div>
            <div style="font-weight:800;font-size:18px">BhoomiOS</div>
            <div style="font-size:11px;opacity:0.85">Agricultural Land Marketplace · Buy · Sell · Rent</div>
          </div>
        </div>
      </div>

      <!-- MODE TOGGLE: 3 options -->
      <div class="mode-toggle-bar" style="display:flex;margin:8px 14px;background:#F5F5F5;border-radius:12px;padding:3px;border:1px solid #E0E0E0">
        <button data-bmode="buy" style="flex:1;padding:8px;border-radius:10px;font-size:12px;font-weight:600;border:none;cursor:pointer;${mode==='buy'?'background:#2E7D32;color:white;box-shadow:0 2px 6px rgba(0,0,0,0.15)':'background:transparent;color:#757575'}">💰 Buy Land</button>
        <button data-bmode="rent" style="flex:1;padding:8px;border-radius:10px;font-size:12px;font-weight:600;border:none;cursor:pointer;${mode==='rent'?'background:#0277BD;color:white;box-shadow:0 2px 6px rgba(0,0,0,0.15)':'background:transparent;color:#757575'}">🔑 Rent / Lease</button>
        <button data-bmode="sell" style="flex:1;padding:8px;border-radius:10px;font-size:12px;font-weight:600;border:none;cursor:pointer;${mode==='sell'?'background:#795548;color:white;box-shadow:0 2px 6px rgba(0,0,0,0.15)':'background:transparent;color:#757575'}">🏷️ Sell / List</button>
      </div>

      <!-- TABS -->
      <div class="tab-bar" role="tablist" style="overflow-x:auto;white-space:nowrap">
        ${isOwner ? `
          <button role="tab" aria-selected="${tab==='listings'}" class="tab-btn ${tab==='listings'?'active':''}" data-tab="listings">🏡 My Listings</button>
          <button role="tab" aria-selected="${tab==='enquiries'}" class="tab-btn ${tab==='enquiries'?'active':''}" data-tab="enquiries">📋 Enquiries</button>
          <button role="tab" aria-selected="${tab==='documents'}" class="tab-btn ${tab==='documents'?'active':''}" data-tab="documents">📄 Documents</button>
          <button role="tab" aria-selected="${tab==='analytics'}" class="tab-btn ${tab==='analytics'?'active':''}" data-tab="analytics">📊 Stats</button>
        ` : `
          <button role="tab" aria-selected="${tab==='listings'}" class="tab-btn ${tab==='listings'?'active':''}" data-tab="listings">${isRentMode ? '🔑 Lands for Rent' : '💰 Lands for Sale'}</button>
          <button role="tab" aria-selected="${tab==='map'}" class="tab-btn ${tab==='map'?'active':''}" data-tab="map">🗺️ Map View</button>
          <button role="tab" aria-selected="${tab==='saved'}" class="tab-btn ${tab==='saved'?'active':''}" data-tab="saved">⭐ Saved</button>
          <button role="tab" aria-selected="${tab==='enquiries'}" class="tab-btn ${tab==='enquiries'?'active':''}" data-tab="enquiries">📋 My Enquiries</button>
        `}
      </div>

      <div style="padding-bottom:80px">
        ${loading ? '<div class="loading"><div class="spinner"></div></div>'
          : tab === 'listings' ? (isOwner ? renderMyListings() : renderBrowse())
          : tab === 'map' ? renderMapView()
          : tab === 'enquiries' ? renderEnquiries()
          : tab === 'saved' ? renderSaved()
          : tab === 'documents' ? renderDocumentVault()
          : tab === 'analytics' ? renderOwnerAnalytics()
          : ''}
      </div>
    `;
    attachEvents();
  }

  // ─── BROWSE LISTINGS (BUY/RENT mode) ────────────────────────────────────
  function renderBrowse() {
    const isRent = mode === 'rent';
    let filtered = listings.filter(l => isRent ? l.listing_type === 'rent' : l.listing_type === 'sale');
    if (searchQ) filtered = filtered.filter(l => `${l.title} ${l.district} ${l.mandal} ${l.village}`.toLowerCase().includes(searchQ.toLowerCase()));
    if (districtFilter) filtered = filtered.filter(l => l.district === districtFilter);
    if (landTypeFilter) filtered = filtered.filter(l => l.land_type === landTypeFilter);

    const districts = [...new Set(listings.map(l => l.district).filter(Boolean))].sort();

    return `
      <div style="padding:10px 14px 0">
        <!-- Mode banner -->
        <div style="background:${isRent?'#E3F2FD':'#E8F5E9'};border:1px solid ${isRent?'#0277BD30':'#2E7D3230'};border-radius:10px;padding:10px 12px;margin-bottom:10px">
          <div style="font-size:12px;color:${isRent?'#0277BD':'#2E7D32'};font-weight:700">${isRent ? '🔑 Lands Available for Rent / Lease' : '💰 Lands Available for Purchase'}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:2px">${isRent ? 'Find farmland for seasonal or annual lease. Negotiate directly with landowners.' : 'Find agricultural land for purchase. Verify documents before buying.'}</div>
        </div>

        <!-- Stats -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px">
          <div style="text-align:center;background:white;border-radius:10px;padding:10px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
            <div style="font-weight:800;font-size:18px;color:#795548">${filtered.length}</div>
            <div style="font-size:10px;color:#757575">${isRent ? 'For Rent' : 'For Sale'}</div>
          </div>
          <div style="text-align:center;background:white;border-radius:10px;padding:10px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
            <div style="font-weight:800;font-size:18px;color:#795548">${districts.length}</div>
            <div style="font-size:10px;color:#757575">Districts</div>
          </div>
          <div style="text-align:center;background:white;border-radius:10px;padding:10px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
            <div style="font-weight:800;font-size:18px;color:#795548">${filtered.reduce((s,l)=>s+Number(l.area_acres||0),0).toFixed(1)}</div>
            <div style="font-size:10px;color:#757575">Total Acres</div>
          </div>
        </div>

        <!-- Search -->
        <div style="display:flex;align-items:center;background:white;border:1px solid #E0E0E0;border-radius:10px;padding:8px 12px;margin-bottom:10px">
          <span style="margin-right:8px;font-size:16px">🔍</span>
          <input id="landSearch" type="search" placeholder="Search by district, mandal, village…" aria-label="Search by district, mandal, village…" value="${searchQ}" style="border:none;outline:none;flex:1;font-size:13px;background:transparent">
        </div>

        <!-- Filters -->
        <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;margin-bottom:6px">
          <button data-ldistrict="" style="flex-shrink:0;padding:5px 12px;border-radius:20px;border:none;font-size:11px;font-weight:600;cursor:pointer;background:${!districtFilter?'#795548':'#F5F5F5'};color:${!districtFilter?'white':'#616161'}">All Districts</button>
          ${districts.map(d => `<button data-ldistrict="${d}" style="flex-shrink:0;padding:5px 10px;border-radius:20px;border:none;font-size:11px;cursor:pointer;background:${districtFilter===d?'#795548':'#F5F5F5'};color:${districtFilter===d?'white':'#616161'}">${d}</button>`).join('')}
        </div>
        <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;margin-bottom:10px">
          <button data-ltype="" style="flex-shrink:0;padding:5px 12px;border-radius:20px;border:none;font-size:11px;font-weight:600;cursor:pointer;background:${!landTypeFilter?'#795548':'#F5F5F5'};color:${!landTypeFilter?'white':'#616161'}">All Types</button>
          ${LAND_TYPES.map(t => `<button data-ltype="${t.id}" style="flex-shrink:0;padding:5px 10px;border-radius:20px;border:none;font-size:11px;cursor:pointer;background:${landTypeFilter===t.id?t.color:'#F5F5F5'};color:${landTypeFilter===t.id?'white':'#616161'}">${t.icon} ${t.label}</button>`).join('')}
        </div>

        <!-- Listing Cards -->
        ${filtered.length === 0 ? `
          <div style="text-align:center;padding:40px 20px">
            <div style="font-size:48px;margin-bottom:8px">🏡</div>
            <div style="font-weight:700;margin-bottom:4px">No land listings found</div>
            <div style="font-size:12px;color:#757575">Try different location or land type</div>
          </div>
        ` : filtered.map(l => renderLandCard(l)).join('')}
      </div>
    `;
  }

  function renderLandCard(l) {
    const lt = LAND_TYPES.find(t => t.id === l.land_type);
    const isRent = l.listing_type === 'rent';
    const priceLabel = isRent ? `₹${Number(l.rent_per_year||l.price||0).toLocaleString()}/year` : `₹${Number(l.price||0).toLocaleString()}`;

    return `
      <div style="background:white;border-radius:12px;margin-bottom:10px;box-shadow:0 2px 6px rgba(0,0,0,0.07);overflow:hidden">
        <div style="height:4px;background:${isRent?'#0277BD':'#2E7D32'}"></div>
        <div style="padding:12px 14px">
          <div style="display:flex;gap:10px;align-items:flex-start">
            <div style="width:44px;height:44px;border-radius:10px;background:${lt?.color||'#795548'}15;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">${lt?.icon||'🏡'}</div>
            <div style="flex:1">
              <div style="font-weight:700;font-size:14px">${l.title || (lt?.label||'Agricultural') + ' Land'}</div>
              <div style="font-size:11px;color:#757575;margin-top:1px">📍 ${[l.village, l.mandal, l.district].filter(Boolean).join(', ')}</div>
              <div style="display:flex;gap:4px;margin-top:5px;flex-wrap:wrap">
                <span style="background:${lt?.color||'#795548'}15;color:${lt?.color||'#795548'};padding:2px 7px;border-radius:8px;font-size:10px;font-weight:600">${lt?.icon||'🏡'} ${lt?.label||l.land_type}</span>
                <span style="background:#FFF3E0;color:#E65100;padding:2px 7px;border-radius:8px;font-size:10px;font-weight:700">📐 ${l.area_acres||'?'} Acres</span>
                ${l.water_source ? `<span style="background:#E3F2FD;color:#0277BD;padding:2px 7px;border-radius:8px;font-size:10px">💧 ${l.water_source}</span>` : ''}
                ${l.soil_type ? `<span style="background:#EFEBE9;color:#795548;padding:2px 7px;border-radius:8px;font-size:10px">🏔️ ${l.soil_type}</span>` : ''}
                ${l.road_access ? `<span style="background:#E8F5E9;color:#2E7D32;padding:2px 7px;border-radius:8px;font-size:10px">🛣️ Road Access</span>` : ''}
                ${l.fenced ? `<span style="background:#F5F5F5;color:#616161;padding:2px 7px;border-radius:8px;font-size:10px">🔒 Fenced</span>` : ''}
              </div>
            </div>
            <div style="text-align:right;flex-shrink:0">
              <div style="font-weight:800;font-size:14px;color:${isRent?'#0277BD':'#2E7D32'}">${priceLabel}</div>
              <div style="font-size:10px;color:#757575">${isRent ? 'per year' : l.area_acres ? '₹'+Math.round(Number(l.price||0)/Number(l.area_acres)).toLocaleString()+'/acre' : ''}</div>
            </div>
          </div>
          ${l.description ? `<div style="font-size:11px;color:#757575;margin-top:8px;line-height:1.5">${l.description.slice(0,120)}${l.description.length>120?'…':''}</div>` : ''}
          <div style="display:flex;gap:6px;margin-top:10px">
            <button class="enquire-land-btn" data-lid="${l.id}" style="flex:1;padding:8px;background:${isRent?'#0277BD':'#2E7D32'};color:white;border:none;border-radius:8px;font-weight:600;font-size:12px;cursor:pointer">📞 ${isRent ? 'Enquire for Lease' : 'Enquire to Buy'}</button>
            <button class="save-land-btn" data-lid="${l.id}" style="padding:8px 12px;background:#FFF8E1;color:#F9A825;border:none;border-radius:8px;font-size:12px;cursor:pointer">⭐</button>
          </div>
        </div>
      </div>
    `;
  }

  // ─── MY LISTINGS (SELL mode) ─────────────────────────────────────────────
  function renderMyListings() {
    return `
      <div style="padding:10px 14px 0">
        <button id="listLandBtn" style="width:100%;padding:12px;background:#795548;color:white;border:none;border-radius:12px;font-weight:700;font-size:14px;cursor:pointer;margin-bottom:12px">+ List Your Land (for Sale or Rent)</button>

        ${myListings.length === 0 ? `
          <div style="text-align:center;padding:40px 20px">
            <div style="font-size:48px;margin-bottom:8px">🏡</div>
            <div style="font-weight:700;margin-bottom:4px">No land listed yet</div>
            <div style="font-size:12px;color:#757575;line-height:1.5">List your agricultural land for sale or rent.<br>Reach farmers & investors looking for farmland.</div>
          </div>
        ` : myListings.map(l => {
          const lt = LAND_TYPES.find(t => t.id === l.land_type);
          return `
          <div style="background:white;border-radius:12px;margin-bottom:10px;box-shadow:0 2px 6px rgba(0,0,0,0.07);overflow:hidden">
            <div style="height:3px;background:${l.listing_type==='rent'?'#0277BD':'#2E7D32'}"></div>
            <div style="padding:12px 14px">
              <div style="display:flex;gap:10px;align-items:flex-start">
                <div style="width:40px;height:40px;border-radius:8px;background:${lt?.color||'#795548'}15;display:flex;align-items:center;justify-content:center;font-size:20px">${lt?.icon||'🏡'}</div>
                <div style="flex:1">
                  <div style="font-weight:700;font-size:14px">${l.title || (lt?.label||'') + ' Land'}</div>
                  <div style="font-size:11px;color:#757575">📍 ${l.district || ''} · ${l.area_acres||'?'} Acres · ${l.listing_type === 'rent' ? 'For Rent' : 'For Sale'}</div>
                  <div style="display:flex;gap:4px;margin-top:4px">
                    <span style="background:${l.status==='active'?'#E8F5E9':'#FFF8E1'};color:${l.status==='active'?'#2E7D32':'#F9A825'};padding:2px 7px;border-radius:8px;font-size:10px;font-weight:600">${l.status==='active'?'Active':'Pending'}</span>
                    <span style="font-size:10px;color:#757575;padding:2px 7px">Views: ${l.views||0}</span>
                  </div>
                </div>
                <div style="font-weight:800;color:#795548;font-size:13px">₹${Number(l.price||l.rent_per_year||0).toLocaleString()}</div>
              </div>
              <div style="display:flex;gap:6px;margin-top:10px">
                <button class="land-edit-btn" data-lid="${l.id}" style="flex:1;padding:7px;background:#F5F5F5;border:none;border-radius:8px;font-size:12px;cursor:pointer">✏️ Edit</button>
                <button class="land-del-btn" data-lid="${l.id}" style="padding:7px 12px;background:#FFEBEE;color:#C62828;border:none;border-radius:8px;font-size:12px;cursor:pointer">🗑️</button>
              </div>
            </div>
          </div>
        `; }).join('')}
      </div>
    `;
  }

  // ─── ENQUIRIES ───────────────────────────────────────────────────────────
  function renderEnquiries() {
    const isOwner = mode === 'sell';
    return `
      <div style="padding:10px 14px 0">
        ${enquiries.length === 0 ? `
          <div style="text-align:center;padding:40px 20px">
            <div style="font-size:48px;margin-bottom:8px">📋</div>
            <div style="font-weight:700;margin-bottom:4px">${isOwner ? 'No enquiries received' : 'No enquiries sent'}</div>
            <div style="font-size:12px;color:#757575">${isOwner ? 'When buyers enquire about your land, it shows here' : 'Send enquiries on listings you like'}</div>
          </div>
        ` : enquiries.map(e => `
          <div style="background:white;border-radius:12px;margin-bottom:10px;padding:14px;box-shadow:0 2px 6px rgba(0,0,0,0.07)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
              <div style="font-weight:700;font-size:13px">${e.land_title || 'Land Enquiry'}</div>
              <span style="background:${e.status==='responded'?'#E8F5E9':'#FFF8E1'};color:${e.status==='responded'?'#2E7D32':'#F9A825'};padding:3px 8px;border-radius:8px;font-size:10px;font-weight:700">${e.status?.toUpperCase()||'PENDING'}</span>
            </div>
            <div style="font-size:12px;color:#757575">${isOwner ? `From: ${e.buyer_name||'Buyer'}` : `To: ${e.owner_name||'Owner'}`} · ${e.district||''}</div>
            ${e.message ? `<div style="font-size:11px;color:#757575;margin-top:6px;background:#F5F5F5;padding:8px;border-radius:8px">"${e.message}"</div>` : ''}
            ${isOwner && e.status === 'pending' ? `
              <div style="display:flex;gap:6px;margin-top:8px">
                <button class="enq-respond" data-eid="${e.id}" style="flex:1;padding:7px;background:#2E7D32;color:white;border:none;border-radius:8px;font-size:12px;cursor:pointer">📞 Respond</button>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // ─── MAP VIEW ────────────────────────────────────────────────────────────
  function renderMapView() {
    const mapId = 'bhoomi-leaflet-map';
    // District centroid coords for AP/TS sample data
    const DISTRICT_COORDS = {
      'Krishna':    [16.61, 80.81],
      'Guntur':     [16.30, 80.45],
      'Chittoor':   [13.22, 79.10],
      'Kurnool':    [15.83, 78.05],
      'Nellore':    [14.44, 79.99],
      'East Godavari': [17.00, 82.24],
      'West Godavari': [16.95, 81.33],
      'Warangal':   [18.00, 79.58],
      'Medak':      [18.05, 78.26],
      'Rangareddy': [17.36, 78.49],
    };

    setTimeout(() => {
      // Inject Leaflet CSS if missing
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      const initMap = () => {
        const container = document.getElementById(mapId);
        if (!container || container._leaflet_id) return;
        const map = window.L.map(mapId).setView([16.5, 80.6], 7);
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
          maxZoom: 18
        }).addTo(map);

        const allListings = [...(listings || []), ...(myListings || [])];
        allListings.forEach(l => {
          const dist = l.district || l.location || '';
          let coords = null;
          for (const [key, val] of Object.entries(DISTRICT_COORDS)) {
            if (dist.toLowerCase().includes(key.toLowerCase())) { coords = val; break; }
          }
          if (!coords) coords = [16.5 + (Math.random()-0.5)*2, 80.6 + (Math.random()-0.5)*3];
          const marker = window.L.marker(coords).addTo(map);
          const price = l.price ? `₹${(l.price/100000).toFixed(1)}L` : (l.rent_per_month ? `₹${l.rent_per_month}/mo` : 'N/A');
          marker.bindPopup(`
            <div style="min-width:160px">
              <div style="font-weight:700;font-size:13px;margin-bottom:4px">${l.title || l.description?.slice(0,40) || 'Land Listing'}</div>
              <div style="font-size:12px;color:#555">${l.area_acres || l.acres || '?'} acres • ${l.district || l.location || ''}</div>
              <div style="font-size:13px;font-weight:700;color:${l.listing_type==='rent'?'#0277BD':'#2E7D32'};margin-top:4px">${price}</div>
              <div style="font-size:11px;margin-top:2px;background:${l.listing_type==='rent'?'#E3F2FD':'#E8F5E9'};padding:2px 6px;border-radius:6px;display:inline-block">${l.listing_type==='rent'?'For Rent':'For Sale'}</div>
            </div>
          `);
        });

        if (allListings.length === 0) {
          window.L.popup().setLatLng([16.5, 80.6]).setContent('<div style="font-size:13px">No listings to show yet</div>').openOn(map);
        }
      };

      if (window.L) {
        initMap();
      } else {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = initMap;
        document.head.appendChild(script);
      }
    }, 50);

    return `
      <div style="padding:10px 14px 0">
        <div style="background:white;border-radius:14px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
          <div style="padding:10px 14px;font-weight:700;font-size:13px;background:#795548;color:white;display:flex;align-items:center;gap:6px">
            🗺️ Land Listings Map <span style="font-size:11px;font-weight:400;opacity:0.85">&nbsp;— AP / Telangana</span>
          </div>
          <div id="${mapId}" style="height:420px;width:100%"></div>
        </div>
        <div style="padding:10px 0 4px;font-size:11px;color:#9E9E9E;text-align:center">Tap a marker to view listing details • Data from OpenStreetMap</div>
      </div>
    `;
  }

  // ─── SAVED ───────────────────────────────────────────────────────────────
  function renderSaved() {
    return `
      <div style="padding:10px 14px 0;text-align:center">
        <div style="font-size:48px;margin-bottom:8px">⭐</div>
        <div style="font-weight:700;margin-bottom:4px">Saved Listings</div>
        <div style="font-size:12px;color:#757575">Save interesting land listings to review later.<br>Tap ⭐ on any listing to save it.</div>
      </div>
    `;
  }

  // ─── DOCUMENT VAULT ──────────────────────────────────────────────────────
  const DOC_VAULT = [
    { id:'dv1', name:'Pattadar Passbook', land:'Survey 45/2, Guntur', type:'pattadar', uploaded:'2025-12-10', expires:null, size:'1.2 MB', status:'verified', icon:'📗' },
    { id:'dv2', name:'7-12 Extract', land:'Survey 45/2, Guntur', type:'extract', uploaded:'2026-01-15', expires:'2026-07-15', size:'0.8 MB', status:'valid', icon:'📋' },
    { id:'dv3', name:'Sale Deed', land:'Survey 12, Kurnool', type:'sale_deed', uploaded:'2024-08-03', expires:null, size:'3.4 MB', status:'verified', icon:'📜' },
    { id:'dv4', name:'Survey / Adangal', land:'Survey 45/2, Guntur', type:'survey', uploaded:'2026-03-01', expires:'2027-03-01', size:'0.5 MB', status:'valid', icon:'🗺️' },
  ];
  const DOC_TYPES = ['Pattadar Passbook','7-12 Extract','Sale Deed','Gift Deed','Mutation Records','Survey / Adangal','Encumbrance Certificate','NOC','Other'];

  function renderDocumentVault() {
    const today = new Date();
    return `<div style="padding:10px 14px 0">
      <div style="background:linear-gradient(135deg,#4527A0,#311b92);border-radius:14px;padding:16px;color:white;margin-bottom:12px">
        <div style="font-size:13px;font-weight:800;margin-bottom:4px">📄 Land Document Vault</div>
        <div style="font-size:11px;opacity:0.85">Securely store & manage your land ownership documents</div>
        <div style="display:flex;gap:14px;margin-top:12px">
          <div><div style="font-weight:800;font-size:20px">${DOC_VAULT.length}</div><div style="font-size:10px;opacity:0.8">Documents</div></div>
          <div><div style="font-weight:800;font-size:20px">${DOC_VAULT.filter(d=>d.status==='verified').length}</div><div style="font-size:10px;opacity:0.8">Verified</div></div>
          <div><div style="font-weight:800;font-size:20px">${DOC_VAULT.filter(d=>d.expires && new Date(d.expires)<new Date(today.getTime()+30*86400000)).length}</div><div style="font-size:10px;opacity:0.8">Expiring Soon</div></div>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-size:12px;font-weight:700;color:var(--text3,#9E9E9E)">MY DOCUMENTS</div>
        <button id="uploadDocBtn" style="background:#4527A0;color:white;border:none;border-radius:8px;padding:6px 12px;font-size:11px;font-weight:700;cursor:pointer">+ Upload</button>
      </div>

      ${DOC_VAULT.map(doc => {
        const expiring = doc.expires && new Date(doc.expires) < new Date(today.getTime()+30*86400000);
        return `<div style="background:var(--card,white);border-radius:12px;padding:12px;margin-bottom:10px;box-shadow:0 1px 4px rgba(0,0,0,0.07);border-left:4px solid ${doc.status==='verified'?'#2E7D32':expiring?'#E65100':'#90CAF9'}">
          <div style="display:flex;gap:10px;align-items:center">
            <div style="font-size:26px">${doc.icon}</div>
            <div style="flex:1">
              <div style="font-weight:700;font-size:13px">${doc.name}</div>
              <div style="font-size:11px;color:var(--text3,#757575);margin-top:2px">🏡 ${doc.land}</div>
              <div style="display:flex;gap:10px;margin-top:6px;align-items:center">
                <span style="background:${doc.status==='verified'?'#E8F5E9':'#E3F2FD'};color:${doc.status==='verified'?'#2E7D32':'#1565C0'};border-radius:8px;padding:2px 8px;font-size:10px;font-weight:700">${doc.status==='verified'?'✓ Verified':'✓ Uploaded'}</span>
                ${expiring?`<span style="background:#FFF3E0;color:#E65100;border-radius:8px;padding:2px 8px;font-size:10px;font-weight:700">⚠️ Expires ${doc.expires}</span>`:''}
                <span style="font-size:10px;color:var(--text3,#9E9E9E)">${doc.size}</span>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px">
              <button data-docid="${doc.id}" class="view-doc-btn" style="background:#E8EAF6;color:#3949AB;border:none;border-radius:6px;padding:5px 8px;font-size:10px;cursor:pointer">👁️ View</button>
              <button data-docid="${doc.id}" class="share-doc-btn" style="background:#E8F5E9;color:#2E7D32;border:none;border-radius:6px;padding:5px 8px;font-size:10px;cursor:pointer">📤 Share</button>
            </div>
          </div>
        </div>`;
      }).join('')}

      <div style="background:#F3E5F5;border-radius:12px;padding:14px;margin-top:4px">
        <div style="font-size:12px;font-weight:700;color:#4527A0;margin-bottom:8px">📌 Required Land Documents Checklist</div>
        ${['Pattadar Passbook','7-12 Extract','Survey Map','Sale/Gift Deed','Encumbrance Certificate','Mutation Records'].map(d => {
          const have = DOC_VAULT.some(dv => dv.name.toLowerCase().includes(d.toLowerCase().split(' ')[0]));
          return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="font-size:14px">${have?'✅':'⬜'}</span><span style="font-size:12px;color:${have?'#2E7D32':'#555'}">${d}</span></div>`;
        }).join('')}
      </div>
    </div>`;
  }

  // ─── OWNER ANALYTICS ─────────────────────────────────────────────────────
  function renderOwnerAnalytics() {
    return `
      <div style="padding:10px 14px 0">
        <div style="background:linear-gradient(135deg,#795548,#4E342E);border-radius:14px;padding:16px;color:white;margin-bottom:12px">
          <div style="font-size:12px;opacity:0.8">My Land Listings</div>
          <div style="font-weight:800;font-size:28px;margin-top:4px">${myListings.length}</div>
          <div style="display:flex;gap:16px;margin-top:12px">
            <div><div style="font-weight:700;font-size:16px">${myListings.filter(l=>l.listing_type==='sale').length}</div><div style="font-size:10px;opacity:0.8">For Sale</div></div>
            <div><div style="font-weight:700;font-size:16px">${myListings.filter(l=>l.listing_type==='rent').length}</div><div style="font-size:10px;opacity:0.8">For Rent</div></div>
            <div><div style="font-weight:700;font-size:16px">${enquiries.length}</div><div style="font-size:10px;opacity:0.8">Enquiries</div></div>
            <div><div style="font-weight:700;font-size:16px">${myListings.reduce((s,l)=>s+Number(l.views||0),0)}</div><div style="font-size:10px;opacity:0.8">Total Views</div></div>
          </div>
        </div>

        <div style="background:white;border-radius:12px;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
          <div style="font-weight:700;font-size:13px;margin-bottom:10px">📊 Total Land Area Listed</div>
          <div style="font-size:24px;font-weight:800;color:#795548">${myListings.reduce((s,l)=>s+Number(l.area_acres||0),0).toFixed(1)} Acres</div>
          <div style="font-size:11px;color:#757575;margin-top:4px">across ${myListings.length} properties in ${[...new Set(myListings.map(l=>l.district))].length} districts</div>
        </div>
      </div>
    `;
  }

  // ─── LIST LAND MODAL ─────────────────────────────────────────────────────
  function showListLand() {
    showModal(`
      <div class="modal-handle"></div>
      <h3 style="margin:0 0 14px">🏡 List Your Land</h3>
      <div class="form-group"><label>Title *</label><input class="form-input" id="landTitle" placeholder="e.g. 5 Acre Agricultural Land in Krishna Dist"></div>
      <div class="form-group"><label>Listing Type *</label>
        <select class="form-input" id="landListType">
          <option value="sale">For Sale</option>
          <option value="rent">For Rent / Lease</option>
        </select>
      </div>
      <div class="form-group"><label>Land Type *</label>
        <select class="form-input" id="landType">
          <option value="">Select type</option>
          ${LAND_TYPES.map(t => `<option value="${t.id}">${t.icon} ${t.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Area (Acres) *</label><input class="form-input" id="landArea" type="number" step="0.1" placeholder="e.g. 5.5"></div>
      <div class="form-group"><label>Price (₹) *</label><input class="form-input" id="landPrice" type="number" placeholder="Total price (sale) or per year (rent)"></div>
      <div class="form-group"><label>District *</label><input class="form-input" id="landDistrict" placeholder="e.g. Krishna, West Godavari"></div>
      <div class="form-group"><label>Mandal</label><input class="form-input" id="landMandal" placeholder="e.g. Vijayawada Rural"></div>
      <div class="form-group"><label>Village</label><input class="form-input" id="landVillage" placeholder="e.g. Kondapalli"></div>
      <div class="form-group"><label>Water Source</label>
        <select class="form-input" id="landWater">
          <option value="">Select</option>
          ${WATER_SOURCES.map(w => `<option value="${w}">${w}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Soil Type</label>
        <select class="form-input" id="landSoil">
          <option value="">Select</option>
          ${SOIL_TYPES.map(s => `<option value="${s}">${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="display:flex;gap:12px">
        <label style="display:flex;align-items:center;gap:6px"><input type="checkbox" id="landRoad"> Road Access</label>
        <label style="display:flex;align-items:center;gap:6px"><input type="checkbox" id="landFenced"> Fenced</label>
      </div>
      <div class="form-group"><label>Description</label><textarea class="form-input" id="landDesc" rows="3" placeholder="Describe the land — crops grown, nearby landmarks, facilities…"></textarea></div>
      <button id="submitLand" style="width:100%;padding:12px;background:#795548;color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer;margin-top:8px">List Land</button>
    `);
    document.querySelector('#submitLand')?.addEventListener('click', async () => {
      const title = document.querySelector('#landTitle')?.value?.trim();
      const listing_type = document.querySelector('#landListType')?.value;
      const land_type = document.querySelector('#landType')?.value;
      const area_acres = Number(document.querySelector('#landArea')?.value);
      const price = Number(document.querySelector('#landPrice')?.value);
      const district = document.querySelector('#landDistrict')?.value?.trim();
      if (!title || !land_type || !area_acres || !price || !district) return showToast('Title, Type, Area, Price & District required', 'error');
      try {
        await api.post('/bhoomios/listings', {
          title, listing_type, land_type, area_acres, price,
          rent_per_year: listing_type === 'rent' ? price : null,
          district,
          mandal: document.querySelector('#landMandal')?.value || '',
          village: document.querySelector('#landVillage')?.value || '',
          water_source: document.querySelector('#landWater')?.value || '',
          soil_type: document.querySelector('#landSoil')?.value || '',
          road_access: document.querySelector('#landRoad')?.checked || false,
          fenced: document.querySelector('#landFenced')?.checked || false,
          description: document.querySelector('#landDesc')?.value || '',
        });
        showToast('Land listed successfully!', 'success');
        closeModal();
        loadData();
      } catch (e) { showToast(e.message, 'error'); }
    });
  }

  // ─── EVENTS ──────────────────────────────────────────────────────────────
  function attachEvents() {
    // Mode toggle
    container.querySelectorAll('[data-bmode]').forEach(b => {
      b.addEventListener('click', () => { mode = b.dataset.bmode; tab = 'listings'; render(); });
    });
    // Tabs
    container.querySelectorAll('.tab-btn').forEach(b => {
      b.addEventListener('click', () => { tab = b.dataset.tab; render(); });
    });
    // Search
    container.querySelector('#landSearch')?.addEventListener('input', e => { searchQ = e.target.value; render(); });
    // Filters
    container.querySelectorAll('[data-ldistrict]').forEach(b => { b.addEventListener('click', () => { districtFilter = b.dataset.ldistrict; render(); }); });
    container.querySelectorAll('[data-ltype]').forEach(b => { b.addEventListener('click', () => { landTypeFilter = b.dataset.ltype; render(); }); });
    // Land actions
    container.querySelector('#listLandBtn')?.addEventListener('click', showListLand);
    container.querySelectorAll('.enquire-land-btn').forEach(b => {
      b.addEventListener('click', () => {
        const l = listings.find(x => x.id == b.dataset.lid);
        if (!l) return;
        showModal(`
          <div class="modal-handle"></div>
          <h3 style="margin:0 0 14px">📞 Enquire — ${l.title || 'Land'}</h3>
          <div style="background:#EFEBE9;border-radius:10px;padding:10px;margin-bottom:12px">
            <div style="font-size:12px;color:#795548">📍 ${l.district} · ${l.area_acres} Acres · ₹${Number(l.price||0).toLocaleString()}</div>
          </div>
          <div class="form-group"><label>Your Message</label><textarea class="form-input" id="enqMsg" rows="3" placeholder="e.g. I'm interested in this land. Can we visit?"></textarea></div>
          <div class="form-group"><label>Your Phone</label><input class="form-input" id="enqPhone" type="tel" placeholder="Your contact number"></div>
          <button id="submitEnquiry" style="width:100%;padding:12px;background:#795548;color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer">Send Enquiry</button>
        `);
        document.querySelector('#submitEnquiry')?.addEventListener('click', async () => {
          try {
            await api.post('/bhoomios/enquiries', {
              listing_id: l.id,
              message: document.querySelector('#enqMsg')?.value || '',
              phone: document.querySelector('#enqPhone')?.value || '',
            });
            showToast('Enquiry sent! Owner will be notified.', 'success');
            closeModal();
            loadData();
          } catch (e) { showToast(e.message, 'error'); }
        });
      });
    });
    container.querySelectorAll('.save-land-btn').forEach(b => { b.addEventListener('click', () => showToast('⭐ Saved to favorites!', 'success')); });
    // Owner actions
    container.querySelectorAll('.land-edit-btn').forEach(b => { b.addEventListener('click', () => showToast('Edit listing — coming soon', 'info')); });
    container.querySelectorAll('.land-del-btn').forEach(b => {
      b.addEventListener('click', async () => {
        if (!confirm('Delete this land listing?')) return;
        try { await api.del(`/bhoomios/listings/${b.dataset.lid}`); showToast('Deleted', 'success'); loadData(); } catch(e) { showToast(e.message, 'error'); }
      });
    });
    container.querySelectorAll('.enq-respond').forEach(b => { b.addEventListener('click', () => showToast('📞 Call the buyer to respond!', 'info')); });
    // Document vault actions
    container.querySelector('#uploadDocBtn')?.addEventListener('click', showUploadDoc);
    container.querySelectorAll('.view-doc-btn').forEach(b => b.addEventListener('click', () => showToast('📄 Document viewer — launching...', 'info')));
    container.querySelectorAll('.share-doc-btn').forEach(b => b.addEventListener('click', () => showToast('📤 Share link copied to clipboard!', 'success')));
  }

  function showUploadDoc() {
    showModal(`<div class="modal-handle"></div>
      <h3>📄 Upload Land Document</h3>
      <div class="form-group"><label>Document Type</label>
        <select class="form-input" id="docType">
          ${DOC_TYPES.map(d=>`<option>${d}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Land / Survey Number</label><input class="form-input" id="docLand" placeholder="e.g. Survey No. 45/2, Guntur"></div>
      <div class="form-group"><label>Issue Date</label><input class="form-input" id="docDate" type="date"></div>
      <div class="form-group"><label>Expiry Date (if applicable)</label><input class="form-input" id="docExp" type="date"></div>
      <div class="form-group" style="background:#F5F5F5;border-radius:10px;padding:16px;text-align:center;border:2px dashed #BDBDBD;cursor:pointer">
        <div style="font-size:24px;margin-bottom:8px">📎</div>
        <div style="font-size:13px;font-weight:600">Tap to upload document</div>
        <div style="font-size:11px;color:#9E9E9E;margin-top:4px">PDF, JPG, PNG up to 10MB</div>
        <input type="file" id="docFile" accept=".pdf,.jpg,.jpeg,.png" style="display:none">
      </div>
      <button class="btn btn-primary" id="submitDoc" style="margin-top:12px">Upload Document</button>`);
    document.querySelector('#submitDoc')?.addEventListener('click', () => {
      const docType = document.querySelector('#docType')?.value;
      const land = document.querySelector('#docLand')?.value?.trim();
      if (!land) { showToast('Please enter land/survey number', 'error'); return; }
      DOC_VAULT.push({ id:'dv'+Date.now(), name:docType, land, type:docType.toLowerCase().replace(/\s/g,'_'), uploaded:new Date().toISOString().slice(0,10), expires:document.querySelector('#docExp')?.value||null, size:'Uploading...', status:'valid', icon:'📄' });
      showToast('Document uploaded successfully!', 'success');
      closeModal(); tab='documents'; render();
    });
  }

  // ─── DATA ────────────────────────────────────────────────────────────────
  async function loadData() {
    loading = true; render();
    try {
      const [ls, ml, enq] = await Promise.all([
        api.get('/bhoomios/listings?limit=50').catch(() => []),
        api.get('/bhoomios/my-listings').catch(() => []),
        api.get('/bhoomios/enquiries').catch(() => []),
      ]);
      listings   = Array.isArray(ls) ? ls : (ls.listings || []);
      myListings = Array.isArray(ml) ? ml : (ml.listings || []);
      enquiries  = Array.isArray(enq) ? enq : (enq.enquiries || []);
      // Fallback to sample data
      if (listings.length === 0) listings = SAMPLE_LISTINGS;
    } catch (e) {
      listings = SAMPLE_LISTINGS;
    }
    loading = false; render();
  }

  loadData();
}
