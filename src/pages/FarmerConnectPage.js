import { farmerconnectData as data } from '../data/farmerconnect.js';
import { renderSubHeader, renderHero, renderBreadcrumb } from './shared.js';

const properties = [
  { type: 'Apartment', title: '2 BHK Semi-Furnished in Gachibowli', location: 'Gachibowli, Hyderabad', rent: '₹18,000/mo', area: '1100 sq ft', floor: '3rd/8', furnish: 'Semi', verified: true, img: 'linear-gradient(135deg,#3498db,#2980b9)', badge: 'Urban Rental' },
  { type: 'Agricultural Land', title: '8 Acres Irrigated Farm Land — Krishna', location: 'Vijayawada, AP', rent: '₹45,000/acre/yr', area: '8 acres', floor: 'Canal water', furnish: 'Bore well', verified: true, img: 'linear-gradient(135deg,#27ae60,#2ecc71)', badge: 'Agri Land' },
  { type: 'PG', title: 'Women\'s PG near Hitech City — AC, Meals', location: 'Madhapur, Hyderabad', rent: '₹8,500/mo', area: 'Single sharing', floor: 'AC Room', furnish: 'Fully Furnished', verified: true, img: 'linear-gradient(135deg,#e74c3c,#c0392b)', badge: 'PG' },
  { type: 'Villa', title: '3 BHK Independent Villa — Kompally', location: 'Kompally, Hyderabad', rent: '₹35,000/mo', area: '2200 sq ft', floor: 'Ground+1', furnish: 'Unfurnished', verified: false, img: 'linear-gradient(135deg,#f39c12,#e67e22)', badge: 'Urban Rental' },
  { type: 'Agricultural Land', title: '15 Acres Drip-Irrigated for Lease', location: 'Kurnool, AP', rent: '₹35,000/acre/yr', area: '15 acres', floor: 'Drip system', furnish: 'Bore + Tank', verified: true, img: 'linear-gradient(135deg,#2ecc71,#27ae60)', badge: 'Agri Land' },
  { type: 'Apartment', title: '1 BHK Modern Flat near Manyata Tech', location: 'Hebbal, Bengaluru', rent: '₹16,500/mo', area: '650 sq ft', floor: '12th/18', furnish: 'Fully Furnished', verified: true, img: 'linear-gradient(135deg,#9b59b6,#8e44ad)', badge: 'Urban Rental' },
];

