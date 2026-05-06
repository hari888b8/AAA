import { api } from '../api.js';
import { navigate, showToast } from '../app-shell.js';

/**
 * Farmer Galaxy — Public Directory of individual farmers for buyers/FPOs
 */
export function renderFarmerGalaxy(container) {
  let farmers = [];
  let stats = { total_farmers: 0, total_acres: 0, organic_farmers: 0 };
  let searchQ = '';
  let stateFilter = '';
  let sortBy = 'land';
  let isLoading = true;

  async function loadData() {
    isLoading = true; render();
    try {
      const params = new URLSearchParams();
      if (searchQ) params.set('search', searchQ);
      if (stateFilter) params.set('state', stateFilter);
      params.set('sort_by', sortBy);
      params.set('limit', '100');
      const res = await api(`galaxy/farmer/directory?${params.toString()}`);
      farmers = res.farmers || [];
      stats = res.stats || stats;
    } catch (err) { showToast('Failed to load farmer directory', 'error'); }
    isLoading = false; render();
  }

  function render() {
    const states = [...new Set(farmers.map(f => f.state || f.state_name).filter(Boolean))].sort();
    container.innerHTML = `
      <div style="min-height:100vh;background:#f5f7fa;">
        <div style="background:linear-gradient(135deg,#2E7D32,#43A047,#66BB6A);padding:24px 16px 20px;color:#fff;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
            <button onclick="window.navigateBack?.()" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer;">←</button>
            <div>
              <h1 style="margin:0;font-size:20px;font-weight:800;">👨‍🌾 Farmer Galaxy</h1>
              <p style="margin:2px 0 0;font-size:12px;opacity:0.9;">Discover Verified Farmers • Source Direct</p>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:12px;">
            <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px;text-align:center;">
              <div style="font-size:20px;font-weight:800;">${formatNum(stats.total_farmers)}</div>
              <div style="font-size:10px;opacity:0.85;">Farmers</div>
            </div>
            <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px;text-align:center;">
              <div style="font-size:20px;font-weight:800;">${formatNum(stats.total_acres)}</div>
              <div style="font-size:10px;opacity:0.85;">Acres</div>
            </div>
            <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px;text-align:center;">
              <div style="font-size:20px;font-weight:800;">${formatNum(stats.organic_farmers)}</div>
              <div style="font-size:10px;opacity:0.85;">Organic</div>
            </div>
          </div>
        </div>
        <div style="padding:12px 14px 0;">
          <div style="display:flex;align-items:center;background:#fff;border:1px solid #E0E0E0;border-radius:12px;padding:10px 14px;margin-bottom:10px;">
            <span style="margin-right:8px;">🔍</span>
            <input id="farmerSearch" type="search" placeholder="Search by name, crop, village…" value="${searchQ}"
              style="border:none;outline:none;flex:1;font-size:13px;background:transparent;">
          </div>
          <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:8px;">
            <select id="stateFilter" style="padding:6px 10px;border-radius:20px;border:1px solid #E0E0E0;font-size:12px;background:#fff;">
              <option value="">All States</option>
              ${states.map(s => `<option value="${s}" ${stateFilter === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
            <select id="sortFilter" style="padding:6px 10px;border-radius:20px;border:1px solid #E0E0E0;font-size:12px;background:#fff;">
              <option value="land" ${sortBy === 'land' ? 'selected' : ''}>Most Land</option>
              <option value="listings" ${sortBy === 'listings' ? 'selected' : ''}>Most Listings</option>
              <option value="name" ${sortBy === 'name' ? 'selected' : ''}>Name A-Z</option>
            </select>
          </div>
        </div>
        <div style="padding:0 14px 80px;">
          ${isLoading ? '<div style="text-align:center;padding:40px;"><div class="spinner"></div></div>' : ''}
          ${!isLoading && farmers.length === 0 ? '<div style="text-align:center;padding:40px;color:#757575;"><p style="font-size:40px;">👨‍🌾</p><p>No farmers found</p></div>' : ''}
          ${!isLoading ? farmers.map(f => renderCard(f)).join('') : ''}
        </div>
      </div>`;
    attachEvents();
  }

  function renderCard(f) {
    const crops = f.primary_crops || [];
    return `
      <div class="galaxy-card" data-id="${f.id}" style="background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;border:1px solid #E8E8E8;cursor:pointer;">
        <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px;">
          <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#E8F5E9,#C8E6C9);display:flex;align-items:center;justify-content:center;font-size:22px;">👨‍🌾</div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:700;font-size:14px;color:#2E7D32;">${f.farmer_name || 'Farmer'}</div>
            <div style="font-size:11px;color:#757575;">📍 ${f.village || ''} ${f.district_name || ''}, ${f.state_name || f.state || ''}</div>
          </div>
          ${f.organic_certified ? '<span style="background:#E8F5E9;color:#2E7D32;font-size:10px;padding:3px 8px;border-radius:10px;font-weight:600;">🌿 Organic</span>' : ''}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:10px;">
          <div style="text-align:center;background:#F5F5F5;border-radius:8px;padding:8px 4px;">
            <div style="font-weight:700;font-size:14px;color:#E65100;">🌾 ${f.total_land_acres || 0}</div>
            <div style="font-size:9px;color:#757575;">Acres</div>
          </div>
          <div style="text-align:center;background:#F5F5F5;border-radius:8px;padding:8px 4px;">
            <div style="font-weight:700;font-size:14px;color:#1565C0;">📋 ${f.active_listings || 0}</div>
            <div style="font-size:9px;color:#757575;">Listings</div>
          </div>
          <div style="text-align:center;background:#F5F5F5;border-radius:8px;padding:8px 4px;">
            <div style="font-weight:700;font-size:14px;color:#6A1B9A;">💧 ${(f.irrigation_type || []).length > 0 ? f.irrigation_type[0] : 'N/A'}</div>
            <div style="font-size:9px;color:#757575;">Irrigation</div>
          </div>
        </div>
        ${crops.length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:4px;">${crops.slice(0, 4).map(c => `<span style="background:#FFF8E1;border:1px solid #FFE082;border-radius:12px;padding:3px 8px;font-size:11px;color:#F57F17;">🌱 ${c}</span>`).join('')}</div>` : ''}
      </div>`;
  }

  function attachEvents() {
    const s = container.querySelector('#farmerSearch');
    if (s) { let d; s.addEventListener('input', e => { clearTimeout(d); d = setTimeout(() => { searchQ = e.target.value; loadData(); }, 400); }); }
    container.querySelector('#stateFilter')?.addEventListener('change', e => { stateFilter = e.target.value; loadData(); });
    container.querySelector('#sortFilter')?.addEventListener('change', e => { sortBy = e.target.value; loadData(); });
    container.querySelectorAll('.galaxy-card').forEach(card => {
      card.addEventListener('click', () => navigate(`farmerportfolio?id=${card.dataset.id}`));
    });
  }

  function formatNum(n) { n = parseFloat(n) || 0; if (n >= 100000) return (n/100000).toFixed(1)+'L'; if (n >= 1000) return (n/1000).toFixed(1)+'K'; return Math.round(n).toString(); }

  loadData();
}
