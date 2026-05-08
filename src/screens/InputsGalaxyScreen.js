import { api } from '../api.js';
import { navigate, showToast } from '../app-shell.js';

/**
 * Inputs Galaxy — Public directory of agri input suppliers
 */
export function renderInputsGalaxy(container) {
  let suppliers = [];
  let stats = { total_suppliers: 0, total_products: 0 };
  let searchQ = '';
  let sortBy = 'products';
  let isLoading = true;

  async function loadData() {
    isLoading = true; render();
    try {
      const params = new URLSearchParams();
      if (searchQ) params.set('search', searchQ);
      params.set('sort_by', sortBy); params.set('limit', '100');
      const res = await api(`galaxy/inputs/directory?${params.toString()}`);
      suppliers = res.suppliers || []; stats = res.stats || stats;
    } catch (err) { showToast('Failed to load suppliers', 'error'); }
    isLoading = false; render();
  }

  function render() {
    container.innerHTML = `
      <div style="min-height:100vh;background:#f5f7fa;">
        <div style="background:linear-gradient(135deg,#E65100,#F57C00,#FF9800);padding:24px 16px 20px;color:#fff;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
            <button onclick="window.navigateBack?.()" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer;">←</button>
            <div>
              <h1 style="margin:0;font-size:20px;font-weight:800;">🌱 Inputs Galaxy</h1>
              <p style="margin:2px 0 0;font-size:12px;opacity:0.9;">Discover Seeds, Fertilizers & Pesticide Suppliers</p>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;">
            <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px;text-align:center;">
              <div style="font-size:20px;font-weight:800;">${stats.total_suppliers}</div><div style="font-size:10px;opacity:0.85;">Suppliers</div>
            </div>
            <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px;text-align:center;">
              <div style="font-size:20px;font-weight:800;">${stats.total_products}</div><div style="font-size:10px;opacity:0.85;">Products</div>
            </div>
          </div>
        </div>
        <div style="padding:12px 14px 0;">
          <div style="display:flex;align-items:center;background:#fff;border:1px solid #E0E0E0;border-radius:12px;padding:10px 14px;margin-bottom:10px;">
            <span style="margin-right:8px;">🔍</span>
            <input id="inputSearch" type="search" placeholder="Search suppliers, brands, categories…" value="${searchQ}"
              style="border:none;outline:none;flex:1;font-size:13px;background:transparent;">
          </div>
          <div style="display:flex;gap:6px;padding-bottom:8px;">
            <select id="sortFilter" style="padding:6px 10px;border-radius:20px;border:1px solid #E0E0E0;font-size:12px;background:#fff;">
              <option value="products" ${sortBy==='products'?'selected':''}>Most Products</option>
              <option value="rating" ${sortBy==='rating'?'selected':''}>Top Rated</option>
              <option value="name" ${sortBy==='name'?'selected':''}>Name A-Z</option>
            </select>
          </div>
        </div>
        <div style="padding:0 14px 80px;">
          ${isLoading ? '<div style="text-align:center;padding:40px;"><div class="spinner"></div></div>' : ''}
          ${!isLoading && suppliers.length === 0 ? '<div style="text-align:center;padding:40px;color:#757575;"><p style="font-size:40px;">🌱</p><p>No suppliers found</p></div>' : ''}
          ${!isLoading ? suppliers.map(s => `
            <div class="galaxy-card" data-id="${s.id}" style="background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;border:1px solid #E8E8E8;cursor:pointer;">
              <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px;">
                <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#FFF3E0,#FFE0B2);display:flex;align-items:center;justify-content:center;font-size:22px;">🏪</div>
                <div style="flex:1;">
                  <div style="font-weight:700;font-size:14px;color:#E65100;">${s.business_name}</div>
                  <div style="font-size:11px;color:#757575;">📍 ${s.district || ''}, ${s.state || ''}</div>
                </div>
                ${s.rating ? `<span style="background:#FFF8E1;color:#F57F17;font-size:11px;padding:3px 8px;border-radius:10px;font-weight:600;">⭐ ${s.rating}</span>` : ''}
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px;">
                <div style="text-align:center;background:#F5F5F5;border-radius:8px;padding:6px;"><div style="font-weight:700;font-size:13px;color:#E65100;">${s.product_count || 0}</div><div style="font-size:9px;">Products</div></div>
                <div style="text-align:center;background:#F5F5F5;border-radius:8px;padding:6px;"><div style="font-weight:700;font-size:13px;color:#2E7D32;">${s.total_orders || 0}</div><div style="font-size:9px;">Orders</div></div>
                <div style="text-align:center;background:#F5F5F5;border-radius:8px;padding:6px;"><div style="font-weight:700;font-size:13px;color:#1565C0;">${s.delivery_radius_km || 0}km</div><div style="font-size:9px;">Delivery</div></div>
              </div>
              ${(s.categories||[]).length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:4px;">${s.categories.slice(0,3).map(c => `<span style="background:#FFF3E0;border:1px solid #FFE082;border-radius:12px;padding:3px 8px;font-size:11px;color:#E65100;">${c}</span>`).join('')}</div>` : ''}
            </div>
          `).join('') : ''}
        </div>
      </div>`;
    attachEvents();
  }

  function attachEvents() {
    const s = container.querySelector('#inputSearch');
    if (s) { let d; s.addEventListener('input', e => { clearTimeout(d); d = setTimeout(() => { searchQ = e.target.value; loadData(); }, 400); }); }
    container.querySelector('#sortFilter')?.addEventListener('change', e => { sortBy = e.target.value; loadData(); });
    container.querySelectorAll('.galaxy-card').forEach(c => c.addEventListener('click', () => navigate(`inputsportfolio?id=${c.dataset.id}`)));
  }

  loadData();
}
