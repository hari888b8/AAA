import { api } from '../api.js';
import { navigate } from '../main.js';

export function renderExportIntelligence(container) {
  container.innerHTML = `
    <div class="screen-container">
      <header class="screen-header">
        <button class="back-btn" onclick="navigateBack()">←</button>
        <h1>📊 Export Intelligence</h1>
      </header>

      <div class="tab-bar">
        <button class="tab active" data-tab="markets">Markets</button>
        <button class="tab" data-tab="shipments">Shipments</button>
        <button class="tab" data-tab="compliance">Compliance</button>
        <button class="tab" data-tab="buyers">Buyers</button>
      </div>

      <div id="intel-content" class="content-area">
        <div class="loading-spinner">Loading...</div>
      </div>
    </div>
  `;

  const tabs = container.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadIntelTab(tab.dataset.tab, container);
    });
  });

  loadIntelTab('markets', container);
}

async function loadIntelTab(tab, container) {
  const content = container.querySelector('#intel-content');

  if (tab === 'markets') {
    try {
      const res = await api('/api/export-intelligence/markets');
      const markets = res.markets || [];
      if (!markets.length) {
        content.innerHTML = '<div class="empty-state"><p>No market data available.</p></div>';
        return;
      }
      content.innerHTML = markets.map(m => `
        <div class="card" style="margin-bottom:10px;">
          <div class="card-header" style="display:flex;justify-content:space-between;">
            <strong>${m.country_flag || '🌍'} ${m.country}</strong>
            <span>${m.demand_level === 'high' ? '🟢 High' : '🟡 Medium'} Demand</span>
          </div>
          <div class="card-body">
            <p><strong>Top Commodities:</strong></p>
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
              ${(m.commodities || []).map(c => `<span style="background:#e8f5e9;padding:2px 8px;border-radius:12px;font-size:0.8rem;">${c}</span>`).join('')}
            </div>
            ${m.avg_price ? `<p style="margin-top:6px;font-size:0.85rem;">Avg Price: ₹${m.avg_price}/kg</p>` : ''}
          </div>
        </div>
      `).join('');
    } catch (err) {
      content.innerHTML = `<div class="error">${err.message}</div>`;
    }
  } else if (tab === 'shipments') {
    try {
      const res = await api('/api/export-intelligence/shipments');
      const shipments = res.shipments || [];
      if (!shipments.length) {
        content.innerHTML = '<div class="empty-state"><p>No shipments tracked.</p></div>';
        return;
      }
      const stages = ['draft', 'booked', 'shipped', 'in_transit', 'delivered'];
      const stageColor = { draft: '#9e9e9e', booked: '#1565c0', shipped: '#f9a825', in_transit: '#e65100', delivered: '#2e7d32' };
      content.innerHTML = shipments.map(s => `
        <div class="card" style="margin-bottom:10px;">
          <div class="card-header"><strong>${s.commodity || 'Shipment'} → ${s.destination || '—'}</strong></div>
          <div class="card-body">
            <div style="display:flex;gap:4px;margin:8px 0;">
              ${stages.map(st => `<span style="flex:1;text-align:center;padding:4px;border-radius:4px;font-size:0.7rem;background:${stages.indexOf(s.status) >= stages.indexOf(st) ? stageColor[st] : '#e0e0e0'};color:${stages.indexOf(s.status) >= stages.indexOf(st) ? '#fff' : '#999'};">${st.replace('_', ' ')}</span>`).join('')}
            </div>
            <p>Qty: ${s.quantity_mt || '—'} MT | Value: ₹${s.value || '—'}</p>
            ${s.eta ? `<p style="font-size:0.8rem;color:#666;">ETA: ${new Date(s.eta).toLocaleDateString()}</p>` : ''}
          </div>
        </div>
      `).join('');
    } catch (err) {
      content.innerHTML = `<div class="error">${err.message}</div>`;
    }
  } else if (tab === 'compliance') {
    content.innerHTML = `
      <form id="compliance-form" class="form-container">
        <div class="form-group"><label>Destination Country</label><input type="text" name="country" required /></div>
        <div class="form-group"><label>Commodity</label><input type="text" name="commodity" required /></div>
        <button type="submit" class="btn btn-primary btn-block">Check Requirements</button>
      </form>
      <div id="compliance-results"></div>
    `;
    content.querySelector('#compliance-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const resultsDiv = content.querySelector('#compliance-results');
      resultsDiv.innerHTML = '<div class="loading-spinner">Checking...</div>';
      try {
        const res = await api('/api/export-intelligence/compliance', { method: 'POST', body: JSON.stringify(Object.fromEntries(fd)) });
        const c = res.compliance || {};
        resultsDiv.innerHTML = `
          <div class="card" style="margin-top:12px;padding:12px;background:#fff8e1;">
            <h3>📋 Required Documents</h3>
            <ul>${(c.documents || []).map(d => `<li>${d}</li>`).join('') || '<li>No specific documents listed</li>'}</ul>
            <h3 style="margin-top:12px;">🏅 Certifications</h3>
            <ul>${(c.certifications || []).map(cert => `<li>${cert}</li>`).join('') || '<li>No certifications required</li>'}</ul>
            ${c.notes ? `<p style="margin-top:8px;font-size:0.85rem;color:#666;">${c.notes}</p>` : ''}
          </div>
        `;
      } catch (err) { resultsDiv.innerHTML = `<div class="error">${err.message}</div>`; }
    });
  } else if (tab === 'buyers') {
    try {
      const res = await api('/api/export-intelligence/buyers');
      const buyers = res.buyers || [];
      if (!buyers.length) {
        content.innerHTML = '<div class="empty-state"><p>No buyers in directory.</p></div>';
        return;
      }
      content.innerHTML = buyers.map(b => `
        <div class="card" style="margin-bottom:10px;">
          <div class="card-header" style="display:flex;justify-content:space-between;">
            <strong>${b.country_flag || '🏳️'} ${b.name}</strong>
            <span style="font-size:0.85rem;color:#666;">${b.country || ''}</span>
          </div>
          <div class="card-body">
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;">
              ${(b.commodities || []).map(c => `<span style="background:#e3f2fd;padding:2px 8px;border-radius:12px;font-size:0.8rem;">${c}</span>`).join('')}
            </div>
            <button class="btn connect-buyer" data-id="${b.id}" style="background:#e8f5e9;color:#2e7d32;width:100%;">Connect</button>
          </div>
        </div>
      `).join('');
      content.querySelectorAll('.connect-buyer').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await api('/api/export-intelligence/buyers/' + btn.dataset.id + '/connect', { method: 'POST' });
            btn.textContent = '✓ Connected';
            btn.disabled = true;
          } catch (err) { alert('Error: ' + err.message); }
        });
      });
    } catch (err) {
      content.innerHTML = `<div class="error">${err.message}</div>`;
    }
  }
}
