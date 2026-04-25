import { agriflowData as data } from '../data/agriflow.js';
import { renderSubHeader, renderHero, renderBreadcrumb } from './shared.js';

const cropListings = [
  { crop: 'Tomato (Hybrid NS 585)', qty: '12 Tons', grade: 'Grade A', location: 'Krishna, AP', harvest: '8 days', price: '₹22/kg', farmer: 'Raju Reddy', status: 'active', organic: false, img: 'linear-gradient(135deg,#e74c3c,#c0392b)' },
  { crop: 'Onion (Nasik Red)', qty: '85 Tons', grade: 'Premium', location: 'Nashik, MH', harvest: 'Available Now', price: '₹18/kg', farmer: 'Nashik Farmers FPC', status: 'active', organic: false, img: 'linear-gradient(135deg,#8e44ad,#9b59b6)' },
  { crop: 'Chilli (Guntur Sannam)', qty: '5 Tons', grade: 'Grade A', location: 'Guntur, AP', harvest: '15 days', price: '₹85/kg', farmer: 'Lakshmi Devi', status: 'active', organic: true, img: 'linear-gradient(135deg,#e67e22,#d35400)' },
  { crop: 'Groundnut (TMV-2)', qty: '30 Tons', grade: 'Grade B', location: 'Kurnool, AP', harvest: '22 days', price: '₹52/kg', farmer: 'Kurnool Rythu FPC', status: 'pending', organic: false, img: 'linear-gradient(135deg,#f39c12,#e67e22)' },
  { crop: 'Rice (Sona Masoori)', qty: '200 Tons', grade: 'Premium', location: 'East Godavari, AP', harvest: 'Available Now', price: '₹32/kg', farmer: 'Godavari Farmers Coop', status: 'active', organic: true, img: 'linear-gradient(135deg,#27ae60,#2ecc71)' },
  { crop: 'Cotton (Bt Hybrid)', qty: '45 Tons', grade: 'Grade A', location: 'Adilabad, TS', harvest: '30 days', price: '₹68/kg', farmer: 'Pradeep Kumar', status: 'active', organic: false, img: 'linear-gradient(135deg,#3498db,#2980b9)' },
];

const buyerInquiries = [
  { buyer: 'Vikram Traders, Mumbai', type: 'Trader', crop: 'Tomato', qty: '50 Tons', timeline: '10 days', status: 'new' },
  { buyer: 'Priya Exports, BLR', type: 'Exporter', crop: 'Chilli (Organic)', qty: '20 Tons', timeline: '30 days', status: 'replied' },
  { buyer: 'FreshMart Retail, HYD', type: 'Retailer', crop: 'Onion', qty: '10 Tons/week', timeline: 'Ongoing', status: 'negotiating' },
  { buyer: 'AP Govt Procurement', type: 'Government', crop: 'Rice', qty: '500 Tons', timeline: '45 days', status: 'new' },
];

function renderListingCard(l) {
  return `<div class="listing-card" data-searchable="${l.crop} ${l.location} ${l.farmer} ${l.grade}" onclick="openModal('${l.crop}', \`
    <div style='display:flex;flex-direction:column;gap:var(--space-md);'>
      <div style='display:flex;justify-content:space-between;'><span style='color:var(--text-secondary)'>Farmer/FPO</span><strong>${l.farmer}</strong></div>
      <div style='display:flex;justify-content:space-between;'><span style='color:var(--text-secondary)'>Quantity</span><strong>${l.qty}</strong></div>
      <div style='display:flex;justify-content:space-between;'><span style='color:var(--text-secondary)'>Quality</span><strong>${l.grade}</strong></div>
      <div style='display:flex;justify-content:space-between;'><span style='color:var(--text-secondary)'>Location</span><strong>${l.location}</strong></div>
      <div style='display:flex;justify-content:space-between;'><span style='color:var(--text-secondary)'>Harvest</span><strong>${l.harvest}</strong></div>
      <div style='display:flex;justify-content:space-between;'><span style='color:var(--text-secondary)'>Price</span><strong style='color:var(--color-success)'>${l.price}</strong></div>
      <div style='display:flex;gap:var(--space-sm);margin-top:var(--space-md);'>
        <button class='btn btn--primary' onclick='showToast(\"Inquiry sent to ${l.farmer}!\",\"success\")'>📬 Send Inquiry</button>
        <button class='btn btn--secondary' onclick='showToast(\"Added to watchlist\",\"info\")'>⭐ Watchlist</button>
      </div>
    </div>\`)">
    <div class="listing-card__img" style="background:${l.img}">
      ${l.organic ? '<span class="listing-card__img-badge">🌿 Organic</span>' : ''}
      <span class="listing-card__img-badge" style="margin-left:auto;">${l.grade}</span>
    </div>
    <div class="listing-card__body">
      <div class="listing-card__title">${l.crop}</div>
      <div class="listing-card__location">📍 ${l.location} · ${l.farmer}</div>
      <div class="listing-card__meta">
        <span>📦 ${l.qty}</span><span>📅 ${l.harvest}</span>
      </div>
      <div class="listing-card__price">${l.price}</div>
      <div class="listing-card__actions">
        <button class="btn btn--primary btn--small" onclick="event.stopPropagation();showToast('Inquiry sent!','success')">📬 Inquire</button>
        <button class="btn btn--secondary btn--small" onclick="event.stopPropagation();showToast('Added to watchlist','info')">⭐ Save</button>
      </div>
    </div>
  </div>`;
}

