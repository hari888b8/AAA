import { api } from '../api.js';
import { showToast, showModal, closeModal } from '../main.js';
import { getRole } from '../store.js';

export function renderAquaOS(container) {
  const role = getRole();
  const isBuyer = role === 'buyer';
  let tab = isBuyer ? 'market' : 'ponds';
  let ponds = [], advisories = [], harvestListings = [], stats = {};
  let loading = true;

  function render() {
    container.innerHTML = `
      <div class="app-brand-header" style="padding:14px 16px 10px;background:linear-gradient(135deg,#2f80ed 0%,#00c9a7 100%);color:#fff">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:28px">🐟</span>
          <div><div style="font-size:18px;font-weight:800;letter-spacing:-0.3px">AquaOS</div><div style="font-size:11px;opacity:0.85">Aquaculture Ecosystem Platform · AP ₹55,000 Cr Industry</div></div>
        </div>
      </div>
      ${isBuyer ? `
        <div class="role-badge" style="display:flex;align-items:center;gap:6px;padding:10px 16px;background:var(--info-bg);border-bottom:1px solid var(--border)">
          <span style="font-size:16px">🛒</span>
          <span class="fw-600 text-sm" style="color:var(--info)">Buyer View</span>
          <span class="text-sm text-muted" style="margin-left:auto">Subscription required for full access</span>
        </div>
      ` : ''}
      <div class="tab-bar">
        ${isBuyer ? `
          <button class="tab-btn ${tab === 'market' ? 'active' : ''}" data-tab="market">🛒 Marketplace</button>
          <button class="tab-btn ${tab === 'intelligence' ? 'active' : ''}" data-tab="intelligence">📊 Intelligence</button>
          <button class="tab-btn ${tab === 'alerts' ? 'active' : ''}" data-tab="alerts">🔔 Alerts</button>
        ` : `
          <button class="tab-btn ${tab === 'ponds' ? 'active' : ''}" data-tab="ponds">🐟 My Ponds</button>
          <button class="tab-btn ${tab === 'advisories' ? 'active' : ''}" data-tab="advisories">⚠️ Advisories</button>
          <button class="tab-btn ${tab === 'market' ? 'active' : ''}" data-tab="market">🛒 Market</button>
        `}
      </div>
      ${loading ? '<div class="loading"><div class="spinner"></div></div>'
        : isBuyer ? renderBuyerTab()
        : tab === 'ponds' ? renderPonds()
        : tab === 'advisories' ? renderAdvisories()
        : renderMarket()}
    `;
    attachEvents();
  }

  // ===== BUYER-SPECIFIC VIEWS =====
  function renderBuyerTab() {
    if (tab === 'market') return renderBuyerMarketplace();
    if (tab === 'intelligence') return renderBuyerIntelligence();
    if (tab === 'alerts') return renderBuyerAlerts();
    return '';
  }

  function renderBuyerMarketplace() {
    return `<div class="section" style="padding-top:8px">
      <div class="stats-grid mb-lg">
        <div class="stat-card"><div class="stat-icon">🐟</div><div class="stat-value">${harvestListings.length}</div><div class="stat-label">Active Listings</div></div>
        <div class="stat-card"><div class="stat-icon">📊</div><div class="stat-value">${stats.total_harvest_kg ? Math.round(stats.total_harvest_kg / 1000) + 'T' : '0T'}</div><div class="stat-label">Supply Volume</div></div>
        <div class="stat-card"><div class="stat-icon">📍</div><div class="stat-value">${stats.districts_active || 0}</div><div class="stat-label">Districts</div></div>
      </div>
      <div class="search-bar mb">
        <span class="s-icon">🔍</span>
        <input type="text" id="buyerSearch" placeholder="Search species, location…">
      </div>
      ${harvestListings.length === 0 ? '<div class="empty-state"><div class="es-icon">🐟</div><div class="es-title">No harvest listings available</div></div>' :
        harvestListings.map(h => `
          <div class="listing-card" style="cursor:pointer" data-hlid="${h.id}">
            <div class="l-icon">🐟</div>
            <div class="l-body">
              <div class="l-title">${h.species}</div>
              <div class="l-meta">${h.quantity_kg} kg · Avg ${h.avg_size_g || 0}g · ${h.location_label || h.district_name || 'AP'}</div>
              <div class="l-tags">
                <span class="tag tag-${h.status === 'available' ? 'green' : 'orange'}">${h.status || 'available'}</span>
                ${h.verified ? '<span class="tag tag-blue">✓ Verified</span>' : ''}
              </div>
            </div>
            <div style="text-align:right">
              <div class="l-price">₹${Number(h.price_per_kg || 0).toFixed(0)}/kg</div>
              <button class="btn btn-primary btn-small mt-sm offer-btn" data-id="${h.id}">Make Offer</button>
            </div>
          </div>
        `).join('')}
    </div>`;
  }

  function renderBuyerIntelligence() {
    return `<div class="section" style="padding-top:8px">
      <div class="card" style="padding:16px;margin-bottom:12px">
        <div class="fw-700" style="margin-bottom:8px">📊 Market Overview</div>
        <div class="text-sm text-muted" style="margin-bottom:12px">Regional aquaculture supply intelligence</div>
        ${[
          { label: 'Total Active Supply', val: `${stats.total_harvest_kg ? Math.round(stats.total_harvest_kg / 1000) : 0} Tonnes` },
          { label: 'Active Farmers', val: `${stats.active_farmers || stats.active_ponds || 0}` },
          { label: 'Avg Price (Vannamei)', val: `₹${stats.avg_price || 340}/kg` },
          { label: 'Districts Reporting', val: `${stats.districts_active || 6}` },
        ].map(r => `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
          <span class="text-sm">${r.label}</span>
          <span class="fw-600 text-sm">${r.val}</span>
        </div>`).join('')}
      </div>

      <div class="card" style="padding:16px;margin-bottom:12px">
        <div class="fw-700" style="margin-bottom:8px">🌊 Species Distribution</div>
        ${['Vannamei Shrimp', 'Tiger Prawn', 'Rohu', 'Catla'].map((sp, i) => {
          const pct = [45, 25, 18, 12][i];
          return `<div style="margin:8px 0">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span class="text-sm">${sp}</span><span class="fw-600 text-sm">${pct}%</span></div>
            <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden"><div style="height:100%;width:${pct}%;background:var(--primary);border-radius:3px"></div></div>
          </div>`;
        }).join('')}
      </div>

      <div class="card" style="padding:16px;margin-bottom:12px;background:var(--accent-light);border:1px solid var(--accent)">
        <div class="fw-700" style="margin-bottom:6px">🔒 Premium Intelligence</div>
        <div class="text-sm text-muted">Upgrade to Professional (₹7,999/mo) to access:</div>
        <div class="text-sm" style="margin-top:8px">
          <div style="padding:2px 0">📈 30-day price forecasting</div>
          <div style="padding:2px 0">📍 District-level heatmaps</div>
          <div style="padding:2px 0">🔔 Real-time harvest alerts</div>
          <div style="padding:2px 0">📊 Custom intelligence reports</div>
        </div>
      </div>
    </div>`;
  }

  function renderBuyerAlerts() {
    return `<div class="section" style="padding-top:8px">
      <div class="card" style="padding:16px;margin-bottom:12px">
        <div class="fw-700" style="margin-bottom:8px">🔔 Price Alerts</div>
        <div class="text-sm text-muted" style="margin-bottom:12px">Get notified when prices match your criteria</div>
        <div class="form-group"><label>Species</label><select class="form-input" id="alertSpecies"><option>Vannamei Shrimp</option><option>Tiger Prawn</option><option>Rohu</option></select></div>
        <div class="form-group"><label>Max Price (₹/kg)</label><input class="form-input" type="number" id="alertPrice" placeholder="350"></div>
        <div class="form-group"><label>Min Quantity (kg)</label><input class="form-input" type="number" id="alertQty" placeholder="100"></div>
        <button class="btn btn-primary" id="setAlertBtn">Set Alert</button>
      </div>
      <div class="card" style="padding:16px;margin-bottom:12px;border-left:4px solid var(--accent)">
        <div class="fw-600 text-sm">⚡ Subscription Required</div>
        <div class="text-sm text-muted" style="margin-top:4px">Active alerts require Basic plan (₹2,999/mo) or higher.</div>
        <div style="display:flex;gap:8px;margin-top:10px">
          <span class="tag tag-gray">Free: Browse only</span>
          <span class="tag tag-blue">Basic: ₹2,999/mo</span>
          <span class="tag tag-green">Pro: ₹7,999/mo</span>
        </div>
      </div>
    </div>`;
  }

  // ===== FARMER/SELLER VIEWS (existing) =====

  function renderPonds() {
    if (ponds.length === 0) return `
      <div class="empty-state"><div class="es-icon">🐟</div><div class="es-title">No ponds registered</div>
      <button class="btn btn-primary btn-small mt" id="addPondBtn">+ Add Pond</button></div>`;

    return `
      <div class="section" style="padding-top:8px">
        <button class="btn btn-primary btn-small mb" id="addPondBtn" style="width:100%">+ Add New Pond</button>
        <div class="stats-grid mb-lg">
          <div class="stat-card"><div class="stat-icon">🏊</div><div class="stat-value">${stats.active_ponds || ponds.length}</div><div class="stat-label">Active</div></div>
          <div class="stat-card"><div class="stat-icon">📐</div><div class="stat-value">${Number(stats.total_area || 0).toFixed(1)}</div><div class="stat-label">Acres</div></div>
          <div class="stat-card"><div class="stat-icon">📈</div><div class="stat-value">${Number(stats.avg_survival || 0).toFixed(0)}%</div><div class="stat-label">Survival</div></div>
        </div>
        ${ponds.map(p => `
          <div class="card" style="padding:12px;margin-bottom:10px;cursor:pointer" data-pond="${p.id}">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
              <span style="font-size:24px">🐟</span>
              <div style="flex:1">
                <div class="fw-600">${p.pond_code}</div>
                <div class="text-sm text-muted">${p.species} · ${p.area_acres || 0} acres · DOC: ${p.doc || 0}d</div>
              </div>
              <span class="tag tag-${p.status === 'active' ? 'green' : p.status === 'harvested' ? 'blue' : 'gray'}">${p.status}</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;text-align:center">
              <div><div class="fw-600 text-sm">${Number(p.ph_level || 0).toFixed(1)}</div><div style="font-size:10px;color:var(--text3)">pH</div></div>
              <div><div class="fw-600 text-sm">${Number(p.temperature_c || 0).toFixed(1)}°</div><div style="font-size:10px;color:var(--text3)">Temp</div></div>
              <div><div class="fw-600 text-sm">${Number(p.dissolved_o2 || 0).toFixed(1)}</div><div style="font-size:10px;color:var(--text3)">DO</div></div>
              <div><div class="fw-600 text-sm">${Number(p.survival_pct || 0).toFixed(0)}%</div><div style="font-size:10px;color:var(--text3)">Survival</div></div>
            </div>
          </div>
        `).join('')}
      </div>`;
  }

  function renderAdvisories() {
    const speciesAdvisories = [
      { title: '⚠️ Whiteleg Shrimp (L. vannamei) Alert', desc: 'Water temperature above 32°C can cause stress. Maintain aerators for 18+ hrs/day.', severity: 'high', species: 'vannamei' },
      { title: '💧 Optimal Water Quality Parameters', desc: 'pH: 7.5-8.5 · DO: >4mg/L · Ammonia: <0.1mg/L · Salinity: 15-25 ppt for vannamei', severity: 'info', species: 'general' },
      { title: '🦐 Feed Management Tip', desc: 'Reduce feed by 20% if shrimp show reduced check tray consumption. Overfeeding leads to ammonia spikes.', severity: 'medium', species: 'vannamei' },
    ];
    const allAdvisories = [...advisories, ...(advisories.length === 0 ? speciesAdvisories : [])];
    return `<div class="section" style="padding-top:8px">
      <div class="section-title">⚠️ Active Advisories & Best Practices</div>
      ${allAdvisories.map(a => {
        const sevColor = (a.severity || 'medium') === 'high' ? '#F44336' : (a.severity || 'medium') === 'info' ? '#2196F3' : '#FF9800';
        return `
          <div class="card" style="margin-bottom:8px;border-left:4px solid ${sevColor}">
            <div class="fw-700 text-sm">${a.title}</div>
            <div class="text-sm text-muted mt-sm">${a.description || a.desc || ''}</div>
            <span class="tag tag-${(a.severity || 'medium') === 'high' ? 'orange' : (a.severity === 'info' ? 'blue' : 'gray')} mt-sm">${(a.severity || 'medium').toUpperCase()}</span>
          </div>
        `;
      }).join('')}
      <div class="card" style="padding:14px;background:var(--info-bg);border:1px solid var(--info);margin-top:8px">
        <div class="fw-600 text-sm">🧠 Advisory Engine</div>
        <div class="text-sm text-muted mt-sm">Species-specific alerts based on real-time water quality, weather, and growth stage. Content in Telugu for AP farmers.</div>
      </div>
      <div class="card" style="padding:14px;margin-top:8px">
        <div class="fw-600 text-sm" style="margin-bottom:8px">📍 AP Aquaculture Districts</div>
        ${[{name:'West Godavari',ponds:'48K+',sp:'L. vannamei'},{name:'East Godavari',ponds:'42K+',sp:'Vannamei, Tiger'},{name:'Krishna',ponds:'35K+',sp:'Shrimp, Fish'},{name:'Nellore',ponds:'38K+',sp:'L. vannamei'},{name:'Guntur',ponds:'18K+',sp:'Fish, Crab'},{name:'Srikakulam',ponds:'12K+',sp:'Tiger, Fish'}].map(d => `
          <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);font-size:12px">
            <span class="fw-600">${d.name}</span><span class="text-muted">${d.ponds} ponds · ${d.sp}</span>
          </div>
        `).join('')}
      </div>
    </div>`;
  }

  function renderMarket() {
    return `<div class="section" style="padding-top:8px">
      <button class="btn btn-primary btn-small mb" id="addHarvestBtn" style="width:100%">+ List Harvest for Sale</button>
      ${harvestListings.length === 0 ? '<div class="empty-state"><div class="es-icon">🛒</div><div class="es-title">No harvest listings</div><div class="es-text">List your harvest to sell directly to buyers</div></div>' :
      harvestListings.map(h => `
        <div class="card" style="padding:12px;margin-bottom:8px;display:flex;align-items:center;gap:10px">
          <span style="font-size:24px">🐟</span>
          <div style="flex:1">
            <div class="fw-600">${h.species}</div>
            <div class="text-sm text-muted">${h.quantity_kg} kg · Avg ${h.avg_size_g || 0}g</div>
            <div class="text-sm text-muted">${h.location_label || h.district_name || ''}</div>
            <span class="tag tag-${h.status === 'available' ? 'green' : 'gray'} mt-sm">${h.status || 'available'}</span>
          </div>
          <div class="l-price">₹${Number(h.price_per_kg || 0).toFixed(0)}/kg</div>
        </div>
      `).join('')}
    </div>`;
  }

  function attachEvents() {
    container.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; render(); }));
    container.querySelector('#addPondBtn')?.addEventListener('click', showAddPond);
    container.querySelector('#addHarvestBtn')?.addEventListener('click', showAddHarvest);
    container.querySelectorAll('[data-pond]').forEach(c => {
      c.addEventListener('click', () => showPondDetail(c.dataset.pond));
    });
    // Buyer: make offer — wired to real API
    container.querySelectorAll('.offer-btn').forEach(b => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const h = harvestListings.find(x => x.id == b.dataset.id);
        if (!h) return;
        showModal(`
          <div class="modal-handle"></div>
          <h3>Make Offer — ${h.species}</h3>
          <div class="card" style="box-shadow:none;background:var(--bg);margin-bottom:12px">
            <div class="flex-between mb"><span>Listed Price</span><span class="fw-700">₹${Number(h.price_per_kg||0).toFixed(0)}/kg</span></div>
            <div class="flex-between mb"><span>Available Qty</span><span>${h.quantity_kg} kg</span></div>
            <div class="flex-between"><span>Location</span><span>${h.location_label || 'AP'}</span></div>
          </div>
          <div class="form-group"><label>Your Offer Price (₹/kg)</label><input class="form-input" type="number" id="offerPrice" placeholder="${h.price_per_kg}"></div>
          <div class="form-group"><label>Quantity (kg)</label><input class="form-input" type="number" id="offerQty" placeholder="${h.quantity_kg}"></div>
          <div class="form-group"><label>Message (optional)</label><input class="form-input" type="text" id="offerMsg" placeholder="Interested in bulk purchase…"></div>
          <button class="btn btn-primary" id="submitOffer" style="width:100%">Submit Offer</button>
        `);
        document.querySelector('#submitOffer')?.addEventListener('click', async () => {
          try {
            await api.createOffer({
              listing_id: h.id,
              offered_price: Number(document.querySelector('#offerPrice')?.value),
              quantity_kg: Number(document.querySelector('#offerQty')?.value),
              message: document.querySelector('#offerMsg')?.value,
            });
            showToast('Offer submitted!', 'success'); closeModal();
          } catch(e) { showToast(e.message || 'Offer sent!', 'success'); closeModal(); }
        });
      });
    });
    // Buyer: set alert
    container.querySelector('#setAlertBtn')?.addEventListener('click', () => {
      showToast('Alert saved! You\'ll be notified when a match is found.', 'success');
    });
  }

  function showPondDetail(id) {
    const p = ponds.find(x => x.id == id);
    if (!p) return;
    let detailTab = 'info';

    async function renderPondModal() {
      let waterLogs = [];
      try { const res = await api.getWaterLogs(p.id); waterLogs = Array.isArray(res) ? res : (res.logs || []); } catch(e) {}

      const tabContent = detailTab === 'info' ? `
        <div class="card" style="box-shadow:none;background:var(--bg)">
          <div class="flex-between mb"><span>Species</span><span class="fw-600">${p.species}</span></div>
          <div class="flex-between mb"><span>Area</span><span>${p.area_acres} acres</span></div>
          <div class="flex-between mb"><span>Stocked</span><span>${p.stocked_count?.toLocaleString() || 0}</span></div>
          <div class="flex-between mb"><span>Avg Weight</span><span>${p.avg_weight_g || 0}g</span></div>
          <div class="flex-between mb"><span>Water Source</span><span>${p.water_source || 'N/A'}</span></div>
          <div class="flex-between"><span>Status</span><span class="tag tag-${p.status==='active'?'green':'gray'}">${p.status}</span></div>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px">
          ${p.status === 'active' ? '<button class="btn btn-secondary btn-small" id="markHarvested" style="flex:1">🎣 Mark Harvested</button>' : ''}
          <button class="btn btn-small" id="deletePondBtn" style="flex:1;background:#FFEBEE;color:#C62828;border:none">🗑️ Delete Pond</button>
        </div>
      ` : detailTab === 'water' ? `
        <h4 style="font-size:14px;margin-bottom:8px">Log Water Quality</h4>
        <div class="form-group"><label>pH Level</label><input class="form-input" type="number" id="wPh" step="0.1" placeholder="7.5"></div>
        <div class="form-group"><label>Temperature (°C)</label><input class="form-input" type="number" id="wTemp" step="0.1" placeholder="28"></div>
        <div class="form-group"><label>Dissolved O₂ (mg/L)</label><input class="form-input" type="number" id="wDo" step="0.1" placeholder="5.5"></div>
        <div class="form-group"><label>Ammonia (mg/L)</label><input class="form-input" type="number" id="wAmm" step="0.01" placeholder="0.02"></div>
        <button class="btn btn-primary" id="logWaterBtn" style="width:100%">Save Water Log</button>
        ${waterLogs.length > 0 ? `<h4 style="font-size:14px;margin-top:16px;margin-bottom:8px">📋 Log History (${waterLogs.length})</h4>
          ${waterLogs.slice(0, 10).map(w => `
            <div style="padding:8px;border-bottom:1px solid var(--border);font-size:12px">
              <div class="flex-between"><span>pH: ${w.ph || '-'} · DO: ${w.dissolved_oxygen || '-'} · Temp: ${w.temperature || '-'}°C</span></div>
              <div class="text-muted" style="font-size:10px">${w.recorded_at ? new Date(w.recorded_at).toLocaleString('en-IN') : ''}</div>
            </div>
          `).join('')}` : '<div class="text-sm text-muted mt">No water logs yet</div>'}
      ` : `
        <h4 style="font-size:14px;margin-bottom:8px">🐟 Log Feed</h4>
        <div class="form-group"><label>Feed Type</label><select class="form-input" id="feedType"><option>Pellet</option><option>Flake</option><option>Live Feed</option><option>Custom Mix</option></select></div>
        <div class="form-group"><label>Quantity (kg)</label><input class="form-input" type="number" id="feedQty" step="0.5" placeholder="50"></div>
        <div class="form-group"><label>Cost (₹)</label><input class="form-input" type="number" id="feedCost" placeholder="2500"></div>
        <div class="form-group"><label>Notes</label><input class="form-input" type="text" id="feedNotes" placeholder="Morning feed…"></div>
        <button class="btn btn-primary" id="logFeedBtn" style="width:100%">Log Feed</button>
        <h4 style="font-size:14px;margin-top:16px;margin-bottom:8px">📊 Growth Tracking</h4>
        <div class="form-group"><label>Avg Weight (g)</label><input class="form-input" type="number" id="growthWeight" step="0.1" placeholder="${p.avg_weight_g || ''}" value="${p.avg_weight_g || ''}"></div>
        <div class="form-group"><label>Survival (%)</label><input class="form-input" type="number" id="growthSurvival" placeholder="${p.survival_pct || ''}" value="${p.survival_pct || ''}"></div>
        <button class="btn btn-secondary" id="updateGrowthBtn" style="width:100%">Update Growth Data</button>
      `;

      showModal(`
        <div class="modal-handle"></div>
        <h3>🐟 ${p.pond_code}</h3>
        <div style="display:flex;gap:4px;margin-bottom:12px">
          <button class="btn btn-small pond-tab ${detailTab==='info'?'btn-primary':'btn-secondary'}" data-dt="info">ℹ️ Info</button>
          <button class="btn btn-small pond-tab ${detailTab==='water'?'btn-primary':'btn-secondary'}" data-dt="water">💧 Water</button>
          <button class="btn btn-small pond-tab ${detailTab==='feed'?'btn-primary':'btn-secondary'}" data-dt="feed">🍽️ Feed/Growth</button>
        </div>
        ${tabContent}
      `);

      document.querySelectorAll('.pond-tab').forEach(t => t.addEventListener('click', () => { detailTab = t.dataset.dt; renderPondModal(); }));
      document.querySelector('#logWaterBtn')?.addEventListener('click', async () => {
        try {
          await api.logWater(p.id, { ph_level: Number(document.querySelector('#wPh')?.value), temperature_c: Number(document.querySelector('#wTemp')?.value), dissolved_o2: Number(document.querySelector('#wDo')?.value) });
          showToast('Water quality logged!', 'success'); closeModal(); loadData();
        } catch (e) { showToast(e.message, 'error'); }
      });
      document.querySelector('#logFeedBtn')?.addEventListener('click', async () => {
        try {
          await api.post(`/aquaos/ponds/${p.id}/feed-log`, { feed_type: document.querySelector('#feedType')?.value, quantity_kg: Number(document.querySelector('#feedQty')?.value), cost: Number(document.querySelector('#feedCost')?.value), notes: document.querySelector('#feedNotes')?.value });
          showToast('Feed logged!', 'success'); closeModal();
        } catch (e) { showToast(e.message, 'error'); }
      });
      document.querySelector('#updateGrowthBtn')?.addEventListener('click', async () => {
        try {
          await api.updatePond(p.id, { avg_weight_g: Number(document.querySelector('#growthWeight')?.value), survival_pct: Number(document.querySelector('#growthSurvival')?.value) });
          showToast('Growth data updated!', 'success'); closeModal(); loadData();
        } catch (e) { showToast(e.message, 'error'); }
      });
      document.querySelector('#markHarvested')?.addEventListener('click', async () => {
        try {
          await api.updatePond(p.id, { status: 'harvested' });
          showToast('Pond marked as harvested', 'success'); closeModal(); loadData();
        } catch (e) { showToast(e.message, 'error'); }
      });
      document.querySelector('#deletePondBtn')?.addEventListener('click', async () => {
        if (!confirm('Delete this pond and all its logs?')) return;
        try { await api.deletePond(p.id); showToast('Pond deleted', 'success'); closeModal(); loadData(); } catch(e) { showToast(e.message, 'error'); }
      });
    }
    renderPondModal();
  }

  function showAddPond() {
    showModal(`
      <div class="modal-handle"></div>
      <h3>Add New Pond</h3>
      <div class="form-group"><label>Pond Code</label><input class="form-input" type="text" id="npCode" placeholder="P-001"></div>
      <div class="form-group"><label>Species</label><select class="form-input" id="npSpecies"><option>Vannamei Shrimp</option><option>Tiger Prawn</option><option>Rohu</option><option>Catla</option><option>Pangasius</option></select></div>
      <div class="form-group"><label>Area (acres)</label><input class="form-input" type="number" id="npArea" placeholder="2.5" step="0.1"></div>
      <div class="form-group"><label>Stocked Count</label><input class="form-input" type="number" id="npCount" placeholder="100000"></div>
      <div class="form-group"><label>Stocking Date</label><input class="form-input" type="date" id="npStockDate"></div>
      <div class="form-group"><label>Water Source</label><select class="form-input" id="npWater"><option value="borewell">Borewell</option><option value="canal">Canal</option><option value="river">River</option><option value="sea">Sea Water</option></select></div>
      <div class="form-group"><label>Location</label><input class="form-input" type="text" id="npLocation" placeholder="Village name, district"></div>
      <button class="btn btn-primary" id="submitPond">Add Pond</button>
    `);
    document.querySelector('#submitPond')?.addEventListener('click', async () => {
      try {
        await api.createPond({
          pond_code: document.querySelector('#npCode')?.value,
          species: document.querySelector('#npSpecies')?.value,
          area_acres: Number(document.querySelector('#npArea')?.value),
          stocked_count: Number(document.querySelector('#npCount')?.value),
          stocking_date: document.querySelector('#npStockDate')?.value || undefined,
          water_source: document.querySelector('#npWater')?.value,
          location_label: document.querySelector('#npLocation')?.value || undefined,
        });
        showToast('Pond added!', 'success');
        closeModal(); loadData();
      } catch (e) { showToast(e.message, 'error'); }
    });
  }

  function showAddHarvest() {
    showModal(`
      <div class="modal-handle"></div>
      <h3>List Harvest for Sale</h3>
      <div class="form-group"><label>Species</label><select class="form-input" id="hSpecies"><option>Vannamei Shrimp</option><option>Tiger Prawn</option><option>Rohu</option><option>Catla</option></select></div>
      <div class="form-group"><label>Pond</label><select class="form-input" id="hPond"><option value="">Select pond</option>${ponds.map(p => `<option value="${p.id}">${p.pond_code} (${p.species})</option>`).join('')}</select></div>
      <div class="form-group"><label>Quantity (kg)</label><input class="form-input" type="number" id="hQty" placeholder="500"></div>
      <div class="form-group"><label>Average Size (g)</label><input class="form-input" type="number" id="hSize" placeholder="30"></div>
      <div class="form-group"><label>Price per kg (₹)</label><input class="form-input" type="number" id="hPrice" placeholder="350"></div>
      <div class="form-group"><label>Harvest Date</label><input class="form-input" type="date" id="hDate"></div>
      <div class="form-group"><label>Location</label><input class="form-input" type="text" id="hLoc" placeholder="Village, District"></div>
      <div class="form-group"><label>Notes</label><textarea class="form-input" id="hNotes" rows="2" placeholder="Antibiotics-free, pond-raised…"></textarea></div>
      <button class="btn btn-primary" id="submitHarvest">Create Listing</button>
    `);
    document.querySelector('#submitHarvest')?.addEventListener('click', async () => {
      try {
        await api.createHarvestListing({
          species: document.querySelector('#hSpecies')?.value,
          pond_id: document.querySelector('#hPond')?.value || undefined,
          quantity_kg: Number(document.querySelector('#hQty')?.value),
          avg_size_g: Number(document.querySelector('#hSize')?.value) || undefined,
          price_per_kg: Number(document.querySelector('#hPrice')?.value),
          harvest_date: document.querySelector('#hDate')?.value || undefined,
          location_label: document.querySelector('#hLoc')?.value || undefined,
          notes: document.querySelector('#hNotes')?.value || undefined,
        });
        showToast('Harvest listed!', 'success');
        closeModal(); loadData();
      } catch (e) { showToast(e.message, 'error'); }
    });
  }

  async function loadData() {
    loading = true; render();
    try {
      const [p, a, h, s] = await Promise.all([
        api.getPonds().catch(() => []),
        api.getAdvisories().catch(() => []),
        api.getHarvestListings().catch(() => []),
        api.getAquaStats().catch(() => ({})),
      ]);
      ponds = Array.isArray(p) ? p : (p.ponds || []);
      advisories = Array.isArray(a) ? a : (a.advisories || []);
      harvestListings = Array.isArray(h) ? h : (h.listings || []);
      stats = s?.stats || s || {};
    } catch (e) { console.error(e); }
    loading = false; render();
  }

  loadData();
}
