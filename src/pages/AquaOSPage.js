import { aquaosData as data } from '../data/aquaos.js';
import { renderSubHeader, renderHero, renderBreadcrumb } from './shared.js';

const ponds = [
  { id: 'P-001', species: 'Whiteleg Shrimp', area: '1.5 acres', stocked: '2,50,000 PL', doc: '45 days', survival: '87%', weight: '18.2g', ph: 7.8, temp: '28.5°C', status: 'active' },
  { id: 'P-002', species: 'Whiteleg Shrimp', area: '2.0 acres', stocked: '3,20,000 PL', doc: '62 days', survival: '82%', weight: '24.5g', ph: 8.1, temp: '29.1°C', status: 'active' },
  { id: 'P-003', species: 'Tiger Prawn', area: '1.0 acres', stocked: '80,000 PL', doc: '78 days', survival: '91%', weight: '32.8g', ph: 7.6, temp: '27.8°C', status: 'harvested' },
  { id: 'P-004', species: 'Whiteleg Shrimp', area: '1.8 acres', stocked: '2,80,000 PL', doc: '30 days', survival: '93%', weight: '12.1g', ph: 7.9, temp: '28.2°C', status: 'active' },
];

const advisories = [
  { severity: 'critical', icon: '🚨', title: 'White Spot Disease Alert — West Godavari', desc: 'Report of WSSV in ponds within 5km of your location. Immediately check shrimp for red discoloration and reduce feeding.', time: '1 hr ago' },
  { severity: 'high', icon: '🌡️', title: 'Water Temperature Rising — Expected 31°C', desc: 'Afternoon temperatures expected to exceed safe range. Increase aeration and reduce stocking density if possible.', time: '3 hrs ago' },
  { severity: 'medium', icon: '💧', title: 'pH Level Advisory', desc: 'Your Pond P-002 pH at 8.1 — approaching upper safe limit (8.3). Consider lime application to stabilize.', time: '6 hrs ago' },
  { severity: 'low', icon: '📊', title: 'Growth Update — Pond P-003 Ready for Harvest', desc: 'Average weight 32.8g at DOC 78. Current market price ₹380/kg. Estimated yield: 2.6 tons. Recommended harvest window: 5 days.', time: '12 hrs ago' },
];

const suppliers = [
  { name: 'Avanti Feeds Ltd', product: 'Vannamei Grower Feed (35% Protein)', price: '₹72/kg', rating: 4.5, orders: 1240, location: 'Nellore, AP' },
  { name: 'CP Aquaculture', product: 'Premium Shrimp Feed', price: '₹85/kg', rating: 4.7, orders: 890, location: 'East Godavari, AP' },
  { name: 'Waterbase Limited', product: 'Hatchery Grade PL', price: '₹0.35/PL', rating: 4.3, orders: 560, location: 'Krishna, AP' },
  { name: 'Growel Feeds', product: 'Probiotic Supplement', price: '₹450/bottle', rating: 4.1, orders: 340, location: 'Guntur, AP' },
];

