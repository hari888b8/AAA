import { api } from '../api.js';
import { showToast, navigate } from '../app-shell.js';
import { getState } from '../store.js';
import { t } from '../i18n.js';

/**
 * LogisticsScreen — Farm Pickup → Buyer Delivery
 * Track deliveries, schedule pickups, partner dashboard
 */

export function renderLogistics(container) {
  let tab = 'track'; // track | schedule | partner | batch
  let deliveries = [];
  let partners = [];
  let loading = true;
  let partnerDashboard = null;

  async function loadData() {
    loading = true;
    render();
    try {
      if (tab === 'track') {
        const res = await api.get('/logistics/requests?limit=20');
        deliveries = res.deliveries || [];
      } else if (tab === 'partner') {
        try {
          const res = await api.get('/logistics/partner/dashboard');
          partnerDashboard = res;
        } catch { partnerDashboard = null; }
      } else if (tab === 'batch') {
        const res = await api.get('/logistics/partners?available_only=true');
        partners = res.partners || [];
      }
    } catch (err) {
      deliveries = [];
    }
    loading = false;
    render();
  }

  function getStatusColor(status) {
    const colors = {
      pending: '#FFA726', assigned: '#42A5F5', pickup_enroute: '#AB47BC',
      picked_up: '#7E57C2', in_transit: '#26A69A', delivered: '#66BB6A', completed: '#4CAF50'
    };
    return colors[status] || '#757575';
  }

  function getStatusLabel(status) {
    const labels = {
      pending: '⏳ Pending', assigned: '👤 Assigned', pickup_enroute: '🚚 Pickup En Route',
      picked_up: '📦 Picked Up', in_transit: '🚛 In Transit', delivered: '✅ Delivered', completed: '🎉 Completed'
    };
    return labels[status] || status;
  }

  function render() {
    container.innerHTML = `
      <div class="hero-v2" role="banner" style="background:linear-gradient(135deg,#1565C0,#0D47A1);color:white">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:2rem">🚚</span>
          <div><h1 style="margin:0;font-size:1.3rem">Logistics</h1>
          <p style="margin:2px 0 0;opacity:.85;font-size:.85rem">Farm pickup to buyer delivery</p></div>
        </div>
      </div>

      <div style="display:flex;gap:0;border-bottom:2px solid #E3F2FD;background:#fff;position:sticky;top:0;z-index:10">
        ${['track', 'schedule', 'partner', 'batch'].map(t => `
          <button onclick="window._logTab('${t}')" style="flex:1;padding:12px 8px;border:none;background:${tab===t?'#1565C0':'transparent'};color:${tab===t?'#fff':'#555'};font-weight:${tab===t?'700':'400'};font-size:.82rem;cursor:pointer;border-radius:${tab===t?'8px 8px 0 0':'0'}">
            ${{track:'📍 Track',schedule:'📅 Schedule',partner:'💼 Dashboard',batch:'📦 Batches'}[t]}
          </button>
        `).join('')}
      </div>

      <div style="padding:16px">
        ${loading ? '<div style="text-align:center;padding:40px">⏳ Loading...</div>' : renderTab()}
      </div>
    `;
  }

  function renderTab() {
    if (tab === 'track') return renderTrack();
    if (tab === 'schedule') return renderSchedule();
    if (tab === 'partner') return renderPartnerDashboard();
    if (tab === 'batch') return renderBatch();
    return '';
  }

  function renderTrack() {
    if (!deliveries.length) return '<div style="text-align:center;padding:40px;color:#888">📭 No deliveries yet.<br><small>Deliveries appear when you place or receive orders.</small></div>';
    return deliveries.map(d => `
      <div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-weight:600">${d.cargo_type || 'Delivery'}</span>
          <span style="background:${getStatusColor(d.status)};color:#fff;padding:4px 10px;border-radius:20px;font-size:.75rem">${getStatusLabel(d.status)}</span>
        </div>
        <div style="margin-top:8px;font-size:.85rem;color:#555">
          <div>📍 From: ${d.pickup_address || 'Pickup location'}</div>
          <div>📍 To: ${d.delivery_address || 'Delivery location'}</div>
          ${d.weight_kg ? `<div>⚖️ ${d.weight_kg} kg</div>` : ''}
          ${d.estimated_cost ? `<div>💰 ₹${d.estimated_cost}</div>` : ''}
          ${d.partner_name ? `<div>🚚 ${d.partner_name} (${d.vehicle_type || ''})</div>` : ''}
        </div>
        ${d.otp_pickup && d.status === 'assigned' ? `<div style="margin-top:8px;padding:8px;background:#E8F5E9;border-radius:8px;font-size:.85rem">🔑 Pickup OTP: <strong>${d.otp_pickup}</strong></div>` : ''}
        ${d.otp_delivery && d.status === 'in_transit' ? `<div style="margin-top:8px;padding:8px;background:#E3F2FD;border-radius:8px;font-size:.85rem">🔑 Delivery OTP: <strong>${d.otp_delivery}</strong></div>` : ''}
      </div>
    `).join('');
  }

  function renderSchedule() {
    return `
      <div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
        <h3 style="margin:0 0 16px">📅 Schedule Pickup</h3>
        <form id="scheduleForm">
          <div style="margin-bottom:12px">
            <label style="font-size:.85rem;color:#555;display:block;margin-bottom:4px">Pickup Address</label>
            <textarea id="pickupAddr" rows="2" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:.9rem" placeholder="Enter pickup location"></textarea>
          </div>
          <div style="margin-bottom:12px">
            <label style="font-size:.85rem;color:#555;display:block;margin-bottom:4px">Delivery Address</label>
            <textarea id="delivAddr" rows="2" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:.9rem" placeholder="Enter delivery location"></textarea>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
            <div>
              <label style="font-size:.85rem;color:#555;display:block;margin-bottom:4px">Weight (kg)</label>
              <input id="weightKg" type="number" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px" placeholder="100">
            </div>
            <div>
              <label style="font-size:.85rem;color:#555;display:block;margin-bottom:4px">Cargo Type</label>
              <input id="cargoType" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px" placeholder="Paddy bags">
            </div>
          </div>
          <div style="margin-bottom:12px">
            <label style="font-size:.85rem;color:#555;display:block;margin-bottom:4px">Preferred Pickup Time</label>
            <input id="pickupSlot" type="datetime-local" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px">
          </div>
          <button type="submit" style="width:100%;padding:14px;background:#1565C0;color:#fff;border:none;border-radius:10px;font-size:1rem;font-weight:600;cursor:pointer">
            🚚 Request Pickup
          </button>
        </form>
      </div>
    `;
  }

  function renderPartnerDashboard() {
    if (!partnerDashboard) {
      return `
        <div style="text-align:center;padding:40px">
          <p style="font-size:1.2rem">🚚 Become a Logistics Partner</p>
          <p style="color:#666;margin:8px 0 20px">Earn by delivering farm produce. Register your vehicle.</p>
          <button onclick="window._logTab('register')" style="padding:14px 28px;background:#1565C0;color:#fff;border:none;border-radius:10px;font-size:1rem;cursor:pointer">Register as Partner</button>
        </div>
      `;
    }
    const { partner, stats, recent_deliveries } = partnerDashboard;
    return `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px">
        <div style="background:#E3F2FD;padding:16px;border-radius:12px;text-align:center">
          <div style="font-size:1.5rem;font-weight:700">${stats.pending_deliveries}</div>
          <div style="font-size:.8rem;color:#555">Pending</div>
        </div>
        <div style="background:#E8F5E9;padding:16px;border-radius:12px;text-align:center">
          <div style="font-size:1.5rem;font-weight:700">${stats.total_completed}</div>
          <div style="font-size:.8rem;color:#555">Completed</div>
        </div>
        <div style="background:#FFF3E0;padding:16px;border-radius:12px;text-align:center">
          <div style="font-size:1.5rem;font-weight:700">₹${stats.total_earnings}</div>
          <div style="font-size:.8rem;color:#555">Earnings</div>
        </div>
      </div>
      <div style="background:#fff;border-radius:12px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
        <h4 style="margin:0 0 12px">Recent Deliveries</h4>
        ${(recent_deliveries || []).map(d => `
          <div style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:.85rem">
            <span style="color:${getStatusColor(d.status)}">●</span> ${d.cargo_type || 'Delivery'} — ${getStatusLabel(d.status)}
            ${d.actual_cost ? ` — ₹${d.actual_cost}` : ''}
          </div>
        `).join('') || '<p style="color:#888">No deliveries yet</p>'}
      </div>
    `;
  }

  function renderBatch() {
    return `
      <div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
        <h3 style="margin:0 0 12px">📦 Batch Planner</h3>
        <p style="color:#666;font-size:.85rem;margin-bottom:16px">Group multiple pickups for efficient route planning (FPO/Admin feature)</p>
        <p style="text-align:center;color:#888;padding:20px">Coming soon — batch multiple orders for single-route delivery</p>
      </div>
    `;
  }

  // Event handlers
  window._logTab = (t) => { tab = t; loadData(); };

  container.addEventListener('submit', async (e) => {
    if (e.target.id === 'scheduleForm') {
      e.preventDefault();
      const pickup_address = container.querySelector('#pickupAddr')?.value;
      const delivery_address = container.querySelector('#delivAddr')?.value;
      const weight_kg = container.querySelector('#weightKg')?.value;
      const cargo_type = container.querySelector('#cargoType')?.value;
      const pickup_slot = container.querySelector('#pickupSlot')?.value;

      if (!pickup_address || !delivery_address) {
        return showToast('Please enter pickup and delivery addresses', 'error');
      }

      try {
        await api.post('/logistics/request', {
          order_id: crypto.randomUUID(),
          order_type: 'pickup_request',
          pickup_address, delivery_address,
          weight_kg: weight_kg ? Number(weight_kg) : null,
          cargo_type,
          pickup_slot: pickup_slot || null
        });
        showToast('Pickup scheduled! Partner will be assigned soon.', 'success');
        tab = 'track';
        loadData();
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  });

  loadData();
}
