import { api } from '../api.js';
import { navigate } from '../main.js';
import { getState } from '../store.js';

export function renderContract(container) {
  container.innerHTML = `
    <div class="screen-container">
      <header class="screen-header">
        <button class="back-btn" onclick="navigateBack()">←</button>
        <h1>📝 Contract Farming</h1>
      </header>

      <div class="tab-bar">
        <button class="tab active" data-tab="my-contracts">My Contracts</button>
        <button class="tab" data-tab="create">Create New</button>
        <button class="tab" data-tab="milestones">Milestones</button>
      </div>

      <div id="contract-content" class="content-area">
        <div class="loading-spinner">Loading contracts...</div>
      </div>
    </div>
  `;

  const tabs = container.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadTab(tab.dataset.tab, container);
    });
  });

  loadTab('my-contracts', container);
}

async function loadTab(tab, container) {
  const content = container.querySelector('#contract-content');

  if (tab === 'my-contracts') {
    try {
      const res = await api('/api/contracts');
      const contracts = res.contracts || [];
      if (!contracts.length) {
        content.innerHTML = '<div class="empty-state"><p>No contracts yet.</p></div>';
        return;
      }
      content.innerHTML = contracts.map(c => `
        <div class="card contract-card">
          <div class="card-header">
            <span class="crop-badge">${c.crop_name}</span>
            <span class="status-badge status-${c.status}">${c.status}</span>
          </div>
          <div class="card-body">
            <p><strong>Quantity:</strong> ${c.quantity_kg} kg @ ₹${c.price_per_kg}/kg</p>
            <p><strong>Total Value:</strong> ₹${(c.quantity_kg * c.price_per_kg).toLocaleString()}</p>
            ${c.delivery_date ? `<p><strong>Delivery:</strong> ${new Date(c.delivery_date).toLocaleDateString()}</p>` : ''}
          </div>
          <div class="card-actions">
            ${c.status === 'proposed' ? `
              <button class="btn btn-success btn-sm" onclick="window._acceptContract('${c.id}')">Accept</button>
              <button class="btn btn-danger btn-sm" onclick="window._rejectContract('${c.id}')">Reject</button>
            ` : ''}
          </div>
        </div>
      `).join('');
    } catch (err) {
      content.innerHTML = `<div class="error">${err.message}</div>`;
    }
  } else if (tab === 'create') {
    content.innerHTML = `
      <form id="contract-form" class="form-container">
        <div class="form-group">
          <label>Farmer ID</label>
          <input type="text" name="farmer_id" placeholder="Enter farmer UUID" required />
        </div>
        <div class="form-group">
          <label>Crop</label>
          <input type="text" name="crop_name" placeholder="e.g., Rice, Cotton" required />
        </div>
        <div class="form-group">
          <label>Quantity (kg)</label>
          <input type="number" name="quantity_kg" placeholder="1000" required />
        </div>
        <div class="form-group">
          <label>Price per kg (₹)</label>
          <input type="number" name="price_per_kg" step="0.01" required />
        </div>
        <div class="form-group">
          <label>Delivery Date</label>
          <input type="date" name="delivery_date" />
        </div>
        <div class="form-group">
          <label>Advance %</label>
          <input type="number" name="advance_percent" value="0" min="0" max="50" />
        </div>
        <button type="submit" class="btn btn-primary btn-block">Create Contract</button>
      </form>
    `;

    content.querySelector('#contract-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await api('/api/contracts', {
          method: 'POST',
          body: JSON.stringify(Object.fromEntries(fd)),
        });
        loadTab('my-contracts', container);
      } catch (err) {
        alert('Error: ' + err.message);
      }
    });
  } else if (tab === 'milestones') {
    content.innerHTML = '<div class="empty-state"><p>Select a contract to view milestones</p></div>';
  }
}

window._acceptContract = async (id) => {
  try {
    await api(`/api/contracts/${id}/accept`, { method: 'PUT' });
    location.reload();
  } catch (err) { alert(err.message); }
};

window._rejectContract = async (id) => {
  const reason = prompt('Reason for rejection:');
  try {
    await api(`/api/contracts/${id}/reject`, { method: 'PUT', body: JSON.stringify({ reason }) });
    location.reload();
  } catch (err) { alert(err.message); }
};
