import { api } from '../api.js';
import { getRole, getState } from '../store.js';
import { navigate, showToast } from '../app-shell.js';
import { t } from '../i18n.js';
import { heroBanner } from '../components/ui.js';

/**
 * AgriHub Screen — the "Agri" section of the platform
 *
 * This is an UMBRELLA for:
 *   AgriFlow   — Crop supply chain (declarations, listings, inquiries)
 *   Community  — Farmer community (tips, pest alerts, discussions)
 *   Weather    — Forecast + crop advisory
 *   Farmers    — Registered farmers network (FPO view / buyer discovery)
 *   FPOs       — Farmer Producer Orgs (buyer discovery / supplier awareness)
 *
 * "Agri Intelligence" is NOT a separate app.
 * It is the data engine that POWERS the Agri ecosystem:
 *   • Farmers declare crops → data collected
 *   • FPOs aggregate procurement → data collected
 *   • Central engine forecasts supply, prices, harvest timelines
 *   • Buyers DISCOVER that supply via AgriFlow search
 *
 * This screen is the home base for that whole ecosystem.
 */

export function renderAgriHub(container) {
  const role = getRole();
  const user = getState().user;

  const isFarmer   = role === 'farmer';
  const isFPO      = role === 'fpo';
  const isBuyer    = role === 'buyer';
  const isSupplier = role === 'supplier';

  let stats = { farmers: 0, listings: 0, districts: 0, fpos: 0, declarations: 0 };
  let prices = [];
  let loading = true;

  function render() {
    const HERO = {
      farmer:           { bg:'linear-gradient(135deg,#2E7D32,#00796B)', icon:'🌾', title:'Agri · My Farm', sub:'Declare crops · Post harvests · Track markets · Community' },
      fpo:              { bg:'linear-gradient(135deg,#1565C0,#6A1B9A)', icon:'🏢', title:'Agri · FPO Hub',  sub:'Members · Procurement · Supply listings · Intelligence' },
      buyer:            { bg:'linear-gradient(135deg,#E65100,#B71C1C)', icon:'🔍', title:'Agri · Supply Discovery', sub:'Search nation-wide crop supply powered by real farmer data' },
      supplier:         { bg:'linear-gradient(135deg,#4527A0,#1565C0)', icon:'📦', title:'Agri · Input Network', sub:'Reach crop farmers · List fertilizers, seeds, pesticides' },
      service_provider: { bg:'linear-gradient(135deg,#4E342E,#37474F)', icon:'🔧', title:'Agri · Services',  sub:'List agri services · Connect with farmers' },
    };
    const h = HERO[role] || HERO.farmer;

    container.innerHTML = `
      <!-- HERO v2 -->
      ${heroBanner({
        gradient: h.bg,
        icon: h.icon,
        greeting: h.title.split('·')[0]?.trim() || 'Agri',
        title: h.title.split('·')[1]?.trim() || h.title,
        subtitle: h.sub,
        actions: [
          { icon:'🔔', onClick:'notifications', badge:true },
          { icon:'💬', onClick:'community' },
        ],
        stats: loading ? [] : [
          { value: fmt(stats.farmers),   label: 'Farmers' },
          { value: fmt(stats.listings),  label: 'Listings' },
          { value: fmt(stats.districts), label: 'Districts' },
          { value: fmt(stats.fpos),      label: 'FPOs' },
        ],
      })}

      <div style="padding:14px 14px 80px">
        ${isFarmer   ? renderFarmerHub()   :
          isFPO      ? renderFPOHub()      :
          isBuyer    ? renderBuyerHub()    :
          isSupplier ? renderSupplierHub() :
                       renderServiceHub()}
      </div>
    `;
    container.querySelectorAll('[data-nav]').forEach(el => el.addEventListener('click', () => navigate(el.dataset.nav)));
    if (!loading) return;
    loadStats();
  }

  // ─── FARMER VIEW ──────────────────────────────────────────────────────────
  function renderFarmerHub() {
    return `
      <!-- AGRI INTELLIGENCE EXPLAINER for FARMER -->
      ${renderIntelligenceBox('farmer')}

      <!-- MAIN ACTIONS -->
      <div style="margin-bottom:14px">
        <div class="section-title">Your Agri Tools</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          ${farmTile('🌾','My Crops','agriflow','Declare crops · List harvests · Get inquiries','#2E7D32')}
          ${farmTile('📊','My Hub','intelligence','Track farm data · Prices · Plans','#1565C0')}
          ${farmTile('💬','Community','community','Pest alerts · Tips · Discussions','#E65100')}
          ${farmTile('🌤️','Weather','weather','7-day forecast · Crop advisory','#0288D1')}
        </div>
      </div>

      <!-- CROP PRICES -->
      <div class="section-title" style="margin:14px 0 8px">💰 Today's Mandi Prices</div>
      <div id="priceCards">${loading ? skelPrice() : renderPriceCards()}</div>

      <!-- AGRI NETWORK -->
      <div style="margin-top:14px">
        <div class="section-title">🌍 The Agri Network Powers You</div>
        <div style="background:#E8F5E9;border-radius:10px;padding:12px;font-size:12px;color:#1B5E20;line-height:1.6">
          Every crop you declare adds to the national supply picture. Buyers discover your supply.
          FPOs aggregate your produce for better prices. The more farmers declare, the better the entire market works.
          <br><br><span style="font-weight:700">Your data is private</span> — buyers only see aggregated district-level supply, not your personal details.
        </div>
      </div>
    `;
  }

  // ─── FPO VIEW ─────────────────────────────────────────────────────────────
  function renderFPOHub() {
    return `
      ${renderIntelligenceBox('fpo')}

      <div style="margin-bottom:14px">
        <div class="section-title">FPO Management Suite</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          ${farmTile('🏢','FPO Hub','agriflow','Members · Procurement · Listings','#1565C0')}
          ${farmTile('📊','Analytics','intelligence','Member insights · Procurement stats','#6A1B9A')}
          ${farmTile('👥','Farmer Network','community','Your member farmers · Community','#2E7D32')}
          ${farmTile('🌤️','Weather','weather','Forecast for your region','#0288D1')}
        </div>
      </div>

      <div>
        <div class="section-title">💰 Market Prices</div>
        <div id="priceCards">${loading ? skelPrice() : renderPriceCards()}</div>
      </div>
    `;
  }

  // ─── BUYER VIEW ───────────────────────────────────────────────────────────
  function renderBuyerHub() {
    return `
      <!-- KEY EXPLAINER: What is Agri Intelligence? -->
      <div style="background:linear-gradient(135deg,#E65100,#B71C1C);color:white;border-radius:14px;padding:16px;margin-bottom:14px">
        <div style="font-weight:700;font-size:15px;margin-bottom:6px">🧠 What is Agri Intelligence?</div>
        <div style="font-size:12px;opacity:0.95;line-height:1.6">
          Agri Intelligence is not a separate app. It is the <strong>data engine</strong> that powers everything you see here.
        </div>
        <div style="margin:10px 0;display:flex;flex-direction:column;gap:6px">
          ${[
            '📌 Farmers declare their crops 30-90 days before harvest',
            '📌 FPOs aggregate procurement from hundreds of members',
            '📌 The engine builds harvest forecasts by district & date',
            '📌 You search and discover that supply in real time',
          ].map(s=>`<div style="font-size:11px;opacity:0.9">${s}</div>`).join('')}
        </div>
        <div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:8px;font-size:11px">
          Think of it as: <strong>Bloomberg Terminal for crop supply</strong> — live data from 100,000+ farmers
        </div>
      </div>

      <!-- BUYER TOOLS -->
      <div class="section-title" style="margin-bottom:8px">Supply Discovery Tools</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px">
        <div style="display:flex;align-items:center;gap:12px;padding:14px;background:white;border-radius:12px;border-left:4px solid #7b2ff7;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,0.08)" data-nav="agriflow">
          <div style="font-size:24px">🌾</div>
          <div style="flex:1">
            <div style="font-weight:700">AgriFlow · Crop Supply Search</div>
            <div style="font-size:11px;color:var(--text3)">Search by crop, district, harvest date, quantity</div>
            <div style="display:flex;gap:4px;margin-top:5px;flex-wrap:wrap">
              <span style="background:#EDE7F6;color:#6A1B9A;padding:2px 6px;border-radius:6px;font-size:10px;font-weight:600">Filter by district</span>
              <span style="background:#EDE7F6;color:#6A1B9A;padding:2px 6px;border-radius:6px;font-size:10px;font-weight:600">Harvest forecasts</span>
              <span style="background:#EDE7F6;color:#6A1B9A;padding:2px 6px;border-radius:6px;font-size:10px;font-weight:600">Send inquiries</span>
            </div>
          </div>
          <span style="color:var(--text3);font-size:20px">›</span>
        </div>

        <div style="display:flex;align-items:center;gap:12px;padding:14px;background:white;border-radius:12px;border-left:4px solid #2E7D32;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,0.08)" data-nav="intelligence">
          <div style="font-size:24px">📊</div>
          <div style="flex:1">
            <div style="font-weight:700">Buyer Intelligence Dashboard</div>
            <div style="font-size:11px;color:var(--text3)">Watchlist · Price forecasts · District heatmaps</div>
            <div style="display:flex;gap:4px;margin-top:5px;flex-wrap:wrap">
              <span style="background:#E8F5E9;color:#2E7D32;padding:2px 6px;border-radius:6px;font-size:10px;font-weight:600">Supply heatmaps</span>
              <span style="background:#E8F5E9;color:#2E7D32;padding:2px 6px;border-radius:6px;font-size:10px;font-weight:600">Harvest calendar</span>
              <span style="background:#E8F5E9;color:#2E7D32;padding:2px 6px;border-radius:6px;font-size:10px;font-weight:600">Price trends</span>
            </div>
          </div>
          <span style="color:var(--text3);font-size:20px">›</span>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          ${farmTile('💬','Community','community','Farmer discussions · Market news','#E65100')}
          ${farmTile('🌤️','Weather','weather','Crop advisory · Regional forecast','#0288D1')}
        </div>
      </div>

      <!-- LIVE PRICES -->
      <div class="section-title" style="margin-bottom:8px">💰 Live Mandi Prices</div>
      <div id="priceCards">${loading ? skelPrice() : renderPriceCards()}</div>
    `;
  }

  // ─── SUPPLIER VIEW ────────────────────────────────────────────────────────
  function renderSupplierHub() {
    return `
      <div style="background:linear-gradient(135deg,#4527A0,#1565C0);color:white;border-radius:12px;padding:14px;margin-bottom:14px">
        <div style="font-weight:700;margin-bottom:4px">📦 Reach Crop Farmers through Agri</div>
        <div style="font-size:12px;opacity:0.9;line-height:1.5">
          Millions of crop farmers use AgriFlow + KisanConnect. List your fertilizers, seeds, 
          pesticides, and agri equipment here to generate qualified leads.
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
        ${farmTile('🌱','Agri Inputs','kisan','List fertilizer/seeds on KisanConnect','#2E7D32')}
        ${farmTile('💬','Community','community','Engage with farmers · Answer queries','#E65100')}
        ${farmTile('🌤️','Weather','weather','Understand crop cycles & season','#0288D1')}
        ${farmTile('💰','Prices','agriflow','Mandi prices · Crop demand signals','#7b2ff7')}
      </div>
      <div class="section-title" style="margin-bottom:8px">💰 Crop Prices</div>
      <div id="priceCards">${loading ? skelPrice() : renderPriceCards()}</div>
    `;
  }

  function renderServiceHub() {
    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
        ${farmTile('🔧','My Services','kisan','Manage your service listings','#607D8B')}
        ${farmTile('💬','Community','community','Farmer discussions · Leads','#E65100')}
        ${farmTile('🌤️','Weather','weather','Plan work around forecast','#0288D1')}
        ${farmTile('💰','Prices','agriflow','Mandi prices','#7b2ff7')}
      </div>
    `;
  }

  // ─── AGRI INTELLIGENCE EXPLAINER ──────────────────────────────────────────
  function renderIntelligenceBox(forRole) {
    const map = {
      farmer: {
        title: '🧠 Agri Intelligence — for You',
        body: 'When you declare your crop (area, expected yield, harvest date), your data ANONYMOUSLY joins the national supply picture. In return, you get:',
        bullets: ['📊 Real-time mandi price alerts for your crops','🌾 Personalized crop advisory & pest warnings','📅 Harvest calendar synced with buyer demand','💡 AI-ranked crop recommendations for next season'],
        cta: 'View My Hub', ctaNav: 'intelligence', color: '#2E7D32',
      },
      fpo: {
        title: '🧠 Agri Intelligence — for FPOs',
        body: 'Your FPO aggregates data from member farmers. The intelligence engine gives your FPO:',
        bullets: ['📊 Member-wise crop contribution dashboard','📦 Consolidated supply forecast to show buyers','💰 Price negotiation analytics (cost vs market)','🗺️ District supply position vs demand signals'],
        cta: 'FPO Analytics', ctaNav: 'intelligence', color: '#1565C0',
      },
    };
    const d = map[forRole];
    if (!d) return '';
    return `
      <div style="background:${d.color}12;border:1px solid ${d.color}30;border-radius:12px;padding:14px;margin-bottom:14px">
        <div style="font-weight:700;color:${d.color};margin-bottom:5px">${d.title}</div>
        <div style="font-size:12px;color:var(--text2);margin-bottom:8px">${d.body}</div>
        ${d.bullets.map(b=>`<div style="font-size:11px;color:var(--text2);padding:2px 0">${b}</div>`).join('')}
        <button class="btn btn-primary" data-nav="${d.ctaNav}" style="margin-top:10px;background:${d.color};border-color:${d.color};font-size:12px">${d.cta} →</button>
      </div>
    `;
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────
  function farmTile(icon, title, nav, desc, color) {
    return `
      <div style="background:white;border-radius:12px;padding:12px;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,0.07);border-top:3px solid ${color}" data-nav="${nav}">
        <div style="font-size:22px;margin-bottom:4px">${icon}</div>
        <div style="font-weight:700;font-size:13px;color:${color}">${title}</div>
        <div style="font-size:10px;color:var(--text3);margin-top:2px;line-height:1.4">${desc}</div>
      </div>`;
  }

  function renderPriceCards() {
    if (!prices.length) return '<div style="font-size:12px;color:var(--text3);text-align:center;padding:12px">No price data available</div>';
    return `<div style="display:flex;flex-direction:column;gap:6px">${
      prices.slice(0,6).map(p=>`
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:white;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
          <div>
            <div style="font-weight:700;font-size:13px">${p.commodity_name||p.crop}</div>
            <div style="font-size:10px;color:var(--text3)">${p.market_name||p.market||'Market'} · ${p.state||''}</div>
          </div>
          <div style="text-align:right">
            <div style="font-weight:800;font-size:14px;color:#2E7D32">₹${fmt(p.modal_price||p.price||0)}</div>
            <div style="font-size:10px;color:var(--text3)">per ${p.unit||'Quintal'}</div>
          </div>
        </div>
      `).join('')}
    </div>`;
  }

  function skelPrice() {
    return Array(3).fill(0).map(()=>`<div style="height:56px;background:#F5F5F5;border-radius:10px;margin-bottom:6px"></div>`).join('');
  }

  function fmt(n) {
    if (!n && n!==0) return '0';
    if (n>=10000000) return (n/10000000).toFixed(1)+'Cr';
    if (n>=100000) return (n/100000).toFixed(1)+'L';
    if (n>=1000) return (n/1000).toFixed(1)+'K';
    return String(n);
  }

  async function loadStats() {
    try {
      const [ps, pl] = await Promise.allSettled([
        api.getPlatformStats().catch(()=>null),
        api.getPriceData ? api.getPriceData() : api.get('/prices?limit=10').catch(()=>({prices:[]})),
      ]);
      if (ps.status==='fulfilled' && ps.value) stats = { ...stats, ...ps.value };
      if (pl.status==='fulfilled' && pl.value) prices = pl.value.prices || pl.value || [];
    } catch(_) {}
    loading = false;
    render();
  }

  render();
}
