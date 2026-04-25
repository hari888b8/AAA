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

    <div class="quick-actions">
      <button class="quick-action" data-nav="agriflow">
        <div class="qa-icon" style="background:var(--primary-surface)">🌾</div>
        <span class="qa-label">AgriFlow</span>
      </button>
      <button class="quick-action" data-nav="aquaos">
        <div class="qa-icon" style="background:#E3F2FD">🐟</div>
        <span class="qa-label">AquaOS</span>
      </button>
      <button class="quick-action" data-nav="kisan">
        <div class="qa-icon" style="background:#FFF3E0">🤝</div>
        <span class="qa-label">Kisan</span>
      </button>
      <button class="quick-action" data-nav="farmerconnect">
        <div class="qa-icon" style="background:#F3E5F5">🏠</div>
        <span class="qa-label">Housing</span>
      </button>
      <button class="quick-action" data-nav="intelligence">
        <div class="qa-icon" style="background:#E8EAF6">📊</div>
        <span class="qa-label">Prices</span>
      </button>
      <button class="quick-action" data-nav="weather">
        <div class="qa-icon" style="background:#E0F7FA">🌤️</div>
        <span class="qa-label">Weather</span>
      </button>
      <button class="quick-action" data-nav="community">
        <div class="qa-icon" style="background:#FBE9E7">💬</div>
        <span class="qa-label">Community</span>
      </button>
      <button class="quick-action" data-nav="orders">
        <div class="qa-icon" style="background:#EFEBE9">📦</div>
        <span class="qa-label">Orders</span>
      </button>
      <button class="quick-action" data-nav="architecture">
        <div class="qa-icon" style="background:#E8EAF6">🏗️</div>
        <span class="qa-label">Architecture</span>
      </button>
    </div>

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
