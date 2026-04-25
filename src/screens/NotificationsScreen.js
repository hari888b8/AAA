import { api } from '../api.js';
import { showToast } from '../main.js';

export function renderNotifications(container) {
  let notifs = [], loading = true;

  function render() {
    container.innerHTML = loading ? '<div class="loading"><div class="spinner"></div></div>' : renderContent();
    container.querySelector('#markAllBtn')?.addEventListener('click', markAll);
    container.querySelectorAll('.notif-item[data-nid]').forEach(n => {
      n.addEventListener('click', () => markRead(n.dataset.nid));
    });
  }

  function renderContent() {
    if (notifs.length === 0) return '<div class="empty-state"><div class="es-icon">🔔</div><div class="es-title">No notifications</div><div class="es-text">You\'re all caught up!</div></div>';
    const unread = notifs.filter(n => !(n.is_read || n.read_at)).length;
    return `
      ${unread > 0 ? `<div class="px" style="padding-top:12px"><button class="btn btn-secondary btn-small" id="markAllBtn">✓ Mark all read (${unread})</button></div>` : ''}
      <div style="padding-top:8px">
        ${notifs.map(n => `
          <div class="notif-item ${(n.is_read || n.read_at) ? '' : 'unread'}" data-nid="${n.id}">
            <span class="ni-icon">${typeIcon(n.type)}</span>
            <div class="ni-body">
              <div class="ni-title">${n.title || 'Notification'}</div>
              <div class="ni-msg">${n.message || ''}</div>
              <div class="ni-time">${timeAgo(n.created_at)}</div>
            </div>
          </div>
        `).join('')}
      </div>`;
  }

  function typeIcon(t) {
    const icons = { price_alert: '💰', weather: '🌤️', order: '📦', listing: '🌾', community: '💬', system: '⚙️' };
    return icons[t] || '🔔';
  }

  async function markRead(id) {
    try { await api.markRead(id); loadData(); } catch (e) { console.error(e); }
  }

  async function markAll() {
    try { await api.markAllRead(); showToast('All marked read', 'success'); loadData(); } catch (e) { showToast(e.message, 'error'); }
  }

  async function loadData() {
    loading = true; render();
    try {
      const res = await api.getNotifications('?limit=30');
      notifs = Array.isArray(res) ? res : (res.notifications || []);
    } catch (e) { console.error(e); }
    loading = false; render();
  }

  loadData();
}

function timeAgo(d) {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}
