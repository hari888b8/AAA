import { api } from '../api.js';
import { navigate, showToast } from '../app-shell.js';

/**
 * Mandi Galaxy — Public directory of mandis / local markets
 */
export function renderMandiGalaxy(container) {
  let mandis = [];
  let stats = { total_mandis: 0, total_daily_arrivals_mt: 0 };
  let searchQ = '';
  let sortBy = 'arrivals';
  let isLoading = true;

  async function loadData() {
    isLoading = true; render();
    try {
      const params = new URLSearchParams();
      if (searchQ) params.set('search', searchQ);
      params.set('sort_by', sortBy); params.set('limit', '100');
      const res = await api(`galaxy/mandi/directory?${params.toString()}`);
      mandis = res.mandis || []; stats = res.stats || stats;
    } catch (err) { showToast('Failed to load mandis', 'error'); }
    isLoading = false; render();
  }

  function render() {
    container.innerHTML = `
      <div style="min-height:100vh;background:#f5f7fa;">
        <div style="background:linear-gradient(135deg,#BF360C,#E64A19,#FF5722);padding:24px 16px 20px;color:#fff;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
            <button onclick="window.navigateBack?.()" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer;">←</button>
            <div>
              <h1 style="margin:0;font-size:20px;font-weight:800;">📍 Mandi Galaxy</h1>
              <p style="margin:2px 0 0;font-size:12px;opacity:0.9;">Discover Markets • Live Prices • Best Routes</p>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;">
            <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px;text-align:center;">
              <div style="font-size:20px;font-weight:800;">${stats.total_mandis}</div><div style="font-size:10px;opacity:0.85;">Mandis</div>
            </div>
            <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px;text-align:center;">
              <div style="font-size:20px;font-weight:800;">${formatNum(stats.total_daily_arrivals_mt)}</div><div style="font-size:10px;opacity:0.85;">MT Daily Arrivals</div>
            </div>
          </div>
        </div>
        <div style="padding:12px 14px 0;">
          <div style="display:flex;align-items:center;background:#fff;border:1px solid #E0E0E0;border-radius:12px;padding:10px 14px;margin-bottom:10px;">
            <span style="margin-right:8px;">🔍</span>
            <input id="mandiSearch" type="search" placeholder="Search mandi, district, commodity…" value="${searchQ}"
              style="border:none;outline:none;flex:1;font-size:13px;background:transparent;">
          </div>
        </div>
        <div style="padding:0 14px 80px;">
          ${isLoading ? '<div style="text-align:center;padding:40px;"><div class="spinner"></div></div>' : ''}
          ${!isLoading && mandis.length === 0 ? '<div style="text-align:center;padding:40px;color:#757575;"><p style="font-size:40px;">📍</p><p>No mandis found</p></div>' : ''}
          ${!isLoading ? mandis.map(m => `
            <div class="galaxy-card" data-id="${m.id}" style="background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;border:1px solid #E8E8E8;cursor:pointer;">
              <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px;">
                <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#FBE9E7,#FFCCBC);display:flex;align-items:center;justify-content:center;font-size:22px;">🏪</div>
                <div style="flex:1;">
                  <div style="font-weight:700;font-size:14px;color:#BF360C;">${m.mandi_name}</div>
                  <div style="font-size:11px;color:#757575;">📍 ${m.district || ''}, ${m.state || ''}</div>
                  ${m.operating_hours ? `<div style="font-size:10px;color:#9E9E9E;">🕐 ${m.operating_hours}</div>` : ''}
                </div>
                <div style="text-align:right;">
                  <div style="font-weight:700;font-size:14px;color:#E65100;">${m.avg_daily_arrivals_mt || 0}</div>
                  <div style="font-size:9px;color:#757575;">MT/day</div>
                </div>
              </div>
              ${(m.commodities_traded||[]).length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:4px;">${m.commodities_traded.slice(0,4).map(c => `<span style="background:#FBE9E7;border:1px solid #FFAB91;border-radius:12px;padding:3px 8px;font-size:11px;color:#BF360C;">${c}</span>`).join('')}</div>` : ''}
            </div>
          `).join('') : ''}
        </div>
      </div>`;
    attachEvents();
  }

  function attachEvents() {
    const s = container.querySelector('#mandiSearch');
    if (s) { let d; s.addEventListener('input', e => { clearTimeout(d); d = setTimeout(() => { searchQ = e.target.value; loadData(); }, 400); }); }
    container.querySelectorAll('.galaxy-card').forEach(c => c.addEventListener('click', () => navigate(`mandiportfolio?id=${c.dataset.id}`)));
  }

  function formatNum(n) { n = parseFloat(n) || 0; if (n >= 1000) return (n/1000).toFixed(1)+'K'; return Math.round(n).toString(); }
  loadData();
}
