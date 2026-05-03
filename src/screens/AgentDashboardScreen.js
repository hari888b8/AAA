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
        <button class="action-btn" id="assisted-txn-btn">🤝 Assisted Transaction</button>
        <button class="action-btn" id="verify-pickup-btn">✅ Verify Pickup</button>
        <button class="action-btn" id="quality-check-btn">🔍 Quality Check</button>
        <button class="action-btn" id="view-commissions-btn">💰 View Commissions</button>
        <button class="action-btn" id="dispute-resolve-btn">⚖️ Resolve Dispute</button>
      </div>

      <h3 class="section-title">Today's Tasks</h3>
      <div class="task-list" style="margin-bottom:16px">
        <div style="padding:10px;background:#FFF8E1;border-radius:8px;margin-bottom:8px;border-left:3px solid #FFA000;font-size:0.85rem">
          <strong>🚚 Pickup Verification</strong> — Ramesh Kumar, Paddy 20qtl, Pedakakani
        </div>
        <div style="padding:10px;background:#E3F2FD;border-radius:8px;margin-bottom:8px;border-left:3px solid #1565C0;font-size:0.85rem">
          <strong>🤝 Assisted Sale</strong> — Lakshmi Devi wants to sell Cotton 15qtl
        </div>
        <div style="padding:10px;background:#E8F5E9;border-radius:8px;margin-bottom:8px;border-left:3px solid #2E7D32;font-size:0.85rem">
          <strong>👨‍🌾 Onboarding</strong> — 3 new farmers in Tadepalli village
        </div>
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
    content.querySelector('#assisted-txn-btn').addEventListener('click', () => showAssistedTransaction(content, container));
    content.querySelector('#verify-pickup-btn').addEventListener('click', () => showPickupVerification(content, container));
    content.querySelector('#quality-check-btn').addEventListener('click', () => showQualityCheck(content, container));
    content.querySelector('#dispute-resolve-btn').addEventListener('click', () => showDisputeResolution(content, container));
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

function showAssistedTransaction(content, container) {
  content.innerHTML = `
    <div style="padding:4px">
      <h3>🤝 Assisted Transaction</h3>
      <p style="font-size:0.82rem;color:#666;margin-bottom:16px">Execute transaction on behalf of a farmer who cannot use the app</p>
      <form id="assisted-form" class="form-container">
        <div class="form-group"><label>Farmer Phone</label><input type="tel" name="farmer_phone" placeholder="Farmer's registered phone" required /></div>
        <div class="form-group"><label>Transaction Type</label>
          <select name="txn_type">
            <option value="sell">Sell Crop</option>
            <option value="buy_inputs">Buy Inputs</option>
            <option value="apply_scheme">Apply for Scheme</option>
            <option value="book_pickup">Book Pickup</option>
            <option value="loan_apply">Apply for Loan</option>
          </select>
        </div>
        <div class="form-group"><label>Details</label><textarea name="details" rows="3" placeholder="Describe what the farmer wants to do..."></textarea></div>
        <div class="form-group"><label>Farmer Consent (OTP sent to farmer)</label><input type="text" name="otp" maxlength="6" placeholder="Enter OTP from farmer" required /></div>
        <button type="submit" class="btn btn-primary btn-block">✅ Submit Assisted Transaction</button>
      </form>
    </div>
  `;
  content.querySelector('#assisted-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api('/api/agents/assisted-transaction', { method: 'POST', body: JSON.stringify(Object.fromEntries(fd)) });
      alert('Assisted transaction recorded! Commission: ₹30');
      loadAgentDashboard(container);
    } catch (err) { alert('Error: ' + err.message); }
  });
}

function showPickupVerification(content, container) {
  content.innerHTML = `
    <div style="padding:4px">
      <h3>✅ Verify Pickup</h3>
      <p style="font-size:0.82rem;color:#666;margin-bottom:16px">Confirm physical pickup with OTP, weight verification & photo</p>
      <form id="pickup-verify-form" class="form-container">
        <div class="form-group"><label>Order / Delivery ID</label><input type="text" name="order_id" placeholder="Order ID from delivery list" required /></div>
        <div class="form-group"><label>Farmer OTP</label><input type="text" name="farmer_otp" maxlength="6" placeholder="OTP shared by farmer" required /></div>
        <div class="form-group"><label>Actual Weight (kg)</label><input type="number" name="actual_weight" placeholder="Weighed at pickup" required /></div>
        <div class="form-group"><label>Number of Bags</label><input type="number" name="bag_count" placeholder="Count bags" /></div>
        <div class="form-group"><label>Pickup Photo</label><input type="file" name="photo" accept="image/*" capture="environment" /></div>
        <div class="form-group"><label>Notes</label><textarea name="notes" rows="2" placeholder="Any observations..."></textarea></div>
        <button type="submit" class="btn btn-primary btn-block">✅ Verify & Confirm Pickup</button>
      </form>
    </div>
  `;
  content.querySelector('#pickup-verify-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api('/api/agents/verify-pickup', { method: 'POST', body: JSON.stringify(Object.fromEntries(fd)) });
      alert('Pickup verified! GPS + photo logged. Commission: ₹40');
      loadAgentDashboard(container);
    } catch (err) { alert('Error: ' + err.message); }
  });
}

