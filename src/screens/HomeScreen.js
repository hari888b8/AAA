import { api } from '../api.js';
import { getState, getRole } from '../store.js';
import { navigate, showToast } from '../main.js';

export function renderHome(container) {
  const user = getState().user;
  const role = getRole();
  const greeting = getGreeting();
  const roleLabel = role === 'buyer' ? 'Buyer' : role === 'fpo' ? 'FPO Admin' : 'Farmer';
  const roleIcon = role === 'buyer' ? '🛒' : role === 'fpo' ? '🏢' : '👨‍🌾';

  container.innerHTML = `
    <div class="hero-banner">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <h1>${greeting}, ${user?.name?.split(' ')[0] || 'Farmer'} 👋</h1>
        <span style="background:rgba(255,255,255,0.2);padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600">${roleIcon} ${roleLabel}</span>
      </div>
      <p>${role === 'buyer' ? 'Supply Intelligence Dashboard' : role === 'fpo' ? 'FPO Management Dashboard' : 'Today\'s Farm Dashboard'}</p>
      <div class="hero-stats" id="heroStats">
        <div class="hero-stat"><div class="hs-val skeleton" style="height:22px;width:60px;margin-bottom:4px">&nbsp;</div><div class="hs-label">Farmers</div></div>
        <div class="hero-stat"><div class="hs-val skeleton" style="height:22px;width:60px;margin-bottom:4px">&nbsp;</div><div class="hs-label">Listings</div></div>
        <div class="hero-stat"><div class="hs-val skeleton" style="height:22px;width:60px;margin-bottom:4px">&nbsp;</div><div class="hs-label">Districts</div></div>
      </div>
    </div>

    <div class="quick-actions" style="grid-template-columns:repeat(3,1fr)">
      <button class="quick-action" data-nav="agriflow" style="background:linear-gradient(135deg,rgba(123,47,247,0.08),rgba(47,128,237,0.08))">
        <div class="qa-icon" style="background:linear-gradient(135deg,#7b2ff7,#2f80ed);color:#fff;font-size:20px">🌾</div>
        <span class="qa-label" style="font-weight:700;color:#7b2ff7">AgriFlow</span>
        <span style="font-size:9px;color:var(--text3);margin-top:-2px">Supply Intel</span>
      </button>
      <button class="quick-action" data-nav="aquaos" style="background:linear-gradient(135deg,rgba(47,128,237,0.08),rgba(0,201,167,0.08))">
        <div class="qa-icon" style="background:linear-gradient(135deg,#2f80ed,#00c9a7);color:#fff;font-size:20px">🐟</div>
        <span class="qa-label" style="font-weight:700;color:#00c9a7">AquaOS</span>
        <span style="font-size:9px;color:var(--text3);margin-top:-2px">Aquaculture</span>
      </button>
      <button class="quick-action" data-nav="kisan" style="background:linear-gradient(135deg,rgba(255,107,53,0.08),rgba(230,57,70,0.08))">
        <div class="qa-icon" style="background:linear-gradient(135deg,#ff6b35,#e63946);color:#fff;font-size:20px">🚜</div>
        <span class="qa-label" style="font-weight:700;color:#ff6b35">KisanConnect</span>
        <span style="font-size:9px;color:var(--text3);margin-top:-2px">Rural Super-App</span>
      </button>
      <button class="quick-action" data-nav="farmerconnect" style="background:linear-gradient(135deg,rgba(0,201,167,0.08),rgba(168,224,99,0.08))">
        <div class="qa-icon" style="background:linear-gradient(135deg,#00c9a7,#a8e063);color:#fff;font-size:20px">🏡</div>
        <span class="qa-label" style="font-weight:700;color:#2e7d32">FarmerConnect</span>
        <span style="font-size:9px;color:var(--text3);margin-top:-2px">Property & Land</span>
      </button>
      <button class="quick-action" data-nav="intelligence" style="background:linear-gradient(135deg,rgba(230,57,70,0.08),rgba(155,89,182,0.08))">
        <div class="qa-icon" style="background:linear-gradient(135deg,#e63946,#9b59b6);color:#fff;font-size:20px">📊</div>
        <span class="qa-label" style="font-weight:700;color:#e63946">Intelligence</span>
        <span style="font-size:9px;color:var(--text3);margin-top:-2px">Data & Analytics</span>
      </button>
      <button class="quick-action" data-nav="weather" style="background:linear-gradient(135deg,rgba(33,150,243,0.08),rgba(0,201,167,0.08))">
        <div class="qa-icon" style="background:linear-gradient(135deg,#2196F3,#00BCD4);color:#fff;font-size:20px">🌤️</div>
        <span class="qa-label" style="font-weight:700;color:#0288D1">Weather</span>
        <span style="font-size:9px;color:var(--text3);margin-top:-2px">Forecast & Crop</span>
      </button>
      <button class="quick-action" data-nav="community">
        <div class="qa-icon" style="background:#FBE9E7">💬</div>
        <span class="qa-label">Community</span>
      </button>
      <button class="quick-action" data-nav="orders">
        <div class="qa-icon" style="background:#EFEBE9">📦</div>
        <span class="qa-label">Orders</span>
      </button>
      <button class="quick-action" data-nav="profile">
        <div class="qa-icon" style="background:#E8EAF6">👤</div>
        <span class="qa-label">Profile</span>
      </button>
    </div>

    <div id="dashCards" style="padding:0 16px"></div>

    <div class="section">
      <div class="section-title">📈 Live Market Prices <button class="see-all" data-nav="intelligence">View All</button></div>
      <div id="priceList"><div class="loading"><div class="spinner"></div></div></div>
    </div>

    <div class="section">
      <div class="section-title">📋 Recent Activity</div>
      <div class="card" id="activityFeed"><div class="loading"><div class="spinner"></div></div></div>
    </div>
  `;

  // Quick action navigation
  container.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => navigate(el.dataset.nav));
  });

  loadData();

  async function loadData() {
    // Platform stats
    try {
      const res = await api.getPlatformStats();
      const s = res.stats || res;
      const heroEl = container.querySelector('#heroStats');
      if (heroEl) {
        heroEl.innerHTML = `
          <div class="hero-stat"><div class="hs-val">${fmt(s.total_farmers || 0)}</div><div class="hs-label">Farmers</div></div>
          <div class="hero-stat"><div class="hs-val">${fmt(s.active_listings || 0)}</div><div class="hs-label">Listings</div></div>
          <div class="hero-stat"><div class="hs-val">${s.districts_covered || 0}</div><div class="hs-label">Districts</div></div>
        `;
      }
    } catch (e) { console.error('Stats:', e); }

    // Prices
    try {
      const prices = await api.getPrices('?limit=6');
      const priceArr = Array.isArray(prices) ? prices : (prices.prices || []);
      const priceEl = container.querySelector('#priceList');
      if (priceEl) {
        if (priceArr.length === 0) {
          priceEl.innerHTML = '<div class="empty-state"><div class="es-icon">📊</div><div class="es-text">No price data</div></div>';
        } else {
          priceEl.innerHTML = priceArr.slice(0, 6).map(p => `
            <div class="price-card">
              <span class="p-emoji">${p.icon_emoji || '🌾'}</span>
              <div class="p-info">
                <div class="p-name">${p.crop || p.crop_name || 'Crop'}</div>
                <div class="p-market">${p.market_name || ''}</div>
              </div>
              <div class="p-price">
                <div class="p-value">₹${Number(p.price_per_quintal || 0).toLocaleString()}</div>
                <div class="p-change ${(p.change_pct || 0) >= 0 ? 'p-up' : 'p-down'}">${(p.change_pct || 0) >= 0 ? '▲' : '▼'} ${Math.abs(p.change_pct || 0).toFixed(1)}%</div>
              </div>
            </div>
          `).join('');
        }
      }
    } catch (e) { console.error('Prices:', e); }

    // Activity feed
    try {
      const feed = await api.getActivityFeed();
      const feedArr = Array.isArray(feed) ? feed : (feed.activities || feed.feed || []);
      const feedEl = container.querySelector('#activityFeed');
      if (feedEl) {
        if (feedArr.length === 0) {
          feedEl.innerHTML = '<div class="empty-state"><div class="es-icon">📋</div><div class="es-text">No recent activity</div></div>';
        } else {
          feedEl.innerHTML = feedArr.slice(0, 8).map(f => `
            <div class="feed-item">
              <span class="f-dot"></span>
              <div>
                <div class="f-text">${f.description || f.message || f.title || 'Activity'}</div>
                <div class="f-time">${timeAgo(f.created_at)}</div>
              </div>
            </div>
          `).join('');
        }
      }
    } catch (e) { console.error('Feed:', e); }

    // Role-specific dashboard cards
    const dashEl = container.querySelector('#dashCards');
    if (!dashEl) return;
    let dashHTML = '';
    try {
      if (role === 'farmer' || !role) {
        const [stats, calendar, weather] = await Promise.allSettled([
          api.getFarmerStats(),
          api.getHarvestCalendar(),
          api.getForecast('?days=1'),
        ]);
        const fs = stats.value?.stats || stats.value || {};
        const cal = calendar.value?.calendar || calendar.value || [];
        const w = weather.value?.forecast?.[0] || weather.value?.[0] || weather.value || {};

        dashHTML += `<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:12px">
          <div class="card" style="padding:12px;text-align:center;cursor:pointer" data-nav="agriflow">
            <div style="font-size:20px">📋</div>
            <div class="fw-700" style="font-size:18px;color:var(--primary)">${fs.total_listings || fs.listings || 0}</div>
            <div class="text-sm text-muted">My Listings</div>
          </div>
          <div class="card" style="padding:12px;text-align:center;cursor:pointer" data-nav="agriflow">
            <div style="font-size:20px">🌱</div>
            <div class="fw-700" style="font-size:18px;color:var(--success)">${fs.total_declarations || fs.declarations || 0}</div>
            <div class="text-sm text-muted">Declarations</div>
          </div>
        </div>`;

        if (cal.length > 0) {
          dashHTML += `<div class="card" style="padding:12px;margin-bottom:12px">
            <div class="fw-700 text-sm" style="margin-bottom:8px">🗓️ Upcoming Harvests</div>
            ${cal.slice(0, 3).map(h => {
              const days = Number(h.days_to_harvest || 0);
              const color = days <= 7 ? '#F44336' : days <= 30 ? '#FF9800' : '#4CAF50';
              return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)">
                <span style="font-size:16px">${h.icon_emoji || '🌾'}</span>
                <div style="flex:1"><div class="text-sm fw-600">${h.crop_name || 'Crop'}</div></div>
                <span style="font-size:12px;font-weight:700;color:${color}">${days > 0 ? days + 'd' : 'Now!'}</span>
              </div>`;
            }).join('')}
          </div>`;
        }

        if (w.temp_c || w.temperature || w.condition) {
          dashHTML += `<div class="card" style="padding:12px;margin-bottom:12px;display:flex;align-items:center;gap:12px;cursor:pointer" data-nav="weather">
            <div style="font-size:32px">${w.condition === 'Rain' ? '🌧️' : w.condition === 'Cloudy' ? '☁️' : '☀️'}</div>
            <div style="flex:1">
              <div class="fw-700">${w.temp_c || w.temperature || '--'}°C <span class="text-sm text-muted">${w.condition || w.description || ''}</span></div>
              <div class="text-sm text-muted">💧 ${w.humidity || '--'}% humidity · 🌬️ ${w.wind_speed || '--'} km/h</div>
            </div>
          </div>`;
        }
      } else if (role === 'fpo') {
        const fpoStats = await api.getFPOStats().catch(() => ({}));
        const fs = fpoStats?.stats || fpoStats || {};
        dashHTML += `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px">
          <div class="card" style="padding:10px;text-align:center"><div style="font-size:18px">👥</div><div class="fw-700" style="color:#2196F3">${fs.total_members || 0}</div><div style="font-size:10px;color:var(--text3)">Members</div></div>
          <div class="card" style="padding:10px;text-align:center"><div style="font-size:18px">📦</div><div class="fw-700" style="color:#4CAF50">${fs.total_procurement || 0}</div><div style="font-size:10px;color:var(--text3)">Procured</div></div>
          <div class="card" style="padding:10px;text-align:center"><div style="font-size:18px">📋</div><div class="fw-700" style="color:#FF9800">${fs.active_listings || 0}</div><div style="font-size:10px;color:var(--text3)">Listings</div></div>
        </div>`;
      } else if (role === 'buyer') {
        const buyerStats = await api.getBuyerStats().catch(() => ({}));
        const bs = buyerStats?.stats || buyerStats || {};
        dashHTML += `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px">
          <div class="card" style="padding:10px;text-align:center"><div style="font-size:18px">💬</div><div class="fw-700" style="color:#2196F3">${bs.total_inquiries || 0}</div><div style="font-size:10px;color:var(--text3)">Inquiries</div></div>
          <div class="card" style="padding:10px;text-align:center"><div style="font-size:18px">⭐</div><div class="fw-700" style="color:#FF9800">${bs.watchlist_count || 0}</div><div style="font-size:10px;color:var(--text3)">Watchlist</div></div>
          <div class="card" style="padding:10px;text-align:center"><div style="font-size:18px">📦</div><div class="fw-700" style="color:#4CAF50">${bs.total_orders || 0}</div><div style="font-size:10px;color:var(--text3)">Orders</div></div>
        </div>`;
      }
    } catch (e) { console.error('DashCards:', e); }
    dashEl.innerHTML = dashHTML;
    dashEl.querySelectorAll('[data-nav]').forEach(el => {
      el.addEventListener('click', () => navigate(el.dataset.nav));
    });
  }
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function fmt(n) {
  n = Number(n);
  if (n >= 100000) return (n / 100000).toFixed(1) + 'L';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function timeAgo(d) {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}
