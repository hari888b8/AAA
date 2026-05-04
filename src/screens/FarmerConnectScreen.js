import { api } from '../api.js';
import { showToast, showModal, closeModal, navigate } from '../app-shell.js';
import { getRole, getState } from '../store.js';
import { t } from '../i18n.js';

export function renderFarmerConnect(container) {
  const role = getRole();
  const userId = getState().user?.id;
  let mode = role === 'buyer' ? 'seeker' : 'owner';
  let tab = mode === 'owner' ? 'listings' : 'browse';
  let properties = [], stats = {}, savedIds = new Set(), myInquiries = [], societies = [];
  let loading = true;
  let search = '', filterType = '', filterBhk = '', filterPetFriendly = false, filterParking = false;

  function render() {
    container.innerHTML = `
      <div class="hero-v2" role="banner" style="background:linear-gradient(135deg,#00c9a7 0%,#a8e063 100%);color:#fff">
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
        <div class="tab-bar" role="tablist">
          <button role="tab" aria-selected="${tab === 'listings'}" class="tab-btn ${tab === 'listings' ? 'active' : ''}" data-tab="listings">🏠 Listings</button>
          <button role="tab" aria-selected="${tab === 'inquiries'}" class="tab-btn ${tab === 'inquiries' ? 'active' : ''}" data-tab="inquiries">📩 Inquiries</button>
          <button role="tab" aria-selected="${tab === 'societies'}" class="tab-btn ${tab === 'societies' ? 'active' : ''}" data-tab="societies">🏘️ Society</button>
          <button role="tab" aria-selected="${tab === 'advisor'}" class="tab-btn ${tab === 'advisor' ? 'active' : ''}" data-tab="advisor">🔬 Disease Advisor</button>
        </div>
        ${tab === 'listings' ? renderOwnerView() : tab === 'inquiries' ? renderOwnerInquiries() : tab === 'societies' ? renderSocieties() : tab === 'advisor' ? renderDiseaseAdvisor() : renderAgreements()}
      ` : `
        <div class="tab-bar" role="tablist">
          <button role="tab" aria-selected="${tab === 'browse'}" class="tab-btn ${tab === 'browse' ? 'active' : ''}" data-tab="browse">🔍 Browse</button>
          <button role="tab" aria-selected="${tab === 'saved'}" class="tab-btn ${tab === 'saved' ? 'active' : ''}" data-tab="saved">❤️ Saved</button>
          <button role="tab" aria-selected="${tab === 'myinquiries'}" class="tab-btn ${tab === 'myinquiries' ? 'active' : ''}" data-tab="myinquiries">📩 My Inquiries</button>
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
        <input type="search" id="searchProp" aria-label="Search properties" placeholder="Search properties…" value="${search}">
      </div>
      <div class="filter-chips">
        <button class="chip ${!filterType ? 'active' : ''}" data-type="">All</button>
        <button class="chip ${filterType === 'apartment' ? 'active' : ''}" data-type="apartment">🏢 Apartment</button>
        <button class="chip ${filterType === 'farm_land' ? 'active' : ''}" data-type="farm_land">🌾 Farm Land</button>
        <button class="chip ${filterType === 'pg' ? 'active' : ''}" data-type="pg">🏠 PG</button>
        <button class="chip ${filterType === 'villa' ? 'active' : ''}" data-type="villa">🏡 Villa</button>
        <button class="chip ${filterType === 'warehouse' ? 'active' : ''}" data-type="warehouse">🏭 Warehouse</button>
      </div>
      <div class="filter-chips" style="gap:6px;padding:4px 16px">
        <button class="chip ${filterBhk === '1' ? 'active' : ''}" data-bhk="1" style="font-size:11px">1 BHK</button>
        <button class="chip ${filterBhk === '2' ? 'active' : ''}" data-bhk="2" style="font-size:11px">2 BHK</button>
        <button class="chip ${filterBhk === '3' ? 'active' : ''}" data-bhk="3" style="font-size:11px">3 BHK</button>
        <button class="chip ${filterPetFriendly ? 'active' : ''}" id="petFriendlyChip" style="font-size:11px">🐾 Pet OK</button>
        <button class="chip ${filterParking ? 'active' : ''}" id="parkingChip" style="font-size:11px">🅿️ Parking</button>
      </div>
      ${loading ? '<div class="loading"><div class="spinner"></div></div>' : renderSeekerContent()}
    `;
  }

  function renderSeekerContent() {
    const filtered = properties.filter(p => {
      if (search && !`${p.title} ${p.location_label} ${p.description || ''}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterType && p.property_type !== filterType) return false;
      if (filterBhk && String(p.bhk) !== filterBhk) return false;
      if (filterPetFriendly && !p.pet_friendly) return false;
      if (filterParking && !p.parking_available) return false;
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
                <div class="l-meta">${p.property_type?.replace('_', ' ') || ''} · ${p.location_label || p.district_name || ''}${p.bhk ? ` · ${p.bhk} BHK` : ''}</div>
                <div class="l-meta">${p.area || 'N/A'} · ${p.furnishing || 'N/A'} · ${p.floor_info || ''}</div>
                <div class="l-tags">
                  ${p.is_verified ? '<span class="tag tag-green">✅ Verified</span>' : ''}
                  ${p.is_available ? '<span class="tag tag-blue">Available</span>' : '<span class="tag tag-gray">Unavailable</span>'}
                  ${p.pet_friendly ? '<span class="tag tag-green" style="font-size:10px">🐾 Pet OK</span>' : ''}
                  ${p.parking_available ? '<span class="tag tag-blue" style="font-size:10px">🅿️ Parking</span>' : ''}
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
    container.querySelectorAll('.chip[data-bhk]').forEach(c => c.addEventListener('click', () => { filterBhk = filterBhk === c.dataset.bhk ? '' : c.dataset.bhk; render(); }));
    container.querySelector('#petFriendlyChip')?.addEventListener('click', () => { filterPetFriendly = !filterPetFriendly; render(); });
    container.querySelector('#parkingChip')?.addEventListener('click', () => { filterParking = !filterParking; render(); });
    // Disease advisor events
    container.querySelectorAll('[data-acrop]').forEach(b => b.addEventListener('click', () => { advisorCrop = b.dataset.acrop; render(); }));
    container.querySelectorAll('[data-symptom]').forEach(cb => cb.addEventListener('change', () => {
      if (cb.checked) advisorSymptoms.add(cb.dataset.symptom);
      else advisorSymptoms.delete(cb.dataset.symptom);
      // Re-render without wiping state
      const el = container.querySelector('.disease-results');
      if (el) el.innerHTML = '';
    }));
    container.querySelectorAll('.ask-expert-disease-btn').forEach(b => b.addEventListener('click', () => showToast('Opening Community Expert Q&A...', 'info')));
    container.querySelectorAll('.buy-spray-btn').forEach(b => b.addEventListener('click', () => { navigate('agrigalaxy'); }));
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

    // Society management
    container.querySelector('#addSocietyBtn')?.addEventListener('click', showAddSociety);
    container.querySelectorAll('.log-visitor-btn').forEach(b => b.addEventListener('click', () => showLogVisitor(b.dataset.sid)));
    container.querySelectorAll('.add-maint-btn').forEach(b => b.addEventListener('click', () => showAddMaintenance(b.dataset.sid)));
    container.querySelectorAll('.log-complaint-btn').forEach(b => b.addEventListener('click', () => showLogComplaint(b.dataset.sid)));

    // Agreements
    container.querySelector('#createAgreementBtn')?.addEventListener('click', showCreateAgreement);
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
          <button class="btn btn-secondary" id="contactOwnerBtn" style="flex:1">📞 Contact Owner</button>
          <button class="btn btn-primary" id="inquiryBtn" style="flex:1">📩 Inquiry</button>
        </div>
        <button class="btn btn-small mt-sm" id="visitBtn" style="width:100%;background:#E8F5E9;color:#2E7D32;border:1px solid #A5D6A7">🗓️ Schedule Visit</button>
        <div id="inquiryForm" style="display:none;margin-top:12px">
          <div class="form-group"><label>Your Message</label><textarea class="form-input" id="inqMsg" rows="3" placeholder="I'm interested in this property. Is it still available?"></textarea></div>
          <div class="form-group"><label>Preferred Move-in Date</label><input class="form-input" type="date" id="inqDate"></div>
          <button class="btn btn-primary" id="sendInquiryBtn" style="width:100%">Send Inquiry</button>
        </div>
        <div id="visitForm" style="display:none;margin-top:12px">
          <div class="form-group"><label>Proposed Visit Time 1</label><input class="form-input" type="datetime-local" id="visitTime1"></div>
          <div class="form-group"><label>Proposed Visit Time 2 (optional)</label><input class="form-input" type="datetime-local" id="visitTime2"></div>
          <div class="form-group"><label>Notes</label><textarea class="form-input" id="visitNotes" rows="2" placeholder="Any preferences or questions…"></textarea></div>
          <button class="btn btn-primary" id="submitVisitBtn" style="width:100%">Request Visit</button>
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
    document.querySelector('#visitBtn')?.addEventListener('click', () => {
      const vf = document.querySelector('#visitForm');
      vf.style.display = vf.style.display === 'none' ? 'block' : 'none';
    });
    document.querySelector('#contactOwnerBtn')?.addEventListener('click', async () => {
      try {
        const res = await api.get(`/farmerconnect/properties/${p.id}/contact`);
        if (res.phone) {
          showToast(`Owner: ${res.phone}`, 'success');
          document.querySelector('#contactOwnerBtn').textContent = `📞 ${res.phone}`;
        } else {
          showToast(res.error || 'Contact limit reached. Upgrade to view.', 'info');
        }
      } catch(err) { showToast(err.message || 'Could not fetch contact', 'error'); }
    });
    document.querySelector('#submitVisitBtn')?.addEventListener('click', async () => {
      const t1 = document.querySelector('#visitTime1')?.value;
      const t2 = document.querySelector('#visitTime2')?.value;
      const notes = document.querySelector('#visitNotes')?.value;
      if (!t1) { showToast('Please select at least one visit time', 'error'); return; }
      const times = [t1]; if (t2) times.push(t2);
      try {
        await api.post(`/farmerconnect/properties/${p.id}/visit`, { proposed_times: times, notes });
        showToast('Visit request sent! Owner will confirm.', 'success'); closeModal();
      } catch(err) { showToast(err.message, 'error'); }
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

  // ─── CROP DISEASE ADVISOR ─────────────────────────────────────────────────
  const DISEASES = [
    {
      id:'d1', crop:'Paddy', name:'Brown Plant Hopper (BPH)', icon:'🐛',
      symptoms:['Yellow/brown patches in circles','Hopper burn — plants drying in patches','Presence of small brown insects at base','Honey dew sticky secretion at stem base'],
      cause:'Insect infestation (Nilaparvata lugens)', severity:'High',
      treatment:['Drain water for 2-3 days (makes insects visible)','Apply Imidacloprid 17.8 SL (0.3ml/L) at base','Avoid excess nitrogen fertilizers','Use BPH-resistant varieties (Dhanalakshmi, Swarna)'],
      prevention:'Avoid excess urea, maintain alternate wetting-drying',
      color:'#FFEBEE', badge:'#C62828',
    },
    {
      id:'d2', crop:'Paddy', name:'Blast Disease (Neck Blast)', icon:'🍃',
      symptoms:['Diamond-shaped lesions on leaves','Grey-white spots with brown border','Neck of panicle turns grey and breaks','Poor grain filling'],
      cause:'Fungus: Pyricularia oryzae', severity:'High',
      treatment:['Spray Tricyclazole 75 WP (0.6g/L) at booting','Apply Carbendazim+Mancozeb at disease onset','Avoid high nitrogen during booting stage'],
      prevention:'Seed treatment with Carbendazim, use resistant varieties',
      color:'#F3E5F5', badge:'#6A1B9A',
    },
    {
      id:'d3', crop:'Cotton', name:'Cotton Bollworm', icon:'🐛',
      symptoms:['Round holes in bolls','Caterpillars inside bolls','Premature boll shedding','Webbing visible on plant'],
      cause:'Helicoverpa armigera insect', severity:'Medium',
      treatment:['Spray Emamectin Benzoate 5 SG (0.4g/L)','Use pheromone traps (5/acre)','Spray Spinosad 45 SC at 0.3ml/L','Remove and destroy infested bolls'],
      prevention:'Use Bt cotton varieties, install yellow sticky traps',
      color:'#FFF3E0', badge:'#E65100',
    },
    {
      id:'d4', crop:'Chilli', name:'Leaf Curl Virus (TYLCV)', icon:'🌿',
      symptoms:['Leaves curl upward (cup-like)','Mosaic pattern on young leaves','Stunted growth','Reduced fruit set'],
      cause:'Virus spread by whiteflies', severity:'High',
      treatment:['No direct cure; remove infected plants immediately','Control whitefly: Imidacloprid 17.8 SL (0.3ml/L)','Apply reflective mulch to repel vectors','Use virus-free certified seedlings'],
      prevention:'Use resistant varieties (LCA306, Byadgi Kaddi), sticky traps',
      color:'#E8F5E9', badge:'#2E7D32',
    },
    {
      id:'d5', crop:'Tomato', name:'Early Blight', icon:'🍅',
      symptoms:['Dark brown concentric ring spots on older leaves','Yellow halo around spots','Leaves turn yellow and fall','Spots on stem and fruit near calyx'],
      cause:'Fungus: Alternaria solani', severity:'Medium',
      treatment:['Spray Mancozeb 75 WP (2.5g/L) every 7-10 days','Apply Chlorothalonil 75 WP at 2g/L','Remove and burn infected lower leaves'],
      prevention:'Crop rotation, avoid overhead irrigation, mulching',
      color:'#E3F2FD', badge:'#1565C0',
    },
    {
      id:'d6', crop:'Groundnut', name:'Tikka / Leaf Spot Disease', icon:'🥜',
      symptoms:['Light brown spots with yellow halo (early blight)','Dark brown spots without halo (late blight)','Premature defoliation','Reduced pod yield'],
      cause:'Cercospora arachidicola / C. personatum fungi', severity:'Medium',
      treatment:['Spray Chlorothalonil 75 WP (2g/L) every 14 days','Apply Tebuconazole 25.9 EC at 1ml/L','Spray at 30, 45, 60, 75 DAS'],
      prevention:'Use disease-free seed, treat with Thiram, crop rotation',
      color:'#FFF8E1', badge:'#F9A825',
    },
  ];

  let advisorCrop = 'All', advisorStage = 1, advisorSymptoms = new Set();

  const SYMPTOM_CHECKLIST = [
    'Yellow/brown patches','Spots on leaves','Holes in leaves/fruit','Wilting','Stunted growth',
    'White powder on leaves','Roots rotting','Insects visible','Leaf curl','Sticky secretions',
    'Webbing on plant','Premature fruit drop','Discoloration of stem','Mosaic pattern',
  ];

  function renderDiseaseAdvisor() {
    const crops = ['All','Paddy','Cotton','Chilli','Tomato','Groundnut','Maize','Soybean'];
    const filtered = advisorCrop === 'All' ? DISEASES : DISEASES.filter(d => d.crop === advisorCrop);

    return `<div style="padding:10px 14px 0">
      <div style="background:linear-gradient(135deg,#1B5E20,#2E7D32);border-radius:12px;padding:14px;color:white;margin-bottom:12px">
        <div style="font-size:13px;font-weight:800;margin-bottom:4px">🔬 AI Crop Disease Advisor</div>
        <div style="font-size:11px;opacity:0.85">Identify crop diseases from symptoms and get treatment recommendations</div>
      </div>

      <!-- Step 1: Select Crop -->
      <div style="margin-bottom:12px">
        <div style="font-size:11px;font-weight:700;color:var(--text3,#9E9E9E);text-transform:uppercase;margin-bottom:8px">Step 1: Select Your Crop</div>
        <div style="overflow-x:auto;white-space:nowrap">
          ${crops.map(c=>`<button data-acrop="${c}" style="display:inline-block;padding:7px 14px;border-radius:20px;border:none;font-size:11px;font-weight:600;cursor:pointer;margin-right:6px;${advisorCrop===c?'background:#1B5E20;color:white':'background:#E8F5E9;color:#1B5E20'}">${c}</button>`).join('')}
        </div>
      </div>

      <!-- Step 2: Symptom Checker -->
      <div style="margin-bottom:12px">
        <div style="font-size:11px;font-weight:700;color:var(--text3,#9E9E9E);text-transform:uppercase;margin-bottom:8px">Step 2: Mark Visible Symptoms</div>
        <div style="background:var(--card,white);border-radius:10px;padding:10px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
            ${SYMPTOM_CHECKLIST.map(s=>`<label style="display:flex;align-items:center;gap:6px;font-size:11px;cursor:pointer"><input type="checkbox" data-symptom="${s}" ${advisorSymptoms.has(s)?'checked':''}> ${s}</label>`).join('')}
          </div>
          ${advisorSymptoms.size>0?`<div style="margin-top:8px;padding-top:8px;border-top:1px solid #EEE;font-size:11px;color:#1B5E20;font-weight:600">✓ ${advisorSymptoms.size} symptoms selected</div>`:''}
        </div>
      </div>

      <!-- Disease Results -->
      <div style="font-size:11px;font-weight:700;color:var(--text3,#9E9E9E);text-transform:uppercase;margin-bottom:8px">Matching Diseases (${filtered.length})</div>
      ${filtered.map(d=>`
        <div style="background:${d.color};border-radius:12px;padding:14px;margin-bottom:12px;border-left:4px solid ${d.badge}">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <div>
              <div style="font-weight:800;font-size:14px">${d.icon} ${d.name}</div>
              <div style="font-size:11px;color:#555;margin-top:2px">🌾 ${d.crop} · 🦠 ${d.cause}</div>
            </div>
            <span style="background:${d.badge};color:white;border-radius:8px;padding:3px 8px;font-size:10px;font-weight:700">${d.severity} Risk</span>
          </div>
          <div style="font-size:12px;font-weight:700;margin-bottom:4px">🔍 Symptoms:</div>
          <ul style="margin:0 0 8px 14px;font-size:11px;color:#555;line-height:1.8">
            ${d.symptoms.map(s=>`<li>${s}</li>`).join('')}
          </ul>
          <div style="font-size:12px;font-weight:700;margin-bottom:4px">💊 Treatment:</div>
          <ul style="margin:0 0 8px 14px;font-size:11px;color:#555;line-height:1.8">
            ${d.treatment.map(tr=>`<li>${tr}</li>`).join('')}
          </ul>
          <div style="background:rgba(255,255,255,0.6);border-radius:8px;padding:8px;font-size:11px;color:#333">
            <strong>🛡️ Prevention:</strong> ${d.prevention}
          </div>
          <div style="display:flex;gap:8px;margin-top:10px">
            <button class="ask-expert-disease-btn" data-disease="${d.name}" style="flex:1;background:white;border:1px solid ${d.badge};color:${d.badge};border-radius:8px;padding:7px;font-size:11px;font-weight:700;cursor:pointer">💬 Ask Expert</button>
            <button class="buy-spray-btn" data-disease="${d.name}" style="flex:1;background:${d.badge};color:white;border:none;border-radius:8px;padding:7px;font-size:11px;font-weight:700;cursor:pointer">🛒 Buy Spray</button>
          </div>
        </div>
      `).join('')}
    </div>`;
  }

  function renderSocieties() {
    return `<div class="section" style="padding-top:8px">
      <div class="section-title">🏘️ Society Management</div>
      <button class="btn btn-primary btn-small mb" id="addSocietyBtn" style="width:100%">+ Add Society</button>
      ${societies.length === 0 ? `<div class="empty-state"><div class="es-icon">🏘️</div><div class="es-title">No societies managed</div><div class="es-text">Add your society/colony for visitor tracking, maintenance & complaints</div></div>` :
        societies.map(s => `
          <div class="card" style="padding:14px;margin-bottom:10px">
            <div class="flex-between" style="margin-bottom:8px">
              <div class="fw-700">${s.name}</div>
              <span class="tag tag-blue">${s.total_units || 0} units</span>
            </div>
            <div class="text-sm text-muted">${s.address || s.district_name || 'Local'}</div>
            <div style="display:flex;gap:6px;margin-top:10px">
              <button class="btn btn-secondary btn-small log-visitor-btn" data-sid="${s.id}" style="flex:1">👤 Visitor</button>
              <button class="btn btn-secondary btn-small add-maint-btn" data-sid="${s.id}" style="flex:1">💰 Maintenance</button>
              <button class="btn btn-secondary btn-small log-complaint-btn" data-sid="${s.id}" style="flex:1">📢 Complaint</button>
            </div>
          </div>
        `).join('')}
      <div class="card" style="padding:14px;margin-top:8px;background:var(--info-bg);border:1px solid var(--info)">
        <div class="fw-600 text-sm">🏘️ Society Features</div>
        <div class="text-sm text-muted" style="margin-top:6px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
            <span>✅ Visitor Log</span><span>✅ Maintenance Billing</span>
            <span>✅ Complaint Tracking</span><span>✅ Notice Board</span>
            <span>✅ Vendor Management</span><span>✅ Digital Gate Pass</span>
          </div>
        </div>
      </div>
    </div>`;
  }

  function renderAgreements() {
    return `<div class="section" style="padding-top:8px">
      <div class="section-title">📝 Digital Rent Agreements</div>
      ${properties.length > 0 ? `<button class="btn btn-primary btn-small mb" id="createAgreementBtn" style="width:100%">+ Create Agreement</button>` : '<div class="text-sm text-muted mb">List a property first to create agreements</div>'}
      <div class="card" style="padding:16px;margin-bottom:12px">
        <div class="fw-700" style="margin-bottom:10px">📋 Agreement Benefits</div>
        <div style="display:grid;gap:8px">
          ${[
            { icon: '📱', title: 'Digital & Paperless', desc: 'Create, sign & share agreements digitally' },
            { icon: '🔒', title: 'Legally Valid', desc: 'E-stamped and compliant with state laws' },
            { icon: '🔔', title: 'Auto-Reminders', desc: 'Renewal & payment reminders for both parties' },
            { icon: '💰', title: 'Security Deposit Tracking', desc: 'Record and track security deposits safely' },
          ].map(f => `
            <div style="display:flex;gap:10px;padding:8px;background:var(--bg);border-radius:8px">
              <span style="font-size:20px">${f.icon}</span>
              <div><div class="fw-600 text-sm">${f.title}</div><div class="text-sm text-muted">${f.desc}</div></div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="card" style="padding:14px;background:var(--accent-light);border:1px solid var(--accent)">
        <div class="fw-600 text-sm">💰 Agreement Pricing</div>
        <div class="text-sm text-muted mt-sm">Basic (Free): Standard template · Premium (₹299): Custom terms + e-stamp · Legal (₹999): Lawyer-reviewed</div>
      </div>
    </div>`;
  }

  function showAddSociety() {
    showModal(`
      <div class="modal-handle"></div>
      <h3>🏘️ Add Society</h3>
      <div class="form-group"><label>Society Name</label><input class="form-input" type="text" id="socName" placeholder="Green Valley Apartments"></div>
      <div class="form-group"><label>Address</label><textarea class="form-input" id="socAddr" rows="2" placeholder="Full address…"></textarea></div>
      <div class="form-group"><label>Total Units</label><input class="form-input" type="number" id="socUnits" placeholder="48"></div>
      <button class="btn btn-primary" id="submitSociety" style="width:100%">Add Society</button>
    `);
    document.querySelector('#submitSociety')?.addEventListener('click', async () => {
      try {
        await api.createSociety({
          name: document.querySelector('#socName')?.value?.trim(),
          address: document.querySelector('#socAddr')?.value?.trim(),
          total_units: Number(document.querySelector('#socUnits')?.value) || 0,
        });
        showToast('Society added!', 'success'); closeModal(); loadData();
      } catch(e) { showToast(e.message, 'error'); }
    });
  }

  function showLogVisitor(societyId) {
    showModal(`
      <div class="modal-handle"></div>
      <h3>👤 Log Visitor</h3>
      <div class="form-group"><label>Visitor Name</label><input class="form-input" type="text" id="vName" placeholder="Name"></div>
      <div class="form-group"><label>Phone</label><input class="form-input" type="tel" id="vPhone" placeholder="9876543210"></div>
      <div class="form-group"><label>Purpose</label><select class="form-input" id="vPurpose"><option>Visiting Resident</option><option>Delivery</option><option>Service/Repair</option><option>Guest</option><option>Other</option></select></div>
      <div class="form-group"><label>Unit Number</label><input class="form-input" type="text" id="vUnit" placeholder="A-101"></div>
      <button class="btn btn-primary" id="submitVisitor" style="width:100%">Log Entry</button>
    `);
    document.querySelector('#submitVisitor')?.addEventListener('click', async () => {
      try {
        await api.logVisitor(societyId, {
          visitor_name: document.querySelector('#vName')?.value?.trim(),
          phone: document.querySelector('#vPhone')?.value?.trim(),
          purpose: document.querySelector('#vPurpose')?.value,
          unit_number: document.querySelector('#vUnit')?.value?.trim(),
        });
        showToast('Visitor logged!', 'success'); closeModal();
      } catch(e) { showToast(e.message, 'error'); }
    });
  }

  function showAddMaintenance(societyId) {
    showModal(`
      <div class="modal-handle"></div>
      <h3>💰 Add Maintenance Bill</h3>
      <div class="form-group"><label>Unit Number</label><input class="form-input" type="text" id="mUnit" placeholder="A-101"></div>
      <div class="form-group"><label>Resident Name</label><input class="form-input" type="text" id="mName" placeholder="Name"></div>
      <div class="form-group"><label>Amount (₹)</label><input class="form-input" type="number" id="mAmount" placeholder="2500"></div>
      <div class="form-group"><label>Due Date</label><input class="form-input" type="date" id="mDue"></div>
      <button class="btn btn-primary" id="submitMaint" style="width:100%">Create Bill</button>
    `);
    document.querySelector('#submitMaint')?.addEventListener('click', async () => {
      try {
        await api.createMaintenance(societyId, {
          unit_number: document.querySelector('#mUnit')?.value?.trim(),
          resident_name: document.querySelector('#mName')?.value?.trim(),
          amount: Number(document.querySelector('#mAmount')?.value),
          due_date: document.querySelector('#mDue')?.value,
        });
        showToast('Maintenance bill created!', 'success'); closeModal();
      } catch(e) { showToast(e.message, 'error'); }
    });
  }

  function showLogComplaint(societyId) {
    showModal(`
      <div class="modal-handle"></div>
      <h3>📢 Log Complaint</h3>
      <div class="form-group"><label>Unit Number</label><input class="form-input" type="text" id="cUnit" placeholder="A-101"></div>
      <div class="form-group"><label>Category</label><select class="form-input" id="cCat"><option value="plumbing">🔧 Plumbing</option><option value="electrical">💡 Electrical</option><option value="noise">🔊 Noise</option><option value="parking">🅿️ Parking</option><option value="cleaning">🧹 Cleaning</option><option value="security">🔒 Security</option><option value="other">Other</option></select></div>
      <div class="form-group"><label>Description</label><textarea class="form-input" id="cDesc" rows="3" placeholder="Describe the issue…"></textarea></div>
      <button class="btn btn-primary" id="submitComplaint" style="width:100%">Submit Complaint</button>
    `);
    document.querySelector('#submitComplaint')?.addEventListener('click', async () => {
      try {
        await api.logComplaint(societyId, {
          unit_number: document.querySelector('#cUnit')?.value?.trim(),
          category: document.querySelector('#cCat')?.value,
          description: document.querySelector('#cDesc')?.value?.trim(),
        });
        showToast('Complaint logged!', 'success'); closeModal();
      } catch(e) { showToast(e.message, 'error'); }
    });
  }

  function showCreateAgreement() {
    showModal(`
      <div class="modal-handle"></div>
      <h3>📝 Create Rent Agreement</h3>
      <div class="form-group"><label>Property</label><select class="form-input" id="agProp">${properties.map(p => `<option value="${p.id}">${p.title}</option>`).join('')}</select></div>
      <div class="form-group"><label>Tenant Name</label><input class="form-input" type="text" id="agTenant" placeholder="Tenant's full name"></div>
      <div class="form-group"><label>Tenant Phone</label><input class="form-input" type="tel" id="agPhone" placeholder="9876543210"></div>
      <div class="form-group"><label>Monthly Rent (₹)</label><input class="form-input" type="number" id="agRent" placeholder="12000"></div>
      <div class="form-group"><label>Security Deposit (₹)</label><input class="form-input" type="number" id="agDeposit" placeholder="24000"></div>
      <div class="form-group"><label>Start Date</label><input class="form-input" type="date" id="agStart"></div>
      <div class="form-group"><label>End Date</label><input class="form-input" type="date" id="agEnd"></div>
      <div class="form-group"><label>Special Terms</label><textarea class="form-input" id="agTerms" rows="2" placeholder="Any additional terms…"></textarea></div>
      <button class="btn btn-primary" id="submitAgreement" style="width:100%">Create Agreement</button>
    `);
    document.querySelector('#submitAgreement')?.addEventListener('click', async () => {
      try {
        await api.createAgreement({
          property_id: document.querySelector('#agProp')?.value,
          tenant_name: document.querySelector('#agTenant')?.value?.trim(),
          tenant_phone: document.querySelector('#agPhone')?.value?.trim(),
          rent_amount: Number(document.querySelector('#agRent')?.value),
          security_deposit: Number(document.querySelector('#agDeposit')?.value) || 0,
          start_date: document.querySelector('#agStart')?.value,
          end_date: document.querySelector('#agEnd')?.value,
          terms: document.querySelector('#agTerms')?.value?.trim() || undefined,
        });
        showToast('Agreement created!', 'success'); closeModal();
      } catch(e) { showToast(e.message, 'error'); }
    });
  }

  function typeIcon(t) {
    return { apartment: '🏢', farm_land: '🌾', pg: '🏠', villa: '🏡', warehouse: '🏭' }[t] || '🏠';
  }

  async function loadData() {
    loading = true; render();
    try {
      const [propRes, st, savedRes, inqRes, socRes] = await Promise.all([
        api.getProperties('?limit=30'),
        api.getFCStats().catch(() => ({})),
        api.getSavedProperties().catch(() => []),
        api.getPropertyInquiries().catch(() => []),
        api.getSocieties().catch(() => []),
      ]);
      properties = Array.isArray(propRes) ? propRes : (propRes.properties || []);
      stats = st?.stats || st || {};
      const savedArr = Array.isArray(savedRes) ? savedRes : (savedRes.saved || []);
      savedIds = new Set(savedArr.map(s => s.property_id || s.id));
      myInquiries = Array.isArray(inqRes) ? inqRes : (inqRes.inquiries || []);
      societies = Array.isArray(socRes) ? socRes : (socRes.societies || []);
    } catch (e) { console.error(e); }
    loading = false; render();
  }

  loadData();
}
