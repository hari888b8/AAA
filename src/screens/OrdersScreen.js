import { api } from '../api.js';
import { showToast, showModal, closeModal } from '../main.js';

export function renderOrders(container) {
  let orders = [], loading = true, role = 'buyer';

  function render() {
    container.innerHTML = `
      <div class="tab-bar">
        <button class="tab-btn ${role === 'buyer' ? 'active' : ''}" data-role="buyer">🛒 My Purchases</button>
        <button class="tab-btn ${role === 'seller' ? 'active' : ''}" data-role="seller">📦 Received</button>
      </div>
      ${loading ? '<div class="loading"><div class="spinner"></div></div>' : renderContent()}
    `;
    container.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => { role = b.dataset.role; loadData(); }));
    container.querySelectorAll('.order-card[data-oid]').forEach(c => {
      c.addEventListener('click', () => showOrderDetail(c.dataset.oid));
    });
  }

  function renderContent() {
    if (orders.length === 0) return '<div class="empty-state"><div class="es-icon">📦</div><div class="es-title">No orders yet</div><div class="es-text">Your orders will appear here</div></div>';
    return `<div class="section" style="padding-top:8px">
      ${orders.map(o => `
        <div class="order-card" data-oid="${o.id}">
          <div class="oc-header">
            <span class="oc-id">#${String(o.id).padStart(4, '0')}</span>
            <span class="oc-status tag tag-${statusColor(o.status)}">${o.status}</span>
          </div>
          <div class="oc-detail">Qty: ${o.quantity || 0} · ${o.listing_type || 'supply'}</div>
          <div class="flex-between mt-sm">
            <span class="oc-amount">₹${Number(o.total_amount || 0).toLocaleString()}</span>
            <span class="text-sm text-muted">${fmtDate(o.created_at)}</span>
          </div>
        </div>
      `).join('')}
    </div>`;
  }

  function statusColor(s) {
    return { pending: 'orange', confirmed: 'blue', in_transit: 'blue', delivered: 'green', cancelled: 'red' }[s] || 'gray';
  }

  async function showOrderDetail(id) {
    try {
      const res = await api.getOrder(id);
      const o = res.order || res;
      showModal(`
        <div class="modal-handle"></div>
        <h3>Order #${String(o.id).padStart(4, '0')}</h3>
        <div class="card" style="box-shadow:none;background:var(--bg)">
          <div class="flex-between mb"><span>Status</span><span class="tag tag-${statusColor(o.status)}">${o.status}</span></div>
          <div class="flex-between mb"><span>Quantity</span><span>${o.quantity || 0}</span></div>
          <div class="flex-between mb"><span>Total</span><span class="fw-700" style="color:var(--primary)">₹${Number(o.total_amount || 0).toLocaleString()}</span></div>
          <div class="flex-between mb"><span>Buyer</span><span>${o.buyer_name || 'N/A'}</span></div>
          ${o.delivery_address ? `<div class="flex-between mb"><span>Address</span><span>${o.delivery_address}</span></div>` : ''}
          <div class="flex-between"><span>Date</span><span>${fmtDate(o.created_at)}</span></div>
        </div>
        ${o.notes ? `<div class="text-sm text-muted mt">${o.notes}</div>` : ''}
        ${role === 'seller' && o.status === 'pending' ? `
          <div class="flex gap mt-lg">
            <button class="btn btn-primary" id="confirmOrder" style="flex:1">✓ Confirm</button>
            <button class="btn btn-danger" id="cancelOrder" style="flex:1">✗ Cancel</button>
          </div>
        ` : ''}
      `);
      document.querySelector('#confirmOrder')?.addEventListener('click', async () => {
        try { await api.updateOrderStatus(id, { status: 'confirmed' }); showToast('Order confirmed!', 'success'); closeModal(); loadData(); } catch (e) { showToast(e.message, 'error'); }
      });
      document.querySelector('#cancelOrder')?.addEventListener('click', async () => {
        try { await api.updateOrderStatus(id, { status: 'cancelled' }); showToast('Order cancelled', 'info'); closeModal(); loadData(); } catch (e) { showToast(e.message, 'error'); }
      });
    } catch (e) { showToast(e.message, 'error'); }
  }

  async function loadData() {
    loading = true; render();
    try {
      const res = await api.getOrders(`?role=${role}&limit=30`);
      orders = Array.isArray(res) ? res : (res.orders || []);
    } catch (e) { console.error(e); }
    loading = false; render();
  }

  loadData();
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
