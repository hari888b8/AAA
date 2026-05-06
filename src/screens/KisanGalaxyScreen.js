import { api } from '../api.js';
import { navigate, showToast } from '../app-shell.js';

/**
 * Kisan Galaxy — Discover vehicles, equipment, services for hire
 */
export function renderKisanGalaxy(container) {
  let vehicles = [];
  let stats = { total_vehicles: 0, available_now: 0, total_trips_completed: 0 };
  let searchQ = '';
  let sortBy = 'rating';
  let isLoading = true;

  async function loadData() {
    isLoading = true; render();
    try {
      const params = new URLSearchParams();
      if (searchQ) params.set('search', searchQ);
      params.set('sort_by', sortBy); params.set('limit', '100');
      const res = await api(`galaxy/kisan/directory?${params.toString()}`);
      vehicles = res.vehicles || []; stats = res.stats || stats;
    } catch (err) { showToast('Failed to load vehicles', 'error'); }
    isLoading = false; render();
  }

  function render() {
    container.innerHTML = `
      <div style="min-height:100vh;background:#f5f7fa;">
        <div style="background:linear-gradient(135deg,#F57F17,#F9A825,#FBC02D);padding:24px 16px 20px;color:#fff;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
            <button onclick="window.navigateBack?.()" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer;">←</button>
            <div>
              <h1 style="margin:0;font-size:20px;font-weight:800;">🚜 Kisan Galaxy</h1>
              <p style="margin:2px 0 0;font-size:12px;opacity:0.9;">Rent Tractors, Harvesters & Equipment</p>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:12px;">
            <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px;text-align:center;">
              <div style="font-size:20px;font-weight:800;">${stats.total_vehicles}</div><div style="font-size:10px;opacity:0.85;">Vehicles</div>
            </div>
            <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px;text-align:center;">
              <div style="font-size:20px;font-weight:800;">${stats.available_now}</div><div style="font-size:10px;opacity:0.85;">Available</div>
            </div>
            <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px;text-align:center;">
              <div style="font-size:20px;font-weight:800;">${formatNum(stats.total_trips_completed)}</div><div style="font-size:10px;opacity:0.85;">Trips Done</div>
            </div>
          </div>
        </div>
        <div style="padding:12px 14px 0;">
          <div style="display:flex;align-items:center;background:#fff;border:1px solid #E0E0E0;border-radius:12px;padding:10px 14px;margin-bottom:10px;">
            <span style="margin-right:8px;">🔍</span>
            <input id="kisanSearch" type="search" placeholder="Search vehicle, owner, district…" value="${searchQ}"
              style="border:none;outline:none;flex:1;font-size:13px;background:transparent;">
          </div>
          <div style="display:flex;gap:6px;padding-bottom:8px;">
            <select id="sortFilter" style="padding:6px 10px;border-radius:20px;border:1px solid #E0E0E0;font-size:12px;background:#fff;">
              <option value="rating" ${sortBy==='rating'?'selected':''}>Top Rated</option>
              <option value="trips" ${sortBy==='trips'?'selected':''}>Most Trips</option>
              <option value="rate" ${sortBy==='rate'?'selected':''}>Lowest Rate</option>
              <option value="capacity" ${sortBy==='capacity'?'selected':''}>Highest Capacity</option>
            </select>
          </div>
        </div>
        <div style="padding:0 14px 80px;">
          ${isLoading ? '<div style="text-align:center;padding:40px;"><div class="spinner"></div></div>' : ''}
          ${!isLoading && vehicles.length === 0 ? '<div style="text-align:center;padding:40px;color:#757575;"><p style="font-size:40px;">🚜</p><p>No vehicles found</p></div>' : ''}
          ${!isLoading ? vehicles.map(v => `
            <div class="galaxy-card" data-id="${v.id}" style="background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;border:1px solid #E8E8E8;cursor:pointer;">
              <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px;">
                <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#FFF8E1,#FFECB3);display:flex;align-items:center;justify-content:center;font-size:22px;">${v.vehicle_type === 'Tractor' ? '🚜' : v.vehicle_type === 'Harvester' ? '🌾' : v.vehicle_type === 'Sprayer' ? '💨' : '🚛'}</div>
                <div style="flex:1;">
                  <div style="font-weight:700;font-size:14px;color:#F57F17;">${v.model_name || v.vehicle_type}</div>
                  <div style="font-size:11px;color:#757575;">👤 ${v.owner_name || ''} • 📍 ${v.district || ''}, ${v.state || ''}</div>
                </div>
                <div style="text-align:right;">
                  ${v.rating ? `<div style="font-weight:700;color:#F57F17;">⭐ ${v.rating}</div>` : ''}
                  <div style="font-size:10px;color:#757575;">${v.total_trips || 0} trips</div>
                </div>
              </div>
              <div style="display:flex;gap:6px;flex-wrap:wrap;">
                <span style="background:#FFF8E1;border:1px solid #FFE082;border-radius:8px;padding:4px 8px;font-size:11px;color:#F57F17;">${v.vehicle_type}</span>
                ${v.capacity_tons ? `<span style="background:#F5F5F5;border-radius:8px;padding:4px 8px;font-size:11px;">⚖️ ${v.capacity_tons}T</span>` : ''}
                ${v.rate_per_km ? `<span style="background:#F5F5F5;border-radius:8px;padding:4px 8px;font-size:11px;">₹${v.rate_per_km}/km</span>` : ''}
                ${v.rate_per_hour ? `<span style="background:#F5F5F5;border-radius:8px;padding:4px 8px;font-size:11px;">₹${v.rate_per_hour}/hr</span>` : ''}
                ${v.is_available ? `<span style="background:#E8F5E9;border-radius:8px;padding:4px 8px;font-size:11px;color:#2E7D32;">🟢 Available</span>` : `<span style="background:#FFEBEE;border-radius:8px;padding:4px 8px;font-size:11px;color:#C62828;">🔴 Booked</span>`}
              </div>
            </div>
          `).join('') : ''}
        </div>
      </div>`;
    attachEvents();
  }

  function attachEvents() {
    const s = container.querySelector('#kisanSearch');
    if (s) { let d; s.addEventListener('input', e => { clearTimeout(d); d = setTimeout(() => { searchQ = e.target.value; loadData(); }, 400); }); }
    container.querySelector('#sortFilter')?.addEventListener('change', e => { sortBy = e.target.value; loadData(); });
    container.querySelectorAll('.galaxy-card').forEach(c => c.addEventListener('click', () => navigate(`kisanportfolio?id=${c.dataset.id}`)));
  }

  function formatNum(n) { n = parseFloat(n) || 0; if (n >= 1000) return (n/1000).toFixed(1)+'K'; return Math.round(n).toString(); }
  loadData();
}
