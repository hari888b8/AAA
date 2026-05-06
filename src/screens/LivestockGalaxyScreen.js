import { api } from '../api.js';
import { navigate, showToast } from '../app-shell.js';

/**
 * Livestock Galaxy — Public directory of livestock listings
 */
export function renderLivestockGalaxy(container) {
  let listings = [];
  let stats = { total_listings: 0, total_sellers: 0, total_breeds: 0 };
  let searchQ = '';
  let sortBy = 'listings';
  let isLoading = true;

  async function loadData() {
    isLoading = true; render();
    try {
      const params = new URLSearchParams();
      if (searchQ) params.set('search', searchQ);
      params.set('sort_by', sortBy); params.set('limit', '100');
      const res = await api(`galaxy/livestock/directory?${params.toString()}`);
      listings = res.listings || []; stats = res.stats || stats;
    } catch (err) { showToast('Failed to load livestock', 'error'); }
    isLoading = false; render();
  }

  function render() {
    container.innerHTML = `
      <div style="min-height:100vh;background:#f5f7fa;">
        <div style="background:linear-gradient(135deg,#4E342E,#6D4C41,#8D6E63);padding:24px 16px 20px;color:#fff;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
            <button onclick="window.navigateBack?.()" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer;">←</button>
            <div>
              <h1 style="margin:0;font-size:20px;font-weight:800;">🐄 Livestock Galaxy</h1>
              <p style="margin:2px 0 0;font-size:12px;opacity:0.9;">Discover Livestock • Buy Direct from Breeders</p>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:12px;">
            <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px;text-align:center;">
              <div style="font-size:20px;font-weight:800;">${stats.total_listings}</div><div style="font-size:10px;opacity:0.85;">Listings</div>
            </div>
            <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px;text-align:center;">
              <div style="font-size:20px;font-weight:800;">${stats.total_sellers}</div><div style="font-size:10px;opacity:0.85;">Sellers</div>
            </div>
            <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px;text-align:center;">
              <div style="font-size:20px;font-weight:800;">${stats.total_breeds}</div><div style="font-size:10px;opacity:0.85;">Breeds</div>
            </div>
          </div>
        </div>
        <div style="padding:12px 14px 0;">
          <div style="display:flex;align-items:center;background:#fff;border:1px solid #E0E0E0;border-radius:12px;padding:10px 14px;margin-bottom:10px;">
            <span style="margin-right:8px;">🔍</span>
            <input id="lsSearch" type="search" placeholder="Search breed, seller, district…" value="${searchQ}"
              style="border:none;outline:none;flex:1;font-size:13px;background:transparent;">
          </div>
          <div style="display:flex;gap:6px;padding-bottom:8px;">
            <select id="sortFilter" style="padding:6px 10px;border-radius:20px;border:1px solid #E0E0E0;font-size:12px;background:#fff;">
              <option value="listings" ${sortBy==='listings'?'selected':''}>Newest</option>
              <option value="price" ${sortBy==='price'?'selected':''}>Price</option>
              <option value="weight" ${sortBy==='weight'?'selected':''}>Weight</option>
            </select>
          </div>
        </div>
        <div style="padding:0 14px 80px;">
          ${isLoading ? '<div style="text-align:center;padding:40px;"><div class="spinner"></div></div>' : ''}
          ${!isLoading && listings.length === 0 ? '<div style="text-align:center;padding:40px;color:#757575;"><p style="font-size:40px;">🐄</p><p>No livestock found</p></div>' : ''}
          ${!isLoading ? listings.map(l => `
            <div class="galaxy-card" data-id="${l.seller_id}" style="background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;border:1px solid #E8E8E8;cursor:pointer;">
              <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:8px;">
                <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#EFEBE9,#D7CCC8);display:flex;align-items:center;justify-content:center;font-size:22px;">🐄</div>
                <div style="flex:1;">
                  <div style="font-weight:700;font-size:14px;color:#4E342E;">${l.title || l.breed || 'Livestock'}</div>
                  <div style="font-size:11px;color:#757575;">📍 ${l.district || ''}, ${l.state || ''} • ${l.seller_name || ''}</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-weight:800;font-size:16px;color:#2E7D32;">₹${formatPrice(l.price)}</div>
                </div>
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <span style="background:#EFEBE9;border-radius:8px;padding:4px 8px;font-size:11px;">🐾 ${l.breed || 'N/A'}</span>
                ${l.age_months ? `<span style="background:#EFEBE9;border-radius:8px;padding:4px 8px;font-size:11px;">📅 ${l.age_months} months</span>` : ''}
                ${l.weight_kg ? `<span style="background:#EFEBE9;border-radius:8px;padding:4px 8px;font-size:11px;">⚖️ ${l.weight_kg} kg</span>` : ''}
                ${l.health_certificate ? `<span style="background:#E8F5E9;border-radius:8px;padding:4px 8px;font-size:11px;color:#2E7D32;">✅ Health Cert</span>` : ''}
              </div>
            </div>
          `).join('') : ''}
        </div>
      </div>`;
    attachEvents();
  }

  function attachEvents() {
    const s = container.querySelector('#lsSearch');
    if (s) { let d; s.addEventListener('input', e => { clearTimeout(d); d = setTimeout(() => { searchQ = e.target.value; loadData(); }, 400); }); }
    container.querySelector('#sortFilter')?.addEventListener('change', e => { sortBy = e.target.value; loadData(); });
    container.querySelectorAll('.galaxy-card').forEach(c => c.addEventListener('click', () => navigate(`livestockportfolio?id=${c.dataset.id}`)));
  }

  function formatPrice(p) { if (!p) return '—'; if (p >= 100000) return (p/100000).toFixed(1)+'L'; if (p >= 1000) return (p/1000).toFixed(0)+'K'; return p; }
  loadData();
}
