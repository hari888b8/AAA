import { agriflowData } from '../data/agriflow.js';
import { aquaosData } from '../data/aquaos.js';
import { farmerconnectData } from '../data/farmerconnect.js';
import { kisanconnectData } from '../data/kisanconnect.js';
import { intelligenceData } from '../data/intelligence.js';
import { architectureData } from '../data/architecture.js';

const apps = [agriflowData, aquaosData, farmerconnectData, kisanconnectData, intelligenceData, architectureData];

function renderHeader() {
  return `<header class="header">
    <div class="header__inner">
      <div class="header__logo" onclick="navigate('/')">
        <span class="header__logo-icon">🌾</span><span>AgriHub</span>
      </div>
      <div class="home-search-bar" id="global-search-wrap">
        <span class="search-bar__icon">🔍</span>
        <input type="text" class="search-bar__input home-search__input" id="global-search"
          placeholder="Search any platform, feature, crop, service…"
          oninput="globalSearch(this.value)" autocomplete="off" />
        <div class="home-search__results" id="global-results"></div>
      </div>
      <div style="display:flex;align-items:center;gap:var(--space-md);">
        <div style="display:flex;align-items:center;gap:6px;font-size:var(--fs-small);color:var(--text-secondary);">
          <span class="live-dot"></span> Live
          <span id="live-clock" style="font-family:var(--font-display);font-weight:var(--fw-bold);color:var(--text-primary);min-width:70px;"></span>
        </div>
      </div>
    </div>
  </header>`;
}

function sparkline(color) {
  const bars = Array.from({length: 14}, () => 20 + Math.random() * 70);
  return `<div class="metric__sparkline">${bars.map(h =>
    `<div class="metric__bar" style="height:${h}%;background:${color};opacity:${0.4 + h/100*0.6}"></div>`
  ).join('')}</div>`;
}

function recentActivity() {
  const items = [
    { icon: '🌱', bg: 'rgba(34,197,94,0.15)', text: '<strong>Raju Reddy</strong> declared 2.5 acres of Tomato in Krishna, AP', time: '2 min ago' },
    { icon: '📦', bg: 'rgba(59,130,246,0.15)', text: '<strong>Rayalaseema FPC</strong> listed 80 Tons of Onion — Grade A', time: '8 min ago' },
    { icon: '🔍', bg: 'rgba(123,47,247,0.15)', text: '<strong>Vikram Traders</strong> sent inquiry for 50T Tomato in AP', time: '15 min ago' },
    { icon: '🐟', bg: 'rgba(0,201,167,0.15)', text: '<strong>Sudha</strong> logged water quality — pH 7.8, Pond #3', time: '22 min ago' },
    { icon: '🏡', bg: 'rgba(168,224,99,0.15)', text: '<strong>Ramaiah</strong> listed 8 acres for lease in Krishna district', time: '35 min ago' },
    { icon: '🛒', bg: 'rgba(255,107,53,0.15)', text: '<strong>Mahesh Farm</strong> booked Mahindra 265 DI Tractor for 3 days', time: '48 min ago' },
    { icon: '💰', bg: 'rgba(245,158,11,0.15)', text: '<strong>Chittoor Rythu FPC</strong> received buyer payment of ₹4,45,000', time: '1 hr ago' },
    { icon: '📊', bg: 'rgba(230,57,70,0.15)', text: 'Intelligence: <strong>Tomato surplus</strong> predicted in AP — Feb harvest up 23%', time: '1 hr ago' },
    { icon: '🧠', bg: 'rgba(155,89,182,0.15)', text: 'ML pipeline: <strong>Onion Deficit Alert</strong> dispatched to 847 buyers', time: '2 hrs ago' },
    { icon: '🌊', bg: 'rgba(0,150,255,0.15)', text: 'AquaOS: <strong>DOC-78 harvest ready</strong> — Pond P-003, Tiger Prawn', time: '3 hrs ago' },
  ];
  return `<div class="activity-feed">${items.map(i => `
    <div class="activity-item">
      <div class="activity-icon" style="background:${i.bg}">${i.icon}</div>
      <div class="activity-content">
        <div class="activity-text">${i.text}</div>
        <div class="activity-time">${i.time}</div>
      </div>
    </div>`).join('')}</div>`;
}

