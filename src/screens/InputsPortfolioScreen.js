import { api } from '../api.js';
import { navigate, showToast } from '../app-shell.js';

/**
 * Inputs Portfolio — Supplier detail page
 */
export function renderInputsPortfolio(container) {
  let portfolio = null;
  let isLoading = true;
  const params = new URLSearchParams(window._routeParams || '');
  const supplierId = params.get('id');

  async function loadData() {
    if (!supplierId) { isLoading = false; render(); return; }
    isLoading = true; render();
    try { portfolio = await api(`galaxy/inputs/${supplierId}/portfolio`); }
    catch (err) { showToast('Failed to load supplier', 'error'); }
    isLoading = false; render();
  }

  function render() {
    if (isLoading) { container.innerHTML = `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;"><div class="spinner"></div></div>`; return; }
    if (!portfolio || !portfolio.profile) {
      container.innerHTML = `<div style="min-height:100vh;padding:20px;text-align:center;"><button onclick="window.navigateBack?.()" style="position:absolute;top:16px;left:16px;background:none;border:none;font-size:20px;cursor:pointer;">←</button><div style="padding-top:80px;"><p style="font-size:48px;">🏪</p><h2>Supplier Not Found</h2></div></div>`;
      return;
    }
    const p = portfolio.profile;
    const products = portfolio.products || [];
    const reviews = portfolio.reviews || [];

    container.innerHTML = `
      <div style="min-height:100vh;background:#f5f7fa;">
        <div style="background:linear-gradient(135deg,#E65100,#F57C00);padding:20px 16px 24px;color:#fff;position:relative;">
          <button onclick="window.navigateBack?.()" style="position:absolute;top:16px;left:12px;background:none;border:none;color:#fff;font-size:20px;cursor:pointer;">←</button>
          <div style="text-align:center;padding-top:8px;">
            <div style="width:64px;height:64px;border-radius:16px;background:rgba(255,255,255,0.2);display:inline-flex;align-items:center;justify-content:center;font-size:32px;margin-bottom:8px;">🏪</div>
            <h1 style="margin:0;font-size:20px;font-weight:800;">${p.business_name}</h1>
            <p style="margin:4px 0 0;font-size:12px;opacity:0.9;">📍 ${p.district || ''}, ${p.state || ''}</p>
            ${p.rating ? `<div style="margin-top:6px;"><span style="background:rgba(255,255,255,0.2);padding:3px 10px;border-radius:12px;font-size:11px;">⭐ ${p.rating} Rating</span></div>` : ''}
          </div>
        </div>
        <div style="padding:14px;">
          <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;border:1px solid #E8E8E8;">
            <h3 style="margin:0 0 10px;font-size:14px;font-weight:700;color:#E65100;">📦 Products (${products.length})</h3>
            ${products.length > 0 ? products.map(pr => `
              <div style="display:flex;justify-content:space-between;padding:8px;background:#FFF3E0;border-radius:8px;margin-bottom:6px;">
                <span style="font-size:12px;">${pr.name} <span style="color:#9E9E9E;font-size:10px;">(${pr.category || ''})</span></span>
                <span style="font-size:12px;font-weight:600;color:#E65100;">₹${pr.price || '—'}/${pr.unit || 'kg'}</span>
              </div>
            `).join('') : '<p style="color:#9E9E9E;font-size:13px;">No products listed</p>'}
          </div>
          ${reviews.length > 0 ? `
          <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;border:1px solid #E8E8E8;">
            <h3 style="margin:0 0 10px;font-size:14px;font-weight:700;color:#1565C0;">💬 Reviews</h3>
            ${reviews.slice(0,5).map(r => `
              <div style="padding:8px;background:#F5F5F5;border-radius:8px;margin-bottom:6px;">
                <div style="font-size:12px;font-weight:600;">${r.reviewer_name || 'User'} ${'⭐'.repeat(r.rating||0)}</div>
                <div style="font-size:11px;color:#757575;margin-top:2px;">${r.comment || ''}</div>
              </div>
            `).join('')}
          </div>` : ''}
          <div style="background:#fff;border-radius:14px;padding:16px;border:1px solid #E8E8E8;">
            <h3 style="margin:0 0 10px;font-size:14px;font-weight:700;color:#424242;">📋 Details</h3>
            <p style="margin:4px 0;font-size:13px;">👤 Owner: ${p.owner_name || 'N/A'}</p>
            <p style="margin:4px 0;font-size:13px;">🚚 Delivery: ${p.delivery_radius_km || 0} km radius</p>
            ${p.gst_number ? `<p style="margin:4px 0;font-size:13px;">📄 GST: ${p.gst_number}</p>` : ''}
            <p style="margin:4px 0;font-size:13px;">🏷️ Brands: ${(p.brands||[]).join(', ') || 'N/A'}</p>
          </div>
        </div>
      </div>`;
  }

  loadData();
}
