import { navigate } from '../app-shell.js';
import { api } from '../api.js';

// ═══════════════════════════════════════════════════════════════
// COMPLIANCE & PLATFORM READINESS SCREEN
// DPDP Act | KYC | AI Models | Govt Integrations | Grievances
// ═══════════════════════════════════════════════════════════════

export function renderCompliance(container) {
  let activeTab = 'kyc';

  function render() {
    container.innerHTML = `
      <div style="padding:1rem;font-family:system-ui,sans-serif">
        <div style="display:flex;gap:0.5rem;margin-bottom:1.5rem;overflow-x:auto">
          ${['kyc','consent','ai-models','govt','grievance'].map(tab => `
            <div class="c-tab ${activeTab === tab ? 'c-tab-active' : ''}" data-tab="${tab}">
              ${tab === 'kyc' ? '🔐 KYC' : tab === 'consent' ? '📋 Consent' : tab === 'ai-models' ? '🤖 AI' : tab === 'govt' ? '🏛️ Govt' : '📝 Grievance'}
            </div>
          `).join('')}
        </div>
        <div id="tab-content"></div>
      </div>
      <style>
        .c-tab{padding:0.5rem 1rem;border-radius:20px;border:1px solid #e0e0e0;cursor:pointer;white-space:nowrap;font-size:0.85rem}
        .c-tab-active{background:#1a73e8;color:white;border-color:#1a73e8}
        .c-section{background:#fff;border-radius:12px;padding:1.5rem;margin-bottom:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.06)}
        .c-section h2{margin:0 0 1rem;font-size:1.1rem;color:#1a1a2e}
        .c-info{background:#e3f2fd;border-left:4px solid #1a73e8;padding:1rem;border-radius:4px;margin:1rem 0;font-size:0.85rem}
        .c-btn{padding:0.6rem 1.2rem;border:none;border-radius:8px;cursor:pointer;font-size:0.85rem}
        .c-btn-p{background:#1a73e8;color:white}
        .c-btn-d{background:#ef5350;color:white}
        .c-btn-o{background:transparent;border:1px solid #1a73e8;color:#1a73e8}
      </style>
    `;

    const content = container.querySelector('#tab-content');
    if (activeTab === 'kyc') renderKYC(content);
    else if (activeTab === 'consent') renderConsent(content);
    else if (activeTab === 'ai-models') renderAI(content);
    else if (activeTab === 'govt') renderGovt(content);
    else if (activeTab === 'grievance') renderGrievance(content);

    container.querySelectorAll('.c-tab').forEach(el => {
      el.onclick = () => { activeTab = el.dataset.tab; render(); };
    });
  }

  function renderKYC(el) {
    el.innerHTML = `
      <div class="c-section">
        <h2>🔐 Identity Verification (KYC)</h2>
        <div class="c-info">Complete KYC to unlock all platform features. Required by DPDP Act 2023.</div>
        <div style="display:flex;gap:0.5rem;margin:1rem 0">
          <div style="flex:1;text-align:center;padding:0.5rem;border-radius:8px;background:#e8f5e9;color:#2e7d32;font-size:0.75rem">✓ Phone</div>
          <div style="flex:1;text-align:center;padding:0.5rem;border-radius:8px;background:#f5f5f5;color:#757575;font-size:0.75rem">ID Verify</div>
          <div style="flex:1;text-align:center;padding:0.5rem;border-radius:8px;background:#f5f5f5;color:#757575;font-size:0.75rem">Business</div>
          <div style="flex:1;text-align:center;padding:0.5rem;border-radius:8px;background:#f5f5f5;color:#757575;font-size:0.75rem">Full KYC</div>
        </div>
        <p style="font-size:0.85rem;color:#666">Current Level: 1/4</p>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:1rem">
          <button class="c-btn c-btn-p">Verify Aadhaar (e-KYC)</button>
          <button class="c-btn c-btn-o">Submit PAN</button>
          <button class="c-btn c-btn-o">Add GSTIN</button>
          <button class="c-btn c-btn-o">Link Bank A/C</button>
        </div>
      </div>
    `;
  }

  function renderConsent(el) {
    const consents = [
      { label: 'Account Management', status: 'active' },
      { label: 'Marketplace Transactions', status: 'active' },
      { label: 'Market Intelligence', status: 'active' },
      { label: 'Credit Scoring', status: 'withdrawn' },
      { label: 'Government Scheme Sync', status: 'active' },
      { label: 'Marketing Communications', status: 'withdrawn' },
    ];
    el.innerHTML = `
      <div class="c-section">
        <h2>📋 Data Consent Management (DPDP Act 2023)</h2>
        <div class="c-info">You have full control over how your data is used. Withdraw consent anytime.</div>
        ${consents.map(c => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem 0;border-bottom:1px solid #f0f0f0">
            <span style="font-size:0.9rem">${c.label}</span>
            <span style="font-size:0.8rem;padding:0.25rem 0.5rem;border-radius:4px;background:${c.status === 'active' ? '#e8f5e9' : '#fbe9e7'};color:${c.status === 'active' ? '#2e7d32' : '#c62828'}">${c.status}</span>
          </div>
        `).join('')}
        <div style="margin-top:1rem;display:flex;gap:0.5rem">
          <button class="c-btn c-btn-p">Export My Data</button>
          <button class="c-btn c-btn-d">Request Erasure</button>
        </div>
      </div>
    `;
  }

  function renderAI(el) {
    const models = [
      { name: 'LSTM Price Predictor', version: 'v2.1', accuracy: '82.4%' },
      { name: 'Random Forest Yield', version: 'v3.0', accuracy: '78.2%' },
      { name: 'CNN Disease Detector', version: 'v2.0', accuracy: '75.8%' },
      { name: 'ARIMA Demand Forecast', version: 'v1.2', accuracy: '71.5%' },
      { name: 'XGBoost Credit Scorer', version: 'v1.0', accuracy: '85.1%' },
    ];
    el.innerHTML = `
      <div class="c-section">
        <h2>🤖 AI/ML Prediction Models</h2>
        <div class="c-info">Our AI models predict prices, yields, diseases, and demand to help you make better decisions.</div>
        ${models.map(m => `
          <div style="display:flex;justify-content:space-between;padding:0.75rem;background:#f8f9fa;border-radius:8px;margin-bottom:0.5rem">
            <div><strong>${m.name}</strong><div style="font-size:0.75rem;color:#666">${m.version}</div></div>
            <span style="color:#2e7d32;font-weight:600">${m.accuracy}</span>
          </div>
        `).join('')}
        <div style="margin-top:1rem;display:flex;gap:0.5rem;flex-wrap:wrap">
          <button class="c-btn c-btn-p">Predict Crop Price</button>
          <button class="c-btn c-btn-o">Predict Yield</button>
          <button class="c-btn c-btn-o">Disease Risk</button>
        </div>
      </div>
    `;
  }

  function renderGovt(el) {
    el.innerHTML = `
      <div class="c-section">
        <h2>🏛️ Government Integrations</h2>
        <div class="c-info">Connected to national agricultural infrastructure: eNAM, NABARD, SFAC, PM-KISAN</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-top:1rem">
          <div style="padding:1rem;background:#f5f5f5;border-radius:8px;text-align:center">
            <div style="font-size:1.5rem">📊</div>
            <div style="font-weight:600;font-size:0.85rem">eNAM</div>
            <div style="font-size:0.75rem;color:#666">10 mandis connected</div>
          </div>
          <div style="padding:1rem;background:#f5f5f5;border-radius:8px;text-align:center">
            <div style="font-size:1.5rem">🏦</div>
            <div style="font-weight:600;font-size:0.85rem">NABARD</div>
            <div style="font-size:0.75rem;color:#666">6 schemes available</div>
          </div>
          <div style="padding:1rem;background:#f5f5f5;border-radius:8px;text-align:center">
            <div style="font-size:1.5rem">👥</div>
            <div style="font-weight:600;font-size:0.85rem">SFAC</div>
            <div style="font-size:0.75rem;color:#666">FPO support grants</div>
          </div>
          <div style="padding:1rem;background:#f5f5f5;border-radius:8px;text-align:center">
            <div style="font-size:1.5rem">💰</div>
            <div style="font-weight:600;font-size:0.85rem">PM-KISAN</div>
            <div style="font-size:0.75rem;color:#666">₹6000/year DBT</div>
          </div>
        </div>
      </div>
    `;
  }

  function renderGrievance(el) {
    el.innerHTML = `
      <div class="c-section">
        <h2>📝 File Grievance (DPDP Act Section 14)</h2>
        <div class="c-info">If you believe your data rights have been violated, file a grievance. DPO responds within 30 days.</div>
        <textarea style="width:100%;padding:0.75rem;border:1px solid #e0e0e0;border-radius:8px;min-height:100px;font-family:inherit" placeholder="Describe your concern..."></textarea>
        <div style="margin-top:0.75rem"><button class="c-btn c-btn-p">Submit Grievance</button></div>
        <p style="font-size:0.8rem;color:#666;margin-top:0.5rem">DPO Contact: dpo@agrihub.in</p>
      </div>
    `;
  }

  render();
}