const searchIndex = [
  { label: 'AgriFlow — Supply Marketplace', route: '/agriflow', desc: 'Live crop listings, FPO procurement, buyer inquiries' },
  { label: 'AgriFlow — Crop Declaration', route: '/agriflow', desc: 'Farmers declare planted crops for supply forecasting' },
  { label: 'AgriFlow — Price Radar', route: '/agriflow', desc: 'Real-time mandi prices from Agmarknet API' },
  { label: 'AgriFlow — Buyer Intelligence', route: '/agriflow', desc: '5 premium intelligence reports for bulk buyers' },
  { label: 'AquaOS — Farm OS', route: '/aquaos', desc: 'Pond management, water quality, harvest calendar' },
  { label: 'AquaOS — Disease Advisory', route: '/aquaos', desc: 'WSSV alerts, temperature advisories for shrimp farms' },
  { label: 'AquaOS — Input Marketplace', route: '/aquaos', desc: 'Feed, PL, probiotic suppliers for aqua farmers' },
  { label: 'AquaOS — Gap Analysis', route: '/aquaos', desc: '31 documented gaps: 9 critical, 16 high priority' },
  { label: 'FarmerConnect — Property Search', route: '/farmerconnect', desc: 'Urban rentals, agri land leases, PG listings' },
  { label: 'FarmerConnect — Pricing Plans', route: '/farmerconnect', desc: 'Seeker and owner plans — free to premium' },
  { label: 'KisanConnect — Equipment Rental', route: '/kisanconnect', desc: 'Tractors, harvesters, sprayers on-demand booking' },
  { label: 'KisanConnect — Job Marketplace', route: '/kisanconnect', desc: 'Farm supervisor, seasonal labour, agri tech jobs' },
  { label: 'KisanConnect — Rural Services', route: '/kisanconnect', desc: 'Soil testing, irrigation, pest control services' },
  { label: 'Intelligence Platform — Supply Data', route: '/intelligence', desc: 'Tomato surplus, Onion deficit, 30-day crop forecasts' },
  { label: 'Intelligence Platform — Heatmap', route: '/intelligence', desc: 'District-level coverage, farmer declarations density' },
  { label: 'Architecture — System Status', route: '/architecture', desc: 'Live uptime, latency for all 8 microservices' },
  { label: 'Architecture — Zero-INR Stack', route: '/architecture', desc: 'Supabase, Cloudflare, Railway, Vercel free tiers' },
  { label: 'Architecture — Roadmap', route: '/architecture', desc: '5-phase implementation from foundation to national scale' },
];

