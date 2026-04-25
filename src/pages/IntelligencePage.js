import { intelligenceData as data } from '../data/intelligence.js';
import { renderSubHeader, renderHero, renderBreadcrumb } from './shared.js';

function miniChart(values, color) {
  const max = Math.max(...values);
  return `<div class="mini-chart">${values.map((v, i) => 
    `<div class="mini-chart__bar" style="height:${(v/max)*100}%;background:${color};" data-label="${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i] || ''}"></div>`
  ).join('')}</div>`;
}

const supplyData = [
  { crop: 'Tomato', supply: '24,500 T', demand: '18,200 T', gap: '+6,300 T', signal: 'Surplus', color: 'success', trend: [40,55,70,85,95,80,65,50,35,45,60,78] },
  { crop: 'Onion', supply: '18,000 T', demand: '22,400 T', gap: '-4,400 T', signal: 'Deficit', color: 'danger', trend: [30,35,40,45,38,32,28,25,30,38,42,50] },
  { crop: 'Rice', supply: '1,20,000 T', demand: '1,15,000 T', gap: '+5,000 T', signal: 'Balanced', color: 'medium', trend: [60,62,65,68,70,72,75,78,80,82,85,88] },
  { crop: 'Chilli', supply: '8,500 T', demand: '12,000 T', gap: '-3,500 T', signal: 'Deficit', color: 'danger', trend: [20,25,30,45,60,75,80,70,55,40,30,25] },
  { crop: 'Groundnut', supply: '32,000 T', demand: '28,000 T', gap: '+4,000 T', signal: 'Surplus', color: 'success', trend: [50,48,45,42,55,68,75,80,72,60,52,48] },
  { crop: 'Cotton', supply: '45,000 T', demand: '48,000 T', gap: '-3,000 T', signal: 'Mild Deficit', color: 'high', trend: [10,12,15,20,30,50,70,85,90,80,60,35] },
];

const districtHeatmap = [
  { district: 'Krishna', farmers: 12400, declarations: 8900, coverage: 72, topCrop: 'Rice', activity: 'Very High' },
  { district: 'East Godavari', farmers: 15200, declarations: 11400, coverage: 75, topCrop: 'Rice', activity: 'Very High' },
  { district: 'Guntur', farmers: 9800, declarations: 6200, coverage: 63, topCrop: 'Chilli', activity: 'High' },
  { district: 'Kurnool', farmers: 8400, declarations: 4800, coverage: 57, topCrop: 'Groundnut', activity: 'Medium' },
  { district: 'Anantapur', farmers: 6200, declarations: 3100, coverage: 50, topCrop: 'Groundnut', activity: 'Medium' },
  { district: 'West Godavari', farmers: 11800, declarations: 9200, coverage: 78, topCrop: 'Rice', activity: 'Very High' },
  { district: 'Nellore', farmers: 7600, declarations: 5100, coverage: 67, topCrop: 'Shrimp', activity: 'High' },
  { district: 'Chittoor', farmers: 5400, declarations: 2700, coverage: 50, topCrop: 'Mango', activity: 'Medium' },
];

