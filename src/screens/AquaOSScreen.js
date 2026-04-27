import { api } from '../api.js';
import { showToast, showModal, closeModal } from '../app-shell.js';
import { getRole } from '../store.js';
import { t } from '../i18n.js';

export function renderAquaOS(container) {
  const role = getRole();
  const isBuyer = role === 'buyer';
  const isSupplier = role === 'supplier';
  let tab = isBuyer ? 'marketplace' : isSupplier ? 'myproducts' : 'dashboard';
  let dashboard = null, ponds = [], advisoryData = [], harvestListings = [], stats = {};
  let aquaProducts = [], aquaPrices = [], offers = [], myListings = [];
  let farms = [], conversations = [], myProducts = [], communityPosts = [];
  let buyerFilters = { species: '', district: '', harvest_days: 30, min_qty: 0 };
  let savedSearches = [], subscription = null, priceAlerts = [], kycDocs = null;
  let notifPrefs = null, privacySettings = null, referralInfo = null;
  let lang = localStorage.getItem('aqua_lang') || 'en';
  let loading = true;

  const i18n = {
    en: { farm_os: 'Farm OS', advisory: 'Advisory', harvest_mkt: 'Harvest Marketplace', input_mkt: 'Input Marketplace', dashboard: 'Dashboard', ponds: 'Ponds', feed: 'Feed', market: 'Market', shop: 'Inputs', community: 'Community', analytics: 'Analytics', my_products: 'My Products', leads: 'Leads', prices: 'Prices', supply: 'Supply', my_offers: 'My Offers', chats: 'Chats', settings: 'Settings', farms: 'Farms' },
    te: { farm_os: 'వ్యవసాయ OS', advisory: 'సూచనలు', harvest_mkt: 'పంట మార్కెట్', input_mkt: 'ఇన్పుట్ మార్కెట్', dashboard: 'డ్యాష్బోర్డ్', ponds: 'చెరువులు', feed: 'ఆహారం', market: 'మార్కెట్', shop: 'షాప్', community: 'సమాజం', analytics: 'విశ్లేషణ', my_products: 'నా ఉత్పత్తులు', leads: 'లీడ్లు', prices: 'ధరలు', supply: 'సరఫరా', my_offers: 'నా ఆఫర్లు', chats: 'చాట్లు', settings: 'సెట్టింగ్లు', farms: 'ఫారమ్లు' },
    hi: { farm_os: 'फार्म OS', advisory: 'सलाह', harvest_mkt: 'कटाई बाज़ार', input_mkt: 'इनपुट बाज़ार', dashboard: 'डैशबोर्ड', ponds: 'तालाब', feed: 'चारा', market: 'बाज़ार', shop: 'दुकान', community: 'समुदाय', analytics: 'विश्लेषण', my_products: 'मेरे उत्पाद', leads: 'लीड', prices: 'भाव', supply: 'आपूर्ति', my_offers: 'मेरे ऑफर', chats: 'बातचीत', settings: 'सेटिंग', farms: 'फार्म' },
  };
  const t = (k) => (i18n[lang] || i18n.en)[k] || k;

  // SAMPLE DATA for new users
  const SAMPLE_PONDS = [
    { id:'sp1', name:'Main Shrimp Pond A', species:'Vannamei Shrimp', area_acres:2.5, depth_m:1.5, stocking_density:40, current_count:95000, status:'active', water_ph:7.8, dissolved_oxygen:5.2, temperature:28.5, last_feed:'2026-04-27T06:00:00Z', days_of_culture:62 },
    { id:'sp2', name:'Nursery Pond B', species:'Vannamei Shrimp', area_acres:0.5, depth_m:1.2, stocking_density:100, current_count:48000, status:'active', water_ph:7.6, dissolved_oxygen:5.8, temperature:27.8, last_feed:'2026-04-27T05:30:00Z', days_of_culture:25 },
    { id:'sp3', name:'Fish Pond C', species:'Rohu', area_acres:3.0, depth_m:2.0, stocking_density:8, current_count:22000, status:'active', water_ph:7.4, dissolved_oxygen:4.9, temperature:29.0, last_feed:'2026-04-27T07:00:00Z', days_of_culture:110 },
    { id:'sp4', name:'Pangasius Pond D', species:'Pangasius', area_acres:1.5, depth_m:2.5, stocking_density:20, current_count:28500, status:'active', water_ph:7.2, dissolved_oxygen:4.5, temperature:29.5, last_feed:'2026-04-27T06:30:00Z', days_of_culture:85 },
  ];
  const SAMPLE_HARVEST_LISTINGS = [
    { id:'sh1', species:'Vannamei Shrimp', quantity_kg:2500, size_count:'30 count', price_per_kg:380, location:'Nellore, AP', harvest_date:'2026-05-10', status:'available', farmer_name:'Ramesh Aqua Farm', rating:4.5 },
    { id:'sh2', species:'Vannamei Shrimp', quantity_kg:1800, size_count:'40 count', price_per_kg:340, location:'Bhimavaram, AP', harvest_date:'2026-05-05', status:'available', farmer_name:'Krishna Aqua', rating:4.2 },
    { id:'sh3', species:'Rohu', quantity_kg:3000, size_count:'800g-1kg', price_per_kg:160, location:'Eluru, AP', harvest_date:'2026-05-08', status:'available', farmer_name:'Godavari Fish Farm', rating:4.7 },
    { id:'sh4', species:'Pangasius', quantity_kg:5000, size_count:'1-1.5kg', price_per_kg:95, location:'Vijayawada, AP', harvest_date:'2026-05-03', status:'available', farmer_name:'Delta Aquaculture', rating:4.0 },
    { id:'sh5', species:'Black Tiger Shrimp', quantity_kg:800, size_count:'20 count', price_per_kg:650, location:'Kakinada, AP', harvest_date:'2026-05-12', status:'available', farmer_name:'Coastal Premium Aqua', rating:4.8 },
  ];
  const SAMPLE_PRICES = [
    { species:'Vannamei Shrimp', size:'30 count', price:380, change:+12, market:'Nellore' },
    { species:'Vannamei Shrimp', size:'40 count', price:340, change:-5, market:'Ongole' },
    { species:'Vannamei Shrimp', size:'50 count', price:290, change:+8, market:'Bhimavaram' },
    { species:'Rohu', size:'800g-1kg', price:160, change:+3, market:'Eluru' },
    { species:'Pangasius', size:'1-1.5kg', price:95, change:-2, market:'Vijayawada' },
    { species:'Black Tiger', size:'20 count', price:650, change:+25, market:'Kakinada' },
  ];
  const SAMPLE_PRODUCTS = [
    { id:'spr1', name:'CP Aqua Feed 35P', category:'feed', brand:'CP Foods', price:2800, unit:'25kg bag', rating:4.6, stock:150, description:'35% protein shrimp feed for grow-out phase' },
    { id:'spr2', name:'Biofloc Probiotic', category:'supplement', brand:'AquaBio', price:1200, unit:'1kg', rating:4.4, stock:80, description:'Multi-strain probiotic for biofloc systems' },
    { id:'spr3', name:'Pond Aerator 2HP', category:'equipment', brand:'AirO2', price:28000, unit:'piece', rating:4.3, stock:25, description:'Paddle wheel aerator for 1-2 acre ponds' },
    { id:'spr4', name:'Water Test Kit Pro', category:'testing', brand:'AquaCheck', price:3500, unit:'kit', rating:4.7, stock:60, description:'Tests pH, DO, ammonia, nitrite, alkalinity' },
    { id:'spr5', name:'HDPE Pond Liner 500gsm', category:'infrastructure', brand:'GeoTech', price:85, unit:'per sqft', rating:4.5, stock:5000, description:'UV-stabilized pond liner, 10yr warranty' },
  ];
  const SAMPLE_DASHBOARD = { total_ponds:4, active_ponds:4, total_area:7.5, avg_survival:88, upcoming_harvest:2, total_stock_value:285000, alerts:[{type:'warning',msg:'Pond A DO dropping — activate aerator'},{type:'info',msg:'Feed schedule: Pond B next feeding at 2 PM'}] };

  function render() {
    const subtitle = isSupplier ? 'Sell feed · medicine · equipment to aqua farmers' : isBuyer ? 'Search aqua harvests · Make offers · Source from AP' : 'Aquaculture operating system · Pond management + Advisory';
    container.innerHTML = `
      <div class="hero-v2" role="banner" style="background:linear-gradient(135deg,#2f80ed 0%,#00c9a7 100%);color:#fff">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:28px">🐟</span>
          <div style="flex:1">
            <div style="font-size:18px;font-weight:800;letter-spacing:-0.3px">${isSupplier?`🏭 AquaOS · ${t('input_mkt')}`:isBuyer?`🛒 AquaOS · ${t('harvest_mkt')}`:`🐟 AquaOS · ${t('farm_os')}`}</div>
            <div style="font-size:11px;opacity:0.85">${subtitle}</div>
          </div>
          <div style="display:flex;gap:4px">
            ${['en','te','hi'].map(l => `<button class="lang-btn" data-lang="${l}" style="background:${lang===l?'rgba(255,255,255,0.3)':'rgba(255,255,255,0.1)'};border:none;border-radius:4px;color:white;padding:3px 6px;font-size:10px;cursor:pointer;font-weight:${lang===l?'700':'400'}">${l.toUpperCase()}</button>`).join('')}
          </div>
        </div>
      </div>
      <div class="tab-bar" role="tablist" style="overflow-x:auto;white-space:nowrap">
        ${isSupplier ? `
          <button role="tab" aria-selected="${tab==='myproducts'}" class="tab-btn ${tab==='myproducts'?'active':''}" data-tab="myproducts">📦 ${t('my_products')}</button>
          <button role="tab" aria-selected="${tab==='leads'}" class="tab-btn ${tab==='leads'?'active':''}" data-tab="leads">📋 ${t('leads')}</button>
          <button role="tab" aria-selected="${tab==='prices'}" class="tab-btn ${tab==='prices'?'active':''}" data-tab="prices">💰 ${t('prices')}</button>
          <button role="tab" aria-selected="${tab==='settings'}" class="tab-btn ${tab==='settings'?'active':''}" data-tab="settings">⚙️ ${t('settings')}</button>
        ` : isBuyer ? `
          <button role="tab" aria-selected="${tab==='marketplace'}" class="tab-btn ${tab==='marketplace'?'active':''}" data-tab="marketplace">🛒 ${t('harvest_mkt').split(' ')[0]}</button>
          <button role="tab" aria-selected="${tab==='saved'}" class="tab-btn ${tab==='saved'?'active':''}" data-tab="saved">🔖 Saved</button>
          <button role="tab" aria-selected="${tab==='prices'}" class="tab-btn ${tab==='prices'?'active':''}" data-tab="prices">💰 ${t('prices')}</button>
          <button role="tab" aria-selected="${tab==='supply'}" class="tab-btn ${tab==='supply'?'active':''}" data-tab="supply">📊 ${t('supply')}</button>
          <button role="tab" aria-selected="${tab==='myoffers'}" class="tab-btn ${tab==='myoffers'?'active':''}" data-tab="myoffers">📋 ${t('my_offers')}</button>
          <button role="tab" aria-selected="${tab==='chats'}" class="tab-btn ${tab==='chats'?'active':''}" data-tab="chats">💬 ${t('chats')}</button>
          <button role="tab" aria-selected="${tab==='settings'}" class="tab-btn ${tab==='settings'?'active':''}" data-tab="settings">⚙️ ${t('settings')}</button>
        ` : `
          <button role="tab" aria-selected="${tab==='dashboard'}" class="tab-btn ${tab==='dashboard'?'active':''}" data-tab="dashboard">📊 ${t('dashboard')}</button>
          <button role="tab" aria-selected="${tab==='farms'}" class="tab-btn ${tab==='farms'?'active':''}" data-tab="farms">🏡 ${t('farms')}</button>
          <button role="tab" aria-selected="${tab==='ponds'}" class="tab-btn ${tab==='ponds'?'active':''}" data-tab="ponds">🐟 ${t('ponds')}</button>
          <button role="tab" aria-selected="${tab==='sensors'}" class="tab-btn ${tab==='sensors'?'active':''}" data-tab="sensors">🌡️ IoT Sensors</button>
          <button role="tab" aria-selected="${tab==='feed'}" class="tab-btn ${tab==='feed'?'active':''}" data-tab="feed">🍽️ ${t('feed')}</button>
          <button role="tab" aria-selected="${tab==='advisory'}" class="tab-btn ${tab==='advisory'?'active':''}" data-tab="advisory">🧠 ${t('advisory')}</button>
          <button role="tab" aria-selected="${tab==='marketplace'}" class="tab-btn ${tab==='marketplace'?'active':''}" data-tab="marketplace">🛒 ${t('market')}</button>
          <button role="tab" aria-selected="${tab==='chats'}" class="tab-btn ${tab==='chats'?'active':''}" data-tab="chats">💬 ${t('chats')}</button>
          <button role="tab" aria-selected="${tab==='shop'}" class="tab-btn ${tab==='shop'?'active':''}" data-tab="shop">🛍️ ${t('shop')}</button>
          <button role="tab" aria-selected="${tab==='prices'}" class="tab-btn ${tab==='prices'?'active':''}" data-tab="prices">💰 ${t('prices')}</button>
          <button role="tab" aria-selected="${tab==='community'}" class="tab-btn ${tab==='community'?'active':''}" data-tab="community">🌐 ${t('community')}</button>
          <button role="tab" aria-selected="${tab==='analytics'}" class="tab-btn ${tab==='analytics'?'active':''}" data-tab="analytics">📈 ${t('analytics')}</button>
          <button role="tab" aria-selected="${tab==='settings'}" class="tab-btn ${tab==='settings'?'active':''}" data-tab="settings">⚙️ ${t('settings')}</button>
        `}
      </div>
      ${loading ? '<div class="loading"><div class="spinner"></div></div>' : renderTab()}
    `;
    attachEvents();
  }

  function renderTab() {
    switch(tab) {
      case 'dashboard': return renderDashboard();
      case 'farms': return renderFarms();
      case 'ponds': return renderPonds();
      case 'sensors': return renderIoTSensors();
      case 'feed': return renderFeedSection();
      case 'advisory': return renderAdvisory();
      case 'marketplace': return renderMarketplace();
      case 'shop': return renderInputShop();
      case 'prices': return renderPrices();
      case 'supply': return renderSupplyForecast();
      case 'myoffers': return renderMyOffers();
      case 'chats': return renderChats();
      case 'myproducts': return renderMyProducts();
      case 'leads': return renderLeads();
      case 'community': return renderAquaCommunity();
      case 'analytics': return renderAnalytics();
      case 'saved': return renderSavedSearches();
      case 'settings': return renderSettings();
      default: return renderDashboard();
    }
  }

  // FARMER DASHBOARD
  function renderDashboard() {
    const d = dashboard || {};
    const pondStats = d.ponds || {};
    const crops = d.active_crops || [];
    const feed = d.feed_30d || {};
    const mort = d.mortality_30d || {};

    return `<div class="section" style="padding-top:8px">
      <div class="stats-grid" style="margin-bottom:12px">
        <div class="stat-card"><div class="stat-icon">🏊</div><div class="stat-value">${pondStats.active_ponds || 0}</div><div class="stat-label">Active Ponds</div></div>
        <div class="stat-card"><div class="stat-icon">📐</div><div class="stat-value">${Number(pondStats.total_area || 0).toFixed(1)}</div><div class="stat-label">Total Acres</div></div>
        <div class="stat-card"><div class="stat-icon">📈</div><div class="stat-value">${Number(pondStats.avg_survival || 0).toFixed(0)}%</div><div class="stat-label">Avg Survival</div></div>
      </div>

      ${crops.length > 0 ? `
        <div class="card" style="padding:14px;margin-bottom:12px">
          <div class="fw-700" style="margin-bottom:10px">🐟 Active Crops (${crops.length})</div>
          <div style="font-size:12px;margin-bottom:8px;color:var(--text3)">Expected Total Yield: <strong style="color:var(--primary)">${(d.total_expected_yield_kg || 0).toLocaleString()} kg</strong></div>
          ${crops.map(c => {
            const pct = Math.min(100, (c.crop_age_days / c.target_doc) * 100);
            return `<div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border)">
              <div class="flex-between" style="margin-bottom:4px">
                <div class="fw-600">${c.pond_code} · ${c.species}</div>
                <span class="tag tag-blue">${c.crop_age_days}d</span>
              </div>
              <div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden;margin-bottom:6px">
                <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#2f80ed,#00c9a7);border-radius:4px;transition:width 0.5s"></div>
              </div>
              <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;text-align:center;font-size:11px">
                <div><div class="fw-600">${c.current_weight_g}g</div><div class="text-muted">Weight</div></div>
                <div><div class="fw-600">${c.survival_pct}%</div><div class="text-muted">Survival</div></div>
                <div><div class="fw-600">${c.estimated_yield_kg}kg</div><div class="text-muted">Est. Yield</div></div>
                <div><div class="fw-600">${c.days_to_harvest}d</div><div class="text-muted">To Harvest</div></div>
              </div>
              ${c.fcr ? `<div class="text-sm text-muted mt-sm">FCR: ${c.fcr} | Feed: ${c.total_feed_kg}kg</div>` : ''}
            </div>`;
          }).join('')}
        </div>
      ` : `<div class="card" style="padding:16px;margin-bottom:12px;text-align:center">
        <div style="font-size:32px;margin-bottom:8px">🐟</div>
        <div class="fw-700">Start Your First Crop</div>
        <div class="text-sm text-muted">Add a pond and start a crop cycle to see your dashboard</div>
      </div>`}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
        <div class="card" style="padding:12px;text-align:center">
          <div style="font-size:20px">🍽️</div>
          <div class="fw-700" style="color:var(--primary)">${Number(feed.total_feed_30d || 0).toLocaleString()} kg</div>
          <div class="text-sm text-muted">Feed (30d)</div>
          <div style="font-size:10px;color:var(--text3)">₹${Number(feed.total_feed_cost_30d || 0).toLocaleString()}</div>
        </div>
        <div class="card" style="padding:12px;text-align:center">
          <div style="font-size:20px">💀</div>
          <div class="fw-700" style="color:${Number(mort.total_mortality_30d || 0) > 0 ? '#F44336' : 'var(--success)'}">${Number(mort.total_mortality_30d || 0).toLocaleString()}</div>
          <div class="text-sm text-muted">Mortality (30d)</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
        <div class="card" style="padding:12px;text-align:center">
          <div class="text-sm text-muted">Avg pH</div>
          <div class="fw-700" style="font-size:18px;color:${pondStats.avg_ph > 9 || pondStats.avg_ph < 7 ? '#F44336' : 'var(--success)'}">${pondStats.avg_ph || '--'}</div>
        </div>
        <div class="card" style="padding:12px;text-align:center">
          <div class="text-sm text-muted">Avg DO</div>
          <div class="fw-700" style="font-size:18px;color:${pondStats.avg_do < 4 ? '#F44336' : 'var(--success)'}">${pondStats.avg_do || '--'} mg/L</div>
        </div>
      </div>
    </div>`;
  }

  // PONDS MANAGEMENT
  function renderPonds() {
    return `<div class="section" style="padding-top:8px">
      <button class="btn btn-primary btn-small mb" id="addPondBtn" style="width:100%">+ Add New Pond</button>
      ${ponds.length === 0 ? `<div class="empty-state"><div class="es-icon">🐟</div><div class="es-title">No ponds registered</div><div class="es-text">Add your first pond to start tracking</div></div>` :
        ponds.map(p => {
          const doc = Math.round(Number(p.doc_computed) || 0);
          return `<div class="card pond-card" data-pond="${p.id}" style="padding:12px;margin-bottom:10px;cursor:pointer">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
              <div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#2f80ed,#00c9a7);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:14px">${p.pond_code?.slice(0,3) || 'P'}</div>
              <div style="flex:1">
                <div class="fw-700">${p.pond_code}</div>
                <div class="text-sm text-muted">${p.species} · ${p.area_acres || 0} acres · DOC: ${doc}d</div>
              </div>
              <span class="tag tag-${p.status === 'active' ? 'green' : p.status === 'harvested' ? 'blue' : 'gray'}">${p.status}</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:4px;text-align:center;font-size:11px">
              <div><div class="fw-600">${Number(p.ph_level || 0).toFixed(1)}</div><div style="color:var(--text3)">pH</div></div>
              <div><div class="fw-600">${Number(p.temperature_c || 0).toFixed(1)}</div><div style="color:var(--text3)">Temp</div></div>
              <div><div class="fw-600">${Number(p.dissolved_o2 || 0).toFixed(1)}</div><div style="color:var(--text3)">DO</div></div>
              <div><div class="fw-600">${Number(p.avg_weight_g || 0).toFixed(1)}g</div><div style="color:var(--text3)">Weight</div></div>
              <div><div class="fw-600">${Number(p.survival_pct || 0).toFixed(0)}%</div><div style="color:var(--text3)">Survival</div></div>
            </div>
            ${p.stocked_count ? `<div class="text-sm text-muted mt-sm">Stocked: ${Number(p.stocked_count).toLocaleString()} | ${p.water_source || ''} ${p.farm_name ? '| ' + p.farm_name : ''}</div>` : ''}
          </div>`;
        }).join('')}
    </div>`;
  }

  // FEED & MORTALITY LOGGING
  function renderFeedSection() {
    return `<div class="section" style="padding-top:8px">
      <div class="section-title">🍽️ Feed & Mortality Logging</div>
      <div class="text-sm text-muted" style="margin:-8px 16px 12px;font-size:12px">Log daily feed usage and mortality for accurate FCR and survival tracking</div>
      ${ponds.filter(p => p.status === 'active').length === 0 ? `<div class="empty-state"><div class="es-icon">🍽️</div><div class="es-title">No active ponds</div><div class="es-text">Add ponds with active crops to log feed</div></div>` :
        ponds.filter(p => p.status === 'active').map(p => `
          <div class="card" style="padding:14px;margin-bottom:10px">
            <div class="flex-between" style="margin-bottom:10px">
              <div class="fw-700">🐟 ${p.pond_code} · ${p.species}</div>
              <span class="tag tag-blue">DOC ${Math.round(Number(p.doc_computed) || 0)}</span>
            </div>
            <div style="display:flex;gap:8px">
              <button class="btn btn-primary btn-small log-feed-btn" data-pid="${p.id}" data-name="${p.pond_code}" style="flex:1">🍽️ Feed</button>
              <button class="btn btn-secondary btn-small log-mort-btn" data-pid="${p.id}" data-name="${p.pond_code}" style="flex:1">💀 Mortality</button>
              <button class="btn btn-secondary btn-small log-water-btn" data-pid="${p.id}" data-name="${p.pond_code}" style="flex:1">💧 Water</button>
            </div>
          </div>
        `).join('')}
      <div class="card" style="padding:14px;margin-top:8px;background:var(--info-bg);border:1px solid var(--info)">
        <div class="fw-600 text-sm">📊 Feed Conversion Ratio (FCR)</div>
        <div class="text-sm text-muted mt-sm">FCR = Total Feed (kg) / Total Biomass Gain (kg). Target: Vannamei 1.2-1.5, Fish 1.5-2.0. Lower is better.</div>
      </div>
    </div>`;
  }

  // IOT SENSOR DASHBOARD
  function renderIoTSensors() {
    // Generate realistic mock sensor readings for up to 3 ponds
    const pondList = ponds.length > 0 ? ponds.slice(0, 3) : [
      { id: 'demo1', name: 'Pond A' },
      { id: 'demo2', name: 'Pond B' },
    ];

    const THRESHOLDS = {
      temperature: { min: 24, max: 32, unit: '°C', icon: '🌡️', label: 'Temperature' },
      ph:          { min: 7.0, max: 8.5, unit: '', icon: '⚗️', label: 'pH' },
      do:          { min: 5, max: 9, unit: 'mg/L', icon: '💧', label: 'Dissolved O₂' },
      turbidity:   { min: 20, max: 40, unit: 'NTU', icon: '🌫️', label: 'Turbidity' },
      salinity:    { min: 0, max: 5, unit: 'ppt', icon: '🧂', label: 'Salinity' },
      ammonia:     { min: 0, max: 0.5, unit: 'mg/L', icon: '⚠️', label: 'Ammonia' },
    };

    // Deterministic mock values per pond
    const mockReading = (pondIdx, param) => {
      const seeds = {
        temperature: [28.4, 29.1, 27.8],
        ph:          [7.6, 7.9, 8.1],
        do:          [6.8, 5.2, 7.4],
        turbidity:   [28, 42, 22],
        salinity:    [2.1, 3.4, 1.8],
        ammonia:     [0.12, 0.48, 0.05],
      };
      return seeds[param]?.[pondIdx % 3] ?? 0;
    };

    // Last 7 "hours" trend for a param (mock)
    const trendData = (pondIdx, param) => {
      const base = mockReading(pondIdx, param);
      return Array.from({ length: 7 }, (_, i) => +(base + (Math.sin(i + pondIdx) * base * 0.05)).toFixed(2));
    };

    const statusColor = (val, min, max) => {
      if (val < min || val > max) return { bg: '#FFEBEE', text: '#C62828', badge: '🔴 ALERT' };
      const pct = (val - min) / (max - min);
      if (pct < 0.15 || pct > 0.85) return { bg: '#FFF8E1', text: '#F57F17', badge: '🟡 WARN' };
      return { bg: '#E8F5E9', text: '#2E7D32', badge: '🟢 OK' };
    };

    return `
      <div style="padding:10px 14px 0">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#006064,#00838F);border-radius:14px;padding:16px;color:white;margin-bottom:14px">
          <div style="font-size:22px;margin-bottom:4px">🌡️</div>
          <div style="font-weight:800;font-size:16px">IoT Sensor Dashboard</div>
          <div style="font-size:11px;opacity:0.85;margin-top:2px">Real-time water quality monitoring · ${pondList.length} pond${pondList.length>1?'s':''} connected</div>
          <div style="margin-top:10px;font-size:10px;opacity:0.7;background:rgba(255,255,255,0.15);padding:6px 10px;border-radius:6px;display:inline-block">🔄 Last updated: ${new Date().toLocaleTimeString()}</div>
        </div>

        ${pondList.map((pond, pIdx) => `
          <div style="background:white;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:16px;overflow:hidden">
            <div style="background:linear-gradient(90deg,#00838F,#006064);color:white;padding:12px 14px;font-weight:700;font-size:13px;display:flex;justify-content:space-between;align-items:center">
              🐟 ${pond.name || `Pond ${pIdx+1}`}
              <span style="font-size:10px;background:rgba(255,255,255,0.2);padding:2px 8px;border-radius:6px">${pond.species || 'Shrimp/Vannamei'}</span>
            </div>
            <div style="padding:12px;display:grid;grid-template-columns:1fr 1fr;gap:8px">
              ${Object.entries(THRESHOLDS).map(([param, cfg]) => {
                const val = mockReading(pIdx, param);
                const trend = trendData(pIdx, param);
                const st = statusColor(val, cfg.min, cfg.max);
                const maxTrend = Math.max(...trend);
                return `
                  <div style="background:${st.bg};border-radius:10px;padding:10px">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
                      <div>
                        <div style="font-size:10px;color:#555;font-weight:600">${cfg.icon} ${cfg.label}</div>
                        <div style="font-size:20px;font-weight:800;color:${st.text}">${val}${cfg.unit}</div>
                        <div style="font-size:9px;color:#777">Range: ${cfg.min}–${cfg.max}${cfg.unit}</div>
                      </div>
                      <span style="font-size:10px;font-weight:700;color:${st.text}">${st.badge}</span>
                    </div>
                    <!-- Mini sparkline -->
                    <div style="display:flex;align-items:flex-end;gap:2px;height:20px;margin-top:6px">
                      ${trend.map(v => `<div style="flex:1;background:${st.text};border-radius:2px 2px 0 0;height:${Math.round((v/maxTrend)*100)}%;opacity:0.6;min-height:2px"></div>`).join('')}
                    </div>
                    <div style="font-size:9px;color:#999;margin-top:2px;text-align:right">7h trend</div>
                  </div>
                `;
              }).join('')}
            </div>

            <!-- Alert summary for pond -->
            ${Object.entries(THRESHOLDS).some(([p, cfg]) => {
              const v = mockReading(pIdx, p);
              return v < cfg.min || v > cfg.max;
            }) ? `
              <div style="margin:0 12px 12px;background:#FFEBEE;border-radius:8px;padding:10px;border-left:4px solid #C62828">
                <div style="font-size:11px;font-weight:700;color:#C62828;margin-bottom:4px">⚠️ Action Required</div>
                ${Object.entries(THRESHOLDS).filter(([p, cfg]) => {
                  const v = mockReading(pIdx, p);
                  return v < cfg.min || v > cfg.max;
                }).map(([p, cfg]) => {
                  const v = mockReading(pIdx, p);
                  return `<div style="font-size:11px;color:#B71C1C">• ${cfg.label}: ${v}${cfg.unit} (${v < cfg.min ? 'below min '+cfg.min : 'above max '+cfg.max}${cfg.unit})</div>`;
                }).join('')}
              </div>
            ` : `
              <div style="margin:0 12px 12px;background:#E8F5E9;border-radius:8px;padding:8px;text-align:center;font-size:11px;color:#2E7D32;font-weight:600">✅ All parameters within optimal range</div>
            `}
          </div>
        `).join('')}

        <!-- Legend -->
        <div style="background:#F5F5F5;border-radius:10px;padding:12px;margin-bottom:20px">
          <div style="font-size:11px;font-weight:700;color:#555;margin-bottom:6px">📡 Sensor Status Legend</div>
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            <div style="font-size:11px">🟢 OK — within range</div>
            <div style="font-size:11px">🟡 WARN — near limit</div>
            <div style="font-size:11px">🔴 ALERT — out of range</div>
          </div>
          <div style="font-size:10px;color:#9E9E9E;margin-top:6px">Note: Showing simulated sensor data. Connect real IoT devices via Settings → Sensor Config</div>
        </div>
      </div>
    `;
  }

  // ADVISORY ENGINE
  function renderAdvisory() {
    const recs = advisoryData.recommendations || [];
    const sysAdv = advisoryData.system_advisories || [];
    const allAdv = [...recs, ...sysAdv.map(a => ({ type: 'system', severity: a.severity, title: a.title, description: a.description }))];

    if (allAdv.length === 0) return `<div class="section" style="padding-top:8px">
      <div class="empty-state"><div class="es-icon">🧠</div><div class="es-title">No advisories</div><div class="es-text">Add ponds with active crops to receive smart recommendations</div></div>
    </div>`;

    const sevOrder = { critical: 0, high: 1, medium: 2, info: 3 };
    allAdv.sort((a, b) => (sevOrder[a.severity] || 3) - (sevOrder[b.severity] || 3));

    return `<div class="section" style="padding-top:8px">
      <div class="section-title">🧠 Smart Advisory (${allAdv.length})</div>
      <div class="text-sm text-muted" style="margin:-6px 16px 12px;font-size:12px">AI-powered recommendations based on your pond data, weather, and growth patterns</div>
      ${allAdv.map(a => {
        const sevColor = a.severity === 'critical' ? '#D32F2F' : a.severity === 'high' ? '#F57C00' : a.severity === 'medium' ? '#FFA000' : '#2196F3';
        const sevIcon = a.severity === 'critical' ? '🚨' : a.severity === 'high' ? '⚠️' : a.severity === 'medium' ? '💡' : 'ℹ️';
        const typeIcon = a.type === 'feed' ? '🍽️' : a.type === 'water' ? '💧' : a.type === 'growth' ? '📈' : a.type === 'disease' ? '🦠' : a.type === 'harvest' ? '🎣' : a.type === 'weather' ? '🌡️' : '🧠';
        return `<div class="card" style="padding:14px;margin-bottom:10px;border-left:4px solid ${sevColor}">
          <div style="display:flex;align-items:flex-start;gap:8px">
            <span style="font-size:18px">${typeIcon}</span>
            <div style="flex:1">
              <div class="fw-700 text-sm">${a.title}</div>
              ${a.pond_code ? `<span class="tag tag-gray" style="font-size:10px;margin-top:2px">${a.pond_code}</span>` : ''}
              <div class="text-sm text-muted" style="margin-top:6px">${a.description}</div>
              ${a.action ? `<div style="margin-top:8px;padding:8px;background:var(--bg);border-radius:6px;font-size:12px"><strong>Action:</strong> ${a.action}</div>` : ''}
            </div>
            <span style="font-size:14px">${sevIcon}</span>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  }

  // HARVEST MARKETPLACE
  function renderMarketplace() {
    if (isBuyer) return renderBuyerMarketplace();
    return `<div class="section" style="padding-top:8px">
      <button class="btn btn-primary btn-small mb" id="addHarvestBtn" style="width:100%">+ List Harvest for Sale</button>
      <div class="section-title">📦 My Harvest Listings</div>
      ${myListings.length === 0 ? `<div class="empty-state"><div class="es-icon">🛒</div><div class="es-title">No harvest listings</div><div class="es-text">Post your harvest when crop is ready</div></div>` :
        myListings.map(h => `
          <div class="card" style="padding:12px;margin-bottom:8px">
            <div class="flex-between">
              <div class="fw-700">🐟 ${h.species}</div>
              <span class="tag tag-${h.status==='available'?'green':'gray'}">${h.status}</span>
            </div>
            <div class="text-sm text-muted mt-sm">${h.quantity_kg}kg · Avg ${h.avg_size_g || 0}g · ${h.location_label || ''}</div>
            <div class="flex-between mt-sm">
              <span class="fw-700" style="color:var(--primary)">₹${Number(h.price_per_kg || 0).toFixed(0)}/kg</span>
              <span class="tag tag-blue">${h.offer_count || 0} offers</span>
            </div>
          </div>
        `).join('')}

      ${offers.length > 0 ? `
        <div class="section-title" style="margin-top:16px">📩 Received Offers (${offers.length})</div>
        ${offers.map(o => `
          <div class="card" style="padding:12px;margin-bottom:8px">
            <div class="flex-between">
              <div class="fw-600">${o.buyer_name || 'Buyer'}</div>
              <span class="tag tag-${o.status==='pending'?'orange':o.status==='accepted'?'green':'gray'}">${o.status}</span>
            </div>
            <div class="text-sm text-muted mt-sm">${o.species || ''} · ₹${Number(o.offer_price).toFixed(0)}/kg · ${o.quantity_kg || '-'}kg</div>
            ${o.message ? `<div class="text-sm mt-sm" style="padding:6px;background:var(--bg);border-radius:6px">"${o.message}"</div>` : ''}
            ${o.status === 'pending' ? `<div style="display:flex;gap:8px;margin-top:8px">
              <button class="btn btn-primary btn-small offer-accept" data-oid="${o.id}" style="flex:1">Accept</button>
              <button class="btn btn-small offer-reject" data-oid="${o.id}" style="flex:1;background:#FFEBEE;color:#C62828;border:none">Reject</button>
              <button class="btn btn-secondary btn-small chat-from-offer" data-listing="${o.listing_id}" data-user="${o.buyer_id}" data-name="${o.buyer_name||'Buyer'}" style="flex:1">💬 Chat</button>
            </div>` : `<button class="btn btn-secondary btn-small chat-from-offer" data-listing="${o.listing_id}" data-user="${o.buyer_id}" data-name="${o.buyer_name||'Buyer'}" style="margin-top:8px;width:100%">💬 Chat with Buyer</button>`}
          </div>
        `).join('')}
      ` : ''}
    </div>`;
  }

  function renderBuyerMarketplace() {
    const tierColor = { Free: '#9E9E9E', Basic: '#2196F3', Pro: '#9C27B0', Enterprise: '#FF6F00' };
    const tierName = subscription?.plan_name || 'Free';
    const offersLeft = subscription ? (subscription.plan_name === 'Enterprise' ? '∞' : (subscription.plan_name === 'Pro' ? 100 : 20)) : 5;
    const filtered = harvestListings.filter(h => {
      if (buyerFilters.species && !h.species?.toLowerCase().includes(buyerFilters.species.toLowerCase())) return false;
      if (buyerFilters.district && !((h.district_name||h.location_label||'').toLowerCase().includes(buyerFilters.district.toLowerCase()))) return false;
      if (buyerFilters.min_qty && Number(h.quantity_kg||0) < buyerFilters.min_qty) return false;
      return true;
    });
    return `<div class="section" style="padding-top:8px">
      <div class="card" style="padding:10px 14px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;background:${tierName==='Free'?'var(--bg)':'linear-gradient(135deg,rgba(33,150,243,0.1),rgba(156,39,176,0.1))'};border:1px solid ${tierColor[tierName]||'var(--border)'}">
        <div>
          <span style="font-size:12px;color:${tierColor[tierName]||'var(--text3)'};font-weight:700">🏅 ${tierName} Plan</span>
          <div style="font-size:10px;color:var(--text3)">${offersLeft} offers/mo ${tierName==='Free'?'· <a href="#" id="upgradePlanBtn" style="color:var(--primary)">Upgrade →</a>':''}</div>
        </div>
        <button class="btn btn-small" id="managePlanBtn" style="font-size:11px">${tierName==='Free'?'Subscribe':'Manage'}</button>
      </div>
      <div class="card" style="padding:12px;margin-bottom:10px">
        <div class="fw-700 text-sm" style="margin-bottom:8px">🔍 Filter + Save Search</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <input class="form-input" type="search" id="bfSpecies" aria-label="Filter by species" placeholder="Species (shrimp, rohu…)" value="${buyerFilters.species}">
          <input class="form-input" id="bfDistrict" aria-label="Filter by district" placeholder="District" value="${buyerFilters.district}">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
          <input class="form-input" type="number" id="bfMinQty" placeholder="Min qty (kg)" value="${buyerFilters.min_qty||''}">
          <button class="btn btn-primary btn-small" id="bfSearch">Filter</button>
          <button class="btn btn-secondary btn-small" id="bfSave">🔔 Save Alert</button>
        </div>
      </div>
      <div class="stats-grid mb-lg">
        <div class="stat-card"><div class="stat-icon">🐟</div><div class="stat-value">${filtered.length}</div><div class="stat-label">Listings</div></div>
        <div class="stat-card"><div class="stat-icon">📊</div><div class="stat-value">${(filtered.reduce((s,h)=>s+Number(h.quantity_kg||0),0)/1000).toFixed(1)}T</div><div class="stat-label">Supply</div></div>
      </div>
      ${filtered.length === 0 ? '<div class="empty-state"><div class="es-icon">🐟</div><div class="es-title">No harvest matching filters</div></div>' :
        filtered.map(h => `
          <div class="listing-card" style="cursor:pointer" data-hlid="${h.id}">
            <div class="l-icon">🐟</div>
            <div class="l-body">
              <div class="l-title">${h.species}${h.is_verified_farmer?` <span style="font-size:10px;color:#00897B">✓ Verified</span>`:''}</div>
              <div class="l-meta">${Number(h.quantity_kg||0).toLocaleString()}kg · ${h.avg_size_g || '?'}g · ${h.location_label || h.district_name || 'AP'}</div>
              <div class="l-tags">
                <span class="tag tag-green">Available</span>
                <span class="tag tag-gray">${h.farmer_name || 'Farmer'}</span>
                ${h.harvest_date ? `<span class="tag tag-blue">${new Date(h.harvest_date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>` : ''}
                ${h.is_urgent?`<span class="tag tag-orange">Urgent</span>`:''}
              </div>
            </div>
            <div style="text-align:right">
              <div class="l-price">₹${Number(h.price_per_kg || 0).toFixed(0)}/kg</div>
              <div style="font-size:10px;color:var(--text3)">${h.offer_count||0} offers</div>
              <button class="btn btn-primary btn-small mt-sm make-offer-btn" data-id="${h.id}">Offer</button>
            </div>
          </div>
        `).join('')}
    </div>`;
  }

  // SAVED SEARCHES (Buyer)
  function renderSavedSearches() {
    return `<div class="section" style="padding-top:8px">
      <div class="section-title">🔖 Saved Searches & Alerts</div>
      <div class="text-sm text-muted" style="margin:-4px 16px 12px;font-size:12px">Save your search filters — get notified when matching harvests are listed</div>
      ${savedSearches.length === 0 ? `<div class="empty-state"><div class="es-icon">🔖</div><div class="es-title">No saved searches</div><div class="es-text">Use the filter on Harvest tab and click "Save Alert"</div></div>` :
        savedSearches.map(s => `
          <div class="card" style="padding:12px;margin-bottom:8px">
            <div class="flex-between">
              <div class="fw-700">${s.name}</div>
              <div style="display:flex;gap:6px;align-items:center">
                <span style="font-size:12px;color:${s.is_alert_on?'var(--success)':'var(--text3)'}">${s.is_alert_on?'🔔':'🔕'}</span>
                <button class="btn btn-small del-search" data-sid="${s.id}" style="background:#FFEBEE;color:#C62828;border:none;font-size:11px">✕</button>
              </div>
            </div>
            <div class="text-sm text-muted mt-sm">${Object.entries(s.filters||{}).filter(([,v])=>v).map(([k,v])=>`${k}: ${v}`).join(' · ') || 'All listings'}</div>
          </div>
        `).join('')}
      <div class="card" style="padding:14px;background:var(--info-bg);border:1px solid var(--info);margin-top:8px">
        <div class="fw-600 text-sm">💡 How search alerts work</div>
        <div class="text-sm text-muted mt-sm">When a farmer lists a harvest matching your filters, you'll see it instantly here. Upgrade to Pro/Enterprise for push + email notifications.</div>
      </div>
    </div>`;
  }

  // SETTINGS TAB — unified settings for all roles
  function renderSettings() {
    const settingsSections = [];

    // KYC Section
    const kycStatus = kycDocs?.overall_status || 'not_submitted';
    const kycColor = kycStatus === 'verified' ? 'var(--success)' : kycStatus === 'pending' ? '#FFA000' : kycStatus === 'rejected' ? '#F44336' : 'var(--text3)';
    settingsSections.push(`
      <div class="card" style="padding:14px;margin-bottom:12px">
        <div class="fw-700" style="margin-bottom:8px">🪪 KYC Verification</div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
          <span style="font-size:18px">${kycStatus==='verified'?'✅':kycStatus==='pending'?'⏳':kycStatus==='rejected'?'❌':'📋'}</span>
          <div>
            <div class="fw-600 text-sm" style="color:${kycColor}">${kycStatus==='verified'?'Verified':kycStatus==='pending'?'Under Review':kycStatus==='rejected'?'Rejected — resubmit':kycStatus==='not_submitted'?'Not Submitted':kycStatus}</div>
            <div class="text-sm text-muted">${kycDocs?.is_verified?'Full access unlocked':'Submit documents to unlock all features'}</div>
          </div>
        </div>
        ${kycStatus !== 'verified' ? `<button class="btn btn-primary btn-small" id="submitKYCBtn" style="width:100%">📤 Submit KYC Documents</button>` : `<div class="text-sm text-muted" style="text-align:center">✓ Identity confirmed</div>`}
      </div>`);

    // Subscription (buyer only)
    if (isBuyer) {
      const tierColor = { Free: '#9E9E9E', Basic: '#2196F3', Pro: '#9C27B0', Enterprise: '#FF6F00' };
      const t = subscription?.plan_name || 'Free';
      settingsSections.push(`
        <div class="card" style="padding:14px;margin-bottom:12px">
          <div class="fw-700" style="margin-bottom:10px">💳 Subscription Plan</div>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:10px">
            ${[{n:'Basic',p:'₹8,000',f:'20 offers/mo · 3 saved searches · 30d prices'},{n:'Pro',p:'₹15,000',f:'100 offers/mo · 10 searches · 180d prices + early alerts'},{n:'Enterprise',p:'₹25,000',f:'Unlimited · 365d history · API + account manager'}].map(tier => `
              <div class="card" style="padding:10px;border:2px solid ${t===tier.n?tierColor[tier.n]:'var(--border)'};box-shadow:none;cursor:pointer" id="tier_${tier.n}">
                <div class="fw-700 text-sm" style="color:${tierColor[tier.n]}">${tier.n}</div>
                <div style="font-size:16px;font-weight:800;margin:4px 0">${tier.p}<span style="font-size:11px;font-weight:400">/mo</span></div>
                <div style="font-size:10px;color:var(--text3);line-height:1.4">${tier.f}</div>
                ${t===tier.n?`<div style="font-size:10px;color:${tierColor[tier.n]};margin-top:4px;font-weight:700">✓ Current Plan</div>`:`<button class="btn btn-primary btn-small upgrade-tier-btn" data-tier="${tier.n}" style="width:100%;margin-top:6px;font-size:11px">Upgrade</button>`}
              </div>
            `).join('')}
          </div>
          ${subscription ? `<div class="text-sm text-muted" style="text-align:center">Expires: ${subscription.expires_at ? new Date(subscription.expires_at).toLocaleDateString('en-IN') : 'Never'}</div>` : ''}
        </div>`);
    }

    // Price Alerts
    settingsSections.push(`
      <div class="card" style="padding:14px;margin-bottom:12px">
        <div class="fw-700" style="margin-bottom:8px">🔔 Price Alerts</div>
        <div class="text-sm text-muted" style="margin-bottom:10px">Get notified when species prices hit your target</div>
        <button class="btn btn-primary btn-small" id="addPriceAlertBtn" style="width:100%;margin-bottom:10px">+ Add Price Alert</button>
        ${priceAlerts.map(a => `
          <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)">
            <span class="fw-600 text-sm">${a.species}</span>
            <span class="text-sm text-muted">${a.direction === 'above' ? '↑' : '↓'} ₹${Number(a.target_price).toFixed(0)}/kg</span>
            <span class="tag tag-${a.is_active?'green':'gray'}" style="font-size:10px">${a.is_active?'Active':'Paused'}</span>
            <button class="btn btn-small del-alert" data-aid="${a.id}" style="margin-left:auto;background:#FFEBEE;color:#C62828;border:none;font-size:11px">✕</button>
          </div>
        `).join('') || `<div class="text-sm text-muted" style="text-align:center">No alerts set</div>`}
        <div style="font-size:11px;color:var(--text3);margin-top:8px">Max 5 active alerts. Current: ${priceAlerts.length}/5</div>
      </div>`);

    // Notification Preferences
    const np = notifPrefs || {};
    settingsSections.push(`
      <div class="card" style="padding:14px;margin-bottom:12px">
        <div class="fw-700" style="margin-bottom:10px">🔕 Notification Preferences</div>
        ${[
          { key: 'feed_reminder', label: '🍽️ Daily Feed Reminder (7 AM)', def: true },
          { key: 'advisory_alerts', label: '🧠 Advisory Alerts', def: true },
          { key: 'offer_notifs', label: '💰 Offer Notifications', def: true },
          { key: 'community_replies', label: '💬 Community Replies', def: true },
          { key: 'daily_prices', label: '📊 Daily Price Updates', def: false },
          { key: 'listing_expiry', label: '⏰ Listing Expiry Reminders', def: true },
          { key: 'supplier_promos', label: '🛍️ Supplier Promotions', def: false },
        ].map(n => `
          <div class="flex-between" style="padding:8px 0;border-bottom:1px solid var(--border)">
            <span class="text-sm">${n.label}</span>
            <label style="display:flex;align-items:center;cursor:pointer">
              <input type="checkbox" class="notif-toggle" data-key="${n.key}" ${(np[n.key] !== undefined ? np[n.key] : n.def) ? 'checked' : ''} style="width:16px;height:16px">
            </label>
          </div>
        `).join('')}
        <div style="display:flex;align-items:center;gap:8px;margin-top:10px">
          <span class="text-sm">🌙 Quiet hours:</span>
          <input class="form-input" type="time" id="quietFrom" value="${np.quiet_from||'22:00'}" style="width:90px;padding:4px;font-size:12px;margin:0">
          <span class="text-sm">to</span>
          <input class="form-input" type="time" id="quietTo" value="${np.quiet_to||'06:00'}" style="width:90px;padding:4px;font-size:12px;margin:0">
        </div>
        <button class="btn btn-primary btn-small" id="saveNotifPrefsBtn" style="width:100%;margin-top:10px">Save Preferences</button>
      </div>`);

    // Privacy Settings
    const ps = privacySettings || {};
    settingsSections.push(`
      <div class="card" style="padding:14px;margin-bottom:12px">
        <div class="fw-700" style="margin-bottom:10px">🔒 Privacy Settings <span style="font-size:10px;font-weight:400;color:var(--text3)">(DPDP Act 2023)</span></div>
        <div class="flex-between" style="padding:8px 0;border-bottom:1px solid var(--border)">
          <div><div class="text-sm fw-600">📍 Farm Location Visibility</div></div>
          <select class="form-input" id="privLocVis" style="width:120px;margin:0;font-size:12px;padding:4px">
            <option value="district" ${(ps.location_visibility||'district')==='district'?'selected':''}>District only</option>
            <option value="village" ${ps.location_visibility==='village'?'selected':''}>Village</option>
            <option value="gps" ${ps.location_visibility==='gps'?'selected':''}>GPS (opt-in)</option>
          </select>
        </div>
        ${[
          { key: 'hide_volume', label: '📦 Hide production volume from public', def: false },
          { key: 'contact_after_offer', label: '📞 Show contact only after offer accepted', def: true },
          { key: 'allow_analytics', label: '📊 Contribute anonymous data to industry stats', def: true },
          { key: 'anonymous_community', label: '👤 Post anonymously in community', def: false },
        ].map(p => `
          <div class="flex-between" style="padding:8px 0;border-bottom:1px solid var(--border)">
            <span class="text-sm">${p.label}</span>
            <input type="checkbox" class="privacy-toggle" data-key="${p.key}" ${(ps[p.key] !== undefined ? ps[p.key] : p.def) ? 'checked' : ''} style="width:16px;height:16px">
          </div>
        `).join('')}
        <button class="btn btn-primary btn-small" id="savePrivacyBtn" style="width:100%;margin-top:10px">Save Privacy Settings</button>
        <button class="btn btn-secondary btn-small" id="exportDataBtn" style="width:100%;margin-top:8px">📥 Export My Data (DPDP Right)</button>
      </div>`);

    // Referral Program
    settingsSections.push(`
      <div class="card" style="padding:14px;margin-bottom:12px;background:linear-gradient(135deg,rgba(0,201,167,0.05),rgba(47,128,237,0.05));border:1px solid var(--primary)">
        <div class="fw-700" style="margin-bottom:8px">🎁 Referral Program</div>
        ${referralInfo ? `
          <div class="text-sm text-muted" style="margin-bottom:10px">Refer a farmer — both get 3 months premium advisory!</div>
          <div style="background:white;border:2px dashed var(--primary);border-radius:8px;padding:12px;text-align:center;margin-bottom:10px">
            <div style="font-size:22px;font-weight:800;letter-spacing:3px;color:var(--primary)">${referralInfo.code}</div>
            <div style="font-size:11px;color:var(--text3)">Your referral code</div>
          </div>
          <div class="flex-between" style="margin-bottom:8px">
            <span class="text-sm">Total Referrals</span>
            <span class="fw-700">${referralInfo.total_referrals}</span>
          </div>
          <button class="btn btn-primary btn-small" id="copyRefBtn" style="width:100%">📋 Copy Invite Link</button>
        ` : `<button class="btn btn-secondary btn-small" id="loadRefBtn" style="width:100%">View My Referral Code</button>`}
        <div class="text-sm text-muted mt-sm" style="font-size:11px">Already have a code? <button id="applyRefBtn" style="background:none;border:none;color:var(--primary);cursor:pointer;font-size:11px;text-decoration:underline">Apply referral code</button></div>
      </div>`);

    return `<div class="section" style="padding-top:8px">${settingsSections.join('')}</div>`;
  }
  function renderAquaCommunity() {
    return `<div class="section" style="padding-top:8px">
      <button class="btn btn-primary btn-small mb" id="addPostBtn" style="width:100%">+ Share Knowledge / Alert</button>
      <div class="text-sm text-muted" style="margin:0 16px 12px;font-size:12px">Share disease alerts, feed tips, growth results with the aquaculture network</div>
      ${communityPosts.length === 0 ? `<div class="empty-state"><div class="es-icon">🌐</div><div class="es-title">No posts yet</div><div class="es-text">Be the first to share knowledge</div></div>` :
        communityPosts.map(p => `
          <div class="card" style="padding:12px;margin-bottom:10px">
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
              <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#2f80ed,#00c9a7);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:12px">${(p.author_name||'?')[0].toUpperCase()}</div>
              <div style="flex:1">
                <div class="fw-700 text-sm">${p.author_name||'Farmer'}</div>
                <div style="font-size:10px;color:var(--text3)">${p.district||''} · ${new Date(p.created_at).toLocaleDateString('en-IN')}</div>
              </div>
              ${p.category ? `<span class="tag tag-${p.category==='disease_alert'?'orange':p.category==='pricing'?'green':'blue'}">${p.category.replace('_',' ')}</span>` : ''}
            </div>
            <div class="text-sm" style="margin-bottom:8px">${p.content}</div>
            ${p.image_url ? `<img src="${p.image_url}" style="width:100%;border-radius:8px;margin-bottom:8px;max-height:200px;object-fit:cover">` : ''}
            <div style="display:flex;gap:12px;color:var(--text3);font-size:12px">
              <button class="post-like" data-pid="${p.id}" style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:12px">❤️ ${p.like_count||0}</button>
              <button class="post-comment" data-pid="${p.id}" style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:12px">💬 ${p.comment_count||0}</button>
            </div>
          </div>
        `).join('')}
    </div>`;
  }

  // ANALYTICS TAB
  function renderAnalytics() {
    const s = stats.stats || stats || {};
    const d = dashboard || {};
    const crops = d.active_crops || [];
    const feed30 = d.feed_30d || {};
    const mort30 = d.mortality_30d || {};
    return `<div class="section" style="padding-top:8px">
      <div class="section-title">📈 Farm Analytics</div>
      <div class="stats-grid mb-lg">
        <div class="stat-card"><div class="stat-icon">🏊</div><div class="stat-value">${ponds.length}</div><div class="stat-label">Total Ponds</div></div>
        <div class="stat-card"><div class="stat-icon">🌱</div><div class="stat-value">${ponds.filter(p=>p.status==='active').length}</div><div class="stat-label">Active</div></div>
        <div class="stat-card"><div class="stat-icon">🎣</div><div class="stat-value">${ponds.filter(p=>p.status==='harvested').length}</div><div class="stat-label">Harvested</div></div>
        <div class="stat-card"><div class="stat-icon">📐</div><div class="stat-value">${ponds.reduce((a,p)=>a+Number(p.area_acres||0),0).toFixed(1)}</div><div class="stat-label">Acres</div></div>
      </div>
      <div class="card" style="padding:14px;margin-bottom:12px">
        <div class="fw-700" style="margin-bottom:10px">🍽️ Feed & Mortality (30 days)</div>
        ${[
          { label: 'Total Feed Used', val: `${Number(feed30.total_feed_30d||0).toLocaleString()} kg`, icon: '🍽️' },
          { label: 'Feed Cost', val: `₹${Number(feed30.total_feed_cost_30d||0).toLocaleString()}`, icon: '💰' },
          { label: 'Total Mortality', val: Number(mort30.total_mortality_30d||0).toLocaleString(), icon: '⚠️' },
          { label: 'Avg Survival', val: `${Number(d?.ponds?.avg_survival||0).toFixed(1)}%`, icon: '✅' },
        ].map(r => `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)">
          <span>${r.icon}</span><div style="flex:1" class="text-sm">${r.label}</div><div class="fw-700 text-sm">${r.val}</div>
        </div>`).join('')}
      </div>
      ${crops.length ? `<div class="card" style="padding:14px;margin-bottom:12px">
        <div class="fw-700" style="margin-bottom:10px">🐟 Active Crop Performance</div>
        ${crops.map(c => `<div style="padding:8px 0;border-bottom:1px solid var(--border)">
          <div class="flex-between"><span class="fw-600 text-sm">${c.pond_code} · ${c.species}</span><span class="tag tag-blue">DOC ${c.crop_age_days}d</span></div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-top:6px;text-align:center;font-size:11px">
            <div><div class="fw-600">${c.current_weight_g}g</div><div class="text-muted">Weight</div></div>
            <div><div class="fw-600">${c.survival_pct}%</div><div class="text-muted">Survival</div></div>
            <div><div class="fw-600">${c.fcr||'-'}</div><div class="text-muted">FCR</div></div>
            <div><div class="fw-600">${c.days_to_harvest}d</div><div class="text-muted">Harvest</div></div>
          </div>
        </div>`).join('')}
      </div>` : ''}
      <div class="card" style="padding:14px;background:var(--info-bg);border:1px solid var(--info)">
        <div class="fw-600 text-sm">💡 FCR Guide</div>
        <div class="text-sm text-muted mt-sm">FCR = Feed (kg) ÷ Weight Gain (kg). Target: Vannamei 1.2–1.5 | Tiger 1.3–1.6 | Fish 1.5–2.0. Lower = better efficiency.</div>
      </div>
    </div>`;
  }

  // INPUT MARKETPLACE (SHOP)
  function renderInputShop() {
    const categories = [...new Set(aquaProducts.map(p => p.category))];
    return `<div class="section" style="padding-top:8px">
      <div class="section-title">🛍️ Aquaculture Input Shop</div>
      <div class="text-sm text-muted" style="margin:-4px 16px 12px">Feed, seed, medicines & supplements</div>
      ${categories.length === 0 ? `<div class="empty-state"><div class="es-icon">🛍️</div><div class="es-title">No products available</div></div>` :
        categories.map(cat => `
          <div class="fw-600 text-sm" style="padding:8px 16px;text-transform:uppercase;color:var(--text3);letter-spacing:0.5px;margin-top:8px">${cat === 'feed' ? '🥫 Feed' : cat === 'seed' ? '🌱 Seeds & PL' : cat === 'medicine' ? '💊 Medicines' : '📦 Supplements'}</div>
          ${aquaProducts.filter(p => p.category === cat).map(p => `
            <div class="listing-card">
              <div class="l-icon">${cat === 'feed' ? '🥫' : cat === 'seed' ? '🌱' : cat === 'medicine' ? '💊' : '📦'}</div>
              <div class="l-body">
                <div class="l-title">${p.name}</div>
                <div class="l-meta">${p.brand || ''} · ${(p.species_tags || []).join(', ')}</div>
                ${p.description ? `<div class="text-sm text-muted" style="margin-top:2px">${p.description}</div>` : ''}
              </div>
              <div style="text-align:right">
                <div class="l-price">₹${Number(p.price || 0).toLocaleString()}</div>
                <div class="text-sm text-muted">per ${p.unit || 'kg'}</div>
              </div>
            </div>
          `).join('')}
        `).join('')}
    </div>`;
  }

  // PRICE INTELLIGENCE
  function renderPrices() {
    if (aquaPrices.length === 0) return `<div class="section" style="padding-top:8px">
      <div class="section-title">💰 Market Prices</div>
      <div class="empty-state"><div class="es-icon">💰</div><div class="es-title">No price data</div></div>
    </div>`;

    const grouped = {};
    aquaPrices.forEach(p => {
      if (!grouped[p.species]) grouped[p.species] = [];
      grouped[p.species].push(p);
    });

    return `<div class="section" style="padding-top:8px">
      <div class="section-title">💰 Today's Market Prices</div>
      <div class="text-sm text-muted" style="margin:-4px 16px 12px">Live prices from AP markets</div>
      ${Object.entries(grouped).map(([species, prices]) => `
        <div class="card" style="padding:14px;margin-bottom:10px">
          <div class="fw-700" style="margin-bottom:8px">🐟 ${species}${prices[0].size_count ? ` (${prices[0].size_count} count)` : ''}</div>
          <div style="display:grid;gap:6px">
            ${prices.map(p => `
              <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)">
                <span class="text-sm">📍 ${p.market_name}</span>
                <span class="fw-700" style="color:var(--primary)">₹${Number(p.price_per_kg).toFixed(0)}/kg</span>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
      <div class="card" style="padding:14px;background:var(--accent-light);border:1px solid var(--accent)">
        <div class="fw-600 text-sm">📊 Price Intelligence</div>
        <div class="text-sm text-muted mt-sm">Prices updated daily from AP markets: Nellore, Bhimavaram, Kakinada, Eluru, Vijayawada</div>
      </div>
    </div>`;
  }

  // SUPPLY FORECAST (Buyer)
  function renderSupplyForecast() {
    const tierName = subscription?.plan_name || 'Free';
    const isPremium = tierName !== 'Free';
    return `<div class="section" style="padding-top:8px">
      <div class="section-title">📊 30-Day Supply Forecast</div>
      ${!isPremium ? `<div class="card" style="padding:16px;margin-bottom:12px;text-align:center;background:linear-gradient(135deg,rgba(156,39,176,0.08),rgba(33,150,243,0.08));border:1px solid #9C27B0">
        <div style="font-size:24px">🔒</div>
        <div class="fw-700" style="margin:8px 0">Premium Feature</div>
        <div class="text-sm text-muted" style="margin-bottom:12px">Supply forecasts are available on Basic, Pro, and Enterprise plans. Upgrade to access 30-day harvest forecasts across all AP districts.</div>
        <button class="btn btn-primary btn-small" id="unlockForecastBtn">Upgrade Now →</button>
      </div>` : ''}
      <div class="card" style="padding:14px;margin-bottom:12px${!isPremium?';filter:blur(3px);pointer-events:none':''}">
        <div class="fw-700" style="margin-bottom:10px">Expected Harvest Next 30 Days — AP</div>
        ${[
          { species: 'Vannamei Shrimp (30 count)', qty: '~1,200 tonnes', ponds: 340, districts: 'W.Godavari, Nellore' },
          { species: 'Vannamei Shrimp (40 count)', qty: '~850 tonnes', ponds: 240, districts: 'E.Godavari, Krishna' },
          { species: 'Tiger Prawn', qty: '~180 tonnes', ponds: 85, districts: 'E.Godavari, Krishna' },
          { species: 'Rohu', qty: '~800 tonnes', ponds: 220, districts: 'Krishna, Guntur' },
          { species: 'Pangasius', qty: '~450 tonnes', ponds: 95, districts: 'W.Godavari' },
          { species: 'Mud Crab', qty: '~120 tonnes', ponds: 40, districts: 'Srikakulam' },
        ].map(f => `
          <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:16px">🐟</span>
            <div style="flex:1">
              <div class="fw-600 text-sm">${f.species}</div>
              <div style="font-size:10px;color:var(--text3)">${f.ponds} ponds | ${f.districts}</div>
            </div>
            <div class="fw-700 text-sm" style="color:var(--primary)">${f.qty}</div>
          </div>
        `).join('')}
      </div>
      ${isPremium ? `<div class="card" style="padding:14px;background:var(--info-bg);border:1px solid var(--info)">
        <div class="fw-600 text-sm">📈 Regional Intelligence Reports</div>
        <div style="margin-top:8px;display:grid;gap:6px">
          ${['District Supply Heatmap','Species Price Index (180d)','Harvest Timing Forecast','Disease Outbreak Map','Demand-Supply Gap Analysis'].map(r => `<div style="display:flex;align-items:center;gap:8px;font-size:12px"><span>📊</span>${r}<span style="margin-left:auto;font-size:10px;color:var(--primary)">View →</span></div>`).join('')}
        </div>
      </div>` : ''}
    </div>`;
  }

  // MY OFFERS (Buyer)
  function renderMyOffers() {
    if (offers.length === 0) return `<div class="section" style="padding-top:8px">
      <div class="empty-state"><div class="es-icon">📋</div><div class="es-title">No offers sent</div><div class="es-text">Browse harvest marketplace and make offers</div></div>
    </div>`;
    return `<div class="section" style="padding-top:8px">
      <div class="section-title">📋 My Offers (${offers.length})</div>
      ${offers.map(o => `
        <div class="card" style="padding:12px;margin-bottom:8px">
          <div class="flex-between">
            <div class="fw-600">${o.species || 'Harvest'}</div>
            <span class="tag tag-${o.status==='pending'?'orange':o.status==='accepted'?'green':'gray'}">${o.status}</span>
          </div>
          <div class="text-sm text-muted mt-sm">₹${Number(o.offer_price).toFixed(0)}/kg · ${o.quantity_kg || '-'}kg · ${o.farmer_name || ''}</div>
          ${o.farmer_response ? `<div class="text-sm mt-sm" style="padding:6px;background:var(--bg);border-radius:6px">Response: "${o.farmer_response}"</div>` : ''}
          <button class="btn btn-secondary btn-small chat-from-offer" data-listing="${o.listing_id}" data-user="${o.farmer_id||''}" data-name="${o.farmer_name||'Farmer'}" style="margin-top:8px;width:100%">💬 Chat with Farmer</button>
        </div>
      `).join('')}
    </div>`;
  }

  // FARMS MANAGEMENT
  function renderFarms() {
    return `<div class="section" style="padding-top:8px">
      <button class="btn btn-primary btn-small mb" id="addFarmBtn" style="width:100%">+ Add New Farm</button>
      <div class="text-sm text-muted" style="margin:0 16px 12px;font-size:12px">Group your ponds under farms for better organization. AP districts: West Godavari, East Godavari, Krishna, Nellore, Guntur, Srikakulam.</div>
      ${farms.length === 0 ? `<div class="empty-state"><div class="es-icon">🏡</div><div class="es-title">No farms registered</div><div class="es-text">Create a farm to organize your ponds</div></div>` :
        farms.map(f => `
          <div class="card" style="padding:14px;margin-bottom:10px">
            <div class="flex-between" style="margin-bottom:6px">
              <div class="fw-700">🏡 ${f.farm_name}</div>
              <span class="tag tag-blue">${f.pond_count_live || 0} ponds</span>
            </div>
            <div class="text-sm text-muted">${f.location || ''} ${f.district_name ? '· ' + f.district_name : ''} ${f.state ? '· ' + f.state : ''}</div>
            ${f.total_area_acres ? `<div class="text-sm text-muted mt-sm">📐 ${f.total_area_acres} acres total</div>` : ''}
            ${f.gps_lat ? `<div class="text-sm text-muted">📍 ${Number(f.gps_lat).toFixed(4)}, ${Number(f.gps_long).toFixed(4)}</div>` : ''}
          </div>
        `).join('')}
    </div>`;
  }

  // CHATS / CONVERSATIONS
  function renderChats() {
    if (conversations.length === 0) return `<div class="section" style="padding-top:8px">
      <div class="empty-state"><div class="es-icon">💬</div><div class="es-title">No conversations</div><div class="es-text">Chat with ${isBuyer?'farmers':'buyers'} to negotiate harvest deals</div></div>
    </div>`;
    return `<div class="section" style="padding-top:8px">
      <div class="section-title">💬 Conversations (${conversations.length})</div>
      ${conversations.map(c => `
        <div class="card chat-thread" data-listing="${c.listing_id || ''}" data-user="${c.other_user_id}" data-name="${c.other_user_name}" style="padding:12px;margin-bottom:8px;cursor:pointer;display:flex;gap:10px;align-items:center">
          <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#2f80ed,#00c9a7);display:flex;align-items:center;justify-content:center;color:white;font-weight:700">${(c.other_user_name||'?')[0].toUpperCase()}</div>
          <div style="flex:1;min-width:0">
            <div class="flex-between"><div class="fw-700">${c.other_user_name}</div>${Number(c.unread_count||0) > 0 ? `<span class="tag tag-orange">${c.unread_count} new</span>` : ''}</div>
            ${c.species ? `<div class="text-sm text-muted">${c.species} · ₹${Number(c.price_per_kg||0).toFixed(0)}/kg</div>` : ''}
            <div class="text-sm" style="color:var(--text2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.last_message || ''}</div>
          </div>
        </div>
      `).join('')}
    </div>`;
  }

  // SUPPLIER: MY PRODUCTS
  function renderMyProducts() {
    return `<div class="section" style="padding-top:8px">
      <button class="btn btn-primary btn-small mb" id="addProductBtn" style="width:100%">+ Add New Product</button>
      <div class="text-sm text-muted" style="margin:0 16px 12px;font-size:12px">Manage your aquaculture product catalog. Reach 100K+ farmers across AP.</div>
      ${myProducts.length === 0 ? `<div class="empty-state"><div class="es-icon">📦</div><div class="es-title">No products listed</div><div class="es-text">Add feed, seeds, medicines, or supplements</div></div>` :
        myProducts.map(p => `
          <div class="card" style="padding:12px;margin-bottom:8px">
            <div class="flex-between">
              <div>
                <div class="fw-700">${p.name}</div>
                <div class="text-sm text-muted">${p.category} · ${p.brand || 'Generic'}</div>
              </div>
              <span class="tag tag-${p.in_stock?'green':'gray'}">${p.in_stock?'In Stock':'Out'}</span>
            </div>
            <div class="flex-between mt-sm">
              <span class="fw-700" style="color:var(--primary)">₹${Number(p.price).toLocaleString()}/${p.unit||'kg'}</span>
              <div style="display:flex;gap:6px">
                <button class="btn btn-small product-edit" data-pid="${p.id}">Edit</button>
                <button class="btn btn-small product-del" data-pid="${p.id}" style="background:#FFEBEE;color:#C62828;border:none">Delete</button>
              </div>
            </div>
          </div>
        `).join('')}
    </div>`;
  }

  // SUPPLIER: LEADS (placeholder using offers/inquiries pattern)
  function renderLeads() {
    return `<div class="section" style="padding-top:8px">
      <div class="section-title">📋 Sales Leads</div>
      <div class="card" style="padding:14px;margin-bottom:12px;background:var(--info-bg);border:1px solid var(--info)">
        <div class="fw-600 text-sm">📊 Lead Tracking</div>
        <div class="text-sm text-muted mt-sm">Farmers who view your products generate leads. Subscribe to Premium Listing (₹4,999/mo) to see contact details and inquiry messages.</div>
      </div>
      <div class="card" style="padding:14px">
        <div class="fw-700" style="margin-bottom:10px">📈 This Month</div>
        ${[
          { label: 'Product Views', val: myProducts.reduce((s,_)=>s+Math.floor(Math.random()*50)+10, 0) },
          { label: 'Inquiries', val: Math.floor(myProducts.length * 2.5) },
          { label: 'Active Listings', val: myProducts.filter(p=>p.in_stock).length },
          { label: 'Avg Rating', val: '4.3 ⭐' },
        ].map(s => `<div class="flex-between" style="padding:6px 0;border-bottom:1px solid var(--border)"><span class="text-sm">${s.label}</span><span class="fw-700">${s.val}</span></div>`).join('')}
      </div>
    </div>`;
  }

  // EVENT HANDLERS
  function attachEvents() {
    // Language switcher
    container.querySelectorAll('.lang-btn').forEach(b => b.addEventListener('click', () => { lang = b.dataset.lang; localStorage.setItem('aqua_lang', lang); render(); }));
    container.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; render(); }));
    container.querySelector('#addPondBtn')?.addEventListener('click', showAddPond);
    container.querySelector('#addHarvestBtn')?.addEventListener('click', showAddHarvest);
    container.querySelectorAll('.pond-card[data-pond]').forEach(c => c.addEventListener('click', () => showPondDetail(c.dataset.pond)));
    container.querySelectorAll('.log-feed-btn').forEach(b => b.addEventListener('click', () => showFeedLog(b.dataset.pid, b.dataset.name)));
    container.querySelectorAll('.log-mort-btn').forEach(b => b.addEventListener('click', () => showMortalityLog(b.dataset.pid, b.dataset.name)));
    container.querySelectorAll('.log-water-btn').forEach(b => b.addEventListener('click', () => showWaterLog(b.dataset.pid, b.dataset.name)));
    container.querySelectorAll('.make-offer-btn').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); showMakeOffer(b.dataset.id); }));
    container.querySelectorAll('.offer-accept').forEach(b => b.addEventListener('click', async () => {
      try { await api.respondAquaOffer(b.dataset.oid, { status: 'accepted' }); showToast('Offer accepted!', 'success'); loadData(); } catch(e) { showToast(e.message,'error'); }
    }));
    container.querySelectorAll('.offer-reject').forEach(b => b.addEventListener('click', async () => {
      try { await api.respondAquaOffer(b.dataset.oid, { status: 'rejected' }); showToast('Offer rejected', 'info'); loadData(); } catch(e) { showToast(e.message,'error'); }
    }));
    container.querySelector('#addFarmBtn')?.addEventListener('click', showAddFarm);
    container.querySelector('#addProductBtn')?.addEventListener('click', () => showProductForm());
    container.querySelectorAll('.product-edit').forEach(b => b.addEventListener('click', () => {
      const p = myProducts.find(x => x.id === b.dataset.pid);
      if (p) showProductForm(p);
    }));
    container.querySelectorAll('.product-del').forEach(b => b.addEventListener('click', async () => {
      if (!confirm('Delete this product?')) return;
      try { await api.deleteAquaProduct(b.dataset.pid); showToast('Product deleted', 'success'); loadData(); } catch(e) { showToast(e.message,'error'); }
    }));
    // Buyer filters
    container.querySelector('#bfSearch')?.addEventListener('click', () => {
      buyerFilters = {
        species: document.querySelector('#bfSpecies')?.value || '',
        district: document.querySelector('#bfDistrict')?.value || '',
        min_qty: Number(document.querySelector('#bfMinQty')?.value) || 0,
      };
      render();
    });
    container.querySelector('#bfSave')?.addEventListener('click', () => {
      const filters = {
        species: document.querySelector('#bfSpecies')?.value || '',
        district: document.querySelector('#bfDistrict')?.value || '',
        min_qty: document.querySelector('#bfMinQty')?.value || '',
      };
      showSaveSearch(filters);
    });
    // Saved searches
    container.querySelectorAll('.del-search').forEach(b => b.addEventListener('click', async () => {
      try { await api.deleteAquaSavedSearch(b.dataset.sid); showToast('Search deleted', 'info'); savedSearches = savedSearches.filter(s => s.id !== b.dataset.sid); render(); } catch(e) { showToast(e.message, 'error'); }
    }));
    // Subscription
    container.querySelector('#managePlanBtn')?.addEventListener('click', () => showSubscriptionManager());
    container.querySelector('#upgradePlanBtn')?.addEventListener('click', (e) => { e.preventDefault(); showSubscriptionManager(); });
    container.querySelectorAll('.upgrade-tier-btn').forEach(b => b.addEventListener('click', () => showUpgradeConfirm(b.dataset.tier)));
    // KYC
    container.querySelector('#submitKYCBtn')?.addEventListener('click', () => showKYCModal());
    // Price alerts
    container.querySelector('#addPriceAlertBtn')?.addEventListener('click', () => showAddPriceAlert());
    container.querySelectorAll('.del-alert').forEach(b => b.addEventListener('click', async () => {
      try { await api.deleteAquaPriceAlert(b.dataset.aid); showToast('Alert removed', 'info'); priceAlerts = priceAlerts.filter(a => a.id !== b.dataset.aid); render(); } catch(e) { showToast(e.message, 'error'); }
    }));
    // Notification prefs
    container.querySelector('#saveNotifPrefsBtn')?.addEventListener('click', async () => {
      const prefs = {};
      container.querySelectorAll('.notif-toggle').forEach(c => { prefs[c.dataset.key] = c.checked; });
      prefs.quiet_from = container.querySelector('#quietFrom')?.value;
      prefs.quiet_to = container.querySelector('#quietTo')?.value;
      try { const r = await api.updateAquaNotificationPrefs(prefs); notifPrefs = r.prefs; showToast('Preferences saved', 'success'); } catch(e) { showToast(e.message, 'error'); }
    });
    // Privacy
    container.querySelector('#savePrivacyBtn')?.addEventListener('click', async () => {
      const settings = { location_visibility: container.querySelector('#privLocVis')?.value };
      container.querySelectorAll('.privacy-toggle').forEach(c => { settings[c.dataset.key] = c.checked; });
      try { const r = await api.updateAquaPrivacySettings(settings); privacySettings = r.settings; showToast('Privacy settings saved', 'success'); } catch(e) { showToast(e.message, 'error'); }
    });
    // Data export
    container.querySelector('#exportDataBtn')?.addEventListener('click', async () => {
      showToast('Preparing your data export…', 'info');
      try {
        const data = await api.exportAquaData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `aquaos-data-${Date.now()}.json`; a.click();
        URL.revokeObjectURL(url);
        showToast('Data exported!', 'success');
      } catch(e) { showToast(e.message, 'error'); }
    });
    // Referral
    container.querySelector('#loadRefBtn')?.addEventListener('click', async () => {
      try { referralInfo = await api.getAquaReferral(); render(); } catch(e) { showToast(e.message, 'error'); }
    });
    container.querySelector('#copyRefBtn')?.addEventListener('click', () => {
      if (referralInfo?.link) { navigator.clipboard.writeText(referralInfo.link).then(() => showToast('Invite link copied!', 'success')); }
    });
    container.querySelector('#applyRefBtn')?.addEventListener('click', () => showApplyReferral());
    container.querySelector('#unlockForecastBtn')?.addEventListener('click', () => showSubscriptionManager());
    // Community
    container.querySelector('#addPostBtn')?.addEventListener('click', showAddCommunityPost);
    container.querySelectorAll('.post-like').forEach(b => b.addEventListener('click', async () => {
      try { await api.likePost(b.dataset.pid); loadData(); } catch(e) { showToast(e.message,'error'); }
    }));
    container.querySelectorAll('.post-comment').forEach(b => b.addEventListener('click', () => showPostComments(b.dataset.pid)));
    container.querySelectorAll('.chat-thread').forEach(c => c.addEventListener('click', () => openChat(c.dataset.listing, c.dataset.user, c.dataset.name)));
    container.querySelectorAll('.chat-from-offer').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      openChat(b.dataset.listing, b.dataset.user, b.dataset.name);
    }));
  }

  // MODALS
  function showAddPond() {
    showModal(`<div class="modal-handle"></div><h3>Add New Pond</h3>
      <div class="form-group"><label>Pond Code</label><input class="form-input" id="npCode" placeholder="P-001"></div>
      <div class="form-group"><label>Species</label><select class="form-input" id="npSpecies"><option>Vannamei Shrimp</option><option>Tiger Prawn</option><option>Rohu</option><option>Catla</option><option>Pangasius</option><option>Mud Crab</option></select></div>
      <div class="form-group"><label>Area (acres)</label><input class="form-input" type="number" id="npArea" step="0.1" placeholder="2.5"></div>
      <div class="form-group"><label>Depth (m)</label><input class="form-input" type="number" id="npDepth" step="0.1" placeholder="1.5"></div>
      <div class="form-group"><label>Water Source</label><select class="form-input" id="npWater"><option value="borewell">Borewell</option><option value="canal">Canal</option><option value="river">River</option><option value="sea">Sea Water</option></select></div>
      <div class="form-group"><label>Stocked Count</label><input class="form-input" type="number" id="npCount" placeholder="200000"></div>
      <div class="form-group"><label>Stocking Date</label><input class="form-input" type="date" id="npStockDate"></div>
      <div class="form-group"><label>Location</label><input class="form-input" id="npLocation" placeholder="Village, District"></div>
      <button class="btn btn-primary" id="submitPond" style="width:100%">Add Pond</button>`);
    document.querySelector('#submitPond')?.addEventListener('click', async () => {
      const code = document.querySelector('#npCode')?.value?.trim();
      if (!code) { showToast('Pond code required', 'error'); return; }
      try {
        await api.createPond({ pond_code: code, species: document.querySelector('#npSpecies')?.value, area_acres: Number(document.querySelector('#npArea')?.value), depth_m: Number(document.querySelector('#npDepth')?.value), water_source: document.querySelector('#npWater')?.value, stocked_count: Number(document.querySelector('#npCount')?.value), stocking_date: document.querySelector('#npStockDate')?.value || undefined, location_label: document.querySelector('#npLocation')?.value });
        showToast('Pond added!', 'success'); closeModal(); loadData();
      } catch(e) { showToast(e.message, 'error'); }
    });
  }

  function showPondDetail(id) {
    const p = ponds.find(x => x.id == id);
    if (!p) return;
    const doc = Math.round(Number(p.doc_computed) || 0);
    showModal(`<div class="modal-handle"></div>
      <h3>🐟 ${p.pond_code}</h3>
      <div class="card" style="box-shadow:none;background:var(--bg)">
        <div class="flex-between mb"><span>Species</span><span class="fw-600">${p.species}</span></div>
        <div class="flex-between mb"><span>Area</span><span>${p.area_acres} acres</span></div>
        <div class="flex-between mb"><span>Depth</span><span>${p.depth_m || '-'}m</span></div>
        <div class="flex-between mb"><span>Stocked</span><span>${Number(p.stocked_count || 0).toLocaleString()}</span></div>
        <div class="flex-between mb"><span>DOC</span><span class="fw-700">${doc} days</span></div>
        <div class="flex-between mb"><span>Avg Weight</span><span>${p.avg_weight_g || 0}g</span></div>
        <div class="flex-between mb"><span>Survival</span><span>${p.survival_pct || 0}%</span></div>
        <div class="flex-between mb"><span>Water</span><span>${p.water_source || 'N/A'}</span></div>
        <div class="flex-between"><span>Status</span><span class="tag tag-${p.status==='active'?'green':'gray'}">${p.status}</span></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px">
        <button class="btn btn-primary btn-small" id="pondGrowthBtn">📊 Log Growth</button>
        <button class="btn btn-secondary btn-small" id="pondCycleBtn">🔄 New Cycle</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
        ${p.status === 'active' ? '<button class="btn btn-secondary btn-small" id="pondHarvestBtn">🎣 Mark Harvested</button>' : '<div></div>'}
        <button class="btn btn-small" id="pondDeleteBtn" style="background:#FFEBEE;color:#C62828;border:none">🗑️ Delete</button>
      </div>`);
    document.querySelector('#pondGrowthBtn')?.addEventListener('click', () => { closeModal(); showGrowthSample(p.id, p.pond_code); });
    document.querySelector('#pondCycleBtn')?.addEventListener('click', () => { closeModal(); showStartCycle(p.id, p.pond_code); });
    document.querySelector('#pondHarvestBtn')?.addEventListener('click', async () => {
      try { await api.updatePond(p.id, { status: 'harvested' }); showToast('Marked harvested', 'success'); closeModal(); loadData(); } catch(e) { showToast(e.message,'error'); }
    });
    document.querySelector('#pondDeleteBtn')?.addEventListener('click', async () => {
      if (!confirm('Delete this pond and all its data?')) return;
      try { await api.deletePond(p.id); showToast('Pond deleted', 'success'); closeModal(); loadData(); } catch(e) { showToast(e.message,'error'); }
    });
  }

  function showFeedLog(pondId, pondName) {
    showModal(`<div class="modal-handle"></div><h3>🍽️ Feed Log — ${pondName}</h3>
      <div class="form-group"><label>Feed Type</label><select class="form-input" id="flType"><option>Pellet</option><option>Starter</option><option>Grower</option><option>Finisher</option></select></div>
      <div class="form-group"><label>Brand</label><input class="form-input" id="flBrand" placeholder="CP, Growel, Godrej…"></div>
      <div class="form-group"><label>Quantity (kg)</label><input class="form-input" type="number" id="flQty" placeholder="50"></div>
      <div class="form-group"><label>Cost (₹)</label><input class="form-input" type="number" id="flCost" placeholder="3500"></div>
      <div class="form-group"><label>Notes</label><input class="form-input" id="flNotes" placeholder="Morning feed, check tray ok…"></div>
      <button class="btn btn-primary" id="submitFeed" style="width:100%">Log Feed</button>`);
    document.querySelector('#submitFeed')?.addEventListener('click', async () => {
      try {
        await api.addFeedLog(pondId, { feed_type: document.querySelector('#flType')?.value, brand: document.querySelector('#flBrand')?.value, quantity_kg: Number(document.querySelector('#flQty')?.value), cost: Number(document.querySelector('#flCost')?.value), notes: document.querySelector('#flNotes')?.value });
        showToast('Feed logged!', 'success'); closeModal();
      } catch(e) { showToast(e.message, 'error'); }
    });
  }

  function showMortalityLog(pondId, pondName) {
    showModal(`<div class="modal-handle"></div><h3>💀 Mortality — ${pondName}</h3>
      <div class="form-group"><label>Mortality Count</label><input class="form-input" type="number" id="mlCount" placeholder="500"></div>
      <div class="form-group"><label>Severity</label><select class="form-input" id="mlSev"><option value="normal">Normal (< 1%)</option><option value="elevated">Elevated (1-5%)</option><option value="high">High (> 5%)</option><option value="critical">Critical (mass die-off)</option></select></div>
      <div class="form-group"><label>Suspected Reason</label><select class="form-input" id="mlReason"><option>Unknown</option><option>White Spot Virus</option><option>Low DO</option><option>pH Shock</option><option>Temperature Stress</option><option>Feed Quality</option><option>Cannibalism</option><option>Algal Bloom</option></select></div>
      <div class="form-group"><label>Observed Symptoms</label><input class="form-input" id="mlSymptoms" placeholder="Lethargy, white spots, red body…"></div>
      <button class="btn btn-primary" id="submitMort" style="width:100%">Log Mortality</button>`);
    document.querySelector('#submitMort')?.addEventListener('click', async () => {
      const count = Number(document.querySelector('#mlCount')?.value);
      if (!count) { showToast('Count required', 'error'); return; }
      try {
        const symptoms = document.querySelector('#mlSymptoms')?.value?.split(',').map(s=>s.trim()).filter(Boolean);
        await api.logMortality(pondId, { mortality_count: count, severity: document.querySelector('#mlSev')?.value, reason: document.querySelector('#mlReason')?.value, symptoms });
        showToast('Mortality logged', 'success'); closeModal(); loadData();
      } catch(e) { showToast(e.message, 'error'); }
    });
  }

  function showWaterLog(pondId, pondName) {
    showModal(`<div class="modal-handle"></div><h3>💧 Water Quality — ${pondName}</h3>
      <div class="form-group"><label>pH Level</label><input class="form-input" type="number" id="wlPh" step="0.1" placeholder="7.8"></div>
      <div class="form-group"><label>Temperature (C)</label><input class="form-input" type="number" id="wlTemp" step="0.1" placeholder="28"></div>
      <div class="form-group"><label>Dissolved O2 (mg/L)</label><input class="form-input" type="number" id="wlDo" step="0.1" placeholder="5.5"></div>
      <div class="form-group"><label>Salinity (ppt)</label><input class="form-input" type="number" id="wlSal" step="0.1" placeholder="15"></div>
      <div class="form-group"><label>Ammonia (mg/L)</label><input class="form-input" type="number" id="wlAmm" step="0.01" placeholder="0.02"></div>
      <button class="btn btn-primary" id="submitWater" style="width:100%">Log Water Quality</button>`);
    document.querySelector('#submitWater')?.addEventListener('click', async () => {
      try {
        await api.logWater(pondId, { ph_level: Number(document.querySelector('#wlPh')?.value), temperature_c: Number(document.querySelector('#wlTemp')?.value), dissolved_o2: Number(document.querySelector('#wlDo')?.value), salinity_ppt: Number(document.querySelector('#wlSal')?.value) || undefined, ammonia_ppm: Number(document.querySelector('#wlAmm')?.value) || undefined });
        showToast('Water quality logged!', 'success'); closeModal(); loadData();
      } catch(e) { showToast(e.message, 'error'); }
    });
  }

  function showGrowthSample(pondId, pondName) {
    showModal(`<div class="modal-handle"></div><h3>📊 Growth Sample — ${pondName}</h3>
      <div class="form-group"><label>Average Weight (g)</label><input class="form-input" type="number" id="gsWeight" step="0.1" placeholder="15.5"></div>
      <div class="form-group"><label>Sample Count</label><input class="form-input" type="number" id="gsCount" value="10" placeholder="10"></div>
      <div class="form-group"><label>Survival Est. (%)</label><input class="form-input" type="number" id="gsSurv" placeholder="78"></div>
      <div class="form-group"><label>Notes</label><input class="form-input" id="gsNotes" placeholder="Good growth, active feeding…"></div>
      <button class="btn btn-primary" id="submitGrowth" style="width:100%">Log Growth</button>`);
    document.querySelector('#submitGrowth')?.addEventListener('click', async () => {
      try {
        await api.addGrowthSample(pondId, { avg_weight_g: Number(document.querySelector('#gsWeight')?.value), sample_count: Number(document.querySelector('#gsCount')?.value), survival_pct: Number(document.querySelector('#gsSurv')?.value) || undefined, notes: document.querySelector('#gsNotes')?.value });
        showToast('Growth recorded!', 'success'); closeModal(); loadData();
      } catch(e) { showToast(e.message, 'error'); }
    });
  }

  function showStartCycle(pondId, pondName) {
    showModal(`<div class="modal-handle"></div><h3>🔄 Start Crop Cycle — ${pondName}</h3>
      <div class="form-group"><label>Species</label><select class="form-input" id="ccSpecies"><option>Vannamei Shrimp</option><option>Tiger Prawn</option><option>Rohu</option><option>Catla</option><option>Pangasius</option></select></div>
      <div class="form-group"><label>Stocking Date</label><input class="form-input" type="date" id="ccDate"></div>
      <div class="form-group"><label>Seed Count</label><input class="form-input" type="number" id="ccSeeds" placeholder="200000"></div>
      <div class="form-group"><label>Seed Supplier</label><input class="form-input" id="ccSupp" placeholder="BMR Hatchery, Avanti…"></div>
      <div class="form-group"><label>Expected Harvest</label><input class="form-input" type="date" id="ccHarvest"></div>
      <button class="btn btn-primary" id="submitCycle" style="width:100%">Start Cycle</button>`);
    document.querySelector('#submitCycle')?.addEventListener('click', async () => {
      try {
        await api.startCropCycle(pondId, { species: document.querySelector('#ccSpecies')?.value, stocking_date: document.querySelector('#ccDate')?.value, seed_count: Number(document.querySelector('#ccSeeds')?.value), seed_supplier: document.querySelector('#ccSupp')?.value, expected_harvest_date: document.querySelector('#ccHarvest')?.value || undefined });
        showToast('Crop cycle started!', 'success'); closeModal(); loadData();
      } catch(e) { showToast(e.message, 'error'); }
    });
  }

  function showAddHarvest() {
    showModal(`<div class="modal-handle"></div><h3>🛒 List Harvest for Sale</h3>
      <div class="form-group"><label>Species</label><select class="form-input" id="hSpecies"><option>Vannamei Shrimp</option><option>Tiger Prawn</option><option>Rohu</option><option>Catla</option><option>Mud Crab</option><option>Pangasius</option></select></div>
      <div class="form-group"><label>Pond</label><select class="form-input" id="hPond"><option value="">Select pond (optional)</option>${ponds.map(p=>`<option value="${p.id}">${p.pond_code} (${p.species})</option>`).join('')}</select></div>
      <div class="form-group"><label>Quantity (kg)</label><input class="form-input" type="number" id="hQty" placeholder="2000"></div>
      <div class="form-group"><label>Average Size (g)</label><input class="form-input" type="number" id="hSize" placeholder="30"></div>
      <div class="form-group"><label>Price per kg (₹) — optional</label><input class="form-input" type="number" id="hPrice" placeholder="420 (leave blank if open to offers)"></div>
      <div class="form-group"><label>Harvest Date</label><input class="form-input" type="date" id="hDate"></div>
      <div class="form-group"><label>Location / District</label><input class="form-input" id="hLoc" placeholder="Village, West Godavari"></div>
      <div class="form-group"><label>📷 Photo URL (optional)</label><input class="form-input" id="hImg" placeholder="https://... or leave empty"></div>
      <div class="form-group" style="display:flex;align-items:center;gap:10px">
        <input type="checkbox" id="hUrgent" style="width:18px;height:18px">
        <label for="hUrgent" style="margin:0">🔴 Mark as Urgent (surfaces higher in buyer search)</label>
      </div>
      <button class="btn btn-primary" id="submitHarvest" style="width:100%">List Harvest</button>`);
    document.querySelector('#submitHarvest')?.addEventListener('click', async () => {
      try {
        await api.createHarvestListing({ species: document.querySelector('#hSpecies')?.value, pond_id: document.querySelector('#hPond')?.value || undefined, quantity_kg: Number(document.querySelector('#hQty')?.value), avg_size_g: Number(document.querySelector('#hSize')?.value), price_per_kg: Number(document.querySelector('#hPrice')?.value) || undefined, harvest_date: document.querySelector('#hDate')?.value, location_label: document.querySelector('#hLoc')?.value, image_url: document.querySelector('#hImg')?.value || undefined, is_urgent: document.querySelector('#hUrgent')?.checked });
        showToast('Harvest listed!', 'success'); closeModal(); loadData();
      } catch(e) { showToast(e.message, 'error'); }
    });
  }

  function showMakeOffer(listingId) {
    const h = harvestListings.find(x => x.id == listingId);
    if (!h) return;
    showModal(`<div class="modal-handle"></div><h3>💰 Make Offer — ${h.species}</h3>
      <div class="card" style="box-shadow:none;background:var(--bg);margin-bottom:12px">
        <div class="flex-between mb"><span>Listed Price</span><span class="fw-700">₹${Number(h.price_per_kg||0).toFixed(0)}/kg</span></div>
        <div class="flex-between mb"><span>Available</span><span>${h.quantity_kg} kg</span></div>
        <div class="flex-between"><span>Location</span><span>${h.location_label || h.district_name || 'AP'}</span></div>
      </div>
      <div class="form-group"><label>Your Offer (₹/kg)</label><input class="form-input" type="number" id="ofPrice" placeholder="${h.price_per_kg}"></div>
      <div class="form-group"><label>Quantity (kg)</label><input class="form-input" type="number" id="ofQty" placeholder="${h.quantity_kg}"></div>
      <div class="form-group"><label>Message</label><input class="form-input" id="ofMsg" placeholder="Interested in bulk purchase…"></div>
      <button class="btn btn-primary" id="submitOffer" style="width:100%">Submit Offer</button>`);
    document.querySelector('#submitOffer')?.addEventListener('click', async () => {
      try {
        await api.createAquaOffer({ listing_id: listingId, offer_price: Number(document.querySelector('#ofPrice')?.value), quantity_kg: Number(document.querySelector('#ofQty')?.value), message: document.querySelector('#ofMsg')?.value });
        showToast('Offer submitted!', 'success'); closeModal();
      } catch(e) { showToast(e.message, 'error'); }
    });
  }

  function showAddFarm() {
    showModal(`<div class="modal-handle"></div><h3>🏡 Add New Farm</h3>
      <div class="form-group"><label>Farm Name</label><input class="form-input" id="fFarmName" placeholder="Sairam Aqua Farm"></div>
      <div class="form-group"><label>Location / Village</label><input class="form-input" id="fLoc" placeholder="Bhimavaram"></div>
      <div class="form-group"><label>District</label><select class="form-input" id="fDist"><option>West Godavari</option><option>East Godavari</option><option>Krishna</option><option>Nellore</option><option>Guntur</option><option>Srikakulam</option><option>Prakasam</option></select></div>
      <div class="form-group"><label>State</label><input class="form-input" id="fState" value="Andhra Pradesh"></div>
      <div class="form-group"><label>Total Area (acres)</label><input class="form-input" type="number" id="fArea" step="0.1" placeholder="10"></div>
      <div class="form-group"><label>GPS Lat (optional)</label><input class="form-input" type="number" id="fLat" step="0.0001" placeholder="16.5449"></div>
      <div class="form-group"><label>GPS Long (optional)</label><input class="form-input" type="number" id="fLng" step="0.0001" placeholder="81.5212"></div>
      <button class="btn btn-primary" id="submitFarm" style="width:100%">Create Farm</button>`);
    document.querySelector('#submitFarm')?.addEventListener('click', async () => {
      const name = document.querySelector('#fFarmName')?.value?.trim();
      if (!name) { showToast('Farm name required', 'error'); return; }
      try {
        await api.createAquaFarm({
          farm_name: name,
          location: document.querySelector('#fLoc')?.value,
          state: document.querySelector('#fState')?.value,
          total_area_acres: Number(document.querySelector('#fArea')?.value) || undefined,
          gps_lat: Number(document.querySelector('#fLat')?.value) || undefined,
          gps_long: Number(document.querySelector('#fLng')?.value) || undefined,
        });
        showToast('Farm created!', 'success'); closeModal(); loadData();
      } catch(e) { showToast(e.message, 'error'); }
    });
  }

  function showProductForm(existing) {
    const isEdit = !!existing;
    const p = existing || {};
    showModal(`<div class="modal-handle"></div><h3>${isEdit?'✏️ Edit':'+ Add'} Product</h3>
      <div class="form-group"><label>Product Name</label><input class="form-input" id="prName" value="${p.name||''}" placeholder="Premium Vannamei Feed"></div>
      <div class="form-group"><label>Category</label><select class="form-input" id="prCat">
        ${['feed','seed','medicine','probiotics','equipment','aerators','other'].map(c => `<option value="${c}" ${p.category===c?'selected':''}>${c}</option>`).join('')}
      </select></div>
      <div class="form-group"><label>Brand</label><input class="form-input" id="prBrand" value="${p.brand||''}" placeholder="CP, Avanti, Growel…"></div>
      <div class="form-group"><label>Description</label><textarea class="form-input" id="prDesc" rows="2">${p.description||''}</textarea></div>
      <div class="form-group"><label>Price (₹)</label><input class="form-input" type="number" id="prPrice" value="${p.price||''}" placeholder="85"></div>
      <div class="form-group"><label>Unit</label><select class="form-input" id="prUnit">
        ${['kg','bag','bottle','litre','piece','set'].map(u => `<option value="${u}" ${p.unit===u?'selected':''}>per ${u}</option>`).join('')}
      </select></div>
      <div class="form-group"><label>Species (comma-separated)</label><input class="form-input" id="prSpecies" value="${(p.species_tags||[]).join(', ')}" placeholder="vannamei, tiger, rohu"></div>
      <div class="form-group"><label><input type="checkbox" id="prStock" ${p.in_stock!==false?'checked':''}> In Stock</label></div>
      <button class="btn btn-primary" id="submitProduct" style="width:100%">${isEdit?'Update':'Create'} Product</button>`);
    document.querySelector('#submitProduct')?.addEventListener('click', async () => {
      const name = document.querySelector('#prName')?.value?.trim();
      if (!name) { showToast('Name required', 'error'); return; }
      const data = {
        name,
        category: document.querySelector('#prCat')?.value,
        brand: document.querySelector('#prBrand')?.value,
        description: document.querySelector('#prDesc')?.value,
        price: Number(document.querySelector('#prPrice')?.value),
        unit: document.querySelector('#prUnit')?.value,
        species_tags: document.querySelector('#prSpecies')?.value?.split(',').map(s=>s.trim().toLowerCase()).filter(Boolean),
        in_stock: document.querySelector('#prStock')?.checked,
      };
      try {
        if (isEdit) await api.updateAquaProduct(p.id, data);
        else await api.createAquaProduct(data);
        showToast(`Product ${isEdit?'updated':'created'}!`, 'success'); closeModal(); loadData();
      } catch(e) { showToast(e.message, 'error'); }
    });
  }

  // COMMUNITY MODALS
  function showAddCommunityPost() {
    showModal(`<div class="modal-handle"></div><h3>🌐 Share with Aqua Community</h3>
      <div class="form-group"><label>Category</label><select class="form-input" id="pcCat">
        <option value="general">General</option>
        <option value="disease_alert">Disease Alert</option>
        <option value="feed_tip">Feed Tip</option>
        <option value="pricing">Pricing</option>
        <option value="techniques">Technique</option>
      </select></div>
      <div class="form-group"><label>Post</label><textarea class="form-input" id="pcContent" rows="4" placeholder="Share disease alert, feed performance, growth results, market tips…"></textarea></div>
      <button class="btn btn-primary" id="submitPost" style="width:100%">Post</button>`);
    document.querySelector('#submitPost')?.addEventListener('click', async () => {
      const content = document.querySelector('#pcContent')?.value?.trim();
      if (!content) { showToast('Write something first', 'error'); return; }
      try {
        await api.createPost({ content, category: document.querySelector('#pcCat')?.value });
        showToast('Posted!', 'success'); closeModal(); loadData();
      } catch(e) { showToast(e.message, 'error'); }
    });
  }

  async function showPostComments(postId) {
    let comments = [];
    try { const r = await api.getComments(postId); comments = r.comments || r || []; } catch(e) {}
    showModal(`<div class="modal-handle"></div><h3>💬 Comments (${comments.length})</h3>
      <div style="max-height:50vh;overflow-y:auto">
        ${comments.length === 0 ? '<div class="text-sm text-muted" style="text-align:center;padding:20px">No comments yet</div>' :
          comments.map(c => `<div style="padding:8px 0;border-bottom:1px solid var(--border)">
            <div class="fw-700 text-sm">${c.author_name || 'Farmer'}</div>
            <div class="text-sm">${c.content}</div>
          </div>`).join('')}
      </div>
      <div style="display:flex;gap:8px;margin-top:12px">
        <input class="form-input" id="commentInput" placeholder="Add comment…" style="flex:1;margin:0">
        <button class="btn btn-primary" id="commentSend">Send</button>
      </div>`);
    document.querySelector('#commentSend')?.addEventListener('click', async () => {
      const content = document.querySelector('#commentInput')?.value?.trim();
      if (!content) return;
      try { await api.addComment(postId, { content }); showToast('Comment added', 'success'); closeModal(); } catch(e) { showToast(e.message,'error'); }
    });
  }

  // CHAT MODAL
  async function openChat(listingId, otherUserId, otherName) {
    let messages = [];
    try {
      const res = await api.getAquaMessages(listingId, otherUserId);
      messages = res.messages || [];
    } catch(e) { console.error(e); }

    const renderChatModal = () => {
      const myId = JSON.parse(localStorage.getItem('agrihub_user') || '{}').id;
      showModal(`<div class="modal-handle"></div>
        <h3>💬 ${otherName}</h3>
        <div id="chatBody" style="max-height:50vh;min-height:300px;overflow-y:auto;background:var(--bg);padding:10px;border-radius:8px;margin-bottom:10px">
          ${messages.length === 0 ? '<div class="text-sm text-muted" style="text-align:center;padding:20px">No messages yet. Start the conversation!</div>' :
            messages.map(m => {
              const mine = m.sender_id === myId;
              return `<div style="display:flex;justify-content:${mine?'flex-end':'flex-start'};margin-bottom:8px">
                <div style="max-width:75%;padding:8px 12px;border-radius:14px;background:${mine?'var(--primary)':'var(--surface)'};color:${mine?'white':'var(--text1)'};font-size:13px">
                  ${!mine ? `<div style="font-size:10px;opacity:0.6;margin-bottom:2px">${m.sender_name}</div>`:''}
                  <div>${m.content}</div>
                  <div style="font-size:9px;opacity:0.6;margin-top:2px">${new Date(m.created_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</div>
                </div>
              </div>`;
            }).join('')}
        </div>
        <div style="display:flex;gap:8px">
          <input class="form-input" id="chatInput" placeholder="Type message…" style="flex:1;margin:0">
          <button class="btn btn-primary" id="chatSend">Send</button>
        </div>`);

      const body = document.querySelector('#chatBody');
      if (body) body.scrollTop = body.scrollHeight;

      const sendMsg = async () => {
        const input = document.querySelector('#chatInput');
        const content = input?.value?.trim();
        if (!content) return;
        try {
          const r = await api.sendAquaMessage({ receiver_id: otherUserId, listing_id: listingId || undefined, content });
          messages.push({ ...r.message, sender_name: 'You' });
          input.value = '';
          renderChatModal();
        } catch(e) { showToast(e.message,'error'); }
      };
      document.querySelector('#chatSend')?.addEventListener('click', sendMsg);
      document.querySelector('#chatInput')?.addEventListener('keypress', e => { if (e.key==='Enter') sendMsg(); });
    };
    renderChatModal();
  }

  // KYC MODAL
  function showKYCModal() {
    showModal(`<div class="modal-handle"></div><h3>🪪 KYC Verification</h3>
      <div class="card" style="box-shadow:none;background:var(--info-bg);border:1px solid var(--info);margin-bottom:12px">
        <div class="text-sm" style="padding:8px">Submit one or more documents to verify your identity and unlock full platform features.</div>
      </div>
      <div class="form-group"><label>Document Type</label><select class="form-input" id="kycType">
        <option value="aadhaar">Aadhaar Card</option>
        <option value="pan">PAN Card</option>
        <option value="gstin_cert">GSTIN Certificate</option>
        <option value="farm_reg">Farm Registration</option>
        <option value="fisheries_license">Fisheries License</option>
      </select></div>
      <div class="form-group"><label>Document Reference / ID Number</label><input class="form-input" id="kycDocUrl" placeholder="e.g. XXXX-XXXX-XXXX or document number"></div>
      <div class="text-sm text-muted" style="margin-bottom:12px;font-size:11px">⚠️ In production, you would upload the actual document file. For this demo, enter the document reference number.</div>
      <button class="btn btn-primary" id="submitKYCDoc" style="width:100%">Submit for Review</button>`);
    document.querySelector('#submitKYCDoc')?.addEventListener('click', async () => {
      const doc_type = document.querySelector('#kycType')?.value;
      const ref = document.querySelector('#kycDocUrl')?.value?.trim();
      if (!ref) { showToast('Enter document reference', 'error'); return; }
      try {
        await api.submitAquaKYC({ doc_type, doc_url: ref });
        showToast('Document submitted for review!', 'success'); closeModal();
        const r = await api.getAquaKYC(); kycDocs = r; render();
      } catch(e) { showToast(e.message, 'error'); }
    });
  }

  // PRICE ALERT MODAL
  function showAddPriceAlert() {
    showModal(`<div class="modal-handle"></div><h3>🔔 Add Price Alert</h3>
      <div class="form-group"><label>Species</label><select class="form-input" id="paSpecies">
        <option>Vannamei Shrimp</option><option>Tiger Prawn</option><option>Rohu</option><option>Catla</option><option>Pangasius</option><option>Mud Crab</option>
      </select></div>
      <div class="form-group"><label>Alert me when price is</label>
        <div style="display:flex;gap:8px;align-items:center">
          <select class="form-input" id="paDir" style="width:120px;flex-shrink:0">
            <option value="above">Above ↑</option>
            <option value="below">Below ↓</option>
          </select>
          <input class="form-input" type="number" id="paPrice" placeholder="₹ target price/kg">
        </div>
      </div>
      <div class="card" style="box-shadow:none;background:var(--bg);padding:10px;margin-bottom:12px">
        <div class="text-sm text-muted">Example: Alert me when Vannamei price rises above ₹400/kg — check during price spikes to time your listings.</div>
      </div>
      <button class="btn btn-primary" id="saveAlertBtn" style="width:100%">Create Alert</button>`);
    document.querySelector('#saveAlertBtn')?.addEventListener('click', async () => {
      const species = document.querySelector('#paSpecies')?.value;
      const target_price = Number(document.querySelector('#paPrice')?.value);
      if (!target_price) { showToast('Enter target price', 'error'); return; }
      try {
        await api.createAquaPriceAlert({ species, target_price, direction: document.querySelector('#paDir')?.value });
        showToast('Price alert set!', 'success'); closeModal();
        const r = await api.getAquaPriceAlerts(); priceAlerts = r.alerts || []; render();
      } catch(e) { showToast(e.message, 'error'); }
    });
  }

  // SAVE SEARCH MODAL
  function showSaveSearch(filters) {
    const desc = Object.entries(filters).filter(([,v])=>v).map(([k,v])=>`${k}: ${v}`).join(', ') || 'All listings';
    showModal(`<div class="modal-handle"></div><h3>🔖 Save Search Alert</h3>
      <div class="form-group"><label>Alert Name</label><input class="form-input" id="ssName" placeholder="e.g. Vannamei West Godavari" value="${filters.species ? filters.species + ' alert' : ''}"></div>
      <div class="card" style="box-shadow:none;background:var(--bg);padding:10px;margin-bottom:10px">
        <div class="text-sm text-muted">Filters: ${desc}</div>
      </div>
      <div class="form-group"><label><input type="checkbox" id="ssAlert" checked> Notify me when new matching listings appear</label></div>
      <button class="btn btn-primary" id="saveSS" style="width:100%">Save Search</button>`);
    document.querySelector('#saveSS')?.addEventListener('click', async () => {
      const name = document.querySelector('#ssName')?.value?.trim();
      if (!name) { showToast('Enter a name', 'error'); return; }
      try {
        await api.createAquaSavedSearch({ name, filters, is_alert_on: document.querySelector('#ssAlert')?.checked });
        showToast('Search saved!', 'success'); closeModal();
        const r = await api.getAquaSavedSearches(); savedSearches = r.searches || []; render();
      } catch(e) { showToast(e.message, 'error'); }
    });
  }

  // SUBSCRIPTION MANAGER
  function showSubscriptionManager() {
    const tierColor = { Free: '#9E9E9E', Basic: '#2196F3', Pro: '#9C27B0', Enterprise: '#FF6F00' };
    const current = subscription?.plan_name || 'Free';
    showModal(`<div class="modal-handle"></div><h3>💳 Buyer Subscription Plans</h3>
      ${[
        { n:'Basic',    p:'₹8,000/mo',  features:['20 offers/month','3 saved search alerts','30-day price history','District-level filter'] },
        { n:'Pro',      p:'₹15,000/mo', features:['100 offers/month','10 saved alerts','180-day history','Early listing alerts','Pre-acceptance contact'] },
        { n:'Enterprise',p:'₹25,000/mo',features:['Unlimited offers','Unlimited alerts','365-day history','Early alerts + API access','Dedicated account manager'] },
      ].map(tier => `
        <div class="card" style="padding:12px;margin-bottom:10px;border:2px solid ${current===tier.n?tierColor[tier.n]:'var(--border)'}">
          <div class="flex-between" style="margin-bottom:6px">
            <span class="fw-700" style="color:${tierColor[tier.n]}">${tier.n}</span>
            <span class="fw-700">${tier.p}</span>
          </div>
          ${tier.features.map(f => `<div class="text-sm" style="padding:2px 0">✅ ${f}</div>`).join('')}
          ${current !== tier.n ? `<button class="btn btn-primary btn-small upgrade-sub-btn" data-tier="${tier.n}" style="width:100%;margin-top:10px">Upgrade to ${tier.n}</button>` : `<div class="text-sm" style="color:${tierColor[tier.n]};font-weight:700;margin-top:8px;text-align:center">✓ Current Plan</div>`}
        </div>
      `).join('')}
      <div class="text-sm text-muted" style="text-align:center;font-size:11px">Demo mode: payments are simulated. In production, Razorpay handles billing.</div>`);
    document.querySelectorAll('.upgrade-sub-btn').forEach(b => b.addEventListener('click', () => showUpgradeConfirm(b.dataset.tier)));
  }

  function showUpgradeConfirm(tier) {
    const prices = { Basic: '₹8,000', Pro: '₹15,000', Enterprise: '₹25,000' };
    showModal(`<div class="modal-handle"></div><h3>Upgrade to ${tier}</h3>
      <div class="card" style="box-shadow:none;background:var(--bg);padding:12px;margin-bottom:12px;text-align:center">
        <div style="font-size:28px;margin-bottom:4px">💳</div>
        <div class="fw-700" style="font-size:18px">${prices[tier]}/month</div>
        <div class="text-sm text-muted">Billed monthly · Cancel anytime</div>
      </div>
      <div class="card" style="box-shadow:none;background:var(--info-bg);border:1px solid var(--info);padding:10px;margin-bottom:12px">
        <div class="text-sm">🔔 Demo Mode: This simulates a successful payment. In production, Razorpay payment gateway handles billing.</div>
      </div>
      <button class="btn btn-primary" id="confirmUpgradeBtn" style="width:100%">✓ Confirm Upgrade (Demo)</button>`);
    document.querySelector('#confirmUpgradeBtn')?.addEventListener('click', async () => {
      try {
        const r = await api.upgradeAquaSubscription({ tier, demo_mode: true });
        subscription = r.subscription;
        showToast(`Upgraded to ${tier}!`, 'success'); closeModal(); render();
      } catch(e) { showToast(e.message, 'error'); }
    });
  }

  // APPLY REFERRAL CODE
  function showApplyReferral() {
    showModal(`<div class="modal-handle"></div><h3>🎁 Apply Referral Code</h3>
      <div class="form-group"><label>Enter Referral Code</label><input class="form-input" id="refCode" placeholder="e.g. RAJU1234" style="text-transform:uppercase"></div>
      <button class="btn btn-primary" id="applyRefCodeBtn" style="width:100%">Apply Code</button>`);
    document.querySelector('#applyRefCodeBtn')?.addEventListener('click', async () => {
      const code = document.querySelector('#refCode')?.value?.trim().toUpperCase();
      if (!code) { showToast('Enter referral code', 'error'); return; }
      try {
        await api.applyAquaReferral({ code });
        showToast('Referral code applied! Both you and the referrer earn 3 months premium advisory.', 'success'); closeModal();
      } catch(e) { showToast(e.message, 'error'); }
    });
  }

  // DATA LOADING
  async function loadData() {
    loading = true; render();
    try {
      // Load settings data for all roles
      const [notifR, privacyR, kycR, alertsR] = await Promise.all([
        api.getAquaNotificationPrefs().catch(() => ({ prefs: null })),
        api.getAquaPrivacySettings().catch(() => ({ settings: null })),
        api.getAquaKYC().catch(() => null),
        api.getAquaPriceAlerts().catch(() => ({ alerts: [] })),
      ]);
      notifPrefs = notifR.prefs;
      privacySettings = privacyR.settings;
      kycDocs = kycR;
      priceAlerts = alertsR.alerts || [];

      if (isSupplier) {
        const [mp, pr] = await Promise.all([
          api.getMyAquaProducts().catch(() => ({ products: [] })),
          api.getAquaPrices().catch(() => ({ prices: [] })),
        ]);
        myProducts = mp.products || [];
        aquaPrices = pr.prices || [];
      } else if (isBuyer) {
        const [hl, pr, of, conv, searches, subR] = await Promise.all([
          api.getHarvestListings('?limit=30').catch(() => ({ listings: [] })),
          api.getAquaPrices().catch(() => ({ prices: [] })),
          api.getAquaOffers('?role=buyer').catch(() => ({ offers: [] })),
          api.getAquaConversations().catch(() => ({ conversations: [] })),
          api.getAquaSavedSearches().catch(() => ({ searches: [] })),
          api.getAquaSubscription().catch(() => ({ subscription: null })),
        ]);
        harvestListings = hl.listings || hl || [];
        aquaPrices = pr.prices || pr || [];
        offers = of.offers || of || [];
        conversations = conv.conversations || [];
        savedSearches = searches.searches || [];
        subscription = subR.subscription;
      } else {
        const [db, p, adv, hl, ml, pr, of, prod, fm, conv, cp] = await Promise.all([
          api.getAquaDashboard().catch(() => ({})),
          api.getPonds().catch(() => ({ ponds: [] })),
          api.getAquaAdvisory().catch(() => ({ recommendations: [], system_advisories: [] })),
          api.getHarvestListings('?limit=20').catch(() => ({ listings: [] })),
          api.getMyAquaListings().catch(() => ({ listings: [] })),
          api.getAquaPrices().catch(() => ({ prices: [] })),
          api.getAquaOffers('?role=farmer').catch(() => ({ offers: [] })),
          api.getAquaProducts().catch(() => ({ products: [] })),
          api.getAquaFarms().catch(() => ({ farms: [] })),
          api.getAquaConversations().catch(() => ({ conversations: [] })),
          api.getPosts('?category=aqua&limit=20').catch(() => ({ posts: [] })),
        ]);
        dashboard = db.dashboard || db || null;
        ponds = p.ponds || p || [];
        advisoryData = adv || {};
        harvestListings = hl.listings || hl || [];
        myListings = ml.listings || ml || [];
        aquaPrices = pr.prices || pr || [];
        offers = of.offers || of || [];
        aquaProducts = prod.products || prod || [];
        farms = fm.farms || [];
        conversations = conv.conversations || [];
        communityPosts = cp.posts || cp || [];
      }
    } catch(e) { console.error('AquaOS load:', e); }
    // Fallback to sample data for new users
    if (!isSupplier && !isBuyer) {
      if (!ponds || ponds.length === 0) ponds = SAMPLE_PONDS;
      if (!dashboard) dashboard = SAMPLE_DASHBOARD;
      if (!harvestListings || harvestListings.length === 0) harvestListings = SAMPLE_HARVEST_LISTINGS;
      if (!aquaPrices || aquaPrices.length === 0) aquaPrices = SAMPLE_PRICES;
      if (!aquaProducts || aquaProducts.length === 0) aquaProducts = SAMPLE_PRODUCTS;
    } else if (isBuyer) {
      if (!harvestListings || harvestListings.length === 0) harvestListings = SAMPLE_HARVEST_LISTINGS;
      if (!aquaPrices || aquaPrices.length === 0) aquaPrices = SAMPLE_PRICES;
    } else if (isSupplier) {
      if (!myProducts || myProducts.length === 0) myProducts = SAMPLE_PRODUCTS;
      if (!aquaPrices || aquaPrices.length === 0) aquaPrices = SAMPLE_PRICES;
    }
    loading = false; render();
  }

  loadData();
}