export function renderHomePage() {
  // Expose global search function
  window.globalSearch = function(q) {
    const box = document.getElementById('global-results');
    if (!q || q.length < 2) { box.innerHTML = ''; box.style.display = 'none'; return; }
    const matches = searchIndex.filter(s =>
      s.label.toLowerCase().includes(q.toLowerCase()) ||
      s.desc.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 6);
    if (!matches.length) { box.innerHTML = '<div class="gs-none">No results found</div>'; box.style.display = 'block'; return; }
    box.innerHTML = matches.map(m => `
      <div class="gs-item" onclick="navigate('${m.route}');document.getElementById('global-results').style.display='none';document.getElementById('global-search').value=''">
        <div class="gs-item__label">${m.label}</div>
        <div class="gs-item__desc">${m.desc}</div>
      </div>`).join('');
    box.style.display = 'block';
  };

  // Close search on click outside
  setTimeout(() => {
    document.addEventListener('click', e => {
      if (!e.target.closest('#global-search-wrap')) {
        const box = document.getElementById('global-results');
        if (box) box.style.display = 'none';
      }
    }, { once: false });
  }, 200);

  const html = `
    ${renderHeader()}
    <main class="home page-enter">
      <!-- Price Ticker -->
      <div style="margin-bottom:var(--space-xl);">
        <div style="display:flex;align-items:center;gap:var(--space-sm);margin-bottom:var(--space-sm);">
          <span class="live-dot"></span>
          <span style="font-size:var(--fs-xs);color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;">Live Market Prices</span>
        </div>
        <div class="ticker-strip" id="price-ticker"></div>
      </div>

      <!-- Hero -->
      <div class="home__hero">
        <div class="ecosystem-badge">🇮🇳 India's Agriculture Intelligence Ecosystem</div>
        <h1 class="home__title">Choose Your <span class="gradient-text">Platform</span></h1>
        <p class="home__subtitle">6 verticals. 500+ features. ₹0 infrastructure. Select any platform to explore real-time dashboards, live marketplaces, and intelligence data built from 8 comprehensive PRDs.</p>
      </div>

      <!-- Dashboard Metrics -->
      <div class="grid-4 stagger-children" style="margin-bottom:var(--space-2xl);">
        <div class="metric metric--purple">
          <div class="metric__label">Total Farmers</div>
          <div class="metric__value" data-count="142847" data-prefix="">0</div>
          <div class="metric__change metric__change--up">▲ 12.4% this month</div>
          ${sparkline('rgba(123,47,247,0.6)')}
        </div>
        <div class="metric metric--teal">
          <div class="metric__label">Active Listings</div>
          <div class="metric__value" data-count="8432" data-prefix="">0</div>
          <div class="metric__change metric__change--up">▲ 8.7% this week</div>
          ${sparkline('rgba(0,201,167,0.6)')}
        </div>
        <div class="metric metric--green">
          <div class="metric__label">GMV Today</div>
          <div class="metric__value" data-count="2847" data-prefix="₹" data-suffix="L">0</div>
          <div class="metric__change metric__change--up">▲ 15.2% vs yesterday</div>
          ${sparkline('rgba(168,224,99,0.6)')}
        </div>
        <div class="metric metric--orange">
          <div class="metric__label">Districts Covered</div>
          <div class="metric__value" data-count="127">0</div>
          <div class="metric__change metric__change--up">▲ 8 new this month</div>
          ${sparkline('rgba(255,107,53,0.6)')}
        </div>
      </div>

      <!-- Ecosystem Overview Strip -->
      <div class="ecosystem-strip stagger-children" style="margin-bottom:var(--space-2xl);">
        <div class="ecosystem-pill">
          <span class="ecosystem-pill__icon">📄</span>
          <div><div class="ecosystem-pill__value">8</div><div class="ecosystem-pill__label">PRD Documents</div></div>
        </div>
        <div class="ecosystem-pill">
          <span class="ecosystem-pill__icon">🔧</span>
          <div><div class="ecosystem-pill__value">500+</div><div class="ecosystem-pill__label">Total Features</div></div>
        </div>
        <div class="ecosystem-pill">
          <span class="ecosystem-pill__icon">🏗️</span>
          <div><div class="ecosystem-pill__value">14</div><div class="ecosystem-pill__label">Microservices</div></div>
        </div>
        <div class="ecosystem-pill">
          <span class="ecosystem-pill__icon">💸</span>
          <div><div class="ecosystem-pill__value">₹0</div><div class="ecosystem-pill__label">Infra Cost/Month</div></div>
        </div>
        <div class="ecosystem-pill">
          <span class="ecosystem-pill__icon">🌏</span>
          <div><div class="ecosystem-pill__value">6</div><div class="ecosystem-pill__label">States Targeted</div></div>
        </div>
        <div class="ecosystem-pill">
          <span class="ecosystem-pill__icon">⭐</span>
          <div><div class="ecosystem-pill__value">95%</div><div class="ecosystem-pill__label">Avg Analysis Score</div></div>
        </div>
      </div>

      <!-- App Cards -->
      <div class="home__cards stagger-children">
        ${apps.map((app, i) => `
          <div class="app-card app-card--${app.gradient}" onclick="navigate('/${app.id}')" id="card-${app.id}" role="button" tabindex="0"
            onkeydown="if(event.key==='Enter')navigate('/${app.id}')">
            ${i === 0 ? '<div class="app-card__badge"><span class="badge-dot"></span> FLAGSHIP</div>' : ''}
            <div style="display:flex;align-items:center;gap:var(--space-md);">
              <div class="app-card__icon">${app.icon}</div>
              <div style="flex:1;">
                <div class="app-card__title">${app.name}</div>
                <div class="app-card__desc">${app.tagline}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:var(--fs-h3);font-weight:var(--fw-black);color:#fff;">${app.featureCount}</div>
                <div class="app-card__listings">features</div>
              </div>
            </div>
            <div class="app-card__arrow">→</div>
          </div>
        `).join('')}
      </div>

      <!-- Activity Feed -->
      <div class="section">
        <div class="section__header">
          <h2 class="section__title">⚡ Live Activity Feed</h2>
          <p class="section__subtitle">Real-time events from across the agriculture ecosystem</p>
        </div>
        ${recentActivity()}
      </div>
    </main>`;

  setTimeout(() => { window.animateCounters(); window.startLiveClock(); window.startPriceTicker(); }, 100);
  return html;
}
