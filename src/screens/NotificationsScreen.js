import { api } from '../api.js';
import { showToast, navigate, showModal, closeModal } from '../app-shell.js';
import { t } from '../i18n.js';

export function renderNotifications(container) {
  let notifs = [], loading = true;
  let filterType = '';

  const SAMPLE_NOTIFS = [
    { id:'sn1', type:'price_alert', title:'Paddy price up ₹45/qtl', body:'Guntur mandi paddy BPT 5204 reached ₹2,225/quintal today (+2.1%)', is_read:false, created_at:'2026-04-27T08:30:00Z', action:'watchlist', action_label:'View Watchlist' },
    { id:'sn2', type:'order', title:'Order confirmed', body:'Your order #0042 for DAP Fertilizer (2 bags) has been confirmed by Sri Lakshmi Agri Inputs', is_read:false, created_at:'2026-04-27T07:15:00Z', action:'orders', action_label:'View Order' },
    { id:'sn3', type:'listing', title:'New inquiry on your listing', body:'Kurnool Oil Exports wants 8 tonnes of Groundnut at ₹5,800/quintal', is_read:false, created_at:'2026-04-26T16:00:00Z', action:'agrigalaxy', action_label:'Respond', action2:'dismiss', action2_label:'Dismiss' },
    { id:'sn4', type:'weather', title:'Heavy rain alert - Guntur', body:'IMD predicts 60mm rainfall in next 48hrs. Secure harvested crops and delay spraying.', is_read:true, created_at:'2026-04-26T10:00:00Z', action:'weather', action_label:'See Forecast' },
    { id:'sn5', type:'community', title:'Reply to your post', body:'Ramesh Kumar replied: "Try neem oil spray at 3ml/litre for white fly control"', is_read:true, created_at:'2026-04-25T14:30:00Z', action:'community', action_label:'View Reply' },
    { id:'sn6', type:'system', title:'Profile 80% complete', body:'Add your land details and crop preferences to get personalized recommendations', is_read:true, created_at:'2026-04-25T09:00:00Z', action:'profile', action_label:'Complete Profile' },
    { id:'sn7', type:'price_alert', title:'Cotton price dropped', body:'Adilabad cotton fell to ₹6,780/quintal (-1.0%). Consider holding if quality is good.', is_read:true, created_at:'2026-04-24T18:00:00Z', action:'weather', action_label:'Market Outlook' },
    { id:'sn8', type:'booking', title:'Equipment booking request', body:'Suresh Kumar wants John Deere 5310 for Apr 28-30 (3 days, ₹4,500). Please confirm availability.', is_read:false, created_at:'2026-04-24T11:00:00Z', action:'accept_booking', action_label:'Accept', action2:'decline_booking', action2_label:'Decline' },
    { id:'sn9', type:'chat', title:'New message from Sri Lakshmi Agri', body:'Your DAP Fertilizer order will be delivered tomorrow morning. Please be available.', is_read:false, created_at:'2026-04-27T10:00:00Z', action:'chat', action_label:'Reply' },
    { id:'sn10', type:'scheme', title:'PM-KISAN installment due', body:'Your next PM-KISAN installment of ₹2,000 is due to be credited in 7 days. Ensure Aadhaar-bank link is active.', is_read:false, created_at:'2026-04-26T08:00:00Z', action:'schemes', action_label:'Check Scheme' },
    { id:'sn11', type:'farmdiary', title:'Irrigation schedule reminder', body:'You set a reminder to irrigate Paddy Field A today. Head to Farm Diary to log it.', is_read:true, created_at:'2026-04-27T06:00:00Z', action:'farmdiary', action_label:'Log Activity' },
  ];

  const TYPES = [
    { key: '', label: t('all_posts') || 'All', icon: '🔔' },
    { key: 'order', label: t('orders') || 'Orders', icon: '📦' },
    { key: 'price_alert', label: t('prices') || 'Prices', icon: '💰' },
    { key: 'weather', label: t('weather') || 'Weather', icon: '🌤️' },
    { key: 'listing', label: t('inquiries') || 'Listings', icon: '🌾' },
    { key: 'booking', label: 'Bookings', icon: '📅' },
    { key: 'chat', label: t('messages') || 'Chat', icon: '💬' },
    { key: 'scheme', label: 'Schemes', icon: '🏛️' },
  ];

  let searchQ = '';

  function render() {
    let filtered = filterType ? notifs.filter(n => n.type === filterType) : notifs;
    if (searchQ) filtered = filtered.filter(n => `${n.title} ${n.body}`.toLowerCase().includes(searchQ.toLowerCase()));
    const unread = notifs.filter(n => !(n.is_read || n.read_at)).length;

    container.innerHTML = `
      <div class="hero-v2" style="background:linear-gradient(135deg,#F57C00,#E65100);color:white" role="banner">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="hero-avatar" aria-hidden="true">🔔</div>
          <div style="flex:1">
            <h1 style="margin:0;font-weight:800;font-size:18px;color:white">${t('notifications') || 'Notifications'}</h1>
            <div style="font-size:11px;opacity:0.85;color:white">${unread > 0 ? `${unread} ${t('unread') || 'unread'} · ${notifs.length} total` : t('all_caught_up') || 'All caught up!'}</div>
          </div>
          ${unread > 0 ? `<button id="markAllBtn" type="button" aria-label="Mark all as read" style="background:rgba(255,255,255,0.2);border:none;color:white;padding:6px 12px;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer">✓ ${t('mark_all_read') || 'Mark all read'}</button>` : ''}
        </div>
      </div>

      <!-- Search -->
      <div class="sticky-search" role="search">
        <input class="search-input-v2" id="notifSearch" type="search" placeholder="Search notifications…" aria-label="Search notifications" autocomplete="off" enterkeyhint="search">
      </div>

      <!-- Category filter -->
      <div style="display:flex;gap:6px;overflow-x:auto;padding:6px 14px 0" role="tablist" aria-label="Notification categories">
        ${TYPES.map(tp => `<button data-ftype="${tp.key}" role="tab" aria-selected="${filterType===tp.key}" class="chip-v2 ${filterType===tp.key?'active':''}">${tp.icon} ${tp.label}</button>`).join('')}
      </div>

      <div style="padding:8px 14px 80px">
        ${loading ? '<div class="loading"><div class="spinner"></div></div>' : ''}
        ${!loading && filtered.length === 0 ? `
          <div style="text-align:center;padding:40px 20px"><div style="font-size:56px;margin-bottom:10px">🔔</div><div style="font-weight:700">${t('no_notifications') || 'No notifications'}</div><div style="font-size:12px;color:#757575;margin-top:4px">${t('all_caught_up') || "You're all caught up!"}</div></div>
        ` : filtered.map(n => `
          <div class="notif-item" data-nid="${n.id}" style="background:var(--card,white);border-radius:12px;margin-bottom:8px;padding:12px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.06);${!(n.is_read || n.read_at)?'border-left:3px solid #E65100':''}">
            <div style="display:flex;gap:12px;cursor:pointer">
              <div style="width:40px;height:40px;border-radius:10px;background:${typeColor(n.type)}15;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">${typeIcon(n.type)}</div>
              <div style="flex:1;min-width:0">
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <div style="font-weight:${!(n.is_read||n.read_at)?'700':'500'};font-size:13px">${n.title || 'Notification'}</div>
                  <div style="font-size:10px;color:#9E9E9E;flex-shrink:0;margin-left:8px">${timeAgo(n.created_at)}</div>
                </div>
                <div style="font-size:11px;color:#757575;margin-top:3px;line-height:1.4">${n.body || n.message || ''}</div>
              </div>
            </div>
            ${(n.action || n.action2) ? `<div style="display:flex;gap:8px;margin-top:10px;padding-top:8px;border-top:1px solid #F5F5F5">
              ${n.action2 ? `<button class="notif-action2-btn" data-nid="${n.id}" data-action="${n.action2}" style="flex:1;background:#FFEBEE;color:#C62828;border:none;border-radius:8px;padding:7px;font-size:11px;font-weight:700;cursor:pointer">${n.action2_label || 'Decline'}</button>` : ''}
              ${n.action ? `<button class="notif-action-btn" data-nid="${n.id}" data-action="${n.action}" style="flex:${n.action2?2:1};background:#1a237e;color:white;border:none;border-radius:8px;padding:7px;font-size:11px;font-weight:700;cursor:pointer">${n.action_label || 'View'}</button>` : ''}
            </div>` : ''}
          </div>
        `).join('')}
      </div>
    `;

    container.querySelector('#markAllBtn')?.addEventListener('click', markAll);
    container.querySelector('#notifSearch')?.addEventListener('input', e => { searchQ = e.target.value; render(); });
    container.querySelectorAll('[data-ftype]').forEach(b => b.addEventListener('click', () => { filterType = b.dataset.ftype; render(); }));
    container.querySelectorAll('.notif-item[data-nid]').forEach(n => {
      n.addEventListener('click', (e) => {
        if (!e.target.closest('button')) { markRead(n.dataset.nid); showNotifDetail(n.dataset.nid); }
      });
    });
    container.querySelectorAll('.notif-action-btn').forEach(b => b.addEventListener('click', () => {
      const action = b.dataset.action;
      markRead(b.dataset.nid);
      if (action === 'accept_booking') { showToast('Booking accepted! Renter notified.', 'success'); }
      else if (action === 'dismiss') { markRead(b.dataset.nid); }
      else if (action) { navigate(action); }
    }));
    container.querySelectorAll('.notif-action2-btn').forEach(b => b.addEventListener('click', () => {
      const action = b.dataset.action;
      markRead(b.dataset.nid);
      if (action === 'decline_booking') { showToast('Booking declined. Renter notified.', 'info'); }
      else if (action === 'dismiss') { markRead(b.dataset.nid); render(); }
    }));
  }

  function typeIcon(tp) {
    const icons = { price_alert: '💰', weather: '🌤️', order: '📦', listing: '🌾', community: '💬', system: '⚙️', chat: '💬', review: '⭐', booking: '📅', scheme: '🏛️', farmdiary: '📓' };
    return icons[tp] || '🔔';
  }

  function typeColor(tp) {
    const colors = { price_alert: '#F9A825', weather: '#0277BD', order: '#6A1B9A', listing: '#2E7D32', community: '#1565C0', system: '#757575', chat: '#1565C0', review: '#F9A825' };
    return colors[tp] || '#E65100';
  }

  function showNotifDetail(id) {
    const n = notifs.find(x => x.id === id);
    if (!n) return;
    showModal(`<div class="modal-handle"></div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <div style="width:44px;height:44px;border-radius:10px;background:${typeColor(n.type)}15;display:flex;align-items:center;justify-content:center;font-size:24px">${typeIcon(n.type)}</div>
        <div><div style="font-weight:700;font-size:15px">${n.title}</div><div style="font-size:11px;color:#757575">${timeAgo(n.created_at)}</div></div>
      </div>
      <div style="font-size:13px;line-height:1.7;color:#424242;margin-bottom:16px">${n.body || n.message || ''}</div>
      ${n.action ? `<button id="notifDetailAction" style="width:100%;padding:12px;background:#1a237e;color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer;margin-bottom:8px">${n.action_label || 'View'}</button>` : ''}
      <button id="notifDetailClose" style="width:100%;padding:10px;background:#F5F5F5;color:#424242;border:none;border-radius:10px;font-weight:600;cursor:pointer">Close</button>`);
    document.querySelector('#notifDetailAction')?.addEventListener('click', () => { closeModal(); if (n.action) navigate(n.action); });
    document.querySelector('#notifDetailClose')?.addEventListener('click', () => closeModal());
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