export function renderIntelligencePage() {
  const html = `
    ${renderSubHeader(data)}
    <main class="app-page page-enter">
      ${renderBreadcrumb(data)}
      ${renderHero(data)}

      <!-- Live Metrics -->
      <div class="grid-4 stagger-children" style="margin-bottom:var(--space-2xl);">
        <div class="metric metric--red">
          <div class="metric__label">Active Farmer Declarations</div>
          <div class="metric__value" data-count="48392">0</div>
          <div class="metric__change metric__change--up">▲ 342 today</div>
        </div>
        <div class="metric metric--purple">
          <div class="metric__label">Supply Forecasts</div>
          <div class="metric__value" data-count="2847">0</div>
          <div class="metric__change metric__change--up">▲ Updated 2 min ago</div>
        </div>
        <div class="metric metric--teal">
          <div class="metric__label">Districts Covered</div>
          <div class="metric__value" data-count="127">0</div>
          <div class="metric__change metric__change--up">▲ 8 new this month</div>
        </div>
        <div class="metric metric--orange">
          <div class="metric__label">Data Quality Score</div>
          <div class="metric__value">87.4</div>
          <div class="metric__change metric__change--up">▲ 2.1 pts this week</div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab-btn tab-btn--active" data-tab-btn="intel" data-target="intel-supply" onclick="switchTab('intel-supply','intel')">⚖️ Supply-Demand</button>
        <button class="tab-btn" data-tab-btn="intel" data-target="intel-heatmap" onclick="switchTab('intel-heatmap','intel')">🗺️ District Heatmap</button>
        <button class="tab-btn" data-tab-btn="intel" data-target="intel-pipeline" onclick="switchTab('intel-pipeline','intel')">⚙️ Data Pipeline</button>
        <button class="tab-btn" data-tab-btn="intel" data-target="intel-privacy" onclick="switchTab('intel-privacy','intel')">🔒 Privacy</button>
        <button class="tab-btn" data-tab-btn="intel" data-target="intel-modules" onclick="switchTab('intel-modules','intel')">🧠 All Modules</button>
      </div>

      <!-- Supply-Demand Tab -->
      <div id="intel-supply" data-tab-group="intel">
        <h3 style="font-family:var(--font-display);margin-bottom:var(--space-md);">📊 Real-Time Supply vs Demand Analysis</h3>
        <p style="color:var(--text-secondary);font-size:var(--fs-small);margin-bottom:var(--space-xl);">Live intelligence showing crop surplus/deficit across monitored regions. Updated daily from farmer declarations + FPO procurement data.</p>
        
        <div class="data-table-wrapper" style="margin-bottom:var(--space-2xl);">
          <table class="data-table">
            <thead><tr><th>Crop</th><th>Supply (30d)</th><th>Demand (30d)</th><th>Gap</th><th>Signal</th><th>12-Month Trend</th></tr></thead>
            <tbody>${supplyData.map(s => `<tr>
              <td><strong>${s.crop}</strong></td>
              <td>${s.supply}</td>
              <td>${s.demand}</td>
              <td style="font-weight:var(--fw-bold);color:${s.color==='success'?'var(--color-success)':s.color==='danger'?'var(--color-danger)':'var(--color-warning)'};">${s.gap}</td>
              <td><span class="badge badge--${s.color}">${s.signal}</span></td>
              <td style="width:140px;">${miniChart(s.trend, s.color==='success'?'rgba(34,197,94,0.7)':s.color==='danger'?'rgba(239,68,68,0.7)':'rgba(245,158,11,0.7)')}</td>
            </tr>`).join('')}</tbody>
          </table>
        </div>

        <div class="grid-3 stagger-children">
          <div class="feature-card" style="border-left:3px solid var(--color-success);">
            <div class="feature-card__icon">📈</div>
            <div class="feature-card__title">Buyer Alert: Tomato Surplus</div>
            <div class="feature-card__desc">AP producing 35% above demand. Best time to procure. Prices expected to drop 12% in 15 days.</div>
            <button class="btn btn--success btn--small" style="margin-top:var(--space-sm);" onclick="showToast('Alert subscribed!','success')">🔔 Subscribe</button>
          </div>
          <div class="feature-card" style="border-left:3px solid var(--color-danger);">
            <div class="feature-card__icon">⚠️</div>
            <div class="feature-card__title">Supply Warning: Onion Deficit</div>
            <div class="feature-card__desc">18% below demand. Kharif crop delayed by unseasonal rains. Prices may rise 20% in next 30 days.</div>
            <button class="btn btn--danger btn--small" style="margin-top:var(--space-sm);" onclick="showToast('Alert subscribed!','success')">🔔 Subscribe</button>
          </div>
          <div class="feature-card" style="border-left:3px solid var(--color-info);">
            <div class="feature-card__icon">🔮</div>
            <div class="feature-card__title">30-Day Forecast: Rice</div>
            <div class="feature-card__desc">Rabi harvest incoming from East Godavari + Krishna. Expected 1.2L tons supply. Market stable.</div>
            <button class="btn btn--secondary btn--small" style="margin-top:var(--space-sm);" onclick="showToast('Full report opening...','info')">📄 Full Report</button>
          </div>
        </div>
      </div>

      <!-- Heatmap Tab -->
      <div id="intel-heatmap" data-tab-group="intel" style="display:none;">
        <h3 style="font-family:var(--font-display);margin-bottom:var(--space-lg);">🗺️ District-Level Intelligence</h3>
        <div class="data-table-wrapper" style="margin-bottom:var(--space-xl);">
          <table class="data-table">
            <thead><tr><th>District</th><th>Farmers</th><th>Declarations</th><th>Coverage</th><th>Top Crop</th><th>Activity Level</th></tr></thead>
            <tbody>${districtHeatmap.map(d => `<tr>
              <td><strong>${d.district}</strong></td>
              <td>${d.farmers.toLocaleString('en-IN')}</td>
              <td>${d.declarations.toLocaleString('en-IN')}</td>
              <td>
                <div style="display:flex;align-items:center;gap:8px;">
                  <div class="progress" style="flex:1;"><div class="progress__fill progress__fill--${d.coverage>70?'purple':d.coverage>60?'teal':'orange'}" style="width:${d.coverage}%;"></div></div>
                  <span style="font-size:var(--fs-xs);font-weight:var(--fw-bold);min-width:35px;">${d.coverage}%</span>
                </div>
              </td>
              <td>${d.topCrop}</td>
              <td><span class="badge badge--${d.activity==='Very High'?'success':d.activity==='High'?'medium':'low'}">${d.activity}</span></td>
            </tr>`).join('')}</tbody>
          </table>
        </div>
      </div>

      <!-- Pipeline Tab -->
      <div id="intel-pipeline" data-tab-group="intel" style="display:none;">
        <h3 style="font-family:var(--font-display);margin-bottom:var(--space-lg);">⚙️ Intelligence Pipeline</h3>
        <div class="data-table-wrapper" style="margin-bottom:var(--space-2xl);">
          <table class="data-table"><thead><tr><th>Frequency</th><th>Tasks</th><th>Status</th></tr></thead>
          <tbody>${data.pipeline.map((p,i) => `<tr>
            <td><strong>${p.frequency}</strong></td>
            <td>${p.tasks}</td>
            <td><span class="status status--active"><span class="live-dot" style="width:6px;height:6px;"></span> Running</span></td>
          </tr>`).join('')}</tbody></table>
        </div>

        <h3 style="font-family:var(--font-display);margin-bottom:var(--space-lg);">📥 Data Sources → 📤 Intelligence Outputs</h3>
        <div class="grid-2">
          <div>
            <h4 style="color:var(--text-accent);margin-bottom:var(--space-md);">📥 Ingestion</h4>
            ${data.dataIngestion.map(d => `<div class="activity-item" style="border:none;padding:var(--space-sm)"><div class="activity-icon" style="background:rgba(59,130,246,0.15);font-size:0.8rem;">📥</div><div style="font-size:var(--fs-small);color:var(--text-secondary);">${d}</div></div>`).join('')}
          </div>
          <div>
            <h4 style="color:var(--color-success);margin-bottom:var(--space-md);">📤 Output</h4>
            ${data.dataOutput.map(d => `<div class="activity-item" style="border:none;padding:var(--space-sm)"><div class="activity-icon" style="background:rgba(34,197,94,0.15);font-size:0.8rem;">📤</div><div style="font-size:var(--fs-small);color:var(--text-secondary);">${d}</div></div>`).join('')}
          </div>
        </div>
      </div>

      <!-- Privacy Tab -->
      <div id="intel-privacy" data-tab-group="intel" style="display:none;">
        <h3 style="font-family:var(--font-display);margin-bottom:var(--space-lg);">🔒 4-Tier Privacy Architecture</h3>
        <div class="data-table-wrapper">
          <table class="data-table"><thead><tr><th>Data Level</th><th>Access Rules</th><th>Classification</th></tr></thead>
          <tbody>${data.privacyTiers.map(p => `<tr>
            <td><strong>${p.level}</strong></td>
            <td>${p.access}</td>
            <td><span class="badge badge--${p.classification==='Private'?'critical':p.classification==='Intelligence'?'high':p.classification==='Public'?'success':'medium'}">${p.classification}</span></td>
          </tr>`).join('')}</tbody></table>
        </div>
      </div>

      <!-- Modules Tab -->
      <div id="intel-modules" data-tab-group="intel" style="display:none;">
        <div class="grid-3 stagger-children">
          ${data.features.map(f => `<div class="feature-card"><div class="feature-card__icon">${f.icon}</div><div class="feature-card__title">${f.title}</div><div class="feature-card__desc">${f.desc}</div><span class="feature-card__tag">${f.tag}</span></div>`).join('')}
        </div>
      </div>

      <div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted);font-size:var(--fs-xs);">
        Source: agriculture_ecosystem_full_architecture_blueprint.docx · agriculture_intelligence_full_report.docx<br/>Analysis Rating: ⭐⭐⭐⭐⭐ 92–95%
      </div>
    </main>`;

  setTimeout(() => window.animateCounters(), 100);
  return html;
}
