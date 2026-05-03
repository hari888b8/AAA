import { api } from '../api.js';
import { navigate } from '../main.js';

export function renderSatellite(container) {
  container.innerHTML = `
    <div class="screen-container">
      <header class="screen-header">
        <button class="back-btn" onclick="navigateBack()">←</button>
        <h1>🛰️ Satellite Monitoring</h1>
      </header>

      <div class="tab-bar">
        <button class="tab active" data-tab="fields">Field Health</button>
        <button class="tab" data-tab="alerts">Alerts</button>
        <button class="tab" data-tab="soil">Soil Health</button>
      </div>

      <div id="satellite-content" class="content-area">
        <div class="loading-spinner">Loading satellite data...</div>
      </div>
    </div>
  `;

  const tabs = container.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadSatelliteTab(tab.dataset.tab, container);
    });
  });

  loadSatelliteTab('fields', container);
}

async function loadSatelliteTab(tab, container) {
  const content = container.querySelector('#satellite-content');

  if (tab === 'fields') {
    try {
      const res = await api('/api/satellite/fields?days=30');
      const data = res.monitoring || [];

      if (!data.length) {
        content.innerHTML = '<div class="empty-state"><p>No field monitoring data yet. NDVI data will appear once satellite passes are processed.</p></div>';
        return;
      }

      content.innerHTML = `
        <div class="ndvi-summary">
          <h3>NDVI Timeline (Last 30 days)</h3>
          <div class="ndvi-chart">
            ${data.slice(0, 15).map(d => `
              <div class="ndvi-bar" style="height: ${Math.max(10, d.ndvi_value * 100)}%"
                   title="${d.ndvi_date}: ${d.ndvi_value}">
                <span class="ndvi-val">${(d.ndvi_value || 0).toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="field-cards">
          ${data.map(d => `
            <div class="card field-card status-${d.health_status}">
              <span class="health-dot health-${d.health_status}"></span>
              <span>NDVI: ${(d.ndvi_value || 0).toFixed(3)}</span>
              <span>${new Date(d.ndvi_date).toLocaleDateString()}</span>
              <span class="status">${d.health_status}</span>
            </div>
          `).join('')}
        </div>
      `;
    } catch (err) {
      content.innerHTML = `<div class="error">${err.message}</div>`;
    }
  } else if (tab === 'alerts') {
    try {
      const res = await api('/api/satellite/alerts');
      const alerts = res.alerts || [];

      if (!alerts.length) {
        content.innerHTML = '<div class="empty-state"><p>✅ No health alerts — your fields look good!</p></div>';
        return;
      }

      content.innerHTML = alerts.map(a => `
        <div class="card alert-card alert-${a.alert_type}">
          <div class="alert-icon">⚠️</div>
          <div class="alert-body">
            <strong>${a.alert_type}</strong>
            <p>${a.alert_message || 'Field health anomaly detected'}</p>
            <span class="alert-date">${new Date(a.ndvi_date).toLocaleDateString()}</span>
          </div>
        </div>
      `).join('');
    } catch (err) {
      content.innerHTML = `<div class="error">${err.message}</div>`;
    }
  } else if (tab === 'soil') {
    try {
      const res = await api('/api/satellite/soil');
      const records = res.soilRecords || [];

      if (!records.length) {
        content.innerHTML = `
          <div class="empty-state">
            <p>No soil health records. Add your Soil Health Card data:</p>
            <button class="btn btn-primary" id="add-soil-btn">+ Add Soil Record</button>
          </div>
        `;
        content.querySelector('#add-soil-btn')?.addEventListener('click', () => showSoilForm(content));
        return;
      }

      content.innerHTML = `
        <button class="btn btn-primary btn-sm" id="add-soil-btn">+ Add Record</button>
        ${records.map(r => `
          <div class="card soil-card">
            <h4>Test: ${r.test_date ? new Date(r.test_date).toLocaleDateString() : 'N/A'}</h4>
            <div class="soil-params">
              <div><strong>pH:</strong> ${r.ph_value || '-'}</div>
              <div><strong>N:</strong> ${r.nitrogen_kg_ha || '-'} kg/ha</div>
              <div><strong>P:</strong> ${r.phosphorus_kg_ha || '-'} kg/ha</div>
              <div><strong>K:</strong> ${r.potassium_kg_ha || '-'} kg/ha</div>
              <div><strong>OC:</strong> ${r.organic_carbon || '-'}%</div>
              <div><strong>Type:</strong> ${r.soil_type || '-'}</div>
            </div>
            ${r.lab_name ? `<p class="soil-lab">Lab: ${r.lab_name}</p>` : ''}
          </div>
        `).join('')}
      `;
      content.querySelector('#add-soil-btn')?.addEventListener('click', () => showSoilForm(content));
    } catch (err) {
      content.innerHTML = `<div class="error">${err.message}</div>`;
    }
  }
}

function showSoilForm(content) {
  content.innerHTML = `
    <form id="soil-form" class="form-container">
      <div class="form-group"><label>pH Value</label><input type="number" name="ph_value" step="0.1" min="0" max="14" /></div>
      <div class="form-group"><label>Nitrogen (kg/ha)</label><input type="number" name="nitrogen_kg_ha" step="0.1" /></div>
      <div class="form-group"><label>Phosphorus (kg/ha)</label><input type="number" name="phosphorus_kg_ha" step="0.1" /></div>
      <div class="form-group"><label>Potassium (kg/ha)</label><input type="number" name="potassium_kg_ha" step="0.1" /></div>
      <div class="form-group"><label>Organic Carbon %</label><input type="number" name="organic_carbon" step="0.01" /></div>
      <div class="form-group"><label>Soil Type</label><input type="text" name="soil_type" placeholder="e.g., Black, Red, Sandy" /></div>
      <div class="form-group"><label>Test Date</label><input type="date" name="test_date" /></div>
      <div class="form-group"><label>Lab Name</label><input type="text" name="lab_name" /></div>
      <button type="submit" class="btn btn-primary btn-block">Save Soil Record</button>
    </form>
  `;

  content.querySelector('#soil-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd);
    // Convert numeric strings
    ['ph_value', 'nitrogen_kg_ha', 'phosphorus_kg_ha', 'potassium_kg_ha', 'organic_carbon'].forEach(k => {
      if (data[k]) data[k] = parseFloat(data[k]);
    });
    try {
      await api('/api/satellite/soil', { method: 'POST', body: JSON.stringify(data) });
      alert('Soil record saved!');
    } catch (err) { alert('Error: ' + err.message); }
  });
}