export function renderFarmerConnectPage() {
  const html = `
    ${renderSubHeader(data)}
    <main class="app-page page-enter">
      ${renderBreadcrumb(data)}
      ${renderHero(data)}

      <!-- Metrics -->
      <div class="grid-4 stagger-children" style="margin-bottom:var(--space-2xl);">
        <div class="metric metric--green"><div class="metric__label">Active Listings</div><div class="metric__value" data-count="24891">0</div><div class="metric__change metric__change--up">▲ 847 this week</div></div>
        <div class="metric metric--purple"><div class="metric__label">Verified Users</div><div class="metric__value" data-count="89432">0</div><div class="metric__change metric__change--up">▲ 2,341 this month</div></div>
        <div class="metric metric--teal"><div class="metric__label">Agreements Done</div><div class="metric__value" data-count="12847">0</div><div class="metric__change metric__change--up">▲ 12% this month</div></div>
        <div class="metric metric--orange"><div class="metric__label">Rent Collected</div><div class="metric__value">₹4.2Cr</div><div class="metric__change metric__change--up">▲ 18% this month</div></div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab-btn tab-btn--active" data-tab-btn="fc" data-target="fc-listings" onclick="switchTab('fc-listings','fc')">🏠 Property Search</button>
        <button class="tab-btn" data-tab-btn="fc" data-target="fc-plans" onclick="switchTab('fc-plans','fc')">💰 Pricing Plans</button>
        <button class="tab-btn" data-tab-btn="fc" data-target="fc-compete" onclick="switchTab('fc-compete','fc')">⚔️ vs Competition</button>
        <button class="tab-btn" data-tab-btn="fc" data-target="fc-market" onclick="switchTab('fc-market','fc')">📊 Market Size</button>
      </div>

      <!-- Search Tab -->
      <div id="fc-listings" data-tab-group="fc">
        <div style="display:flex;gap:var(--space-md);flex-wrap:wrap;margin-bottom:var(--space-lg);align-items:center;">
          <div class="search-bar" style="flex:1;min-width:250px;">
            <span class="search-bar__icon">🔍</span>
            <input type="text" class="search-bar__input" placeholder="Search by location, property type..." oninput="filterCards(this, '#property-grid')">
          </div>
          <select class="form-select" style="width:auto;min-width:140px;" onchange="showToast('Filter applied','info')">
            <option>All Types</option><option>🏙️ Apartment</option><option>🌾 Agri Land</option><option>🏠 PG</option><option>🏡 Villa</option>
          </select>
          <select class="form-select" style="width:auto;min-width:140px;">
            <option>All Locations</option><option>Hyderabad</option><option>Bengaluru</option><option>Andhra Pradesh</option>
          </select>
        </div>
        <div class="filter-chips">
          <span class="filter-chip filter-chip--active">All</span>
          <span class="filter-chip" onclick="showToast('Verified only','info')">✅ Verified Only</span>
          <span class="filter-chip">🏙️ Urban</span>
          <span class="filter-chip">🌾 Agricultural</span>
          <span class="filter-chip">🏠 PG/Co-living</span>
          <span class="filter-chip">🚫 Zero Broker</span>
        </div>
        <div class="grid-3" id="property-grid">
          ${properties.map(p => `
            <div class="listing-card" data-searchable="${p.title} ${p.location} ${p.type}" onclick="openModal('${p.title}', '<div style=\\'display:flex;flex-direction:column;gap:12px;\\'><p><strong>Type:</strong> ${p.type}</p><p><strong>Location:</strong> ${p.location}</p><p><strong>Area:</strong> ${p.area}</p><p><strong>Floor:</strong> ${p.floor}</p><p><strong>Furnishing:</strong> ${p.furnish}</p><p><strong>Rent:</strong> <span style=\\'color:var(--color-success);font-weight:900;\\'>${p.rent}</span></p>${p.verified?'<p>✅ Verified Listing</p>':''}<div style=\\'display:flex;gap:8px;margin-top:12px;\\'><button class=\\'btn btn--primary\\' onclick=\\'showToast(\"Contact sent!\",\"success\")\\'>📞 Contact</button><button class=\\'btn btn--secondary\\' onclick=\\'showToast(\"Visit scheduled!\",\"info\")\\'>📅 Schedule Visit</button></div></div>')">
              <div class="listing-card__img" style="background:${p.img}">
                <span class="listing-card__img-badge">${p.badge}</span>
                ${p.verified ? '<span class="listing-card__img-badge" style="margin-left:auto;">✅ Verified</span>' : ''}
              </div>
              <div class="listing-card__body">
                <div class="listing-card__title">${p.title}</div>
                <div class="listing-card__location">📍 ${p.location}</div>
                <div class="listing-card__meta"><span>📐 ${p.area}</span><span>${p.furnish}</span></div>
                <div class="listing-card__price">${p.rent}</div>
                <div class="listing-card__actions">
                  <button class="btn btn--primary btn--small" onclick="event.stopPropagation();showToast('Contact request sent!','success')">📞 Contact</button>
                  <button class="btn btn--secondary btn--small" onclick="event.stopPropagation();showToast('Saved to shortlist','info')">♥ Save</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Plans Tab -->
      <div id="fc-plans" data-tab-group="fc" style="display:none;">
        <h3 style="font-family:var(--font-display);margin-bottom:var(--space-lg);color:var(--text-accent);">🔍 Seeker Plans</h3>
        <div class="grid-4" style="margin-bottom:var(--space-2xl);">${data.revenue.seekerPlans.map(p => `
          <div class="revenue-tier"><div class="revenue-tier__name">${p.name}</div><div class="revenue-tier__price">${p.price}</div><div style="font-size:var(--fs-xs);color:var(--text-muted);margin-bottom:var(--space-sm);">${p.duration}</div><div style="font-size:var(--fs-small);color:var(--text-secondary);">${p.features}</div>
          <button class="btn btn--primary btn--small" style="width:100%;margin-top:var(--space-md);justify-content:center;" onclick="showToast('${p.name} plan selected!','success')">Choose</button></div>`).join('')}</div>
        <h3 style="font-family:var(--font-display);margin-bottom:var(--space-lg);color:var(--text-accent);">🏠 Owner Plans</h3>
        <div class="grid-4">${data.revenue.ownerPlans.map(p => `
          <div class="revenue-tier"><div class="revenue-tier__name">${p.name}</div><div class="revenue-tier__price">${p.price}</div><div style="font-size:var(--fs-xs);color:var(--text-muted);margin-bottom:var(--space-sm);">${p.duration}</div><div style="font-size:var(--fs-small);color:var(--text-secondary);">${p.features}</div>
          <button class="btn btn--primary btn--small" style="width:100%;margin-top:var(--space-md);justify-content:center;" onclick="showToast('${p.name} plan selected!','success')">Choose</button></div>`).join('')}</div>
      </div>

      <!-- Competitive Tab -->
      <div id="fc-compete" data-tab-group="fc" style="display:none;">
        <div class="data-table-wrapper">
          <table class="data-table"><thead><tr><th>Platform</th><th>Urban</th><th>Agri Land</th><th>PG</th><th>Society</th><th>Zero Broker</th><th>Vernacular</th></tr></thead>
          <tbody>${data.competitive.map(c => `<tr style="${c.name==='FarmerConnect'?'background:rgba(123,47,247,0.08);':''}"><td><strong>${c.name}</strong></td><td>${c.urban}</td><td>${c.agri}</td><td>${c.pg}</td><td>${c.society}</td><td>${c.zeroBroker}</td><td>${c.vernacular}</td></tr>`).join('')}</tbody></table>
        </div>
        <div class="grid-2 stagger-children" style="margin-top:var(--space-2xl);">
          ${data.differentiators.map((d,i) => `<div class="feature-card"><div class="feature-card__icon">${['🌾','🌐','📡','🤖','🛡️','📝','💰'][i]}</div><div class="feature-card__desc">${d}</div></div>`).join('')}
        </div>
      </div>

      <!-- Market Tab -->
      <div id="fc-market" data-tab-group="fc" style="display:none;">
        <div class="data-table-wrapper" style="margin-bottom:var(--space-2xl);">
          <table class="data-table"><thead><tr><th>Segment</th><th>Total TAM</th><th>FarmerConnect Claim (Y3)</th></tr></thead>
          <tbody>${data.marketSize.map(m => `<tr><td>${m.segment}</td><td><strong>${m.tam}</strong></td><td style="color:var(--color-success);">${m.claim}</td></tr>`).join('')}</tbody></table>
        </div>
        <div class="grid-4">
          <div class="stat-card"><div class="stat-card__number">${data.unitEconomics.cac}</div><div class="stat-card__label">CAC</div></div>
          <div class="stat-card"><div class="stat-card__number">${data.unitEconomics.ltv}</div><div class="stat-card__label">LTV</div></div>
          <div class="stat-card"><div class="stat-card__number">${data.unitEconomics.ltvCacRatio}</div><div class="stat-card__label">LTV:CAC</div></div>
          <div class="stat-card"><div class="stat-card__number">${data.unitEconomics.grossMargin}</div><div class="stat-card__label">Gross Margin</div></div>
        </div>
      </div>

      <div style="text-align:center;padding:var(--space-2xl);color:var(--text-muted);font-size:var(--fs-xs);">Source: FarmerConnect_PRD_v1.md.pdf<br/>Analysis Rating: ⭐⭐⭐⭐⭐ 94%</div>
    </main>`;

  setTimeout(() => window.animateCounters(), 100);
  return html;
}
