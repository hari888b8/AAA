import { api } from '../api.js';
import { navigate } from '../main.js';

export function renderAnalytics(container) {
  container.innerHTML = `
    <div class="screen-container">
      <header class="screen-header">
        <button class="back-btn" onclick="navigateBack()">←</button>
        <h1>📊 District Analytics</h1>
      </header>

      <div class="tab-bar">
        <button class="tab active" data-tab="overview">Overview</button>
        <button class="tab" data-tab="prices">Price Trends</button>
        <button class="tab" data-tab="demand">Demand Signals</button>
      </div>

      <div id="analytics-content" class="content-area">
        <div class="loading-spinner">Loading analytics...</div>
      </div>
    </div>
  `;

  const tabs = container.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadAnalyticsTab(tab.dataset.tab, container);
    });
  });

  loadAnalyticsTab('overview', container);
}

async function loadAnalyticsTab(tab, container) {
  const content = container.querySelector('#analytics-content');

  if (tab === 'overview') {
    content.innerHTML = `
      <div class="analytics-grid">
        <div class="analytics-card">
          <div class="analytics-icon">👨‍🌾</div>
          <div class="analytics-stat">
            <span class="stat-label">Active Farmers</span>
            <span class="stat-value" id="stat-farmers">—</span>
          </div>
        </div>
        <div class="analytics-card">
          <div class="analytics-icon">📦</div>
          <div class="analytics-stat">
            <span class="stat-label">Total Orders</span>
            <span class="stat-value" id="stat-orders">—</span>
          </div>
        </div>
        <div class="analytics-card">
          <div class="analytics-icon">💰</div>
          <div class="analytics-stat">
            <span class="stat-label">Trade Volume</span>
            <span class="stat-value" id="stat-volume">—</span>
          </div>
        </div>
        <div class="analytics-card">
          <div class="analytics-icon">🤝</div>
          <div class="analytics-stat">
            <span class="stat-label">Active Contracts</span>
            <span class="stat-value" id="stat-contracts">—</span>
          </div>
        </div>
      </div>
      <p class="analytics-note">District-level analytics powered by aggregated platform data.</p>
    `;
  } else if (tab === 'prices') {
    try {
      const res = await api('/api/contracts/predictions/prices?days=30');
      const predictions = res.predictions || [];

      if (!predictions.length) {
        content.innerHTML = '<div class="empty-state"><p>No price prediction data available yet. Predictions are generated daily from market data.</p></div>';
        return;
      }

      content.innerHTML = `
        <h3>Price Predictions (Last 30 days)</h3>
        <div class="price-chart">
          ${predictions.map(p => `
            <div class="price-row">
              <span>${new Date(p.prediction_date).toLocaleDateString()}</span>
              <span>₹${parseFloat(p.predicted_price).toFixed(2)}</span>
              <span class="confidence">±${((1 - p.confidence) * 100).toFixed(0)}%</span>
            </div>
          `).join('')}
        </div>
      `;
    } catch (err) {
      content.innerHTML = `<div class="error">${err.message}</div>`;
    }
  } else if (tab === 'demand') {
    content.innerHTML = `
      <div class="demand-signals">
        <div class="signal-card signal-high">
          <span class="signal-icon">🔥</span>
          <div>
            <strong>High Demand</strong>
            <p>Demand signals are computed from buyer activity and seasonal patterns. Data refreshes daily.</p>
          </div>
        </div>
        <p class="empty-state">Demand intelligence will populate as more trades occur on the platform.</p>
      </div>
    `;
  }
}
