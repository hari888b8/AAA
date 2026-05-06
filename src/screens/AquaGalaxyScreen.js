import { api } from '../api.js';
import { navigate, showToast } from '../app-shell.js';

/**
 * AquaOS Galaxy — Public discovery of aquaculture farms
 */
export function renderAquaGalaxy(container) {
  let farms = [];
  let stats = { total_farms: 0, total_acres: 0, total_production_mt: 0 };
  let searchQ = '';
  let sortBy = 'capacity';
  let isLoading = true;

  async function loadData() {
    isLoading = true; render();
    try {
      const params = new URLSearchParams();
      if (searchQ) params.set('search', searchQ);
      params.set('sort_by', sortBy); params.set('limit', '100');
      const res = await api(`galaxy/aqua/directory?${params.toString()}`);
      farms = res.farms || []; stats = res.stats || stats;
    } catch (err) { showToast('Failed to load aqua directory', 'error'); }
    isLoading = false; render();
  }

  function render() {
    container.innerHTML = `
      <div style="min-height:100vh;background:#f5f7fa;">
        <div style="background:linear-gradient(135deg,#01579B,#0277BD,#0288D1);padding:24px 16px 20px;color:#fff;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
            <button onclick="window.navigateBack?.()" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer;">←</button>
            <div>
              <h1 style="margin:0;font-size:20px;font-weight:800;">🐟 Aqua Galaxy</h1>
              <p style="margin:2px 0 0;font-size:12px;opacity:0.9;">Discover Aquaculture Farms • Source Seafood</p>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:12px;">
            <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px;text-align:center;">
              <div style="font-size:20px;font-weight:800;">${stats.total_farms}</div><div style="font-size:10px;opacity:0.85;">Farms</div>
            </div>
            <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px;text-align:center;">
              <div style="font-size:20px;font-weight:800;">${formatNum(stats.total_acres)}</div><div style="font-size:10px;opacity:0.85;">Acres</div>
            </div>
            <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px;text-align:center;">
              <div style="font-size:20px;font-weight:800;">${formatNum(stats.total_production_mt)}</div><div style="font-size:10px;opacity:0.85;">MT/Year</div>
            </div>
          </div>
        </div>
        <div style="padding:12px 14px 0;">
          <div style="display:flex;align-items:center;background:#fff;border:1px solid #E0E0E0;border-radius:12px;padding:10px 14px;margin-bottom:10px;">
            <span style="margin-right:8px;">🔍</span>
            <input id="aquaSearch" type="search" placeholder="Search farms, species, district…" value="${searchQ}"
              style="border:none;outline:none;flex:1;font-size:13px;background:transparent;">
          </div>
          <div style="display:flex;gap:6px;padding-bottom:8px;">
            <select id="sortFilter" style="padding:6px 10px;border-radius:20px;border:1px solid #E0E0E0;font-size:12px;background:#fff;">
              <option value="capacity" ${sortBy==='capacity'?'selected':''}>Largest Area</option>
              <option value="production" ${sortBy==='production'?'selected':''}>Most Production</option>
              <option value="name" ${sortBy==='name'?'selected':''}>Name A-Z</option>
            </select>
          </div>
        </div>
        <div style="padding:0 14px 80px;">
          ${isLoading ? '<div style="text-align:center;padding:40px;"><div class="spinner"></div></div>' : ''}
          ${!isLoading && farms.length === 0 ? '<div style="text-align:center;padding:40px;color:#757575;"><p style="font-size:40px;">🐟</p><p>No farms found</p></div>' : ''}
          ${!isLoading ? farms.map(f => `
            <div class="galaxy-card" data-id="${f.id}" style="background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;border:1px solid #E8E8E8;cursor:pointer;">
              <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px;">
                <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#E1F5FE,#B3E5FC);display:flex;align-items:center;justify-content:center;font-size:22px;">🐟</div>
                <div style="flex:1;">
                  <div style="font-weight:700;font-size:14px;color:#01579B;">${f.farm_name}</div>
                  <div style="font-size:11px;color:#757575;">📍 ${f.district || ''}, ${f.state || ''} • ${f.culture_type || ''}</div>
                </div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px;">
                <div style="text-align:center;background:#F5F5F5;border-radius:8px;padding:6px;"><div style="font-weight:700;font-size:13px;color:#0277BD;">${f.total_area_acres || 0} ac</div><div style="font-size:9px;">Area</div></div>
                <div style="text-align:center;background:#F5F5F5;border-radius:8px;padding:6px;"><div style="font-weight:700;font-size:13px;color:#2E7D32;">${f.annual_production_mt || 0} MT</div><div style="font-size:9px;">Production</div></div>
                <div style="text-align:center;background:#F5F5F5;border-radius:8px;padding:6px;"><div style="font-weight:700;font-size:13px;color:#6A1B9A;">${f.culture_units || 0}</div><div style="font-size:9px;">Units</div></div>
              </div>
              ${(f.species||[]).length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:4px;">${f.species.slice(0,3).map(s => `<span style="background:#E1F5FE;border:1px solid #81D4FA;border-radius:12px;padding:3px 8px;font-size:11px;color:#01579B;">🐠 ${s}</span>`).join('')}</div>` : ''}
            </div>
          `).join('') : ''}
        </div>
      </div>`;
    attachEvents();
  }

  function attachEvents() {
    const s = container.querySelector('#aquaSearch');
    if (s) { let d; s.addEventListener('input', e => { clearTimeout(d); d = setTimeout(() => { searchQ = e.target.value; loadData(); }, 400); }); }
    container.querySelector('#sortFilter')?.addEventListener('change', e => { sortBy = e.target.value; loadData(); });
    container.querySelectorAll('.galaxy-card').forEach(c => c.addEventListener('click', () => navigate(`aquaportfolio?id=${c.dataset.id}`)));
  }

  function formatNum(n) { n = parseFloat(n) || 0; if (n >= 1000) return (n/1000).toFixed(1)+'K'; return Math.round(n).toString(); }
  loadData();
}
