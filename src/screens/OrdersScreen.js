import { api } from '../api.js';
import { showToast, showModal, closeModal } from '../app-shell.js';
import { t } from '../i18n.js';
import { showTrackingModal } from '../tracking.js';
import { showReviewModal } from '../reviews.js';

export function renderOrders(container) {
  let orders = [], loading = true, role = 'buyer';
  let searchQ = '';
  let statusFilter = '';

  const SAMPLE_ORDERS = [
    { id:'so1', quantity:2, listing_type:'agrigalaxy', total_amount:2700, status:'delivered', crop_name:'DAP Fertilizer 50kg', created_at:'2026-04-22T10:00:00Z', buyer_name:'My Purchase', delivery_address:'Guntur, AP' },
    { id:'so2', quantity:5, listing_type:'agrigalaxy', total_amount:8000, status:'confirmed', crop_name:'BT Cotton Seeds (450g x5)', created_at:'2026-04-25T14:00:00Z', buyer_name:'My Purchase', delivery_address:'Prakasam, AP' },
    { id:'so3', quantity:10, listing_type:'supply', total_amount:21800, status:'in_transit', crop_name:'Paddy BPT 5204 (10 quintals)', created_at:'2026-04-24T09:00:00Z', buyer_name:'Sri Lakshmi Rice Mill' },
    { id:'so4', quantity:1, listing_type:'agrigalaxy', total_amount:18500, status:'pending', crop_name:'Drip Irrigation Kit (1 acre)', created_at:'2026-04-26T16:00:00Z', buyer_name:'My Purchase', delivery_address:'Krishna, AP' },
    { id:'so5', quantity:3, listing_type:'supply', total_amount:16950, status:'confirmed', crop_name:'Groundnut Bold (3 quintals)', created_at:'2026-04-23T11:00:00Z', buyer_name:'Kurnool Oil Exports' },
    { id:'so6', quantity:1, listing_type:'kisanconnect', total_amount:4500, status:'delivered', crop_name:'Tractor Rental (3 days)', created_at:'2026-04-20T08:00:00Z', buyer_name:'My Booking', delivery_address:'Guntur, AP' },
  ];

  const STATUS_MAP = {
    '': { label:'All', icon:'📋' },
    pending: { label:'Pending', icon:'⏳', color:'#E65100' },
    confirmed: { label:'Confirmed', icon:'✓', color:'#1565C0' },
    in_transit: { label:'In Transit', icon:'🚚', color:'#6A1B9A' },
    delivered: { label:'Delivered', icon:'✅', color:'#2E7D32' },
    cancelled: { label:'Cancelled', icon:'✗', color:'#C62828' },
  };

  function render() {
    const totalAmt = orders.reduce((s, o) => s + Number(o.total_amount || 0), 0);
    const pending = orders.filter(o => o.status === 'pending').length;
    const inTransit = orders.filter(o => o.status === 'in_transit').length;

    let filtered = orders;
    if (statusFilter) filtered = filtered.filter(o => o.status === statusFilter);
    if (searchQ) filtered = filtered.filter(o => (o.crop_name||'').toLowerCase().includes(searchQ.toLowerCase()) || (o.buyer_name||'').toLowerCase().includes(searchQ.toLowerCase()));

    container.innerHTML = `
      <div class="hero-v2" style="background:linear-gradient(135deg,#4527A0,#311B92)" role="banner">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="hero-avatar" aria-hidden="true">📦</div>
          <div style="flex:1">
            <h1 style="margin:0;font-weight:800;font-size:18px;color:white">My Orders</h1>
            <div style="font-size:11px;opacity:0.85;color:white">${orders.length} orders · ₹${Number(totalAmt).toLocaleString()} total</div>
          </div>
          ${pending > 0 ? `<span style="background:rgba(255,193,7,0.3);color:#FFD54F;padding:4px 10px;border-radius:10px;font-size:11px;font-weight:700">${pending} pending</span>` : ''}
        </div>
        <div class="hero-stats" role="list" style="margin-top:12px">
          <div class="hero-stat-card" role="listitem"><div class="v">${orders.length}</div><div class="l">Total</div></div>
          <div class="hero-stat-card" role="listitem"><div class="v">${inTransit}</div><div class="l">In Transit</div></div>
          <div class="hero-stat-card" role="listitem"><div class="v">${orders.filter(o=>o.status==='delivered').length}</div><div class="l">Delivered</div></div>
        </div>
      </div>

      <!-- Role tabs -->
      <div class="tab-bar-v2" role="tablist">
        <button role="tab" aria-selected="${role === 'buyer'}" class="tab-btn ${role === 'buyer' ? 'active' : ''}" data-role="buyer">🛒 My Purchases</button>
        <button role="tab" aria-selected="${role === 'seller'}" class="tab-btn ${role === 'seller' ? 'active' : ''}" data-role="seller">📦 Received</button>
      </div>

      <!-- Search -->
      <div class="sticky-search" role="search">
        <input class="search-input-v2" id="orderSearch" type="search" placeholder="Search orders…" aria-label="Search orders…" value="${searchQ}" aria-label="Search orders" autocomplete="off">
      </div>

      <!-- Status filters -->
      <div style="display:flex;gap:6px;padding:4px 14px 8px;overflow-x:auto">
        ${Object.entries(STATUS_MAP).map(([key, val]) => `
          <button class="chip-v2 ${statusFilter === key ? 'active' : ''}" data-sf="${key}" type="button">${val.icon} ${val.label}</button>
        `).join('')}
      </div>

      <div class="pb-nav">
        ${loading ? '<div class="loading"><div class="spinner"></div></div>' : renderContent(filtered)}
      </div>
    `;
    container.querySelectorAll('.tab-btn[data-role]').forEach(b => b.addEventListener('click', () => { role = b.dataset.role; loadData(); }));
    container.querySelector('#orderSearch')?.addEventListener('input', e => { searchQ = e.target.value; render(); });
    container.querySelectorAll('[data-sf]').forEach(b => b.addEventListener('click', () => { statusFilter = b.dataset.sf; render(); }));
    container.querySelectorAll('.order-card[data-oid]').forEach(c => {
      c.addEventListener('click', (e) => {
        if (e.target.closest('.track-btn') || e.target.closest('.review-order-btn') || e.target.closest('.refund-btn') || e.target.closest('.invoice-btn')) return;
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
    container.querySelectorAll('.invoice-btn').forEach(b => {
      b.addEventListener('click', async () => {
        try {
          const res = await api.getOrder(b.dataset.oid);
          const o = res.order || res;
          generateGSTInvoice(o);
        } catch(e) { showToast('Could not load order details', 'error'); }
      });
    });
    container.querySelectorAll('.refund-btn').forEach(b => {
      b.addEventListener('click', () => {
        showModal(`<div class="modal-handle"></div>
          <h3>↩ Request Refund</h3>
          <div style="background:#FFF3E0;border-radius:8px;padding:10px;margin-bottom:12px;font-size:12px">
            Order: <strong>${b.dataset.oname}</strong><br>Amount: <strong>₹${Number(b.dataset.amt||0).toLocaleString()}</strong>
            <div style="margin-top:4px;color:#E65100;font-size:11px">Refund will be credited to your wallet within minutes.</div>
          </div>
          <div class="form-group"><label>Reason for refund</label>
            <select class="form-input" id="refundReason">
              <option value="damaged_item">Damaged / defective item received</option>
              <option value="wrong_item">Wrong item delivered</option>
              <option value="not_delivered">Item not delivered</option>
              <option value="quality_issue">Quality not as described</option>
              <option value="changed_mind">Changed my mind</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="form-group"><label>Additional details (optional)</label>
            <textarea class="form-input" id="refundNote" rows="2" placeholder="Describe the issue…"></textarea>
          </div>
          <button id="submitRefund" style="width:100%;padding:12px;background:#E65100;color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer">Submit Refund Request</button>`);
        document.querySelector('#submitRefund')?.addEventListener('click', async () => {
          const reason = document.querySelector('#refundReason').value;
          const note = document.querySelector('#refundNote').value;
          try {
            await api.requestRefund({ payment_order_id: b.dataset.paid, reason: note ? `${reason}: ${note}` : reason });
            showToast('Refund requested! Amount credited to wallet.', 'success');
            closeModal(); loadData();
          } catch(e) { showToast(e.message, 'error'); }
        });
      });
    });
  }

  function renderContent(filtered) {
    if (filtered.length === 0) return '<div class="empty-v2"><div class="ev-icon">📦</div><div class="ev-title">No orders found</div><div class="ev-text">Your orders will appear here</div></div>';
    return `<div class="section" style="padding:8px 14px">
      ${filtered.map(o => `
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
            ${(o.status === 'confirmed' || o.status === 'in_transit') && o.payment_order_id ? `<button class="refund-btn" data-oid="${o.id}" data-paid="${o.payment_order_id}" data-oname="${o.crop_name||'Order'}" data-amt="${o.total_amount||0}" style="flex:1;padding:7px;background:#FFF3E0;color:#E65100;border:none;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer">↩ Refund</button>` : ''}
            ${(o.status === 'delivered' || o.status === 'confirmed') ? `<button class="invoice-btn" data-oid="${o.id}" style="padding:7px 10px;background:#E3F2FD;color:#1565C0;border:none;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer">🧾 Invoice</button>` : ''}
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

function generateGSTInvoice(order) {
  const invoiceNo = `INV-${String(order.id||'').slice(-6).toUpperCase()}-${new Date().getFullYear()}`;
  const date = fmtDate(order.created_at);
  const amount = Number(order.total_amount || 0);
  const gstRate = 5; // 5% GST on agricultural inputs
  const baseAmount = Math.round(amount / 1.05 * 100) / 100;
  const gstAmount = Math.round((amount - baseAmount) * 100) / 100;
  const cgst = Math.round(gstAmount / 2 * 100) / 100;

  const invoiceHTML = `<!DOCTYPE html><html><head>
    <meta charset="UTF-8"><title>GST Invoice - ${invoiceNo}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; color: #333; font-size: 13px; }
      .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1565C0; padding-bottom: 12px; margin-bottom: 16px; }
      .company { color: #1565C0; }
      h1 { margin: 0; font-size: 20px; }
      .badge { background: #1565C0; color: white; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; }
      table { width: 100%; border-collapse: collapse; margin: 16px 0; }
      th { background: #1565C0; color: white; padding: 8px 12px; text-align: left; }
      td { padding: 8px 12px; border-bottom: 1px solid #eee; }
      .totals td { font-weight: bold; }
      .gst-total td { background: #E3F2FD; font-weight: bold; color: #1565C0; font-size: 14px; }
      .footer { margin-top: 30px; border-top: 1px solid #eee; padding-top: 12px; font-size: 11px; color: #757575; }
      .note { background: #FFF9C4; padding: 8px 12px; border-radius: 6px; font-size: 11px; margin-top: 12px; }
      @media print { button { display: none !important; } }
    </style>
  </head><body>
    <div class="header">
      <div class="company">
        <h1>🌾 AgriHub Platform</h1>
        <div>GSTIN: 36AAACA0000A1Z0</div>
        <div>Hyderabad, Telangana - 500001</div>
        <div>support@agrihub.in</div>
      </div>
      <div style="text-align:right">
        <div class="badge">TAX INVOICE</div>
        <div style="margin-top:8px;font-size:14px;font-weight:bold">${invoiceNo}</div>
        <div>Date: ${date}</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
      <div>
        <div style="font-weight:bold;margin-bottom:4px;color:#1565C0">Bill To:</div>
        <div>${order.buyer_name || 'Customer'}</div>
        <div>${order.delivery_address || 'Address on file'}</div>
      </div>
      <div>
        <div style="font-weight:bold;margin-bottom:4px;color:#1565C0">Order Details:</div>
        <div>Order ID: #${String(order.id||'').slice(-8).toUpperCase()}</div>
        <div>Status: ${order.status}</div>
        <div>Type: ${order.listing_type || 'Agricultural Input'}</div>
      </div>
    </div>

    <table>
      <tr><th>Item</th><th>Qty</th><th>Rate</th><th>Base Amt (₹)</th></tr>
      <tr>
        <td>${order.crop_name || order.notes || 'Agricultural Input'}</td>
        <td>${order.quantity || 1}</td>
        <td>₹${baseAmount.toFixed(2)}</td>
        <td>₹${baseAmount.toFixed(2)}</td>
      </tr>
    </table>

    <table>
      <tr class="totals"><td colspan="3">Subtotal (Taxable Value)</td><td>₹${baseAmount.toFixed(2)}</td></tr>
      <tr class="totals"><td colspan="3">CGST @ ${gstRate/2}%</td><td>₹${cgst.toFixed(2)}</td></tr>
      <tr class="totals"><td colspan="3">SGST @ ${gstRate/2}%</td><td>₹${cgst.toFixed(2)}</td></tr>
      <tr class="gst-total"><td colspan="3">TOTAL (incl. GST)</td><td>₹${amount.toFixed(2)}</td></tr>
    </table>

    <div class="note">
      📋 This is a computer-generated invoice. For agricultural inputs, GST @ 5% applies under HSN 8432 / 8436.<br>
      GSTIN verification: verify.gst.gov.in
    </div>

    <div class="footer">
      <strong>Terms & Conditions:</strong> Payment due on delivery. Disputes must be raised within 48 hours.
      Goods once sold will not be taken back unless damaged in transit.<br><br>
      Thank you for your business with AgriHub Platform.
    </div>

    <div style="margin-top:20px;text-align:center">
      <button onclick="window.print()" style="padding:10px 28px;background:#1565C0;color:white;border:none;border-radius:8px;font-weight:bold;font-size:14px;cursor:pointer">🖨️ Print Invoice</button>
      <button onclick="window.close()" style="padding:10px 28px;background:#F5F5F5;color:#333;border:none;border-radius:8px;font-weight:bold;font-size:14px;cursor:pointer;margin-left:8px">✕ Close</button>
    </div>
  </body></html>`;

  const win = window.open('', '_blank', 'width=800,height=600');
  if (win) {
    win.document.write(invoiceHTML);
    win.document.close();
  } else {
    showToast('Allow pop-ups to view invoice', 'error');
  }
}
