import { api } from '../api.js';
import { navigate } from '../main.js';

export function renderExporter(container) {
  container.innerHTML = `
    <div class="screen-container">
      <header class="screen-header">
        <button class="back-btn" onclick="navigateBack()">←</button>
        <h1>🌍 Exporter Dashboard</h1>
      </header>

      <div class="tab-bar">
        <button class="tab active" data-tab="orders">Export Orders</button>
        <button class="tab" data-tab="create">New Order</button>
      </div>

      <div id="exporter-content" class="content-area">
        <div class="loading-spinner">Loading...</div>
      </div>
    </div>
  `;

  const tabs = container.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadExporterTab(tab.dataset.tab, container);
    });
  });

  loadExporterTab('orders', container);
}

async function loadExporterTab(tab, container) {
  const content = container.querySelector('#exporter-content');

  if (tab === 'orders') {
    try {
      const res = await api('/api/exporter/orders');
      const orders = res.orders || [];

      if (!orders.length) {
        content.innerHTML = '<div class="empty-state"><p>No export orders yet. Create your first bulk procurement order.</p></div>';
        return;
      }

      content.innerHTML = orders.map(o => `
        <div class="card export-card">
          <div class="card-header">
            <span class="crop-badge">${o.crop_name}${o.variety ? ' (' + o.variety + ')' : ''}</span>
            <span class="status-badge status-${o.status}">${o.status}</span>
          </div>
          <div class="card-body">
            <p><strong>Quantity:</strong> ${o.quantity_mt} MT → ${o.destination_country || 'TBD'}</p>
            <p><strong>Target Price:</strong> ₹${o.target_price || 'Market'}/kg | Grade: ${o.quality_grade || 'Any'}</p>
            <p><strong>Fulfillment:</strong> ${o.fulfillment_pct || 0}%</p>
            ${o.ship_by_date ? `<p><strong>Ship by:</strong> ${new Date(o.ship_by_date).toLocaleDateString()}</p>` : ''}
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width: ${o.fulfillment_pct || 0}%"></div></div>
        </div>
      `).join('');
    } catch (err) {
      content.innerHTML = `<div class="error">${err.message}</div>`;
    }
  } else if (tab === 'create') {
    content.innerHTML = `
      <form id="export-form" class="form-container">
        <div class="form-group"><label>Crop</label><input type="text" name="crop_name" required /></div>
        <div class="form-group"><label>Variety</label><input type="text" name="variety" /></div>
        <div class="form-group"><label>Quantity (MT)</label><input type="number" name="quantity_mt" step="0.1" required /></div>
        <div class="form-group"><label>Target Price (₹/kg)</label><input type="number" name="target_price" step="0.01" /></div>
        <div class="form-group"><label>Quality Grade</label><select name="quality_grade"><option>FAQ</option><option>Premium</option><option>Export Grade</option></select></div>
        <div class="form-group"><label>Destination Country</label><input type="text" name="destination_country" /></div>
        <div class="form-group"><label>Shipping Port</label><input type="text" name="shipping_port" /></div>
        <div class="form-group"><label>Ship By Date</label><input type="date" name="ship_by_date" /></div>
        <button type="submit" class="btn btn-primary btn-block">Create Export Order</button>
      </form>
    `;

    content.querySelector('#export-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await api('/api/exporter/orders', { method: 'POST', body: JSON.stringify(Object.fromEntries(fd)) });
        loadExporterTab('orders', container);
      } catch (err) { alert('Error: ' + err.message); }
    });
  }
}
