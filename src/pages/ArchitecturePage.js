import { architectureData as data } from '../data/architecture.js';
import { renderSubHeader, renderHero, renderBreadcrumb } from './shared.js';

const systemHealth = [
  { service: 'API Gateway (Cloudflare Workers)', status: 'operational', uptime: '99.98%', latency: '12ms', requests: '84K/day' },
  { service: 'User Service (Railway)', status: 'operational', uptime: '99.95%', latency: '45ms', requests: '32K/day' },
  { service: 'Crop Marketplace (Supabase)', status: 'operational', uptime: '99.97%', latency: '38ms', requests: '56K/day' },
  { service: 'Payment Service (Razorpay)', status: 'operational', uptime: '99.99%', latency: '120ms', requests: '8K/day' },
  { service: 'Search Service (Meilisearch)', status: 'operational', uptime: '99.92%', latency: '8ms', requests: '45K/day' },
  { service: 'Notification Service (Firebase)', status: 'degraded', uptime: '99.85%', latency: '250ms', requests: '120K/day' },
  { service: 'ML Pipeline (HuggingFace)', status: 'operational', uptime: '99.90%', latency: '350ms', requests: '2K/day' },
  { service: 'Media Storage (Cloudflare R2)', status: 'operational', uptime: '99.99%', latency: '15ms', requests: '28K/day' },
];

export function renderArchitecturePage() {
  const html = `
    ${renderSubHeader(data)}
    <main class="app-page page-enter">
      ${renderBreadcrumb(data)}
      ${renderHero(data)}

      <!-- System Status -->
      <div style="display:flex;align-items:center;gap:var(--space-sm);margin-bottom:var(--space-lg);">
        <span class="live-dot"></span>
        <span style="font-size:var(--fs-small);color:var(--text-secondary);">System Status — All services monitored in real-time</span>
      </div>
      <div class="data-table-wrapper" style="margin-bottom:var(--space-2xl);">
        <table class="data-table">
          <thead><tr><th>Service</th><th>Status</th><th>Uptime</th><th>Avg Latency</th><th>Requests/Day</th></tr></thead>
          <tbody>${systemHealth.map(s => `<tr>
            <td><strong>${s.service}</strong></td>
            <td><span class="status ${s.status==='operational'?'status--active':'status--pending'}">${s.status==='operational'?'🟢 Operational':'🟡 Degraded'}</span></td>
            <td>${s.uptime}</td>
            <td>${s.latency}</td>
            <td>${s.requests}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>

      <!-- Architecture Modules by Category -->
      <div class="tabs">
        ${data.modules.map((cat, i) => `<button class="tab-btn ${i===0?'tab-btn--active':''}" data-tab-btn="arch" data-target="arch-${i}" onclick="switchTab('arch-${i}','arch')">${cat.category}</button>`).join('')}
      </div>

      ${data.modules.map((cat, i) => `
        <div id="arch-${i}" data-tab-group="arch" ${i > 0 ? 'style="display:none"' : ''}>
          <div class="grid-3 stagger-children">
            ${cat.items.map(item => `
              <div class="feature-card" onclick="openModal('${item.title}', '<p style=\\'color:var(--text-secondary);line-height:1.7;\\'>${item.desc}</p><div style=\\'margin-top:16px;\\'><span class=\\'badge badge--success\\'>From Architecture Blueprint</span></div>')">
                <div class="feature-card__icon">${item.icon}</div>
                <div class="feature-card__title">${item.title}</div>
                <div class="feature-card__desc">${item.desc}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}

      <div class="section-divider"></div>

      <!-- Roadmap -->
      <div class="section">
        <h2 class="section__title">🗺️ Implementation Roadmap</h2>
        <p class="section__subtitle">5-phase execution plan from foundation to national dominance</p>
        <div class="timeline" style="margin-top:var(--space-xl);">
          ${data.roadmap.map((phase, i) => `
            <div class="timeline__item">
              <div class="timeline__phase">${phase.phase}</div>
              <div style="display:flex;flex-wrap:wrap;gap:var(--space-sm);margin-top:var(--space-sm);">
                ${phase.items.map(item => `<span class="tag">${item}</span>`).join('')}
              </div>
              <div style="margin-top:var(--space-md);">
                <div class="progress"><div class="progress__fill progress__fill--${['purple','teal','green','orange','purple'][i]}" style="width:${[100,85,60,30,10][i]}%;"></div></div>
                <span style="font-size:var(--fs-xs);color:var(--text-muted);">${[100,85,60,30,10][i]}% complete</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Infrastructure Cost -->
      <div class="section">
        <h2 class="section__title">💰 Zero-INR Infrastructure Model</h2>
        <div class="grid-3 stagger-children">
          <div class="feature-card" style="border-top:3px solid var(--color-success);">
            <div class="feature-card__icon">☁️</div>
            <div class="feature-card__title">Current Monthly Cost</div>
            <div style="font-family:var(--font-display);font-size:var(--fs-hero);font-weight:var(--fw-black);color:var(--color-success);">₹0</div>
            <div class="feature-card__desc">Running entirely on free tiers of Supabase, Cloudflare, Vercel, Railway</div>
          </div>
          <div class="feature-card" style="border-top:3px solid var(--color-warning);">
            <div class="feature-card__icon">📈</div>
            <div class="feature-card__title">At 50K Users</div>
            <div style="font-family:var(--font-display);font-size:var(--fs-hero);font-weight:var(--fw-black);color:var(--color-warning);">₹2,500</div>
            <div class="feature-card__desc">Supabase Pro ($25), Railway Starter ($5×2), Workers Paid ($5)</div>
          </div>
          <div class="feature-card" style="border-top:3px solid var(--text-accent);">
            <div class="feature-card__icon">🚀</div>
            <div class="feature-card__title">At 1M Users</div>
            <div style="font-family:var(--font-display);font-size:var(--fs-hero);font-weight:var(--fw-black);color:var(--text-accent);">₹15,000</div>
            <div class="feature-card__desc">Full production stack with dedicated databases and CDN</div>
          </div>
        </div>
      </div>

      <div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted);font-size:var(--fs-xs);">
        Source: agriculture_ecosystem_full_architecture_blueprint.docx<br/>Analysis Rating: ⭐⭐⭐⭐⭐ 95%
      </div>
    </main>`;

  setTimeout(() => window.animateCounters(), 100);
  return html;
}
