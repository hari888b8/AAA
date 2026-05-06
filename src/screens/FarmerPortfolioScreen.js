import { api } from '../api.js';
import { navigate, showToast } from '../app-shell.js';

/**
 * Farmer Portfolio — Public portfolio page for a single farmer
 */
export function renderFarmerPortfolio(container) {
  let portfolio = null;
  let isLoading = true;

  const params = new URLSearchParams(window._routeParams || '');
  const farmerId = params.get('id');

  async function loadData() {
    if (!farmerId) { isLoading = false; render(); return; }
    isLoading = true; render();
    try { portfolio = await api(`galaxy/farmer/${farmerId}/portfolio`); }
    catch (err) { showToast('Failed to load farmer portfolio', 'error'); }
    isLoading = false; render();
  }

  function render() {
    if (isLoading) { container.innerHTML = `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;"><div class="spinner"></div></div>`; return; }
    if (!portfolio || !portfolio.profile) {
      container.innerHTML = `<div style="min-height:100vh;padding:20px;text-align:center;"><button onclick="window.navigateBack?.()" style="position:absolute;top:16px;left:16px;background:none;border:none;font-size:20px;cursor:pointer;">←</button><div style="padding-top:80px;"><p style="font-size:48px;">👨‍🌾</p><h2>Farmer Not Found</h2></div></div>`;
      return;
    }
    const p = portfolio.profile;
    const crops = p.primary_crops || [];
    const listings = portfolio.active_listings || [];
    const calendar = portfolio.harvest_calendar || [];
    const ts = portfolio.trade_stats || {};

    container.innerHTML = `
      <div style="min-height:100vh;background:#f5f7fa;">
        <div style="background:linear-gradient(135deg,#2E7D32,#388E3C);padding:20px 16px 24px;color:#fff;position:relative;">
          <button onclick="window.navigateBack?.()" style="position:absolute;top:16px;left:12px;background:none;border:none;color:#fff;font-size:20px;cursor:pointer;">←</button>
          <div style="text-align:center;padding-top:8px;">
            <div style="width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,0.2);display:inline-flex;align-items:center;justify-content:center;font-size:32px;margin-bottom:8px;">👨‍🌾</div>
            <h1 style="margin:0;font-size:20px;font-weight:800;">${p.farmer_name}</h1>
            <p style="margin:4px 0 0;font-size:12px;opacity:0.9;">📍 ${p.village || ''} ${p.district_name || ''}, ${p.state_name || p.state || ''}</p>
            <div style="margin-top:8px;display:flex;justify-content:center;gap:8px;flex-wrap:wrap;">
              ${p.organic_certified ? '<span style="background:rgba(255,255,255,0.2);padding:3px 10px;border-radius:12px;font-size:11px;">🌿 Organic</span>' : ''}
              ${p.farming_method ? `<span style="background:rgba(255,255,255,0.2);padding:3px 10px;border-radius:12px;font-size:11px;">🚜 ${p.farming_method}</span>` : ''}
            </div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;padding:14px;margin-top:-12px;">
          <div style="background:#fff;border-radius:12px;padding:12px 8px;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,0.06);">
            <div style="font-size:18px;font-weight:800;color:#E65100;">🌾 ${p.total_land_acres || 0}</div>
            <div style="font-size:9px;color:#757575;">Acres</div>
          </div>
          <div style="background:#fff;border-radius:12px;padding:12px 8px;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,0.06);">
            <div style="font-size:18px;font-weight:800;color:#1565C0;">📋 ${listings.length}</div>
            <div style="font-size:9px;color:#757575;">Active Listings</div>
          </div>
          <div style="background:#fff;border-radius:12px;padding:12px 8px;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,0.06);">
            <div style="font-size:18px;font-weight:800;color:#2E7D32;">✅ ${ts.successful_trades || 0}</div>
            <div style="font-size:9px;color:#757575;">Trades Done</div>
          </div>
        </div>
        <div style="padding:0 14px 80px;">
          <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;border:1px solid #E8E8E8;">
            <h3 style="margin:0 0 10px;font-size:14px;font-weight:700;color:#2E7D32;">🌱 Crops Grown</h3>
            ${crops.length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:6px;">${crops.map(c => `<span style="background:#F1F8E9;border:1px solid #C5E1A5;border-radius:20px;padding:6px 12px;font-size:12px;color:#33691E;">🌱 ${c}</span>`).join('')}</div>` : '<p style="color:#9E9E9E;font-size:13px;">No crops listed</p>'}
          </div>
          ${calendar.length > 0 ? `
          <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;border:1px solid #E8E8E8;">
            <h3 style="margin:0 0 10px;font-size:14px;font-weight:700;color:#E65100;">📅 Harvest Calendar</h3>
            ${calendar.map(h => `<div style="display:flex;justify-content:space-between;padding:8px;background:#FFF8E1;border-radius:8px;margin-bottom:6px;"><span style="font-size:12px;">${h.icon_emoji || '🌾'} ${h.crop_name}</span><span style="font-size:11px;color:#757575;">${h.expected_harvest_date ? new Date(h.expected_harvest_date).toLocaleDateString() : ''}</span></div>`).join('')}
          </div>` : ''}
          ${listings.length > 0 ? `
          <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;border:1px solid #E8E8E8;">
            <h3 style="margin:0 0 10px;font-size:14px;font-weight:700;color:#1565C0;">🏪 Active Listings</h3>
            ${listings.map(l => `<div style="display:flex;justify-content:space-between;padding:8px;background:#E3F2FD;border-radius:8px;margin-bottom:6px;"><span style="font-size:12px;">🌾 ${l.crop_name || 'Produce'}</span><span style="font-size:11px;font-weight:600;color:#1565C0;">₹${l.price_per_kg || '—'}/kg</span></div>`).join('')}
          </div>` : ''}
          <div style="background:#fff;border-radius:14px;padding:16px;border:1px solid #E8E8E8;">
            <h3 style="margin:0 0 10px;font-size:14px;font-weight:700;color:#424242;">🏡 Farm Details</h3>
            <p style="margin:4px 0;font-size:13px;">💧 Irrigation: ${(p.irrigation_type || []).join(', ') || 'Not specified'}</p>
            <p style="margin:4px 0;font-size:13px;">🌍 Soil: ${(p.soil_type || []).join(', ') || 'Not specified'}</p>
            <p style="margin:4px 0;font-size:13px;">📍 Mandal: ${p.mandal || 'N/A'}</p>
          </div>
        </div>
      </div>`;
  }

  loadData();
}
