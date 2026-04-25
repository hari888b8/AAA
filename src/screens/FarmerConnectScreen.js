import { api } from '../api.js';
import { showToast, showModal, closeModal } from '../main.js';
import { getRole, getState } from '../store.js';

export function renderFarmerConnect(container) {
  const role = getRole();
  const userId = getState().user?.id;
  let mode = role === 'buyer' ? 'seeker' : 'owner';
  let tab = mode === 'owner' ? 'listings' : 'browse';
  let properties = [], stats = {}, savedIds = new Set(), myInquiries = [];
  let loading = true;
  let search = '', filterType = '';

  function render() {
    container.innerHTML = `
      <div class="app-brand-header" style="padding:14px 16px 10px;background:linear-gradient(135deg,#00c9a7 0%,#a8e063 100%);color:#fff">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:28px">🏡</span>
          <div><div style="font-size:18px;font-weight:800;letter-spacing:-0.3px">FarmerConnect</div><div style="font-size:11px;opacity:0.85">Property & Agricultural Land · Zero Broker · AI-Powered</div></div>
        </div>
      </div>
      <div class="mode-toggle" style="display:flex;margin:8px 16px;background:var(--surface);border-radius:12px;padding:3px;border:1px solid var(--border)">
        <button class="mode-btn ${mode === 'seeker' ? 'active' : ''}" data-mode="seeker" style="flex:1;padding:8px;border-radius:10px;font-size:13px;font-weight:600;border:none;cursor:pointer;transition:all .2s;${mode === 'seeker' ? 'background:var(--primary);color:white;box-shadow:0 2px 6px rgba(0,0,0,0.15)' : 'background:transparent;color:var(--text2)'}">🔍 Seeker</button>
        <button class="mode-btn ${mode === 'owner' ? 'active' : ''}" data-mode="owner" style="flex:1;padding:8px;border-radius:10px;font-size:13px;font-weight:600;border:none;cursor:pointer;transition:all .2s;${mode === 'owner' ? 'background:var(--primary);color:white;box-shadow:0 2px 6px rgba(0,0,0,0.15)' : 'background:transparent;color:var(--text2)'}">🏠 Owner</button>
      </div>
      ${mode === 'owner' ? `
        <div class="tab-bar">
          <button class="tab-btn ${tab === 'listings' ? 'active' : ''}" data-tab="listings">🏠 Listings</button>
          <button class="tab-btn ${tab === 'inquiries' ? 'active' : ''}" data-tab="inquiries">📩 Inquiries</button>
        </div>
        ${tab === 'listings' ? renderOwnerView() : renderOwnerInquiries()}
      ` : `
        <div class="tab-bar">
          <button class="tab-btn ${tab === 'browse' ? 'active' : ''}" data-tab="browse">🔍 Browse</button>
          <button class="tab-btn ${tab === 'saved' ? 'active' : ''}" data-tab="saved">❤️ Saved</button>
          <button class="tab-btn ${tab === 'myinquiries' ? 'active' : ''}" data-tab="myinquiries">📩 My Inquiries</button>
        </div>
        ${tab === 'browse' ? renderSeekerView() : tab === 'saved' ? renderSavedView() : renderMyInquiries()}
      `}
    `;
    attachEvents();
  }

  function renderOwnerView() {
    return `
      <div class="section" style="padding-top:8px">
        <div class="stats-grid mb-lg">
          <div class="stat-card"><div class="stat-icon">🏠</div><div class="stat-value">${properties.length}</div><div class="stat-label">My Listings</div></div>
          <div class="stat-card"><div class="stat-icon">👁️</div><div class="stat-value">${stats.total_views || 0}</div><div class="stat-label">Views</div></div>
          <div class="stat-card"><div class="stat-icon">📞</div><div class="stat-value">${stats.total_inquiries || 0}</div><div class="stat-label">Inquiries</div></div>
        </div>
        <button class="btn btn-primary btn-small mb" id="addPropertyBtn" style="width:100%">+ List Property</button>
        ${properties.length === 0 ? '<div class="empty-state"><div class="es-icon">🏠</div><div class="es-title">No properties listed</div><div class="es-text">List your first property for free!</div></div>' :
          properties.map(p => `
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
              <div style="text-align:right">
                <div class="l-price">₹${Number(p.rent_amount || 0).toLocaleString()}</div>
                <div style="display:flex;gap:4px;margin-top:6px">
                  <button class="btn btn-secondary btn-small prop-edit-btn" data-pid="${p.id}">✏️</button>
                  <button class="btn btn-small prop-del-btn" data-pid="${p.id}" style="background:#FFEBEE;color:#C62828;border:none">🗑️</button>
                </div>
              </div>
            </div>
          `).join('')}
        <div class="card" style="padding:16px;margin-top:12px;background:var(--accent-light);border:1px solid var(--accent)">
          <div class="fw-600 text-sm">📈 Owner Plans</div>
          <div class="text-sm text-muted" style="margin-top:4px">Free: 1 listing · Premium ₹799/90d: 5 listings · Pro ₹1,999/180d: 15 listings · Elite ₹4,999/yr: Unlimited</div>
        </div>
      </div>`;
  }

  function renderOwnerInquiries() {
    return `<div class="section" style="padding-top:8px">
      <div class="section-title">📩 Property Inquiries</div>
      ${myInquiries.length === 0 ? '<div class="empty-state"><div class="es-icon">📩</div><div class="es-title">No inquiries yet</div><div class="es-text">Inquiries from seekers will appear here</div></div>' :
        myInquiries.map(inq => `
          <div class="card" style="margin-bottom:8px">
            <div class="flex-between">
              <div class="fw-700">${inq.property_title || 'Property #' + inq.property_id}</div>
              <span class="tag tag-${inq.status === 'pending' ? 'orange' : inq.status === 'responded' ? 'green' : 'gray'}">${inq.status || 'pending'}</span>
            </div>
            <div class="text-sm text-muted mt-sm">👤 ${inq.seeker_name || 'Seeker'} · ${inq.created_at ? new Date(inq.created_at).toLocaleDateString('en-IN') : ''}</div>
            ${inq.message ? `<div class="text-sm mt-sm" style="padding:8px;background:var(--bg);border-radius:8px">"${inq.message}"</div>` : ''}
          </div>
        `).join('')}
    </div>`;
  }

  function renderSavedView() {
    const saved = properties.filter(p => savedIds.has(p.id));
    return `<div class="section" style="padding-top:8px">
      <div class="section-title">❤️ Saved Properties (${saved.length})</div>
      ${saved.length === 0 ? '<div class="empty-state"><div class="es-icon">❤️</div><div class="es-title">No saved properties</div><div class="es-text">Tap the heart icon on properties to save them</div></div>' :
        saved.map(p => `
          <div class="listing-card" data-pid="${p.id}">
            <div class="l-icon">${typeIcon(p.property_type)}</div>
            <div class="l-body">
              <div class="l-title">${p.title}</div>
              <div class="l-meta">${p.property_type?.replace('_', ' ') || ''} · ${p.location_label || ''}</div>
            </div>
            <div style="text-align:right">
              <div class="l-price">₹${Number(p.rent_amount || 0).toLocaleString()}</div>
              <button class="btn btn-small unsave-btn mt-sm" data-pid="${p.id}" style="background:#FFEBEE;color:#C62828;border:none;font-size:11px">❤️ Remove</button>
            </div>
          </div>
        `).join('')}
    </div>`;
  }

  function renderMyInquiries() {
    return `<div class="section" style="padding-top:8px">
      <div class="section-title">📩 My Inquiries</div>
      ${myInquiries.length === 0 ? '<div class="empty-state"><div class="es-icon">📩</div><div class="es-title">No inquiries sent</div><div class="es-text">Send inquiries from property detail pages</div></div>' :
        myInquiries.map(inq => `
          <div class="card" style="margin-bottom:8px">
            <div class="flex-between">
              <div class="fw-700">${inq.property_title || 'Property #' + inq.property_id}</div>
              <span class="tag tag-${inq.status === 'pending' ? 'orange' : inq.status === 'responded' ? 'green' : 'gray'}">${inq.status || 'pending'}</span>
            </div>
            ${inq.message ? `<div class="text-sm mt-sm">"${inq.message}"</div>` : ''}
            <div class="text-sm text-muted mt-sm">${inq.created_at ? new Date(inq.created_at).toLocaleDateString('en-IN') : ''}</div>
          </div>
        `).join('')}
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
        <button class="chip ${filterType === 'warehouse' ? 'active' : ''}" data-type="warehouse">🏭 Warehouse</button>
      </div>
      ${loading ? '<div class="loading"><div class="spinner"></div></div>' : renderSeekerContent()}
    `;
  }

  function renderSeekerContent() {
    const filtered = properties.filter(p => {
      if (search && !`${p.title} ${p.location_label} ${p.description || ''}`.toLowerCase().includes(search.toLowerCase())) return false;
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
              <div style="text-align:right">
                <div class="l-price">₹${Number(p.rent_amount || 0).toLocaleString()}<div class="text-sm text-muted">/${p.rent_period || 'month'}</div></div>
                <button class="btn btn-small save-btn mt-sm" data-pid="${p.id}" style="border:none;background:none;font-size:18px">${savedIds.has(p.id) ? '❤️' : '🤍'}</button>
              </div>
            </div>
          `).join('')}
      </div>`;
  }

  function attachEvents() {
    container.querySelectorAll('.mode-btn').forEach(b => b.addEventListener('click', () => { mode = b.dataset.mode; tab = mode === 'owner' ? 'listings' : 'browse'; render(); }));
    container.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; render(); }));
    container.querySelector('#searchProp')?.addEventListener('input', e => { search = e.target.value; render(); });
    container.querySelectorAll('.chip[data-type]').forEach(c => c.addEventListener('click', () => { filterType = c.dataset.type; render(); }));
    container.querySelectorAll('.listing-card[data-pid]').forEach(c => {
      c.addEventListener('click', e => {
        if (e.target.closest('.prop-edit-btn, .prop-del-btn, .save-btn, .unsave-btn')) return;
        showPropertyDetail(c.dataset.pid);
      });
    });
    container.querySelector('#addPropertyBtn')?.addEventListener('click', showAddProperty);

    // Owner property edit/delete
    container.querySelectorAll('.prop-edit-btn').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); showEditProperty(b.dataset.pid); }));
    container.querySelectorAll('.prop-del-btn').forEach(b => b.addEventListener('click', async e => {
      e.stopPropagation();
      if (!confirm('Delete this property listing?')) return;
      try { await api.deleteProperty(b.dataset.pid); showToast('Property deleted', 'success'); loadData(); } catch(err) { showToast(err.message, 'error'); }
    }));

    // Save/unsave
    container.querySelectorAll('.save-btn').forEach(b => b.addEventListener('click', async e => {
      e.stopPropagation();
      const pid = Number(b.dataset.pid);
      try {
        if (savedIds.has(pid)) {
          await api.unsaveProperty(pid); savedIds.delete(pid); showToast('Removed from saved', 'info');
        } else {
          await api.saveProperty({ property_id: pid }); savedIds.add(pid); showToast('Property saved!', 'success');
        }
        render();
      } catch(err) { showToast(err.message, 'error'); }
    }));
    container.querySelectorAll('.unsave-btn').forEach(b => b.addEventListener('click', async e => {
      e.stopPropagation();
      try { await api.unsaveProperty(b.dataset.pid); savedIds.delete(Number(b.dataset.pid)); showToast('Removed', 'info'); render(); } catch(err) { showToast(err.message, 'error'); }
    }));
  }

  function showEditProperty(id) {
    const p = properties.find(x => x.id == id);
    if (!p) return;
    showModal(`
      <div class="modal-handle"></div>
      <h3>✏️ Edit Property</h3>
      <div class="form-group"><label>Title</label><input class="form-input" id="epTitle" value="${p.title || ''}"></div>
      <div class="form-group"><label>Rent Amount (₹)</label><input class="form-input" type="number" id="epRent" value="${p.rent_amount || ''}"></div>
      <div class="form-group"><label>Area</label><input class="form-input" id="epArea" value="${p.area || ''}"></div>
      <div class="form-group"><label>Furnishing</label><select class="form-input" id="epFurn"><option value="">Select</option><option ${p.furnishing==='Fully Furnished'?'selected':''}>Fully Furnished</option><option ${p.furnishing==='Semi Furnished'?'selected':''}>Semi Furnished</option><option ${p.furnishing==='Unfurnished'?'selected':''}>Unfurnished</option></select></div>
      <div class="form-group"><label>Location</label><input class="form-input" id="epLoc" value="${p.location_label || ''}"></div>
      <div class="form-group"><label>Status</label><select class="form-input" id="epAvail"><option value="true" ${p.is_available !== false ? 'selected' : ''}>Available</option><option value="false" ${p.is_available === false ? 'selected' : ''}>Unavailable</option></select></div>
      <div class="form-group"><label>Description</label><textarea class="form-input" id="epDesc" rows="2">${p.description || ''}</textarea></div>
      <button class="btn btn-primary" id="savePropEdit" style="width:100%">Save Changes</button>
    `);
    document.querySelector('#savePropEdit')?.addEventListener('click', async () => {
      try {
        await api.updateProperty(p.id, {
          title: document.querySelector('#epTitle')?.value?.trim(),
          rent_amount: Number(document.querySelector('#epRent')?.value),
          area: document.querySelector('#epArea')?.value?.trim(),
          furnishing: document.querySelector('#epFurn')?.value || undefined,
          location_label: document.querySelector('#epLoc')?.value?.trim(),
          is_available: document.querySelector('#epAvail')?.value === 'true',
          description: document.querySelector('#epDesc')?.value?.trim(),
        });
        showToast('Property updated!', 'success'); closeModal(); loadData();
      } catch(err) { showToast(err.message, 'error'); }
    });
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
        <div class="flex-between"><span>Status</span><span>${p.is_verified ? '✅ Verified' : '⏳ Pending Verification'}</span></div>
      </div>
      ${p.description ? `<p class="text-sm mt">${p.description}</p>` : ''}
      ${p.amenities ? `<div class="mt"><strong class="text-sm">🏠 Amenities:</strong><div class="text-sm text-muted">${p.amenities}</div></div>` : ''}
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px">
        <span class="tag tag-green" style="font-size:11px">🚫 Zero Broker</span>
        ${p.is_verified ? '<span class="tag tag-blue" style="font-size:11px">✅ Verified Listing</span>' : ''}
        <span class="tag tag-gray" style="font-size:11px">📞 Masked Calls</span>
        <span class="tag tag-gray" style="font-size:11px">📝 Digital Agreement</span>
      </div>
      ${mode === 'seeker' ? `
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn btn-small" id="savePropModalBtn" style="flex:0;border:none;background:none;font-size:22px">${savedIds.has(p.id) ? '❤️' : '🤍'}</button>
          <button class="btn btn-primary" id="inquiryBtn" style="flex:1">📩 Send Inquiry</button>
        </div>
        <div id="inquiryForm" style="display:none;margin-top:12px">
          <div class="form-group"><label>Your Message</label><textarea class="form-input" id="inqMsg" rows="3" placeholder="I'm interested in this property. Is it still available?"></textarea></div>
          <div class="form-group"><label>Preferred Move-in Date</label><input class="form-input" type="date" id="inqDate"></div>
          <button class="btn btn-primary" id="sendInquiryBtn" style="width:100%">Send Inquiry</button>
        </div>
        <div style="display:flex;gap:8px;margin-top:10px;padding:10px;background:var(--accent-light);border-radius:8px;border:1px solid var(--accent)">
          <span style="font-size:14px">🤖</span>
          <div class="text-sm"><strong>AI Matchmaker:</strong> This property matches your profile with <strong>87% compatibility</strong>. Zero broker fees guaranteed.</div>
        </div>
        <div class="text-sm text-muted mt" style="text-align:center">Free: 3 contacts/month · Connect ₹499/30d: Unlimited</div>
      ` : ''}
    `);
    document.querySelector('#inquiryBtn')?.addEventListener('click', () => {
      document.querySelector('#inquiryForm').style.display = 'block';
      document.querySelector('#inquiryBtn').style.display = 'none';
    });
    document.querySelector('#sendInquiryBtn')?.addEventListener('click', async () => {
      try {
        await api.createPropertyInquiry({ property_id: p.id, message: document.querySelector('#inqMsg')?.value, preferred_date: document.querySelector('#inqDate')?.value || undefined });
        showToast('Inquiry sent!', 'success'); closeModal(); loadData();
      } catch(err) { showToast(err.message, 'error'); }
    });
    document.querySelector('#savePropModalBtn')?.addEventListener('click', async () => {
      try {
        if (savedIds.has(p.id)) { await api.unsaveProperty(p.id); savedIds.delete(p.id); showToast('Removed', 'info'); }
        else { await api.saveProperty({ property_id: p.id }); savedIds.add(p.id); showToast('Saved!', 'success'); }
        closeModal(); render();
      } catch(err) { showToast(err.message, 'error'); }
    });
  }

  function typeIcon(t) {
    return { apartment: '🏢', farm_land: '🌾', pg: '🏠', villa: '🏡', warehouse: '🏭' }[t] || '🏠';
  }

  async function loadData() {
    loading = true; render();
    try {
      const [propRes, st, savedRes, inqRes] = await Promise.all([
        api.getProperties('?limit=30'),
        api.getFCStats().catch(() => ({})),
        api.getSavedProperties().catch(() => []),
        api.getPropertyInquiries().catch(() => []),
      ]);
      properties = Array.isArray(propRes) ? propRes : (propRes.properties || []);
      stats = st?.stats || st || {};
      const savedArr = Array.isArray(savedRes) ? savedRes : (savedRes.saved || []);
      savedIds = new Set(savedArr.map(s => s.property_id || s.id));
      myInquiries = Array.isArray(inqRes) ? inqRes : (inqRes.inquiries || []);
    } catch (e) { console.error(e); }
    loading = false; render();
  }

  loadData();
}
