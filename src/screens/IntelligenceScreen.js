import { api } from '../api.js';
import { getState } from '../store.js';
import { showToast } from '../main.js';

export function renderIntelligence(container) {
  let tab = 'dashboard';
  let prices = [], supplyDemand = [], districts = [], recommendations = [], platformStats = {}, activities = [];
  let loading = true;

  function render() {
    container.innerHTML = `
      <div class="app-brand-header" style="padding:14px 16px 10px;background:linear-gradient(135deg,#e63946 0%,#9b59b6 100%);color:#fff">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:28px">📊</span>
          <div><div style="font-size:18px;font-weight:800;letter-spacing:-0.3px">Agri Intelligence</div><div style="font-size:11px;opacity:0.85">National Data Engine & Analytics · 10M+ Farmer Scale</div></div>
        </div>
      </div>
      <div class="tab-bar" style="overflow-x:auto;white-space:nowrap">
        <button class="tab-btn ${tab === 'dashboard' ? 'active' : ''}" data-tab="dashboard">📊 Dashboard</button>
        <button class="tab-btn ${tab === 'prices' ? 'active' : ''}" data-tab="prices">💰 Prices</button>
        <button class="tab-btn ${tab === 'supply' ? 'active' : ''}" data-tab="supply">⚖️ Supply-Demand</button>
        <button class="tab-btn ${tab === 'districts' ? 'active' : ''}" data-tab="districts">🗺️ Districts</button>
        <button class="tab-btn ${tab === 'recommend' ? 'active' : ''}" data-tab="recommend">💡 Crop Advisor</button>
        <button class="tab-btn ${tab === 'activity' ? 'active' : ''}" data-tab="activity">📡 Activity</button>
      </div>
      ${loading ? '<div class="loading"><div class="spinner"></div></div>'
        : tab === 'dashboard' ? renderDashboard()
        : tab === 'prices' ? renderPrices()
        : tab === 'supply' ? renderSupply()
        : tab === 'districts' ? renderDistricts()
        : tab === 'activity' ? renderActivity()
        : renderRecommendations()}
    `;
    container.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; render(); }));
  }

  function renderDashboard() {
    const s = platformStats;
    const statCards = [
      { icon: '👨‍🌾', label: 'Farmers', value: fmt(s.total_farmers || 0), color: '#4CAF50' },
      { icon: '🏢', label: 'FPOs', value: fmt(s.total_fpos || 0), color: '#2196F3' },
      { icon: '🛒', label: 'Buyers', value: fmt(s.total_buyers || 0), color: '#FF9800' },
      { icon: '📋', label: 'Declarations', value: fmt(s.total_declarations || 0), color: '#9C27B0' },
      { icon: '📦', label: 'Active Listings', value: fmt(s.active_listings || 0), color: '#00BCD4' },
      { icon: '🗺️', label: 'Districts', value: fmt(s.districts_covered || 0), color: '#F44336' },
      { icon: '🐟', label: 'Active Ponds', value: fmt(s.active_ponds || 0), color: '#009688' },
      { icon: '🏠', label: 'Properties', value: fmt(s.available_properties || 0), color: '#795548' },
    ];
    return `
      <div class="section" style="padding-top:8px">
        <h3 style="margin-bottom:12px;font-size:16px">🏛️ Platform Overview</h3>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:16px">
          ${statCards.map(c => `
            <div class="card" style="text-align:center;padding:12px 8px">
              <div style="font-size:24px">${c.icon}</div>
              <div style="font-size:20px;font-weight:700;color:${c.color}">${c.value}</div>
              <div class="text-sm text-muted">${c.label}</div>
            </div>
          `).join('')}
        </div>

        <h3 style="margin-bottom:12px;font-size:16px">📈 Price Movers</h3>
        ${prices.length > 0 ? `<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
          ${prices.slice(0, 5).map(p => {
            const pct = Number(p.change_pct || 0);
            const up = pct >= 0;
            return `<div class="card" style="padding:10px 12px;display:flex;align-items:center;gap:10px">
              <span style="font-size:20px">${p.icon_emoji || '🌾'}</span>
              <div style="flex:1">
                <div style="font-weight:600">${p.crop || p.crop_name || ''}</div>
                <div class="text-sm text-muted">${p.market_name || p.market_district || ''}</div>
              </div>
              <div style="text-align:right">
                <div style="font-weight:700">₹${Number(p.live_price || p.price_per_quintal || 0).toLocaleString()}/q</div>
                <div style="font-size:12px;color:${up ? '#4CAF50' : '#F44336'};font-weight:600">${up ? '▲' : '▼'} ${Math.abs(pct)}%</div>
              </div>
            </div>`;
          }).join('')}
        </div>` : '<div class="text-sm text-muted" style="margin-bottom:16px">No price data available</div>'}

        <h3 style="margin-bottom:12px;font-size:16px">⚖️ Supply Signals</h3>
        ${supplyDemand.length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:8px">
          ${supplyDemand.slice(0, 6).map(s => {
            const signal = s.signal || 'Balanced';
            const bg = signal === 'Surplus' ? '#E8F5E9' : signal === 'Deficit' ? '#FFEBEE' : '#FFF3E0';
            const fg = signal === 'Surplus' ? '#2E7D32' : signal === 'Deficit' ? '#C62828' : '#E65100';
            return `<div style="flex:1;min-width:45%;background:${bg};border-radius:10px;padding:10px 12px">
              <div style="font-weight:600;font-size:13px">${s.icon_emoji || '🌾'} ${s.crop || s.name}</div>
              <div style="font-size:11px;color:${fg};font-weight:700;margin-top:4px">${signal} · ${fmt(Number(s.gap_tonnes || 0)*1000)}kg</div>
            </div>`;
          }).join('')}
        </div>` : ''}
      </div>`;
  }

  function renderPrices() {
    if (prices.length === 0) return '<div class="empty-state"><div class="es-icon">💰</div><div class="es-title">No price data</div><div class="es-text">Market price feeds will appear here</div></div>';
    return `<div class="section" style="padding-top:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h3 style="font-size:15px;margin:0">Live Market Prices</h3>
        <span class="text-sm text-muted">${prices.length} crops tracked</span>
      </div>
      ${prices.map(p => {
        const pct = Number(p.change_pct || 0);
        const up = p.trending_up || pct >= 0;
        return `<div class="card" style="padding:12px;margin-bottom:8px;display:flex;align-items:center;gap:12px">
          <div style="width:40px;height:40px;border-radius:10px;background:${up ? '#E8F5E9' : '#FFEBEE'};display:flex;align-items:center;justify-content:center;font-size:20px">${p.icon_emoji || '🌾'}</div>
          <div style="flex:1">
            <div style="font-weight:600">${p.crop || p.crop_name}</div>
            <div class="text-sm text-muted">${p.market_name || ''} ${p.market_district ? '· ' + p.market_district : ''}</div>
          </div>
          <div style="text-align:right">
            <div style="font-weight:700;font-size:15px">₹${Number(p.live_price || p.price_per_quintal || 0).toLocaleString()}</div>
            <div style="font-size:11px;color:${up ? '#4CAF50' : '#F44336'};font-weight:600">${up ? '▲' : '▼'} ${Math.abs(pct)}%</div>
            <div style="font-size:10px;color:var(--text3)">Min ₹${Number(p.min_price || 0).toLocaleString()} · Max ₹${Number(p.max_price || 0).toLocaleString()}</div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  }

  function renderSupply() {
    if (supplyDemand.length === 0) return '<div class="empty-state"><div class="es-icon">📊</div><div class="es-title">No supply-demand data</div></div>';
    const maxVal = Math.max(...supplyDemand.map(s => Math.max(Number(s.supply_tonnes || 0), Number(s.demand_tonnes || 0))), 1);
    return `<div class="section" style="padding-top:8px">
      <h3 style="font-size:15px;margin-bottom:12px">Supply vs Demand Analysis</h3>
      ${supplyDemand.map(s => {
        const sup = Number(s.supply_tonnes || 0);
        const dem = Number(s.demand_tonnes || 0);
        const gap = Number(s.gap_tonnes || sup - dem);
        const signal = s.signal || (sup > dem * 1.1 ? 'Surplus' : sup < dem * 0.9 ? 'Deficit' : 'Balanced');
        const signalColor = signal === 'Surplus' ? 'green' : signal === 'Deficit' ? 'red' : 'orange';
        return `<div class="card" style="margin-bottom:10px">
          <div class="flex-between" style="margin-bottom:8px">
            <div><span style="font-size:18px">${s.icon_emoji || '🌾'}</span> <strong>${s.crop || s.name}</strong></div>
            <span class="tag tag-${signalColor}">${signal}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:11px;width:55px;color:var(--text2)">Supply</span>
              <div style="flex:1;height:16px;background:var(--border);border-radius:8px;overflow:hidden">
                <div style="height:100%;width:${(sup / maxVal) * 100}%;background:#4CAF50;border-radius:8px;transition:width 0.5s"></div>
              </div>
              <span style="font-size:12px;font-weight:600;width:60px;text-align:right">${fmt(sup * 1000)}kg</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:11px;width:55px;color:var(--text2)">Demand</span>
              <div style="flex:1;height:16px;background:var(--border);border-radius:8px;overflow:hidden">
                <div style="height:100%;width:${(dem / maxVal) * 100}%;background:#FF9800;border-radius:8px;transition:width 0.5s"></div>
              </div>
              <span style="font-size:12px;font-weight:600;width:60px;text-align:right">${fmt(dem * 1000)}kg</span>
            </div>
          </div>
          <div class="text-sm" style="margin-top:6px;color:${gap >= 0 ? '#4CAF50' : '#F44336'};font-weight:600">Gap: ${gap >= 0 ? '+' : ''}${gap.toFixed(1)}T</div>
        </div>`;
      }).join('')}
    </div>`;
  }

  function renderDistricts() {
    if (districts.length === 0) return '<div class="empty-state"><div class="es-icon">🗺️</div><div class="es-title">No district data</div></div>';
    return `<div class="section" style="padding-top:8px">
      <h3 style="font-size:15px;margin-bottom:12px">District Coverage Heatmap</h3>
      ${districts.map(d => {
        const cov = Number(d.coverage_pct || d.coverage || 0);
        const bg = cov > 60 ? '#4CAF50' : cov > 30 ? '#FF9800' : '#F44336';
        return `<div class="card" style="padding:10px 12px;margin-bottom:8px;display:flex;align-items:center;gap:12px">
          <div style="width:44px;height:44px;border-radius:12px;background:${bg};color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px">${cov.toFixed(0)}%</div>
          <div style="flex:1">
            <div style="font-weight:600">${d.name || d.district_name}</div>
            <div class="text-sm text-muted">${d.state_name || ''} ${d.primary_crops ? '· ' + d.primary_crops : ''}</div>
            <div style="margin-top:4px;display:flex;gap:12px;font-size:11px;color:var(--text2)">
              <span>👨‍🌾 ${fmt(d.total_farmers || 0)}</span>
              <span>📋 ${d.total_declarations || 0} decl</span>
              <span>📦 ${d.active_listings || 0} listings</span>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  }

  function renderRecommendations() {
    if (recommendations.length === 0) return '<div class="empty-state"><div class="es-icon">💡</div><div class="es-title">No recommendations</div><div class="es-text">Season-based crop recommendations based on market demand, weather, and soil data</div></div>';
    return `<div class="section" style="padding-top:8px">
      <h3 style="font-size:15px;margin-bottom:4px">🌱 Season: ${recommendations._season || 'Current'}</h3>
      <p class="text-sm text-muted" style="margin-bottom:12px">AI-powered crop recommendations for your region</p>
      ${recommendations.map(r => {
        const score = Number(r.recommendation_score || 0);
        const scoreColor = score >= 80 ? '#4CAF50' : score >= 60 ? '#FF9800' : '#F44336';
        return `<div class="card" style="margin-bottom:10px">
          <div class="flex-between" style="margin-bottom:6px">
            <div><strong>${r.icon_emoji || '🌾'} ${r.name || r.crop_name}</strong></div>
            <span style="font-weight:700;color:${scoreColor};font-size:15px">${score}/100</span>
          </div>
          <div class="text-sm text-muted">${r.reason || ''}</div>
          ${r.avg_market_price ? `<div class="text-sm" style="margin-top:4px;color:var(--primary);font-weight:600">Avg price: ₹${Number(r.avg_market_price).toLocaleString()}/q</div>` : ''}
          <div style="margin-top:8px;height:8px;background:var(--border);border-radius:4px;overflow:hidden">
            <div style="height:100%;width:${score}%;background:${scoreColor};border-radius:4px;transition:width 0.5s"></div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  }

  function renderActivity() {
    if (activities.length === 0) return '<div class="empty-state"><div class="es-icon">📡</div><div class="es-title">No recent activity</div><div class="es-text">Platform activity feed shows real-time updates</div></div>';
    return `<div class="section" style="padding-top:8px">
      <h3 style="font-size:15px;margin-bottom:12px">Real-Time Activity Feed</h3>
      ${activities.map(a => {
        const time = a.created_at ? new Date(a.created_at).toLocaleString('en-IN', { hour:'2-digit', minute:'2-digit', day:'numeric', month:'short' }) : '';
        return `<div class="card" style="padding:10px 12px;margin-bottom:8px;display:flex;gap:10px;align-items:flex-start">
          <div style="width:32px;height:32px;border-radius:8px;background:var(--primary-surface);display:flex;align-items:center;justify-content:center;font-size:16px">${a.icon || '📌'}</div>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:500">${a.title || a.description || a.message || 'Activity'}</div>
            <div class="text-sm text-muted">${a.details || a.description || ''}</div>
            <div style="font-size:10px;color:var(--text3);margin-top:2px">${time}</div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  }

  function fmt(n) {
    n = Number(n);
    if (n >= 100000) return (n / 100000).toFixed(1) + 'L';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toLocaleString();
  }

  async function loadData() {
    loading = true; render();
    try {
      const [pr, sd, dt, rc, ps, af] = await Promise.all([
        api.getPrices('?limit=30').catch(() => []),
        api.getSupplyDemand().catch(() => []),
        api.getDistrictHeatmap().catch(() => []),
        api.getCropRecommendations().catch(() => ({ recommendations: [] })),
        api.getPlatformStats().catch(() => ({})),
        api.getActivityFeed().catch(() => []),
      ]);
      prices = Array.isArray(pr) ? pr : (pr.prices || []);
      supplyDemand = Array.isArray(sd) ? sd : (sd.data || sd.crops || []);
      districts = Array.isArray(dt) ? dt : (dt.heatmap || dt.districts || []);
      const rcData = Array.isArray(rc) ? rc : (rc.recommendations || []);
      rcData._season = rc.season || '';
      recommendations = rcData;
      platformStats = ps.stats || ps || {};
      activities = Array.isArray(af) ? af : (af.activities || []);
    } catch (e) { console.error(e); }
    loading = false; render();
  }

  loadData();
}
