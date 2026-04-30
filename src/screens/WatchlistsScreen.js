import { api } from '../api.js';
import { navigate } from '../main.js';

export function renderWatchlists(container) {
  container.innerHTML = `
    <div style="padding:16px;max-width:600px;margin:0 auto">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:24px">👁️</span>
          <h2 style="margin:0;font-size:18px;font-weight:800;color:#212121">Watchlists & Alerts</h2>
        </div>
        <button id="newWatchBtn" style="background:#1a237e;color:white;border:none;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">+ Add</button>
      </div>
      <div id="alertsBanner"></div>
      <div id="watchForm" style="display:none;margin-bottom:16px"></div>
      <div id="watchList"></div>
      <div id="watchLoading" style="text-align:center;padding:40px;color:#999">Loading...</div>
    </div>`;

  container.querySelector('#newWatchBtn').addEventListener('click', () => showWatchForm(container));
  loadWatchlists(container);
  loadAlerts(container);
}

async function loadAlerts(container) {
  try {
    const res = await api.getWatchlistAlerts();
    const alerts = res.alerts || [];
    if (alerts.length === 0) return;

    container.querySelector('#alertsBanner').innerHTML = `
      <div style="background:#FFF3E0;border-radius:10px;padding:12px;margin-bottom:14px;border:1px solid #FFE0B2">
        <div style="font-size:12px;font-weight:700;color:#E65100;margin-bottom:6px">🔔 Recent Alerts (${alerts.length})</div>
        ${alerts.slice(0, 3).map(a => `
          <div style="font-size:11px;color:#BF360C;margin-bottom:3px">• ${a.crop_name || a.watch_type}: Triggered ${new Date(a.last_triggered).toLocaleString('en-IN')}</div>
        `).join('')}
      </div>`;
  } catch (e) { /* ignore */ }
}

function showWatchForm(container) {
  const formEl = container.querySelector('#watchForm');
  formEl.style.display = 'block';
  formEl.innerHTML = `
    <div style="background:white;border-radius:14px;padding:18px;border:1px solid #E0E0E0">
      <h3 style="margin:0 0 12px;font-size:14px;font-weight:700">Create Price/Supply Alert</h3>
      <select id="wType" style="width:100%;padding:10px;border:1px solid #E0E0E0;border-radius:8px;margin-bottom:10px;font-size:13px">
        <option value="crop_price">📈 Crop Price Alert</option>
        <option value="supply">🌾 Supply Alert (New Listings)</option>
        <option value="equipment">🚜 Equipment Alert</option>
        <option value="weather">🌤️ Weather Alert</option>
      </select>
      <input id="wCropId" type="number" placeholder="Crop ID (optional)" style="width:100%;padding:10px;border:1px solid #E0E0E0;border-radius:8px;margin-bottom:10px;font-size:13px;box-sizing:border-box">
      <input id="wDistrictId" type="number" placeholder="District ID (optional)" style="width:100%;padding:10px;border:1px solid #E0E0E0;border-radius:8px;margin-bottom:10px;font-size:13px;box-sizing:border-box">
      <div id="priceConditions">
        <div style="font-size:11px;color:#666;margin-bottom:6px">Price conditions (₹/quintal):</div>
        <div style="display:flex;gap:8px;margin-bottom:10px">
          <input id="wPriceAbove" type="number" placeholder="Alert if above..." style="flex:1;padding:10px;border:1px solid #E0E0E0;border-radius:8px;font-size:13px">
          <input id="wPriceBelow" type="number" placeholder="Alert if below..." style="flex:1;padding:10px;border:1px solid #E0E0E0;border-radius:8px;font-size:13px">
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button id="saveWatchBtn" style="flex:1;background:#1a237e;color:white;border:none;padding:12px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer">Create Alert</button>
        <button id="cancelWatchBtn" style="background:#F5F5F5;color:#666;border:none;padding:12px 16px;border-radius:8px;font-size:13px;cursor:pointer">Cancel</button>
      </div>
    </div>`;

  formEl.querySelector('#cancelWatchBtn').addEventListener('click', () => { formEl.style.display = 'none'; });
  formEl.querySelector('#saveWatchBtn').addEventListener('click', async () => {
    const watch_type = formEl.querySelector('#wType').value;
    const cropVal = formEl.querySelector('#wCropId').value;
    const distVal = formEl.querySelector('#wDistrictId').value;
    const crop_id = cropVal ? parseInt(cropVal) : null;
    const district_id = distVal ? parseInt(distVal) : null;
    const priceAboveVal = formEl.querySelector('#wPriceAbove').value;
    const priceBelowVal = formEl.querySelector('#wPriceBelow').value;
    const price_above = priceAboveVal ? parseInt(priceAboveVal) : null;
    const price_below = priceBelowVal ? parseInt(priceBelowVal) : null;

    const conditions = {};
    if (price_above) conditions.price_above = price_above;
    if (price_below) conditions.price_below = price_below;

    try {
      await api.createWatchlist({ watch_type, crop_id, district_id, conditions });
      formEl.style.display = 'none';
      loadWatchlists(container);
    } catch (e) { alert(e.message); }
  });
}

async function loadWatchlists(container) {
  const listEl = container.querySelector('#watchList');
  const loadingEl = container.querySelector('#watchLoading');

  try {
    const res = await api.getWatchlists();
    const watchlists = res.watchlists || [];
    loadingEl.style.display = 'none';

    if (watchlists.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center;padding:40px;color:#999">
          <div style="font-size:40px;margin-bottom:8px">👁️</div>
          <div style="font-size:14px;font-weight:600">No watchlists yet</div>
          <div style="font-size:12px;margin-top:4px">Set up alerts to get notified about price changes & new listings</div>
        </div>`;
      return;
    }

    const typeIcons = { crop_price: '📈', supply: '🌾', equipment: '🚜', weather: '🌤️', listing: '📋' };
    listEl.innerHTML = watchlists.map(w => {
      const icon = typeIcons[w.watch_type] || '👁️';
      const conditions = w.conditions || {};
      const condText = Object.entries(conditions).map(([k, v]) => `${k.replace(/_/g, ' ')}: ₹${v}`).join(', ');
      return `
        <div style="background:white;border-radius:12px;padding:14px;border:1px solid #F0F0F0;margin-bottom:10px;display:flex;align-items:center;gap:12px;box-shadow:0 1px 4px rgba(0,0,0,0.04)">
          <div style="font-size:22px">${icon}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600;color:#212121;text-transform:capitalize">${w.watch_type.replace(/_/g, ' ')}</div>
            <div style="font-size:11px;color:#666;margin-top:2px">${w.crop_name || ''} ${w.district_name || ''} ${condText ? `· ${condText}` : ''}</div>
            ${w.last_triggered ? `<div style="font-size:10px;color:#FF9800;margin-top:2px">🔔 Last triggered: ${new Date(w.last_triggered).toLocaleDateString('en-IN')}</div>` : ''}
          </div>
          <button class="del-watch-btn" data-id="${w.id}" style="background:#FFEBEE;border:none;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:12px">🗑️</button>
        </div>`;
    }).join('');

    listEl.querySelectorAll('.del-watch-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('Delete this watchlist?')) {
          await api.deleteWatchlist(btn.dataset.id);
          loadWatchlists(container);
        }
      });
    });

  } catch (e) {
    loadingEl.textContent = 'Failed to load watchlists';
  }
}
