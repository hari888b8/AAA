import { kisanconnectData as data } from '../data/kisanconnect.js';
import { renderSubHeader, renderHero, renderBreadcrumb } from './shared.js';

const equipmentListings = [
  { name: 'Mahindra 265 DI Tractor', type: 'Tractor', hourly: '₹350/hr', daily: '₹2,800/day', operator: true, location: 'Guntur, AP', rating: 4.6, img: 'linear-gradient(135deg,#e74c3c,#c0392b)', available: true },
  { name: 'Kubota PRO-68 Harvester', type: 'Harvester', hourly: '₹800/hr', daily: '₹6,500/day', operator: true, location: 'Krishna, AP', rating: 4.8, img: 'linear-gradient(135deg,#f39c12,#e67e22)', available: true },
  { name: 'Power Spray Pump (16L)', type: 'Sprayer', hourly: '₹50/hr', daily: '₹400/day', operator: false, location: 'Kurnool, AP', rating: 4.2, img: 'linear-gradient(135deg,#27ae60,#2ecc71)', available: true },
  { name: 'Rotavator — 5ft Heavy', type: 'Rotavator', hourly: '₹450/hr', daily: '₹3,200/day', operator: true, location: 'Nellore, AP', rating: 4.5, img: 'linear-gradient(135deg,#3498db,#2980b9)', available: false },
];

const jobs = [
  { title: 'Farm Supervisor — Paddy Cultivation', employer: 'Godavari Farms', type: 'Full-time', salary: '₹18,000–₹22,000/mo', location: 'East Godavari, AP', vacancies: 3, posted: '2 days ago' },
  { title: 'Harvest Labourers — Cotton Picking', employer: 'Adilabad Cotton Co-op', type: 'Seasonal', salary: '₹500–₹650/day', location: 'Adilabad, TS', vacancies: 25, posted: '1 day ago' },
  { title: 'Drip Irrigation Technician', employer: 'Jain Irrigation', type: 'Contract', salary: '₹15,000–₹20,000/mo', location: 'Multiple Locations', vacancies: 8, posted: '3 days ago' },
  { title: 'Soil Testing Lab Assistant', employer: 'AP Agri Dept', type: 'Part-time', salary: '₹12,000/mo', location: 'Guntur, AP', vacancies: 2, posted: '5 days ago' },
  { title: 'Veterinary Assistant — Cattle Farm', employer: 'Nandyal Dairy', type: 'Full-time', salary: '₹16,000–₹20,000/mo', location: 'Nandyal, AP', vacancies: 1, posted: '1 week ago' },
];

const services = [
  { title: 'Drip Irrigation Installation', provider: 'Krishna Agri Services', pricing: '₹8,500/acre', rating: 4.7, experience: '12 yrs', radius: '30 km' },
  { title: 'Soil Testing & Analysis', provider: 'AP Soil Labs', pricing: '₹450/sample', rating: 4.5, experience: '8 yrs', radius: '50 km' },
  { title: 'Pest Control — Organic', provider: 'GreenGuard Solutions', pricing: '₹2,200/acre', rating: 4.3, experience: '6 yrs', radius: '25 km' },
  { title: 'Warehouse Storage', provider: 'Cold Chain AP', pricing: '₹3/kg/month', rating: 4.6, experience: '15 yrs', radius: '100 km' },
];

