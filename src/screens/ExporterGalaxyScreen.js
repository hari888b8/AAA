import { api } from '../api.js';
import { navigate, showToast } from '../app-shell.js';

/**
 * Exporter Galaxy — Discover exporters and export opportunities
 */
export function renderExporterGalaxy(container) {
  let exporters = [];
  let stats = { total_exporters: 0, total_volume_mt: 0, total_countries: 0 };
  let searchQ = '';
  let sortBy = 'volume';
  let isLoading = true;

  async function loadData() {
    isLoading = true; render();
    try {
      const params = new URLSearchParams();
      if (searchQ) params.set('search', searchQ);
      params.set('sort_by', sortBy); params.set('limit', '100');
      const res = await api(`galaxy/exporter/directory?${params.toString()}`);
      exporters = res.exporters || []; stats = res.stats || stats;
    } catch (err) { showToast('Failed to load exporters', 'error'); }
    isLoading = false; render();
  }

  function render() {
    container.innerHTML = `
      <div style="min-height:100vh;background:#f5f7fa;">
        <div style="background:linear-gradient(135deg,#004D40,#00695C,#00897B);padding:24px 16px 20px;color:#fff;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
            <button onclick="window.navigateBack?.()" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer;">←</button>
            <div>
              <h1 style="margin:0;font-size:20px;font-weight:800;">🌍 Exporter Galaxy</h1>
              <p style="margin:2px 0 0;font-size:12px;opacity:0.9;">Connect with Verified Agri Exporters</p>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:12px;">
            <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px;text-align:center;">
              <div style="font-size:20px;font-weight:800;">${stats.total_exporters}</div><div style="font-size:10px;opacity:0.85;">Exporters</div>
            </div>
            <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px;text-align:center;">
              <div style="font-size:20px;font-weight:800;">${formatNum(stats.total_volume_mt)}</div><div style="font-size:10px;opacity:0.85;">MT/Year</div>
            </div>
            <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px;text-align:center;">
              <div style="font-size:20px;font-weight:800;">${stats.total_countries}</div><div style="font-size:10px;opacity:0.85;">Countries</div>
            </div>
          </div>
        </div>
        <div style="padding:12px 14px 0;">
          <div style="display:flex;align-items:center;background:#fff;border:1px solid #E0E0E0;border-radius:12px;padding:10px 14px;margin-bottom:10px;">
            <span style="margin-right:8px;">🔍</span>
            <input id="exportSearch" type="search" placeholder="Search commodity, company, country…" value="${searchQ}"
              style="border:none;outline:none;flex:1;font-size:13px;background:transparent;">
          </div>
          <div style="display:flex;gap:6px;padding-bottom:8px;">
            <select id="sortFilter" style="padding:6px 10px;border-radius:20px;border:1px solid #E0E0E0;font-size:12px;background:#fff;">
              <option value="volume" ${sortBy==='volume'?'selected':''}>Highest Volume</option>
              <option value="rating" ${sortBy==='rating'?'selected':''}>Top Rated</option>
              <option value="name" ${sortBy==='name'?'selected':''}>Name A-Z</option>
            </select>
          </div>
        </div>
        <div style="padding:0 14px 80px;">
          ${isLoading ? '<div style="text-align:center;padding:40px;"><div class="spinner"></div></div>' : ''}
          ${!isLoading && exporters.length === 0 ? '<div style="text-align:center;padding:40px;color:#757575;"><p style="font-size:40px;">🌍</p><p>No exporters found</p></div>' : ''}
          ${!isLoading ? exporters.map(e => `
            <div class="galaxy-card" data-id="${e.id}" style="background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;border:1px solid #E8E8E8;cursor:pointer;">
              <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px;">
                <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#E0F2F1,#B2DFDB);display:flex;align-items:center;justify-content:center;font-size:22px;">🌍</div>
                <div style="flex:1;">
                  <div style="font-weight:700;font-size:14px;color:#004D40;">${e.company_name}</div>
                  <div style="font-size:11px;color:#757575;">📍 ${e.district || ''}, ${e.state || ''} ${e.established_year ? '• Est. '+e.established_year : ''}</div>
                </div>
                ${e.apeda_registered ? '<span style="background:#E0F2F1;color:#00695C;font-size:10px;padding:3px 8px;border-radius:10px;font-weight:600;">APEDA ✓</span>' : ''}
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;">
                <div style="text-align:center;background:#F5F5F5;border-radius:8px;padding:6px;"><div style="font-weight:700;font-size:13px;color:#004D40;">${e.annual_export_volume_mt || 0} MT</div><div style="font-size:9px;">Annual Vol.</div></div>
                <div style="text-align:center;background:#F5F5F5;border-radius:8px;padding:6px;"><div style="font-weight:700;font-size:13px;color:#E65100;">🌐 ${(e.export_countries||[]).length}</div><div style="font-size:9px;">Countries</div></div>
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:4px;">
                ${(e.commodities||[]).slice(0,3).map(c => `<span style="background:#E0F2F1;border:1px solid #80CBC4;border-radius:12px;padding:3px 8px;font-size:11px;color:#004D40;">${c}</span>`).join('')}
                ${(e.export_countries||[]).slice(0,2).map(c => `<span style="background:#FFF3E0;border:1px solid #FFE082;border-radius:12px;padding:3px 8px;font-size:11px;color:#E65100;">🌐 ${c}</span>`).join('')}
              </div>
            </div>
          `).join('') : ''}
        </div>
      </div>`;
    attachEvents();
  }

  function attachEvents() {
    const s = container.querySelector('#exportSearch');
    if (s) { let d; s.addEventListener('input', e => { clearTimeout(d); d = setTimeout(() => { searchQ = e.target.value; loadData(); }, 400); }); }
    container.querySelector('#sortFilter')?.addEventListener('change', e => { sortBy = e.target.value; loadData(); });
    container.querySelectorAll('.galaxy-card').forEach(c => c.addEventListener('click', () => navigate(`exporterportfolio?id=${c.dataset.id}`)));
  }

  function formatNum(n) { n = parseFloat(n) || 0; if (n >= 1000) return (n/1000).toFixed(1)+'K'; return Math.round(n).toString(); }
  loadData();
}
