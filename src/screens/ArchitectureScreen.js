import { navigate } from '../app-shell.js';

/**
 * Platform Architecture Map
 *
 * Correct Structure:
 *   AgriGalaxy    — Input Supplier Marketplace (seeds, fertilizers, pesticides)
 *   AquaOS        — Standalone aquaculture app
 *   Agri          — Contains: AgriFlow + Community + Weather + Farmers + FPOs
 *                   "Agri Intelligence" = data engine inside Agri
 *   KisanConnect  — Equipment Only (Rent · Buy · Sell · Agri Services)
 *   BhoomiOS      — Land sell/buy/rent marketplace
 *
 * Buyer logs in → sees all 5 platforms → subscribes to what they need
 */

export function renderArchitecture(container) {
  let tab = 'map';

  function render() {
    container.innerHTML = `
      <div class="hero-v2" style="background:linear-gradient(135deg,#1a237e,#311b92);color:white" role="banner">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="hero-avatar" aria-hidden="true">🏗️</div>
          <div style="flex:1">
            <h1 class="hero-title">AgriHub Platform Map</h1>
            <div class="hero-sub">5 platforms · 5 roles · One login · Central data engine</div>
          </div>
        </div>
        <div class="hero-stats" role="list">
          <div class="hero-stat-card" role="listitem"><div class="v">5</div><div class="l">Platform Apps</div></div>
          <div class="hero-stat-card" role="listitem"><div class="v">5</div><div class="l">User Roles</div></div>
          <div class="hero-stat-card" role="listitem"><div class="v">22</div><div class="l">Screens</div></div>
        </div>
      </div>
      <div class="tab-bar-v2" role="tablist" aria-label="Architecture sections">
        ${[['map','🗺️ Platform Map'],['roles','👥 Roles & Access'],['intel','🧠 Agri Intelligence'],['flow','🔄 Data Flow'],['roadmap','🚀 Roadmap']].map(([k,l])=>`
          <button class="tab-btn ${tab===k?'active':''}" role="tab" aria-selected="${tab===k}" data-tab="${k}">${l}</button>
        `).join('')}
      </div>
      <div style="padding:14px 14px 80px">${renderTab()}</div>
    `;
    container.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; render(); }));
    container.querySelectorAll('[data-nav]').forEach(el => el.addEventListener('click', () => navigate(el.dataset.nav)));
  }

  function renderTab() {
    switch(tab) {
      case 'map':     return renderMap();
      case 'roles':   return renderRoles();
      case 'intel':   return renderIntelligenceExplainer();
      case 'flow':    return renderFlow();
      case 'roadmap': return renderRoadmap();
      default: return renderMap();
    }
  }

  // ─── PLATFORM MAP ─────────────────────────────────────────────────────────
  function renderMap() {
    return `
      <!-- PLATFORM OVERVIEW -->
      <div style="background:linear-gradient(135deg,#E8EAF6,#E3F2FD);border-radius:12px;padding:14px;margin-bottom:16px;text-align:center">
        <div style="font-weight:800;color:#1a237e;margin-bottom:4px">AgriHub Super Platform</div>
        <div style="font-size:11px;color:#3949AB">5 standalone platforms · Single login · Unified data engine</div>
        <div style="display:flex;justify-content:center;gap:16px;margin-top:12px;flex-wrap:wrap">
          ${[['🌐','AgriGalaxy'],['🐟','AquaOS'],['🌾','Agri'],['🚜','KisanConnect'],['🏡','BhoomiOS']].map(([e,n])=>`<div style="text-align:center"><div style="font-size:24px">${e}</div><div style="font-size:10px;font-weight:700;color:#1a237e">${n}</div></div>`).join('')}
        </div>
      </div>

      <!-- PLATFORM 1: AGRIGALAXY -->
      <div style="border:2px solid #6A1B9A;border-radius:14px;padding:14px;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <div style="width:42px;height:42px;border-radius:10px;background:linear-gradient(135deg,#6A1B9A,#4A148C);display:flex;align-items:center;justify-content:center;font-size:22px">🌐</div>
          <div style="flex:1">
            <div style="font-weight:800;font-size:15px">AgriGalaxy</div>
            <div style="font-size:11px;color:var(--text3)">Input Supplier Marketplace · Seeds · Fertilizers · Pesticides</div>
          </div>
          <button class="btn btn-small" data-nav="agrigalaxy" style="background:#6A1B9A;color:white;border:none;font-size:11px">Open →</button>
        </div>
        <div style="background:#F3E5F510;border:1px dashed #6A1B9A40;border-radius:10px;padding:10px;margin-bottom:10px">
          <div style="font-size:11px;font-weight:700;color:#6A1B9A;margin-bottom:6px">🏪 The Foundation App of AgriHub Ecosystem</div>
          <div style="font-size:10px;color:var(--text2);line-height:1.5">
            Sellers (input suppliers) list their stores, products & prices. Farmers (buyers) browse, compare & purchase agricultural inputs.
            This is where every farming season begins — getting the right seeds, fertilizers & pesticides.
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
          ${[
            {e:'🏪',c:'#6A1B9A',t:'Seller / Supplier',d:'List store · Add products · Manage inventory · Orders'},
            {e:'👨‍🌾',c:'#2E7D32',t:'Farmer / Buyer',d:'Browse stores · Search products · Compare prices · Buy'},
            {e:'🌱',c:'#33691E',t:'Seeds Catalog',d:'Hybrid · Traditional · Region-wise varieties'},
            {e:'🧪',c:'#E65100',t:'Fertilizers & Pesticides',d:'NPK · Organic · Spray chemicals · Dosage info'},
          ].map(p=>`<div style="background:${p.c}10;border:1px solid ${p.c}25;border-radius:8px;padding:8px;text-align:center">
            <div style="font-size:18px">${p.e}</div>
            <div style="font-size:10px;font-weight:700;color:${p.c};margin:3px 0">${p.t}</div>
            <div style="font-size:9px;color:var(--text3)">${p.d}</div>
          </div>`).join('')}
        </div>
      </div>

      <!-- PLATFORM 2: AquaOS -->
      <div style="border:2px solid #0277BD;border-radius:14px;padding:14px;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <div style="width:42px;height:42px;border-radius:10px;background:linear-gradient(135deg,#0277BD,#00ACC1);display:flex;align-items:center;justify-content:center;font-size:22px">🐟</div>
          <div style="flex:1">
            <div style="font-weight:800;font-size:15px">AquaOS</div>
            <div style="font-size:11px;color:var(--text3)">Standalone Aquaculture Platform · AP shrimp, fish, crab</div>
          </div>
          <button class="btn btn-small" data-nav="aquaos" style="background:#0277BD;color:white;border:none;font-size:11px">Open →</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">
          ${[
            {e:'👨‍🌾',c:'#2E7D32',t:'Aqua Farmer',d:'Pond OS · Feed logs · Harvest listing'},
            {e:'🛒',c:'#E65100',t:'Aqua Buyer',d:'Search harvests · Offers · Chat'},
            {e:'🏭',c:'#6A1B9A',t:'Input Supplier',d:'Feed · Medicine · Equipment'},
          ].map(p=>`<div style="background:${p.c}10;border:1px solid ${p.c}25;border-radius:8px;padding:8px;text-align:center">
            <div style="font-size:18px">${p.e}</div>
            <div style="font-size:10px;font-weight:700;color:${p.c};margin:3px 0">${p.t}</div>
            <div style="font-size:9px;color:var(--text3)">${p.d}</div>
          </div>`).join('')}
        </div>
      </div>

      <!-- PLATFORM 2: AGRI (UMBRELLA) -->
      <div style="border:2px solid #2E7D32;border-radius:14px;padding:14px;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <div style="width:42px;height:42px;border-radius:10px;background:linear-gradient(135deg,#2E7D32,#1B5E20);display:flex;align-items:center;justify-content:center;font-size:22px">🌾</div>
          <div style="flex:1">
            <div style="font-weight:800;font-size:15px">Agri</div>
            <div style="font-size:11px;color:var(--text3)">Crop Supply Ecosystem · Nationwide · FPO-powered</div>
          </div>
          <button class="btn btn-small" data-nav="agri" style="background:#2E7D32;color:white;border:none;font-size:11px">Open →</button>
        </div>

        <!-- Sub-sections inside Agri -->
        <div style="background:#E8F5E912;border:1px dashed #2E7D3240;border-radius:10px;padding:10px;margin-bottom:10px">
          <div style="font-size:11px;font-weight:700;color:#2E7D32;margin-bottom:8px">Inside the Agri Platform:</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
            ${[
              {e:'🔄',t:'AgriFlow',d:'Crop supply chain — declarations, listings, inquiries (Farmer→FPO→Buyer)'},
              {e:'🧠',t:'Agri Intelligence',d:'DATA ENGINE — powers supply forecasts, harvest timelines, price signals'},
              {e:'💬',t:'Community',d:'Pest alerts · Farming tips · Disease warnings'},
              {e:'🌤️',t:'Weather',d:'Regional forecast · Crop advisory · Risk index'},
              {e:'👥',t:'Farmers',d:'120K+ registered farmers · District-wise supply data'},
              {e:'🏢',t:'FPOs',d:'5,000+ Producer orgs · Aggregated procurement data'},
            ].map(s=>`<div style="background:white;border-radius:7px;padding:8px;border-left:3px solid #2E7D32">
              <div style="font-size:14px">${s.e}</div>
              <div style="font-size:10px;font-weight:700;color:#2E7D32">${s.t}</div>
              <div style="font-size:9px;color:var(--text3);line-height:1.4;margin-top:1px">${s.d}</div>
            </div>`).join('')}
          </div>
        </div>

        <!-- Roles using Agri -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">
          ${[
            {e:'👨‍🌾',c:'#2E7D32',t:'Crop Farmer',d:'Declare · Harvest · Inquiries'},
            {e:'🏢',c:'#1565C0',t:'FPO Admin',d:'Members · Procurement · Supply'},
            {e:'🛒',c:'#E65100',t:'Crop Buyer',d:'Search · Forecast · Watchlist'},
          ].map(p=>`<div style="background:${p.c}10;border:1px solid ${p.c}25;border-radius:8px;padding:8px;text-align:center">
            <div style="font-size:18px">${p.e}</div>
            <div style="font-size:10px;font-weight:700;color:${p.c};margin:3px 0">${p.t}</div>
            <div style="font-size:9px;color:var(--text3)">${p.d}</div>
          </div>`).join('')}
        </div>
      </div>

      <!-- PLATFORM 4: KISANCONNECT -->
      <div style="border:2px solid #E65100;border-radius:14px;padding:14px;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <div style="width:42px;height:42px;border-radius:10px;background:linear-gradient(135deg,#E65100,#BF360C);display:flex;align-items:center;justify-content:center;font-size:22px">🚜</div>
          <div style="flex:1">
            <div style="font-weight:800;font-size:15px">KisanConnect</div>
            <div style="font-size:11px;color:var(--text3)">Equipment Only · Rent · Buy · Sell · Agri Services</div>
          </div>
          <button class="btn btn-small" data-nav="kisan" style="background:#E65100;color:white;border:none;font-size:11px">Open →</button>
        </div>
        <div style="background:#FBE9E710;border:1px dashed #E6510040;border-radius:10px;padding:10px;margin-bottom:10px">
          <div style="font-size:11px;font-weight:700;color:#E65100;margin-bottom:6px">🚜 Equipment-Only Platform</div>
          <div style="font-size:10px;color:var(--text2);line-height:1.5">
            Farm machinery & equipment marketplace. 3 modes: Rent (temporary hire), Buy (purchase outright), Sell/List (owners list their equipment). Also: custom agri services (operators, harvesters, transport).
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px">
          ${['🔑 Rent Equipment','💰 Buy Equipment','🏷️ Sell / List Equipment','🔧 Agri Services','📋 Bookings & Orders','💼 Farm Jobs'].map(f=>`<div style="display:flex;align-items:center;gap:5px;padding:5px 7px;background:var(--bg);border-radius:6px;font-size:10px">${f}</div>`).join('')}
        </div>
      </div>

      <!-- PLATFORM 5: BHOOMIOS -->
      <div style="border:2px solid #795548;border-radius:14px;padding:14px;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <div style="width:42px;height:42px;border-radius:10px;background:linear-gradient(135deg,#795548,#4E342E);display:flex;align-items:center;justify-content:center;font-size:22px">🏡</div>
          <div style="flex:1">
            <div style="font-weight:800;font-size:15px">BhoomiOS</div>
            <div style="font-size:11px;color:var(--text3)">Agricultural Land Marketplace · Buy · Sell · Rent</div>
          </div>
          <button class="btn btn-small" data-nav="bhoomios" style="background:#795548;color:white;border:none;font-size:11px">Open →</button>
        </div>
        <div style="background:#EFEBE910;border:1px dashed #79554840;border-radius:10px;padding:10px;margin-bottom:10px">
          <div style="font-size:11px;font-weight:700;color:#795548;margin-bottom:6px">🏡 Land Transaction Platform</div>
          <div style="font-size:10px;color:var(--text2);line-height:1.5">
            Buy, sell, or rent agricultural land. Property listings with area, soil type, water source, legal status. District-wise search. Contact landowners directly.
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px">
          ${['🏷️ Sell Land','💰 Buy Land','🔑 Rent / Lease Land','📍 District Search','📄 Land Documents','📞 Contact Owner'].map(f=>`<div style="display:flex;align-items:center;gap:5px;padding:5px 7px;background:var(--bg);border-radius:6px;font-size:10px">${f}</div>`).join('')}
        </div>
      </div>

      <!-- BUYER JOURNEY -->
      <div style="background:linear-gradient(135deg,#BF360C12,#880E4F12);border:1px solid #BF360C30;border-radius:12px;padding:12px">
        <div style="font-weight:700;color:#BF360C;margin-bottom:6px">🛒 Buyer Journey</div>
        <div style="font-size:11px;color:var(--text2);line-height:1.6">
          A buyer logs in → sees all 5 platforms → uses what they need:
        </div>
        <div style="margin-top:8px;display:flex;flex-direction:column;gap:5px">
          ${[
            {t:'Aqua Buyer only',d:'Uses AquaOS Marketplace. Searches shrimp/fish harvests. Makes price offers.'},
            {t:'Crop Buyer only',d:'Uses Agri (AgriFlow). Searches crop supply nationwide. Contacts FPOs.'},
            {t:'Equipment Buyer',d:'Uses KisanConnect. Rent or buy tractors, harvesters & farm machinery.'},
            {t:'Input Supplier',d:'Uses AgriGalaxy. Lists store with seeds, fertilizers, pesticides for farmers.'},
            {t:'Land Buyer/Renter',d:'Uses BhoomiOS. Search & buy/rent agricultural land by district.'},
            {t:'Full Ecosystem',d:'Uses all 5 platforms. Common for large agri-businesses & cooperatives.'},
          ].map(b=>`<div style="background:white;border-radius:8px;padding:8px 10px">
            <div style="font-weight:700;font-size:11px;color:#BF360C">→ ${b.t}</div>
            <div style="font-size:10px;color:var(--text3);margin-top:2px">${b.d}</div>
          </div>`).join('')}
        </div>
      </div>
    `;
  }

  // ─── ROLES ────────────────────────────────────────────────────────────────
  function renderRoles() {
    const roles = [
      {
        e:'👨‍🌾', c:'#2E7D32', t:'Farmer', sub:'Crop or Aquaculture (or both)',
        access:['🌐 AgriGalaxy — Browse & buy seeds, fertilizers, pesticides','🐟 AquaOS — Pond management, harvest listing','🌾 Agri — Crop declarations, harvest calendar, inquiries','🚜 KisanConnect — Rent/buy equipment','🏡 BhoomiOS — Buy or rent farmland'],
        nav:['home','agrigalaxy','aquaos','agri','kisan'],
        price:'Free · ₹100/yr Premium',
      },
      {
        e:'🏢', c:'#1565C0', t:'FPO Admin', sub:'Farmer Producer Organization',
        access:['🌾 Agri — FPO Hub (members, procurement, supply listings)','🚜 KisanConnect — Equipment hire for members','🌐 AgriGalaxy — Bulk input procurement','🏡 BhoomiOS — Land aggregation & leasing'],
        nav:['home','agri','kisan','community','profile'],
        price:'₹2,999–₹4,999/month SaaS',
      },
      {
        e:'🛒', c:'#E65100', t:'Buyer', sub:'Trader · Exporter · Processor · Retailer',
        access:['🐟 AquaOS — Aqua harvest marketplace (if aqua buyer)','🌾 Agri — Crop supply search (if crop buyer)','🚜 KisanConnect — Buy equipment (free)','🏡 BhoomiOS — Buy/rent agricultural land'],
        nav:['home','aquaos','agri','kisan','profile'],
        price:'₹10,000–₹50,000/year per platform',
        note:'Subscribes selectively — aqua-only, crop-only, or both',
      },
      {
        e:'🏭', c:'#6A1B9A', t:'Input Supplier', sub:'Seeds · Fertilizers · Pesticides · Feed · Medicine',
        access:['🌐 AgriGalaxy — List store, manage products, receive orders from farmers','🐟 AquaOS — Input Marketplace (aqua feed, medicine)'],
        nav:['home','agrigalaxy','aquaos','community','profile'],
        price:'₹4,999/month featured listing',
        note:'Sells production inputs to farmers via AgriGalaxy',
      },
      {
        e:'🔧', c:'#546E7A', t:'Service Provider', sub:'Tractor · Labor · Cold Storage · Transport',
        access:['🚜 KisanConnect — Service listings, jobs','🌾 Agri — Community & weather for planning'],
        nav:['home','agri','kisan','community','profile'],
        price:'Free listing · Commission on deals',
      },
    ];
    return roles.map(r=>`
      <div style="border-left:4px solid ${r.c};padding:12px 12px 12px 14px;margin-bottom:12px;background:${r.c}08;border-radius:0 10px 10px 0">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span style="font-size:22px">${r.e}</span>
          <div>
            <div style="font-weight:700;color:${r.c}">${r.t}</div>
            <div style="font-size:11px;color:var(--text3)">${r.sub}</div>
          </div>
        </div>
        ${r.note ? `<div style="background:${r.c}18;border-radius:6px;padding:5px 8px;font-size:11px;color:${r.c};font-weight:600;margin-bottom:8px">ℹ️ ${r.note}</div>` : ''}
        <div style="font-size:11px;font-weight:700;color:var(--text2);margin-bottom:4px">Platform Access:</div>
        ${r.access.map(a=>`<div style="font-size:11px;color:var(--text2);padding:2px 0">✅ ${a}</div>`).join('')}
        <div style="margin-top:6px">
          <div style="font-size:10px;color:var(--text3);margin-bottom:3px">Bottom nav:</div>
          <div style="display:flex;gap:4px;flex-wrap:wrap">${r.nav.map(n=>`<span style="background:${r.c}20;color:${r.c};padding:2px 7px;border-radius:8px;font-size:10px;font-weight:600">${n}</span>`).join('')}</div>
        </div>
        <div style="margin-top:6px;background:${r.c}18;padding:5px 8px;border-radius:6px;font-size:11px;color:${r.c};font-weight:600">💰 ${r.price}</div>
      </div>
    `).join('');
  }

  // ─── AGRI INTELLIGENCE EXPLAINER ──────────────────────────────────────────
  function renderIntelligenceExplainer() {
    return `
      <div style="background:linear-gradient(135deg,#1a237e,#311b92);color:white;border-radius:14px;padding:16px;margin-bottom:14px">
        <div style="font-size:28px;margin-bottom:6px">🧠</div>
        <div style="font-weight:800;font-size:17px;margin-bottom:6px">Agri Intelligence</div>
        <div style="font-size:12px;opacity:0.95;line-height:1.6">
          <strong>Agri Intelligence is NOT a separate app.</strong> It is the data engine that runs inside the Agri platform.
        </div>
      </div>

      <div style="font-weight:700;margin-bottom:10px">What it actually is:</div>
      <div style="background:#E8F5E9;border-radius:10px;padding:12px;margin-bottom:10px">
        <div style="font-weight:700;color:#2E7D32;margin-bottom:5px">The data infrastructure powering AgriFlow:</div>
        ${['Farmers input crop data → system analyzes and forecasts','FPOs input procurement → system builds aggregated supply','District-level harvest timelines calculated from declarations','Price correlation engine → mandi data + supply forecasts','Demand signals from buyer inquiries → feedback to farmers'].map(s=>`<div style="font-size:11px;color:#1B5E20;padding:3px 0">→ ${s}</div>`).join('')}
      </div>

      <div style="font-weight:700;margin-bottom:10px">What each role calls it:</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px">
        ${[
          {e:'👨‍🌾', r:'Farmer', sees:'Price alerts · Crop advisory · Harvest calendar · Plans', color:'#2E7D32'},
          {e:'🏢', r:'FPO Admin', sees:'Member analytics · Procurement insights · Market intelligence', color:'#1565C0'},
          {e:'🛒', r:'Buyer', sees:'Supply search results · Harvest forecasts · District heatmaps · Watchlist', color:'#E65100'},
        ].map(i=>`<div style="border:1px solid ${i.color}30;border-radius:10px;padding:10px;background:${i.color}08">
          <div style="font-weight:700;color:${i.color};margin-bottom:3px">${i.e} ${i.r}</div>
          <div style="font-size:11px;color:var(--text2)">Calls it: "${i.r === 'Buyer' ? 'Supply Search & Intelligence' : i.r + ' Hub'}"</div>
          <div style="font-size:11px;color:var(--text3);margin-top:3px">Sees: ${i.sees}</div>
        </div>`).join('')}
      </div>

      <div style="background:#FFF8E1;border:1px solid #FFD54F;border-radius:10px;padding:12px">
        <div style="font-weight:700;color:#F57F17;margin-bottom:5px">💡 The core innovation:</div>
        <div style="font-size:12px;color:#E65100;line-height:1.5">
          A crop buyer can know <strong>40 days in advance</strong> that 500 tons of Tomato will be ready in West Godavari.
          No Indian platform currently does this at scale.
          This is powered by farmers declaring crops before harvest — and the intelligence engine aggregating it in real time.
        </div>
      </div>
    `;
  }

  // ─── DATA FLOW ────────────────────────────────────────────────────────────
  function renderFlow() {
    return `
      <div style="font-weight:700;margin-bottom:12px">🔄 How Supply Data Flows Through AgriHub</div>

      ${[
        {color:'#2E7D32', step:'Step 1 · Farmer Inputs', items:['Aqua Farmer: logs pond stocking → species, seed count, feed, water params','Crop Farmer: declares crop → area, expected yield, harvest date, location','FPO: records member procurement → quantity, quality, price paid']},
        {color:'#1565C0', step:'Step 2 · Data Aggregated (Agri Intelligence Engine)', items:['Harvest timelines computed from declarations + pond cycles','District-level supply forecasts built from farmer + FPO data','Price signals correlated with regional supply/demand data','Buyer demand tracked from inquiry patterns']},
        {color:'#E65100', step:'Step 3 · Buyer Discovers Supply', items:['Buyer searches: "Tomato, Andhra Pradesh, harvest next 10 days, >10 tons"','Sees: FPO aggregated supply + individual farmer listings','Sends inquiry → Farmer/FPO responds → Deal negotiated']},
        {color:'#6A1B9A', step:'Data Privacy Rules', items:['Farmer → sees ONLY their own farm data','FPO → sees their member farmers data only','Buyer → sees AGGREGATED supply (not individual farmer contacts unless opted-in)','Supplier → sees only product leads relevant to them']},
      ].map(s=>`<div style="background:${s.color}10;border-radius:10px;padding:12px;margin-bottom:10px;border-left:4px solid ${s.color}">
        <div style="font-weight:700;color:${s.color};margin-bottom:6px">${s.step}</div>
        ${s.items.map(i=>`<div style="font-size:11px;color:var(--text2);padding:3px 0">→ ${i}</div>`).join('')}
      </div>`).join('')}
    `;
  }

  // ─── ROADMAP ──────────────────────────────────────────────────────────────
  function renderRoadmap() {
    return `
      ${[
        {phase:'Phase 1 · Building Now',color:'#2E7D32',status:'🟢',items:['AgriGalaxy — Input supplier marketplace (seeds, fertilizers, pesticides)','Farmer App (AquaOS + Agri)','FPO Management Platform','Central Data Engine','KisanConnect — Equipment rent/buy/sell','BhoomiOS — Land buy/sell/rent']},
        {phase:'Phase 2 · Next',color:'#1565C0',status:'🔵',items:['Full Buyer Intelligence (AgriFlow search)','AquaOS Marketplace (offers, chat)','AgriGalaxy — Reviews, ratings, delivery tracking','BhoomiOS — Legal document verification','Payment gateway integration','Push notifications + alerts']},
        {phase:'Phase 3 · Scale',color:'#6A1B9A',status:'🟣',items:['Crop production heatmaps (district-level)','AI supply forecasting (90-day windows)','Farmer credit scoring (NABARD)','Crop insurance integration','IoT water sensor integration (AquaOS)','Cross-platform analytics dashboard']},
      ].map(p=>`
        <div style="margin-bottom:14px;border-left:4px solid ${p.color};padding-left:14px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <div style="font-weight:800;color:${p.color}">${p.phase}</div>
            <div style="margin-left:auto;font-size:14px">${p.status}</div>
          </div>
          ${p.items.map(i=>`<div style="font-size:12px;padding:3px 0;color:var(--text2)">• ${i}</div>`).join('')}
        </div>
      `).join('')}
      <div style="background:linear-gradient(135deg,#1a237e,#311b92);color:white;border-radius:12px;padding:14px;margin-top:8px">
        <div style="font-weight:800;margin-bottom:8px">🎯 3-Year Targets</div>
        ${['1,00,000 registered farmers','10,000 active buyers (aqua + crop)','5,000 FPOs on the platform','2,000 input suppliers listed','500+ districts nationwide covered'].map(g=>`<div style="font-size:12px;opacity:0.9;padding:3px 0">→ ${g}</div>`).join('')}
      </div>
    `;
  }

  render();
}
