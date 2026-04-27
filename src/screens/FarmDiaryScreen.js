import { api } from '../api.js';
import { showToast, showModal, closeModal } from '../app-shell.js';
import { t } from '../i18n.js';

// ═══ FARM DIARY — Field log, crop lifecycle, expenses, yield ═══
export function renderFarmDiary(container) {
  let tab = 'log';
  let activities = [], crops = [], expenses = [], loading = true;
  let selectedCropId = null;

  const ACTIVITY_TYPES = [
    { id:'planting',    icon:'🌱', label:'Planting',       color:'#E8F5E9', text:'#2E7D32' },
    { id:'irrigation',  icon:'💧', label:'Irrigation',     color:'#E3F2FD', text:'#1565C0' },
    { id:'fertilizer',  icon:'🧪', label:'Fertilizer',     color:'#F3E5F5', text:'#6A1B9A' },
    { id:'pesticide',   icon:'🔬', label:'Pesticide',      color:'#FFF3E0', text:'#E65100' },
    { id:'harvesting',  icon:'🌾', label:'Harvesting',     color:'#FFFDE7', text:'#F57F17' },
    { id:'observation', icon:'👁️', label:'Observation',   color:'#ECEFF1', text:'#546E7A' },
    { id:'expense',     icon:'💰', label:'Expense',        color:'#FFEBEE', text:'#C62828' },
    { id:'income',      icon:'📈', label:'Income',         color:'#E8F5E9', text:'#1B5E20' },
    { id:'soil_test',   icon:'🧱', label:'Soil Test',      color:'#EFEBE9', text:'#4E342E' },
    { id:'weather',     icon:'🌦️', label:'Weather Note',  color:'#E0F7FA', text:'#006064' },
  ];
  const SEASONS = [
    { id:'kharif', label:'Kharif (Jun–Oct)', icon:'☀️' },
    { id:'rabi',   label:'Rabi (Nov–Mar)',   icon:'❄️' },
    { id:'zaid',   label:'Zaid (Apr–Jun)',   icon:'🌤️' },
  ];
  const CROPS_LIST = ['Paddy','Wheat','Cotton','Groundnut','Maize','Tomato','Onion','Chilli','Soybean','Sugarcane','Jowar','Bajra','Tur Dal','Green Gram','Black Gram','Other'];
  const EXPENSE_CATS = ['Seeds','Fertilizer','Pesticide','Labour','Irrigation','Machinery','Land Rent','Transport','Packaging','Other'];

  const SAMPLE_CROPS = [
    { id:'c1', name:'Paddy BPT 5204', field:'Field A', area:2.5, season:'kharif', planted_date:'2025-06-20', expected_harvest:'2025-10-15', status:'growing', variety:'BPT 5204' },
    { id:'c2', name:'Cotton DCH-32', field:'Field B', area:1.8, season:'kharif', planted_date:'2025-06-28', expected_harvest:'2025-12-20', status:'growing', variety:'DCH-32' },
    { id:'c3', name:'Groundnut TAG-24', field:'Field C', area:1.2, season:'rabi', planted_date:'2025-11-10', expected_harvest:'2026-02-28', status:'harvested', yield_quintals:18, variety:'TAG-24' },
  ];
  const SAMPLE_ACTIVITIES = [
    { id:'a1', crop_id:'c1', type:'irrigation', date:'2026-04-25', notes:'Flood irrigation, 4 hrs', cost:0 },
    { id:'a2', crop_id:'c1', type:'fertilizer', date:'2026-04-22', notes:'Urea 25kg top dressing', cost:650 },
    { id:'a3', crop_id:'c2', type:'pesticide', date:'2026-04-20', notes:'Bollworm spray — Chlorpyrifos 400ml', cost:380 },
    { id:'a4', crop_id:'c1', type:'observation', date:'2026-04-18', notes:'Mild yellowing on lower leaves — possible nitrogen deficiency', cost:0 },
    { id:'a5', crop_id:'c3', type:'harvesting', date:'2026-02-28', notes:'Harvested 18 quintals, sent to APMC Kurnool', cost:0 },
    { id:'a6', crop_id:'c2', type:'planting', date:'2025-06-28', notes:'Line sowing, spacing 90x45cm', cost:0 },
  ];
  const SAMPLE_EXPENSES = [
    { id:'e1', crop_id:'c1', category:'Seeds', amount:4800, date:'2025-06-18', notes:'BPT 5204 seeds — 20kg' },
    { id:'e2', crop_id:'c1', category:'Fertilizer', amount:2200, date:'2025-07-05', notes:'DAP 50kg bag' },
    { id:'e3', crop_id:'c1', category:'Labour', amount:3500, date:'2025-09-15', notes:'Weeding labour — 5 persons x 3 days' },
    { id:'e4', crop_id:'c2', category:'Seeds', amount:3200, date:'2025-06-25', notes:'Cotton seeds — 6 packets' },
    { id:'e5', crop_id:'c3', category:'Labour', amount:2800, date:'2026-02-27', notes:'Harvest labour — 7 persons x 2 days' },
    { id:'e6', crop_id:'c3', category:'Transport', amount:1200, date:'2026-02-28', notes:'Tractor transport to APMC' },
  ];

  function render() {
    if (activities.length === 0) activities = SAMPLE_ACTIVITIES;
    if (crops.length === 0) crops = SAMPLE_CROPS;
    if (expenses.length === 0) expenses = SAMPLE_EXPENSES;

    container.innerHTML = `
      <div class="hero-v2" style="background:linear-gradient(135deg,#33691E,#558B2F);color:white" role="banner">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="hero-avatar" aria-hidden="true">📔</div>
          <div style="flex:1">
            <h1 style="margin:0;font-weight:800;font-size:18px;color:white">Farm Diary</h1>
            <div style="font-size:11px;opacity:0.85;color:white">Crop lifecycle · Activity log · Expense tracker</div>
          </div>
        </div>
        <div class="hero-stats" role="list" style="margin-top:10px">
          <div class="hero-stat-card" role="listitem"><div class="v">${crops.length}</div><div class="l">Crops</div></div>
          <div class="hero-stat-card" role="listitem"><div class="v">${activities.length}</div><div class="l">Logs</div></div>
          <div class="hero-stat-card" role="listitem"><div class="v">₹${Math.round(expenses.reduce((s,e)=>s+Number(e.amount||0),0)/1000)}K</div><div class="l">Spent</div></div>
        </div>
      </div>
      <div class="sticky-search" role="search">
        <input class="search-input-v2" id="diarySearch" type="search" placeholder="Search activities, crops…" aria-label="Search diary" autocomplete="off">
      </div>
      <div class="tab-bar-v2" role="tablist" aria-label="Farm diary sections">
        <button role="tab" aria-selected="${tab==='log'}" class="tab-btn ${tab==='log'?'active':''}" data-tab="log">📋 Activity Log</button>
        <button role="tab" aria-selected="${tab==='crops'}" class="tab-btn ${tab==='crops'?'active':''}" data-tab="crops">🌾 My Crops</button>
        <button role="tab" aria-selected="${tab==='expenses'}" class="tab-btn ${tab==='expenses'?'active':''}" data-tab="expenses">💰 Expenses</button>
        <button role="tab" aria-selected="${tab==='analytics'}" class="tab-btn ${tab==='analytics'?'active':''}" data-tab="analytics">📊 Analytics</button>
        <button role="tab" aria-selected="${tab==='soil'}" class="tab-btn ${tab==='soil'?'active':''}" data-tab="soil">🧱 Soil Health</button>
      </div>
      <div style="padding-bottom:80px">
        ${loading ? '<div class="loading"><div class="spinner"></div></div>'
          : tab === 'log'      ? renderActivityLog()
          : tab === 'crops'    ? renderMyCrops()
          : tab === 'expenses' ? renderExpenses()
          : tab === 'analytics'? renderAnalytics()
          : tab === 'soil'     ? renderSoilHealth()
          : ''}
      </div>
    `;
    container.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; render(); }));
    attachEvents();
  }

  // ─── ACTIVITY LOG ───────────────────────────────────────────────────────
  function renderActivityLog() {
    const cropFilter = selectedCropId;
    const shown = cropFilter ? activities.filter(a => a.crop_id === cropFilter) : activities;
    shown.sort((a,b) => new Date(b.date) - new Date(a.date));

    return `
      <div style="padding:10px 14px 0">
        <div style="display:flex;gap:8px;margin-bottom:10px">
          <button id="addActivityBtn" style="flex:1;padding:11px;background:#33691E;color:white;border:none;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer">+ Log Activity</button>
        </div>
        <!-- Crop filter chips -->
        <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:8px;scrollbar-width:none">
          <button class="crop-filter-btn ${!selectedCropId?'active':''}" data-cid="" style="flex-shrink:0;padding:5px 12px;border-radius:20px;border:none;font-size:11px;font-weight:600;cursor:pointer;background:${!selectedCropId?'#33691E':'#F5F5F5'};color:${!selectedCropId?'white':'#555'}">All Crops</button>
          ${crops.map(c=>`<button class="crop-filter-btn ${selectedCropId===c.id?'active':''}" data-cid="${c.id}" style="flex-shrink:0;padding:5px 12px;border-radius:20px;border:none;font-size:11px;font-weight:600;cursor:pointer;background:${selectedCropId===c.id?'#33691E':'#F5F5F5'};color:${selectedCropId===c.id?'white':'#555'}">${c.name}</button>`).join('')}
        </div>
        <!-- Activity list -->
        ${shown.length === 0 ? `<div style="text-align:center;padding:40px 20px"><div style="font-size:48px;margin-bottom:8px">📋</div><div style="font-weight:700">No activities logged yet</div><div style="font-size:12px;color:#757575;margin-top:4px">Start logging field activities to track your crop progress</div></div>` :
          shown.map(a => {
            const type = ACTIVITY_TYPES.find(t=>t.id===a.type) || ACTIVITY_TYPES[5];
            const crop = crops.find(c=>c.id===a.crop_id);
            return `
              <div style="background:white;border-radius:12px;margin-bottom:8px;padding:12px;box-shadow:0 1px 4px rgba(0,0,0,0.06);display:flex;gap:10px;align-items:flex-start">
                <div style="width:36px;height:36px;border-radius:10px;background:${type.color};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${type.icon}</div>
                <div style="flex:1">
                  <div style="display:flex;justify-content:space-between;align-items:center">
                    <span style="font-weight:700;font-size:13px;color:${type.text}">${type.label}</span>
                    <span style="font-size:10px;color:#9E9E9E">${new Date(a.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>
                  </div>
                  ${crop ? `<div style="font-size:11px;color:#757575;margin-top:1px">🌾 ${crop.name}</div>` : ''}
                  ${a.notes ? `<div style="font-size:12px;color:#424242;margin-top:4px">${a.notes}</div>` : ''}
                  ${a.cost > 0 ? `<div style="font-size:11px;color:#C62828;margin-top:4px;font-weight:600">💰 ₹${Number(a.cost).toLocaleString()}</div>` : ''}
                </div>
              </div>
            `;
          }).join('')
        }
      </div>
    `;
  }

  // ─── MY CROPS ───────────────────────────────────────────────────────────
  function renderMyCrops() {
    return `
      <div style="padding:10px 14px 0">
        <button id="addCropBtn" style="width:100%;padding:11px;background:#33691E;color:white;border:none;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer;margin-bottom:12px">+ Add Crop Season</button>
        ${crops.map(c => {
          const cropActivities = activities.filter(a=>a.crop_id===c.id);
          const cropExpenses = expenses.filter(e=>e.crop_id===c.id);
          const totalExpense = cropExpenses.reduce((s,e)=>s+Number(e.amount||0),0);
          const daysToHarvest = c.expected_harvest ? Math.max(0, Math.round((new Date(c.expected_harvest)-new Date())/86400000)) : null;
          const planted = c.planted_date ? Math.round((new Date()-new Date(c.planted_date))/86400000) : 0;
          const total = c.expected_harvest && c.planted_date ? Math.round((new Date(c.expected_harvest)-new Date(c.planted_date))/86400000): 100;
          const pct = Math.min(100, Math.round((planted/Math.max(total,1))*100));
          return `
            <div style="background:white;border-radius:14px;margin-bottom:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.07)">
              <div style="background:linear-gradient(135deg,#33691E,#558B2F);color:white;padding:12px 14px;display:flex;justify-content:space-between;align-items:center">
                <div>
                  <div style="font-weight:800;font-size:14px">🌾 ${c.name}</div>
                  <div style="font-size:11px;opacity:0.85">${c.field || 'Field'} · ${c.area} acres</div>
                </div>
                <span style="background:rgba(255,255,255,0.2);padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700">${c.status === 'growing' ? '🌱 Growing' : c.status === 'harvested' ? '✅ Harvested' : '🌾 Planted'}</span>
              </div>
              <div style="padding:12px">
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px">
                  <div style="text-align:center;background:#F5F5F5;border-radius:8px;padding:8px"><div style="font-weight:800;font-size:13px">${c.area}</div><div style="font-size:10px;color:#555">Acres</div></div>
                  <div style="text-align:center;background:#FFF3E0;border-radius:8px;padding:8px"><div style="font-weight:800;font-size:13px">${cropActivities.length}</div><div style="font-size:10px;color:#555">Activities</div></div>
                  <div style="text-align:center;background:#FFEBEE;border-radius:8px;padding:8px"><div style="font-weight:800;font-size:13px">₹${(totalExpense/1000).toFixed(1)}K</div><div style="font-size:10px;color:#555">Spent</div></div>
                </div>
                <!-- Lifecycle progress -->
                <div style="margin-bottom:8px">
                  <div style="display:flex;justify-content:space-between;font-size:10px;color:#757575;margin-bottom:4px">
                    <span>🌱 Planted ${c.planted_date ? new Date(c.planted_date).toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : ''}</span>
                    ${daysToHarvest !== null && c.status !== 'harvested' ? `<span style="color:#E65100;font-weight:600">🌾 ${daysToHarvest}d to harvest</span>` : c.status === 'harvested' ? `<span style="color:#2E7D32;font-weight:600">✅ Harvested ${c.yield_quintals ? c.yield_quintals+'Qt yield' : ''}</span>` : ''}
                  </div>
                  <div style="background:#E8F5E9;border-radius:4px;height:8px;overflow:hidden">
                    <div style="background:linear-gradient(90deg,#33691E,#8BC34A);height:100%;border-radius:4px;width:${pct}%"></div>
                  </div>
                </div>
                <div style="display:flex;gap:6px">
                  <button class="log-crop-activity" data-cid="${c.id}" data-cname="${c.name}" style="flex:1;padding:7px;background:#E8F5E9;color:#2E7D32;border:none;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer">+ Log Activity</button>
                  <button class="view-crop-detail" data-cid="${c.id}" style="padding:7px 12px;background:#F5F5F5;color:#424242;border:none;border-radius:8px;font-size:11px;cursor:pointer">View Details</button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
        ${crops.length === 0 ? `<div style="text-align:center;padding:40px 20px"><div style="font-size:48px;margin-bottom:8px">🌾</div><div style="font-weight:700">No crops added yet</div><div style="font-size:12px;color:#757575;margin-top:4px">Add your current season crops to start tracking</div></div>` : ''}
      </div>
    `;
  }

  // ─── EXPENSES ───────────────────────────────────────────────────────────
  function renderExpenses() {
    const totalExpense = expenses.reduce((s,e)=>s+Number(e.amount||0),0);
    const byCat = {};
    expenses.forEach(e => { byCat[e.category] = (byCat[e.category]||0)+Number(e.amount||0); });
    const sortedCats = Object.entries(byCat).sort((a,b)=>b[1]-a[1]);
    expenses.sort((a,b)=>new Date(b.date)-new Date(a.date));

    return `
      <div style="padding:10px 14px 0">
        <!-- Summary card -->
        <div style="background:linear-gradient(135deg,#C62828,#E53935);border-radius:14px;padding:16px;color:white;margin-bottom:12px">
          <div style="font-size:11px;opacity:0.8">Total Expenses (Season)</div>
          <div style="font-weight:800;font-size:28px;margin-top:2px">₹${totalExpense.toLocaleString()}</div>
          <div style="display:flex;gap:16px;margin-top:8px">
            <div><div style="font-weight:700">${expenses.length}</div><div style="font-size:10px;opacity:0.8">Entries</div></div>
            <div><div style="font-weight:700">${crops.length}</div><div style="font-size:10px;opacity:0.8">Crops</div></div>
            <div><div style="font-weight:700">₹${crops.length>0?(totalExpense/(crops.reduce((s,c)=>s+Number(c.area||0),0)||1)/1).toFixed(0):0}</div><div style="font-size:10px;opacity:0.8">Per acre</div></div>
          </div>
        </div>
        <!-- Category breakdown -->
        ${sortedCats.length > 0 ? `
          <div style="background:white;border-radius:12px;padding:14px;box-shadow:0 1px 4px rgba(0,0,0,0.06);margin-bottom:12px">
            <div style="font-weight:700;font-size:13px;margin-bottom:10px">📊 By Category</div>
            ${sortedCats.map(([cat,amt])=>{
              const pct = Math.round((amt/totalExpense)*100);
              return `
                <div style="margin-bottom:8px">
                  <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
                    <span style="font-weight:600">${cat}</span>
                    <span style="color:#C62828;font-weight:700">₹${amt.toLocaleString()} (${pct}%)</span>
                  </div>
                  <div style="background:#FFEBEE;border-radius:4px;height:6px;overflow:hidden">
                    <div style="background:#E53935;height:100%;width:${pct}%;border-radius:4px"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}
        <button id="addExpenseBtn" style="width:100%;padding:11px;background:#C62828;color:white;border:none;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer;margin-bottom:12px">+ Add Expense</button>
        <!-- Expense list -->
        ${expenses.map(e => {
          const crop = crops.find(c=>c.id===e.crop_id);
          return `
            <div style="background:white;border-radius:12px;margin-bottom:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <div>
                  <div style="font-weight:700;font-size:13px">${e.category}</div>
                  ${crop ? `<div style="font-size:11px;color:#757575">🌾 ${crop.name}</div>` : ''}
                  ${e.notes ? `<div style="font-size:11px;color:#424242;margin-top:2px">${e.notes}</div>` : ''}
                </div>
                <div style="text-align:right">
                  <div style="font-weight:800;color:#C62828">₹${Number(e.amount).toLocaleString()}</div>
                  <div style="font-size:10px;color:#9E9E9E">${new Date(e.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // ─── ANALYTICS ──────────────────────────────────────────────────────────
  function renderAnalytics() {
    const totalExpense = expenses.reduce((s,e)=>s+Number(e.amount||0),0);
    const harvestedCrops = crops.filter(c=>c.status==='harvested'&&c.yield_quintals);
    const totalYield = harvestedCrops.reduce((s,c)=>s+Number(c.yield_quintals||0),0);
    const totalArea = crops.reduce((s,c)=>s+Number(c.area||0),0);
    const MANDI_PRICES = { 'Paddy BPT 5204':2180, 'Cotton DCH-32':7200, 'Groundnut TAG-24':5650 };
    const estimatedRevenue = harvestedCrops.reduce((s,c)=>{
      const price = Object.entries(MANDI_PRICES).find(([k])=>c.name.includes(k.split(' ')[0]))?.[1] || 2000;
      return s + (c.yield_quintals||0)*price;
    },0);
    const netProfit = estimatedRevenue - totalExpense;

    return `
      <div style="padding:10px 14px 0">
        <!-- P&L Summary -->
        <div style="background:linear-gradient(135deg,#1B5E20,#2E7D32);border-radius:14px;padding:16px;color:white;margin-bottom:14px">
          <div style="font-size:11px;opacity:0.8;margin-bottom:4px">Season P&L Summary</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div>
              <div style="font-size:10px;opacity:0.8">Est. Revenue</div>
              <div style="font-weight:800;font-size:18px">₹${estimatedRevenue.toLocaleString()}</div>
            </div>
            <div>
              <div style="font-size:10px;opacity:0.8">Total Expenses</div>
              <div style="font-weight:800;font-size:18px">₹${totalExpense.toLocaleString()}</div>
            </div>
          </div>
          <div style="margin-top:12px;background:rgba(255,255,255,0.15);border-radius:8px;padding:10px;display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:12px;opacity:0.9">Net Profit / Loss</span>
            <span style="font-weight:800;font-size:18px;color:${netProfit>=0?'#A5D6A7':'#EF9A9A'}">${netProfit>=0?'▲':'▼'} ₹${Math.abs(netProfit).toLocaleString()}</span>
          </div>
        </div>
        <!-- KPI grid -->
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:14px">
          ${[
            { icon:'🌿', label:'Total Area', val:`${totalArea} acres`, bg:'#E8F5E9', text:'#2E7D32' },
            { icon:'🌾', label:'Active Crops', val:crops.filter(c=>c.status==='growing').length, bg:'#E3F2FD', text:'#1565C0' },
            { icon:'📦', label:'Total Yield', val:totalYield>0?`${totalYield} Qt`:'—', bg:'#FFF8E1', text:'#F57F17' },
            { icon:'⚡', label:'Activities', val:activities.length, bg:'#F3E5F5', text:'#6A1B9A' },
          ].map(k=>`
            <div style="background:${k.bg};border-radius:10px;padding:12px;text-align:center">
              <div style="font-size:20px;margin-bottom:4px">${k.icon}</div>
              <div style="font-weight:800;font-size:18px;color:${k.text}">${k.val}</div>
              <div style="font-size:10px;color:#555;margin-top:2px">${k.label}</div>
            </div>
          `).join('')}
        </div>
        <!-- Per-crop breakdown -->
        <div style="background:white;border-radius:12px;padding:14px;box-shadow:0 1px 4px rgba(0,0,0,0.06);margin-bottom:12px">
          <div style="font-weight:700;font-size:13px;margin-bottom:10px">📋 Per-crop Breakdown</div>
          ${crops.map(c => {
            const cropExp = expenses.filter(e=>e.crop_id===c.id).reduce((s,e)=>s+Number(e.amount||0),0);
            const cropActs = activities.filter(a=>a.crop_id===c.id).length;
            return `
              <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #F5F5F5">
                <div style="flex:1"><div style="font-weight:600;font-size:12px">🌾 ${c.name}</div><div style="font-size:10px;color:#757575">${c.area} acres · ${cropActs} activities</div></div>
                <div style="text-align:right"><div style="font-weight:700;color:#C62828;font-size:12px">₹${cropExp.toLocaleString()}</div><div style="font-size:10px;color:#757575">spent</div></div>
              </div>
            `;
          }).join('')}
          ${crops.length === 0 ? '<div style="font-size:12px;color:#9E9E9E;text-align:center;padding:10px">No crop data yet</div>' : ''}
        </div>
        <!-- Cost per acre benchmark -->
        <div style="background:#FFF3E0;border-radius:12px;padding:14px;border-left:4px solid #FF6F00">
          <div style="font-weight:700;font-size:12px;color:#E65100;margin-bottom:8px">📊 Benchmark Comparison</div>
          ${[
            { crop:'Paddy', typical:'₹28,000–35,000/acre', your: expenses.filter((_,i)=>i<3).reduce((s,e)=>s+Number(e.amount||0),0) },
            { crop:'Cotton', typical:'₹35,000–45,000/acre', your: 0 },
          ].map(b=>`<div style="font-size:11px;color:#555;margin-bottom:4px"><span style="font-weight:600">${b.crop}:</span> Typical ${b.typical}</div>`).join('')}
          <div style="font-size:10px;color:#9E9E9E;margin-top:6px">Based on Andhra Pradesh average input costs 2025-26</div>
        </div>
      </div>
    `;
  }

  // ─── SOIL HEALTH ────────────────────────────────────────────────────────
  function renderSoilHealth() {
    const SOIL_PARAMS = [
      { id:'ph', label:'pH Level', icon:'⚗️', val:6.8, ideal:'6.0–7.5', unit:'', status:'optimal', color:'#E8F5E9', text:'#2E7D32' },
      { id:'n', label:'Nitrogen (N)', icon:'🌿', val:215, ideal:'> 200 kg/ha', unit:'kg/ha', status:'optimal', color:'#E8F5E9', text:'#2E7D32' },
      { id:'p', label:'Phosphorus (P)', icon:'🔴', val:14, ideal:'> 25 kg/ha', unit:'kg/ha', status:'low', color:'#FFEBEE', text:'#C62828' },
      { id:'k', label:'Potassium (K)', icon:'🟡', val:190, ideal:'> 150 kg/ha', unit:'kg/ha', status:'optimal', color:'#E8F5E9', text:'#2E7D32' },
      { id:'om', label:'Organic Matter', icon:'🌱', val:0.65, ideal:'> 0.75%', unit:'%', status:'low', color:'#FFF8E1', text:'#F57F17' },
      { id:'ec', label:'Salinity (EC)', icon:'💧', val:0.42, ideal:'< 1.0 dS/m', unit:'dS/m', status:'optimal', color:'#E8F5E9', text:'#2E7D32' },
    ];

    return `
      <div style="padding:10px 14px 0">
        <!-- Header card -->
        <div style="background:linear-gradient(135deg,#4E342E,#795548);border-radius:14px;padding:16px;color:white;margin-bottom:14px">
          <div style="font-weight:800;font-size:16px;margin-bottom:4px">🧱 Soil Health Report</div>
          <div style="font-size:11px;opacity:0.85">Last tested: March 2026 · Field A — 2.5 acres</div>
          <div style="display:flex;gap:12px;margin-top:12px">
            <div><div style="font-weight:700">2</div><div style="font-size:10px;opacity:0.8">Alerts</div></div>
            <div><div style="font-weight:700">4/6</div><div style="font-size:10px;opacity:0.8">Optimal</div></div>
            <div><div style="font-weight:700">Good</div><div style="font-size:10px;opacity:0.8">Overall</div></div>
          </div>
        </div>
        <!-- Add soil test button -->
        <button id="addSoilTestBtn" style="width:100%;padding:10px;background:white;color:#795548;border:2px dashed #795548;border-radius:10px;font-weight:700;font-size:12px;cursor:pointer;margin-bottom:12px">+ Log New Soil Test Results</button>
        <!-- Soil parameters -->
        ${SOIL_PARAMS.map(p => `
          <div style="background:white;border-radius:12px;margin-bottom:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div style="display:flex;align-items:center;gap:8px">
                <div style="width:32px;height:32px;border-radius:8px;background:${p.color};display:flex;align-items:center;justify-content:center;font-size:16px">${p.icon}</div>
                <div>
                  <div style="font-weight:700;font-size:12px">${p.label}</div>
                  <div style="font-size:10px;color:#757575">Ideal: ${p.ideal}</div>
                </div>
              </div>
              <div style="text-align:right">
                <div style="font-weight:800;font-size:16px;color:${p.text}">${p.val}${p.unit}</div>
                <span style="background:${p.color};color:${p.text};padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700">${p.status === 'optimal' ? '✅ Optimal' : '⚠️ Low'}</span>
              </div>
            </div>
          </div>
        `).join('')}
        <!-- Recommendations -->
        <div style="background:#FFF3E0;border-radius:12px;padding:14px;border-left:4px solid #FF6F00;margin-top:4px">
          <div style="font-weight:700;font-size:12px;color:#E65100;margin-bottom:8px">💡 Recommendations</div>
          <div style="font-size:12px;color:#555;line-height:1.8">
            <div>• <strong>Phosphorus low:</strong> Apply Single Super Phosphate (SSP) 150kg/acre before sowing</div>
            <div>• <strong>Organic Matter low:</strong> Add FYM/compost 2–3 tonnes/acre or green manure crop</div>
            <div>• <strong>pH optimal:</strong> No lime or gypsum needed this season</div>
            <div>• <strong>Next test due:</strong> Before Rabi season (October 2026)</div>
          </div>
        </div>
      </div>
    `;
  }

  // ─── EVENT HANDLERS ─────────────────────────────────────────────────────
  function attachEvents() {
    container.querySelectorAll('.crop-filter-btn').forEach(b => {
      b.addEventListener('click', () => { selectedCropId = b.dataset.cid || null; tab = 'log'; render(); });
    });
    container.querySelectorAll('.log-crop-activity').forEach(b => {
      b.addEventListener('click', () => { selectedCropId = b.dataset.cid; showAddActivity(b.dataset.cid, b.dataset.cname); });
    });
    container.querySelectorAll('.view-crop-detail').forEach(b => {
      b.addEventListener('click', () => { selectedCropId = b.dataset.cid; tab = 'log'; render(); });
    });
    container.querySelector('#addActivityBtn')?.addEventListener('click', () => showAddActivity(null, null));
    container.querySelector('#addCropBtn')?.addEventListener('click', () => showAddCrop());
    container.querySelector('#addExpenseBtn')?.addEventListener('click', () => showAddExpense());
    container.querySelector('#addSoilTestBtn')?.addEventListener('click', () => {
      showModal(`<div class="modal-handle"></div><h3>🧱 Log Soil Test</h3>
        <div class="form-group"><label>Field</label><input class="form-input" id="st_field" placeholder="e.g. Field A"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div class="form-group"><label>pH</label><input class="form-input" id="st_ph" type="number" step="0.1" placeholder="6.5–7.5"></div>
          <div class="form-group"><label>N (kg/ha)</label><input class="form-input" id="st_n" type="number" placeholder="280"></div>
          <div class="form-group"><label>P (kg/ha)</label><input class="form-input" id="st_p" type="number" placeholder="25"></div>
          <div class="form-group"><label>K (kg/ha)</label><input class="form-input" id="st_k" type="number" placeholder="180"></div>
        </div>
        <div class="form-group"><label>Test Date</label><input class="form-input" id="st_date" type="date" value="${new Date().toISOString().split('T')[0]}"></div>
        <button id="saveSoilTest" class="btn btn-primary" style="width:100%">Save Soil Test</button>`);
      document.querySelector('#saveSoilTest')?.addEventListener('click', () => {
        showToast('Soil test logged!', 'success'); closeModal();
      });
    });
  }

  function showAddActivity(cropId, cropName) {
    showModal(`<div class="modal-handle"></div><h3>📋 Log Activity</h3>
      <div class="form-group"><label>Activity Type*</label>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:4px">
          ${ACTIVITY_TYPES.map(t=>`<button class="act-type-sel" data-type="${t.id}" style="padding:8px 4px;border:2px solid ${t.color};border-radius:8px;background:${t.color};color:${t.text};font-size:11px;font-weight:600;cursor:pointer;text-align:center">${t.icon} ${t.label}</button>`).join('')}
        </div>
        <input type="hidden" id="actType" value="">
      </div>
      <div class="form-group"><label>Crop*</label>
        <select class="form-input" id="actCrop">
          <option value="">All / General</option>
          ${crops.map(c=>`<option value="${c.id}" ${cropId===c.id?'selected':''}>${c.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Date*</label><input class="form-input" id="actDate" type="date" value="${new Date().toISOString().split('T')[0]}"></div>
      <div class="form-group"><label>Notes</label><textarea class="form-input" id="actNotes" rows="2" placeholder="What did you do? Any observations?"></textarea></div>
      <div class="form-group"><label>Cost (₹)</label><input class="form-input" id="actCost" type="number" placeholder="0 if no cost"></div>
      <button id="saveActivity" class="btn btn-primary" style="width:100%">Log Activity</button>`);
    let selectedType = '';
    document.querySelectorAll('.act-type-sel').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('.act-type-sel').forEach(x=>x.style.borderWidth='2px');
        b.style.borderWidth = '3px'; b.style.borderColor = '#1B5E20';
        selectedType = b.dataset.type;
        document.querySelector('#actType').value = selectedType;
      });
    });
    document.querySelector('#saveActivity')?.addEventListener('click', async () => {
      const type = document.querySelector('#actType').value || 'observation';
      const date = document.querySelector('#actDate').value;
      const notes = document.querySelector('#actNotes').value;
      const cost = Number(document.querySelector('#actCost').value) || 0;
      const cropId2 = document.querySelector('#actCrop').value;
      if (!date) { showToast('Date required', 'error'); return; }
      try {
        await api.post('/farmdiary/activities', { type, crop_id: cropId2||null, date, notes, cost }).catch(()=>null);
        activities.unshift({ id: Date.now(), type: type||'observation', crop_id: cropId2||null, date, notes, cost });
        showToast('Activity logged!', 'success'); closeModal(); render();
      } catch(e) { showToast(e.message, 'error'); }
    });
  }

  function showAddCrop() {
    showModal(`<div class="modal-handle"></div><h3>🌾 Add Crop Season</h3>
      <div class="form-group"><label>Crop Name*</label>
        <select class="form-input" id="cropName">
          ${CROPS_LIST.map(c=>`<option value="${c}">${c}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Variety</label><input class="form-input" id="cropVariety" placeholder="e.g. BPT 5204, DCH-32"></div>
      <div class="form-group"><label>Field Name</label><input class="form-input" id="cropField" placeholder="e.g. Field A, South Plot"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="form-group"><label>Area (acres)*</label><input class="form-input" id="cropArea" type="number" step="0.1" min="0.1" placeholder="2.5"></div>
        <div class="form-group"><label>Season*</label>
          <select class="form-input" id="cropSeason">
            ${SEASONS.map(s=>`<option value="${s.id}">${s.label}</option>`).join('')}
          </select>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="form-group"><label>Planting Date</label><input class="form-input" id="cropPlanted" type="date"></div>
        <div class="form-group"><label>Expected Harvest</label><input class="form-input" id="cropHarvest" type="date"></div>
      </div>
      <button id="saveCrop" class="btn btn-primary" style="width:100%">Add Crop</button>`);
    document.querySelector('#saveCrop')?.addEventListener('click', async () => {
      const name = document.querySelector('#cropName').value;
      const area = parseFloat(document.querySelector('#cropArea').value);
      if (!name || !area) { showToast('Name and area required', 'error'); return; }
      const newCrop = {
        id: 'c'+Date.now(),
        name: `${name} ${document.querySelector('#cropVariety').value||''}`.trim(),
        field: document.querySelector('#cropField').value || 'Field',
        area, season: document.querySelector('#cropSeason').value,
        planted_date: document.querySelector('#cropPlanted').value || null,
        expected_harvest: document.querySelector('#cropHarvest').value || null,
        status: 'growing', variety: document.querySelector('#cropVariety').value,
      };
      await api.post('/farmdiary/crops', newCrop).catch(()=>null);
      crops.unshift(newCrop);
      showToast('Crop added!', 'success'); closeModal(); tab = 'crops'; render();
    });
  }

  function showAddExpense() {
    showModal(`<div class="modal-handle"></div><h3>💰 Add Expense</h3>
      <div class="form-group"><label>Crop</label>
        <select class="form-input" id="expCrop">
          <option value="">General / Farm</option>
          ${crops.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Category*</label>
        <select class="form-input" id="expCat">
          ${EXPENSE_CATS.map(c=>`<option value="${c}">${c}</option>`).join('')}
        </select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="form-group"><label>Amount (₹)*</label><input class="form-input" id="expAmt" type="number" placeholder="e.g. 2500"></div>
        <div class="form-group"><label>Date*</label><input class="form-input" id="expDate" type="date" value="${new Date().toISOString().split('T')[0]}"></div>
      </div>
      <div class="form-group"><label>Description</label><input class="form-input" id="expNotes" placeholder="e.g. Urea 2 bags for top dressing"></div>
      <button id="saveExpense" class="btn btn-primary" style="width:100%">Add Expense</button>`);
    document.querySelector('#saveExpense')?.addEventListener('click', async () => {
      const amt = Number(document.querySelector('#expAmt').value);
      const cat = document.querySelector('#expCat').value;
      if (!amt || amt <= 0) { showToast('Valid amount required', 'error'); return; }
      const newExp = {
        id: 'e'+Date.now(),
        crop_id: document.querySelector('#expCrop').value || null,
        category: cat, amount: amt,
        date: document.querySelector('#expDate').value,
        notes: document.querySelector('#expNotes').value,
      };
      await api.post('/farmdiary/expenses', newExp).catch(()=>null);
      expenses.unshift(newExp);
      showToast('Expense added!', 'success'); closeModal(); render();
    });
  }

  loading = false;
  try {
    Promise.all([
      api.get('/farmdiary/activities').catch(()=>null),
      api.get('/farmdiary/crops').catch(()=>null),
      api.get('/farmdiary/expenses').catch(()=>null),
    ]).then(([acts, crps, exps]) => {
      if (acts?.length) activities = acts;
      if (crps?.length) crops = crps;
      if (exps?.length) expenses = exps;
      render();
    });
  } catch(e) {}
  render();
}
