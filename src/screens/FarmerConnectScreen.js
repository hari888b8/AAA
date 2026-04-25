import { api } from '../api.js';
import { showToast, showModal, closeModal } from '../main.js';
import { getRole } from '../store.js';

export function renderFarmerConnect(container) {
  const role = getRole();
  let mode = role === 'buyer' ? 'seeker' : 'owner';
  let properties = [], stats = {};
  let loading = true;
  let search = '', filterType = '';

  function render() {
    container.innerHTML = `
      <div class="mode-toggle" style="display:flex;margin:8px 16px;background:var(--surface);border-radius:12px;padding:3px;border:1px solid var(--border)">
        <button class="mode-btn ${mode === 'seeker' ? 'active' : ''}" data-mode="seeker" style="flex:1;padding:8px;border-radius:10px;font-size:13px;font-weight:600;border:none;cursor:pointer;transition:all .2s;${mode === 'seeker' ? 'background:var(--primary);color:white;box-shadow:0 2px 6px rgba(0,0,0,0.15)' : 'background:transparent;color:var(--text2)'}">🔍 Seeker</button>
        <button class="mode-btn ${mode === 'owner' ? 'active' : ''}" data-mode="owner" style="flex:1;padding:8px;border-radius:10px;font-size:13px;font-weight:600;border:none;cursor:pointer;transition:all .2s;${mode === 'owner' ? 'background:var(--primary);color:white;box-shadow:0 2px 6px rgba(0,0,0,0.15)' : 'background:transparent;color:var(--text2)'}">🏠 Owner</button>
      </div>
      ${mode === 'owner' ? renderOwnerView() : renderSeekerView()}
    `;
    attachEvents();
  }

  function renderOwnerView() {
    const myProps = properties.filter(p => p.is_own || true); // show all in demo
    return `
      <div class="section" style="padding-top:8px">
        <div class="stats-grid mb-lg">
          <div class="stat-card"><div class="stat-icon">🏠</div><div class="stat-value">${myProps.length}</div><div class="stat-label">My Listings</div></div>
          <div class="stat-card"><div class="stat-icon">👁️</div><div class="stat-value">${stats.total_views || 0}</div><div class="stat-label">Views</div></div>
          <div class="stat-card"><div class="stat-icon">📞</div><div class="stat-value">${stats.total_inquiries || 0}</div><div class="stat-label">Inquiries</div></div>
        </div>
        <button class="btn btn-primary btn-small mb" id="addPropertyBtn">+ List Property</button>
        ${myProps.length === 0 ? '<div class="empty-state"><div class="es-icon">🏠</div><div class="es-title">No properties listed</div><div class="es-text">List your first property for free!</div></div>' :
          myProps.map(p => `
            <div class="listing-card" data-pid="${p.id}">
              <div class="l-icon">${typeIcon(p.property_type)}</div>
              <div class="l-body">
                <div class="l-title">${p.title}</div>
                <div class="l-meta">${p.property_type?.replace('_', ' ') || ''} · ${p.location_label || p.district_name || ''}</div>
                <div class="l-tags">
                  ${p.is_verified ? '<span class="tag tag-green">✅ Verified</span>' : '<span class="tag tag-orange">⏳ Pending</span>'}
                  <span class="tag tag-${p.is_available ? 'blue' : 'gray'}">${p.is_available ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
              <div class="l-price">₹${Number(p.rent_amount || 0).toLocaleString()}</div>
            </div>
          `).join('')}
        <div class="card" style="padding:16px;margin-top:12px;background:var(--accent-light);border:1px solid var(--accent)">
          <div class="fw-600 text-sm">📈 Owner Plans</div>
          <div class="text-sm text-muted" style="margin-top:4px">Free: 1 listing · Premium ₹799/90d: 5 listings · Pro ₹1,999/180d: 15 listings · Elite ₹4,999/yr: Unlimited</div>
        </div>
      </div>`;
  }

  function renderSeekerView() {
    return `
      <div class="search-bar">
        <span class="s-icon">🔍</span>
        <input type="text" id="searchProp" placeholder="Search properties…" value="${search}">
      </div>
      <div class="filter-chips">
        <button class="chip ${!filterType ? 'active' : ''}" data-type="">All</button>
        <button class="chip ${filterType === 'apartment' ? 'active' : ''}" data-type="apartment">🏢 Apartment</button>
        <button class="chip ${filterType === 'farm_land' ? 'active' : ''}" data-type="farm_land">🌾 Farm Land</button>
        <button class="chip ${filterType === 'pg' ? 'active' : ''}" data-type="pg">🏠 PG</button>
        <button class="chip ${filterType === 'villa' ? 'active' : ''}" data-type="villa">🏡 Villa</button>
      </div>
      ${loading ? '<div class="loading"><div class="spinner"></div></div>' : renderSeekerContent()}
    `;
  }

  function renderSeekerContent() {
    const filtered = properties.filter(p => {
      if (search && !`${p.title} ${p.location_label}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterType && p.property_type !== filterType) return false;
      return true;
    });

    return `
      <div class="section" style="padding-top:0">
        <div class="stats-grid-4 mb-lg">
          <div class="stat-card"><div class="stat-value">${stats.total_listings || 0}</div><div class="stat-label">Total</div></div>
          <div class="stat-card"><div class="stat-value">${stats.verified_listings || stats.verified || 0}</div><div class="stat-label">Verified</div></div>
          <div class="stat-card"><div class="stat-value">${stats.apartments || 0}</div><div class="stat-label">Apts</div></div>
          <div class="stat-card"><div class="stat-value">₹${Number(stats.avg_rent || 0).toLocaleString()}</div><div class="stat-label">Avg Rent</div></div>
        </div>
        ${filtered.length === 0 ? '<div class="empty-state"><div class="es-icon">🏠</div><div class="es-title">No properties found</div></div>'
          : filtered.map(p => `
            <div class="listing-card" data-pid="${p.id}">
              <div class="l-icon">${typeIcon(p.property_type)}</div>
              <div class="l-body">
                <div class="l-title">${p.title}</div>
                <div class="l-meta">${p.property_type?.replace('_', ' ') || ''} · ${p.location_label || p.district_name || ''}</div>
                <div class="l-meta">${p.area || 'N/A'} · ${p.furnishing || 'N/A'} · ${p.floor_info || ''}</div>
                <div class="l-tags">
                  ${p.is_verified ? '<span class="tag tag-green">✅ Verified</span>' : ''}
                  ${p.is_available ? '<span class="tag tag-blue">Available</span>' : '<span class="tag tag-gray">Unavailable</span>'}
                </div>
              </div>
              <div class="l-price">₹${Number(p.rent_amount || 0).toLocaleString()}<div class="text-sm text-muted">/${p.rent_period || 'month'}</div></div>
            </div>
          `).join('')}
      </div>`;
  }

  function attachEvents() {
    container.querySelectorAll('.mode-btn').forEach(b => b.addEventListener('click', () => { mode = b.dataset.mode; render(); }));
    container.querySelector('#searchProp')?.addEventListener('input', e => { search = e.target.value; render(); });
    container.querySelectorAll('.chip[data-type]').forEach(c => {
      c.addEventListener('click', () => { filterType = c.dataset.type; render(); });
    });
    container.querySelectorAll('.listing-card[data-pid]').forEach(c => {
      c.addEventListener('click', () => showPropertyDetail(c.dataset.pid));
    });
    container.querySelector('#addPropertyBtn')?.addEventListener('click', showAddProperty);
  }

  function showAddProperty() {
    showModal(`
      <div class="modal-handle"></div>
      <h3>List Property</h3>
      <div class="form-group"><label>Title</label><input class="form-input" type="text" id="propTitle" placeholder="2BHK near Highway"></div>
      <div class="form-group"><label>Type</label><select class="form-input" id="propType"><option value="apartment">🏢 Apartment</option><option value="farm_land">🌾 Farm Land</option><option value="pg">🏠 PG</option><option value="villa">🏡 Villa</option><option value="warehouse">🏭 Warehouse</option></select></div>
      <div class="form-group"><label>Rent Amount (₹)</label><input class="form-input" type="number" id="propRent" placeholder="12000"></div>
      <div class="form-group"><label>Rent Period</label><select class="form-input" id="propPeriod"><option value="month">Per Month</option><option value="year">Per Year</option><option value="acre_year">Per Acre/Year</option></select></div>
      <div class="form-group"><label>Area</label><input class="form-input" type="text" id="propArea" placeholder="1200 sq ft / 5 acres"></div>
      <div class="form-group"><label>Furnishing</label><select class="form-input" id="propFurn"><option value="">Select</option><option>Fully Furnished</option><option>Semi Furnished</option><option>Unfurnished</option></select></div>
      <div class="form-group"><label>Floor Info</label><input class="form-input" type="text" id="propFloor" placeholder="3rd of 8 floors"></div>
      <div class="form-group"><label>Location</label><input class="form-input" type="text" id="propLoc" placeholder="Miyapur, Hyderabad"></div>
      <div class="form-group"><label>Amenities</label><input class="form-input" type="text" id="propAmen" placeholder="Parking, Gym, Power Backup…"></div>
      <div class="form-group"><label>Description</label><textarea class="form-input" id="propDesc" rows="3" placeholder="Property details, nearby landmarks, transport…"></textarea></div>
      <button class="btn btn-primary" id="submitProp">List Property</button>
      <div class="text-sm text-muted mt" style="text-align:center">🔒 Phone number masked for privacy · Free: 1 listing</div>
    `);
    document.querySelector('#submitProp')?.addEventListener('click', async () => {
      try {
        await api.createProperty({
          title: document.querySelector('#propTitle')?.value,
          property_type: document.querySelector('#propType')?.value,
          rent_amount: Number(document.querySelector('#propRent')?.value),
          rent_period: document.querySelector('#propPeriod')?.value,
          area: document.querySelector('#propArea')?.value,
          furnishing: document.querySelector('#propFurn')?.value || undefined,
          floor_info: document.querySelector('#propFloor')?.value || undefined,
          location_label: document.querySelector('#propLoc')?.value,
          amenities: document.querySelector('#propAmen')?.value || undefined,
          description: document.querySelector('#propDesc')?.value,
        });
        showToast('Property listed!', 'success'); closeModal(); loadData();
      } catch (e) { showToast(e.message, 'error'); }
    });
  }

  function showPropertyDetail(id) {
    const p = properties.find(x => x.id == id);
    if (!p) return;
    showModal(`
      <div class="modal-handle"></div>
      <h3>${typeIcon(p.property_type)} ${p.title}</h3>
      <div class="card" style="box-shadow:none;background:var(--bg)">
        <div class="flex-between mb"><span>Type</span><span class="fw-600">${p.property_type?.replace('_', ' ')}</span></div>
        <div class="flex-between mb"><span>Rent</span><span class="fw-700" style="color:var(--primary)">₹${Number(p.rent_amount).toLocaleString()}/${p.rent_period || 'month'}</span></div>
        <div class="flex-between mb"><span>Area</span><span>${p.area || 'N/A'}</span></div>
        <div class="flex-between mb"><span>Furnishing</span><span>${p.furnishing || 'N/A'}</span></div>
        <div class="flex-between mb"><span>Floor</span><span>${p.floor_info || 'N/A'}</span></div>
        <div class="flex-between mb"><span>Location</span><span>${p.location_label || p.district_name || ''}</span></div>
        <div class="flex-between"><span>Status</span><span>${p.is_verified ? '✅ Verified' : '⏳ Pending'}</span></div>
      </div>
      ${p.description ? `<p class="text-sm mt">${p.description}</p>` : ''}
      ${p.amenities ? `<div class="mt"><strong class="text-sm">Amenities:</strong><div class="text-sm text-muted">${p.amenities}</div></div>` : ''}
      <button class="btn btn-primary mt-lg" onclick="this.textContent='📞 Contact: Will be shared'; this.disabled=true">📞 Contact Owner</button>
      <div class="text-sm text-muted mt" style="text-align:center">Free: 3 contacts/month · Connect ₹499/30d: Unlimited</div>
    `);
  }

  function typeIcon(t) {
    return { apartment: '🏢', farm_land: '🌾', pg: '🏠', villa: '🏡', warehouse: '🏭' }[t] || '🏠';
  }

  async function loadData() {
    loading = true; render();
    try {
      const [propRes, st] = await Promise.all([
        api.getProperties('?limit=30'),
        api.getFCStats().catch(() => ({})),
      ]);
      properties = Array.isArray(propRes) ? propRes : (propRes.properties || []);
      stats = st?.stats || st || {};
    } catch (e) { console.error(e); }
    loading = false; render();
  }

  loadData();
}
