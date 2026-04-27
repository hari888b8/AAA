import { api } from '../api.js';
import { showToast } from '../main.js';
import { t } from '../i18n.js';

export function renderNotifications(container) {
  let notifs = [], loading = true;
  let filterType = '';

  const SAMPLE_NOTIFS = [
    { id:'sn1', type:'price_alert', title:'Paddy price up ₹45/qtl', body:'Guntur mandi paddy BPT 5204 reached ₹2,225/quintal today (+2.1%)', is_read:false, created_at:'2026-04-27T08:30:00Z' },
    { id:'sn2', type:'order', title:'Order confirmed', body:'Your order #0042 for DAP Fertilizer (2 bags) has been confirmed by Sri Lakshmi Agri Inputs', is_read:false, created_at:'2026-04-27T07:15:00Z' },
    { id:'sn3', type:'listing', title:'New inquiry on your listing', body:'Kurnool Oil Exports wants 8 tonnes of Groundnut at ₹5,800/quintal', is_read:false, created_at:'2026-04-26T16:00:00Z' },
    { id:'sn4', type:'weather', title:'Heavy rain alert - Guntur', body:'IMD predicts 60mm rainfall in next 48hrs. Secure harvested crops and delay spraying.', is_read:true, created_at:'2026-04-26T10:00:00Z' },
    { id:'sn5', type:'community', title:'Reply to your post', body:'Ramesh Kumar replied: "Try neem oil spray at 3ml/litre for white fly control"', is_read:true, created_at:'2026-04-25T14:30:00Z' },
    { id:'sn6', type:'system', title:'Profile 80% complete', body:'Add your land details and crop preferences to get personalized recommendations', is_read:true, created_at:'2026-04-25T09:00:00Z' },
    { id:'sn7', type:'price_alert', title:'Cotton price dropped', body:'Adilabad cotton fell to ₹6,780/quintal (-1.0%). Consider holding if quality is good.', is_read:true, created_at:'2026-04-24T18:00:00Z' },
    { id:'sn8', type:'listing', title:'Equipment booking confirmed', body:'Your John Deere 5310 booking for Apr 28-30 has been confirmed. Contact: 9876543210', is_read:true, created_at:'2026-04-24T11:00:00Z' },
    { id:'sn9', type:'chat', title:'New message from Sri Lakshmi Agri', body:'Your DAP Fertilizer order will be delivered tomorrow morning. Please be available.', is_read:false, created_at:'2026-04-27T10:00:00Z' },
    { id:'sn10', type:'review', title:'Your review got 5 helpful votes', body:'Your review of "BT Cotton Seeds" was found helpful by 5 farmers.', is_read:true, created_at:'2026-04-26T08:00:00Z' },
  ];

  const TYPES = [
    { key: '', label: t('all_posts') || 'All', icon: '🔔' },
    { key: 'order', label: t('orders') || 'Orders', icon: '📦' },
    { key: 'price_alert', label: t('prices') || 'Prices', icon: '💰' },
    { key: 'weather', label: t('weather') || 'Weather', icon: '🌤️' },
    { key: 'listing', label: t('inquiries') || 'Listings', icon: '🌾' },
    { key: 'chat', label: t('messages') || 'Chat', icon: '💬' },
  ];

  function render() {
    const filtered = filterType ? notifs.filter(n => n.type === filterType) : notifs;
    const unread = notifs.filter(n => !(n.is_read || n.read_at)).length;

    container.innerHTML = `
      <div style="background:linear-gradient(135deg,#F57C00,#E65100);color:white;padding:14px 16px 12px">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:28px">🔔</span>
          <div style="flex:1">
            <div style="font-weight:800;font-size:18px">${t('notifications') || 'Notifications'}</div>
            <div style="font-size:11px;opacity:0.85">${unread > 0 ? `${unread} ${t('unread') || 'unread'}` : t('all_caught_up') || 'All caught up!'}</div>
          </div>
          ${unread > 0 ? `<button id="markAllBtn" style="background:rgba(255,255,255,0.2);border:none;color:white;padding:6px 12px;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer">✓ ${t('mark_all_read') || 'Mark all read'}</button>` : ''}
        </div>
      </div>

      <!-- Category filter -->
      <div style="display:flex;gap:6px;overflow-x:auto;padding:10px 14px 0">
        ${TYPES.map(tp => `<button data-ftype="${tp.key}" style="flex-shrink:0;padding:6px 12px;border-radius:20px;border:none;font-size:11px;font-weight:600;cursor:pointer;background:${filterType===tp.key?'#E65100':'#F5F5F5'};color:${filterType===tp.key?'white':'#616161'}">${tp.icon} ${tp.label}</button>`).join('')}
      </div>

      <div style="padding:8px 14px 80px">
        ${loading ? '<div class="loading"><div class="spinner"></div></div>' : ''}
        ${!loading && filtered.length === 0 ? `
          <div style="text-align:center;padding:40px 20px"><div style="font-size:56px;margin-bottom:10px">🔔</div><div style="font-weight:700">${t('no_notifications') || 'No notifications'}</div><div style="font-size:12px;color:#757575;margin-top:4px">${t('all_caught_up') || "You're all caught up!"}</div></div>
        ` : filtered.map(n => `
          <div class="notif-item" data-nid="${n.id}" style="background:white;border-radius:12px;margin-bottom:8px;padding:12px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.06);cursor:pointer;display:flex;gap:12px;${!(n.is_read || n.read_at)?'border-left:3px solid #E65100':''}">
            <div style="width:40px;height:40px;border-radius:10px;background:${typeColor(n.type)}15;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">${typeIcon(n.type)}</div>
            <div style="flex:1;min-width:0">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <div style="font-weight:${!(n.is_read||n.read_at)?'700':'500'};font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${n.title || 'Notification'}</div>
                <div style="font-size:10px;color:#9E9E9E;flex-shrink:0;margin-left:8px">${timeAgo(n.created_at)}</div>
              </div>
              <div style="font-size:11px;color:#757575;margin-top:3px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${n.body || n.message || ''}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelector('#markAllBtn')?.addEventListener('click', markAll);
    container.querySelectorAll('[data-ftype]').forEach(b => b.addEventListener('click', () => { filterType = b.dataset.ftype; render(); }));
    container.querySelectorAll('.notif-item[data-nid]').forEach(n => {
      n.addEventListener('click', () => markRead(n.dataset.nid));
    });
  }

  function typeIcon(tp) {
    const icons = { price_alert: '💰', weather: '🌤️', order: '📦', listing: '🌾', community: '💬', system: '⚙️', chat: '💬', review: '⭐' };
    return icons[tp] || '🔔';
  }

  function typeColor(tp) {
    const colors = { price_alert: '#F9A825', weather: '#0277BD', order: '#6A1B9A', listing: '#2E7D32', community: '#1565C0', system: '#757575', chat: '#1565C0', review: '#F9A825' };
    return colors[tp] || '#E65100';
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
    if (notifs.length === 0) notifs = SAMPLE_NOTIFS;
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
