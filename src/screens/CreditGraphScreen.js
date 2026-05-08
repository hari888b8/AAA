import { api } from '../api.js';
import { navigate } from '../main.js';

export function renderCreditGraph(container) {
  container.innerHTML = `
    <div class="screen-container">
      <header class="screen-header">
        <button class="back-btn" onclick="navigateBack()">←</button>
        <h1>💳 Credit Graph</h1>
      </header>

      <div class="tab-bar">
        <button class="tab active" data-tab="score">Score</button>
        <button class="tab" data-tab="products">Products</button>
        <button class="tab" data-tab="loans">Loans</button>
        <button class="tab" data-tab="insurance">Insurance</button>
      </div>

      <div id="credit-content" class="content-area">
        <div class="loading-spinner">Loading...</div>
      </div>
    </div>
  `;

  const tabs = container.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadCreditTab(tab.dataset.tab, container);
    });
  });

  loadCreditTab('score', container);
}

async function loadCreditTab(tab, container) {
  const content = container.querySelector('#credit-content');

  if (tab === 'score') {
    try {
      const res = await api('/api/credit-graph/score');
      const s = res.score || {};
      const val = s.value || 0;
      const color = val >= 700 ? '#2e7d32' : val >= 500 ? '#f9a825' : '#c62828';
      const factors = s.factors || [];
      content.innerHTML = `
        <div style="text-align:center;padding:20px;">
          <div style="width:140px;height:140px;border-radius:50%;border:8px solid ${color};display:flex;align-items:center;justify-content:center;margin:0 auto;">
            <div>
              <p style="font-size:2.5rem;font-weight:bold;color:${color};">${val}</p>
              <p style="font-size:0.75rem;color:#666;">/ 900</p>
            </div>
          </div>
          <p style="margin-top:8px;font-size:0.9rem;color:#666;">${s.rating || 'Not Rated'}</p>
        </div>
        <h3 style="margin-top:12px;">Score Breakdown</h3>
        ${factors.map(f => `
          <div style="margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:0.85rem;"><span>${f.name}</span><span>${f.score}/${f.max || 100}</span></div>
            <div style="background:#e0e0e0;border-radius:4px;height:8px;margin-top:4px;">
              <div style="background:${f.score / (f.max || 100) > 0.7 ? '#2e7d32' : f.score / (f.max || 100) > 0.4 ? '#f9a825' : '#c62828'};height:100%;border-radius:4px;width:${(f.score / (f.max || 100)) * 100}%;"></div>
            </div>
          </div>
        `).join('')}
      `;
    } catch (err) {
      content.innerHTML = `<div class="error">${err.message}</div>`;
    }
  } else if (tab === 'products') {
    try {
      const res = await api('/api/credit-graph/products');
      const products = res.products || [];
      if (!products.length) {
        content.innerHTML = '<div class="empty-state"><p>No credit products available.</p></div>';
        return;
      }
      content.innerHTML = products.map(p => `
        <div class="card" style="margin-bottom:10px;">
          <div class="card-header" style="display:flex;justify-content:space-between;">
            <strong>${p.name}</strong>
            <span style="background:${p.eligible ? '#e8f5e9' : '#ffebee'};color:${p.eligible ? '#2e7d32' : '#c62828'};padding:2px 8px;border-radius:12px;font-size:0.75rem;">${p.eligible ? 'Eligible' : 'Not Eligible'}</span>
          </div>
          <div class="card-body">
            <p>${p.description || ''}</p>
            <p style="font-size:0.85rem;color:#666;">Rate: ${p.interest_rate || '—'}% | Max: ₹${p.max_amount || '—'}</p>
          </div>
          ${p.eligible ? `<button class="btn apply-btn" data-id="${p.id}" style="margin:8px;background:#e8f5e9;color:#2e7d32;width:calc(100% - 16px);">Apply Now</button>` : ''}
        </div>
      `).join('');
      content.querySelectorAll('.apply-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await api('/api/credit-graph/products/' + btn.dataset.id + '/apply', { method: 'POST' });
            btn.textContent = '✓ Applied';
            btn.disabled = true;
          } catch (err) { alert('Error: ' + err.message); }
        });
      });
    } catch (err) {
      content.innerHTML = `<div class="error">${err.message}</div>`;
    }
  } else if (tab === 'loans') {
    try {
      const res = await api('/api/credit-graph/loans');
      const loans = res.loans || [];
      if (!loans.length) {
        content.innerHTML = '<div class="empty-state"><p>No active loans.</p></div>';
        return;
      }
      content.innerHTML = loans.map(l => {
        const pct = l.total_amount ? Math.round((l.paid_amount / l.total_amount) * 100) : 0;
        return `
          <div class="card" style="margin-bottom:10px;">
            <div class="card-header" style="display:flex;justify-content:space-between;">
              <strong>${l.name || 'Loan'}</strong>
              <span style="font-size:0.85rem;color:#666;">${l.status || 'active'}</span>
            </div>
            <div class="card-body">
              <p>₹${l.paid_amount || 0} / ₹${l.total_amount || 0}</p>
              <div style="background:#e0e0e0;border-radius:4px;height:8px;margin:8px 0;">
                <div style="background:#2e7d32;height:100%;border-radius:4px;width:${pct}%;"></div>
              </div>
              <p style="font-size:0.8rem;color:#666;">EMI: ₹${l.emi || '—'}/month | Next: ${l.next_due ? new Date(l.next_due).toLocaleDateString() : '—'}</p>
            </div>
            <button class="btn pay-btn" data-id="${l.id}" style="margin:8px;background:#e8f5e9;color:#2e7d32;width:calc(100% - 16px);">Make Payment</button>
          </div>
        `;
      }).join('');
      content.querySelectorAll('.pay-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await api('/api/credit-graph/loans/' + btn.dataset.id + '/pay', { method: 'POST' });
            loadCreditTab('loans', container);
          } catch (err) { alert('Error: ' + err.message); }
        });
      });
    } catch (err) {
      content.innerHTML = `<div class="error">${err.message}</div>`;
    }
  } else if (tab === 'insurance') {
    try {
      const res = await api('/api/credit-graph/insurance');
      const products = res.products || [];
      const policies = res.policies || [];
      content.innerHTML = `
        <h3>Available Products</h3>
        ${products.length ? products.map(p => `
          <div class="card" style="margin-bottom:10px;">
            <div class="card-header"><strong>${p.name}</strong></div>
            <div class="card-body">
              <p>${p.description || ''}</p>
              <p style="font-size:0.85rem;color:#666;">Premium: ₹${p.premium || '—'}/year | Coverage: ₹${p.coverage || '—'}</p>
            </div>
            <button class="btn enroll-btn" data-id="${p.id}" style="margin:8px;background:#e3f2fd;color:#1565c0;width:calc(100% - 16px);">Enroll</button>
          </div>
        `).join('') : '<p style="color:#666;">No products available.</p>'}

        ${policies.length ? `
          <h3 style="margin-top:16px;">Active Policies</h3>
          ${policies.map(p => `
            <div class="card" style="margin-bottom:10px;border-left:4px solid #2e7d32;">
              <div class="card-header" style="display:flex;justify-content:space-between;">
                <strong>${p.name}</strong>
                <span style="color:#2e7d32;font-size:0.8rem;">Active</span>
              </div>
              <div class="card-body">
                <p style="font-size:0.85rem;">Coverage: ₹${p.coverage || '—'} | Expires: ${p.expiry ? new Date(p.expiry).toLocaleDateString() : '—'}</p>
              </div>
              <button class="btn claim-btn" data-id="${p.id}" style="margin:8px;background:#fff3e0;color:#e65100;width:calc(100% - 16px);">File Claim</button>
            </div>
          `).join('')}
        ` : ''}
      `;
      content.querySelectorAll('.enroll-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await api('/api/credit-graph/insurance/' + btn.dataset.id + '/enroll', { method: 'POST' });
            btn.textContent = '✓ Enrolled';
            btn.disabled = true;
          } catch (err) { alert('Error: ' + err.message); }
        });
      });
      content.querySelectorAll('.claim-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const reason = prompt('Reason for claim:');
          if (!reason) return;
          try {
            await api('/api/credit-graph/insurance/' + btn.dataset.id + '/claim', { method: 'POST', body: JSON.stringify({ reason }) });
            btn.textContent = '✓ Claim Filed';
            btn.disabled = true;
          } catch (err) { alert('Error: ' + err.message); }
        });
      });
    } catch (err) {
      content.innerHTML = `<div class="error">${err.message}</div>`;
    }
  }
}
