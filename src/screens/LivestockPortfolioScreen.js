import { api } from '../api.js';
import { navigate, showToast } from '../app-shell.js';

/**
 * Livestock Portfolio — Seller detail page
 */
export function renderLivestockPortfolio(container) {
  let portfolio = null;
  let isLoading = true;
  const params = new URLSearchParams(window._routeParams || '');
  const sellerId = params.get('id');

  async function loadData() {
    if (!sellerId) { isLoading = false; render(); return; }
    isLoading = true; render();
    try { portfolio = await api(`galaxy/livestock/${sellerId}/portfolio`); }
    catch (err) { showToast('Failed to load seller', 'error'); }
    isLoading = false; render();
  }

  function render() {
    if (isLoading) { container.innerHTML = `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;"><div class="spinner"></div></div>`; return; }
    if (!portfolio || !portfolio.seller) {
      container.innerHTML = `<div style="min-height:100vh;padding:20px;text-align:center;"><button onclick="window.navigateBack?.()" style="position:absolute;top:16px;left:16px;background:none;border:none;font-size:20px;cursor:pointer;">←</button><div style="padding-top:80px;"><p style="font-size:48px;">🐄</p><h2>Seller Not Found</h2></div></div>`;
      return;
    }
    const s = portfolio.seller;
    const listings = portfolio.listings || [];
    const st = portfolio.stats || {};

    container.innerHTML = `
      <div style="min-height:100vh;background:#f5f7fa;">
        <div style="background:linear-gradient(135deg,#4E342E,#6D4C41);padding:20px 16px 24px;color:#fff;position:relative;">
          <button onclick="window.navigateBack?.()" style="position:absolute;top:16px;left:12px;background:none;border:none;color:#fff;font-size:20px;cursor:pointer;">←</button>
          <div style="text-align:center;padding-top:8px;">
            <div style="width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,0.2);display:inline-flex;align-items:center;justify-content:center;font-size:32px;margin-bottom:8px;">🐄</div>
            <h1 style="margin:0;font-size:20px;font-weight:800;">${s.name || 'Seller'}</h1>
            <div style="margin-top:8px;display:flex;justify-content:center;gap:12px;">
              <span style="font-size:12px;">📋 ${st.total_listed || listings.length} Listed</span>
              <span style="font-size:12px;">🐾 ${st.breeds_available || 0} Breeds</span>
            </div>
          </div>
        </div>
        <div style="padding:14px;">
          ${listings.map(l => `
            <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;border:1px solid #E8E8E8;">
              <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                <div style="font-weight:700;font-size:14px;color:#4E342E;">${l.title || l.breed}</div>
                <div style="font-weight:800;color:#2E7D32;">₹${l.price || '—'}</div>
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <span style="background:#EFEBE9;border-radius:8px;padding:4px 8px;font-size:11px;">🐾 ${l.breed || 'N/A'}</span>
                ${l.age_months ? `<span style="background:#EFEBE9;border-radius:8px;padding:4px 8px;font-size:11px;">📅 ${l.age_months}m</span>` : ''}
                ${l.weight_kg ? `<span style="background:#EFEBE9;border-radius:8px;padding:4px 8px;font-size:11px;">⚖️ ${l.weight_kg}kg</span>` : ''}
                ${l.vaccination_status ? `<span style="background:#E8F5E9;border-radius:8px;padding:4px 8px;font-size:11px;color:#2E7D32;">💉 ${l.vaccination_status}</span>` : ''}
              </div>
            </div>
          `).join('') || '<div style="text-align:center;padding:40px;color:#757575;">No active listings</div>'}
        </div>
      </div>`;
  }

  loadData();
}
