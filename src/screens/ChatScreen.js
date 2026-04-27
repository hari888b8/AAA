import { api } from '../api.js';
import { showToast } from '../main.js';
import { t } from '../i18n.js';
import { getState } from '../store.js';

/**
 * ChatScreen — In-App Messaging
 * Conversation list + Chat detail (message bubbles)
 */
export function renderChat(container) {
  let conversations = [];
  let activeConvo = null;
  let messages = [];
  let loading = true;
  let sending = false;

  const SAMPLE_CONVOS = [
    { id:'sc1', other_name:'Sri Lakshmi Agri Inputs', other_avatar:null, other_id:'u1', context_type:'agrigalaxy', last_message:'Your order for DAP Fertilizer has been confirmed. Delivery in 2 days.', last_at:'2026-04-27T09:00:00Z', unread:2 },
    { id:'sc2', other_name:'Ramesh Kumar', other_avatar:null, other_id:'u2', context_type:'kisanconnect', last_message:'Tractor is available from April 29. Shall I book it for you?', last_at:'2026-04-26T16:30:00Z', unread:0 },
    { id:'sc3', other_name:'Kurnool Oil Exports', other_avatar:null, other_id:'u3', context_type:'agriflow', last_message:'We can offer ₹5,800/quintal for 8 tonnes of Groundnut. Interested?', last_at:'2026-04-26T10:00:00Z', unread:1 },
    { id:'sc4', other_name:'Ravi Organic Farm Store', other_avatar:null, other_id:'u4', context_type:'agrigalaxy', last_message:'We have Neem Oil back in stock. Shall I reserve 5 litres for you?', last_at:'2026-04-25T14:00:00Z', unread:0 },
    { id:'sc5', other_name:'Venkat Farms', other_avatar:null, other_id:'u5', context_type:'bhoomios', last_message:'The 3-acre plot is still available. When would you like to visit?', last_at:'2026-04-24T11:00:00Z', unread:0 },
  ];

  const SAMPLE_MESSAGES = [
    { id:'m1', sender_id:'u1', sender_name:'Sri Lakshmi Agri Inputs', body:'Hello! Thank you for your order of DAP Fertilizer (2 bags).', is_read:true, created_at:'2026-04-27T08:30:00Z' },
    { id:'m2', sender_id:'me', sender_name:'You', body:'When will it be delivered?', is_read:true, created_at:'2026-04-27T08:35:00Z' },
    { id:'m3', sender_id:'u1', sender_name:'Sri Lakshmi Agri Inputs', body:'Your order for DAP Fertilizer has been confirmed. Delivery in 2 days.', is_read:true, created_at:'2026-04-27T09:00:00Z' },
    { id:'m4', sender_id:'u1', sender_name:'Sri Lakshmi Agri Inputs', body:'We will deliver to your address in Guntur. The delivery person will call you before arrival.', is_read:false, created_at:'2026-04-27T09:05:00Z' },
  ];

  function render() {
    if (activeConvo) return renderChatDetail();
    renderConvoList();
  }

  function renderConvoList() {
    const unreadTotal = conversations.reduce((s, c) => s + Number(c.unread || 0), 0);
    container.innerHTML = `
      <div style="background:linear-gradient(135deg,#1565C0,#0D47A1);color:white;padding:14px 16px 12px">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:28px">💬</span>
          <div style="flex:1">
            <div style="font-weight:800;font-size:18px">${t('messages') || 'Messages'}</div>
            <div style="font-size:11px;opacity:0.85">${unreadTotal > 0 ? `${unreadTotal} ${t('unread') || 'unread'}` : t('all_caught_up') || 'All caught up'}</div>
          </div>
        </div>
      </div>

      <div style="padding:10px 14px 80px">
        ${loading ? '<div class="loading"><div class="spinner"></div></div>' : ''}
        ${!loading && conversations.length === 0 ? `
          <div style="text-align:center;padding:40px 20px">
            <div style="font-size:56px;margin-bottom:10px">💬</div>
            <div style="font-weight:700;font-size:15px;margin-bottom:6px">${t('no_messages') || 'No messages yet'}</div>
            <div style="font-size:12px;color:#757575;line-height:1.5">Start a conversation by contacting a seller, equipment owner, or buyer from any marketplace.</div>
          </div>
        ` : conversations.map(c => `
          <div class="convo-item" data-cid="${c.id}" style="background:white;border-radius:12px;margin-bottom:8px;padding:12px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.06);cursor:pointer;display:flex;gap:12px;align-items:center;${Number(c.unread)>0?'border-left:3px solid #1565C0':''}">
            <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#E3F2FD,#BBDEFB);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">
              ${c.other_avatar ? `<img src="${c.other_avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">` : contextIcon(c.context_type)}
            </div>
            <div style="flex:1;min-width:0">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <div style="font-weight:700;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.other_name || 'User'}</div>
                <div style="font-size:10px;color:#9E9E9E;flex-shrink:0;margin-left:8px">${timeAgo(c.last_at)}</div>
              </div>
              <div style="font-size:11px;color:${Number(c.unread)>0?'#424242':'#9E9E9E'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;${Number(c.unread)>0?'font-weight:600':''}">${c.last_message || ''}</div>
              <div style="display:flex;gap:4px;margin-top:4px">
                <span style="background:#E3F2FD;color:#1565C0;padding:1px 6px;border-radius:6px;font-size:9px;font-weight:600">${contextLabel(c.context_type)}</span>
                ${Number(c.unread) > 0 ? `<span style="background:#1565C0;color:white;padding:1px 6px;border-radius:8px;font-size:9px;font-weight:700">${c.unread}</span>` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelectorAll('.convo-item').forEach(el => {
      el.addEventListener('click', () => {
        activeConvo = conversations.find(c => c.id === el.dataset.cid);
        messages = [];
        loadMessages();
      });
    });
  }

  function renderChatDetail() {
    const me = getState().user;
    const myId = me?.id || 'me';

    container.innerHTML = `
      <div style="background:linear-gradient(135deg,#1565C0,#0D47A1);color:white;padding:12px 16px;display:flex;align-items:center;gap:12px">
        <button id="chatBackBtn" style="background:rgba(255,255,255,0.2);border:none;color:white;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px">←</button>
        <div style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:18px">${contextIcon(activeConvo.context_type)}</div>
        <div style="flex:1">
          <div style="font-weight:700;font-size:14px">${activeConvo.other_name}</div>
          <div style="font-size:10px;opacity:0.8">${contextLabel(activeConvo.context_type)}</div>
        </div>
      </div>

      <div id="msgContainer" style="padding:10px 14px;overflow-y:auto;height:calc(100vh - 180px);display:flex;flex-direction:column;gap:6px">
        ${messages.map(m => {
          const isMe = m.sender_id === myId || m.sender_id === 'me';
          return `
          <div style="display:flex;justify-content:${isMe?'flex-end':'flex-start'}">
            <div style="max-width:80%;padding:10px 14px;border-radius:${isMe?'14px 14px 4px 14px':'14px 14px 14px 4px'};background:${isMe?'#1565C0':'white'};color:${isMe?'white':'#424242'};box-shadow:0 1px 3px rgba(0,0,0,0.08)">
              ${!isMe ? `<div style="font-size:10px;font-weight:600;color:#1565C0;margin-bottom:3px">${m.sender_name || 'User'}</div>` : ''}
              <div style="font-size:13px;line-height:1.5">${escapeHtml(m.body)}</div>
              <div style="font-size:9px;${isMe?'color:rgba(255,255,255,0.7)':'color:#9E9E9E'};text-align:right;margin-top:3px">${formatTime(m.created_at)}${isMe && m.is_read ? ' ✓✓' : isMe ? ' ✓' : ''}</div>
            </div>
          </div>`;
        }).join('')}
      </div>

      <div style="position:fixed;bottom:0;left:0;right:0;background:white;padding:10px 14px;border-top:1px solid #E0E0E0;display:flex;gap:8px;z-index:100">
        <input id="msgInput" type="text" placeholder="${t('type_message') || 'Type a message...'}" style="flex:1;padding:10px 14px;border:1px solid #E0E0E0;border-radius:20px;font-size:13px;outline:none" autocomplete="off">
        <button id="sendBtn" style="width:40px;height:40px;border-radius:50%;background:#1565C0;color:white;border:none;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center">➤</button>
      </div>
    `;

    // Scroll to bottom
    const mc = document.querySelector('#msgContainer');
    if (mc) mc.scrollTop = mc.scrollHeight;

    // Events
    document.querySelector('#chatBackBtn')?.addEventListener('click', () => {
      activeConvo = null;
      messages = [];
      render();
    });

    const input = document.querySelector('#msgInput');
    const sendBtn = document.querySelector('#sendBtn');

    async function doSend() {
      const body = input?.value?.trim();
      if (!body || sending) return;
      sending = true;
      try {
        const res = await api.sendMessage({ conversation_id: activeConvo.id, body });
        messages.push({ ...res.message, sender_id: myId, sender_name: 'You' });
        input.value = '';
        render();
      } catch (e) {
        // Demo fallback — add locally
        messages.push({ id: 'local_' + Date.now(), sender_id: myId, sender_name: 'You', body, is_read: false, created_at: new Date().toISOString() });
        input.value = '';
        render();
      }
      sending = false;
    }

    sendBtn?.addEventListener('click', doSend);
    input?.addEventListener('keydown', e => { if (e.key === 'Enter') doSend(); });
    input?.focus();
  }

  function contextIcon(type) {
    const map = { agrigalaxy:'🌐', aquaos:'🐟', agriflow:'🌾', kisanconnect:'🚜', bhoomios:'🏡', farmerconnect:'🏠' };
    return map[type] || '💬';
  }

  function contextLabel(type) {
    const map = { agrigalaxy:'AgriGalaxy', aquaos:'AquaOS', agriflow:'AgriFlow', kisanconnect:'KisanConnect', bhoomios:'BhoomiOS', farmerconnect:'FarmerConnect' };
    return map[type] || 'Chat';
  }

  function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  }

  function formatTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
  }

  function escapeHtml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  async function loadMessages() {
    if (!activeConvo) return;
    try {
      const res = await api.getMessages(activeConvo.id);
      messages = res.messages || [];
    } catch (e) {
      messages = SAMPLE_MESSAGES;
    }
    render();
  }

  async function loadData() {
    loading = true; render();
    try {
      const res = await api.getConversations();
      conversations = (res.conversations || []);
      if (conversations.length === 0) conversations = SAMPLE_CONVOS;
    } catch (e) {
      conversations = SAMPLE_CONVOS;
    }
    loading = false; render();
  }

  loadData();
}