export function renderAquaOSPage() {
  const html = `
    ${renderSubHeader(data)}
    <main class="app-page page-enter">
      ${renderBreadcrumb(data)}
      ${renderHero(data)}

      <!-- Tabs -->
      <div class="tabs" style="margin-bottom:var(--space-xl);">
        <button class="tab-btn tab-btn--active" data-tab-btn="aqua" data-target="tab-farmos" onclick="switchTab('tab-farmos','aqua')">🏗️ Farm OS</button>
        <button class="tab-btn" data-tab-btn="aqua" data-target="tab-advisory" onclick="switchTab('tab-advisory','aqua')">🧠 Advisory</button>
        <button class="tab-btn" data-tab-btn="aqua" data-target="tab-marketplace" onclick="switchTab('tab-marketplace','aqua')">🛒 Marketplace</button>
        <button class="tab-btn" data-tab-btn="aqua" data-target="tab-gaps" onclick="switchTab('tab-gaps','aqua')">🔍 Gap Analysis</button>
        <button class="tab-btn" data-tab-btn="aqua" data-target="tab-market" onclick="switchTab('tab-market','aqua')">📊 Market Data</button>
      </div>

      <!-- Farm OS Tab -->
      <div id="tab-farmos" data-tab-group="aqua">
        <div class="grid-4 stagger-children" style="margin-bottom:var(--space-xl);">
          <div class="metric metric--teal"><div class="metric__label">Active Ponds</div><div class="metric__value" data-count="4">0</div></div>
          <div class="metric metric--green"><div class="metric__label">Total Area</div><div class="metric__value">6.3 ac</div></div>
          <div class="metric metric--purple"><div class="metric__label">Avg Survival</div><div class="metric__value">88.3%</div></div>
          <div class="metric metric--orange"><div class="metric__label">Revenue Est.</div><div class="metric__value">₹24.5L</div></div>
        </div>

        <h3 style="font-family:var(--font-display);margin-bottom:var(--space-lg);">🐟 My Ponds</h3>
        <div class="data-table-wrapper" style="margin-bottom:var(--space-xl);">
          <table class="data-table">
            <thead><tr><th>Pond</th><th>Species</th><th>Area</th><th>DOC</th><th>Survival</th><th>Avg Weight</th><th>pH</th><th>Temp</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>${ponds.map(p => `<tr>
              <td><strong>${p.id}</strong></td><td>${p.species}</td><td>${p.area}</td><td>${p.doc}</td><td>${p.survival}</td>
              <td><strong>${p.weight}</strong></td><td>${p.ph}</td><td>${p.temp}</td>
              <td><span class="status status--${p.status}">${p.status === 'active' ? '🟢 Active' : '✅ Harvested'}</span></td>
              <td><button class="btn btn--secondary btn--small" onclick="showToast('Opening ${p.id} details','info')">View</button></td>
            </tr>`).join('')}</tbody>
          </table>
        </div>

        <button class="btn btn--primary" onclick="showToast('Pond creation form opening...','info')">+ Add New Pond</button>
      </div>

      <!-- Advisory Tab -->
      <div id="tab-advisory" data-tab-group="aqua" style="display:none;">
        <h3 style="font-family:var(--font-display);margin-bottom:var(--space-lg);">🧠 Species-Specific Advisories</h3>
        <div style="display:flex;flex-direction:column;gap:var(--space-md);">
          ${advisories.map(a => `
            <div class="activity-item" style="border-left:3px solid ${a.severity==='critical'?'var(--color-danger)':a.severity==='high'?'var(--color-warning)':a.severity==='medium'?'var(--color-info)':'var(--color-success)'};">
              <div class="activity-icon" style="background:${a.severity==='critical'?'rgba(239,68,68,0.15)':a.severity==='high'?'rgba(245,158,11,0.15)':'rgba(59,130,246,0.15)'};font-size:1.2rem;">${a.icon}</div>
              <div class="activity-content">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                  <div class="activity-text" style="font-weight:var(--fw-semibold);">${a.title}</div>
                  <span class="badge badge--${a.severity}">${a.severity}</span>
                </div>
                <div style="font-size:var(--fs-small);color:var(--text-secondary);margin-bottom:4px;">${a.desc}</div>
                <div class="activity-time">${a.time}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Marketplace Tab -->
      <div id="tab-marketplace" data-tab-group="aqua" style="display:none;">
        <h3 style="font-family:var(--font-display);margin-bottom:var(--space-lg);">🛒 Input Suppliers</h3>
        <div class="grid-2 stagger-children">
          ${suppliers.map(s => `
            <div class="listing-card" style="cursor:pointer;" onclick="showToast('Contacting ${s.name}...','info')">
              <div class="listing-card__body">
                <div class="listing-card__title">${s.name}</div>
                <div class="listing-card__location">📍 ${s.location}</div>
                <div style="margin:var(--space-sm) 0;color:var(--text-secondary);font-size:var(--fs-small);">${s.product}</div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <div class="listing-card__price">${s.price}</div>
                  <div style="font-size:var(--fs-xs);color:var(--text-muted);">⭐ ${s.rating} · ${s.orders} orders</div>
                </div>
                <div class="listing-card__actions">
                  <button class="btn btn--primary btn--small" onclick="event.stopPropagation();showToast('Order placed!','success')">🛒 Order</button>
                  <button class="btn btn--secondary btn--small" onclick="event.stopPropagation();showToast('Quote requested','info')">💬 Get Quote</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Gap Analysis Tab -->
      <div id="tab-gaps" data-tab-group="aqua" style="display:none;">
        <div class="grid-3" style="margin-bottom:var(--space-xl);">
          <div class="metric metric--red"><div class="metric__label">Critical Gaps</div><div class="metric__value" style="color:#f87171;">9</div></div>
          <div class="metric metric--orange"><div class="metric__label">High Gaps</div><div class="metric__value" style="color:#fbbf24;">16</div></div>
          <div class="metric metric--teal"><div class="metric__label">Medium Gaps</div><div class="metric__value" style="color:#60a5fa;">6</div></div>
        </div>
        ${['critical','high','medium'].map(sev => `
          <h3 style="color:${sev==='critical'?'#f87171':sev==='high'?'#fbbf24':'#60a5fa'};font-family:var(--font-display);margin:var(--space-lg) 0 var(--space-md);">${sev==='critical'?'🔴 Critical (9)':sev==='high'?'🟡 High (16)':'🔵 Medium (6)'}</h3>
          <div style="display:flex;flex-direction:column;gap:var(--space-sm);">
            ${(data.gapAnalysis[sev]||[]).map(g => `<div class="gap-card"><div class="gap-card__id">${g.id}</div><div class="gap-card__content"><div class="gap-card__title">${g.title}</div><div class="gap-card__section">PRD: ${g.section}</div></div><span class="badge badge--${sev}">${sev}</span></div>`).join('')}
          </div>
        `).join('')}
      </div>

      <!-- Market Data Tab -->
      <div id="tab-market" data-tab-group="aqua" style="display:none;">
        <h3 style="font-family:var(--font-display);margin-bottom:var(--space-lg);">📍 AP Aquaculture Districts</h3>
        <div class="data-table-wrapper">
          <table class="data-table"><thead><tr><th>District</th><th>Ponds</th><th>Species</th><th>Avg Farm Size</th></tr></thead>
          <tbody>${data.districts.map(d => `<tr><td><strong>${d.name}</strong></td><td>${d.ponds}</td><td>${d.species}</td><td>${d.avgFarm}</td></tr>`).join('')}</tbody></table>
        </div>

        <h3 style="font-family:var(--font-display);margin:var(--space-2xl) 0 var(--space-lg);">⚔️ Competitive Landscape</h3>
        <div class="data-table-wrapper">
          <table class="data-table"><thead><tr><th>Competitor</th><th>Focus</th><th>Weakness</th><th>AquaOS Advantage</th></tr></thead>
          <tbody>${data.competitive.map(c => `<tr><td><strong>${c.name}</strong></td><td>${c.focus}</td><td>${c.weakness}</td><td style="color:var(--color-success);">${c.advantage}</td></tr>`).join('')}</tbody></table>
        </div>
      </div>

      <div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted);font-size:var(--fs-xs);">
        Source: AquaOS_GapAnalysis_v1.1.docx · AquaOS_PRD_v1.0.docx<br/>Analysis Rating: ⭐⭐⭐⭐⭐ 95%
      </div>
    </main>`;

  setTimeout(() => window.animateCounters(), 100);
  return html;
}