export function renderKisanConnectPage() {
  const html = `
    ${renderSubHeader(data)}
    <main class="app-page page-enter">
      ${renderBreadcrumb(data)}
      ${renderHero(data)}

      <!-- Metrics -->
      <div class="grid-4 stagger-children" style="margin-bottom:var(--space-2xl);">
        <div class="metric metric--orange"><div class="metric__label">Equipment Listed</div><div class="metric__value" data-count="4892">0</div><div class="metric__change metric__change--up">▲ 214 this month</div></div>
        <div class="metric metric--purple"><div class="metric__label">Bookings Completed</div><div class="metric__value" data-count="28441">0</div><div class="metric__change metric__change--up">▲ 1,240 this month</div></div>
        <div class="metric metric--teal"><div class="metric__label">Service Providers</div><div class="metric__value" data-count="6320">0</div><div class="metric__change metric__change--up">▲ 320 this quarter</div></div>
        <div class="metric metric--green"><div class="metric__label">Jobs Filled</div><div class="metric__value" data-count="12480">0</div><div class="metric__change metric__change--up">▲ 840 this month</div></div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab-btn tab-btn--active" data-tab-btn="kc" data-target="kc-equip" onclick="switchTab('kc-equip','kc')">🚜 Equipment Rental</button>
        <button class="tab-btn" data-tab-btn="kc" data-target="kc-services" onclick="switchTab('kc-services','kc')">🔧 Rural Services</button>
        <button class="tab-btn" data-tab-btn="kc" data-target="kc-jobs" onclick="switchTab('kc-jobs','kc')">💼 Job Marketplace</button>
        <button class="tab-btn" data-tab-btn="kc" data-target="kc-arch" onclick="switchTab('kc-arch','kc')">🏗️ Architecture</button>
        <button class="tab-btn" data-tab-btn="kc" data-target="kc-revenue" onclick="switchTab('kc-revenue','kc')">💰 Revenue</button>
      </div>

      <!-- Equipment Tab -->
      <div id="kc-equip" data-tab-group="kc">
        <div style="display:flex;gap:var(--space-md);flex-wrap:wrap;margin-bottom:var(--space-lg);">
          <div class="search-bar" style="flex:1;min-width:250px;">
            <span class="search-bar__icon">🔍</span>
            <input type="text" class="search-bar__input" placeholder="Search equipment..." oninput="filterCards(this, '#equip-grid')">
          </div>
          <div class="filter-chips">
            <span class="filter-chip filter-chip--active">All</span>
            <span class="filter-chip">🚜 Tractor</span>
            <span class="filter-chip">🌾 Harvester</span>
            <span class="filter-chip">💨 Sprayer</span>
          </div>
        </div>
        <div class="grid-2" id="equip-grid">
          ${equipmentListings.map(e => `
            <div class="listing-card" data-searchable="${e.name} ${e.type} ${e.location}" onclick="openModal('${e.name}', '<div style=\\'display:flex;flex-direction:column;gap:12px;\\'><p><strong>Type:</strong> ${e.type}</p><p><strong>Hourly:</strong> ${e.hourly}</p><p><strong>Daily:</strong> ${e.daily}</p><p><strong>Operator:</strong> ${e.operator?'Included':'Not included'}</p><p><strong>Location:</strong> ${e.location}</p><p><strong>Rating:</strong> ⭐ ${e.rating}</p><div style=\\'display:flex;gap:8px;margin-top:12px;\\'><button class=\\'btn btn--primary\\' onclick=\\'showToast(\"Booking confirmed!\",\"success\")\\'>📅 Book Now</button><button class=\\'btn btn--secondary\\' onclick=\\'showToast(\"Chat started\",\"info\")\\'>💬 Chat</button></div></div>')">
              <div class="listing-card__img" style="background:${e.img};display:flex;align-items:center;justify-content:center;font-size:3rem;">🚜</div>
              <div class="listing-card__body">
                <div style="display:flex;justify-content:space-between;align-items:start;">
                  <div class="listing-card__title">${e.name}</div>
                  <span class="status ${e.available ? 'status--active' : 'status--pending'}">${e.available ? 'Available' : 'Booked'}</span>
                </div>
                <div class="listing-card__location">📍 ${e.location} · ⭐ ${e.rating}</div>
                <div class="listing-card__meta"><span>${e.hourly}</span><span>${e.daily}</span><span>${e.operator?'👷 Operator incl.':''}</span></div>
                <div class="listing-card__price">${e.daily}</div>
                <div class="listing-card__actions">
                  <button class="btn btn--primary btn--small" onclick="event.stopPropagation();showToast('Booking sent!','success')" ${!e.available?'disabled':''}>${e.available?'📅 Book':'Unavailable'}</button>
                  <button class="btn btn--secondary btn--small" onclick="event.stopPropagation();showToast('Quote requested','info')">💬 Quote</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Services Tab -->
      <div id="kc-services" data-tab-group="kc" style="display:none;">
        <div class="grid-2 stagger-children">
          ${services.map(s => `
            <div class="listing-card">
              <div class="listing-card__body">
                <div class="listing-card__title">${s.title}</div>
                <div class="listing-card__location">👤 ${s.provider} · ⭐ ${s.rating}</div>
                <div class="listing-card__meta"><span>🕐 ${s.experience}</span><span>📍 ${s.radius} radius</span></div>
                <div class="listing-card__price">${s.pricing}</div>
                <div class="listing-card__actions">
                  <button class="btn btn--primary btn--small" onclick="showToast('Service request sent to ${s.provider}!','success')">📞 Request</button>
                  <button class="btn btn--secondary btn--small" onclick="showToast('Custom quote requested','info')">💬 Get Quote</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Jobs Tab -->
      <div id="kc-jobs" data-tab-group="kc" style="display:none;">
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead><tr><th>Position</th><th>Employer</th><th>Type</th><th>Salary</th><th>Location</th><th>Vacancies</th><th>Posted</th><th>Action</th></tr></thead>
            <tbody>${jobs.map(j => `<tr>
              <td><strong>${j.title}</strong></td>
              <td>${j.employer}</td>
              <td><span class="badge badge--${j.type==='Full-time'?'success':j.type==='Seasonal'?'high':j.type==='Contract'?'medium':'low'}">${j.type}</span></td>
              <td style="color:var(--color-success);font-weight:var(--fw-bold);">${j.salary}</td>
              <td>📍 ${j.location}</td>
              <td>${j.vacancies}</td>
              <td style="color:var(--text-muted);">${j.posted}</td>
              <td><button class="btn btn--primary btn--small" onclick="showToast('Application submitted for ${j.title}!','success')">Apply</button></td>
            </tr>`).join('')}</tbody>
          </table>
        </div>
      </div>

      <!-- Architecture Tab -->
      <div id="kc-arch" data-tab-group="kc" style="display:none;">
        <h3 style="font-family:var(--font-display);margin-bottom:var(--space-lg);">🏗️ 14-Service Microservices Architecture</h3>
        <div class="data-table-wrapper" style="margin-bottom:var(--space-2xl);">
          <table class="data-table"><thead><tr><th>Layer</th><th>Technology</th><th>Purpose</th><th>Free Tier</th></tr></thead>
          <tbody>${data.architecture.map(a => `<tr><td>${a.layer}</td><td><strong>${a.tech}</strong></td><td>${a.purpose}</td><td>${a.freeTier}</td></tr>`).join('')}</tbody></table>
        </div>
        <h3 style="font-family:var(--font-display);margin-bottom:var(--space-lg);">📨 Event-Driven Communication</h3>
        <div class="data-table-wrapper" style="margin-bottom:var(--space-2xl);">
          <table class="data-table"><thead><tr><th>Event</th><th>Producer</th><th>Consumers</th><th>Payload</th></tr></thead>
          <tbody>${data.events.map(e => `<tr><td><code style="color:var(--text-accent);">${e.name}</code></td><td>${e.producer}</td><td>${e.consumers}</td><td><code style="font-size:var(--fs-xs);">${e.payload}</code></td></tr>`).join('')}</tbody></table>
        </div>
        <h3 style="font-family:var(--font-display);margin-bottom:var(--space-lg);">🎯 8 Design Laws</h3>
        <div class="grid-2 stagger-children">
          ${data.designLaws.map((law,i) => { const [t,...r]=law.split(':'); return `<div class="feature-card"><div class="feature-card__icon">${['📡','🎙️','👆','📋','❓','🎨','🎉','🛡️'][i]}</div><div class="feature-card__title">${t.trim()}</div><div class="feature-card__desc">${r.join(':').trim()}</div></div>`; }).join('')}
        </div>
      </div>

      <!-- Revenue Tab -->
      <div id="kc-revenue" data-tab-group="kc" style="display:none;">
        <div class="data-table-wrapper">
          <table class="data-table"><thead><tr><th>Revenue Stream</th><th>Marketplace</th><th>Model</th><th>Rate</th></tr></thead>
          <tbody>${data.revenue.map(r => `<tr><td><strong>${r.stream}</strong></td><td>${r.marketplace}</td><td>${r.model}</td><td style="color:var(--color-success);font-weight:var(--fw-bold);">${r.rate}</td></tr>`).join('')}</tbody></table>
        </div>
      </div>

      <div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted);font-size:var(--fs-xs);">Source: KisanConnect_PRD_v1.0.docx<br/>Analysis Rating: ⭐⭐⭐⭐⭐ 97%</div>
    </main>`;

  setTimeout(() => window.animateCounters(), 100);
  return html;
}
