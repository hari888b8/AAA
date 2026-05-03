import { api } from '../api.js';
import { navigate, showToast, showModal, closeModal } from '../app-shell.js';
import { getRole, getState } from '../store.js';

/**
 * TradeOrdersScreen — End-to-End Trade Lifecycle Manager
 *
 * Shows all trade orders for the current user (buyer or seller).
 * For each order, displays the state machine status and
 * provides the appropriate next-step action button.
 *
 * States: bid_accepted → escrow_funded → quality_verified → dispatched →
 *         in_transit → delivered → payment_released
 */

const STATUS_META = {
  bid_accepted:      { label: 'Bid Accepted',      color: '#1565C0', icon: '🤝', next: 'Fund Escrow' },
  escrow_funded:     { label: 'Escrow Funded',     color: '#6A1B9A', icon: '🔐', next: 'Verify Quality' },
  quality_verified:  { label: 'Quality Verified',  color: '#2E7D32', icon: '✅', next: 'Dispatch' },
  dispatched:        { label: 'Dispatched',        color: '#E65100', icon: '🚚', next: 'Update Location' },
  in_transit:        { label: 'In Transit',        color: '#F57C00', icon: '📍', next: 'Confirm Delivery' },
  delivered:         { label: 'Delivered',          color: '#2E7D32', icon: '📦', next: 'Payment Releasing...' },
  payment_released:  { label: 'Payment Released',  color: '#1B5E20', icon: '💰', next: null },
  disputed:          { label: 'Disputed',          color: '#C62828', icon: '⚠️', next: null },
  cancelled:         { label: 'Cancelled',         color: '#757575', icon: '❌', next: null },
};