function showQualityCheck(content, container) {
  content.innerHTML = `
    <div style="padding:4px">
      <h3>🔍 Quality Inspection</h3>
      <p style="font-size:0.82rem;color:#666;margin-bottom:16px">Physical quality verification at collection center</p>
      <form id="quality-form" class="form-container">
        <div class="form-group"><label>Lot / Delivery ID</label><input type="text" name="lot_id" required /></div>
        <div class="form-group"><label>Crop Type</label>
          <select name="crop_type">
            <option>Paddy</option><option>Cotton</option><option>Groundnut</option>
            <option>Chilli</option><option>Maize</option><option>Tomato</option>
          </select>
        </div>
        <div class="form-group"><label>Moisture %</label><input type="number" step="0.1" name="moisture" placeholder="14.5" /></div>
        <div class="form-group"><label>Foreign Matter %</label><input type="number" step="0.1" name="foreign_matter" placeholder="1.2" /></div>
        <div class="form-group"><label>Grade</label>
          <select name="grade">
            <option value="A">A (Premium)</option><option value="B">B (Good)</option>
            <option value="C">C (Fair)</option><option value="D">D (Below Average)</option>
          </select>
        </div>
        <div class="form-group"><label>Sample Photo</label><input type="file" name="photo" accept="image/*" multiple capture="environment" /></div>
        <button type="submit" class="btn btn-primary btn-block">🔍 Submit Quality Report</button>
      </form>
    </div>
  `;
  content.querySelector('#quality-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api('/api/agents/quality-check', { method: 'POST', body: JSON.stringify(Object.fromEntries(fd)) });
      alert('Quality report submitted! Commission: ₹50');
      loadAgentDashboard(container);
    } catch (err) { alert('Error: ' + err.message); }
  });
}

function showDisputeResolution(content, container) {
  content.innerHTML = `
    <div style="padding:4px">
      <h3>⚖️ Dispute Resolution</h3>
      <p style="font-size:0.82rem;color:#666;margin-bottom:16px">Physical verification for trade disputes</p>
      <form id="dispute-form" class="form-container">
        <div class="form-group"><label>Order / Contract ID</label><input type="text" name="order_id" required /></div>
        <div class="form-group"><label>Dispute Type</label>
          <select name="dispute_type">
            <option value="quality">Quality Mismatch</option>
            <option value="weight">Weight Discrepancy</option>
            <option value="payment">Payment Issue</option>
            <option value="delivery">Non-Delivery</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div class="form-group"><label>Description</label><textarea name="description" rows="3" placeholder="Describe the dispute..." required></textarea></div>
        <div class="form-group"><label>Evidence Photos</label><input type="file" name="evidence" accept="image/*" multiple capture="environment" /></div>
        <div class="form-group"><label>Resolution Recommendation</label>
          <select name="recommendation">
            <option value="refund_partial">Partial Refund</option>
            <option value="refund_full">Full Refund</option>
            <option value="redeliver">Re-delivery</option>
            <option value="price_adjust">Price Adjustment</option>
            <option value="no_action">No Action Needed</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary btn-block">⚖️ Submit Dispute Report</button>
      </form>
    </div>
  `;
  content.querySelector('#dispute-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api('/api/agents/dispute', { method: 'POST', body: JSON.stringify(Object.fromEntries(fd)) });
      alert('Dispute report filed. Resolution will be processed in 24-48 hrs.');
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
      <div style="background:#E8F5E9;padding:12px;border-radius:10px;margin-bottom:16px">
        <div style="font-size:0.8rem;color:#555">Commission Rates:</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px;font-size:0.78rem">
          <span>👨‍🌾 Onboarding: ₹50</span>
          <span>🤝 Assisted Txn: ₹30</span>
          <span>✅ Pickup Verify: ₹40</span>
          <span>🔍 Quality Check: ₹50</span>
          <span>⚖️ Dispute: ₹100</span>
          <span>📝 Scheme Apply: ₹25</span>
        </div>
      </div>
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
