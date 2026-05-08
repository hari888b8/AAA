import { api } from '../api.js';
import { navigate, showToast } from '../app-shell.js';

/**
 * Mandi Portfolio — Individual mandi detail with prices
 */
export function renderMandiPortfolio(container) {
  let portfolio = null;
  let isLoading = true;
  const params = new URLSearchParams(window._routeParams || '');
  const mandiId = params.get('id');

  async function loadData() {
    if (!mandiId) { isLoading = false; render(); return; }
    isLoading = true; render();
    try { portfolio = await api(`galaxy/mandi/${mandiId}/portfolio`); }
    catch (err) { showToast('Failed to load mandi', 'error'); }
    isLoading = false; render();
  }

  function render() {
    if (isLoading) { container.innerHTML = `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;"><div class="spinner"></div></div>`; return; }
    if (!portfolio || !portfolio.profile) {
      container.innerHTML = `<div style="min-height:100vh;padding:20px;text-align:center;"><button onclick="window.navigateBack?.()" style="position:absolute;top:16px;left:16px;background:none;border:none;font-size:20px;cursor:pointer;">←</button><div style="padding-top:80px;"><p style="font-size:48px;">📍</p><h2>Mandi Not Found</h2></div></div>`;
      return;
    }
    const p = portfolio.profile;
    const prices = portfolio.recent_prices || [];
    const topCommodities = portfolio.top_commodities || [];

    container.innerHTML = `
      <div style="min-height:100vh;background:#f5f7fa;">
        <div style="background:linear-gradient(135deg,#BF360C,#E64A19);padding:20px 16px 24px;color:#fff;position:relative;">
          <button onclick="window.navigateBack?.()" style="position:absolute;top:16px;left:12px;background:none;border:none;color:#fff;font-size:20px;cursor:pointer;">←</button>
          <div style="text-align:center;padding-top:8px;">
            <div style="width:64px;height:64px;border-radius:16px;background:rgba(255,255,255,0.2);display:inline-flex;align-items:center;justify-content:center;font-size:32px;margin-bottom:8px;">🏪</div>
            <h1 style="margin:0;font-size:20px;font-weight:800;">${p.mandi_name}</h1>
            <p style="margin:4px 0 0;font-size:12px;opacity:0.9;">📍 ${p.district || ''}, ${p.state || ''}</p>
            <div style="margin-top:6px;display:flex;justify-content:center;gap:8px;">
              ${p.operating_hours ? `<span style="background:rgba(255,255,255,0.2);padding:3px 10px;border-radius:12px;font-size:11px;">🕐 ${p.operating_hours}</span>` : ''}
              <span style="background:rgba(255,255,255,0.2);padding:3px 10px;border-radius:12px;font-size:11px;">📦 ${p.avg_daily_arrivals_mt || 0} MT/day</span>
            </div>
          </div>
        </div>
        <div style="padding:14px;">
          ${topCommodities.length > 0 ? `
          <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;border:1px solid #E8E8E8;">
            <h3 style="margin:0 0 10px;font-size:14px;font-weight:700;color:#BF360C;">📊 Top Commodities (30 days)</h3>
            ${topCommodities.map(c => `
              <div style="display:flex;justify-content:space-between;padding:8px;background:#FBE9E7;border-radius:8px;margin-bottom:6px;">
                <span style="font-size:12px;font-weight:600;">${c.commodity}</span>
                <span style="font-size:12px;color:#E65100;">Avg ₹${Math.round(c.avg_price || 0)}/qtl • ${c.days_traded} days</span>
              </div>
            `).join('')}
          </div>` : ''}
          ${prices.length > 0 ? `
          <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;border:1px solid #E8E8E8;">
            <h3 style="margin:0 0 10px;font-size:14px;font-weight:700;color:#2E7D32;">💰 Recent Prices</h3>
            <div style="overflow-x:auto;">
              <table style="width:100%;border-collapse:collapse;font-size:11px;">
                <thead><tr style="background:#F5F5F5;"><th style="padding:6px;text-align:left;">Commodity</th><th style="padding:6px;">Min</th><th style="padding:6px;">Max</th><th style="padding:6px;">Modal</th><th style="padding:6px;">Date</th></tr></thead>
                <tbody>
                  ${prices.slice(0, 20).map(pr => `<tr style="border-bottom:1px solid #F5F5F5;"><td style="padding:6px;">${pr.commodity}</td><td style="padding:6px;text-align:center;">₹${pr.min_price||'—'}</td><td style="padding:6px;text-align:center;">₹${pr.max_price||'—'}</td><td style="padding:6px;text-align:center;font-weight:600;color:#2E7D32;">₹${pr.modal_price||'—'}</td><td style="padding:6px;text-align:center;">${pr.price_date ? new Date(pr.price_date).toLocaleDateString() : ''}</td></tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>` : ''}
          <div style="background:#fff;border-radius:14px;padding:16px;border:1px solid #E8E8E8;">
            <h3 style="margin:0 0 10px;font-size:14px;font-weight:700;color:#424242;">ℹ️ Mandi Info</h3>
            ${p.address ? `<p style="margin:4px 0;font-size:13px;">🏠 ${p.address}</p>` : ''}
            ${p.contact_number ? `<p style="margin:4px 0;font-size:13px;">📞 ${p.contact_number}</p>` : ''}
            ${p.infrastructure ? `<p style="margin:4px 0;font-size:13px;">🏗️ ${p.infrastructure}</p>` : ''}
            <p style="margin:4px 0;font-size:13px;">🌾 Commodities: ${(p.commodities_traded||[]).join(', ')}</p>
          </div>
        </div>
      </div>`;
  }

  loadData();
}
