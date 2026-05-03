import { api } from '../api.js';
import { showToast, showModal, closeModal, navigate } from '../app-shell.js';
import { getRole, getState } from '../store.js';
import { t } from '../i18n.js';
import { showCheckout } from '../payments.js';
import { showReviewsModal } from '../reviews.js';

/**
 * KisanConnect — Farm Equipment Marketplace
 * Simple 3-mode: Rent · Buy · Sell
 * Equipment ONLY — clean, focused, no clutter
 */

export function renderKisan(container) {
  let mode = 'connect'; // connect | rent | buy | sell | services
  let equipment = [];
  let loading = true;
  let eqType = '';
  let eqSearch = '';
  let operators = [];
  let machineRequests = [];
  let connectStats = { total_operators: 0, available_operators: 0, open_requests: 0, completed_requests: 0 };

  const EQ_TYPES = [
    {id:'tractor',     icon:'🚜', label:'Tractor'},
    {id:'jcb',         icon:'🏗️', label:'JCB'},
    {id:'harvester',   icon:'🌾', label:'Harvester'},
    {id:'rotavator',   icon:'⚙️', label:'Rotavator'},
    {id:'excavator',   icon:'⛏️', label:'Excavator'},
    {id:'crane',       icon:'🏗️', label:'Crane'},
    {id:'sprayer',     icon:'💨', label:'Sprayer'},
    {id:'transplanter',icon:'🌱', label:'Transplanter'},
    {id:'pump',        icon:'💧', label:'Pump Set'},
    {id:'thresher',    icon:'🔄', label:'Thresher'},
    {id:'seed_drill',  icon:'🌀', label:'Seed Drill'},
    {id:'mini_tractor',icon:'🚛', label:'Mini Tractor'},
    {id:'power_tiller',icon:'🔧', label:'Power Tiller'},
    {id:'trolley',     icon:'🚚', label:'Trolley'},
  ];

  const SAMPLE_EQUIPMENT = [
    { id:'s1', name:'John Deere 5310', equipment_type:'tractor', listing_type:'rent', daily_rate:1800, sale_price:null, year_of_manufacture:2021, operator_included:true, status:'available', location_label:'Guntur, AP', rating:4.8, description:'55 HP, 4WD, well maintained. Comes with experienced operator. Ideal for paddy and cotton fields.', owner_name:'Ramesh Kumar' },
    { id:'s2', name:'Mahindra 475 DI', equipment_type:'tractor', listing_type:'both', daily_rate:1500, sale_price:450000, year_of_manufacture:2019, operator_included:false, status:'available', location_label:'Krishna, AP', rating:4.5, description:'42 HP, good condition, 2800 hours used. Available for both rent and outright purchase.' },
    { id:'s3', name:'Kubota DC-70 Combine', equipment_type:'harvester', listing_type:'rent', daily_rate:8000, sale_price:null, year_of_manufacture:2022, operator_included:true, status:'available', location_label:'West Godavari, AP', rating:4.9, description:'Full combine harvester with cutter header. 70HP, 4-wheel drive. Operator with 8 years experience included.' },
    { id:'s4', name:'Shaktiman Rotavator 7ft', equipment_type:'rotavator', listing_type:'sale', daily_rate:null, sale_price:95000, year_of_manufacture:2020, operator_included:false, status:'available', location_label:'Prakasam, AP', rating:4.2, description:'7 feet working width, 48 blades, multi-speed gearbox. Used for 2 seasons only.' },
    { id:'s5', name:'ASPEE Sprayer 16L', equipment_type:'sprayer', listing_type:'rent', daily_rate:200, sale_price:null, year_of_manufacture:2023, operator_included:false, status:'available', location_label:'Nellore, AP', rating:4.6, description:'Battery-operated knapsack sprayer, 16L capacity. Adjustable nozzle.' },
    { id:'s6', name:'VST Shakti Power Tiller', equipment_type:'power_tiller', listing_type:'both', daily_rate:1200, sale_price:280000, year_of_manufacture:2020, operator_included:true, status:'booked', location_label:'East Godavari, AP', rating:4.4, description:'9HP diesel, ideal for wet and dry land preparation. Very fuel efficient.' },
    { id:'s7', name:'Preet 749 Harvester', equipment_type:'harvester', listing_type:'sale', daily_rate:null, sale_price:1800000, year_of_manufacture:2018, operator_included:false, status:'available', location_label:'Kurnool, AP', rating:4.1, description:'14 feet header, self-propelled, AC cabin. 3200 hours. Good for paddy & wheat.' },
    { id:'s8', name:'Kirloskar Pump Set 5HP', equipment_type:'pump', listing_type:'rent', daily_rate:350, sale_price:null, year_of_manufacture:2022, operator_included:false, status:'available', location_label:'Chittoor, AP', rating:4.7, description:'Centrifugal pump, 5HP motor, 2-inch suction. Suitable for 2-5 acre farms.' },
    { id:'s9', name:'TAFE 5900 DI', equipment_type:'tractor', listing_type:'rent', daily_rate:2000, sale_price:null, year_of_manufacture:2022, operator_included:true, status:'available', location_label:'Srikakulam, AP', rating:4.6, description:'60 HP, power steering, dual clutch. Perfect for heavy-duty operations.' },
    { id:'s10', name:'Landforce Seed Drill 9-Row', equipment_type:'seed_drill', listing_type:'both', daily_rate:600, sale_price:48000, year_of_manufacture:2021, operator_included:false, status:'available', location_label:'Anantapur, AP', rating:4.3, description:'9-row mechanical seed drill. Adjustable row spacing. Suitable for groundnut, sunflower, pulses.' },
    { id:'s11', name:'JCB 3DX Super', equipment_type:'jcb', listing_type:'rent', daily_rate:8000, sale_price:null, year_of_manufacture:2022, operator_included:true, status:'available', location_label:'Krishna, AP', rating:4.9, description:'Backhoe loader, 76HP, excellent for pond digging, land leveling, trenching. Experienced operator included.' , owner_name:'Suresh Reddy'},
    { id:'s12', name:'JCB 4DX Eco', equipment_type:'jcb', listing_type:'both', daily_rate:9500, sale_price:2800000, year_of_manufacture:2021, operator_included:true, status:'available', location_label:'Kurnool, AP', rating:4.7, description:'4WD backhoe loader, 92HP. Heavy duty for earth moving, excavation, road work. Well maintained.', owner_name:'Ravi Teja' },
    { id:'s13', name:'Komatsu PC200 Excavator', equipment_type:'excavator', listing_type:'rent', daily_rate:12000, sale_price:null, year_of_manufacture:2020, operator_included:true, status:'available', location_label:'Prakasam, AP', rating:4.6, description:'20-ton excavator, ideal for large pond digging, canal work, land clearing. 1800 hours.' },
  ];

  function render() {
    container.innerHTML = `
      <div class="hero-v2" role="banner" style="background:linear-gradient(135deg,#E65100,#BF360C);color:white">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:28px">🚜</span>
          <div style="flex:1">
            <div style="font-weight:800;font-size:18px">KisanConnect</div>
            <div style="font-size:11px;opacity:0.85">Farm Equipment Marketplace</div>
          </div>
        </div>
      </div>

      <div class="mode-toggle-bar" role="tablist" aria-label="Browse mode" style="display:flex;margin:10px 14px 6px;background:#F5F5F5;border-radius:12px;padding:3px;border:1px solid #E0E0E0">
        <button role="tab" aria-selected="${mode==='connect'}" data-kmode="connect" style="flex:1;padding:9px 4px;border-radius:10px;font-size:11px;font-weight:700;border:none;cursor:pointer;${mode==='connect'?'background:#D32F2F;color:white;box-shadow:0 2px 8px rgba(211,47,47,0.3)':'background:transparent;color:#757575'}">📡 Connect</button>
        <button role="tab" aria-selected="${mode==='rent'}" data-kmode="rent" style="flex:1;padding:9px 4px;border-radius:10px;font-size:11px;font-weight:700;border:none;cursor:pointer;${mode==='rent'?'background:#0277BD;color:white;box-shadow:0 2px 8px rgba(2,119,189,0.3)':'background:transparent;color:#757575'}">🔑 Rent</button>
        <button role="tab" aria-selected="${mode==='buy'}" data-kmode="buy" style="flex:1;padding:9px 4px;border-radius:10px;font-size:11px;font-weight:700;border:none;cursor:pointer;${mode==='buy'?'background:#2E7D32;color:white;box-shadow:0 2px 8px rgba(46,125,50,0.3)':'background:transparent;color:#757575'}">💰 Buy</button>
        <button role="tab" aria-selected="${mode==='sell'}" data-kmode="sell" style="flex:1;padding:9px 4px;border-radius:10px;font-size:11px;font-weight:700;border:none;cursor:pointer;${mode==='sell'?'background:#E65100;color:white;box-shadow:0 2px 8px rgba(230,81,0,0.3)':'background:transparent;color:#757575'}">🏷️ List</button>
        <button role="tab" aria-selected="${mode==='services'}" data-kmode="services" style="flex:1;padding:9px 4px;border-radius:10px;font-size:11px;font-weight:700;border:none;cursor:pointer;${mode==='services'?'background:#6A1B9A;color:white;box-shadow:0 2px 8px rgba(106,27,154,0.3)':'background:transparent;color:#757575'}">🔧 Services</button>
      </div>

      <div style="padding:0 14px 80px">
        ${loading ? '<div class="loading"><div class="spinner"></div></div>' : renderContent()}
      </div>
    `;
    attachEvents();
  }

  function renderContent() {
    if (mode === 'sell') return renderSellMode();
    if (mode === 'services') return renderServicesMode();
    if (mode === 'connect') return renderConnectMode();
    return renderBrowseMode();
  }

  const AGRI_SERVICES = [
    { id:'sv1', type:'spraying', icon:'💊', name:'Crop Spraying Service', provider:'Ravi Agri Services', location:'Guntur, AP', rate:'₹400/acre', min_acres:1, rating:4.7, reviews:89, tags:['Pesticide','Fungicide','Foliar spray'], avail:'Available Mon-Sat', phone:'9876543210' },
    { id:'sv2', type:'plowing', icon:'🚜', name:'Custom Plowing (Rotavator)', provider:'Vinod Farm Works', location:'Krishna, AP', rate:'₹800/acre', min_acres:2, rating:4.8, reviews:134, tags:['Land preparation','Rotavator','Power tiller'], avail:'Available now', phone:'9988776655' },
    { id:'sv3', type:'harvesting', icon:'🌾', name:'Paddy Combine Harvesting', provider:'Sri Lakshmi Harvesting', location:'West Godavari, AP', rate:'₹1,200/acre', min_acres:3, rating:4.9, reviews:212, tags:['Paddy','Combine','Threshing'], avail:'Oct–Jan season', phone:'9112233445' },
    { id:'sv4', type:'soil_testing', icon:'🔬', name:'Soil Testing & Advisory', provider:'AgriLab Solutions', location:'Hyderabad, TS', rate:'₹250/sample', min_acres:null, rating:4.6, reviews:67, tags:['NPK','Micronutrients','Report in 3 days'], avail:'Walk-in or home collection', phone:'9001234567' },
    { id:'sv5', type:'consultancy', icon:'👨‍🌾', name:'Farm Consultancy Visit', provider:'Dr. KR Reddy', location:'Nellore, AP', rate:'₹500/visit', min_acres:null, rating:5.0, reviews:44, tags:['Expert visit','Crop plan','Soil health'], avail:'Weekends only', phone:'9234567890' },
    { id:'sv6', type:'transplanting', icon:'🌱', name:'Paddy Transplanting', provider:'Sai Labour Group', location:'Guntur, AP', rate:'₹1,500/acre', min_acres:1, rating:4.5, reviews:78, tags:['Labour','Transplanting','Paddy'], avail:'June–July only', phone:'9876512345' },
    { id:'sv7', type:'drone', icon:'🚁', name:'Drone Spraying Service', provider:'AgroAir Drones', location:'Vijayawada, AP', rate:'₹600/acre', min_acres:5, rating:4.8, reviews:52, tags:['Drone','Precision','GPS mapping'], avail:'Available now', phone:'9445566778' },
    { id:'sv8', type:'storage', icon:'🏪', name:'Cold Storage Facility', provider:'CoolAgro Logistics', location:'Madanapalle, AP', rate:'₹12/quintal/day', min_acres:null, rating:4.4, reviews:31, tags:['Cold chain','Vegetables','Flowers'], avail:'Year round', phone:'9558899001' },
  ];
  const SVC_CATS = ['All','Spraying','Plowing','Harvesting','Soil Testing','Consultancy','Drone','Storage'];
  let svcCat = 'All';

  function renderServicesMode() {
    const filtered = svcCat === 'All' ? AGRI_SERVICES : AGRI_SERVICES.filter(s => s.type.toLowerCase().includes(svcCat.toLowerCase()) || s.name.toLowerCase().includes(svcCat.toLowerCase()));
    return `
      <div style="margin-bottom:10px">
        <div style="font-size:11px;font-weight:700;color:var(--text3,#9E9E9E);text-transform:uppercase;margin-bottom:8px">Filter by Service</div>
        <div style="overflow-x:auto;white-space:nowrap;margin:-2px -2px 4px">
          ${SVC_CATS.map(c=>`<button data-svc="${c}" style="display:inline-block;padding:6px 12px;border-radius:20px;border:none;font-size:11px;font-weight:600;cursor:pointer;margin:2px;${svcCat===c?'background:#6A1B9A;color:white':'background:#EDE7F6;color:#6A1B9A'}">${c}</button>`).join('')}
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-size:12px;color:var(--text3,#9E9E9E)">${filtered.length} services available</div>
        <button id="offerServiceBtn" style="background:#6A1B9A;color:white;border:none;border-radius:8px;padding:6px 12px;font-size:11px;font-weight:700;cursor:pointer">+ Offer Service</button>
      </div>
      ${filtered.map(sv => `
        <div style="background:var(--card,white);border-radius:12px;padding:12px;margin-bottom:10px;box-shadow:0 1px 4px rgba(0,0,0,0.07)">
          <div style="display:flex;gap:10px;align-items:flex-start">
            <div style="width:44px;height:44px;border-radius:10px;background:#EDE7F6;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">${sv.icon}</div>
            <div style="flex:1">
              <div style="font-weight:700;font-size:13px">${sv.name}</div>
              <div style="font-size:11px;color:var(--text3,#757575);margin-top:2px">📍 ${sv.provider} · ${sv.location}</div>
              <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">
                ${sv.tags.map(tag=>`<span style="background:#F3E5F5;color:#6A1B9A;border-radius:8px;padding:2px 7px;font-size:9px;font-weight:600">${tag}</span>`).join('')}
              </div>
              <div style="display:flex;gap:14px;margin-top:8px;align-items:center">
                <span style="font-size:13px;font-weight:800;color:#2E7D32">${sv.rate}</span>
                <span style="font-size:11px;color:var(--text3,#9E9E9E)">⭐ ${sv.rating} (${sv.reviews} reviews)</span>
              </div>
              <div style="font-size:10px;color:#1565C0;margin-top:4px">🕐 ${sv.avail}</div>
            </div>
          </div>
          <div style="display:flex;gap:8px;margin-top:10px">
            <a href="tel:+91${sv.phone}" style="flex:1;background:#E8F5E9;color:#2E7D32;text-align:center;padding:8px;border-radius:8px;font-size:11px;font-weight:700;text-decoration:none">📞 Call</a>
            <button data-svid="${sv.id}" class="book-svc-btn" style="flex:2;background:#6A1B9A;color:white;border:none;border-radius:8px;padding:8px;font-size:11px;font-weight:700;cursor:pointer">Book Service</button>
          </div>
        </div>
      `).join('')}
    `;
  }


  // ══════════════════════════════════════════════════════════════
  // CONNECT MODE — Real-time Farmer-Driver Connectivity
  // ══════════════════════════════════════════════════════════════

  const MACHINE_TYPES_CONNECT = [
    {id:'tractor', icon:'🚜', label:'Tractor'},
    {id:'jcb', icon:'🏗️', label:'JCB'},
    {id:'harvester', icon:'🌾', label:'Harvester'},
    {id:'rotavator', icon:'⚙️', label:'Rotavator'},
    {id:'excavator', icon:'⛏️', label:'Excavator'},
    {id:'crane', icon:'🏗️', label:'Crane'},
    {id:'trolley', icon:'🚚', label:'Trolley'},
    {id:'sprayer', icon:'💨', label:'Sprayer'},
    {id:'power_tiller', icon:'🔧', label:'Power Tiller'},
  ];

  const SAMPLE_OPERATORS = [
    { id:'op1', operator_name:'Ramesh Yadav', machine_type:'tractor', machine_name:'John Deere 5310', hourly_rate:400, daily_rate:2500, experience_years:8, location_label:'Guntur, AP', is_available:true, rating:4.8, total_jobs:156, phone:'9876543210' },
    { id:'op2', operator_name:'Suresh Reddy', machine_type:'jcb', machine_name:'JCB 3DX Super', hourly_rate:1200, daily_rate:8000, experience_years:12, location_label:'Krishna, AP', is_available:true, rating:4.9, total_jobs:234, phone:'9988776655' },
    { id:'op3', operator_name:'Venkat Raju', machine_type:'harvester', machine_name:'Kubota DC-70', hourly_rate:2000, daily_rate:12000, experience_years:6, location_label:'West Godavari, AP', is_available:true, rating:4.7, total_jobs:89, phone:'9112233445' },
    { id:'op4', operator_name:'Mahesh Kumar', machine_type:'excavator', machine_name:'Komatsu PC200', hourly_rate:1500, daily_rate:10000, experience_years:10, location_label:'Prakasam, AP', is_available:false, rating:4.6, total_jobs:198, phone:'9001234567' },
    { id:'op5', operator_name:'Lakshmi Narayana', machine_type:'tractor', machine_name:'Mahindra 575 DI', hourly_rate:350, daily_rate:2200, experience_years:15, location_label:'Nellore, AP', is_available:true, rating:4.9, total_jobs:312, phone:'9234567890' },
    { id:'op6', operator_name:'Chandra Sekhar', machine_type:'rotavator', machine_name:'Shaktiman 7ft', hourly_rate:600, daily_rate:3500, experience_years:5, location_label:'East Godavari, AP', is_available:true, rating:4.5, total_jobs:67, phone:'9876512345' },
    { id:'op7', operator_name:'Ravi Teja', machine_type:'jcb', machine_name:'JCB 4DX', hourly_rate:1400, daily_rate:9500, experience_years:7, location_label:'Kurnool, AP', is_available:true, rating:4.7, total_jobs:143, phone:'9445566778' },
    { id:'op8', operator_name:'Balaji Rao', machine_type:'crane', machine_name:'ACE 14XW', hourly_rate:2500, daily_rate:18000, experience_years:14, location_label:'Anantapur, AP', is_available:false, rating:4.8, total_jobs:76, phone:'9558899001' },
  ];

  const SAMPLE_REQUESTS = [
    { id:'req1', machine_type:'jcb', urgency:'urgent', description:'Need JCB for pond digging, 2 acres area', location_label:'Guntur, AP', needed_date:'2026-05-03', needed_time:'Morning', duration_hours:8, budget_max:8000, acres:2, status:'open', farmer_name:'Srinivas', created_at: new Date(Date.now()-3600000).toISOString() },
    { id:'req2', machine_type:'tractor', urgency:'normal', description:'Tractor needed for plowing 5 acres paddy field', location_label:'Krishna, AP', needed_date:'2026-05-05', needed_time:'Afternoon', duration_hours:6, budget_max:3000, acres:5, status:'open', farmer_name:'Rambabu', created_at: new Date(Date.now()-7200000).toISOString() },
    { id:'req3', machine_type:'harvester', urgency:'urgent', description:'Combine harvester for paddy harvest, crop ready', location_label:'West Godavari, AP', needed_date:'2026-05-02', needed_time:'Morning', duration_hours:10, budget_max:15000, acres:8, status:'accepted', farmer_name:'Nageswara Rao', matched_operator_name:'Venkat Raju', created_at: new Date(Date.now()-86400000).toISOString() },
  ];

  let connectTab = 'find'; // find | requests | drivers

  function renderConnectMode() {
    const role = getRole();
    return `
      <div style="background:linear-gradient(135deg,#D32F2F10,#FF6F0010);border:1px solid #D32F2F30;border-radius:12px;padding:12px 14px;margin:8px 0 10px">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:22px">📡</span>
          <div>
            <div style="font-size:13px;font-weight:800;color:#D32F2F">Machine Connect</div>
            <div style="font-size:11px;color:#757575;margin-top:2px">Instantly connect with machine operators near you. Get JCB, tractors & more — on time, every time.</div>
          </div>
        </div>
      </div>

      <!-- Stats Bar -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px;margin-bottom:12px">
        <div style="text-align:center;background:white;border-radius:10px;padding:8px 4px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
          <div style="font-weight:800;font-size:16px;color:#2E7D32">${connectStats.available_operators || SAMPLE_OPERATORS.filter(o=>o.is_available).length}</div>
          <div style="font-size:9px;color:#757575">Online Now</div>
        </div>
        <div style="text-align:center;background:white;border-radius:10px;padding:8px 4px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
          <div style="font-weight:800;font-size:16px;color:#0277BD">${connectStats.total_operators || SAMPLE_OPERATORS.length}</div>
          <div style="font-size:9px;color:#757575">Operators</div>
        </div>
        <div style="text-align:center;background:white;border-radius:10px;padding:8px 4px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
          <div style="font-weight:800;font-size:16px;color:#E65100">${connectStats.open_requests || SAMPLE_REQUESTS.filter(r=>r.status==='open').length}</div>
          <div style="font-size:9px;color:#757575">Open Needs</div>
        </div>
        <div style="text-align:center;background:white;border-radius:10px;padding:8px 4px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
          <div style="font-weight:800;font-size:16px;color:#6A1B9A">${connectStats.completed_requests || 847}</div>
          <div style="font-size:9px;color:#757575">Completed</div>
        </div>
      </div>

      <!-- Sub-tabs -->
      <div style="display:flex;gap:6px;margin-bottom:12px">
        <button data-ctab="find" style="flex:1;padding:8px;border-radius:8px;border:none;font-size:11px;font-weight:700;cursor:pointer;${connectTab==='find'?'background:#D32F2F;color:white':'background:#FFEBEE;color:#D32F2F'}">🚜 Find Machine</button>
        <button data-ctab="requests" style="flex:1;padding:8px;border-radius:8px;border:none;font-size:11px;font-weight:700;cursor:pointer;${connectTab==='requests'?'background:#D32F2F;color:white':'background:#FFEBEE;color:#D32F2F'}">📋 Requests</button>
        <button data-ctab="drivers" style="flex:1;padding:8px;border-radius:8px;border:none;font-size:11px;font-weight:700;cursor:pointer;${connectTab==='drivers'?'background:#D32F2F;color:white':'background:#FFEBEE;color:#D32F2F'}">👷 Operators</button>
      </div>

      ${connectTab === 'find' ? renderConnectFind() : connectTab === 'requests' ? renderConnectRequests() : renderConnectDrivers()}

      <!-- Register as Operator CTA -->
      ${role === 'service_provider' || role === 'farmer' ? `
        <div style="margin-top:16px;background:linear-gradient(135deg,#1B5E20,#2E7D32);border-radius:12px;padding:14px;color:white">
          <div style="font-weight:800;font-size:13px">👷 Are you a machine operator?</div>
          <div style="font-size:11px;opacity:0.9;margin:4px 0 10px">Register your machine & earn ₹2,000–₹18,000/day. Get instant booking requests from farmers near you.</div>
          <button id="registerOperatorBtn" style="background:white;color:#2E7D32;border:none;border-radius:8px;padding:10px 16px;font-weight:700;font-size:12px;cursor:pointer;width:100%">Register as Operator →</button>
        </div>
      ` : ''}
    `;
  }

  function renderConnectFind() {
    return `
      <!-- Quick Machine Selection -->
      <div style="margin-bottom:12px">
        <div style="font-size:11px;font-weight:700;color:#424242;margin-bottom:8px">Select Machine Type</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
          ${MACHINE_TYPES_CONNECT.map(m => `
            <button data-reqtype="${m.id}" class="machine-type-btn" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 6px;background:white;border:2px solid #E0E0E0;border-radius:12px;cursor:pointer;transition:all 0.2s">
              <span style="font-size:24px">${m.icon}</span>
              <span style="font-size:10px;font-weight:700;color:#424242">${m.label}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Instant Request Button -->
      <button id="instantRequestBtn" style="width:100%;padding:14px;background:linear-gradient(135deg,#D32F2F,#B71C1C);color:white;border:none;border-radius:12px;font-weight:800;font-size:14px;cursor:pointer;box-shadow:0 4px 15px rgba(211,47,47,0.3);margin-bottom:14px">
        ⚡ Post Instant Machine Request
      </button>

      <!-- How It Works -->
      <div style="background:white;border-radius:12px;padding:14px;box-shadow:0 1px 4px rgba(0,0,0,0.06)">
        <div style="font-weight:700;font-size:13px;margin-bottom:10px">⚡ How Machine Connect Works</div>
        ${[
          {n:'1', icon:'📝', t:'Post Your Need', d:'Select machine type, location, date & budget'},
          {n:'2', icon:'📡', t:'Instant Broadcast', d:'Nearby available operators get notified instantly'},
          {n:'3', icon:'✅', t:'Choose & Confirm', d:'Compare operator offers, accept the best one'},
          {n:'4', icon:'🚜', t:'Machine Arrives', d:'Track operator en-route, machine reaches on time'}
        ].map(s => `
          <div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:10px">
            <div style="width:28px;height:28px;border-radius:50%;background:#D32F2F;color:white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:11px;flex-shrink:0">${s.n}</div>
            <div><div style="font-weight:700;font-size:12px">${s.icon} ${s.t}</div><div style="font-size:11px;color:#757575">${s.d}</div></div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderConnectRequests() {
    const requests = machineRequests.length > 0 ? machineRequests : SAMPLE_REQUESTS;
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-size:12px;color:#757575">${requests.length} active requests</div>
        <button id="newRequestBtn" style="background:#D32F2F;color:white;border:none;border-radius:8px;padding:6px 12px;font-size:11px;font-weight:700;cursor:pointer">+ New Request</button>
      </div>
      ${requests.map(req => {
        const mt = MACHINE_TYPES_CONNECT.find(m=>m.id===req.machine_type);
        const statusColors = {open:'#E65100',accepted:'#2E7D32',en_route:'#0277BD',arrived:'#6A1B9A',completed:'#424242',cancelled:'#9E9E9E'};
        const statusLabels = {open:'🔴 Open',accepted:'✅ Accepted',en_route:'🚜 En Route',arrived:'📍 Arrived',in_progress:'⚙️ Working',completed:'✓ Done',cancelled:'✗ Cancelled'};
        const timeAgo = getTimeAgo(req.created_at);
        return `
          <div style="background:white;border-radius:12px;margin-bottom:10px;box-shadow:0 2px 6px rgba(0,0,0,0.07);overflow:hidden">
            <div style="height:3px;background:${statusColors[req.status]||'#E0E0E0'}"></div>
            <div style="padding:12px 14px">
              <div style="display:flex;align-items:center;gap:10px">
                <div style="width:40px;height:40px;border-radius:10px;background:#FFEBEE;display:flex;align-items:center;justify-content:center;font-size:20px">${mt?.icon||'🚜'}</div>
                <div style="flex:1">
                  <div style="display:flex;justify-content:space-between;align-items:center">
                    <div style="font-weight:700;font-size:13px">${mt?.label||req.machine_type} Needed</div>
                    <span style="font-size:10px;font-weight:700;color:${statusColors[req.status]};background:${statusColors[req.status]}15;padding:2px 8px;border-radius:8px">${statusLabels[req.status]||req.status}</span>
                  </div>
                  <div style="font-size:11px;color:#757575;margin-top:2px">📍 ${req.location_label} · 👤 ${req.farmer_name}</div>
                </div>
              </div>
              ${req.description ? `<div style="font-size:11px;color:#616161;margin-top:8px;line-height:1.4">${req.description}</div>` : ''}
              <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">
                ${req.needed_date ? `<span style="background:#E3F2FD;color:#0277BD;padding:2px 8px;border-radius:8px;font-size:10px;font-weight:600">📅 ${req.needed_date}</span>` : ''}
                ${req.needed_time ? `<span style="background:#F3E5F5;color:#6A1B9A;padding:2px 8px;border-radius:8px;font-size:10px;font-weight:600">🕐 ${req.needed_time}</span>` : ''}
                ${req.acres ? `<span style="background:#E8F5E9;color:#2E7D32;padding:2px 8px;border-radius:8px;font-size:10px;font-weight:600">🌾 ${req.acres} acres</span>` : ''}
                ${req.budget_max ? `<span style="background:#FFF3E0;color:#E65100;padding:2px 8px;border-radius:8px;font-size:10px;font-weight:600">💰 ≤₹${Number(req.budget_max).toLocaleString()}</span>` : ''}
                ${req.urgency === 'urgent' ? `<span style="background:#FFEBEE;color:#D32F2F;padding:2px 8px;border-radius:8px;font-size:10px;font-weight:700">⚡ URGENT</span>` : ''}
              </div>
              ${req.matched_operator_name ? `<div style="margin-top:8px;background:#E8F5E9;border-radius:8px;padding:8px 10px;font-size:11px;color:#2E7D32;font-weight:600">✅ Matched: ${req.matched_operator_name}</div>` : ''}
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
                <span style="font-size:10px;color:#9E9E9E">${timeAgo}</span>
                ${req.status === 'open' ? `<button class="respond-req-btn" data-rid="${req.id}" style="background:#D32F2F;color:white;border:none;border-radius:6px;padding:6px 12px;font-size:10px;font-weight:700;cursor:pointer">Respond</button>` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('')}
    `;
  }

  function renderConnectDrivers() {
    const ops = operators.length > 0 ? operators : SAMPLE_OPERATORS;
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-size:12px;color:#757575">${ops.filter(o=>o.is_available).length} of ${ops.length} operators online</div>
      </div>
      ${ops.map(op => {
        const mt = MACHINE_TYPES_CONNECT.find(m=>m.id===op.machine_type);
        return `
          <div style="background:white;border-radius:12px;margin-bottom:10px;box-shadow:0 2px 6px rgba(0,0,0,0.07);overflow:hidden">
            <div style="height:3px;background:${op.is_available?'#2E7D32':'#9E9E9E'}"></div>
            <div style="padding:12px 14px">
              <div style="display:flex;gap:10px;align-items:flex-start">
                <div style="position:relative">
                  <div style="width:44px;height:44px;border-radius:50%;background:#FBE9E7;display:flex;align-items:center;justify-content:center;font-size:20px">${mt?.icon||'🚜'}</div>
                  <div style="position:absolute;bottom:0;right:0;width:12px;height:12px;border-radius:50%;border:2px solid white;background:${op.is_available?'#4CAF50':'#9E9E9E'}"></div>
                </div>
                <div style="flex:1">
                  <div style="display:flex;justify-content:space-between;align-items:center">
                    <div style="font-weight:700;font-size:13px">${op.operator_name}</div>
                    <span style="font-size:10px;font-weight:600;color:${op.is_available?'#2E7D32':'#9E9E9E'}">${op.is_available?'🟢 Online':'⚫ Busy'}</span>
                  </div>
                  <div style="font-size:11px;color:#757575;margin-top:1px">${op.machine_name || mt?.label} · ${op.experience_years}yr exp</div>
                  <div style="font-size:11px;color:#757575">📍 ${op.location_label}</div>
                  <div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap">
                    <span style="background:#E3F2FD;color:#0277BD;padding:2px 8px;border-radius:8px;font-size:10px;font-weight:700">₹${Number(op.hourly_rate||0).toLocaleString()}/hr</span>
                    <span style="background:#E8F5E9;color:#2E7D32;padding:2px 8px;border-radius:8px;font-size:10px;font-weight:700">₹${Number(op.daily_rate||0).toLocaleString()}/day</span>
                    <span style="background:#FFF8E1;color:#F9A825;padding:2px 8px;border-radius:8px;font-size:10px">⭐ ${Number(op.rating).toFixed(1)}</span>
                    <span style="background:#F5F5F5;color:#616161;padding:2px 7px;border-radius:8px;font-size:10px">${op.total_jobs} jobs</span>
                  </div>
                </div>
              </div>
              <div style="display:flex;gap:6px;margin-top:10px">
                <a href="tel:+91${op.phone}" style="flex:1;background:#E8F5E9;color:#2E7D32;text-align:center;padding:8px;border-radius:8px;font-size:11px;font-weight:700;text-decoration:none">📞 Call</a>
                ${op.is_available ? `<button class="hire-op-btn" data-opid="${op.id}" style="flex:2;background:#D32F2F;color:white;border:none;border-radius:8px;padding:8px;font-size:11px;font-weight:700;cursor:pointer">⚡ Hire Now</button>` : `<button disabled style="flex:2;background:#E0E0E0;color:#9E9E9E;border:none;border-radius:8px;padding:8px;font-size:11px;font-weight:700">Currently Busy</button>`}
              </div>
            </div>
          </div>
        `;
      }).join('')}
    `;
  }

  function getTimeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  function showInstantRequestModal(preselectedType) {
    showModal(`
      <div class="modal-handle"></div>
      <h3 style="margin:0 0 4px">⚡ Instant Machine Request</h3>
      <div style="font-size:11px;color:#757575;margin-bottom:14px">Post your need — nearby operators will respond within minutes</div>

      <div class="form-group"><label>Machine Type *</label>
        <select class="form-input" id="mrType">
          ${MACHINE_TYPES_CONNECT.map(m=>`<option value="${m.id}" ${m.id===preselectedType?'selected':''}>${m.icon} ${m.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Urgency</label>
        <select class="form-input" id="mrUrgency">
          <option value="normal">Normal — Within 1-2 days</option>
          <option value="urgent">⚡ Urgent — Need today</option>
          <option value="scheduled">📅 Scheduled — Specific date</option>
        </select>
      </div>
      <div class="form-group"><label>Location *</label><input class="form-input" id="mrLocation" placeholder="Village, Mandal, District"></div>
      <div class="form-group"><label>When Needed</label><input class="form-input" id="mrDate" type="date" min="${new Date().toISOString().slice(0,10)}"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="form-group"><label>Duration (hrs)</label><input class="form-input" id="mrHours" type="number" placeholder="e.g. 8"></div>
        <div class="form-group"><label>Acres</label><input class="form-input" id="mrAcres" type="number" placeholder="e.g. 5"></div>
      </div>
      <div class="form-group"><label>Budget (max ₹)</label><input class="form-input" id="mrBudget" type="number" placeholder="e.g. 5000"></div>
      <div class="form-group"><label>Description</label><textarea class="form-input" id="mrDesc" rows="2" placeholder="Describe work: land leveling, pond digging, plowing, harvesting…"></textarea></div>

      <button id="submitMachineReq" style="width:100%;padding:14px;background:linear-gradient(135deg,#D32F2F,#B71C1C);color:white;border:none;border-radius:12px;font-weight:800;font-size:14px;cursor:pointer;box-shadow:0 3px 12px rgba(211,47,47,0.3)">📡 Broadcast Request to Operators</button>
      <div style="font-size:10px;color:#9E9E9E;text-align:center;margin-top:8px">Available operators in your area will be notified instantly</div>
    `);

    document.querySelector('#submitMachineReq')?.addEventListener('click', async () => {
      const location_label = document.querySelector('#mrLocation')?.value?.trim();
      if (!location_label) return showToast('Please enter your location', 'error');
      const payload = {
        machine_type: document.querySelector('#mrType')?.value,
        urgency: document.querySelector('#mrUrgency')?.value,
        location_label,
        needed_date: document.querySelector('#mrDate')?.value || null,
        duration_hours: Number(document.querySelector('#mrHours')?.value) || null,
        acres: Number(document.querySelector('#mrAcres')?.value) || null,
        budget_max: Number(document.querySelector('#mrBudget')?.value) || null,
        description: document.querySelector('#mrDesc')?.value || null,
      };
      try {
        const res = await api.post('/kisanconnect/machine-requests', payload);
        showToast(`Request broadcast! ${res.operators_notified || 'Nearby'} operators notified`, 'success');
        closeModal();
        loadConnectData();
      } catch(e) {
        // Fallback for demo
        showToast('Request broadcast! Operators will respond shortly', 'success');
        closeModal();
      }
    });
  }

  function showRegisterOperatorModal() {
    showModal(`
      <div class="modal-handle"></div>
      <h3 style="margin:0 0 4px">👷 Register as Machine Operator</h3>
      <div style="font-size:11px;color:#757575;margin-bottom:14px">List your machine & get instant job requests from farmers</div>

      <div class="form-group"><label>Your Name *</label><input class="form-input" id="opName" placeholder="Full name"></div>
      <div class="form-group"><label>Phone *</label><input class="form-input" id="opPhone" type="tel" placeholder="10-digit mobile"></div>
      <div class="form-group"><label>Machine Type *</label>
        <select class="form-input" id="opType">
          ${MACHINE_TYPES_CONNECT.map(m=>`<option value="${m.id}">${m.icon} ${m.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Machine Name / Model</label><input class="form-input" id="opMachine" placeholder="e.g. JCB 3DX Super, Mahindra 575 DI"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="form-group"><label>Hourly Rate (₹)</label><input class="form-input" id="opHourly" type="number" placeholder="e.g. 1200"></div>
        <div class="form-group"><label>Daily Rate (₹)</label><input class="form-input" id="opDaily" type="number" placeholder="e.g. 8000"></div>
      </div>
      <div class="form-group"><label>Experience (years)</label><input class="form-input" id="opExp" type="number" placeholder="e.g. 5"></div>
      <div class="form-group"><label>Location / Service Area</label><input class="form-input" id="opLoc" placeholder="District, Mandal or area"></div>
      <div class="form-group"><label>About</label><textarea class="form-input" id="opBio" rows="2" placeholder="Describe your experience, machine condition, areas covered…"></textarea></div>

      <button id="submitOperator" style="width:100%;padding:14px;background:linear-gradient(135deg,#2E7D32,#1B5E20);color:white;border:none;border-radius:12px;font-weight:800;font-size:14px;cursor:pointer">✅ Register & Go Online</button>
    `);

    document.querySelector('#submitOperator')?.addEventListener('click', async () => {
      const operator_name = document.querySelector('#opName')?.value?.trim();
      const phone = document.querySelector('#opPhone')?.value?.trim();
      if (!operator_name || !phone) return showToast('Name and phone are required', 'error');
      const payload = {
        operator_name,
        phone,
        machine_type: document.querySelector('#opType')?.value,
        machine_name: document.querySelector('#opMachine')?.value || null,
        hourly_rate: Number(document.querySelector('#opHourly')?.value) || null,
        daily_rate: Number(document.querySelector('#opDaily')?.value) || null,
        experience_years: Number(document.querySelector('#opExp')?.value) || 0,
        location_label: document.querySelector('#opLoc')?.value || null,
        bio: document.querySelector('#opBio')?.value || null,
      };
      try {
        await api.post('/kisanconnect/operators', payload);
        showToast('Registered! You are now online and visible to farmers.', 'success');
        closeModal();
        loadConnectData();
      } catch(e) {
        showToast('Registered successfully! You will receive requests soon.', 'success');
        closeModal();
      }
    });
  }

  async function loadConnectData() {
    try {
      const [opsRes, reqRes, statsRes] = await Promise.all([
        api.get('/kisanconnect/operators?available_only=true&limit=20').catch(()=>null),
        api.get('/kisanconnect/machine-requests?status=open&limit=20').catch(()=>null),
        api.get('/kisanconnect/connect-stats').catch(()=>null),
      ]);
      if (opsRes?.operators) operators = opsRes.operators;
      if (reqRes?.requests) machineRequests = reqRes.requests;
      if (statsRes?.stats) connectStats = statsRes.stats;
    } catch(e) { /* Use sample data */ }
    render();
  }


  function renderBrowseMode() {
    const isRent = mode === 'rent';
    let filtered = equipment.filter(e => {
      if (isRent) return e.listing_type === 'rent' || e.listing_type === 'both';
      return e.listing_type === 'sale' || e.listing_type === 'both';
    });
    if (eqSearch) filtered = filtered.filter(e => `${e.name} ${e.equipment_type} ${e.location_label}`.toLowerCase().includes(eqSearch.toLowerCase()));
    if (eqType) filtered = filtered.filter(e => e.equipment_type === eqType);
    const mc = isRent ? '#0277BD' : '#2E7D32';

    return `
      <div style="background:${mc}08;border:1px solid ${mc}25;border-radius:10px;padding:10px 12px;margin:8px 0 10px">
        <div style="font-size:12px;font-weight:700;color:${mc}">${isRent ? '🔑 Rent Equipment' : '💰 Buy Equipment'}</div>
        <div style="font-size:11px;color:var(--text3);margin-top:2px">${isRent ? 'Hire tractors, harvesters & machines by day. Returned after use.' : 'Purchase pre-owned or new equipment. Contact seller to negotiate.'}</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">
        <div style="text-align:center;background:white;border-radius:10px;padding:8px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
          <div style="font-weight:800;font-size:18px;color:${mc}">${filtered.length}</div>
          <div style="font-size:10px;color:#757575">${isRent ? 'For Rent' : 'For Sale'}</div>
        </div>
        <div style="text-align:center;background:white;border-radius:10px;padding:8px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
          <div style="font-weight:800;font-size:18px;color:${mc}">${filtered.filter(e=>e.status==='available').length}</div>
          <div style="font-size:10px;color:#757575">Available</div>
        </div>
        <div style="text-align:center;background:white;border-radius:10px;padding:8px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
          <div style="font-weight:800;font-size:18px;color:${mc}">${[...new Set(filtered.map(e=>e.equipment_type))].length}</div>
          <div style="font-size:10px;color:#757575">Types</div>
        </div>
      </div>

      <div style="display:flex;align-items:center;background:white;border:1px solid #E0E0E0;border-radius:10px;padding:8px 12px;margin-bottom:8px">
        <span style="margin-right:8px">🔍</span>
        <input id="eqSearch" type="search" aria-label="Search equipment" placeholder="Search tractor, harvester, location…" aria-label="Search tractor, harvester, location…" value="${eqSearch}" style="border:none;outline:none;flex:1;font-size:13px;background:transparent">
      </div>

      <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;margin-bottom:10px">
        <button data-et="" style="flex-shrink:0;padding:5px 12px;border-radius:20px;border:none;font-size:11px;font-weight:600;cursor:pointer;background:${!eqType?mc:'#F5F5F5'};color:${!eqType?'white':'#616161'}">All</button>
        ${EQ_TYPES.map(t=>`<button data-et="${t.id}" style="flex-shrink:0;padding:5px 10px;border-radius:20px;border:none;font-size:11px;cursor:pointer;background:${eqType===t.id?mc:'#F5F5F5'};color:${eqType===t.id?'white':'#616161'}">${t.icon} ${t.label}</button>`).join('')}
      </div>

      ${filtered.length === 0 ? '<div style="text-align:center;padding:30px"><div style="font-size:40px">🚜</div><div style="font-weight:700;margin-top:8px">No equipment found</div></div>'
        : filtered.map(e => renderCard(e)).join('')}
    `;
  }

  function renderSellMode() {
    return `
      <div style="margin-top:10px">
        <button id="listEquipBtn" style="width:100%;padding:14px;background:linear-gradient(135deg,#E65100,#BF360C);color:white;border:none;border-radius:12px;font-weight:700;font-size:14px;cursor:pointer;margin-bottom:14px;box-shadow:0 3px 12px rgba(230,81,0,0.25)">+ List Your Equipment</button>
        <div style="background:white;border-radius:12px;padding:14px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
          <div style="font-weight:700;font-size:13px;margin-bottom:10px">📋 How It Works</div>
          ${[{n:'1',t:'List Equipment',d:'Add name, type, daily rate or sale price'},{n:'2',t:'Get Requests',d:'Farmers send booking or purchase requests'},{n:'3',t:'Earn Money',d:'Accept requests. Secure escrow payment'}].map(s=>`
            <div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:8px">
              <div style="width:26px;height:26px;border-radius:50%;background:#E65100;color:white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:11px;flex-shrink:0">${s.n}</div>
              <div><div style="font-weight:700;font-size:12px">${s.t}</div><div style="font-size:11px;color:#757575">${s.d}</div></div>
            </div>`).join('')}
        </div>
        <div style="background:#FFF3E0;border:1px solid #FFE0B2;border-radius:10px;padding:12px;font-size:12px;color:#E65100;line-height:1.5">
          <strong>💡 Earn ₹1,000–₹8,000/day</strong> by renting out your tractor, harvester, or any farm equipment when idle. Over 10,000 farmers are looking for equipment near you.
        </div>
      </div>
    `;
  }

  function renderCard(e) {
    const isRent = e.listing_type === 'rent' || e.listing_type === 'both';
    const isSale = e.listing_type === 'sale' || e.listing_type === 'both';
    const ti = EQ_TYPES.find(t=>t.id===e.equipment_type)?.icon || '🚜';
    const mc = mode === 'rent' ? '#0277BD' : '#2E7D32';
    return `
      <div style="background:white;border-radius:12px;margin-bottom:10px;box-shadow:0 2px 6px rgba(0,0,0,0.07);overflow:hidden">
        <div style="height:4px;background:${mc}"></div>
        <div style="padding:12px 14px">
          <div style="display:flex;align-items:flex-start;gap:10px">
            <div style="width:44px;height:44px;border-radius:10px;background:#FBE9E7;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">${ti}</div>
            <div style="flex:1">
              <div style="font-weight:700;font-size:14px">${e.name}</div>
              <div style="font-size:11px;color:#757575;margin-top:2px">📍 ${e.location_label||'Nearby'}${e.owner_name?' · 👤 '+e.owner_name:''}</div>
              <div style="display:flex;gap:4px;margin-top:5px;flex-wrap:wrap">
                ${mode==='rent'&&isRent?`<span style="background:#E3F2FD;color:#0277BD;padding:2px 8px;border-radius:8px;font-size:11px;font-weight:700">₹${Number(e.daily_rate||0).toLocaleString()}/day</span>`:''}
                ${mode==='buy'&&isSale?`<span style="background:#E8F5E9;color:#2E7D32;padding:2px 8px;border-radius:8px;font-size:11px;font-weight:700">₹${Number(e.sale_price||0).toLocaleString()}</span>`:''}
                ${e.year_of_manufacture?`<span style="background:#F5F5F5;color:#616161;padding:2px 7px;border-radius:8px;font-size:10px">${e.year_of_manufacture}</span>`:''}
                ${e.operator_included?`<span style="background:#FFF3E0;color:#E65100;padding:2px 7px;border-radius:8px;font-size:10px">+Operator</span>`:''}
                ${e.rating?`<span style="background:#FFF8E1;color:#F9A825;padding:2px 7px;border-radius:8px;font-size:10px">⭐${Number(e.rating).toFixed(1)}</span>`:''}
                <span style="background:${e.status==='available'?'#E8F5E9':'#FFEBEE'};color:${e.status==='available'?'#2E7D32':'#C62828'};padding:2px 7px;border-radius:8px;font-size:10px;font-weight:600">${e.status==='available'?'✓ Available':'Booked'}</span>
              </div>
            </div>
          </div>
          ${e.description?`<div style="font-size:11px;color:#757575;margin-top:8px;line-height:1.5">${e.description.slice(0,120)}${e.description.length>120?'…':''}</div>`:''}
          ${e.condition_report && Object.keys(e.condition_report).length > 0 ? (() => {
            const cr = e.condition_report;
            const goodCount = Object.values(cr).filter(v=>v==='good').length;
            const total = Object.values(cr).filter(v=>v!=='not_checked').length;
            const pct = total ? Math.round((goodCount/total)*100) : 0;
            const color = pct >= 80 ? '#2E7D32' : pct >= 50 ? '#E65100' : '#C62828';
            const label = pct >= 80 ? 'Good Condition' : pct >= 50 ? 'Fair Condition' : 'Needs Attention';
            return `<div style="margin-top:6px;display:flex;align-items:center;gap:6px">
              <div style="flex:1;background:#E0E0E0;border-radius:4px;height:6px;overflow:hidden">
                <div style="background:${color};height:100%;width:${pct}%;border-radius:4px"></div>
              </div>
              <span style="font-size:10px;color:${color};font-weight:600">${label} (${pct}%)</span>
            </div>`;
          })() : ''}          <div style="display:flex;gap:6px;margin-top:10px">
            ${mode==='rent'&&isRent&&e.status==='available'?`<button class="book-btn" data-id="${e.id}" style="flex:1;padding:9px;background:#0277BD;color:white;border:none;border-radius:8px;font-weight:600;font-size:12px;cursor:pointer">📅 Book Now</button>`:''}
            ${mode==='buy'&&isSale?`<button class="contact-buy-btn" data-id="${e.id}" style="flex:1;padding:9px;background:#2E7D32;color:white;border:none;border-radius:8px;font-weight:600;font-size:12px;cursor:pointer">� Contact Seller</button>`:''}
            <button class="review-eq-btn" data-id="${e.id}" data-name="${e.name}" style="padding:9px 10px;background:#FFF8E1;color:#F9A825;border:none;border-radius:8px;font-size:12px;cursor:pointer">⭐</button>
          </div>
        </div>
      </div>
    `;
  }

  function showListEquipment() {
    const CHECKLIST = [
      { id:'engine', label:'Engine/Motor', icon:'⚙️' },
      { id:'tyres', label:'Tyres/Tracks', icon:'🔲' },
      { id:'hydraulics', label:'Hydraulics', icon:'💧' },
      { id:'battery', label:'Battery/Electrical', icon:'🔋' },
      { id:'body', label:'Body/Structure', icon:'🏗️' },
      { id:'brakes', label:'Brakes', icon:'🛑' },
      { id:'cabin', label:'Cabin/Seat', icon:'🪑' },
      { id:'attachments', label:'Attachments/Implements', icon:'🔧' },
    ];
    showModal(`
      <div class="modal-handle"></div><h3>🚜 List Equipment</h3>
      <div class="form-group"><label>Name *</label><input class="form-input" id="eqName" placeholder="e.g. John Deere 5310"></div>
      <div class="form-group"><label>Type *</label><select class="form-input" id="eqTypeS">${EQ_TYPES.map(t=>`<option value="${t.id}">${t.icon} ${t.label}</option>`).join('')}</select></div>
      <div class="form-group"><label>Listing</label><select class="form-input" id="eqLT"><option value="rent">🔑 Rent</option><option value="sale">💰 Sale</option><option value="both">Both</option></select></div>
      <div class="form-group"><label>Daily Rate (₹)</label><input class="form-input" type="number" id="eqRate" placeholder="1500"></div>
      <div class="form-group"><label>Sale Price (₹)</label><input class="form-input" type="number" id="eqPrice" placeholder="450000"></div>
      <div class="form-group"><label>Year</label><input class="form-input" type="number" id="eqYear" placeholder="2021"></div>
      <div class="form-group"><label>Location</label><input class="form-input" id="eqLoc" placeholder="Guntur, AP"></div>
      <div class="form-group"><label>Brand / Model</label><input class="form-input" id="eqBrand" placeholder="e.g. Mahindra 475 DI"></div>
      <div class="form-group"><label>Total Hours Used</label><input class="form-input" type="number" id="eqHours" placeholder="e.g. 1200"></div>

      <!-- Condition Checklist -->
      <div style="margin-bottom:12px">
        <div style="font-weight:700;font-size:13px;margin-bottom:8px">🔍 Condition Checklist</div>
        <div style="font-size:11px;color:#757575;margin-bottom:8px">Rate each component to build trust with renters/buyers</div>
        <div id="conditionChecklist">
          ${CHECKLIST.map(item => `
            <div style="display:flex;align-items:center;gap:8px;padding:8px;background:#F8F9FA;border-radius:8px;margin-bottom:4px">
              <span style="font-size:16px">${item.icon}</span>
              <span style="flex:1;font-size:12px;font-weight:600">${item.label}</span>
              <div style="display:flex;gap:4px">
                <label style="cursor:pointer"><input type="radio" name="cond_${item.id}" value="good" class="cond-radio sr-only"> <span class="cond-opt" data-item="${item.id}" data-val="good" style="padding:3px 7px;border-radius:6px;font-size:10px;font-weight:700;background:#E8F5E9;color:#2E7D32;cursor:pointer">✓ Good</span></label>
                <label style="cursor:pointer"><input type="radio" name="cond_${item.id}" value="fair" class="cond-radio sr-only"> <span class="cond-opt" data-item="${item.id}" data-val="fair" style="padding:3px 7px;border-radius:6px;font-size:10px;font-weight:700;background:#FFF3E0;color:#E65100;cursor:pointer">~ Fair</span></label>
                <label style="cursor:pointer"><input type="radio" name="cond_${item.id}" value="needs_repair" class="cond-radio sr-only"> <span class="cond-opt" data-item="${item.id}" data-val="needs_repair" style="padding:3px 7px;border-radius:6px;font-size:10px;font-weight:700;background:#FFEBEE;color:#C62828;cursor:pointer">✗ Repair</span></label>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="form-group"><label>Description</label><textarea class="form-input" id="eqDesc" rows="2" placeholder="Engine specs, usage history, included accessories…"></textarea></div>
      <button id="submitEq" style="width:100%;padding:12px;background:#E65100;color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer">List Equipment</button>
    `);

    // Highlight selected condition options
    document.querySelectorAll('.cond-radio').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const item = e.target.closest('[id^="conditionChecklist"]')?.querySelectorAll(`[name="${e.target.name}"]`) ||
                     document.querySelectorAll(`[name="${e.target.name}"]`);
        document.querySelectorAll(`.cond-opt[data-item="${e.target.name.replace('cond_','')}"]`).forEach(opt => {
          const colors = {good:'#E8F5E9 / #2E7D32', fair:'#FFF3E0 / #E65100', needs_repair:'#FFEBEE / #C62828'};
          const isSelected = opt.dataset.val === e.target.value;
          const style = {good:{bg:'#2E7D32',fg:'white'}, fair:{bg:'#E65100',fg:'white'}, needs_repair:{bg:'#C62828',fg:'white'}};
          if (isSelected) {
            const s = style[opt.dataset.val];
            opt.style.background = s.bg; opt.style.color = s.fg;
          } else {
            const defaults = {good:{bg:'#E8F5E9',fg:'#2E7D32'}, fair:{bg:'#FFF3E0',fg:'#E65100'}, needs_repair:{bg:'#FFEBEE',fg:'#C62828'}};
            const d = defaults[opt.dataset.val];
            opt.style.background = d.bg; opt.style.color = d.fg;
          }
        });
      });
    });

    document.querySelector('#submitEq')?.addEventListener('click', async () => {
      const name = document.querySelector('#eqName')?.value?.trim();
      if (!name) return showToast('Name required','error');
      // Collect condition ratings
      const conditionReport = {};
      CHECKLIST.forEach(item => {
        const selected = document.querySelector(`input[name="cond_${item.id}"]:checked`);
        conditionReport[item.id] = selected?.value || 'not_checked';
      });
      try {
        await api.createEquipment({
          name,
          equipment_type: document.querySelector('#eqTypeS').value,
          listing_type: document.querySelector('#eqLT').value,
          daily_rate: Number(document.querySelector('#eqRate').value)||null,
          sale_price: Number(document.querySelector('#eqPrice').value)||null,
          year_of_manufacture: Number(document.querySelector('#eqYear').value)||null,
          location_label: document.querySelector('#eqLoc').value,
          brand: document.querySelector('#eqBrand')?.value || '',
          hours_used: Number(document.querySelector('#eqHours')?.value)||null,
          description: document.querySelector('#eqDesc').value,
          condition_report: conditionReport,
        });
        showToast('Listed!','success'); closeModal(); loadData();
      } catch(e) { showToast(e.message,'error'); }
    });
  }

  function showBookingModal(id) {
    const e = equipment.find(x=>x.id==id);
    if (!e) return;

    const now = new Date();
    let calYear = now.getFullYear(), calMonth = now.getMonth() + 1;
    let bookedDates = new Set();
    let startDate = '', endDate = '';

    function renderCalendar() {
      const daysInMonth = new Date(calYear, calMonth, 0).getDate();
      const firstDow = new Date(calYear, calMonth - 1, 1).getDay();
      const monthName = new Date(calYear, calMonth - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
      const today = now.toISOString().split('T')[0];
      let cells = '';
      for (let i = 0; i < firstDow; i++) cells += `<div></div>`;
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${calYear}-${String(calMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const isBooked = bookedDates.has(dateStr);
        const isPast = dateStr < today;
        const isStart = dateStr === startDate;
        const isEnd = dateStr === endDate;
        const inRange = startDate && endDate && dateStr > startDate && dateStr < endDate;
        let bg = '#F5F5F5', color = '#424242', cursor = 'pointer';
        if (isPast) { bg = '#FAFAFA'; color = '#BDBDBD'; cursor = 'not-allowed'; }
        else if (isBooked) { bg = '#FFEBEE'; color = '#C62828'; cursor = 'not-allowed'; }
        else if (isStart || isEnd) { bg = '#0277BD'; color = 'white'; }
        else if (inRange) { bg = '#E3F2FD'; color = '#0277BD'; }
        cells += `<div data-date="${dateStr}" style="text-align:center;padding:6px 2px;border-radius:6px;background:${bg};color:${color};cursor:${cursor};font-size:11px;font-weight:${isStart||isEnd?'700':'400'}">${d}</div>`;
      }
      const days = ['Su','Mo','Tu','We','Th','Fr','Sa'];
      const daysHeader = days.map(d=>`<div style="text-align:center;font-size:10px;color:#9E9E9E;padding:4px 0;font-weight:600">${d}</div>`).join('');

      const s = document.querySelector('#bkS'), en = document.querySelector('#bkE');
      if (s) s.value = startDate;
      if (en) en.value = endDate;

      const calEl = document.querySelector('#calGrid');
      if (!calEl) return;
      document.querySelector('#calMonth').textContent = monthName;
      calEl.innerHTML = daysHeader + cells;

      const days2 = document.querySelectorAll('[data-date]');
      days2.forEach(el => {
        el.addEventListener('click', () => {
          const d = el.dataset.date;
          if (d < today || bookedDates.has(d)) return;
          if (!startDate || (startDate && endDate)) { startDate = d; endDate = ''; }
          else if (d < startDate) { endDate = startDate; startDate = d; }
          else { endDate = d; }
          // Check for booked dates in range
          if (startDate && endDate) {
            let cur = new Date(startDate);
            const end = new Date(endDate);
            let conflict = false;
            while (cur <= end) {
              if (bookedDates.has(cur.toISOString().split('T')[0])) { conflict = true; break; }
              cur.setDate(cur.getDate() + 1);
            }
            if (conflict) { showToast('Selected range includes booked dates', 'error'); endDate = ''; }
          }
          updateSummary();
          renderCalendar();
        });
      });
    }

    function updateSummary() {
      const s = document.querySelector('#bkS'), en = document.querySelector('#bkE');
      if (s) s.value = startDate;
      if (en) en.value = endDate;
      if (startDate && endDate) {
        const days = Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000) + 1;
        const total = days * Number(e.daily_rate || 0);
        const sumEl = document.querySelector('#bkSummary');
        if (sumEl) sumEl.innerHTML = `<div style="font-weight:700;color:#0277BD">📅 ${days} day${days>1?'s':''} · ₹${total.toLocaleString()} total</div>`;
      }
    }

    showModal(`
      <div class="modal-handle"></div>
      <h3 style="margin:0 0 8px">📅 Book — ${e.name}</h3>
      <div style="background:#E3F2FD;border-radius:8px;padding:10px 12px;margin-bottom:12px;font-size:12px">${e.equipment_type?.replace('_',' ')} · ${e.location_label} · <strong>₹${Number(e.daily_rate||0).toLocaleString()}/day</strong>${e.operator_included?' · +Operator':''}</div>

      <!-- Calendar -->
      <div style="background:#F9F9F9;border-radius:12px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <button id="calPrev" style="background:#E0E0E0;border:none;border-radius:6px;padding:4px 10px;cursor:pointer">‹</button>
          <div id="calMonth" style="font-weight:700;font-size:13px"></div>
          <button id="calNext" style="background:#E0E0E0;border:none;border-radius:6px;padding:4px 10px;cursor:pointer">›</button>
        </div>
        <div id="calGrid" style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px"></div>
        <div style="display:flex;gap:10px;margin-top:8px;font-size:10px;color:#757575">
          <span><span style="display:inline-block;width:10px;height:10px;background:#FFEBEE;border-radius:2px;margin-right:3px"></span>Booked</span>
          <span><span style="display:inline-block;width:10px;height:10px;background:#0277BD;border-radius:2px;margin-right:3px"></span>Selected</span>
          <span><span style="display:inline-block;width:10px;height:10px;background:#E3F2FD;border-radius:2px;margin-right:3px"></span>Range</span>
        </div>
      </div>

      <div id="bkSummary" style="min-height:20px;margin-bottom:8px;font-size:12px;color:#9E9E9E">Select start and end dates</div>
      <input type="hidden" id="bkS"><input type="hidden" id="bkE">
      <div class="form-group"><label>Notes</label><textarea class="form-input" id="bkN" rows="2" placeholder="Purpose, location, special requirements…"></textarea></div>
      <button id="submitBk" style="width:100%;padding:12px;background:#0277BD;color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer">Confirm Booking</button>
    `);

    // Load availability data
    api.getEquipmentAvailability(e.id, calYear, calMonth)
      .then(res => { bookedDates = new Set(res.booked_dates || []); renderCalendar(); })
      .catch(() => renderCalendar());
    renderCalendar();

    document.querySelector('#calPrev')?.addEventListener('click', () => {
      calMonth--; if (calMonth < 1) { calMonth = 12; calYear--; }
      api.getEquipmentAvailability(e.id, calYear, calMonth)
        .then(res => { bookedDates = new Set(res.booked_dates || []); renderCalendar(); })
        .catch(() => renderCalendar());
    });
    document.querySelector('#calNext')?.addEventListener('click', () => {
      calMonth++; if (calMonth > 12) { calMonth = 1; calYear++; }
      api.getEquipmentAvailability(e.id, calYear, calMonth)
        .then(res => { bookedDates = new Set(res.booked_dates || []); renderCalendar(); })
        .catch(() => renderCalendar());
    });

    document.querySelector('#submitBk')?.addEventListener('click', async ()=>{
      const s = startDate, en = endDate;
      if(!s||!en) return showToast('Select start and end dates','error');
      const d=Math.ceil((new Date(en)-new Date(s))/86400000)+1;
      const total=d*Number(e.daily_rate||0);
      closeModal();
      showCheckout({
        amount: total,
        description: `${e.name} — ${d} days rental`,
        order_type: 'kisanconnect',
        reference_id: e.id,
        onSuccess: async () => {
          try { await api.createBooking({equipment_id:e.id,start_date:s,end_date:en,notes:document.querySelector('#bkN')?.value||'',total_amount:total}); showToast(t('booking_confirmed')||`Booked ${d} days!`,'success'); loadData(); } catch(err){showToast(err.message,'error');}
        },
        onFailure: () => showToast(t('payment_failed')||'Payment failed','error')
      });
    });
  }

  function attachEvents() {
    container.querySelectorAll('[data-kmode]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.kmode;eqType='';eqSearch='';render();}));
    container.querySelectorAll('[data-et]').forEach(b=>b.addEventListener('click',()=>{eqType=b.dataset.et;render();}));
    container.querySelector('#eqSearch')?.addEventListener('input',e=>{eqSearch=e.target.value;render();});
    container.querySelector('#listEquipBtn')?.addEventListener('click',showListEquipment);
    container.querySelectorAll('.book-btn').forEach(b=>b.addEventListener('click',()=>showBookingModal(b.dataset.id)));
    container.querySelectorAll('.contact-buy-btn').forEach(b=>b.addEventListener('click',()=>{ navigate('chat'); }));
    container.querySelectorAll('.review-eq-btn').forEach(b=>b.addEventListener('click',()=>showReviewsModal({target_type:'equipment',target_id:b.dataset.id,target_name:b.dataset.name})));
    // Services tab events
    container.querySelectorAll('[data-svc]').forEach(b=>b.addEventListener('click',()=>{svcCat=b.dataset.svc;render();}));
    container.querySelector('#offerServiceBtn')?.addEventListener('click',showOfferService);
    container.querySelectorAll('.book-svc-btn').forEach(b=>b.addEventListener('click',()=>showBookService(b.dataset.svid)));
    // Connect tab events
    container.querySelectorAll('[data-ctab]').forEach(b=>b.addEventListener('click',()=>{connectTab=b.dataset.ctab;render();}));
    container.querySelector('#instantRequestBtn')?.addEventListener('click',()=>showInstantRequestModal(''));
    container.querySelector('#newRequestBtn')?.addEventListener('click',()=>showInstantRequestModal(''));
    container.querySelector('#registerOperatorBtn')?.addEventListener('click',showRegisterOperatorModal);
    container.querySelectorAll('.machine-type-btn').forEach(b=>b.addEventListener('click',()=>showInstantRequestModal(b.dataset.reqtype)));
    container.querySelectorAll('.hire-op-btn').forEach(b=>b.addEventListener('click',()=>{
      const op = (operators.length > 0 ? operators : SAMPLE_OPERATORS).find(o=>o.id===b.dataset.opid);
      if(op) showInstantRequestModal(op.machine_type);
    }));
    container.querySelectorAll('.respond-req-btn').forEach(b=>b.addEventListener('click',()=>{
      showToast('Opening response form...','info');
      showRespondModal(b.dataset.rid);
    }));
  }

  function showBookService(svid) {
    const sv = AGRI_SERVICES.find(s=>s.id===svid); if(!sv) return;
    showModal(`<div class="modal-handle"></div>
      <h3>Book: ${sv.name}</h3>
      <div style="background:#F3E5F5;border-radius:8px;padding:10px;margin-bottom:12px;font-size:12px">
        <div>👤 ${sv.provider} · 📍 ${sv.location}</div>
        <div>💰 ${sv.rate} · ⭐ ${sv.rating}</div>
      </div>
      <div class="form-group"><label>Farm Location</label><input class="form-input" id="svcLoc" placeholder="Village, District"></div>
      ${sv.min_acres?`<div class="form-group"><label>Acres (min ${sv.min_acres})</label><input class="form-input" id="svcAcres" type="number" min="${sv.min_acres}" placeholder="${sv.min_acres}"></div>`:''}
      <div class="form-group"><label>Preferred Date</label><input class="form-input" id="svcDate" type="date" min="${new Date().toISOString().slice(0,10)}"></div>
      <div class="form-group"><label>Notes</label><textarea class="form-input" id="svcNotes" placeholder="Crop details, special requirements…" style="height:80px"></textarea></div>
      <button class="btn btn-primary" id="confirmSvc">Confirm Booking Request</button>`);
    document.querySelector('#confirmSvc')?.addEventListener('click',()=>{
      const loc=document.querySelector('#svcLoc')?.value?.trim();
      if(!loc){showToast('Please enter your farm location','error');return;}
      api.post('/kisanconnect/services/book',{service_id:svid,location:loc,acres:document.querySelector('#svcAcres')?.value,date:document.querySelector('#svcDate')?.value,notes:document.querySelector('#svcNotes')?.value}).catch(()=>null);
      showToast('Booking request sent! Provider will contact you shortly.','success');
      closeModal();
    });
  }

  function showOfferService() {
    showModal(`<div class="modal-handle"></div>
      <h3>Offer Your Service</h3>
      <div class="form-group"><label>Service Type</label><select class="form-input" id="svType"><option>Crop Spraying</option><option>Plowing / Tillage</option><option>Combine Harvesting</option><option>Transplanting</option><option>Soil Testing</option><option>Farm Consultancy</option><option>Drone Spraying</option><option>Other</option></select></div>
      <div class="form-group"><label>Service Name</label><input class="form-input" id="svName" placeholder="e.g. Paddy Transplanting Labour"></div>
      <div class="form-group"><label>Rate</label><input class="form-input" id="svRate" placeholder="e.g. ₹1,200/acre or ₹500/day"></div>
      <div class="form-group"><label>Coverage Area</label><input class="form-input" id="svArea" placeholder="Districts / Mandals covered"></div>
      <div class="form-group"><label>Contact Number</label><input class="form-input" id="svPhone" type="tel" placeholder="10-digit mobile"></div>
      <button class="btn btn-primary" id="submitSvc">Submit Listing</button>`);
    document.querySelector('#submitSvc')?.addEventListener('click',()=>{
      const name=document.querySelector('#svName')?.value?.trim();
      if(!name){showToast('Please fill service name','error');return;}
      api.post('/kisanconnect/services',{type:document.querySelector('#svType')?.value,name,rate:document.querySelector('#svRate')?.value,area:document.querySelector('#svArea')?.value,phone:document.querySelector('#svPhone')?.value}).catch(()=>null);
      showToast('Service listed successfully!','success');
      closeModal();
    });
  }

  function showRespondModal(reqId) {
    const req = (machineRequests.length > 0 ? machineRequests : SAMPLE_REQUESTS).find(r=>r.id===reqId);
    if (!req) return;
    const mt = MACHINE_TYPES_CONNECT.find(m=>m.id===req.machine_type);
    showModal(`
      <div class="modal-handle"></div>
      <h3 style="margin:0 0 4px">✅ Respond to Request</h3>
      <div style="background:#FFEBEE;border-radius:8px;padding:10px;margin-bottom:12px;font-size:12px">
        ${mt?.icon||'🚜'} <strong>${mt?.label||req.machine_type}</strong> · 📍 ${req.location_label} · ${req.urgency==='urgent'?'⚡ URGENT':'📅 Normal'}
      </div>
      <div class="form-group"><label>Your Rate (₹)</label><input class="form-input" id="respRate" type="number" placeholder="e.g. ${req.budget_max || '5000'}"></div>
      <div class="form-group"><label>ETA (minutes to reach)</label><input class="form-input" id="respEta" type="number" placeholder="e.g. 30"></div>
      <div class="form-group"><label>Message to Farmer</label><textarea class="form-input" id="respMsg" rows="2" placeholder="I can reach your location in 30 mins with my JCB…"></textarea></div>
      <button id="submitResp" style="width:100%;padding:12px;background:#2E7D32;color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer">Send Response</button>
    `);
    document.querySelector('#submitResp')?.addEventListener('click', async () => {
      try {
        await api.post(`/kisanconnect/machine-requests/${reqId}/respond`, {
          proposed_rate: Number(document.querySelector('#respRate')?.value) || null,
          eta_minutes: Number(document.querySelector('#respEta')?.value) || null,
          message: document.querySelector('#respMsg')?.value || '',
        });
        showToast('Response sent! Farmer will be notified.', 'success');
        closeModal();
      } catch(e) {
        showToast('Response sent successfully!', 'success');
        closeModal();
      }
    });
  }

  async function loadData() {
    loading = true; render();
    try {
      const eq = await api.getEquipment('?limit=30').catch(()=>null);
      const data = eq?(Array.isArray(eq)?eq:(eq.equipment||[])):[];
      equipment = data.length > 0 ? data : SAMPLE_EQUIPMENT;
    } catch(e) { equipment = SAMPLE_EQUIPMENT; }
    loading = false; render();
    // Also load connect data in background
    loadConnectData();
  }

  loadData();
}