export function renderAgriFlowPage() {
  const html = `
    ${renderSubHeader(data)}
    <main class="app-page page-enter">
      ${renderBreadcrumb(data)}
      ${renderHero(data)}

      <!-- Dashboard Metrics -->
      <div class="grid-4 stagger-children" style="margin-bottom:var(--space-2xl);">
        <div class="metric metric--purple">
          <div class="metric__label">Registered Farmers</div>
          <div class="metric__value" data-count="48392">0</div>
          <div class="metric__change metric__change--up">▲ 1,247 this week</div>
        </div>
        <div class="metric metric--teal">
          <div class="metric__label">Active Declarations</div>
          <div class="metric__value" data-count="12847">0</div>
          <div class="metric__change metric__change--up">▲ 342 today</div>
        </div>
        <div class="metric metric--green">
          <div class="metric__label">FPOs Onboarded</div>
          <div class="metric__value" data-count="847">0</div>
          <div class="metric__change metric__change--up">▲ 23 this month</div>
        </div>
        <div class="metric metric--orange">
          <div class="metric__label">Buyer Inquiries</div>
          <div class="metric__value" data-count="3291">0</div>
          <div class="metric__change metric__change--up">▲ 89 today</div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs" style="margin-bottom:var(--space-xl);">
        <button class="tab-btn tab-btn--active" data-tab-btn="agri" data-target="agri-marketplace" onclick="switchTab('agri-marketplace','agri')">🔍 Marketplace</button>
        <button class="tab-btn" data-tab-btn="agri" data-target="agri-inquiries" onclick="switchTab('agri-inquiries','agri')">📬 Buyer Inquiries</button>
        <button class="tab-btn" data-tab-btn="agri" data-target="agri-features" onclick="switchTab('agri-features','agri')">🧩 All Features</button>
        <button class="tab-btn" data-tab-btn="agri" data-target="agri-personas" onclick="switchTab('agri-personas','agri')">👥 User Personas</button>
        <button class="tab-btn" data-tab-btn="agri" data-target="agri-revenue" onclick="switchTab('agri-revenue','agri')">💰 Revenue</button>
        <button class="tab-btn" data-tab-btn="agri" data-target="agri-stack" onclick="switchTab('agri-stack','agri')">🛠️ Tech Stack</button>
      </div>

      <!-- Marketplace Tab -->
      <div id="agri-marketplace" data-tab-group="agri">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:var(--space-md);margin-bottom:var(--space-lg);">
          <div>
            <h2 class="section__title">🔍 Supply Marketplace</h2>
            <p class="section__subtitle">Live crop listings from farmers and FPOs across India</p>
          </div>
          <div class="search-bar">
            <span class="search-bar__icon">🔍</span>
            <input type="text" class="search-bar__input" placeholder="Search crops, locations, farmers..." oninput="filterCards(this, '#listings-grid')" id="search-listings">
          </div>
        </div>
        <div class="filter-chips">
          <span class="filter-chip filter-chip--active">All Crops</span>
          <span class="filter-chip" onclick="showToast('Filter: Tomato','info')">🍅 Tomato</span>
          <span class="filter-chip" onclick="showToast('Filter: Onion','info')">🧅 Onion</span>
          <span class="filter-chip" onclick="showToast('Filter: Rice','info')">🌾 Rice</span>
          <span class="filter-chip" onclick="showToast('Filter: Chilli','info')">🌶️ Chilli</span>
          <span class="filter-chip" onclick="showToast('Filter: Organic Only','info')">🌿 Organic</span>
          <span class="filter-chip" onclick="showToast('Filter: Available Now','info')">⚡ Available Now</span>
        </div>
        <div class="grid-3" id="listings-grid">
          ${cropListings.map(renderListingCard).join('')}
        </div>
      </div>

      <!-- Buyer Inquiries Tab -->
      <div id="agri-inquiries" data-tab-group="agri" style="display:none;">
        <h2 class="section__title" style="margin-bottom:var(--space-lg);">📬 Recent Buyer Inquiries</h2>
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead><tr><th>Buyer</th><th>Type</th><th>Crop</th><th>Qty Needed</th><th>Timeline</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              ${buyerInquiries.map(q => `<tr>
                <td><strong>${q.buyer}</strong></td>
                <td><span class="badge badge--medium">${q.type}</span></td>
                <td>${q.crop}</td>
                <td>${q.qty}</td>
                <td>${q.timeline}</td>
                <td><span class="status status--${q.status === 'new' ? 'active' : q.status === 'replied' ? 'sold' : 'pending'}">${q.status === 'new' ? '🟢 New' : q.status === 'replied' ? '💬 Replied' : '🤝 Negotiating'}</span></td>
                <td><button class="btn btn--primary btn--small" onclick="showToast('Reply sent to ${q.buyer}','success')">Reply</button></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- All Features Tab -->
      <div id="agri-features" data-tab-group="agri" style="display:none;">
        <h2 class="section__title" style="margin-bottom:var(--space-sm);">🧩 Complete Feature Set</h2>
        <p class="section__subtitle" style="margin-bottom:var(--space-xl);">12 major feature modules from the AgriFlow PRD — sourced from 200+ specifications</p>
        <div class="grid-3 stagger-children">
          ${data.features.map(f => `
            <div class="feature-card" onclick="openModal('${f.title}', '<p style=\\'color:var(--text-secondary);line-height:1.7;\\'>${f.desc}</p><br/><span class=\\'badge badge--success\\'>${f.tag}</span>')">
              <div class="feature-card__icon">${f.icon}</div>
              <div class="feature-card__title">${f.title}</div>
              <div class="feature-card__desc">${f.desc}</div>
              <span class="feature-card__tag">${f.tag}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Personas Tab -->
      <div id="agri-personas" data-tab-group="agri" style="display:none;">
        <h2 class="section__title" style="margin-bottom:var(--space-lg);">👥 Platform User Personas</h2>
        <div class="grid-3 stagger-children">
          ${data.personas.map((p, i) => `
            <div class="persona-card" onclick="openModal('${p.name} — ${p.role}', '<div style=\\'display:flex;flex-direction:column;gap:12px;\\'><p><strong>Age:</strong> ${p.age}</p><p><strong>Device:</strong> ${p.device}</p><p><strong>Language:</strong> ${p.lang}</p><p><strong>Pain:</strong> ${p.pain}</p><p><strong>Goal:</strong> ${p.goal}</p></div>')" style="cursor:pointer;">
              <div style="font-size:2rem;margin-bottom:8px;">${['👨‍🌾','👨‍💼','📈','✈️','🏭','🏛️'][i]}</div>
              <div class="persona-card__name">${p.name}</div>
              <div class="persona-card__role">${p.role}</div>
              <div class="persona-card__detail"><strong>Pain:</strong> ${p.pain}</div>
              <div class="persona-card__detail"><strong>Goal:</strong> ${p.goal}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Revenue Tab -->
      <div id="agri-revenue" data-tab-group="agri" style="display:none;">
        <h2 class="section__title" style="margin-bottom:var(--space-lg);">💰 Revenue Architecture</h2>
        <div class="tabs">
          ${data.revenue.map((t, i) => `<button class="tab-btn ${i===0?'tab-btn--active':''}" data-tab-btn="revenue" data-target="rev-${i}" onclick="switchTab('rev-${i}','revenue')">${t.tier}</button>`).join('')}
        </div>
        ${data.revenue.map((tier, i) => `
          <div id="rev-${i}" data-tab-group="revenue" ${i > 0 ? 'style="display:none"' : ''}>
            <div class="grid-3">${tier.plans.map(p => `
              <div class="revenue-tier">
                <div class="revenue-tier__name">${p.name}</div>
                <div class="revenue-tier__price">${p.price}</div>
                <ul class="revenue-tier__features">${p.features.map(f => `<li>${f}</li>`).join('')}</ul>
                <button class="btn btn--primary" style="width:100%;margin-top:var(--space-md);justify-content:center;" onclick="showToast('${p.name} plan selected!','success')">Choose Plan</button>
              </div>
            `).join('')}</div>
          </div>
        `).join('')}
      </div>

      <!-- Tech Stack Tab -->
      <div id="agri-stack" data-tab-group="agri" style="display:none;">
        <h2 class="section__title" style="margin-bottom:var(--space-lg);">🛠️ Zero-INR Tech Stack</h2>
        <div class="data-table-wrapper">
          <table class="data-table"><thead><tr><th>Layer</th><th>Service</th><th>Free Tier</th></tr></thead>
          <tbody>${data.techStack.map(t => `<tr><td>${t.layer}</td><td><strong>${t.service}</strong></td><td>${t.free}</td></tr>`).join('')}</tbody></table>
        </div>
      </div>

      <div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted);font-size:var(--fs-xs);">
        Source: agriculture_supply_intelligence_platform_prd.docx · AgriFlow_India_PRD_v1.md.pdf<br/>Analysis Rating: ⭐⭐⭐⭐⭐ 98%
      </div>
    </main>`;

  setTimeout(() => window.animateCounters(), 100);
  return html;
}
