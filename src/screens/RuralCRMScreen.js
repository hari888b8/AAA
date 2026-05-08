import { api } from '../api.js';
import { navigate } from '../main.js';

export function renderRuralCRM(container) {
  container.innerHTML = `
    <div class="screen-container">
      <header class="screen-header">
        <button class="back-btn" onclick="navigateBack()">←</button>
        <h1>📇 Rural CRM</h1>
      </header>

      <div class="tab-bar">
        <button class="tab active" data-tab="contacts">Contacts</button>
        <button class="tab" data-tab="pipeline">Pipeline</button>
        <button class="tab" data-tab="tasks">Tasks</button>
        <button class="tab" data-tab="campaigns">Campaigns</button>
      </div>

      <div id="crm-content" class="content-area">
        <div class="loading-spinner">Loading...</div>
      </div>
    </div>
  `;

  const tabs = container.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadCRMTab(tab.dataset.tab, container);
    });
  });

  loadCRMTab('contacts', container);
}

async function loadCRMTab(tab, container) {
  const content = container.querySelector('#crm-content');

  if (tab === 'contacts') {
    try {
      const res = await api('/api/rural-crm/contacts');
      const contacts = res.contacts || [];
      const roleBadge = { farmer: '#2e7d32', buyer: '#1565c0', fpo: '#e65100' };
      content.innerHTML = `
        <div style="display:flex;gap:8px;margin-bottom:12px;">
          <input type="text" id="contact-search" placeholder="Search contacts..." style="flex:1;padding:8px;border:1px solid #ccc;border-radius:6px;" />
        </div>
        <div id="contacts-list">
          ${contacts.length ? contacts.map(c => `
            <div class="card contact-card" data-name="${(c.name || '').toLowerCase()}" style="margin-bottom:8px;">
              <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                <strong>${c.name}</strong>
                <span style="background:${roleBadge[c.role] || '#757575'};color:#fff;padding:2px 8px;border-radius:12px;font-size:0.75rem;">${c.role || 'other'}</span>
              </div>
              <div class="card-body">
                <p>${c.phone || ''} ${c.village ? '| ' + c.village : ''}</p>
              </div>
            </div>
          `).join('') : '<div class="empty-state"><p>No contacts yet.</p></div>'}
        </div>
        <h3 style="margin-top:16px;">Add Contact</h3>
        <form id="contact-form" class="form-container">
          <div class="form-group"><label>Name</label><input type="text" name="name" required /></div>
          <div class="form-group"><label>Phone</label><input type="tel" name="phone" /></div>
          <div class="form-group"><label>Role</label><select name="role"><option>farmer</option><option>buyer</option><option>fpo</option></select></div>
          <div class="form-group"><label>Village</label><input type="text" name="village" /></div>
          <button type="submit" class="btn btn-primary btn-block">Add Contact</button>
        </form>
      `;
      content.querySelector('#contact-search').addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        content.querySelectorAll('.contact-card').forEach(card => {
          card.style.display = card.dataset.name.includes(q) ? '' : 'none';
        });
      });
      content.querySelector('#contact-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        try {
          await api('/api/rural-crm/contacts', { method: 'POST', body: JSON.stringify(Object.fromEntries(fd)) });
          loadCRMTab('contacts', container);
        } catch (err) { alert('Error: ' + err.message); }
      });
    } catch (err) {
      content.innerHTML = `<div class="error">${err.message}</div>`;
    }
  } else if (tab === 'pipeline') {
    try {
      const res = await api('/api/rural-crm/pipeline');
      const deals = res.deals || [];
      const stages = ['Lead', 'Qualified', 'Negotiation', 'Closed'];
      const stageColor = { Lead: '#90caf9', Qualified: '#fff9c4', Negotiation: '#ffcc80', Closed: '#a5d6a7' };
      content.innerHTML = `
        <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:8px;">
          ${stages.map(stage => `
            <div style="min-width:160px;flex:1;background:#fafafa;border-radius:8px;padding:8px;">
              <h4 style="text-align:center;padding:6px;background:${stageColor[stage]};border-radius:4px;margin-bottom:8px;">${stage}</h4>
              ${deals.filter(d => d.stage === stage).map(d => `
                <div class="card" style="margin-bottom:6px;padding:8px;">
                  <strong style="font-size:0.85rem;">${d.name || 'Deal'}</strong>
                  <p style="font-size:0.8rem;">₹${d.value || 0}</p>
                  <p style="font-size:0.75rem;color:#666;">${d.contact_name || ''}</p>
                </div>
              `).join('') || '<p style="text-align:center;font-size:0.8rem;color:#999;">No deals</p>'}
            </div>
          `).join('')}
        </div>
      `;
    } catch (err) {
      content.innerHTML = `<div class="error">${err.message}</div>`;
    }
  } else if (tab === 'tasks') {
    try {
      const res = await api('/api/rural-crm/tasks');
      const tasks = res.tasks || [];
      const prioColor = { high: '#c62828', medium: '#f9a825', low: '#2e7d32' };
      if (!tasks.length) {
        content.innerHTML = '<div class="empty-state"><p>No tasks pending.</p></div>';
        return;
      }
      content.innerHTML = tasks.map(t => `
        <div class="card" style="margin-bottom:8px;border-left:4px solid ${prioColor[t.priority] || '#757575'};opacity:${t.completed ? '0.6' : '1'};">
          <div class="card-body" style="display:flex;align-items:center;gap:8px;">
            <input type="checkbox" class="task-check" data-id="${t.id}" ${t.completed ? 'checked' : ''} />
            <div style="flex:1;">
              <strong style="${t.completed ? 'text-decoration:line-through;' : ''}">${t.title}</strong>
              <p style="font-size:0.8rem;color:#666;">${t.due_date ? 'Due: ' + new Date(t.due_date).toLocaleDateString() : ''} ${t.contact_name ? '| ' + t.contact_name : ''}</p>
            </div>
          </div>
        </div>
      `).join('');
      content.querySelectorAll('.task-check').forEach(cb => {
        cb.addEventListener('change', async () => {
          try {
            await api('/api/rural-crm/tasks/' + cb.dataset.id, { method: 'PUT', body: JSON.stringify({ completed: cb.checked }) });
          } catch (err) { alert('Error: ' + err.message); }
        });
      });
    } catch (err) {
      content.innerHTML = `<div class="error">${err.message}</div>`;
    }
  } else if (tab === 'campaigns') {
    try {
      const res = await api('/api/rural-crm/campaigns');
      const campaigns = res.campaigns || [];
      if (!campaigns.length) {
        content.innerHTML = '<div class="empty-state"><p>No campaigns created yet.</p></div>';
        return;
      }
      content.innerHTML = campaigns.map(c => `
        <div class="card" style="margin-bottom:10px;">
          <div class="card-header"><strong>${c.name}</strong></div>
          <div class="card-body">
            <p style="font-size:0.85rem;color:#666;margin-bottom:8px;">${c.description || ''}</p>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center;">
              <div><p style="font-weight:bold;color:#1565c0;">${c.sent || 0}</p><p style="font-size:0.75rem;">Sent</p></div>
              <div><p style="font-weight:bold;color:#2e7d32;">${c.opened || 0}</p><p style="font-size:0.75rem;">Opened</p></div>
              <div><p style="font-weight:bold;color:#e65100;">${c.responded || 0}</p><p style="font-size:0.75rem;">Responded</p></div>
            </div>
          </div>
        </div>
      `).join('');
    } catch (err) {
      content.innerHTML = `<div class="error">${err.message}</div>`;
    }
  }
}
