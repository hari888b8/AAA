import { api } from '../api.js';
import { navigate } from '../main.js';

export function renderFinance(container) {
  container.innerHTML = `
    <div class="screen-container">
      <header class="screen-header">
        <button class="back-btn" onclick="navigateBack()">←</button>
        <h1>💰 Finance Hub</h1>
      </header>

      <div class="tab-bar">
        <button class="tab active" data-tab="credit">Credit Score</button>
        <button class="tab" data-tab="loans">Loans</button>
        <button class="tab" data-tab="insurance">Insurance</button>
      </div>

      <div id="finance-content" class="content-area">
        <div class="loading-spinner">Loading...</div>
      </div>
    </div>
  `;

  const tabs = container.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadFinanceTab(tab.dataset.tab, container);
    });
  });

  loadFinanceTab('credit', container);
}

async function loadFinanceTab(tab, container) {
  const content = container.querySelector('#finance-content');

  if (tab === 'credit') {
    try {
      const res = await api('/api/finance/credit-score');
      const cs = res.creditScore;
      content.innerHTML = `
        <div class="credit-score-card">
          <div class="score-gauge">
            <div class="gauge-value">${cs.score}</div>
            <div class="gauge-max">/ ${cs.max_score}</div>
          </div>
          <p class="eligible-amount">Eligible for up to <strong>₹${(cs.eligible_amount || 0).toLocaleString()}</strong></p>
          <button class="btn btn-primary" id="recompute-credit">Refresh Score</button>
        </div>
      `;
      content.querySelector('#recompute-credit').addEventListener('click', async () => {
        await api('/api/finance/credit-score/compute', { method: 'POST' });
        loadFinanceTab('credit', container);
      });
    } catch (err) {
      content.innerHTML = `<div class="error">${err.message}</div>`;
    }
  } else if (tab === 'loans') {
    try {
      const res = await api('/api/finance/loans');
      const loans = res.loans || [];
      content.innerHTML = `
        <button class="btn btn-primary btn-sm" id="apply-loan-btn">+ Apply for Loan</button>
        ${loans.length ? loans.map(l => `
          <div class="card loan-card">
            <div class="card-header">
              <span>₹${parseFloat(l.amount).toLocaleString()}</span>
              <span class="status-badge status-${l.status}">${l.status}</span>
            </div>
            <p>EMI: ₹${parseFloat(l.emi_amount || 0).toLocaleString()} × ${l.tenure_months} months</p>
            <p>Interest: ${l.interest_rate}% | Purpose: ${l.purpose || 'General'}</p>
          </div>
        `).join('') : '<p class="empty-state">No loans yet</p>'}
      `;
      content.querySelector('#apply-loan-btn').addEventListener('click', () => showLoanForm(content, container));
    } catch (err) {
      content.innerHTML = `<div class="error">${err.message}</div>`;
    }
  } else if (tab === 'insurance') {
    try {
      const res = await api('/api/finance/insurance');
      const policies = res.policies || [];
      content.innerHTML = `
        <button class="btn btn-primary btn-sm" id="enroll-ins-btn">+ Enroll in Insurance</button>
        ${policies.length ? policies.map(p => `
          <div class="card insurance-card">
            <div class="card-header">
              <span>${p.crop_name} — ${p.season || 'Kharif'}</span>
              <span class="status-badge status-${p.status}">${p.status}</span>
            </div>
            <p>Sum Insured: ₹${parseFloat(p.sum_insured).toLocaleString()} | Premium: ₹${parseFloat(p.premium_amount).toLocaleString()}</p>
            ${p.claim_status ? `<p>Claim: ${p.claim_status} — ₹${parseFloat(p.claim_amount || 0).toLocaleString()}</p>` : ''}
          </div>
        `).join('') : '<p class="empty-state">No insurance policies</p>'}
      `;
      content.querySelector('#enroll-ins-btn').addEventListener('click', () => showInsuranceForm(content, container));
    } catch (err) {
      content.innerHTML = `<div class="error">${err.message}</div>`;
    }
  }
}

function showLoanForm(content, container) {
  content.innerHTML = `
    <form id="loan-form" class="form-container">
      <div class="form-group"><label>Amount (₹)</label><input type="number" name="amount" required /></div>
      <div class="form-group"><label>Tenure (months)</label><input type="number" name="tenure_months" value="6" required /></div>
      <div class="form-group"><label>Purpose</label><input type="text" name="purpose" placeholder="Seeds, Equipment..." /></div>
      <button type="submit" class="btn btn-primary btn-block">Apply</button>
    </form>
  `;
  content.querySelector('#loan-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await api('/api/finance/loans/apply', { method: 'POST', body: JSON.stringify(Object.fromEntries(fd)) });
    loadFinanceTab('loans', container);
  });
}

function showInsuranceForm(content, container) {
  content.innerHTML = `
    <form id="ins-form" class="form-container">
      <div class="form-group"><label>Crop</label><input type="text" name="crop_name" required /></div>
      <div class="form-group"><label>Season</label><select name="season"><option>Kharif</option><option>Rabi</option><option>Zaid</option></select></div>
      <div class="form-group"><label>Area (hectares)</label><input type="number" name="area_hectares" step="0.01" /></div>
      <div class="form-group"><label>Sum Insured (₹)</label><input type="number" name="sum_insured" required /></div>
      <button type="submit" class="btn btn-primary btn-block">Enroll</button>
    </form>
  `;
  content.querySelector('#ins-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await api('/api/finance/insurance/enroll', { method: 'POST', body: JSON.stringify(Object.fromEntries(fd)) });
    loadFinanceTab('insurance', container);
  });
}
