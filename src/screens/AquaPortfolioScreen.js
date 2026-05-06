import { api } from '../api.js';
import { navigate, showToast } from '../app-shell.js';

/**
 * Aqua Portfolio — Public portfolio for a single aquaculture farm
 */
export function renderAquaPortfolio(container) {
  let portfolio = null;
  let isLoading = true;
  const params = new URLSearchParams(window._routeParams || '');
  const farmId = params.get('id');

  async function loadData() {
    if (!farmId) { isLoading = false; render(); return; }
    isLoading = true; render();
    try { portfolio = await api(`galaxy/aqua/${farmId}/portfolio`); }
    catch (err) { showToast('Failed to load farm portfolio', 'error'); }
    isLoading = false; render();
  }

  function render() {
    if (isLoading) { container.innerHTML = `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;"><div class="spinner"></div></div>`; return; }
    if (!portfolio || !portfolio.profile) {
      container.innerHTML = `<div style="min-height:100vh;padding:20px;text-align:center;"><button onclick="window.navigateBack?.()" style="position:absolute;top:16px;left:16px;background:none;border:none;font-size:20px;cursor:pointer;">←</button><div style="padding-top:80px;"><p style="font-size:48px;">🐟</p><h2>Farm Not Found</h2></div></div>`;
      return;
    }
    const p = portfolio.profile;
    const units = portfolio.culture_units || [];
    const harvests = portfolio.recent_harvests || [];
    const wq = portfolio.water_quality || [];

    container.innerHTML = `
      <div style="min-height:100vh;background:#f5f7fa;">
        <div style="background:linear-gradient(135deg,#01579B,#0277BD);padding:20px 16px 24px;color:#fff;position:relative;">
          <button onclick="window.navigateBack?.()" style="position:absolute;top:16px;left:12px;background:none;border:none;color:#fff;font-size:20px;cursor:pointer;">←</button>
          <div style="text-align:center;padding-top:8px;">
            <div style="width:64px;height:64px;border-radius:16px;background:rgba(255,255,255,0.2);display:inline-flex;align-items:center;justify-content:center;font-size:32px;margin-bottom:8px;">🐟</div>
            <h1 style="margin:0;font-size:20px;font-weight:800;">${p.farm_name}</h1>
            <p style="margin:4px 0 0;font-size:12px;opacity:0.9;">📍 ${p.district || ''}, ${p.state || ''} • ${p.culture_type || ''}</p>
            <div style="margin-top:8px;display:flex;justify-content:center;gap:6px;flex-wrap:wrap;">
              ${(p.certifications||[]).map(c => `<span style="background:rgba(255,255,255,0.2);padding:3px 10px;border-radius:12px;font-size:10px;">${c}</span>`).join('')}
            </div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;padding:14px;margin-top:-12px;">
          <div style="background:#fff;border-radius:12px;padding:12px 8px;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,0.06);">
            <div style="font-size:18px;font-weight:800;color:#0277BD;">${p.total_area_acres || 0}</div><div style="font-size:9px;color:#757575;">Acres</div>
          </div>
          <div style="background:#fff;border-radius:12px;padding:12px 8px;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,0.06);">
            <div style="font-size:18px;font-weight:800;color:#2E7D32;">${p.annual_production_mt || 0} MT</div><div style="font-size:9px;color:#757575;">Annual Prod.</div>
          </div>
          <div style="background:#fff;border-radius:12px;padding:12px 8px;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,0.06);">
            <div style="font-size:18px;font-weight:800;color:#6A1B9A;">${units.length}</div><div style="font-size:9px;color:#757575;">Units</div>
          </div>
        </div>
        <div style="padding:0 14px 80px;">
          <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;border:1px solid #E8E8E8;">
            <h3 style="margin:0 0 10px;font-size:14px;font-weight:700;color:#01579B;">🐠 Species Cultured</h3>
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
              ${(p.species||[]).map(s => `<span style="background:#E1F5FE;border:1px solid #81D4FA;border-radius:20px;padding:6px 12px;font-size:12px;color:#01579B;">🐠 ${s}</span>`).join('')}
            </div>
          </div>
          ${units.length > 0 ? `
          <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;border:1px solid #E8E8E8;">
            <h3 style="margin:0 0 10px;font-size:14px;font-weight:700;color:#2E7D32;">🏗️ Culture Units</h3>
            ${units.map(u => `<div style="display:flex;justify-content:space-between;padding:8px;background:#F1F8E9;border-radius:8px;margin-bottom:6px;"><span style="font-size:12px;">${u.unit_type || 'Unit'} — ${u.species || ''}</span><span style="font-size:11px;color:#757575;">${u.area_acres || 0} ac</span></div>`).join('')}
          </div>` : ''}
          ${harvests.length > 0 ? `
          <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;border:1px solid #E8E8E8;">
            <h3 style="margin:0 0 10px;font-size:14px;font-weight:700;color:#E65100;">📊 Recent Harvests</h3>
            ${harvests.slice(0,5).map(h => `<div style="display:flex;justify-content:space-between;padding:8px;background:#FFF8E1;border-radius:8px;margin-bottom:6px;"><span style="font-size:12px;">🐟 ${h.species || ''} — ${h.quantity_kg || 0} kg</span><span style="font-size:11px;color:#757575;">${h.harvest_date ? new Date(h.harvest_date).toLocaleDateString() : ''}</span></div>`).join('')}
          </div>` : ''}
        </div>
      </div>`;
  }

  loadData();
}
