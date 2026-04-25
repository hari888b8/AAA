import { navigate } from '../main.js';

export function renderArchitecture(container) {
  let activeSection = 'overview';

  const SECTIONS = {
    overview: { icon: '🏗️', label: 'Overview' },
    platforms: { icon: '📱', label: 'Platforms' },
    roles: { icon: '👥', label: 'Roles' },
    data: { icon: '🗄️', label: 'Data & APIs' },
    security: { icon: '🔐', label: 'Security' },
    revenue: { icon: '💰', label: 'Revenue' },
    roadmap: { icon: '🗺️', label: 'Roadmap' },
  };

  function render() {
    container.innerHTML = `
      <div class="arch-tabs" style="display:flex;gap:4px;overflow-x:auto;padding:8px 12px;-webkit-overflow-scrolling:touch">
        ${Object.entries(SECTIONS).map(([k, v]) => `
          <button class="chip ${activeSection === k ? 'active' : ''}" data-sec="${k}" style="white-space:nowrap;flex-shrink:0">${v.icon} ${v.label}</button>
        `).join('')}
      </div>
      <div class="arch-content" style="padding:0 16px 100px">${renderSection()}</div>
    `;
    container.querySelectorAll('[data-sec]').forEach(b => b.addEventListener('click', () => {
      activeSection = b.dataset.sec; render();
    }));
    container.querySelectorAll('[data-nav]').forEach(el => {
      el.addEventListener('click', () => navigate(el.dataset.nav));
    });
  }

  function renderSection() {
    switch (activeSection) {
      case 'overview': return renderOverview();
      case 'platforms': return renderPlatforms();
      case 'roles': return renderRoles();
      case 'data': return renderData();
      case 'security': return renderSecurity();
      case 'revenue': return renderRevenue();
      case 'roadmap': return renderRoadmap();
      default: return '';
    }
  }

  function renderOverview() {
    return `
      <div class="section">
        <div style="text-align:center;padding:24px 0 16px">
          <div style="font-size:48px">🌾</div>
          <h2 style="margin:8px 0 4px;font-size:22px">AgriHub Ecosystem</h2>
          <p class="text-sm text-muted">India's Nationwide Agriculture Supply & Intelligence Network</p>
        </div>

        <div class="stats-grid-4 mb-lg">
          <div class="stat-card"><div class="stat-value">5</div><div class="stat-label">Platforms</div></div>
          <div class="stat-card"><div class="stat-value">10M+</div><div class="stat-label">Target Scale</div></div>
          <div class="stat-card"><div class="stat-value">76+</div><div class="stat-label">API Endpoints</div></div>
          <div class="stat-card"><div class="stat-value">31</div><div class="stat-label">DB Tables</div></div>
        </div>

        <div class="card" style="padding:16px;margin-bottom:12px">
          <div class="fw-700" style="margin-bottom:8px">🏛️ System Architecture</div>
          <div style="font-size:12px;line-height:1.8;font-family:monospace;background:var(--surface);padding:12px;border-radius:8px;overflow-x:auto">
┌──────────────────────────────────────────────────┐
│              Mobile & Web Clients                 │
│  👨‍🌾 Farmer  │  🏢 FPO  │  🛒 Buyer  │  🔧 Admin │
└─────────┬──────────┬──────────┬──────────────────┘
          │          │          │
    ┌─────▼──────────▼──────────▼─────┐
    │     API Gateway (Express.js)     │
    │   JWT Auth · Rate Limit · RBAC   │
    └─────┬──────┬──────┬──────┬──────┘
          │      │      │      │
   ┌──────▼──┐ ┌▼────┐ ┌▼───┐ ┌▼──────┐
   │AgriFlow │ │Aqua │ │Kis │ │Farmer │
   │  Routes │ │ OS  │ │Con │ │Connect│
   └────┬────┘ └──┬──┘ └─┬──┘ └───┬───┘
        │         │      │        │
    ┌───▼─────────▼──────▼────────▼───┐
    │     Intelligence Engine          │
    │  Prices · Supply · Weather · ML  │
    └────────────────┬────────────────┘
                     │
    ┌────────────────▼────────────────┐
    │   PostgreSQL · Redis · Realtime  │
    └─────────────────────────────────┘
          </div>
        </div>

        <div class="card" style="padding:16px;margin-bottom:12px">
          <div class="fw-700" style="margin-bottom:10px">⚡ Tech Stack</div>
          ${[
            { cat: 'Frontend', items: 'Vanilla JS SPA · Vite · Mobile-First CSS' },
            { cat: 'Backend', items: 'Node.js · Express · JWT Auth · WebSocket' },
            { cat: 'Database', items: 'PostgreSQL 15 · PostGIS · Redis Cache' },
            { cat: 'Infrastructure', items: 'Docker · Supabase · Vercel · Cloudflare' },
            { cat: 'Mobile', items: 'Android (Kotlin + Jetpack Compose) · Flutter (planned)' },
            { cat: 'ML/AI', items: 'XGBoost · Price Forecasting · Crop Recommendations' },
          ].map(t => `<div style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)">
            <span class="fw-600 text-sm" style="min-width:90px;color:var(--primary)">${t.cat}</span>
            <span class="text-sm text-muted">${t.items}</span>
          </div>`).join('')}
        </div>
      </div>`;
  }

  function renderPlatforms() {
    const platforms = [
      { icon: '🌾', name: 'AgriFlow', desc: 'Supply Intelligence & Farmer Network', color: '#2E7D32',
        features: ['Crop declarations & harvest calendar', 'FPO procurement & inventory', 'Supply discovery engine (25+ filters)', 'Price Radar (APMC/eNAM)', '5 intelligence reports', 'Community knowledge network'],
        roles: 'Farmer · FPO Admin · FPO Staff · Buyer · Field Agent', nav: 'agriflow' },
      { icon: '🐟', name: 'AquaOS', desc: 'Aquaculture Ecosystem Platform', color: '#0277BD',
        features: ['Digital pond management (Farm OS)', 'Water quality logging & alerts', 'BioPro health scoring', 'Harvest marketplace (buyer-seller)', 'Input marketplace (feed/seed/medicine)', 'Advisory engine (species-specific)'],
        roles: 'Farmer (Seller) · Buyer (Paid) · Supplier · Admin', nav: 'aquaos' },
      { icon: '🤝', name: 'KisanConnect', desc: 'Rural Super-App (4 Marketplaces)', color: '#E65100',
        features: ['Crop trading with escrow', 'Equipment rental system', 'Rural services marketplace', 'Job marketplace', 'Buyer/Seller mode toggle', 'AI-powered matching'],
        roles: 'Farmer (Seller+Buyer) · Service Provider · Job Seeker', nav: 'kisan' },
      { icon: '🏠', name: 'FarmerConnect', desc: 'Property & Agricultural Land Marketplace', color: '#6A1B9A',
        features: ['Property search with filters', 'Agricultural land lease/sale', 'PG/accommodation listings', 'Society management SaaS', 'NRI remote management', 'Zero-broker guarantee'],
        roles: 'Seeker · Owner · NRI · PG Operator · Society Admin · Broker', nav: 'farmerconnect' },
      { icon: '📊', name: 'Intelligence Engine', desc: 'National Agriculture Data Engine', color: '#AD1457',
        features: ['Real-time price aggregation', 'Supply-demand heatmaps', '30/60/90-day forecasts', 'Weather + satellite overlay', 'District-level analytics', 'Data quality scoring (0-100)'],
        roles: 'Internal service · Buyer subscribers · Government', nav: 'intelligence' },
    ];

    return `<div class="section" style="padding-top:8px">
      ${platforms.map(p => `
        <div class="card" style="padding:16px;margin-bottom:12px;cursor:pointer;border-left:4px solid ${p.color}" data-nav="${p.nav}">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
            <span style="font-size:28px">${p.icon}</span>
            <div>
              <div class="fw-700">${p.name}</div>
              <div class="text-sm text-muted">${p.desc}</div>
            </div>
          </div>
          <div class="text-sm" style="margin-bottom:8px">
            ${p.features.map(f => `<div style="padding:2px 0">• ${f}</div>`).join('')}
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:4px">
            ${p.roles.split(' · ').map(r => `<span class="tag tag-gray" style="font-size:11px">${r}</span>`).join('')}
          </div>
        </div>
      `).join('')}
    </div>`;
  }

  function renderRoles() {
    return `<div class="section" style="padding-top:8px">
      <div class="card" style="padding:16px;margin-bottom:12px">
        <div class="fw-700" style="margin-bottom:10px">👨‍🌾 Farmer (Free)</div>
        <div class="text-sm text-muted" style="margin-bottom:8px">Core user — 80% of platform users. All farmer features are FREE.</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px">
          ${['AgriFlow', 'AquaOS', 'KisanConnect', 'FarmerConnect'].map(p => `<span class="tag tag-green" style="font-size:11px">${p}</span>`).join('')}
        </div>
        <div class="text-sm">
          <div style="padding:3px 0">✅ Declare crops & manage harvests</div>
          <div style="padding:3px 0">✅ Manage ponds, log water quality</div>
          <div style="padding:3px 0">✅ Create listings (sell/rent)</div>
          <div style="padding:3px 0">✅ View price radar & weather</div>
          <div style="padding:3px 0">✅ Community discussions</div>
          <div style="padding:3px 0">❌ Cannot see buyer data</div>
        </div>
      </div>

      <div class="card" style="padding:16px;margin-bottom:12px">
        <div class="fw-700" style="margin-bottom:10px">🛒 Buyer (Paid Subscription)</div>
        <div class="text-sm text-muted" style="margin-bottom:8px">Commercial participants — 3 subscription tiers per platform.</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px">
          ${['AgriFlow', 'AquaOS', 'KisanConnect'].map(p => `<span class="tag tag-blue" style="font-size:11px">${p}</span>`).join('')}
        </div>
        <div class="text-sm">
          <div style="padding:3px 0">✅ Search supply across states</div>
          <div style="padding:3px 0">✅ Send inquiries to farmers/FPOs</div>
          <div style="padding:3px 0">✅ Access intelligence reports</div>
          <div style="padding:3px 0">✅ Price alerts & notifications</div>
          <div style="padding:3px 0">⚠️ Only aggregated data (min 5 farmers)</div>
          <div style="padding:3px 0">❌ Individual farmer data never exposed</div>
        </div>
      </div>

      <div class="card" style="padding:16px;margin-bottom:12px">
        <div class="fw-700" style="margin-bottom:10px">🏢 FPO Admin</div>
        <div class="text-sm text-muted" style="margin-bottom:8px">Farmer Producer Organizations — manage members & procurement.</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px">
          <span class="tag tag-orange" style="font-size:11px">AgriFlow</span>
        </div>
        <div class="text-sm">
          <div style="padding:3px 0">✅ Manage farmer members</div>
          <div style="padding:3px 0">✅ Record procurement & inventory</div>
          <div style="padding:3px 0">✅ Publish aggregated supply listings</div>
          <div style="padding:3px 0">✅ Track payments to farmers</div>
          <div style="padding:3px 0">✅ View member-level data</div>
        </div>
      </div>

      <div class="card" style="padding:16px;margin-bottom:12px">
        <div class="fw-700" style="margin-bottom:10px">🔐 4-Level Privacy Consent</div>
        <div class="text-sm text-muted" style="margin-bottom:10px">Individual farmer data is NEVER exposed to buyers.</div>
        <div class="text-sm">
          ${[
            { lvl: 'Level 0', desc: 'Fully anonymous — aggregate data only', color: '#4CAF50' },
            { lvl: 'Level 1', desc: 'Crop + location visible, name hidden', color: '#FF9800' },
            { lvl: 'Level 2', desc: 'Crop + FPO name visible, farmer hidden', color: '#2196F3' },
            { lvl: 'Level 3', desc: 'Full contact visible (farmer opt-in only)', color: '#E91E63' },
          ].map(l => `<div style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)">
            <span class="tag" style="background:${l.color};color:white;font-size:10px;min-width:52px;text-align:center">${l.lvl}</span>
            <span>${l.desc}</span>
          </div>`).join('')}
        </div>
      </div>

      <div class="card" style="padding:16px;margin-bottom:12px">
        <div class="fw-700" style="margin-bottom:10px">🔄 KisanConnect Dual-Mode</div>
        <div class="text-sm text-muted" style="margin-bottom:10px">Users toggle between Buyer and Seller mode within the same app.</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div style="padding:12px;background:var(--success-bg);border-radius:10px;text-align:center">
            <div style="font-size:24px">🛒</div>
            <div class="fw-600 text-sm" style="margin:4px 0">Buyer Mode</div>
            <div style="font-size:11px;color:var(--text3)">Home · Explore · Activity · Messages · Profile</div>
          </div>
          <div style="padding:12px;background:var(--primary-surface);border-radius:10px;text-align:center">
            <div style="font-size:24px">🏷️</div>
            <div class="fw-600 text-sm" style="margin:4px 0">Seller Mode</div>
            <div style="font-size:11px;color:var(--text3)">Dashboard · Listings · Orders · Earnings · Profile</div>
          </div>
        </div>
      </div>
    </div>`;
  }

  function renderData() {
    return `<div class="section" style="padding-top:8px">
      <div class="card" style="padding:16px;margin-bottom:12px">
        <div class="fw-700" style="margin-bottom:10px">🗄️ Database Schema</div>
        <div class="text-sm" style="font-family:monospace;line-height:1.8">
          ${[
            { tbl: 'users', desc: 'Auth, roles, KYC, district', cols: 12 },
            { tbl: 'crop_declarations', desc: 'Farmer crop data collection', cols: 18 },
            { tbl: 'agriflow_listings', desc: 'Marketplace supply listings', cols: 15 },
            { tbl: 'agriflow_inquiries', desc: 'Buyer-seller inquiry system', cols: 10 },
            { tbl: 'aqua_farms', desc: 'Aquaculture farm registry', cols: 10 },
            { tbl: 'aqua_ponds', desc: 'Pond management with DOC', cols: 14 },
            { tbl: 'aqua_water_logs', desc: 'Daily water quality tracking', cols: 10 },
            { tbl: 'aqua_harvest_listings', desc: 'Harvest marketplace', cols: 12 },
            { tbl: 'equipment', desc: 'KisanConnect rental equipment', cols: 12 },
            { tbl: 'equipment_bookings', desc: 'Rental booking + escrow', cols: 10 },
            { tbl: 'jobs', desc: 'Rural job marketplace', cols: 14 },
            { tbl: 'fc_properties', desc: 'FarmerConnect listings', cols: 18 },
            { tbl: 'community_posts', desc: 'Community discussions', cols: 8 },
            { tbl: 'notifications', desc: 'Multi-channel alerts', cols: 8 },
            { tbl: 'orders', desc: 'Transaction management', cols: 12 },
          ].map(t => `<div style="display:flex;gap:8px;padding:4px 0;border-bottom:1px solid var(--border)">
            <span class="fw-600" style="min-width:150px;color:var(--primary)">${t.tbl}</span>
            <span style="color:var(--text3)">${t.desc}</span>
          </div>`).join('')}
        </div>
        <div class="text-sm text-muted" style="margin-top:8px">+ 16 more tables (districts, price_history, weather, etc.)</div>
      </div>

      <div class="card" style="padding:16px;margin-bottom:12px">
        <div class="fw-700" style="margin-bottom:10px">🚪 API Routes (76+ endpoints)</div>
        ${[
          { prefix: '/api/auth', count: 5, desc: 'OTP send/verify, profile, token refresh' },
          { prefix: '/api/agriflow', count: 15, desc: 'Listings, declarations, inquiries, FPO procurement' },
          { prefix: '/api/aquaos', count: 12, desc: 'Ponds, water logs, advisories, harvest market' },
          { prefix: '/api/kisanconnect', count: 10, desc: 'Equipment, bookings, jobs, applications' },
          { prefix: '/api/farmerconnect', count: 8, desc: 'Properties CRUD, search, stats' },
          { prefix: '/api/intelligence', count: 18, desc: 'Prices, supply-demand, heatmaps, weather, recommendations' },
          { prefix: '/ws', count: 1, desc: 'Real-time WebSocket (price alerts, notifications)' },
        ].map(r => `<div style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)">
          <span class="fw-600 text-sm" style="min-width:140px;color:var(--primary)">${r.prefix}</span>
          <span class="tag tag-gray" style="font-size:10px">${r.count}</span>
          <span class="text-sm text-muted">${r.desc}</span>
        </div>`).join('')}
      </div>

      <div class="card" style="padding:16px;margin-bottom:12px">
        <div class="fw-700" style="margin-bottom:10px">📨 Event-Driven Pipeline</div>
        <div class="text-sm">
          ${[
            { freq: 'Real-time', tasks: 'WebSocket price alerts, notification push, live order updates' },
            { freq: 'Hourly', tasks: 'Aggregate declarations, update supply map, trigger buyer alerts' },
            { freq: 'Daily', tasks: '30-day forecast, price trends (Agmarknet), weather overlay, data quality score' },
            { freq: 'Weekly', tasks: 'Supply trends, demand-supply gap, FPO trust scores, buyer digest' },
            { freq: 'Seasonal', tasks: 'Forecast calibration, government reports, NABARD data packages' },
          ].map(e => `<div style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)">
            <span class="tag tag-blue" style="font-size:10px;min-width:70px;text-align:center">${e.freq}</span>
            <span class="text-sm">${e.tasks}</span>
          </div>`).join('')}
        </div>
      </div>
    </div>`;
  }

  function renderSecurity() {
    return `<div class="section" style="padding-top:8px">
      ${[
        { icon: '🔐', title: 'Authentication', desc: 'OTP-based phone auth via MSG91. JWT (RS256) with role claims. Multi-factor for admin roles. Session management with refresh tokens.' },
        { icon: '🛡️', title: 'Row-Level Security', desc: 'PostgreSQL RLS policies. Farmer sees own data only. FPO admin sees member data. Buyers see aggregated district data only (min 5 farmer threshold).' },
        { icon: '🔒', title: 'Encryption', desc: 'TLS 1.3 in transit. AES-256 at rest. Aadhaar stored as SHA-256 hash only. Bank accounts encrypted at application layer.' },
        { icon: '🕵️', title: 'Fraud Prevention', desc: 'Anomaly detection on crop declarations (3σ outliers). Data quality scoring 0-100. Statistical verification against district averages.' },
        { icon: '🛑', title: 'Anti-Scraping', desc: 'Cloudflare WAF + rate limiting. Browser fingerprinting for API abuse detection. CAPTCHA on high-value endpoints.' },
        { icon: '📋', title: 'DPDP Compliance', desc: 'India Digital Personal Data Protection Act 2023. Right to erasure. Data export. Consent management. Audit trails.' },
      ].map(s => `
        <div class="card" style="padding:16px;margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <span style="font-size:24px">${s.icon}</span>
            <span class="fw-700">${s.title}</span>
          </div>
          <div class="text-sm text-muted">${s.desc}</div>
        </div>
      `).join('')}
    </div>`;
  }

  function renderRevenue() {
    return `<div class="section" style="padding-top:8px">
      <div class="card" style="padding:16px;margin-bottom:12px">
        <div class="fw-700" style="margin-bottom:10px">🏢 5-Tier Revenue Model</div>
        <div style="font-size:12px;line-height:1.8;font-family:monospace;background:var(--surface);padding:12px;border-radius:8px">
Tier 1: Farmer Plans         ₹0–₹249/yr
Tier 2: FPO SaaS             ₹999–₹4,999/mo
Tier 3: Buyer Intelligence   ₹9,999–₹59,999/yr
Tier 4: Data Licensing        ₹2L–₹20L/yr
Tier 5: Financial Referrals   Revenue share
        </div>
      </div>

      <div class="card" style="padding:16px;margin-bottom:12px">
        <div class="fw-700" style="margin-bottom:10px">👨‍🌾 Farmer Plans (80% users — FREE)</div>
        ${[
          { plan: 'Free', price: '₹0', features: 'Core features, price radar, community' },
          { plan: 'AgriPass', price: '₹99/yr', features: 'Priority inquiries, yield analytics' },
          { plan: 'AgriPass Pro', price: '₹249/yr', features: 'Direct buyer connection, premium prices' },
        ].map(p => `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
          <div><span class="fw-600 text-sm">${p.plan}</span><div class="text-sm text-muted">${p.features}</div></div>
          <span class="fw-700" style="color:var(--primary)">${p.price}</span>
        </div>`).join('')}
      </div>

      <div class="card" style="padding:16px;margin-bottom:12px">
        <div class="fw-700" style="margin-bottom:10px">🛒 Buyer Subscriptions (Paid)</div>
        <div class="text-sm fw-600" style="color:var(--primary);margin-bottom:8px">AgriFlow Buyer</div>
        ${[
          { plan: 'Explorer', price: '₹9,999/yr', features: '5 states, basic search' },
          { plan: 'Trader', price: '₹24,999/yr', features: '10 states, full discovery' },
          { plan: 'Enterprise', price: '₹59,999/yr', features: 'All-India, API, custom reports' },
        ].map(p => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)">
          <div><span class="fw-600 text-sm">${p.plan}</span><div class="text-sm text-muted">${p.features}</div></div>
          <span class="fw-600 text-sm" style="color:var(--primary)">${p.price}</span>
        </div>`).join('')}
        <div class="text-sm fw-600" style="color:var(--primary);margin:12px 0 8px">AquaOS Buyer</div>
        ${[
          { plan: 'Free Buyer', price: '₹0', features: 'Browse only, no contact' },
          { plan: 'Basic', price: '₹2,999/mo', features: 'Contact sellers, make offers' },
          { plan: 'Professional', price: '₹7,999/mo', features: 'Priority access, intelligence reports' },
          { plan: 'Enterprise', price: 'Custom', features: 'API access, white-label feeds' },
        ].map(p => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)">
          <div><span class="fw-600 text-sm">${p.plan}</span><div class="text-sm text-muted">${p.features}</div></div>
          <span class="fw-600 text-sm" style="color:var(--primary)">${p.price}</span>
        </div>`).join('')}
      </div>

      <div class="card" style="padding:16px;margin-bottom:12px">
        <div class="fw-700" style="margin-bottom:10px">🏢 FPO SaaS Plans</div>
        ${[
          { plan: 'Starter', price: '₹999/mo', features: 'Up to 100 farmers' },
          { plan: 'Growth', price: '₹2,499/mo', features: 'Up to 500 farmers' },
          { plan: 'Enterprise', price: '₹4,999/mo', features: 'Unlimited, API access' },
        ].map(p => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)">
          <div><span class="fw-600 text-sm">${p.plan}</span><div class="text-sm text-muted">${p.features}</div></div>
          <span class="fw-600 text-sm" style="color:var(--primary)">${p.price}</span>
        </div>`).join('')}
      </div>

      <div class="card" style="padding:16px;margin-bottom:12px">
        <div class="fw-700" style="margin-bottom:10px">🏠 FarmerConnect Plans</div>
        <div class="text-sm fw-600" style="color:var(--primary);margin-bottom:8px">Seeker Plans</div>
        ${[
          { plan: 'Free', price: '₹0', features: 'Browse, 3 contacts/month' },
          { plan: 'Connect', price: '₹499/30d', features: 'Unlimited contacts, chat' },
          { plan: 'Relax', price: '₹1,499/90d', features: 'RM-assisted search' },
          { plan: 'Power', price: '₹2,999/180d', features: 'Legal agreement, background check' },
        ].map(p => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)">
          <div><span class="fw-600 text-sm">${p.plan}</span><div class="text-sm text-muted">${p.features}</div></div>
          <span class="fw-600 text-sm" style="color:var(--primary)">${p.price}</span>
        </div>`).join('')}
        <div class="text-sm fw-600" style="color:var(--primary);margin:12px 0 8px">Owner Plans</div>
        ${[
          { plan: 'Free', price: '₹0', features: '1 active listing' },
          { plan: 'Premium', price: '₹799/90d', features: '5 listings, featured placement' },
          { plan: 'Pro', price: '₹1,999/180d', features: '15 listings, top of search' },
          { plan: 'Elite', price: '₹4,999/365d', features: 'Unlimited, dedicated RM' },
        ].map(p => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)">
          <div><span class="fw-600 text-sm">${p.plan}</span><div class="text-sm text-muted">${p.features}</div></div>
          <span class="fw-600 text-sm" style="color:var(--primary)">${p.price}</span>
        </div>`).join('')}
      </div>

      <div class="card" style="padding:16px;margin-bottom:12px">
        <div class="fw-700" style="margin-bottom:10px">💳 Transaction Revenue</div>
        ${[
          { item: 'Crop trading commission', rate: '2–5% of GMV' },
          { item: 'Equipment rental commission', rate: '8–15% of rental' },
          { item: 'Rural services leads', rate: '₹10–₹50/lead' },
          { item: 'Job posting fees', rate: '₹99–₹499/post' },
          { item: 'Featured listings', rate: '₹50–₹500/listing' },
          { item: 'AquaOS supplier commission', rate: '5–12% of sales' },
          { item: 'FarmerConnect rent processing', rate: '1.5% of rent' },
          { item: 'Digital agreements', rate: '₹399–₹3,499' },
          { item: 'Data licensing (Institutional)', rate: '₹2L–₹20L/yr' },
        ].map(t => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)">
          <span class="text-sm">${t.item}</span>
          <span class="fw-600 text-sm" style="color:var(--primary)">${t.rate}</span>
        </div>`).join('')}
      </div>
    </div>`;
  }

  function renderRoadmap() {
    const phases = [
      { phase: 'Phase 1 — Foundation', status: '✅ Complete', color: '#4CAF50',
        items: ['Core database schema (31 tables)', 'Auth + OTP flow', 'Farmer app MVP (crop declarations)', 'Basic marketplace CRUD', 'Mobile web app (current)'] },
      { phase: 'Phase 2 — Marketplace', status: '🔄 In Progress', color: '#FF9800',
        items: ['Buyer intelligence app', 'Supply search engine', 'FPO inventory management', 'Inquiry system', 'Escrow payments'] },
      { phase: 'Phase 3 — Intelligence', status: '📋 Planned', color: '#2196F3',
        items: ['Data aggregation pipeline', 'Harvest forecasting', 'Price radar integration (Agmarknet)', 'Intelligence reports', 'Weather + satellite overlay'] },
      { phase: 'Phase 4 — Scale', status: '📋 Planned', color: '#9C27B0',
        items: ['ML model training (XGBoost)', 'Government API integration (eNAM, PM-KISAN)', 'Banking & insurance ecosystem', 'Multi-state expansion'] },
      { phase: 'Phase 5 — Dominance', status: '🔮 Vision', color: '#E91E63',
        items: ['Satellite integration', 'AI crop prediction', 'National intelligence grid', 'Data licensing revenue (₹2Cr+)', '10M+ farmers'] },
    ];

    return `<div class="section" style="padding-top:8px">
      ${phases.map((p, i) => `
        <div class="card" style="padding:16px;margin-bottom:12px;border-left:4px solid ${p.color}">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <span class="fw-700">${p.phase}</span>
            <span class="tag" style="background:${p.color}20;color:${p.color};font-size:10px">${p.status}</span>
          </div>
          <div class="text-sm">
            ${p.items.map(item => `<div style="padding:3px 0">• ${item}</div>`).join('')}
          </div>
        </div>
      `).join('')}

      <div class="card" style="padding:16px;margin-bottom:12px">
        <div class="fw-700" style="margin-bottom:10px">📈 Target Market</div>
        ${[
          { segment: 'Indian Agriculture', tam: '₹30L Cr/yr' },
          { segment: 'AP Aquaculture', tam: '₹55,000 Cr/yr' },
          { segment: 'Urban Rental', tam: '₹1,80,000 Cr/yr' },
          { segment: 'Agricultural Land', tam: '₹12,000 Cr/yr' },
          { segment: 'PG/Co-living', tam: '₹1,20,000 Cr/yr' },
          { segment: 'Rural E-commerce', tam: '₹2,00,000 Cr/yr' },
        ].map(m => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)">
          <span class="text-sm">${m.segment}</span>
          <span class="fw-700 text-sm" style="color:var(--primary)">${m.tam}</span>
        </div>`).join('')}
      </div>
    </div>`;
  }

  render();
}
