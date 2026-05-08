import { api } from '../api.js';
import { navigate } from '../main.js';

export function renderDynamicPricing(container) {
  container.innerHTML = `
    <div class="screen-container">
      <header class="screen-header">
        <button class="back-btn" onclick="navigateBack()">←</button>
        <h1>📈 Dynamic Pricing</h1>
      </header>

      <div class="tab-bar">
        <button class="tab active" data-tab="prices">Prices</button>
        <button class="tab" data-tab="alerts">Alerts</button>
        <button class="tab" data-tab="forecast">Forecast</button>
        <button class="tab" data-tab="compare">Compare</button>
      </div>

      <div id="pricing-content" class="content-area">
        <div class="loading-spinner">Loading...</div>
      </div>
    </div>
  `;

  const tabs = container.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadPricingTab(tab.dataset.tab, container);
    });
  });

  loadPricingTab('prices', container);
}

async function loadPricingTab(tab, container) {
  const content = container.querySelector('#pricing-content');

  if (tab === 'prices') {
    try {
      const res = await api('/api/dynamic-pricing/prices');
      const prices = res.prices || [];
      const mandis = res.mandis || [];
      content.innerHTML = `
        <div style="margin-bottom:12px;">
          <select id="mandi-select" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:6px;">
            <option value="">All Mandis</option>
            ${mandis.map(m => `<option value="${m}">${m}</option>`).join('')}
          </select>
        </div>
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
            <thead>
              <tr style="background:#e8f5e9;">
                <th style="padding:8px;text-align:left;">Commodity</th>
                <th style="padding:8px;text-align:left;">Mandi</th>
                <th style="padding:8px;text-align:right;">Price (₹/qt)</th>
                <th style="padding:8px;text-align:right;">Change</th>
              </tr>
            </thead>
            <tbody id="price-body">
              ${prices.map(p => `
                <tr class="price-row" data-mandi="${p.mandi || ''}" style="border-bottom:1px solid #eee;">
                  <td style="padding:8px;">${p.commodity}</td>
                  <td style="padding:8px;">${p.mandi || '—'}</td>
                  <td style="padding:8px;text-align:right;">₹${p.price}</td>
                  <td style="padding:8px;text-align:right;color:${(p.change || 0) >= 0 ? '#2e7d32' : '#c62828'};">${(p.change || 0) >= 0 ? '▲' : '▼'} ${Math.abs(p.change || 0)}%</td>
                </tr>
              `).join('') || '<tr><td colspan="4" style="padding:16px;text-align:center;">No price data available</td></tr>'}
            </tbody>
          </table>
        </div>
      `;
      content.querySelector('#mandi-select').addEventListener('change', (e) => {
        const val = e.target.value;
        content.querySelectorAll('.price-row').forEach(row => {
          row.style.display = !val || row.dataset.mandi === val ? '' : 'none';
        });
      });
    } catch (err) {
      content.innerHTML = `<div class="error">${err.message}</div>`;
    }
  } else if (tab === 'alerts') {
    try {
      const res = await api('/api/dynamic-pricing/alerts');
      const alerts = res.alerts || [];
      content.innerHTML = `
        ${alerts.length ? alerts.map(a => `
          <div class="card" style="margin-bottom:8px;">
            <div class="card-header" style="display:flex;justify-content:space-between;">
              <strong>${a.commodity} @ ${a.mandi || 'Any'}</strong>
              <span style="background:${a.triggered ? '#e8f5e9' : '#f5f5f5'};color:${a.triggered ? '#2e7d32' : '#666'};padding:2px 8px;border-radius:12px;font-size:0.75rem;">${a.triggered ? '✓ Triggered' : 'Watching'}</span>
            </div>
            <div class="card-body">
              <p>${a.condition === 'above' ? '▲ Above' : '▼ Below'} ₹${a.target_price}/qt</p>
            </div>
          </div>
        `).join('') : '<div class="empty-state"><p>No alerts set.</p></div>'}
        <h3 style="margin-top:16px;">Add Alert</h3>
        <form id="alert-form" class="form-container">
          <div class="form-group"><label>Commodity</label><input type="text" name="commodity" required /></div>
          <div class="form-group"><label>Mandi</label><input type="text" name="mandi" /></div>
          <div class="form-group"><label>Condition</label><select name="condition"><option value="above">Price Above</option><option value="below">Price Below</option></select></div>
          <div class="form-group"><label>Target Price (₹/qt)</label><input type="number" name="target_price" step="0.01" required /></div>
          <button type="submit" class="btn btn-primary btn-block">Set Alert</button>
        </form>
      `;
      content.querySelector('#alert-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        try {
          await api('/api/dynamic-pricing/alerts', { method: 'POST', body: JSON.stringify(Object.fromEntries(fd)) });
          loadPricingTab('alerts', container);
        } catch (err) { alert('Error: ' + err.message); }
      });
    } catch (err) {
      content.innerHTML = `<div class="error">${err.message}</div>`;
    }
  } else if (tab === 'forecast') {
    content.innerHTML = `
      <div style="display:flex;gap:8px;margin-bottom:12px;">
        <input type="text" id="forecast-commodity" placeholder="Commodity..." style="flex:1;padding:8px;border:1px solid #ccc;border-radius:6px;" />
        <button id="forecast-btn" class="btn btn-primary">Forecast</button>
      </div>
      <div style="display:flex;gap:4px;margin-bottom:12px;">
        <button class="forecast-period active" data-days="7" style="flex:1;padding:6px;border:1px solid #2e7d32;border-radius:4px;background:#e8f5e9;cursor:pointer;">7 Days</button>
        <button class="forecast-period" data-days="14" style="flex:1;padding:6px;border:1px solid #ccc;border-radius:4px;background:#fff;cursor:pointer;">14 Days</button>
        <button class="forecast-period" data-days="30" style="flex:1;padding:6px;border:1px solid #ccc;border-radius:4px;background:#fff;cursor:pointer;">30 Days</button>
      </div>
      <div id="forecast-results"></div>
    `;
    let selectedDays = 7;
    content.querySelectorAll('.forecast-period').forEach(btn => {
      btn.addEventListener('click', () => {
        content.querySelectorAll('.forecast-period').forEach(b => { b.style.background = '#fff'; b.style.borderColor = '#ccc'; b.classList.remove('active'); });
        btn.style.background = '#e8f5e9';
        btn.style.borderColor = '#2e7d32';
        btn.classList.add('active');
        selectedDays = parseInt(btn.dataset.days);
      });
    });
    content.querySelector('#forecast-btn').addEventListener('click', async () => {
      const commodity = content.querySelector('#forecast-commodity').value;
      if (!commodity) { alert('Enter a commodity'); return; }
      const resultsDiv = content.querySelector('#forecast-results');
      resultsDiv.innerHTML = '<div class="loading-spinner">Forecasting...</div>';
      try {
        const res = await api('/api/dynamic-pricing/forecast', { method: 'POST', body: JSON.stringify({ commodity, days: selectedDays }) });
        const f = res.forecast || {};
        const points = f.points || [];
        resultsDiv.innerHTML = `
          <div class="card" style="padding:12px;margin-top:8px;">
            <h3>${commodity} — ${selectedDays} Day Forecast</h3>
            <div style="display:flex;justify-content:space-between;margin:12px 0;">
              <div style="text-align:center;"><p style="font-size:0.8rem;color:#666;">Current</p><p style="font-weight:bold;">₹${f.current || '—'}</p></div>
              <div style="text-align:center;font-size:1.5rem;">${(f.trend || 'stable') === 'up' ? '📈' : (f.trend || 'stable') === 'down' ? '📉' : '➡️'}</div>
              <div style="text-align:center;"><p style="font-size:0.8rem;color:#666;">Predicted</p><p style="font-weight:bold;color:${f.trend === 'up' ? '#2e7d32' : f.trend === 'down' ? '#c62828' : '#666'};">₹${f.predicted || '—'}</p></div>
            </div>
            ${points.length ? `
              <div style="font-family:monospace;font-size:0.75rem;background:#fafafa;padding:8px;border-radius:4px;">
                ${points.map(p => `<div style="display:flex;justify-content:space-between;"><span>${p.date}</span><span>₹${p.price}</span><span>${p.change >= 0 ? '↑' : '↓'}</span></div>`).join('')}
              </div>
            ` : ''}
          </div>
        `;
      } catch (err) { resultsDiv.innerHTML = `<div class="error">${err.message}</div>`; }
    });
  } else if (tab === 'compare') {
    content.innerHTML = `
      <form id="compare-form" class="form-container" style="margin-bottom:12px;">
        <div class="form-group"><label>Commodity</label><input type="text" name="commodity" required /></div>
        <button type="submit" class="btn btn-primary btn-block">Compare Mandis</button>
      </form>
      <div id="compare-results"></div>
    `;
    content.querySelector('#compare-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const resultsDiv = content.querySelector('#compare-results');
      resultsDiv.innerHTML = '<div class="loading-spinner">Comparing...</div>';
      try {
        const res = await api('/api/dynamic-pricing/compare', { method: 'POST', body: JSON.stringify(Object.fromEntries(fd)) });
        const data = res.comparison || {};
        const rows = data.mandis || [];
        const avg = data.avg_price || 0;
        resultsDiv.innerHTML = `
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
              <thead>
                <tr style="background:#e8f5e9;">
                  <th style="padding:8px;text-align:left;">Mandi</th>
                  <th style="padding:8px;text-align:right;">Price (₹/qt)</th>
                  <th style="padding:8px;text-align:right;">Diff from Avg</th>
                </tr>
              </thead>
              <tbody>
                ${rows.map(r => {
                  const diff = avg ? ((r.price - avg) / avg * 100).toFixed(1) : 0;
                  return `
                    <tr style="border-bottom:1px solid #eee;">
                      <td style="padding:8px;">${r.mandi}</td>
                      <td style="padding:8px;text-align:right;">₹${r.price}</td>
                      <td style="padding:8px;text-align:right;color:${diff >= 0 ? '#2e7d32' : '#c62828'};">${diff >= 0 ? '+' : ''}${diff}%</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            <p style="margin-top:8px;font-size:0.85rem;color:#666;text-align:center;">Average: ₹${avg}/qt</p>
          </div>
        `;
      } catch (err) { resultsDiv.innerHTML = `<div class="error">${err.message}</div>`; }
    });
  }
}
