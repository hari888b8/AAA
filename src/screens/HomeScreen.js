import { api } from '../api.js';
import { getState, getRole } from '../store.js';
import { navigate, showToast } from '../app-shell.js';
import { t } from '../i18n.js';
import { heroBanner, stickySearch, sectionTitle, ticker, platformTile, shortcut, actionCard, attachStickyShadow } from '../components/ui.js';

// ═══════════════════════════════════════════════════════════════
//  HOME SCREEN — Modern UI v2 (Mobile-first, hero, sticky, role-personalized)
// ═══════════════════════════════════════════════════════════════

export function renderHome(container) {
  const role = getRole();
  const user = getState().user;
  const fmt = n => n >= 1000 ? (n/1000).toFixed(n >= 10000 ? 0 : 1) + 'k' : String(n);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? '☀️ Good Morning' : hour < 18 ? '🌤️ Good Afternoon' : '🌙 Good Evening';

  // Role-specific hero gradient + descriptor
  const HERO_THEME = {
    farmer:           { gradient:'linear-gradient(135deg,#1B5E20,#43A047)',  badge:'👨‍🌾 Farmer',           sub:'Your farm command center' },
    fpo:              { gradient:'linear-gradient(135deg,#1565C0,#7B1FA2)',  badge:'🏢 FPO Admin',         sub:'Member & supply hub' },
    buyer:            { gradient:'linear-gradient(135deg,#E65100,#D81B60)',  badge:'🛒 Buyer',             sub:'Source. Bid. Deliver.' },
    supplier:         { gradient:'linear-gradient(135deg,#4527A0,#1565C0)',  badge:'🏭 Input Supplier',    sub:'Reach 124k+ farmers' },
    service_provider: { gradient:'linear-gradient(135deg,#37474F,#546E7A)',  badge:'🔧 Service Provider',  sub:'List your agri-services' },
  };
  const theme = HERO_THEME[role] || HERO_THEME.farmer;

  // Role-specific shortcuts (top 4 quick actions)
  const ROLE_SHORTCUTS = {
    farmer: [
      { icon:'📓', label:'Diary',     route:'farmdiary',  from:'#43A047', to:'#1B5E20' },
      { icon:'🌤️', label:'Weather',   route:'weather',    from:'#42A5F5', to:'#1565C0' },
      { icon:'🛡️', label:'Schemes',   route:'schemes',    from:'#FFA726', to:'#E65100' },
      { icon:'🎓', label:'Training',  route:'training',   from:'#AB47BC', to:'#6A1B9A' },
    ],
    fpo: [
      { icon:'🌾', label:'AgriFlow',  route:'agriflow',     from:'#43A047', to:'#1B5E20' },
      { icon:'📊', label:'Intel',     route:'intelligence', from:'#5C6BC0', to:'#283593' },
      { icon:'👥', label:'Members',   route:'community',    from:'#26A69A', to:'#00695C' },
      { icon:'📦', label:'Orders',    route:'orders',       from:'#FFA726', to:'#E65100' },
    ],
    buyer: [
      { icon:'🐟', label:'Aqua',       route:'aquaos',     from:'#26C6DA', to:'#00838F' },
      { icon:'🌾', label:'Crops',      route:'agri',       from:'#43A047', to:'#1B5E20' },
      { icon:'📦', label:'Orders',     route:'orders',     from:'#FFA726', to:'#E65100' },
      { icon:'📊', label:'Market',     route:'intelligence',from:'#5C6BC0', to:'#283593' },
    ],
    supplier: [
      { icon:'🌐', label:'Store',      route:'agrigalaxy', from:'#7E57C2', to:'#4527A0' },
      { icon:'🐟', label:'Aqua',       route:'aquaos',     from:'#26C6DA', to:'#00838F' },
      { icon:'📦', label:'Orders',     route:'orders',     from:'#FFA726', to:'#E65100' },
      { icon:'💬', label:'Community',  route:'community',  from:'#26A69A', to:'#00695C' },
    ],
    service_provider: [
      { icon:'🚜', label:'Kisan',      route:'kisan',      from:'#FF7043', to:'#BF360C' },
      { icon:'🌾', label:'Agri',       route:'agri',       from:'#43A047', to:'#1B5E20' },
      { icon:'💬', label:'Community',  route:'community',  from:'#26A69A', to:'#00695C' },
      { icon:'👤', label:'Profile',    route:'profile',    from:'#78909C', to:'#37474F' },
    ],
  };
  const shortcuts = ROLE_SHORTCUTS[role] || ROLE_SHORTCUTS.farmer;

  // Pending tasks per role
  function getRoleTasks() {
    if (role === 'farmer') return [
      { icon:'💧', title:'Irrigation due — Paddy Field A', sub:'Last watered 2 days ago', cta:'Log',    action:'farmdiary', bg:'#E3F2FD', color:'#1565C0' },
      { icon:'🛡️', title:'PMFBY deadline — July 31',       sub:'Crop insurance application',cta:'Apply', action:'schemes',   bg:'#FFEBEE', color:'#C62828' },
      { icon:'🌾', title:'Log fertilizer — Cotton',         sub:'You applied DAP yesterday', cta:'Log',    action:'farmdiary', bg:'#E8F5E9', color:'#2E7D32' },
    ];
    if (role === 'fpo') return [
      { icon:'📥', title:'3 procurement records',  sub:'Pending payment',           cta:'Review', action:'agriflow',     bg:'#FFF3E0', color:'#E65100' },
      { icon:'👥', title:'2 member requests',       sub:'New farmers want to join', cta:'View',   action:'intelligence', bg:'#E8F5E9', color:'#2E7D32' },
      { icon:'📦', title:'Paddy stock low',         sub:'200 kg remaining',          cta:'Update', action:'agriflow',     bg:'#FFEBEE', color:'#C62828' },
    ];
    if (role === 'buyer') return [
      { icon:'📦', title:'Order #ABC4 in transit', sub:'ETA tomorrow 10 AM',      cta:'Track', action:'orders',     bg:'#E3F2FD', color:'#1565C0' },
      { icon:'🐟', title:'New shrimp harvest',     sub:'2.5T · Bhimavaram',        cta:'View',  action:'aquaos',     bg:'#E0F7FA', color:'#00838F' },
      { icon:'💬', title:'1 unread message',       sub:'From Ramesh Farms',        cta:'Reply', action:'community',  bg:'#F3E5F5', color:'#6A1B9A' },
    ];
    if (role === 'supplier') return [
      { icon:'📦', title:'2 new orders',            sub:'Pending fulfilment',       cta:'View', action:'agrigalaxy', bg:'#E8F5E9', color:'#2E7D32' },
      { icon:'📊', title:'3 product inquiries',     sub:'BT Cotton, DAP, Neem oil', cta:'View', action:'agrigalaxy', bg:'#E3F2FD', color:'#1565C0' },
    ];
    return [
      { icon:'🔧', title:'2 service bookings',      sub:'Spraying & plowing',       cta:'View', action:'kisan',      bg:'#FFF3E0', color:'#E65100' },
    ];
  }

  // Live ticker — mandi prices
  const TICKER = [
    { label:'Paddy', value:'₹2,180 ▲', color:'#43A047' },
    { label:'Cotton', value:'₹6,850 ▲', color:'#43A047' },
    { label:'Tomato', value:'₹1,420 ▼', color:'#EF5350' },
    { label:'Groundnut', value:'₹5,650 ▲', color:'#43A047' },
    { label:'Chilli', value:'₹14,500 ▼', color:'#EF5350' },
    { label:'Maize', value:'₹2,080 ▲', color:'#43A047' },
  ];

  const PRICES = [
    { crop:'Paddy', emoji:'🌾', market:'Guntur APMC', price:2180, change:'+₹45', up:true },
    { crop:'Cotton', emoji:'🪴', market:'Adilabad', price:6850, change:'+₹120', up:true },
    { crop:'Tomato', emoji:'🍅', market:'Madanapalle', price:1420, change:'-₹80', up:false },
    { crop:'Groundnut', emoji:'🥜', market:'Kurnool', price:5650, change:'+₹200', up:true },
    { crop:'Chilli', emoji:'🌶️', market:'Khammam', price:14500, change:'-₹300', up:false },
  ];

  const ACTIVITY = [
    { icon:'🚜', text:'New tractor listed in Guntur', meta:'₹1,800/day · 2 min ago' },
    { icon:'🌱', text:'Sri Sai Seeds added 15 products', meta:'AgriGalaxy · 12 min ago' },
    { icon:'🏡', text:'5-acre land for sale in Krishna', meta:'₹18L · 25 min ago' },
    { icon:'🐟', text:'Shrimp harvest ready', meta:'2.5 tons · Bhimavaram · 1 hr ago' },
    { icon:'🌾', text:'FPO procurement: 120 tons paddy', meta:'AP · 2 hrs ago' },
  ];

  const STATS = { farmers: 124500, equipment: 8430, stores: 2150, listings: 3820 };

  // ─── RENDER ────────────────────────────────────────────────────
  container.innerHTML = `
    <!-- HERO BANNER -->
    ${heroBanner({
      gradient: theme.gradient,
      icon: '🌾',
      greeting: `${greeting},`,
      title: `${user?.name?.split(' ')[0] || 'Welcome'} 👋`,
      subtitle: `${theme.badge} · ${theme.sub}`,
      actions: [
        { icon:'🔍', id:'heroSearchBtn' },
        { icon:'🔔', onClick:'notifications', badge: true },
      ],
      stats: [
        { value: fmt(STATS.farmers),   label: '👨‍🌾 Farmers' },
        { value: fmt(STATS.equipment), label: '🚜 Equipment' },
        { value: fmt(STATS.stores),    label: '🏪 Stores' },
        { value: fmt(STATS.listings),  label: '🏡 Listings' },
      ],
    })}

    <!-- LIVE TICKER -->
    <div style="margin-top:-8px;position:relative;z-index:2">
      ${ticker(TICKER, 'MANDI')}
    </div>

    <!-- ROLE SHORTCUTS -->
    <div style="margin-top:14px">
      ${sectionTitle('Quick Access', null, null)}
      <div class="shortcut-grid">
        ${shortcuts.map(s => shortcut(s)).join('')}
      </div>
    </div>

    <!-- PENDING TASKS -->
    ${getRoleTasks().length ? `
      ${sectionTitle('Pending Actions', `${getRoleTasks().length} need your attention`)}
      <div style="padding:0 14px">
        ${getRoleTasks().map(actionCard).join('')}
      </div>
    ` : ''}

    <!-- PLATFORM APPS -->
    ${sectionTitle('Platform Apps', 'Five apps. One ecosystem.')}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 14px">
      ${platformTile({ icon:'🌐', title:'AgriGalaxy', sub:'Seeds & Inputs', meta:'2,150 stores', route:'agrigalaxy', color:'#6A1B9A' })}
      ${platformTile({ icon:'🐟', title:'AquaOS',     sub:'Aquaculture',   meta:'Shrimp · Fish', route:'aquaos',     color:'#0277BD' })}
      ${platformTile({ icon:'🌾', title:'Agri',       sub:'Crops & FPOs',  meta:'AgriFlow + more', route:'agri',     color:'#2E7D32' })}
      ${platformTile({ icon:'🚜', title:'KisanConnect',sub:'Equipment',    meta:'Rent · Buy · Sell', route:'kisan',  color:'#E65100' })}
      ${platformTile({ icon:'🏡', title:'BhoomiOS',   sub:'Land Market',   meta:'Buy · Rent farmland', route:'bhoomios', color:'#795548' })}
      ${platformTile({ icon:'🏗️', title:'Platform',   sub:'Architecture',  meta:'How it works', route:'architecture', color:'#37474F' })}
    </div>

    <!-- LIVE PRICES -->
    ${sectionTitle('Mandi Prices', 'Updated 2 min ago', { label:'See all', nav:'intelligence' })}
    <div style="padding:0 14px">
      ${PRICES.map(p => `
        <div class="price-row" data-nav="intelligence">
          <span class="pr-emoji">${p.emoji}</span>
          <div class="pr-meta">
            <div class="pr-name">${p.crop}</div>
            <div class="pr-loc">📍 ${p.market}</div>
          </div>
          <div class="pr-right">
            <div class="pr-val">₹${p.price.toLocaleString()}</div>
            <div class="${p.up ? 'pr-chg-up' : 'pr-chg-down'}">${p.up ? '▲' : '▼'} ${p.change}</div>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- TOOLS & SERVICES -->
    ${sectionTitle('Tools & Services')}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 14px">
      ${platformTile({ icon:'📓', title:'Farm Diary',  sub:'Activities & expenses', meta:'Crop lifecycle',     route:'farmdiary', color:'#2E7D32' })}
      ${platformTile({ icon:'🏛️', title:'Schemes',    sub:'Govt loans & insurance',meta:'PM-KISAN, KCC, PMFBY', route:'schemes', color:'#1565C0' })}
      ${platformTile({ icon:'👷', title:'Agri Jobs',  sub:'Find farm work',         meta:'8 jobs near you',     route:'jobs',     color:'#E65100' })}
      ${platformTile({ icon:'🎓', title:'Training',    sub:'Courses & tips',        meta:'10 courses',          route:'training', color:'#6A1B9A' })}
    </div>

    <!-- EXECUTION & DEMAND LAYER -->
    ${sectionTitle('Execution & Market', 'Ground-level operations')}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 14px">
      ${platformTile({ icon:'🌾', title:'Execution Net', sub:'Agents & Verification', meta:'Pickup · Quality', route:'executionnetwork', color:'#1B5E20' })}
      ${platformTile({ icon:'🎯', title:'Demand Engine', sub:'Guaranteed Buyers',     meta:'Pre-harvest deals', route:'demandengine', color:'#E65100' })}
      ${platformTile({ icon:'📍', title:'Local Market',  sub:'Hyperlocal Deals',      meta:'Nearby buyers',     route:'hyperlocal', color:'#0D47A1' })}
      ${platformTile({ icon:'🎙️', title:'Voice & Assist',sub:'Speak to trade',        meta:'WhatsApp · IVR',    route:'voiceassist', color:'#4527A0' })}
      ${platformTile({ icon:'🔄', title:'Crop Cycle',   sub:'Input→Grow→Sell→Repay', meta:'Closed-loop',        route:'croplifecycle', color:'#2E7D32' })}
      ${platformTile({ icon:'🤝', title:'Agent Hub',    sub:'Field operations',       meta:'Onboard · Verify',  route:'agentdashboard', color:'#37474F' })}
    </div>

    <!-- LIVE ACTIVITY -->
    ${sectionTitle('Live Activity', 'Across the platform')}
    <div style="padding:0 14px">
      ${ACTIVITY.map(a => `
        <div class="action-card">
          <div class="ac-icon" style="--ac-bg:#F5F5F5;--ac-color:#424242">${a.icon}</div>
          <div class="ac-text">
            <div class="ac-title">${a.text}</div>
            <div class="ac-sub">${a.meta}</div>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="pb-nav"></div>
  `;

  // Wire up navigation
  container.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      navigate(el.dataset.nav);
    });
  });
  container.querySelector('#heroSearchBtn')?.addEventListener('click', () => showToast('Search coming soon — try category browse', 'info'));

  // Sticky-search shadow handler (no-op if no sticky-search on this screen)
  attachStickyShadow(container);

  // Load real data in background
  loadRealData();

  async function loadRealData() {
    try {
      await api.getPlatformStats?.().catch(() => null);
    } catch (e) { /* silent */ }
  }
}