export function renderTradeOrders(container) {
  const role = getRole();
  let orders = [];
  let loading = true;
  let filter = 'all';

  async function loadOrders() {
    loading = true;
    render();
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const res = await api.getTradeOrders(params);
      orders = res.orders || [];
    } catch (e) {
      orders = [];
      showToast(e.message || 'Failed to load orders', 'error');
    }
    loading = false;
    render();
  }

  function render() {
    const activeOrders = orders.filter(o => !['payment_released', 'cancelled'].includes(o.status));
    const completedOrders = orders.filter(o => ['payment_released', 'cancelled'].includes(o.status));

    container.innerHTML = `
      <div style="background:linear-gradient(135deg,#1B5E20,#2E7D32);color:white;padding:20px 16px 24px;border-radius:0 0 20px 20px">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-weight:800;font-size:18px">📋 Trade Orders</div>
            <div style="font-size:11px;opacity:0.85;margin-top:2px">End-to-end trade lifecycle</div>
          </div>
          <div style="background:rgba(255,255,255,0.15);padding:6px 12px;border-radius:12px;font-size:12px;font-weight:600">
            ${orders.length} orders
          </div>
        </div>
      </div>

      <!-- Filter tabs -->
      <div style="display:flex;gap:6px;padding:12px 16px;overflow-x:auto;border-bottom:1px solid #E0E0E0">
        ${['all','bid_accepted','escrow_funded','quality_verified','dispatched','in_transit','delivered','payment_released'].map(f => `
          <button data-filter="${f}" style="padding:6px 12px;border-radius:16px;border:1px solid ${filter===f?'#1B5E20':'#E0E0E0'};background:${filter===f?'#E8F5E9':'white'};color:${filter===f?'#1B5E20':'#666'};font-size:11px;white-space:nowrap;cursor:pointer;font-weight:${filter===f?'700':'400'}">
            ${f === 'all' ? 'All' : (STATUS_META[f]?.icon || '') + ' ' + (STATUS_META[f]?.label || f)}
          </button>
        `).join('')}
      </div>

      ${loading ? `
        <div style="padding:60px 16px;text-align:center;color:#888">
          <div style="font-size:2rem;margin-bottom:8px">⏳</div>
          Loading trade orders...
        </div>
      ` : orders.length === 0 ? `
        <div style="padding:60px 16px;text-align:center;color:#888">
          <div style="font-size:2.5rem;margin-bottom:8px">📋</div>
          <div style="font-weight:600;margin-bottom:4px">No trade orders yet</div>
          <div style="font-size:12px">Place a bid on a listing in AgriFlow to start a trade</div>
          <button onclick="window._navTo('agriflow')" style="margin-top:12px;padding:8px 16px;background:#1B5E20;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600">Go to AgriFlow</button>
        </div>
      ` : `
        <!-- Active Orders -->
        ${activeOrders.length > 0 ? `
          <div style="padding:12px 16px 4px;font-weight:700;font-size:13px;color:#1B5E20">🔄 Active (${activeOrders.length})</div>
          ${activeOrders.map(o => renderOrderCard(o)).join('')}
        ` : ''}

        <!-- Completed Orders -->
        ${completedOrders.length > 0 ? `
          <div style="padding:12px 16px 4px;font-weight:700;font-size:13px;color:#757575">✅ Completed (${completedOrders.length})</div>
          ${completedOrders.map(o => renderOrderCard(o)).join('')}
        ` : ''}
      `}
    `;

    // Attach events
    container.querySelectorAll('[data-filter]').forEach(btn => {
      btn.onclick = () => { filter = btn.dataset.filter; loadOrders(); };
    });
    container.querySelectorAll('[data-action]').forEach(btn => {
      btn.onclick = () => handleAction(btn.dataset.action, btn.dataset.orderid);
    });
    window._navTo = (r) => navigate(r);
  }

  function renderOrderCard(o) {
    const meta = STATUS_META[o.status] || { label: o.status, color: '#666', icon: '❓' };
    const isBuyer = o.buyer_id === (getState().user?.id || '');
    const myRole = isBuyer ? 'buyer' : 'seller';
    const actionBtn = getActionButton(o, myRole);

    return `
      <div style="margin:8px 16px;padding:14px;background:white;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,0.08);border-left:4px solid ${meta.color}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div style="font-weight:700;font-size:14px">${o.icon_emoji || '🌾'} ${o.crop_name || 'Crop'}</div>
            <div style="font-size:11px;color:#888;margin-top:2px">${o.district_name || ''} · ${o.quantity_kg}kg @ ₹${o.price_per_kg}/kg</div>
          </div>
          <div style="background:${meta.color}15;color:${meta.color};padding:4px 8px;border-radius:8px;font-size:10px;font-weight:700">
            ${meta.icon} ${meta.label}
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding-top:8px;border-top:1px solid #f5f5f5">
          <div style="font-size:12px;color:#333">
            <strong>₹${Number(o.total_amount || 0).toLocaleString('en-IN')}</strong>
            <span style="color:#888;font-size:10px;margin-left:4px">(${myRole})</span>
          </div>
          ${actionBtn ? `
            <button data-action="${actionBtn.action}" data-orderid="${o.id}" style="padding:6px 12px;background:${actionBtn.bg};color:white;border:none;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer">
              ${actionBtn.label}
            </button>
          ` : `
            <span style="font-size:11px;color:#888">${meta.next || 'Complete'}</span>
          `}
        </div>
      </div>
    `;
  }

  function getActionButton(order, myRole) {
    const s = order.status;
    if (s === 'bid_accepted' && myRole === 'buyer') {
      return { action: 'fund', label: '💰 Fund Escrow', bg: '#6A1B9A' };
    }
    if (s === 'escrow_funded' && myRole === 'seller') {
      return { action: 'verify', label: '📸 Verify Quality', bg: '#2E7D32' };
    }
    if (s === 'quality_verified' && myRole === 'seller') {
      return { action: 'dispatch', label: '🚚 Dispatch', bg: '#E65100' };
    }
    if ((s === 'dispatched' || s === 'in_transit') && myRole === 'buyer') {
      return { action: 'confirm', label: '✅ Confirm Delivery', bg: '#1B5E20' };
    }
    return null;
  }

  async function handleAction(action, orderId) {
    try {
      if (action === 'fund') {
        const res = await api.fundEscrow(orderId);
        showToast(res.message || 'Escrow funded!', 'success');
      } else if (action === 'verify') {
        showModal(`
          <div style="padding:16px">
            <h3 style="margin:0 0 12px">📸 Quality Verification</h3>
            <p style="font-size:12px;color:#666;margin-bottom:12px">Upload at least 2 photos of the crop for quality verification.</p>
            <input type="text" id="qp1" placeholder="Photo URL 1" style="width:100%;padding:8px;margin-bottom:8px;border:1px solid #ddd;border-radius:6px;font-size:13px">
            <input type="text" id="qp2" placeholder="Photo URL 2" style="width:100%;padding:8px;margin-bottom:8px;border:1px solid #ddd;border-radius:6px;font-size:13px">
            <select id="qgrade" style="width:100%;padding:8px;margin-bottom:12px;border:1px solid #ddd;border-radius:6px;font-size:13px">
              <option value="A">Grade A</option><option value="B">Grade B</option><option value="C">Grade C</option>
            </select>
            <button id="submitQuality" style="width:100%;padding:10px;background:#2E7D32;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer">Submit Verification</button>
          </div>
        `);
        setTimeout(() => {
          const btn = document.getElementById('submitQuality');
          if (btn) btn.onclick = async () => {
            const p1 = document.getElementById('qp1')?.value;
            const p2 = document.getElementById('qp2')?.value;
            const grade = document.getElementById('qgrade')?.value;
            if (!p1 || !p2) { showToast('Please provide 2 photo URLs', 'error'); return; }
            try {
              await api.verifyQuality(orderId, { photos: [p1, p2], grade_self_assessed: grade });
              showToast('Quality verified!', 'success');
              closeModal();
              loadOrders();
            } catch (e) { showToast(e.message, 'error'); }
          };
        }, 100);
        return;
      } else if (action === 'dispatch') {
        showModal(`
          <div style="padding:16px">
            <h3 style="margin:0 0 12px">🚚 Dispatch Details</h3>
            <input type="text" id="dVehicle" placeholder="Vehicle Number (e.g., AP09AB1234)" style="width:100%;padding:8px;margin-bottom:8px;border:1px solid #ddd;border-radius:6px;font-size:13px">
            <input type="text" id="dPhone" placeholder="Driver Phone" style="width:100%;padding:8px;margin-bottom:8px;border:1px solid #ddd;border-radius:6px;font-size:13px">
            <select id="dMode" style="width:100%;padding:8px;margin-bottom:12px;border:1px solid #ddd;border-radius:6px;font-size:13px">
              <option value="truck">Truck</option><option value="tempo">Tempo</option><option value="tractor">Tractor</option><option value="self">Self Pickup</option>
            </select>
            <button id="submitDispatch" style="width:100%;padding:10px;background:#E65100;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer">Mark Dispatched</button>
          </div>
        `);
        setTimeout(() => {
          const btn = document.getElementById('submitDispatch');
          if (btn) btn.onclick = async () => {
            const vehicle = document.getElementById('dVehicle')?.value;
            const phone = document.getElementById('dPhone')?.value;
            const mode = document.getElementById('dMode')?.value;
            try {
              await api.dispatchOrder(orderId, { transport_mode: mode, vehicle_number: vehicle, driver_phone: phone });
              showToast('Order dispatched!', 'success');
              closeModal();
              loadOrders();
            } catch (e) { showToast(e.message, 'error'); }
          };
        }, 100);
        return;
      } else if (action === 'confirm') {
        showModal(`
          <div style="padding:16px">
            <h3 style="margin:0 0 12px">✅ Confirm Delivery</h3>
            <p style="font-size:12px;color:#666;margin-bottom:12px">Confirm you received the goods. Payment will be released to seller.</p>
            <select id="cRating" style="width:100%;padding:8px;margin-bottom:8px;border:1px solid #ddd;border-radius:6px;font-size:13px">
              <option value="5">⭐⭐⭐⭐⭐ Excellent</option><option value="4">⭐⭐⭐⭐ Good</option><option value="3">⭐⭐⭐ Average</option><option value="2">⭐⭐ Below Average</option><option value="1">⭐ Poor</option>
            </select>
            <textarea id="cNotes" placeholder="Notes (optional)" style="width:100%;padding:8px;margin-bottom:12px;border:1px solid #ddd;border-radius:6px;font-size:13px;height:60px"></textarea>
            <button id="submitConfirm" style="width:100%;padding:10px;background:#1B5E20;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer">Confirm & Release Payment</button>
          </div>
        `);
        setTimeout(() => {
          const btn = document.getElementById('submitConfirm');
          if (btn) btn.onclick = async () => {
            const rating = parseInt(document.getElementById('cRating')?.value || '5');
            const notes = document.getElementById('cNotes')?.value;
            try {
              const res = await api.confirmDelivery(orderId, { rating, notes });
              showToast(res.message || 'Delivery confirmed! Payment released.', 'success');
              closeModal();
              loadOrders();
            } catch (e) { showToast(e.message, 'error'); }
          };
        }, 100);
        return;
      }
      loadOrders();
    } catch (e) {
      showToast(e.message || 'Action failed', 'error');
    }
  }

  loadOrders();
}
