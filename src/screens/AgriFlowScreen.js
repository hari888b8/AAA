import { api } from '../api.js';
import { navigate, showToast, showModal, closeModal } from '../main.js';
import { getRole } from '../store.js';

export function renderAgriFlow(container) {
  const role = getRole();
  const isBuyer = role === 'buyer';
  const isFPO = role === 'fpo';
  let tab = isBuyer ? 'marketplace' : isFPO ? 'marketplace' : 'marketplace';
  let listings = [], crops = [], districts = [];
  let myListings = [], declarations = [], inquiries = [];
  let fpoMembers = [], fpoInventory = [], fpoStats = {};
  let watchlist = [];
  let loading = true;
  let search = '';
  let filterCrop = '';

  function render() {
    container.innerHTML = `
      <div class="app-brand-header" style="padding:14px 16px 10px;background:linear-gradient(135deg,#7b2ff7 0%,#2f80ed 100%);color:#fff">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:28px">🌾</span>
          <div><div style="font-size:18px;font-weight:800;letter-spacing:-0.3px">AgriFlow</div><div style="font-size:11px;opacity:0.85">Supply Intelligence & Farmer Network · 200+ Features</div></div>
        </div>
      </div>
      ${isBuyer ? `<div class="role-badge" style="display:flex;align-items:center;gap:6px;padding:10px 16px;background:var(--info-bg);border-bottom:1px solid var(--border)">
        <span style="font-size:16px">🛒</span><span class="fw-600 text-sm" style="color:var(--info)">Buyer View</span>
        <span class="text-sm text-muted" style="margin-left:auto">Aggregated data only · Individual farmer data hidden</span>
      </div>` : isFPO ? `<div class="role-badge" style="display:flex;align-items:center;gap:6px;padding:10px 16px;background:var(--success-bg);border-bottom:1px solid var(--border)">
        <span style="font-size:16px">🏢</span><span class="fw-600 text-sm" style="color:var(--success)">FPO Admin View</span>
        <span class="text-sm text-muted" style="margin-left:auto">Member management · Procurement</span>
      </div>` : ''}
      <div class="tab-bar">
        ${isBuyer ? `
          <button class="tab-btn ${tab === 'marketplace' ? 'active' : ''}" data-tab="marketplace">🔍 Supply Search</button>
          <button class="tab-btn ${tab === 'inquiries' ? 'active' : ''}" data-tab="inquiries">💬 My Inquiries</button>
          <button class="tab-btn ${tab === 'reports' ? 'active' : ''}" data-tab="reports">📊 Reports</button>
        ` : isFPO ? `
          <button class="tab-btn ${tab === 'marketplace' ? 'active' : ''}" data-tab="marketplace">🛒 Marketplace</button>
          <button class="tab-btn ${tab === 'members' ? 'active' : ''}" data-tab="members">👥 Members</button>
          <button class="tab-btn ${tab === 'procurement' ? 'active' : ''}" data-tab="procurement">📦 Procurement</button>
          <button class="tab-btn ${tab === 'inquiries' ? 'active' : ''}" data-tab="inquiries">💬 Inquiries</button>
        ` : `
          <button class="tab-btn ${tab === 'marketplace' ? 'active' : ''}" data-tab="marketplace">🛒 Marketplace</button>
          <button class="tab-btn ${tab === 'mylistings' ? 'active' : ''}" data-tab="mylistings">📋 My Listings</button>
          <button class="tab-btn ${tab === 'declarations' ? 'active' : ''}" data-tab="declarations">🌱 Declarations</button>
          <button class="tab-btn ${tab === 'inquiries' ? 'active' : ''}" data-tab="inquiries">💬 Inquiries</button>
        `}
      </div>
      ${tab === 'marketplace' ? renderMarketplace()
        : tab === 'mylistings' ? renderMyListings()
        : tab === 'declarations' ? renderDeclarations()
        : tab === 'inquiries' ? renderInquiries()
        : tab === 'reports' ? renderBuyerReports()
        : tab === 'members' ? renderFPOMembers()
        : tab === 'procurement' ? renderFPOProcurement()
        : ''}
    `;
    attachEvents();
  }

  function renderBuyerReports() {
    return `<div class="section" style="padding-top:8px">
      ${[
        { icon: '🗺️', title: 'Supply Heatmap', desc: 'District-level crop availability map across states. Min 5 farmer threshold for privacy.', tier: 'Explorer+' },
        { icon: '📈', title: '30-Day Forecast', desc: 'Predicted harvest volumes based on crop declarations, weather data & historical patterns.', tier: 'Trader+' },
        { icon: '📊', title: 'Demand-Supply Gap', desc: 'Identify surplus/deficit regions. Strategic procurement planning.', tier: 'Trader+' },
        { icon: '🏢', title: 'FPO Directory', desc: 'Verified FPOs with supply capacity, response rates & trust scores.', tier: 'Explorer+' },
        { icon: '🤖', title: 'Custom Intelligence', desc: 'AI-powered reports tailored to your procurement needs, crop basket & geography.', tier: 'Enterprise' },
      ].map(r => `
        <div class="card" style="padding:16px;margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div style="display:flex;gap:10px;align-items:flex-start">
              <span style="font-size:24px">${r.icon}</span>
              <div>
                <div class="fw-700">${r.title}</div>
                <div class="text-sm text-muted" style="margin-top:4px">${r.desc}</div>
              </div>
            </div>
            <span class="tag tag-blue" style="font-size:10px;flex-shrink:0">${r.tier}</span>
          </div>
          <button class="btn btn-secondary btn-small mt" style="width:100%">View Report →</button>
        </div>
      `).join('')}
      <div class="card" style="padding:16px;margin-bottom:12px;background:var(--accent-light);border:1px solid var(--accent)">
        <div class="fw-700" style="margin-bottom:6px">💰 Subscription Plans</div>
        <div class="text-sm" style="margin-top:8px">
          <div style="display:flex;justify-content:space-between;padding:4px 0">
            <span>Explorer</span><span class="fw-600">₹9,999/yr · 5 states</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:4px 0">
            <span>Trader</span><span class="fw-600">₹24,999/yr · 10 states</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:4px 0">
            <span>Enterprise</span><span class="fw-600">₹59,999/yr · All-India + API</span>
          </div>
        </div>
      </div>
    </div>`;
  }

  function renderFPOMembers() {
    return `<div class="section" style="padding-top:8px">
      <div class="stats-grid mb-lg">
        <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-value">${fpoMembers.length}</div><div class="stat-label">Members</div></div>
        <div class="stat-card"><div class="stat-icon">🌾</div><div class="stat-value">${fpoStats.total_declarations || 0}</div><div class="stat-label">Declarations</div></div>
        <div class="stat-card"><div class="stat-icon">📦</div><div class="stat-value">₹${Number(fpoStats.total_procurement || 0).toLocaleString()}</div><div class="stat-label">Procurement</div></div>
      </div>
      <button class="btn btn-primary btn-small mb" id="addMemberBtn">+ Add Member</button>
      ${fpoMembers.length === 0 ? '<div class="empty-state"><div class="es-icon">👥</div><div class="es-title">No members yet</div><div class="es-text">Add farmers to your FPO to start managing procurement</div></div>' :
        fpoMembers.map(m => `
          <div class="listing-card">
            <div class="l-icon" style="background:var(--primary-surface);border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--primary)">${(m.name || 'F')[0]}</div>
            <div class="l-body">
              <div class="l-title">${m.name || 'Farmer'}</div>
              <div class="l-meta">📱 ${m.phone || 'N/A'} · ${m.district_name || ''}</div>
              <div class="l-tags">
                <span class="tag tag-${m.is_verified ? 'green' : 'orange'}">${m.is_verified ? '✅ Verified' : '⏳ Pending'}</span>
                ${m.total_declarations ? `<span class="tag tag-gray">${m.total_declarations} declarations</span>` : ''}
              </div>
            </div>
          </div>
        `).join('')}
    </div>`;
  }

  function renderFPOProcurement() {
    return `<div class="section" style="padding-top:8px">
      <div class="card" style="padding:16px;margin-bottom:12px">
        <div class="fw-700" style="margin-bottom:8px">📦 Record Procurement</div>
        <div class="text-sm text-muted" style="margin-bottom:12px">Record crop procurement from member farmers</div>
        <button class="btn btn-primary btn-small" id="recordProcBtn">+ Record Procurement</button>
      </div>
      <div class="card" style="padding:16px;margin-bottom:12px">
        <div class="fw-700" style="margin-bottom:8px">📊 Inventory</div>
        ${fpoInventory.length === 0 ? '<div class="text-sm text-muted">No inventory recorded yet. Record procurement to build inventory.</div>' :
          fpoInventory.map(inv => `
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
              <div><span class="fw-600">${inv.crop_name || 'Crop'}</span><div class="text-sm text-muted">${inv.grade || 'A'} grade · ${inv.warehouse_location || 'Main warehouse'}</div></div>
              <div style="text-align:right"><span class="fw-600">${Number(inv.quantity_kg || 0).toLocaleString()} kg</span></div>
            </div>
          `).join('')}
      </div>
      <div class="card" style="padding:16px;margin-bottom:12px">
        <div class="fw-700" style="margin-bottom:8px">🌾 Publish Supply Listing</div>
        <div class="text-sm text-muted" style="margin-bottom:8px">Publish aggregated supply from inventory for buyers</div>
        <button class="btn btn-secondary btn-small" id="publishSupplyBtn">+ Create Supply Listing</button>
      </div>
    </div>`;
  }

  function renderMarketplace() {
    const filtered = listings.filter(l => {
      if (search && !`${l.crop_name} ${l.farmer_name} ${l.location_label}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCrop && l.crop_id != filterCrop) return false;
      return true;
    });
    return `
      <div class="search-bar">
        <span class="s-icon">🔍</span>
        <input type="text" id="searchInput" placeholder="Search crops, farmers…" value="${search}">
      </div>
      <div class="filter-chips">
        <button class="chip ${!filterCrop ? 'active' : ''}" data-crop="">All</button>
        ${crops.slice(0, 8).map(c => `<button class="chip ${filterCrop == c.id ? 'active' : ''}" data-crop="${c.id}">${c.icon_emoji || ''} ${c.name}</button>`).join('')}
      </div>
      <div class="section" style="padding-top:0">
        ${loading ? '<div class="loading"><div class="spinner"></div></div>' : filtered.length === 0
          ? '<div class="empty-state"><div class="es-icon">🌾</div><div class="es-title">No listings found</div><div class="es-text">Try different filters</div></div>'
          : filtered.map(l => `
            <div class="listing-card" data-id="${l.id}">
              <div class="l-icon">${l.icon_emoji || '🌾'}</div>
              <div class="l-body">
                <div class="l-title">${l.crop_name || 'Crop'}</div>
                <div class="l-meta">${isBuyer ? (l.district_name || l.location_label || 'District') : (l.farmer_name || 'Farmer')} · ${l.location_label || l.district_name || ''}</div>
                <div class="l-meta">${Number(l.quantity_kg || 0).toLocaleString()} kg · Grade: ${l.grade || 'A'}</div>
                <div class="l-tags">
                  ${l.is_organic ? '<span class="tag tag-green">🌿 Organic</span>' : ''}
                  <span class="tag tag-blue">${l.status || 'active'}</span>
                  ${isBuyer ? '<span class="tag tag-gray">🔒 Aggregated</span>' : ''}
                </div>
              </div>
              <div style="text-align:right">
                <div class="l-price">₹${Number(l.price_per_kg || 0).toFixed(0)}/kg</div>
                ${isBuyer ? `<button class="btn btn-primary btn-small mt-sm inquiry-btn" data-lid="${l.id}" style="font-size:11px">Send Inquiry</button>
                <button class="btn btn-secondary btn-small mt-sm watchlist-btn" data-lid="${l.id}" style="font-size:11px">${watchlist.some(w => w.listing_id == l.id || w.crop_id == l.crop_id) ? '⭐ Watching' : '☆ Watch'}</button>` : ''}
              </div>
            </div>
          `).join('')}
      </div>`;
  }

  function renderMyListings() {
    return `
      <div class="section">
        ${!loading && myListings.length > 0 ? '<button class="btn btn-primary btn-small mb" id="createListingBtn" style="width:100%">+ Create New Listing</button>' : ''}
        ${loading ? '<div class="loading"><div class="spinner"></div></div>' : myListings.length === 0
          ? `<div class="empty-state"><div class="es-icon">📋</div><div class="es-title">No listings yet</div><div class="es-text">Create your first crop listing</div><button class="btn btn-primary btn-small mt" id="createListingBtn">+ Create Listing</button></div>`
          : myListings.map(l => `
            <div class="card" style="padding:12px;margin-bottom:8px">
              <div style="display:flex;align-items:center;gap:10px">
                <span style="font-size:24px">${l.icon_emoji || '🌾'}</span>
                <div style="flex:1">
                  <div class="fw-600">${l.crop_name || 'Crop'}</div>
                  <div class="text-sm text-muted">${Number(l.quantity_kg || 0).toLocaleString()} kg · ₹${Number(l.price_per_kg || 0).toFixed(0)}/kg</div>
                </div>
                <span class="tag tag-${l.status === 'active' ? 'green' : 'gray'}">${l.status}</span>
              </div>
              <div style="display:flex;gap:8px;margin-top:8px">
                <button class="btn btn-secondary btn-small edit-listing-btn" data-id="${l.id}" style="flex:1;font-size:11px">✏️ Edit</button>
                <button class="btn btn-small delete-listing-btn" data-id="${l.id}" style="flex:1;font-size:11px;background:#FFEBEE;color:#C62828;border:none">🗑️ Delete</button>
              </div>
            </div>
          `).join('')}
      </div>`;
  }

  function renderDeclarations() {
    return `
      <div class="section">
        ${!loading && declarations.length > 0 ? '<button class="btn btn-primary btn-small mb" id="createDeclBtn" style="width:100%">+ New Declaration</button>' : ''}
        ${loading ? '<div class="loading"><div class="spinner"></div></div>' : declarations.length === 0
          ? `<div class="empty-state"><div class="es-icon">🌱</div><div class="es-title">No declarations</div><div class="es-text">Declare your crop harvest</div><button class="btn btn-primary btn-small mt" id="createDeclBtn">+ New Declaration</button></div>`
          : declarations.map(d => `
            <div class="card" style="padding:12px;margin-bottom:8px">
              <div class="flex-between">
                <div><strong>${d.crop_name || 'Crop'}</strong> ${d.icon_emoji || ''}</div>
                <span class="tag tag-green">${d.quality_grade || 'A'}</span>
              </div>
              <div class="text-sm text-muted mt-sm">${d.area_acres || 0} acres · Expected: ${Number(d.expected_yield || 0).toLocaleString()} kg</div>
              <div class="text-sm text-muted">Sow: ${fmtDate(d.sow_date)} → Harvest: ${fmtDate(d.expected_harvest_date)}</div>
              ${d.is_organic ? '<span class="tag tag-green mt-sm">🌿 Organic</span>' : ''}
              <div style="display:flex;gap:8px;margin-top:8px">
                <button class="btn btn-secondary btn-small edit-decl-btn" data-id="${d.id}" style="flex:1;font-size:11px">✏️ Edit</button>
                <button class="btn btn-small delete-decl-btn" data-id="${d.id}" style="flex:1;font-size:11px;background:#FFEBEE;color:#C62828;border:none">🗑️ Delete</button>
              </div>
            </div>
          `).join('')}
      </div>`;
  }

  function renderInquiries() {
    return `
      <div class="section">
        ${loading ? '<div class="loading"><div class="spinner"></div></div>' : inquiries.length === 0
          ? '<div class="empty-state"><div class="es-icon">💬</div><div class="es-title">No inquiries</div><div class="es-text">Inquiries from buyers will appear here</div></div>'
          : inquiries.map(q => {
            const isPending = q.status === 'pending';
            const isAccepted = q.status === 'accepted';
            return `<div class="card" style="padding:12px;margin-bottom:8px">
              <div class="flex-between">
                <strong>${q.crop_name || 'Crop'}</strong>
                <span class="tag tag-${q.status === 'accepted' ? 'green' : q.status === 'rejected' ? 'red' : 'blue'}">${q.status || 'pending'}</span>
              </div>
              <div class="text-sm text-muted mt-sm">Qty: ${q.quantity_needed || 'N/A'} kg${q.offered_price ? ' · Offered: ₹' + Number(q.offered_price).toFixed(0) + '/kg' : ''}</div>
              <div class="text-sm text-muted">${q.buyer_name || 'Buyer'} ${q.timeline ? '· ' + q.timeline : ''}</div>
              ${q.message ? `<div class="text-sm mt-sm" style="color:var(--text);font-style:italic">"${q.message}"</div>` : ''}
              ${q.response_message ? `<div class="text-sm mt-sm" style="color:var(--primary)">Response: "${q.response_message}"</div>` : ''}
              ${!isBuyer && isPending ? `<div style="display:flex;gap:8px;margin-top:10px">
                <button class="btn btn-primary btn-small accept-inq-btn" data-id="${q.id}" style="flex:1;font-size:11px">✅ Accept</button>
                <button class="btn btn-secondary btn-small negotiate-inq-btn" data-id="${q.id}" style="flex:1;font-size:11px">💬 Negotiate</button>
                <button class="btn btn-small reject-inq-btn" data-id="${q.id}" style="flex:1;font-size:11px;background:#FFEBEE;color:#C62828;border:none">❌ Reject</button>
              </div>` : ''}
              ${!isBuyer && isAccepted ? `<button class="btn btn-primary btn-small create-order-btn mt" data-iq="${q.id}" style="width:100%;font-size:12px">📦 Create Order</button>` : ''}
            </div>`;
          }).join('')}
      </div>`;
  }

  function attachEvents() {
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => { tab = btn.dataset.tab; render(); });
    });
    container.querySelector('#searchInput')?.addEventListener('input', e => { search = e.target.value; render(); });
    container.querySelectorAll('.chip[data-crop]').forEach(c => {
      c.addEventListener('click', () => { filterCrop = c.dataset.crop; render(); });
    });
    container.querySelectorAll('.listing-card[data-id]').forEach(c => {
      c.addEventListener('click', () => showListingDetail(c.dataset.id));
    });
    container.querySelector('#createListingBtn')?.addEventListener('click', showCreateListing);
    container.querySelector('#createDeclBtn')?.addEventListener('click', showCreateDeclaration);

    // Edit/delete listings
    container.querySelectorAll('.edit-listing-btn').forEach(b => {
      b.addEventListener('click', () => {
        const l = myListings.find(x => x.id == b.dataset.id);
        if (!l) return;
        showModal(`<div class="modal-handle"></div><h3>Edit Listing</h3>
          <div class="form-group"><label>Quantity (kg)</label><input class="form-input" type="number" id="elQty" value="${l.quantity_kg || ''}"></div>
          <div class="form-group"><label>Price per kg (₹)</label><input class="form-input" type="number" id="elPrice" value="${l.price_per_kg || ''}" step="0.5"></div>
          <div class="form-group"><label>Grade</label><select class="form-input" id="elGrade"><option ${l.grade==='A'?'selected':''}>A</option><option ${l.grade==='B'?'selected':''}>B</option><option ${l.grade==='C'?'selected':''}>C</option></select></div>
          <div class="form-group"><label>Status</label><select class="form-input" id="elStatus"><option value="active" ${l.status==='active'?'selected':''}>Active</option><option value="sold" ${l.status==='sold'?'selected':''}>Sold</option><option value="expired" ${l.status==='expired'?'selected':''}>Expired</option></select></div>
          <div class="form-group"><label>Description</label><textarea class="form-input" id="elDesc" rows="2">${l.description || ''}</textarea></div>
          <button class="btn btn-primary" id="saveEditListing" style="width:100%">Save Changes</button>`);
        document.querySelector('#saveEditListing')?.addEventListener('click', async () => {
          try {
            await api.updateListing(l.id, { quantity_kg: Number(document.querySelector('#elQty').value), price_per_kg: Number(document.querySelector('#elPrice').value), grade: document.querySelector('#elGrade').value, status: document.querySelector('#elStatus').value, description: document.querySelector('#elDesc').value });
            showToast('Listing updated!', 'success'); closeModal(); loadData();
          } catch(e) { showToast(e.message, 'error'); }
        });
      });
    });
    container.querySelectorAll('.delete-listing-btn').forEach(b => {
      b.addEventListener('click', async () => {
        if (!confirm('Delete this listing?')) return;
        try { await api.deleteListing(b.dataset.id); showToast('Listing deleted', 'success'); loadData(); } catch(e) { showToast(e.message, 'error'); }
      });
    });

    // Edit/delete declarations
    container.querySelectorAll('.edit-decl-btn').forEach(b => {
      b.addEventListener('click', () => {
        const d = declarations.find(x => x.id == b.dataset.id);
        if (!d) return;
        showModal(`<div class="modal-handle"></div><h3>Edit Declaration</h3>
          <div class="form-group"><label>Area (acres)</label><input class="form-input" type="number" id="edArea" value="${d.area_acres || ''}"></div>
          <div class="form-group"><label>Expected Yield (kg)</label><input class="form-input" type="number" id="edYield" value="${d.expected_yield || ''}"></div>
          <div class="form-group"><label>Grade</label><select class="form-input" id="edGrade"><option ${d.quality_grade==='A'?'selected':''}>A</option><option ${d.quality_grade==='B'?'selected':''}>B</option><option ${d.quality_grade==='C'?'selected':''}>C</option></select></div>
          <div class="form-group"><label>Harvest Date</label><input class="form-input" type="date" id="edDate" value="${d.expected_harvest_date ? d.expected_harvest_date.split('T')[0] : ''}"></div>
          <div class="form-group"><label>Notes</label><textarea class="form-input" id="edNotes" rows="2">${d.notes || ''}</textarea></div>
          <button class="btn btn-primary" id="saveEditDecl" style="width:100%">Save Changes</button>`);
        document.querySelector('#saveEditDecl')?.addEventListener('click', async () => {
          try {
            await api.updateDeclaration(d.id, { area_acres: Number(document.querySelector('#edArea').value), expected_yield: Number(document.querySelector('#edYield').value), quality_grade: document.querySelector('#edGrade').value, expected_harvest_date: document.querySelector('#edDate').value, notes: document.querySelector('#edNotes').value });
            showToast('Declaration updated!', 'success'); closeModal(); loadData();
          } catch(e) { showToast(e.message, 'error'); }
        });
      });
    });
    container.querySelectorAll('.delete-decl-btn').forEach(b => {
      b.addEventListener('click', async () => {
        if (!confirm('Delete this declaration?')) return;
        try { await api.deleteDeclaration(b.dataset.id); showToast('Declaration deleted', 'success'); loadData(); } catch(e) { showToast(e.message, 'error'); }
      });
    });

    // Inquiry accept/reject/negotiate
    container.querySelectorAll('.accept-inq-btn').forEach(b => {
      b.addEventListener('click', async () => {
        try { await api.respondInquiry(b.dataset.id, { status: 'accepted' }); showToast('Inquiry accepted!', 'success'); loadData(); } catch(e) { showToast(e.message, 'error'); }
      });
    });
    container.querySelectorAll('.reject-inq-btn').forEach(b => {
      b.addEventListener('click', async () => {
        try { await api.respondInquiry(b.dataset.id, { status: 'rejected' }); showToast('Inquiry rejected', 'info'); loadData(); } catch(e) { showToast(e.message, 'error'); }
      });
    });
    container.querySelectorAll('.negotiate-inq-btn').forEach(b => {
      b.addEventListener('click', () => {
        const q = inquiries.find(x => x.id == b.dataset.id);
        showModal(`<div class="modal-handle"></div><h3>💬 Negotiate</h3>
          <div class="form-group"><label>Counter Price (₹/kg)</label><input class="form-input" type="number" id="negPrice" placeholder="Your price"></div>
          <div class="form-group"><label>Message</label><textarea class="form-input" id="negMsg" rows="2" placeholder="Your terms…"></textarea></div>
          <button class="btn btn-primary" id="sendNeg" style="width:100%">Send Counter Offer</button>`);
        document.querySelector('#sendNeg')?.addEventListener('click', async () => {
          try {
            await api.respondInquiry(q.id, { status: 'negotiating', counter_price: Number(document.querySelector('#negPrice').value), response_message: document.querySelector('#negMsg').value });
            showToast('Counter offer sent!', 'success'); closeModal(); loadData();
          } catch(e) { showToast(e.message, 'error'); }
        });
      });
    });

    // Create order from accepted inquiry
    container.querySelectorAll('.create-order-btn').forEach(b => {
      b.addEventListener('click', async () => {
        const q = inquiries.find(x => x.id == b.dataset.iq);
        if (!q) return;
        try {
          await api.createOrder({ inquiry_id: q.id, listing_id: q.listing_id, quantity_kg: q.quantity_needed, total_amount: (q.offered_price || 0) * (q.quantity_needed || 0) });
          showToast('Order created!', 'success'); loadData();
        } catch(e) { showToast(e.message, 'error'); }
      });
    });
    container.querySelector('#addMemberBtn')?.addEventListener('click', () => {
      showModal(`<div class="modal-handle"></div><h3>Add FPO Member</h3>
        <div class="form-group"><label>Farmer Phone</label><input class="form-input" type="tel" id="memberPhone" placeholder="9876543210"></div>
        <div class="form-group"><label>Name</label><input class="form-input" type="text" id="memberName" placeholder="Farmer name"></div>
        <button class="btn btn-primary" id="submitMember">Add Member</button>`);
      document.querySelector('#submitMember')?.addEventListener('click', async () => {
        try {
          await api.addFPOMember({ phone: document.querySelector('#memberPhone')?.value, name: document.querySelector('#memberName')?.value });
          showToast('Member added!', 'success'); closeModal(); loadData();
        } catch (e) { showToast(e.message, 'error'); }
      });
    });
    container.querySelectorAll('.inquiry-btn').forEach(b => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const l = listings.find(x => x.id == b.dataset.lid);
        if (!l) return;
        showModal(`<div class="modal-handle"></div><h3>Send Inquiry — ${l.crop_name}</h3>
          <div class="card" style="box-shadow:none;background:var(--bg);margin-bottom:12px">
            <div class="flex-between mb"><span>Crop</span><span class="fw-600">${l.crop_name}</span></div>
            <div class="flex-between mb"><span>District</span><span>${l.district_name || l.location_label || 'N/A'}</span></div>
            <div class="flex-between"><span>Available</span><span>${Number(l.quantity_kg || 0).toLocaleString()} kg</span></div>
          </div>
          <div class="form-group"><label>Required Quantity (kg)</label><input class="form-input" type="number" id="iqQty" placeholder="1000"></div>
          <div class="form-group"><label>Preferred Price (₹/kg)</label><input class="form-input" type="number" id="iqPrice" placeholder="${l.price_per_kg || ''}"></div>
          <div class="form-group"><label>Message</label><textarea class="form-input" id="iqMsg" rows="3" placeholder="Describe your requirements…"></textarea></div>
          <button class="btn btn-primary" id="submitInquiry">Send Inquiry</button>
          <div class="text-sm text-muted mt" style="text-align:center">🔒 Farmer identity hidden until they accept</div>`);
        document.querySelector('#submitInquiry')?.addEventListener('click', async () => {
          try {
            await api.createInquiry({
              listing_id: l.id,
              quantity_needed: Number(document.querySelector('#iqQty')?.value),
              offered_price: Number(document.querySelector('#iqPrice')?.value),
              message: document.querySelector('#iqMsg')?.value,
            });
            showToast('Inquiry sent!', 'success'); closeModal();
          } catch (e) { showToast(e.message, 'error'); }
        });
      });
    });
    // Buyer: watchlist toggle
    container.querySelectorAll('.watchlist-btn').forEach(b => {
      b.addEventListener('click', async (e) => {
        e.stopPropagation();
        const l = listings.find(x => x.id == b.dataset.lid);
        if (!l) return;
        const isWatching = watchlist.some(w => w.listing_id == l.id || w.crop_id == l.crop_id);
        try {
          if (isWatching) {
            const wItem = watchlist.find(w => w.listing_id == l.id || w.crop_id == l.crop_id);
            if (wItem) await api.removeWatchlist(wItem.id);
            showToast('Removed from watchlist', 'info');
          } else {
            await api.addWatchlist({ crop_id: l.crop_id, listing_id: l.id });
            showToast('Added to watchlist!', 'success');
          }
          loadData();
        } catch(err) { showToast(err.message, 'error'); }
      });
    });
    // FPO: record procurement
    container.querySelector('#recordProcBtn')?.addEventListener('click', () => {
      showModal(`<div class="modal-handle"></div><h3>Record Procurement</h3>
        <div class="form-group"><label>Crop</label><select class="form-input" id="procCrop">${crops.map(c => `<option value="${c.id}">${c.icon_emoji || ''} ${c.name}</option>`).join('')}</select></div>
        <div class="form-group"><label>Farmer Phone</label><input class="form-input" type="tel" id="procFarmer" placeholder="9876543210"></div>
        <div class="form-group"><label>Quantity (kg)</label><input class="form-input" type="number" id="procQty" placeholder="500"></div>
        <div class="form-group"><label>Price per kg (₹)</label><input class="form-input" type="number" id="procPrice" placeholder="25"></div>
        <div class="form-group"><label>Grade</label><select class="form-input" id="procGrade"><option>A</option><option>B</option><option>C</option></select></div>
        <button class="btn btn-primary" id="submitProc">Record</button>`);
      document.querySelector('#submitProc')?.addEventListener('click', async () => {
        try {
          await api.recordProcurement({
            crop_id: Number(document.querySelector('#procCrop')?.value),
            farmer_phone: document.querySelector('#procFarmer')?.value,
            quantity_kg: Number(document.querySelector('#procQty')?.value),
            price_per_kg: Number(document.querySelector('#procPrice')?.value),
            grade: document.querySelector('#procGrade')?.value,
          });
          showToast('Procurement recorded!', 'success'); closeModal(); loadData();
        } catch (e) { showToast(e.message, 'error'); }
      });
    });
    // FPO: publish supply listing
    container.querySelector('#publishSupplyBtn')?.addEventListener('click', () => {
      showModal(`<div class="modal-handle"></div><h3>Publish Supply Listing</h3>
        <div class="form-group"><label>Crop</label><select class="form-input" id="slCrop">${crops.map(c => `<option value="${c.id}">${c.icon_emoji || ''} ${c.name}</option>`).join('')}</select></div>
        <div class="form-group"><label>Quantity (kg)</label><input class="form-input" type="number" id="slQty" placeholder="5000"></div>
        <div class="form-group"><label>Price per kg (₹)</label><input class="form-input" type="number" id="slPrice" placeholder="30"></div>
        <div class="form-group"><label>Available From</label><input class="form-input" type="date" id="slDate"></div>
        <div class="form-group"><label>Description</label><textarea class="form-input" id="slDesc" rows="2" placeholder="FPO aggregated supply…"></textarea></div>
        <button class="btn btn-primary" id="submitSupply">Publish</button>`);
      document.querySelector('#submitSupply')?.addEventListener('click', async () => {
        try {
          await api.createSupplyListing({
            crop_id: Number(document.querySelector('#slCrop')?.value),
            quantity_kg: Number(document.querySelector('#slQty')?.value),
            price_per_kg: Number(document.querySelector('#slPrice')?.value),
            available_from: document.querySelector('#slDate')?.value,
            description: document.querySelector('#slDesc')?.value,
          });
          showToast('Supply listing published!', 'success'); closeModal(); loadData();
        } catch (e) { showToast(e.message, 'error'); }
      });
    });
  }

  function showListingDetail(id) {
    const l = listings.find(x => x.id == id);
    if (!l) return;
    showModal(`
      <div class="modal-handle"></div>
      <h3>${l.icon_emoji || '🌾'} ${l.crop_name}</h3>
      <div class="card" style="box-shadow:none;background:var(--bg)">
        <div class="flex-between mb"><span class="fw-700">Price</span><span class="fw-700" style="color:var(--primary)">₹${Number(l.price_per_kg || 0).toFixed(2)}/kg</span></div>
        <div class="flex-between mb"><span>Quantity</span><span>${Number(l.quantity_kg || 0).toLocaleString()} kg</span></div>
        <div class="flex-between mb"><span>Grade</span><span>${l.grade || 'A'}</span></div>
        <div class="flex-between mb"><span>Organic</span><span>${l.is_organic ? '✅ Yes' : '❌ No'}</span></div>
        <div class="flex-between mb"><span>Seller</span><span>${l.farmer_name || 'N/A'}</span></div>
        <div class="flex-between mb"><span>Location</span><span>${l.location_label || l.district_name || 'N/A'}</span></div>
        <div class="flex-between"><span>Min Order</span><span>${l.min_order_kg || 0} kg</span></div>
      </div>
      ${l.description ? `<p class="text-sm text-muted mt">${l.description}</p>` : ''}
      <div class="form-group mt-lg">
        <label>Quantity Needed (kg)</label>
        <input class="form-input" type="number" id="inqQty" placeholder="500" min="1">
      </div>
      <div class="form-group">
        <label>Message (optional)</label>
        <textarea class="form-input" id="inqMsg" placeholder="I need fresh produce for my store…"></textarea>
      </div>
      <button class="btn btn-primary" id="sendInquiry">Send Inquiry</button>
    `);
    document.querySelector('#sendInquiry')?.addEventListener('click', async () => {
      const qty = document.querySelector('#inqQty')?.value;
      const msg = document.querySelector('#inqMsg')?.value;
      if (!qty) { showToast('Enter quantity', 'error'); return; }
      try {
        await api.createInquiry({ listing_id: l.id, quantity_needed: Number(qty), message: msg });
        showToast('Inquiry sent!', 'success');
        closeModal();
      } catch (e) { showToast(e.message, 'error'); }
    });
  }

  function showCreateListing() {
    showModal(`
      <div class="modal-handle"></div>
      <h3>Create Listing</h3>
      <div class="form-group"><label>Crop</label><select class="form-input" id="clCrop">${crops.map(c => `<option value="${c.id}">${c.icon_emoji || ''} ${c.name}</option>`).join('')}</select></div>
      <div class="form-group"><label>District</label><select class="form-input" id="clDist"><option value="">Auto-detect</option>${districts.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}</select></div>
      <div class="form-group"><label>Quantity (kg)</label><input class="form-input" type="number" id="clQty" placeholder="1000"></div>
      <div class="form-group"><label>Price per kg (₹)</label><input class="form-input" type="number" id="clPrice" placeholder="25" step="0.5"></div>
      <div class="form-group"><label>Min Order (kg)</label><input class="form-input" type="number" id="clMin" placeholder="100"></div>
      <div class="form-group"><label>Grade</label><select class="form-input" id="clGrade"><option>A</option><option>B</option><option>C</option></select></div>
      <div class="form-group"><label>Organic?</label><select class="form-input" id="clOrganic"><option value="false">No</option><option value="true">Yes - Certified Organic</option></select></div>
      <div class="form-group"><label>Location Label</label><input class="form-input" type="text" id="clLoc" placeholder="Near Guntur Mandi, AP"></div>
      <div class="form-group"><label>Description</label><textarea class="form-input" id="clDesc" placeholder="Fresh produce from our farm…"></textarea></div>
      <button class="btn btn-primary" id="submitListing">Create Listing</button>
    `);
    document.querySelector('#submitListing')?.addEventListener('click', async () => {
      try {
        await api.createListing({
          crop_id: Number(document.querySelector('#clCrop')?.value),
          district_id: document.querySelector('#clDist')?.value ? Number(document.querySelector('#clDist')?.value) : undefined,
          quantity_kg: Number(document.querySelector('#clQty')?.value),
          price_per_kg: Number(document.querySelector('#clPrice')?.value),
          min_order_kg: Number(document.querySelector('#clMin')?.value) || undefined,
          grade: document.querySelector('#clGrade')?.value,
          is_organic: document.querySelector('#clOrganic')?.value === 'true',
          location_label: document.querySelector('#clLoc')?.value || undefined,
          description: document.querySelector('#clDesc')?.value,
        });
        showToast('Listing created!', 'success');
        closeModal(); loadData();
      } catch (e) { showToast(e.message, 'error'); }
    });
  }

  function showCreateDeclaration() {
    showModal(`
      <div class="modal-handle"></div>
      <h3>New Crop Declaration</h3>
      <div class="form-group"><label>Crop</label><select class="form-input" id="cdCrop">${crops.map(c => `<option value="${c.id}">${c.icon_emoji || ''} ${c.name}</option>`).join('')}</select></div>
      <div class="form-group"><label>District</label><select class="form-input" id="cdDist"><option value="">Select district</option>${districts.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}</select></div>
      <div class="form-group"><label>Area (acres)</label><input class="form-input" type="number" id="cdArea" placeholder="5" step="0.5"></div>
      <div class="form-group"><label>Expected Yield (kg)</label><input class="form-input" type="number" id="cdYield" placeholder="5000"></div>
      <div class="form-group"><label>Quality Grade</label><select class="form-input" id="cdGrade"><option>A</option><option>B</option><option>C</option></select></div>
      <div class="form-group"><label>Organic?</label><select class="form-input" id="cdOrganic"><option value="false">No</option><option value="true">Yes</option></select></div>
      <div class="form-group"><label>Sow Date</label><input class="form-input" type="date" id="cdSow"></div>
      <div class="form-group"><label>Expected Harvest Date</label><input class="form-input" type="date" id="cdHarvest"></div>
      <div class="form-group"><label>Notes</label><textarea class="form-input" id="cdNotes" rows="2" placeholder="Soil type, irrigation method…"></textarea></div>
      <button class="btn btn-primary" id="submitDecl">Create Declaration</button>
    `);
    document.querySelector('#submitDecl')?.addEventListener('click', async () => {
      try {
        await api.createDeclaration({
          crop_id: Number(document.querySelector('#cdCrop')?.value),
          district_id: document.querySelector('#cdDist')?.value ? Number(document.querySelector('#cdDist')?.value) : undefined,
          area_acres: Number(document.querySelector('#cdArea')?.value),
          expected_yield: Number(document.querySelector('#cdYield')?.value) || undefined,
          quality_grade: document.querySelector('#cdGrade')?.value,
          is_organic: document.querySelector('#cdOrganic')?.value === 'true',
          sow_date: document.querySelector('#cdSow')?.value,
          expected_harvest_date: document.querySelector('#cdHarvest')?.value,
          notes: document.querySelector('#cdNotes')?.value || undefined,
        });
        showToast('Declaration created!', 'success');
        closeModal(); loadData();
      } catch (e) { showToast(e.message, 'error'); }
    });
  }

  async function loadData() {
    loading = true; render();
    try {
      const [listRes, cropRes, distRes] = await Promise.all([
        isBuyer ? api.supplySearch().catch(() => api.getListings('?limit=30')) : api.getListings('?limit=30'),
        api.getCrops(),
        api.getDistricts().catch(() => [])
      ]);
      listings = Array.isArray(listRes) ? listRes : (listRes.listings || listRes.results || []);
      crops = Array.isArray(cropRes) ? cropRes : (cropRes.crops || []);
      districts = Array.isArray(distRes) ? distRes : (distRes.districts || []);
    } catch (e) { console.error(e); }

    try {
      if (isBuyer) {
        const wl = await api.getWatchlist().catch(() => []);
        watchlist = Array.isArray(wl) ? wl : (wl.watchlist || []);
      }
      if (isFPO) {
        const [memRes, invRes, stRes] = await Promise.all([
          api.getFPOMembers().catch(() => []),
          api.getFPOInventory().catch(() => []),
          api.getFPOStats().catch(() => ({})),
        ]);
        fpoMembers = Array.isArray(memRes) ? memRes : (memRes.members || []);
        fpoInventory = Array.isArray(invRes) ? invRes : (invRes.inventory || []);
        fpoStats = stRes?.stats || stRes || {};
      }
      const [ml, dl, iq] = await Promise.all([
        (isFPO ? api.getFPOSupplyListings() : api.getMyListings()).catch(() => []),
        api.getDeclarations().catch(() => []),
        (isBuyer ? api.getBuyerInquiries() : api.getInquiries()).catch(() => []),
      ]);
      myListings = Array.isArray(ml) ? ml : (ml.listings || ml.supply_listings || []);
      declarations = Array.isArray(dl) ? dl : (dl.declarations || []);
      inquiries = Array.isArray(iq) ? iq : (iq.inquiries || []);
    } catch (e) { console.error(e); }

    loading = false; render();
  }

  loadData();
}

function fmtDate(d) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
