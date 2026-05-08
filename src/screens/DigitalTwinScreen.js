import { api } from '../api.js';
import { navigate } from '../main.js';

export function renderDigitalTwin(container) {
  container.innerHTML = `
    <div class="screen-container">
      <header class="screen-header">
        <button class="back-btn" onclick="navigateBack()">←</button>
        <h1>🌱 Digital Twin</h1>
      </header>

      <div class="tab-bar">
        <button class="tab active" data-tab="farms">My Farms</button>
        <button class="tab" data-tab="simulate">Simulate</button>
        <button class="tab" data-tab="sensors">Sensors</button>
        <button class="tab" data-tab="alerts">Alerts</button>
      </div>

      <div id="twin-content" class="content-area">
        <div class="loading-spinner">Loading...</div>
      </div>
    </div>
  `;

  const tabs = container.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadTwinTab(tab.dataset.tab, container);
    });
  });

  loadTwinTab('farms', container);
}

async function loadTwinTab(tab, container) {
  const content = container.querySelector('#twin-content');

  if (tab === 'farms') {
    try {
      const res = await api('/api/digital-twin/farms');
      const farms = res.farms || [];
      const healthColor = (s) => s > 70 ? '#2e7d32' : s > 40 ? '#f9a825' : '#c62828';
      content.innerHTML = `
        ${farms.length ? farms.map(f => `
          <div class="card" style="margin-bottom:10px;border-left:4px solid ${healthColor(f.health_score || 0)};">
            <div class="card-header" style="display:flex;justify-content:space-between;">
              <strong>${f.name}</strong>
              <span style="color:${healthColor(f.health_score || 0)};font-weight:bold;">${f.health_score || 0}/100</span>
            </div>
            <div class="card-body">
              <p>📐 ${f.area || '—'} acres | 🌍 ${f.soil_type || 'Unknown'}</p>
              <p style="font-size:0.8rem;color:#666;">${f.location || ''}</p>
            </div>
          </div>
        `).join('') : '<div class="empty-state"><p>No farms registered yet.</p></div>'}
        <h3 style="margin-top:16px;">Add Farm</h3>
        <form id="farm-form" class="form-container">
          <div class="form-group"><label>Farm Name</label><input type="text" name="name" required /></div>
          <div class="form-group"><label>Area (acres)</label><input type="number" name="area" step="0.1" required /></div>
          <div class="form-group"><label>Soil Type</label><select name="soil_type"><option>Alluvial</option><option>Black</option><option>Red</option><option>Laterite</option><option>Sandy</option></select></div>
          <div class="form-group"><label>Location</label><input type="text" name="location" /></div>
          <button type="submit" class="btn btn-primary btn-block">Add Farm</button>
        </form>
      `;
      content.querySelector('#farm-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        try {
          await api('/api/digital-twin/farms', { method: 'POST', body: JSON.stringify(Object.fromEntries(fd)) });
          loadTwinTab('farms', container);
        } catch (err) { alert('Error: ' + err.message); }
      });
    } catch (err) {
      content.innerHTML = `<div class="error">${err.message}</div>`;
    }
  } else if (tab === 'simulate') {
    content.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div class="card" style="padding:12px;">
          <h3>🌾 Crop Simulation</h3>
          <form id="crop-sim" class="form-container">
            <div class="form-group"><label>Crop</label><input type="text" name="crop" required /></div>
            <div class="form-group"><label>Farm ID</label><input type="text" name="farm_id" required /></div>
            <div class="form-group"><label>Season</label><select name="season"><option>Kharif</option><option>Rabi</option><option>Zaid</option></select></div>
            <button type="submit" class="btn btn-primary btn-block">Run Simulation</button>
          </form>
        </div>
        <div class="card" style="padding:12px;">
          <h3>🌧️ Weather Impact</h3>
          <form id="weather-sim" class="form-container">
            <div class="form-group"><label>Farm ID</label><input type="text" name="farm_id" required /></div>
            <div class="form-group"><label>Scenario</label><select name="scenario"><option>Drought</option><option>Flood</option><option>Heatwave</option><option>Normal</option></select></div>
            <button type="submit" class="btn btn-primary btn-block">Simulate</button>
          </form>
        </div>
        <div class="card" style="padding:12px;">
          <h3>💧 Irrigation Simulation</h3>
          <form id="irrig-sim" class="form-container">
            <div class="form-group"><label>Farm ID</label><input type="text" name="farm_id" required /></div>
            <div class="form-group"><label>Method</label><select name="method"><option>Drip</option><option>Sprinkler</option><option>Flood</option></select></div>
            <button type="submit" class="btn btn-primary btn-block">Simulate</button>
          </form>
        </div>
        <div id="sim-results"></div>
      </div>
    `;
    const handleSim = (formId, endpoint) => {
      content.querySelector('#' + formId).addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const resultsDiv = content.querySelector('#sim-results');
        resultsDiv.innerHTML = '<div class="loading-spinner">Running simulation...</div>';
        try {
          const res = await api(endpoint, { method: 'POST', body: JSON.stringify(Object.fromEntries(fd)) });
          const r = res.result || res;
          resultsDiv.innerHTML = `<div class="card" style="padding:12px;background:#e8f5e9;margin-top:8px;"><h3>Results</h3>${Object.entries(r).map(([k, v]) => `<p><strong>${k}:</strong> ${v}</p>`).join('')}</div>`;
        } catch (err) { resultsDiv.innerHTML = `<div class="error">${err.message}</div>`; }
      });
    };
    handleSim('crop-sim', '/api/digital-twin/simulate/crop');
    handleSim('weather-sim', '/api/digital-twin/simulate/weather');
    handleSim('irrig-sim', '/api/digital-twin/simulate/irrigation');
  } else if (tab === 'sensors') {
    try {
      const res = await api('/api/digital-twin/sensors');
      const sensors = res.sensors || [];
      const statusColor = { active: '#2e7d32', inactive: '#c62828', warning: '#f9a825' };
      content.innerHTML = `
        ${sensors.length ? sensors.map(s => `
          <div class="card" style="margin-bottom:10px;">
            <div class="card-header" style="display:flex;justify-content:space-between;">
              <strong>${s.name || s.type}</strong>
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${statusColor[s.status] || '#757575'};"></span>
            </div>
            <div class="card-body">
              <p>Latest: <strong>${s.latest_value || '—'}</strong> ${s.unit || ''}</p>
              <p style="font-size:0.8rem;color:#666;">Farm: ${s.farm_name || s.farm_id || '—'} | Updated: ${s.updated_at ? new Date(s.updated_at).toLocaleString() : '—'}</p>
            </div>
          </div>
        `).join('') : '<div class="empty-state"><p>No sensors registered.</p></div>'}
        <h3 style="margin-top:16px;">Add Sensor</h3>
        <form id="sensor-form" class="form-container">
          <div class="form-group"><label>Type</label><select name="type"><option>Soil Moisture</option><option>Temperature</option><option>Humidity</option><option>pH</option><option>Rainfall</option></select></div>
          <div class="form-group"><label>Farm ID</label><input type="text" name="farm_id" required /></div>
          <div class="form-group"><label>Name</label><input type="text" name="name" /></div>
          <button type="submit" class="btn btn-primary btn-block">Add Sensor</button>
        </form>
      `;
      content.querySelector('#sensor-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        try {
          await api('/api/digital-twin/sensors', { method: 'POST', body: JSON.stringify(Object.fromEntries(fd)) });
          loadTwinTab('sensors', container);
        } catch (err) { alert('Error: ' + err.message); }
      });
    } catch (err) {
      content.innerHTML = `<div class="error">${err.message}</div>`;
    }
  } else if (tab === 'alerts') {
    try {
      const res = await api('/api/digital-twin/alerts');
      const alerts = res.alerts || [];
      if (!alerts.length) {
        content.innerHTML = '<div class="empty-state"><p>No active alerts.</p></div>';
        return;
      }
      const sevIcon = { high: '🔴', medium: '🟡', low: '🟢' };
      content.innerHTML = alerts.map(a => `
        <div class="card" style="margin-bottom:10px;border-left:4px solid ${a.severity === 'high' ? '#c62828' : a.severity === 'medium' ? '#f9a825' : '#2e7d32'};">
          <div class="card-header" style="display:flex;justify-content:space-between;">
            <span>${sevIcon[a.severity] || '🟡'} ${a.title || 'Alert'}</span>
            <button class="btn dismiss-alert" data-id="${a.id}" style="background:#ffebee;color:#c62828;padding:2px 8px;font-size:0.75rem;">Dismiss</button>
          </div>
          <div class="card-body">
            <p>${a.message || ''}</p>
            <p style="font-size:0.8rem;color:#666;">Farm: ${a.farm_name || '—'} | ${a.created_at ? new Date(a.created_at).toLocaleString() : ''}</p>
          </div>
        </div>
      `).join('');
      content.querySelectorAll('.dismiss-alert').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await api('/api/digital-twin/alerts/' + btn.dataset.id + '/dismiss', { method: 'POST' });
            loadTwinTab('alerts', container);
          } catch (err) { alert('Error: ' + err.message); }
        });
      });
    } catch (err) {
      content.innerHTML = `<div class="error">${err.message}</div>`;
    }
  }
}
