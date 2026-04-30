import { api } from '../api.js';
import { navigate } from '../main.js';

export function renderTickets(container) {
  container.innerHTML = `
    <div style="padding:16px;max-width:600px;margin:0 auto">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:24px">🎫</span>
          <h2 style="margin:0;font-size:18px;font-weight:800;color:#212121">Support</h2>
        </div>
        <button id="newTicketBtn" style="background:#1a237e;color:white;border:none;padding:8px 16px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">+ New Ticket</button>
      </div>
      <div id="ticketForm" style="display:none;margin-bottom:16px"></div>
      <div id="ticketDetail" style="display:none;margin-bottom:16px"></div>
      <div id="ticketsList"></div>
      <div id="ticketsLoading" style="text-align:center;padding:40px;color:#999">Loading...</div>
    </div>`;

  container.querySelector('#newTicketBtn').addEventListener('click', () => showNewTicketForm(container));
  loadTickets(container);
}

function showNewTicketForm(container) {
  const formEl = container.querySelector('#ticketForm');
  formEl.style.display = 'block';
  formEl.innerHTML = `
    <div style="background:white;border-radius:14px;padding:18px;border:1px solid #E0E0E0">
      <h3 style="margin:0 0 14px;font-size:15px;font-weight:700;color:#212121">Create Support Ticket</h3>
      <select id="tCategory" style="width:100%;padding:10px;border:1px solid #E0E0E0;border-radius:8px;margin-bottom:10px;font-size:13px">
        <option value="">Select Category</option>
        <option value="payment">💳 Payment Issue</option>
        <option value="listing">📋 Listing Issue</option>
        <option value="account">👤 Account Issue</option>
        <option value="order">📦 Order Issue</option>
        <option value="technical">🔧 Technical Issue</option>
        <option value="other">❓ Other</option>
      </select>
      <input id="tSubject" type="text" placeholder="Subject" style="width:100%;padding:10px;border:1px solid #E0E0E0;border-radius:8px;margin-bottom:10px;font-size:13px;box-sizing:border-box">
      <textarea id="tDescription" placeholder="Describe your issue in detail..." rows="4" style="width:100%;padding:10px;border:1px solid #E0E0E0;border-radius:8px;margin-bottom:12px;font-size:13px;resize:vertical;box-sizing:border-box"></textarea>
      <div style="display:flex;gap:8px">
        <button id="submitTicketBtn" style="flex:1;background:#1a237e;color:white;border:none;padding:12px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer">Submit Ticket</button>
        <button id="cancelTicketBtn" style="background:#F5F5F5;color:#666;border:none;padding:12px 16px;border-radius:8px;font-size:13px;cursor:pointer">Cancel</button>
      </div>
    </div>`;

  formEl.querySelector('#cancelTicketBtn').addEventListener('click', () => { formEl.style.display = 'none'; });
  formEl.querySelector('#submitTicketBtn').addEventListener('click', async () => {
    const category = formEl.querySelector('#tCategory').value;
    const subject = formEl.querySelector('#tSubject').value.trim();
    const description = formEl.querySelector('#tDescription').value.trim();
    if (!category || !subject || !description) { alert('Please fill all fields'); return; }

    try {
      await api.createTicket({ category, subject, description });
      formEl.style.display = 'none';
      loadTickets(container);
    } catch (e) { alert(e.message); }
  });
}

