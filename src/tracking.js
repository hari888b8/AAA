/**
 * Order Tracking — Shared module for tracking order status with timeline
 * Usage: import { showTrackingModal, renderTrackingTimeline } from '../tracking.js';
 */
import { api } from './api.js';
import { showModal, closeModal, showToast } from './app-shell.js';
import { t } from './i18n.js';

const STATUS_FLOW = {
  agrigalaxy: [
    { key: 'placed',    icon: '📝', label: 'Order Placed',    color: '#1565C0' },
    { key: 'confirmed', icon: '✅', label: 'Confirmed',       color: '#2E7D32' },
    { key: 'packed',    icon: '📦', label: 'Packed',           color: '#E65100' },
    { key: 'shipped',   icon: '🚛', label: 'Shipped',         color: '#6A1B9A' },
    { key: 'delivered', icon: '🏠', label: 'Delivered',        color: '#2E7D32' },
  ],
  kisanconnect: [
    { key: 'requested', icon: '📝', label: 'Booking Requested', color: '#1565C0' },
    { key: 'confirmed', icon: '✅', label: 'Confirmed',         color: '#2E7D32' },
    { key: 'in_transit',icon: '🚜', label: 'Equipment En Route', color: '#E65100' },
    { key: 'active',    icon: '⚙️', label: 'In Use',            color: '#6A1B9A' },
    { key: 'completed', icon: '🏁', label: 'Completed',         color: '#2E7D32' },
  ],
  agriflow: [
    { key: 'inquiry',   icon: '📝', label: 'Inquiry Sent',     color: '#1565C0' },
    { key: 'accepted',  icon: '✅', label: 'Accepted',          color: '#2E7D32' },
    { key: 'loading',   icon: '🚛', label: 'Loading',           color: '#E65100' },
    { key: 'in_transit',icon: '📍', label: 'In Transit',        color: '#6A1B9A' },
    { key: 'delivered', icon: '🏠', label: 'Delivered & Paid',  color: '#2E7D32' },
  ],
  bhoomios: [
    { key: 'inquiry',     icon: '📝', label: 'Inquiry Sent',      color: '#1565C0' },
    { key: 'site_visit',  icon: '🏡', label: 'Site Visit Booked', color: '#E65100' },
    { key: 'negotiation', icon: '🤝', label: 'Negotiating',       color: '#6A1B9A' },
    { key: 'agreement',   icon: '📄', label: 'Agreement Signed',  color: '#2E7D32' },
    { key: 'completed',   icon: '🏁', label: 'Completed',         color: '#2E7D32' },
  ],
};

// ─── Render tracking timeline ──────────────────────────────────────────────
export function renderTrackingTimeline(trackingEvents, orderType) {
  const flow = STATUS_FLOW[orderType] || STATUS_FLOW.agrigalaxy;
  const eventStatuses = (trackingEvents || []).map(e => e.status);
  const currentIdx = flow.reduce((max, step, i) => eventStatuses.includes(step.key) ? i : max, -1);

  return `
    <div style="padding:4px 0">
      ${flow.map((step, i) => {
        const isDone = i <= currentIdx;
        const isCurrent = i === currentIdx;
        const event = (trackingEvents || []).find(e => e.status === step.key);
        return `
        <div style="display:flex;gap:12px;position:relative;padding-bottom:${i < flow.length - 1 ? '20px' : '0'}">
          <div style="display:flex;flex-direction:column;align-items:center;width:28px">
            <div style="width:28px;height:28px;border-radius:50%;background:${isDone ? step.color : '#E0E0E0'};display:flex;align-items:center;justify-content:center;font-size:14px;${isCurrent ? 'box-shadow:0 0 0 4px ' + step.color + '30' : ''}">${isDone ? step.icon : '○'}</div>
            ${i < flow.length - 1 ? `<div style="width:2px;flex:1;background:${isDone ? step.color : '#E0E0E0'};margin-top:4px;min-height:16px"></div>` : ''}
          </div>
          <div style="flex:1;padding-top:3px">
            <div style="font-weight:${isDone?'700':'500'};font-size:13px;color:${isDone?'#424242':'#9E9E9E'}">${step.label}</div>
            ${event ? `
              <div style="font-size:11px;color:#757575;margin-top:2px">${event.notes || ''}</div>
              <div style="font-size:10px;color:#9E9E9E;margin-top:1px">${event.location ? '📍 ' + event.location + ' · ' : ''}${formatDateTime(event.created_at)}</div>
            ` : ''}
          </div>
        </div>`;
      }).join('')}
    </div>
  `;
}

// ─── Show tracking modal ───────────────────────────────────────────────────
export async function showTrackingModal({ order_id, order_type, order_name, order_amount }) {
  showModal(`<div class="modal-handle"></div><div style="text-align:center;padding:20px"><div class="spinner"></div></div>`);

  let trackingEvents = [];
  try {
    const res = await api.getOrderTracking(order_type, order_id);
    trackingEvents = res.tracking || [];
  } catch (e) {
    // Demo fallback — generate sample tracking
    trackingEvents = generateSampleTracking(order_type);
  }

  showModal(`
    <div class="modal-handle"></div>
    <h3 style="margin:0 0 4px">📦 ${t('order_tracking') || 'Order Tracking'}</h3>
    <div style="font-size:12px;color:#757575;margin-bottom:12px">${order_name || 'Order'} ${order_amount ? '· ₹' + Number(order_amount).toLocaleString() : ''}</div>

    <div style="background:#F5F5F5;border-radius:12px;padding:14px;margin-bottom:12px">
      ${renderTrackingTimeline(trackingEvents, order_type)}
    </div>

    <div style="background:#E3F2FD;border-radius:10px;padding:10px 12px;font-size:11px;color:#1565C0;line-height:1.5">
      💡 ${t('tracking_info') || 'You will receive notifications when the status changes. Contact the seller for any questions.'}
    </div>
  `);
}

function generateSampleTracking(orderType) {
  const now = new Date();
  const flow = STATUS_FLOW[orderType] || STATUS_FLOW.agrigalaxy;
  // Show first 2-3 steps as completed
  const steps = Math.min(3, flow.length);
  return flow.slice(0, steps).map((step, i) => ({
    status: step.key,
    location: i === 0 ? '' : 'Guntur, AP',
    notes: i === 0 ? 'Order received' : i === 1 ? 'Seller confirmed your order' : 'Ready for dispatch',
    created_at: new Date(now.getTime() - (steps - i) * 3600000).toISOString(),
  }));
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
}
