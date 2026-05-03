import { api } from '../api.js';
import { navigate } from '../main.js';

export function renderAgentDashboard(container) {
  container.innerHTML = `
    <div class="screen-container">
      <header class="screen-header">
        <button class="back-btn" onclick="navigateBack()">←</button>
        <h1>🤝 Agent Dashboard</h1>
      </header>

      <div id="agent-content" class="content-area">
        <div class="loading-spinner">Loading agent data...</div>
      </div>
    </div>
  `;

  loadAgentDashboard(container);
}

async function loadAgentDashboard(container) {
  const content = container.querySelector('#agent-content');

  try {
    const res = await api('/api/agents/dashboard');
    const { agent, activitySummary, commissions, recentActivities } = res;

    content.innerHTML = `
      <div class="agent-profile-card">
        <h3>${agent.name}</h3>
        <p>📞 ${agent.phone} | ${agent.agent_type} agent</p>
        <div class="agent-stats">
          <div class="stat"><span class="stat-value">${agent.total_onboarded}</span><span class="stat-label">Onboarded</span></div>
          <div class="stat"><span class="stat-value">₹${parseFloat(commissions?.total_earned || 0).toLocaleString()}</span><span class="stat-label">Earned</span></div>
          <div class="stat"><span class="stat-value">₹${parseFloat(commissions?.pending || 0).toLocaleString()}</span><span class="stat-label">Pending</span></div>
        </div>
        <span class="badge ${agent.is_verified ? 'badge-verified' : 'badge-unverified'}">${agent.is_verified ? '✓ Verified' : 'Unverified'}</span>
      </div>

      <h3 class="section-title">Quick Actions</h3>
      <div class="action-grid">
        <button class="action-btn" id="onboard-farmer-btn">👨‍🌾 Onboard Farmer</button>
        <button class="action-btn" id="view-commissions-btn">💰 View Commissions</button>
      </div>

      <h3 class="section-title">Recent Activity</h3>
      <div class="activity-list">
        ${recentActivities?.length ? recentActivities.map(a => `
          <div class="activity-item">
            <span class="activity-type">${a.activity_type}</span>
            <span class="activity-date">${new Date(a.created_at).toLocaleDateString()}</span>
          </div>
        `).join('') : '<p class="empty-state">No recent activity</p>'}
      </div>
    `;

    content.querySelector('#onboard-farmer-btn').addEventListener('click', () => showOnboardForm(content, container));
    content.querySelector('#view-commissions-btn').addEventListener('click', () => loadCommissions(content));
  } catch (err) {
    if (err.message.includes('Not')) {
      // Not registered as agent — show registration form
      showRegistrationForm(content, container);
    } else {
      content.innerHTML = `<div class="error">${err.message}</div>`;
    }
  }
}

function showRegistrationForm(content, container) {
  content.innerHTML = `
    <div class="register-agent">
      <h3>Become a Field Agent</h3>
      <p>Earn commissions by helping farmers onboard and use AgriHub.</p>
      <form id="agent-register-form" class="form-container">
        <div class="form-group"><label>Full Name</label><input type="text" name="name" required /></div>
        <div class="form-group"><label>Phone</label><input type="tel" name="phone" required /></div>
        <div class="form-group"><label>Mandal</label><input type="text" name="mandal" /></div>
        <button type="submit" class="btn btn-primary btn-block">Register as Agent</button>
      </form>
    </div>
  `;

  content.querySelector('#agent-register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api('/api/agents/register', { method: 'POST', body: JSON.stringify(Object.fromEntries(fd)) });
      loadAgentDashboard(container);
    } catch (err) { alert('Error: ' + err.message); }
  });
}

function showOnboardForm(content, container) {
  content.innerHTML = `
    <form id="onboard-form" class="form-container">
      <h3>Onboard a Farmer</h3>
      <div class="form-group"><label>Farmer Name</label><input type="text" name="farmer_name" required /></div>
      <div class="form-group"><label>Farmer Phone</label><input type="tel" name="farmer_phone" required /></div>
      <div class="form-group"><label>Mandal</label><input type="text" name="mandal" /></div>
      <div class="form-group"><label>Village</label><input type="text" name="village" /></div>
      <button type="submit" class="btn btn-primary btn-block">Submit Onboarding</button>
    </form>
  `;

  content.querySelector('#onboard-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api('/api/agents/onboard-farmer', { method: 'POST', body: JSON.stringify(Object.fromEntries(fd)) });
      alert('Farmer onboarding recorded! ₹50 commission added.');
      loadAgentDashboard(container);
    } catch (err) { alert('Error: ' + err.message); }
  });
}

async function loadCommissions(content) {
  try {
    const res = await api('/api/agents/commissions');
    const list = res.commissions || [];
    content.innerHTML = `
      <h3>Commission History</h3>
      ${list.length ? list.map(c => `
        <div class="card commission-card">
          <span>₹${c.amount} — ${c.commission_type}</span>
          <span class="status-badge status-${c.status}">${c.status}</span>
          <span>${new Date(c.created_at).toLocaleDateString()}</span>
        </div>
      `).join('') : '<p class="empty-state">No commissions yet</p>'}
    `;
  } catch (err) {
    content.innerHTML = `<div class="error">${err.message}</div>`;
  }
}
