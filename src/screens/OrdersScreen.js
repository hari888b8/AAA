import { api } from '../api.js';
import { showToast, showModal, closeModal } from '../main.js';
import { t } from '../i18n.js';
import { showTrackingModal } from '../tracking.js';
import { showReviewModal } from '../reviews.js';

export function renderOrders(container) {
  let orders = [], loading = true, role = 'buyer';

  const SAMPLE_ORDERS = [
    { id:'so1', quantity:2, listing_type:'agrigalaxy', total_amount:2700, status:'delivered', crop_name:'DAP Fertilizer 50kg', created_at:'2026-04-22T10:00:00Z', buyer_name:'My Purchase', delivery_address:'Guntur, AP' },
    { id:'so2', quantity:5, listing_type:'agrigalaxy', total_amount:8000, status:'confirmed', crop_name:'BT Cotton Seeds (450g x5)', created_at:'2026-04-25T14:00:00Z', buyer_name:'My Purchase', delivery_address:'Prakasam, AP' },
    { id:'so3', quantity:10, listing_type:'supply', total_amount:21800, status:'in_transit', crop_name:'Paddy BPT 5204 (10 quintals)', created_at:'2026-04-24T09:00:00Z', buyer_name:'Sri Lakshmi Rice Mill' },
    { id:'so4', quantity:1, listing_type:'agrigalaxy', total_amount:18500, status:'pending', crop_name:'Drip Irrigation Kit (1 acre)', created_at:'2026-04-26T16:00:00Z', buyer_name:'My Purchase', delivery_address:'Krishna, AP' },
    { id:'so5', quantity:3, listing_type:'supply', total_amount:16950, status:'confirmed', crop_name:'Groundnut Bold (3 quintals)', created_at:'2026-04-23T11:00:00Z', buyer_name:'Kurnool Oil Exports' },
  ];

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
      c.addEventListener('click', (e) => {
        if (e.target.closest('.track-btn') || e.target.closest('.review-order-btn')) return;
        showOrderDetail(c.dataset.oid);
      });
    });
    container.querySelectorAll('.track-btn').forEach(b => {
      b.addEventListener('click', () => showTrackingModal({ order_id: b.dataset.oid, order_type: b.dataset.otype, order_name: b.dataset.oname, order_amount: b.dataset.oamt }));
    });
    container.querySelectorAll('.review-order-btn').forEach(b => {
      b.addEventListener('click', () => {
        showReviewModal({ target_type: 'order', target_id: b.dataset.oid, target_name: b.dataset.oname });
      });
    });
  }

  function renderContent() {
    if (orders.length === 0) return '<div class="empty-state"><div class="es-icon">📦</div><div class="es-title">No orders yet</div><div class="es-text">Your orders will appear here</div></div>';
    return `<div class="section" style="padding-top:8px">
      ${orders.map(o => `
        <div class="order-card" data-oid="${o.id}">
          <div class="oc-header">
            <span class="oc-id">#${String(o.id).slice(-4).toUpperCase()}</span>
            <span class="oc-status tag tag-${statusColor(o.status)}">${o.status}</span>
          </div>
          <div class="oc-detail fw-600">${o.crop_name || o.listing_type || 'Order'}</div>
          <div class="oc-detail">Qty: ${o.quantity || 0} · ${o.listing_type || 'supply'}</div>
          <div class="flex-between mt-sm">
            <span class="oc-amount">₹${Number(o.total_amount || 0).toLocaleString()}</span>
            <span class="text-sm text-muted">${fmtDate(o.created_at)}</span>
          </div>
          <div style="display:flex;gap:6px;margin-top:8px">
            <button class="track-btn" data-oid="${o.id}" data-otype="${o.listing_type||'agrigalaxy'}" data-oname="${o.crop_name||'Order'}" data-oamt="${o.total_amount||0}" style="flex:1;padding:7px;background:#E3F2FD;color:#1565C0;border:none;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer">📍 ${t('track_order') || 'Track Order'}</button>
            ${o.status === 'delivered' ? `<button class="review-order-btn" data-oid="${o.id}" data-oname="${o.crop_name||'Order'}" style="flex:1;padding:7px;background:#FFF8E1;color:#F9A825;border:none;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer">⭐ ${t('write_review') || 'Review'}</button>` : ''}
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
    if (orders.length === 0) orders = SAMPLE_ORDERS;
    loading = false; render();
  }

  loadData();
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