async function loadTickets(container) {
  const listEl = container.querySelector('#ticketsList');
  const loadingEl = container.querySelector('#ticketsLoading');

  try {
    const res = await api.getTickets();
    const tickets = res.tickets || [];
    loadingEl.style.display = 'none';

    if (tickets.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center;padding:40px;color:#999">
          <div style="font-size:40px;margin-bottom:8px">✅</div>
          <div style="font-size:14px;font-weight:600">No support tickets</div>
          <div style="font-size:12px;margin-top:4px">Create one if you need help</div>
        </div>`;
      return;
    }

    const statusColors = { open: '#FF9800', in_progress: '#2196F3', waiting_customer: '#9C27B0', resolved: '#4CAF50', closed: '#9E9E9E' };
    const statusLabels = { open: 'Open', in_progress: 'In Progress', waiting_customer: 'Awaiting Reply', resolved: 'Resolved', closed: 'Closed' };

    listEl.innerHTML = tickets.map(t => {
      const color = statusColors[t.status] || '#999';
      const label = statusLabels[t.status] || t.status;
      const date = new Date(t.created_at).toLocaleDateString('en-IN');
      const categoryIcons = { payment: '💳', listing: '📋', account: '👤', order: '📦', technical: '🔧', other: '❓' };
      return `
        <div class="ticket-card" data-id="${t.id}" style="background:white;border-radius:12px;padding:14px;border:1px solid #F0F0F0;margin-bottom:10px;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,0.04)">
          <div style="display:flex;align-items:flex-start;gap:12px">
            <div style="font-size:22px">${categoryIcons[t.category] || '🎫'}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:600;color:#212121">${t.subject}</div>
              <div style="font-size:11px;color:#999;margin-top:3px">${date} · ${t.category}</div>
            </div>
            <span style="background:${color}20;color:${color};padding:3px 8px;border-radius:10px;font-size:10px;font-weight:700;white-space:nowrap">${label}</span>
          </div>
        </div>`;
    }).join('');

    listEl.querySelectorAll('.ticket-card').forEach(card => {
      card.addEventListener('click', () => showTicketDetail(container, card.dataset.id));
    });

  } catch (e) {
    loadingEl.textContent = 'Failed to load tickets';
  }
}

async function showTicketDetail(container, ticketId) {
  const detailEl = container.querySelector('#ticketDetail');
  container.querySelector('#ticketsList').style.display = 'none';
  detailEl.style.display = 'block';

  try {
    const res = await api.getTicket(ticketId);
    const ticket = res.ticket;
    const messages = res.messages || [];

    const statusColors = { open: '#FF9800', in_progress: '#2196F3', waiting_customer: '#9C27B0', resolved: '#4CAF50', closed: '#9E9E9E' };

    detailEl.innerHTML = `
      <div style="background:white;border-radius:14px;padding:18px;border:1px solid #E0E0E0">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
          <div>
            <div style="font-size:15px;font-weight:700;color:#212121">${ticket.subject}</div>
            <div style="font-size:11px;color:#999;margin-top:4px">${ticket.category} · ${new Date(ticket.created_at).toLocaleDateString('en-IN')}</div>
          </div>
          <span style="background:${statusColors[ticket.status]}20;color:${statusColors[ticket.status]};padding:3px 8px;border-radius:10px;font-size:10px;font-weight:700">${ticket.status.replace(/_/g, ' ')}</span>
        </div>
        <div style="background:#F5F5F5;border-radius:8px;padding:12px;font-size:12px;color:#424242;margin-bottom:14px">${ticket.description}</div>
        
        <div style="margin-bottom:12px">
          <div style="font-size:12px;font-weight:700;color:#666;margin-bottom:8px">Messages (${messages.length})</div>
          ${messages.map(m => `
            <div style="background:#F8F9FA;border-radius:8px;padding:10px;margin-bottom:6px;border-left:3px solid #1a237e">
              <div style="font-size:11px;color:#666;margin-bottom:4px"><strong>${m.sender_name}</strong> · ${new Date(m.created_at).toLocaleString('en-IN')}</div>
              <div style="font-size:12px;color:#212121">${m.content}</div>
            </div>
          `).join('') || '<div style="font-size:12px;color:#999;text-align:center;padding:12px">No messages yet</div>'}
        </div>

        ${ticket.status !== 'closed' ? `
          <div style="display:flex;gap:8px;margin-top:12px">
            <input id="ticketReply" type="text" placeholder="Type a reply..." style="flex:1;padding:10px;border:1px solid #E0E0E0;border-radius:8px;font-size:12px">
            <button id="sendReplyBtn" style="background:#1a237e;color:white;border:none;padding:10px 14px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">Send</button>
          </div>
          <button id="closeTicketBtn" style="width:100%;margin-top:10px;background:#FFEBEE;color:#C62828;border:none;padding:10px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer">Close Ticket</button>
        ` : ''}
        <button id="backToListBtn" style="width:100%;margin-top:8px;background:#F5F5F5;color:#666;border:none;padding:10px;border-radius:8px;font-size:12px;cursor:pointer">← Back to Tickets</button>
      </div>`;

    detailEl.querySelector('#backToListBtn').addEventListener('click', () => {
      detailEl.style.display = 'none';
      container.querySelector('#ticketsList').style.display = 'block';
    });

    detailEl.querySelector('#sendReplyBtn')?.addEventListener('click', async () => {
      const input = detailEl.querySelector('#ticketReply');
      const content = input.value.trim();
      if (!content) return;
      await api.addTicketMessage(ticketId, { content });
      showTicketDetail(container, ticketId);
    });

    detailEl.querySelector('#closeTicketBtn')?.addEventListener('click', async () => {
      if (confirm('Close this ticket?')) {
        await api.closeTicket(ticketId);
        detailEl.style.display = 'none';
        container.querySelector('#ticketsList').style.display = 'block';
        loadTickets(container);
      }
    });

  } catch (e) {
    detailEl.innerHTML = `<div style="color:red;text-align:center;padding:20px">Error loading ticket</div>`;
  }
}
