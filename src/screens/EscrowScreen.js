import { api } from '../api.js';
import { navigate } from '../main.js';

export function renderEscrow(container) {
  container.innerHTML = `
    <div style="padding:16px;max-width:600px;margin:0 auto">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
        <span style="font-size:28px">🔐</span>
        <div>
          <h2 style="margin:0;font-size:18px;font-weight:800;color:#212121">Escrow Payments</h2>
          <p style="margin:0;font-size:11px;color:#666">Secure transactions with buyer protection</p>
        </div>
      </div>
      <div id="escrowTabs" style="display:flex;gap:8px;margin-bottom:16px">
        <button class="esc-tab active-tab" data-filter="" style="padding:8px 16px;border-radius:20px;border:1px solid #1a237e;background:#1a237e;color:white;font-size:12px;font-weight:600;cursor:pointer">All</button>
        <button class="esc-tab" data-filter="created" style="padding:8px 16px;border-radius:20px;border:1px solid #E0E0E0;background:white;color:#666;font-size:12px;font-weight:600;cursor:pointer">Pending</button>
        <button class="esc-tab" data-filter="funded" style="padding:8px 16px;border-radius:20px;border:1px solid #E0E0E0;background:white;color:#666;font-size:12px;font-weight:600;cursor:pointer">Funded</button>
        <button class="esc-tab" data-filter="disputed" style="padding:8px 16px;border-radius:20px;border:1px solid #E0E0E0;background:white;color:#666;font-size:12px;font-weight:600;cursor:pointer">Disputed</button>
      </div>
      <div id="escrowList"></div>
      <div id="escrowLoading" style="text-align:center;padding:40px;color:#999">Loading escrows...</div>
    </div>`;

  let activeFilter = '';
  container.querySelectorAll('.esc-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter;
      container.querySelectorAll('.esc-tab').forEach(b => {
        const isActive = b.dataset.filter === activeFilter;
        b.style.background = isActive ? '#1a237e' : 'white';
        b.style.color = isActive ? 'white' : '#666';
        b.style.borderColor = isActive ? '#1a237e' : '#E0E0E0';
        b.classList.toggle('active-tab', isActive);
      });
      loadEscrows(container, activeFilter);
    });
  });

  loadEscrows(container, activeFilter);
}

async function loadEscrows(container, filter) {
  const listEl = container.querySelector('#escrowList');
  const loadingEl = container.querySelector('#escrowLoading');
  loadingEl.style.display = 'block';
  listEl.innerHTML = '';

  try {
    const params = filter ? `?status=${filter}` : '';
    const res = await api.getEscrows(params);
    const escrows = res.escrows || [];
    loadingEl.style.display = 'none';

    if (escrows.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center;padding:40px;color:#999">
          <div style="font-size:40px;margin-bottom:8px">🔒</div>
          <div style="font-size:14px;font-weight:600">No escrow transactions</div>
          <div style="font-size:12px;margin-top:4px">Escrows are created when you place secured orders</div>
        </div>`;
      return;
    }

    const stateConfig = {
      created: { color: '#FF9800', label: 'Created', icon: '🟡' },
      funded: { color: '#2196F3', label: 'Funded', icon: '🔵' },
      delivery_confirmed: { color: '#00BCD4', label: 'Delivered', icon: '📦' },
      released: { color: '#4CAF50', label: 'Released', icon: '✅' },
      disputed: { color: '#F44336', label: 'Disputed', icon: '⚠️' },
      refunded: { color: '#9C27B0', label: 'Refunded', icon: '↩️' },
      cancelled: { color: '#9E9E9E', label: 'Cancelled', icon: '❌' },
    };

    listEl.innerHTML = escrows.map(e => {
      const cfg = stateConfig[e.state] || stateConfig.created;
      const date = new Date(e.created_at).toLocaleDateString('en-IN');
      return `
        <div class="escrow-card" data-id="${e.id}" style="background:white;border-radius:12px;padding:16px;border:1px solid #F0F0F0;margin-bottom:10px;box-shadow:0 1px 4px rgba(0,0,0,0.04)">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div style="font-size:20px;font-weight:800;color:#212121">₹${Number(e.amount).toLocaleString('en-IN')}</div>
              <div style="font-size:11px;color:#666;margin-top:4px">${e.description || 'Order escrow'} · ${date}</div>
              <div style="font-size:11px;color:#999;margin-top:2px">With: ${e.buyer_name || e.seller_name || 'User'}</div>
            </div>
            <div style="display:flex;align-items:center;gap:4px;background:${cfg.color}15;padding:4px 10px;border-radius:12px">
              <span style="font-size:12px">${cfg.icon}</span>
              <span style="font-size:11px;font-weight:700;color:${cfg.color}">${cfg.label}</span>
            </div>
          </div>
          ${['created', 'funded', 'delivery_confirmed'].includes(e.state) ? `
            <div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap" class="escrow-actions" data-escrow='${JSON.stringify({ id: e.id, state: e.state })}'>
              ${e.state === 'created' ? '<button class="esc-action-btn" data-action="fund" style="background:#2196F3;color:white;border:none;padding:6px 12px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer">💰 Fund</button>' : ''}
              ${e.state === 'funded' ? '<button class="esc-action-btn" data-action="confirm_delivery" style="background:#00BCD4;color:white;border:none;padding:6px 12px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer">📦 Confirm Delivery</button>' : ''}
              ${e.state === 'delivery_confirmed' ? '<button class="esc-action-btn" data-action="release" style="background:#4CAF50;color:white;border:none;padding:6px 12px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer">✅ Release Funds</button>' : ''}
              ${['funded', 'delivery_confirmed'].includes(e.state) ? '<button class="esc-action-btn" data-action="dispute" style="background:#F44336;color:white;border:none;padding:6px 12px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer">⚠️ Dispute</button>' : ''}
              ${['created', 'funded'].includes(e.state) ? '<button class="esc-action-btn" data-action="cancel" style="background:#9E9E9E;color:white;border:none;padding:6px 12px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer">Cancel</button>' : ''}
            </div>
          ` : ''}
        </div>`;
    }).join('');

    listEl.querySelectorAll('.esc-action-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const action = btn.dataset.action;
        let escrowData;
        try {
          escrowData = JSON.parse(btn.closest('.escrow-actions').dataset.escrow);
        } catch (parseErr) { alert('Error reading escrow data'); return; }
        
        let reason = '';
        if (action === 'dispute') {
          reason = prompt('Reason for dispute:');
          if (!reason) return;
        }
        if (!confirm(`Confirm: ${action.replace(/_/g, ' ')} this escrow?`)) return;

        try {
          await api.escrowAction(escrowData.id, { action, reason });
          loadEscrows(container, filter);
        } catch (e) { alert(e.message || 'Action failed'); }
      });
    });

  } catch (e) {
    loadingEl.textContent = 'Failed to load escrows';
  }
}
