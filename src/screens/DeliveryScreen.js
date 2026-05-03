import { api } from '../api.js';
import { showToast, navigate } from '../app-shell.js';
import { getState } from '../store.js';
import { t } from '../i18n.js';

/**
 * DeliveryScreen — Shop to farmer doorstep delivery
 * Manage delivery orders, create shipments, driver dashboard
 */

const SAMPLE_ORDERS = [
  { id:'do1', package_type:'fertilizer', pickup_address:'Ravi Fertilizers, Main Road, Guntur', drop_address:'Village Kondaveedu, Guntur Dt', weight_kg:50, delivery_fee:85, status:'created', shop_name:'Ravi Fertilizers' },
  { id:'do2', package_type:'seeds', pickup_address:'Sri Seeds, Market Yard, Krishna', drop_address:'Ibrahimpatnam Village', weight_kg:10, delivery_fee:55, status:'in_transit', shop_name:'Sri Seeds', driver_name:'Raju' },
  { id:'do3', package_type:'medicine', pickup_address:'Veterinary Shop, Ongole', drop_address:'Maddipadu Village', weight_kg:2, delivery_fee:45, status:'delivered', shop_name:'Pet Care Ongole' },
];

export function renderDelivery(container) {
  let tab = 'orders'; // orders | create | driver | nearby
  let orders = [];
  let dashboard = null;
  let nearbyOrders = [];
  let loading = true;
  let createdOrder = null;

  const PACKAGE_ICONS = { fertilizer:'🌿', seeds:'🌱', pesticide:'🧪', grocery:'🛒', medicine:'💊', general:'📦' };

  function getStatusColor(status) {
    const colors = {
      created: '#2196F3', assigned: '#FF9800', picked_up: '#9C27B0',
      in_transit: '#009688', delivered: '#4CAF50', cancelled: '#F44336'
    };
    return colors[status] || '#757575';
  }

  function getStatusLabel(status) {
    const labels = {
      created: '🆕 Created', assigned: '👤 Assigned', picked_up: '📦 Picked Up',
      in_transit: '🚚 In Transit', delivered: '✅ Delivered', cancelled: '❌ Cancelled'
    };
    return labels[status] || status;
  }

  async function loadData() {
    loading = true;
    render();
    try {
      if (tab === 'orders') {
        const res = await api.get('/delivery/orders');
        orders = (res.orders && res.orders.length) ? res.orders : SAMPLE_ORDERS;
      } else if (tab === 'driver') {
        try {
          const res = await api.get('/delivery/dashboard');
          dashboard = res;
        } catch { dashboard = null; }
      } else if (tab === 'nearby') {
        try {
          const res = await api.get('/delivery/nearby?lat=16.3&lng=80.4');
          nearbyOrders = (res.orders && res.orders.length) ? res.orders : [];
        } catch { nearbyOrders = []; }
      }
    } catch {
      if (tab === 'orders') orders = SAMPLE_ORDERS;
    }
    loading = false;
    render();
  }

  function render() {
    container.innerHTML = `
      <div class="hero-v2" role="banner" style="background:linear-gradient(135deg,#F57C00,#E64A19);color:white">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:2rem">📦</span>
          <div><h1 style="margin:0;font-size:1.3rem">Delivery Hub</h1>
          <p style="margin:2px 0 0;opacity:.85;font-size:.85rem">Shop to farmer doorstep delivery</p></div>
        </div>
      </div>

      <div style="display:flex;gap:0;border-bottom:2px solid #FBE9E7;background:#fff;position:sticky;top:0;z-index:10">
        ${['orders', 'create', 'driver', 'nearby'].map(t => `
          <button onclick="window._delTab('${t}')" style="flex:1;padding:12px 6px;border:none;background:${tab===t?'#F57C00':'transparent'};color:${tab===t?'#fff':'#555'};font-weight:${tab===t?'700':'400'};font-size:.78rem;cursor:pointer;border-radius:${tab===t?'8px 8px 0 0':'0'}">
            ${{orders:'📋 Orders',create:'➕ Create',driver:'🚗 Driver',nearby:'📍 Nearby'}[t]}
          </button>
        `).join('')}
      </div>

      <div style="padding:16px">
        ${loading ? '<div style="text-align:center;padding:40px">⏳ Loading...</div>' : renderTab()}
      </div>
    `;
  }

  function renderTab() {
    if (tab === 'orders') return renderOrders();
    if (tab === 'create') return renderCreate();
    if (tab === 'driver') return renderDriver();
    if (tab === 'nearby') return renderNearby();
    return '';
  }

  function renderOrders() {
    if (!orders.length) return '<div style="text-align:center;padding:40px;color:#888">📭 No delivery orders yet.</div>';
    return orders.map(o => `
      <div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:1.6rem">${PACKAGE_ICONS[o.package_type] || '📦'}</span>
            <div>
              <div style="font-weight:600;font-size:.9rem">${o.shop_name || 'Delivery'}</div>
              <div style="font-size:.75rem;color:#888;text-transform:capitalize">${o.package_type}</div>
            </div>
          </div>
          <span style="background:${getStatusColor(o.status)};color:#fff;padding:4px 10px;border-radius:20px;font-size:.72rem;font-weight:600">${getStatusLabel(o.status)}</span>
        </div>
        <div style="margin-top:10px;font-size:.83rem;color:#555">
          <div style="margin-bottom:4px">📍 <strong>From:</strong> ${o.pickup_address}</div>
          <div style="margin-bottom:4px">📍 <strong>To:</strong> ${o.drop_address}</div>
          <div style="display:flex;gap:16px;margin-top:8px">
            ${o.weight_kg ? `<span>⚖️ ${o.weight_kg} kg</span>` : ''}
            ${o.delivery_fee ? `<span>💰 ₹${o.delivery_fee}</span>` : ''}
            ${o.driver_name ? `<span>🚗 ${o.driver_name}</span>` : ''}
          </div>
        </div>
      </div>
    `).join('');
  }

  function renderCreate() {
    if (createdOrder) {
      return `
        <div style="background:#E8F5E9;border-radius:12px;padding:20px;text-align:center">
          <div style="font-size:2rem;margin-bottom:8px">✅</div>
          <h3 style="margin:0 0 8px;color:#2E7D32">Order Created!</h3>
          <div style="background:#fff;border-radius:8px;padding:12px;margin:12px 0;text-align:left">
            <div style="font-size:.85rem;margin-bottom:8px"><strong>Pickup OTP:</strong> <span style="font-size:1.2rem;color:#F57C00;font-weight:700">${createdOrder.pickup_otp || '----'}</span></div>
            <div style="font-size:.85rem"><strong>Delivery OTP:</strong> <span style="font-size:1.2rem;color:#2196F3;font-weight:700">${createdOrder.delivery_otp || '----'}</span></div>
          </div>
          <p style="font-size:.8rem;color:#666">Share these OTPs with the driver at pickup & delivery</p>
          <button onclick="window._delNewOrder()" style="margin-top:12px;padding:10px 20px;background:#F57C00;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600">Create Another</button>
        </div>
      `;
    }
    return `
      <div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
        <h3 style="margin:0 0 16px">➕ Create Delivery Order</h3>
        <form id="deliveryCreateForm">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
            <div>
              <label style="font-size:.85rem;color:#555;display:block;margin-bottom:4px">Customer Phone</label>
              <input id="delCustPhone" type="tel" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:.9rem" placeholder="9876543210">
            </div>
            <div>
              <label style="font-size:.85rem;color:#555;display:block;margin-bottom:4px">Customer Name</label>
              <input id="delCustName" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:.9rem" placeholder="Farmer name">
            </div>
          </div>
          <div style="margin-bottom:12px">
            <label style="font-size:.85rem;color:#555;display:block;margin-bottom:4px">Pickup Address</label>
            <textarea id="delPickup" rows="2" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:.9rem" placeholder="Shop address"></textarea>
          </div>
          <div style="margin-bottom:12px">
            <label style="font-size:.85rem;color:#555;display:block;margin-bottom:4px">Drop Address</label>
            <textarea id="delDrop" rows="2" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:.9rem" placeholder="Farmer village address"></textarea>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
            <div>
              <label style="font-size:.85rem;color:#555;display:block;margin-bottom:4px">Package Type</label>
              <select id="delPkgType" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:.9rem">
                <option value="fertilizer">🌿 Fertilizer</option>
                <option value="seeds">🌱 Seeds</option>
                <option value="pesticide">🧪 Pesticide</option>
                <option value="grocery">🛒 Grocery</option>
                <option value="medicine">💊 Medicine</option>
                <option value="general">📦 General</option>
              </select>
            </div>
            <div>
              <label style="font-size:.85rem;color:#555;display:block;margin-bottom:4px">Weight (kg)</label>
              <input id="delWeight" type="number" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px" placeholder="10">
            </div>
          </div>
          <div style="margin-bottom:12px">
            <label style="font-size:.85rem;color:#555;display:block;margin-bottom:4px">Package Description</label>
            <input id="delDesc" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:.9rem" placeholder="2 bags DAP fertilizer">
          </div>
          <div id="feeEstimate" style="display:none;background:#FFF3E0;padding:12px;border-radius:8px;margin-bottom:12px;font-size:.9rem"></div>
          <div style="display:flex;gap:10px">
            <button type="button" onclick="window._delCalcFee()" style="flex:1;padding:14px;background:#FFF3E0;color:#E65100;border:1px solid #FFB74D;border-radius:10px;font-size:.9rem;font-weight:600;cursor:pointer">
              🧮 Calculate Fee
            </button>
            <button type="submit" style="flex:1;padding:14px;background:#F57C00;color:#fff;border:none;border-radius:10px;font-size:.9rem;font-weight:600;cursor:pointer">
              📦 Create Order
            </button>
          </div>
        </form>
      </div>
    `;
  }

  function renderDriver() {
    if (!dashboard) {
      return `
        <div style="text-align:center;padding:40px">
          <p style="font-size:1.2rem">🚗 Driver Dashboard</p>
          <p style="color:#666;margin:8px 0 20px">Register as a delivery driver to see your dashboard</p>
          <div style="background:#FFF3E0;border-radius:12px;padding:16px;margin-top:16px">
            <p style="font-size:.85rem;color:#666">No active driver profile found. Contact admin to register.</p>
          </div>
        </div>
      `;
    }
    const { stats, active_orders } = dashboard;
    return `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px">
        <div style="background:#FFF3E0;padding:16px;border-radius:12px;text-align:center">
          <div style="font-size:1.5rem;font-weight:700">${stats.pending || 0}</div>
          <div style="font-size:.78rem;color:#555">Pending</div>
        </div>
        <div style="background:#E8F5E9;padding:16px;border-radius:12px;text-align:center">
          <div style="font-size:1.5rem;font-weight:700">${stats.completed_today || 0}</div>
          <div style="font-size:.78rem;color:#555">Today</div>
        </div>
        <div style="background:#E3F2FD;padding:16px;border-radius:12px;text-align:center">
          <div style="font-size:1.5rem;font-weight:700">₹${stats.total_earnings || 0}</div>
          <div style="font-size:.78rem;color:#555">Earnings</div>
        </div>
      </div>
      <h4 style="margin:0 0 12px;font-size:.95rem">Active Orders</h4>
      ${(active_orders || []).length ? active_orders.map(o => `
        <div style="background:#fff;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <span style="font-weight:600;font-size:.9rem">${PACKAGE_ICONS[o.package_type] || '📦'} ${o.shop_name || 'Order'}</span>
            <span style="background:${getStatusColor(o.status)};color:#fff;padding:3px 8px;border-radius:12px;font-size:.7rem">${o.status}</span>
          </div>
          <div style="font-size:.8rem;color:#666;margin-bottom:8px">📍 ${o.drop_address}</div>
          <div style="display:flex;gap:8px">
            ${o.status === 'assigned' ? `<button onclick="window._delAction('${o.id}','picked_up')" style="flex:1;padding:10px;background:#9C27B0;color:#fff;border:none;border-radius:8px;font-size:.82rem;cursor:pointer;font-weight:600">📦 Pick Up</button>` : ''}
            ${o.status === 'picked_up' || o.status === 'in_transit' ? `<button onclick="window._delAction('${o.id}','delivered')" style="flex:1;padding:10px;background:#4CAF50;color:#fff;border:none;border-radius:8px;font-size:.82rem;cursor:pointer;font-weight:600">✅ Deliver</button>` : ''}
          </div>
        </div>
      `).join('') : '<p style="color:#888;text-align:center">No active orders</p>'}
    `;
  }

  function renderNearby() {
    if (!nearbyOrders.length) return '<div style="text-align:center;padding:40px;color:#888">📍 No unassigned orders nearby.<br><small>New orders will appear here when available.</small></div>';
    return nearbyOrders.map(o => `
      <div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:1.4rem">${PACKAGE_ICONS[o.package_type] || '📦'}</span>
            <div>
              <div style="font-weight:600;font-size:.9rem">${o.shop_name || 'Delivery Order'}</div>
              <div style="font-size:.75rem;color:#888">${o.weight_kg} kg • ₹${o.delivery_fee}</div>
            </div>
          </div>
          <span style="font-size:.75rem;color:#F57C00;font-weight:600">${o.distance_km ? o.distance_km + ' km' : 'Nearby'}</span>
        </div>
        <div style="margin-top:8px;font-size:.8rem;color:#666">
          <div>📍 ${o.pickup_address}</div>
          <div>→ ${o.drop_address}</div>
        </div>
        <button onclick="window._delAccept('${o.id}')" style="width:100%;margin-top:10px;padding:10px;background:#F57C00;color:#fff;border:none;border-radius:8px;font-size:.85rem;cursor:pointer;font-weight:600">
          🚗 Accept Delivery
        </button>
      </div>
    `).join('');
  }

  // Event handlers
  window._delTab = (t) => { tab = t; createdOrder = null; loadData(); };
  window._delNewOrder = () => { createdOrder = null; render(); };

  window._delCalcFee = () => {
    const weight = container.querySelector('#delWeight')?.value || 5;
    const fee = Math.round(30 + Number(weight) * 1.5);
    const el = container.querySelector('#feeEstimate');
    if (el) {
      el.style.display = 'block';
      el.innerHTML = `💰 Estimated fee: <strong>₹${fee}</strong> <span style="font-size:.75rem;color:#888">(base ₹30 + ₹1.5/kg)</span>`;
    }
  };

  window._delAction = async (id, status) => {
    try {
      await api.patch(`/delivery/orders/${id}`, { status });
      showToast(`Order updated to ${status}`, 'success');
      loadData();
    } catch (err) {
      showToast(err.message || 'Update failed', 'error');
    }
  };

  window._delAccept = async (id) => {
    try {
      await api.post(`/delivery/orders/${id}/accept`, {});
      showToast('Delivery accepted! Navigate to pickup.', 'success');
      tab = 'driver';
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to accept', 'error');
    }
  };

  container.addEventListener('submit', async (e) => {
    if (e.target.id === 'deliveryCreateForm') {
      e.preventDefault();
      const customer_phone = container.querySelector('#delCustPhone')?.value;
      const customer_name = container.querySelector('#delCustName')?.value;
      const pickup_address = container.querySelector('#delPickup')?.value;
      const drop_address = container.querySelector('#delDrop')?.value;
      const package_type = container.querySelector('#delPkgType')?.value;
      const package_description = container.querySelector('#delDesc')?.value;
      const weight_kg = container.querySelector('#delWeight')?.value;

      if (!pickup_address || !drop_address) {
        return showToast('Please enter pickup and drop addresses', 'error');
      }

      try {
        const res = await api.post('/delivery/orders', {
          customer_phone,
          customer_name,
          pickup_address,
          drop_address,
          package_type,
          package_description,
          weight_kg: weight_kg ? Number(weight_kg) : null
        });
        createdOrder = res;
        showToast('Delivery order created!', 'success');
        render();
      } catch (err) {
        showToast(err.message || 'Failed to create order', 'error');
      }
    }
  });

  loadData();
}
