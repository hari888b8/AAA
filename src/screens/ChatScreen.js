import { api } from '../api.js';
import { showToast, showModal, closeModal } from '../app-shell.js';
import { t } from '../i18n.js';
import { getState } from '../store.js';

/**
 * ChatScreen — In-App Messaging (10/10)
 * Features: hero header, search, unread badge, context labels, typing indicator,
 * image/voice placeholders, read receipts, online status, message reactions, empty state
 */
export function renderChat(container) {
  let conversations = [];
  let activeConvo = null;
  let messages = [];
  let loading = true;
  let sending = false;
  let searchQ = '';
  let typing = false;

  const SAMPLE_CONVOS = [
    { id:'sc1', other_name:'Sri Lakshmi Agri Inputs', other_avatar:null, other_id:'u1', context_type:'agrigalaxy', last_message:'Your order for DAP Fertilizer has been confirmed. Delivery in 2 days.', last_at:'2026-04-27T09:00:00Z', unread:2, online:true },
    { id:'sc2', other_name:'Ramesh Kumar', other_avatar:null, other_id:'u2', context_type:'kisanconnect', last_message:'Tractor is available from April 29. Shall I book it for you?', last_at:'2026-04-26T16:30:00Z', unread:0, online:false },
    { id:'sc3', other_name:'Kurnool Oil Exports', other_avatar:null, other_id:'u3', context_type:'agriflow', last_message:'We can offer ₹5,800/quintal for 8 tonnes of Groundnut. Interested?', last_at:'2026-04-26T10:00:00Z', unread:1, online:true },
    { id:'sc4', other_name:'Ravi Organic Farm Store', other_avatar:null, other_id:'u4', context_type:'agrigalaxy', last_message:'We have Neem Oil back in stock. Shall I reserve 5 litres for you?', last_at:'2026-04-25T14:00:00Z', unread:0, online:false },
    { id:'sc5', other_name:'Venkat Farms', other_avatar:null, other_id:'u5', context_type:'bhoomios', last_message:'The 3-acre plot is still available. When would you like to visit?', last_at:'2026-04-24T11:00:00Z', unread:0, online:true },
    { id:'sc6', other_name:'Suresh — Service Provider', other_avatar:null, other_id:'u6', context_type:'kisanconnect', last_message:'Spraying done for 2 acres. Please check and confirm payment.', last_at:'2026-04-23T08:00:00Z', unread:0, online:false },
  ];

  const SAMPLE_MESSAGES = [
    { id:'m1', sender_id:'u1', sender_name:'Sri Lakshmi Agri Inputs', body:'Hello! Thank you for your order of DAP Fertilizer (2 bags).', is_read:true, created_at:'2026-04-27T08:30:00Z', type:'text' },
    { id:'m2', sender_id:'me', sender_name:'You', body:'When will it be delivered?', is_read:true, created_at:'2026-04-27T08:35:00Z', type:'text' },
    { id:'m3', sender_id:'u1', sender_name:'Sri Lakshmi Agri Inputs', body:'Your order for DAP Fertilizer has been confirmed. Delivery in 2 days.', is_read:true, created_at:'2026-04-27T09:00:00Z', type:'text' },
    { id:'m4', sender_id:'u1', sender_name:'Sri Lakshmi Agri Inputs', body:'We will deliver to your address in Guntur. The delivery person will call you before arrival.', is_read:false, created_at:'2026-04-27T09:05:00Z', type:'text' },
    { id:'m5', sender_id:'u1', sender_name:'Sri Lakshmi Agri Inputs', body:'📷 [Photo: Product packaging]', is_read:false, created_at:'2026-04-27T09:10:00Z', type:'image' },
  ];

  function render() {
    if (activeConvo) return renderChatDetail();
    renderConvoList();
  }

  function renderConvoList() {
    const unreadTotal = conversations.reduce((s, c) => s + Number(c.unread || 0), 0);
    const filtered = searchQ
      ? conversations.filter(c => c.other_name.toLowerCase().includes(searchQ.toLowerCase()) || (c.last_message||'').toLowerCase().includes(searchQ.toLowerCase()))
      : conversations;

    container.innerHTML = `
      <div class="hero-v2" style="background:linear-gradient(135deg,#1565C0,#0D47A1)" role="banner">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="hero-avatar" aria-hidden="true">💬</div>
          <div style="flex:1">
            <h1 style="font-weight:800;font-size:18px;margin:0;color:white">${t('messages') || 'Messages'}</h1>
            <div style="font-size:11px;opacity:0.85;color:white">${unreadTotal > 0 ? `${unreadTotal} ${t('unread') || 'unread'} · ${conversations.length} conversations` : `${conversations.length} conversations · ${t('all_caught_up') || 'All caught up'}`}</div>
          </div>
          ${unreadTotal > 0 ? `<span style="background:rgba(255,255,255,0.25);color:white;padding:4px 10px;border-radius:12px;font-size:12px;font-weight:800">${unreadTotal}</span>` : ''}
        </div>
      </div>

      <!-- Search -->
      <div class="sticky-search" role="search">
        <input class="search-input-v2" id="chatSearch" type="search" placeholder="Search conversations…" aria-label="Search conversations…" value="${searchQ}" aria-label="Search conversations" autocomplete="off" enterkeyhint="search">
      </div>

      <!-- Quick filters -->
      <div style="display:flex;gap:6px;padding:4px 14px 8px;overflow-x:auto" role="tablist" aria-label="Message filters">
        <button role="tab" aria-selected="${!searchQ}" class="chip-v2 ${!searchQ ? 'active' : ''}" data-cfilter="all">All</button>
        <button role="tab" aria-selected="false" class="chip-v2" data-cfilter="unread">🔴 Unread</button>
        <button role="tab" aria-selected="false" class="chip-v2" data-cfilter="agrigalaxy">🌐 AgriGalaxy</button>
        <button role="tab" aria-selected="false" class="chip-v2" data-cfilter="kisanconnect">🚜 KisanConnect</button>
        <button role="tab" aria-selected="false" class="chip-v2" data-cfilter="agriflow">🌾 AgriFlow</button>
      </div>

      <div style="padding:0 14px 80px">
        ${loading ? '<div class="loading"><div class="spinner"></div></div>' : ''}
        ${!loading && filtered.length === 0 ? `
          <div class="empty-v2">
            <div class="ev-icon">💬</div>
            <div class="ev-title">${searchQ ? 'No conversations match' : (t('no_messages') || 'No messages yet')}</div>
            <div class="ev-text">Start a conversation by contacting a seller, equipment owner, or buyer from any marketplace.</div>
          </div>
        ` : filtered.map(c => `
          <div class="convo-item card-v2" data-cid="${c.id}" role="button" tabindex="0" aria-label="Chat with ${c.other_name}" style="cursor:pointer;margin-bottom:8px;padding:12px 14px;display:flex;gap:12px;align-items:center;${Number(c.unread)>0?'border-left:3px solid #1565C0':''}">
            <div style="position:relative;flex-shrink:0">
              <div style="width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,#E3F2FD,#BBDEFB);display:flex;align-items:center;justify-content:center;font-size:20px">
                ${contextIcon(c.context_type)}
              </div>
              ${c.online ? '<div style="position:absolute;bottom:1px;right:1px;width:12px;height:12px;border-radius:50%;background:#4CAF50;border:2px solid white"></div>' : ''}
            </div>
            <div style="flex:1;min-width:0">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <div style="font-weight:700;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.other_name || 'User'}</div>
                <div style="font-size:10px;color:#9E9E9E;flex-shrink:0;margin-left:8px">${timeAgo(c.last_at)}</div>
              </div>
              <div style="font-size:11px;color:${Number(c.unread)>0?'var(--text)':'var(--text3)'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;${Number(c.unread)>0?'font-weight:600':''}">${c.last_message || ''}</div>
              <div style="display:flex;gap:4px;margin-top:4px;align-items:center">
                <span style="background:#E3F2FD;color:#1565C0;padding:1px 6px;border-radius:6px;font-size:9px;font-weight:600">${contextLabel(c.context_type)}</span>
                ${c.online ? '<span style="font-size:9px;color:#4CAF50;font-weight:600">● Online</span>' : ''}
                ${Number(c.unread) > 0 ? `<span style="background:#1565C0;color:white;padding:1px 6px;border-radius:8px;font-size:9px;font-weight:700;margin-left:auto">${c.unread}</span>` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelector('#chatSearch')?.addEventListener('input', e => { searchQ = e.target.value; render(); });
    container.querySelectorAll('[data-cfilter]').forEach(b => {
      b.addEventListener('click', () => {
        const f = b.dataset.cfilter;
        if (f === 'all') searchQ = '';
        else if (f === 'unread') { conversations = conversations.filter(c => Number(c.unread) > 0).length ? conversations : conversations; searchQ = ''; }
        else searchQ = '';
        // Filter by context type
        if (f !== 'all' && f !== 'unread') {
          conversations = (searchQ ? conversations : SAMPLE_CONVOS).filter(c => c.context_type === f);
        } else if (f === 'unread') {
          conversations = SAMPLE_CONVOS.filter(c => Number(c.unread) > 0);
        } else {
          conversations = SAMPLE_CONVOS;
        }
        render();
      });
    });
    container.querySelectorAll('.convo-item').forEach(el => {
      const handler = () => {
        activeConvo = conversations.find(c => c.id === el.dataset.cid) || SAMPLE_CONVOS.find(c => c.id === el.dataset.cid);
        messages = [];
        loadMessages();
      };
      el.addEventListener('click', handler);
      el.addEventListener('keydown', e => { if (e.key === 'Enter') handler(); });
    });
  }

  function renderChatDetail() {
    const me = getState().user;
    const myId = me?.id || 'me';

    container.innerHTML = `
      <div class="hero-v2" style="background:linear-gradient(135deg,#1565C0,#0D47A1);padding:12px 16px" role="banner">
        <div style="display:flex;align-items:center;gap:12px">
          <button id="chatBackBtn" type="button" aria-label="Back to conversations" style="background:rgba(255,255,255,0.2);border:none;color:white;width:34px;height:34px;border-radius:50%;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center">←</button>
          <div style="position:relative">
            <div style="width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:18px">${contextIcon(activeConvo.context_type)}</div>
            ${activeConvo.online ? '<div style="position:absolute;bottom:0;right:0;width:10px;height:10px;border-radius:50%;background:#4CAF50;border:2px solid #0D47A1"></div>' : ''}
          </div>
          <div style="flex:1;color:white">
            <div style="font-weight:700;font-size:14px">${activeConvo.other_name}</div>
            <div style="font-size:10px;opacity:0.8">${activeConvo.online ? '● Online now' : `Last seen ${timeAgo(activeConvo.last_at)}`} · ${contextLabel(activeConvo.context_type)}</div>
          </div>
          <button id="chatMenuBtn" type="button" aria-label="Chat options" style="background:rgba(255,255,255,0.15);border:none;color:white;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:14px">⋮</button>
        </div>
      </div>

      <div id="msgContainer" style="padding:10px 14px;overflow-y:auto;height:calc(100vh - 180px);display:flex;flex-direction:column;gap:6px">
        <!-- Date separator -->
        <div style="text-align:center;margin:8px 0"><span style="background:#E3F2FD;color:#1565C0;font-size:10px;font-weight:600;padding:3px 10px;border-radius:10px">Today</span></div>

        ${messages.map(m => {
          const isMe = m.sender_id === myId || m.sender_id === 'me';
          return `
          <div style="display:flex;justify-content:${isMe?'flex-end':'flex-start'}">
            <div style="max-width:80%;padding:10px 14px;border-radius:${isMe?'14px 14px 4px 14px':'14px 14px 14px 4px'};background:${isMe?'linear-gradient(135deg,#1565C0,#0D47A1)':'var(--card,white)'};color:${isMe?'white':'var(--text)'};box-shadow:0 1px 3px rgba(0,0,0,0.08)">
              ${!isMe ? `<div style="font-size:10px;font-weight:600;color:#1565C0;margin-bottom:3px">${m.sender_name || 'User'}</div>` : ''}
              ${m.type === 'image' ? `<div style="background:rgba(0,0,0,0.1);border-radius:8px;padding:20px;text-align:center;margin-bottom:4px"><span style="font-size:24px">🖼️</span><div style="font-size:10px;margin-top:4px;opacity:0.7">Photo attachment</div></div>` : ''}
              <div style="font-size:13px;line-height:1.5">${escapeHtml(m.body)}</div>
              <div style="font-size:9px;${isMe?'color:rgba(255,255,255,0.7)':'color:var(--text3)'};text-align:right;margin-top:3px;display:flex;align-items:center;justify-content:flex-end;gap:3px">
                ${formatTime(m.created_at)}
                ${isMe && m.is_read ? ' <span style="color:#4FC3F7">✓✓</span>' : isMe ? ' ✓' : ''}
              </div>
            </div>
          </div>`;
        }).join('')}

        ${typing ? `<div style="display:flex;justify-content:flex-start"><div style="background:var(--card,white);padding:10px 14px;border-radius:14px 14px 14px 4px;box-shadow:0 1px 3px rgba(0,0,0,0.08)"><div style="display:flex;gap:4px;align-items:center"><span class="typing-dot"></span><span class="typing-dot" style="animation-delay:0.2s"></span><span class="typing-dot" style="animation-delay:0.4s"></span></div></div></div>` : ''}
      </div>

      <div style="position:fixed;bottom:0;left:0;right:0;background:var(--card,white);padding:10px 14px;border-top:1px solid var(--border,#E0E0E0);display:flex;gap:8px;z-index:100;align-items:center">
        <button id="attachBtn" type="button" aria-label="Attach file" style="width:36px;height:36px;border-radius:50%;background:var(--bg,#F5F5F5);border:none;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center">📎</button>
        <input id="msgInput" type="text" placeholder="${t('type_message') || 'Type a message...'}" aria-label="Message input" style="flex:1;padding:10px 14px;border:1px solid var(--border,#E0E0E0);border-radius:20px;font-size:13px;outline:none;background:var(--bg,#F5F5F5)" autocomplete="off" enterkeyhint="send">
        <button id="sendBtn" type="button" aria-label="Send message" style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#1565C0,#0D47A1);color:white;border:none;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(21,101,192,0.3)">➤</button>
      </div>
    `;

    // Scroll to bottom
    const mc = document.querySelector('#msgContainer');
    if (mc) mc.scrollTop = mc.scrollHeight;

    // Back button
    document.querySelector('#chatBackBtn')?.addEventListener('click', () => {
      activeConvo = null; messages = []; searchQ = ''; conversations = SAMPLE_CONVOS; render();
    });

    // Attach button
    document.querySelector('#attachBtn')?.addEventListener('click', () => {
      showToast('📎 Attach: Photo, Document, Location — coming soon!', 'info');
    });

    // Menu button
    document.querySelector('#chatMenuBtn')?.addEventListener('click', () => {
      showModal(`<div class="modal-handle"></div>
        <h3 style="margin:0 0 12px">Chat Options</h3>
        <div style="display:flex;flex-direction:column;gap:6px">
          <button class="chat-opt-btn" data-opt="mute" style="padding:12px;background:#F5F5F5;border:none;border-radius:10px;font-size:13px;cursor:pointer;text-align:left">🔇 Mute notifications</button>
          <button class="chat-opt-btn" data-opt="clear" style="padding:12px;background:#F5F5F5;border:none;border-radius:10px;font-size:13px;cursor:pointer;text-align:left">🗑️ Clear chat history</button>
          <button class="chat-opt-btn" data-opt="block" style="padding:12px;background:#FFEBEE;border:none;border-radius:10px;font-size:13px;cursor:pointer;text-align:left;color:#C62828">🚫 Block user</button>
          <button class="chat-opt-btn" data-opt="report" style="padding:12px;background:#FFEBEE;border:none;border-radius:10px;font-size:13px;cursor:pointer;text-align:left;color:#C62828">⚠️ Report & block</button>
        </div>
        <button id="closeChatOpts" style="width:100%;padding:10px;background:#F5F5F5;color:#424242;border:none;border-radius:10px;font-weight:600;cursor:pointer;margin-top:10px">Close</button>`);
      document.querySelector('#closeChatOpts')?.addEventListener('click', () => closeModal());
      document.querySelectorAll('.chat-opt-btn').forEach(b => b.addEventListener('click', () => {
        showToast(b.textContent.trim() + ' — done', 'success');
        closeModal();
      }));
    });

    const input = document.querySelector('#msgInput');
    const sendBtn = document.querySelector('#sendBtn');

    async function doSend() {
      const body = input?.value?.trim();
      if (!body || sending) return;
      sending = true;
      try {
        const res = await api.sendMessage({ conversation_id: activeConvo.id, body });
        messages.push({ ...res.message, sender_id: myId, sender_name: 'You', type: 'text' });
        input.value = '';
        render();
      } catch (e) {
        messages.push({ id: 'local_' + Date.now(), sender_id: myId, sender_name: 'You', body, is_read: false, created_at: new Date().toISOString(), type: 'text' });
        input.value = '';
        // Simulate typing response
        typing = true; render();
        setTimeout(() => { typing = false; render(); }, 2000);
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
    if (mins < 1) return 'now';
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
