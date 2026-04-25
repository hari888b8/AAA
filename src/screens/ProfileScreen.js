import { api } from '../api.js';
import { getState, logout as logoutStore } from '../store.js';
import { navigate, showToast, showModal, closeModal } from '../main.js';

export function renderProfile(container) {
  const user = getState().user || {};
  const role = user.role || 'farmer';

  container.innerHTML = `
    <div class="profile-hero">
      <div class="profile-avatar">${(user.name || 'U')[0].toUpperCase()}</div>
      <div class="ph-name">${user.name || 'User'}</div>
      <div class="ph-phone">+91 ${user.phone || ''}</div>
      <div class="ph-role">${role}</div>
    </div>

    <div style="padding:8px 0">
      <div class="menu-item" data-nav="orders">
        <div class="mi-icon" style="background:var(--accent-light)">📦</div>
        <div class="mi-text"><div class="mi-title">My Orders</div><div class="mi-sub">Track your purchases</div></div>
        <span class="mi-arrow">›</span>
      </div>
      <div class="menu-item" data-nav="notifications">
        <div class="mi-icon" style="background:var(--info-bg)">🔔</div>
        <div class="mi-text"><div class="mi-title">Notifications</div><div class="mi-sub">Alerts & updates</div></div>
        <span class="mi-arrow">›</span>
      </div>
      <div class="menu-item" data-nav="community">
        <div class="mi-icon" style="background:var(--success-bg)">💬</div>
        <div class="mi-text"><div class="mi-title">Community</div><div class="mi-sub">Discussions & tips</div></div>
        <span class="mi-arrow">›</span>
      </div>
      <div class="menu-item" data-nav="weather">
        <div class="mi-icon" style="background:#E0F7FA">🌤️</div>
        <div class="mi-text"><div class="mi-title">Weather</div><div class="mi-sub">Forecast & advisories</div></div>
        <span class="mi-arrow">›</span>
      </div>
    </div>

    <div style="padding:12px 0">
      <div class="menu-item" id="editNameBtn">
        <div class="mi-icon" style="background:var(--primary-surface)">✏️</div>
        <div class="mi-text"><div class="mi-title">Edit Name</div><div class="mi-sub">${user.name || 'Update your name'}</div></div>
        <span class="mi-arrow">›</span>
      </div>
      ${role === 'farmer' ? `
        <div class="menu-item" id="editProfileBtn">
          <div class="mi-icon" style="background:#E8F5E9">🌾</div>
          <div class="mi-text"><div class="mi-title">Farm Profile</div><div class="mi-sub">District, land, irrigation, soil type</div></div>
          <span class="mi-arrow">›</span>
        </div>
      ` : ''}
      ${role === 'fpo' ? `
        <div class="menu-item" id="fpoProfileBtn">
          <div class="mi-icon" style="background:#E8F5E9">🏢</div>
          <div class="mi-text"><div class="mi-title">FPO Profile</div><div class="mi-sub">Organization, members, registration</div></div>
          <span class="mi-arrow">›</span>
        </div>
      ` : ''}
      ${role === 'buyer' ? `
        <div class="menu-item" id="buyerProfileBtn">
          <div class="mi-icon" style="background:#E3F2FD">🏪</div>
          <div class="mi-text"><div class="mi-title">Business Profile</div><div class="mi-sub">Company, GST, preferences</div></div>
          <span class="mi-arrow">›</span>
        </div>
      ` : ''}
      <div class="menu-item" id="kycBtn">
        <div class="mi-icon" style="background:#FFF3E0">🪪</div>
        <div class="mi-text"><div class="mi-title">KYC Verification</div><div class="mi-sub">${user.is_verified ? '✅ Verified' : '⏳ Complete your KYC'}</div></div>
        <span class="mi-arrow">›</span>
      </div>
      <div class="menu-item" id="notifPrefsBtn">
        <div class="mi-icon" style="background:#F3E5F5">⚙️</div>
        <div class="mi-text"><div class="mi-title">Notification Preferences</div><div class="mi-sub">Price alerts, weather, orders</div></div>
        <span class="mi-arrow">›</span>
      </div>
    </div>

    <div style="padding:12px 0">
      <div class="menu-item" id="exportDataBtn">
        <div class="mi-icon" style="background:#E3F2FD">📥</div>
        <div class="mi-text"><div class="mi-title">Export My Data</div><div class="mi-sub">DPDP Act 2023 compliance</div></div>
        <span class="mi-arrow">›</span>
      </div>
      <div class="menu-item" data-nav="architecture">
        <div class="mi-icon" style="background:#E8EAF6">🏗️</div>
        <div class="mi-text"><div class="mi-title">Architecture</div><div class="mi-sub">System design & blueprint</div></div>
        <span class="mi-arrow">›</span>
      </div>
    </div>

    <div style="padding:16px">
      <button class="btn btn-danger" id="logoutBtn">🚪 Logout</button>
    </div>

    <div style="text-align:center;padding:20px;color:var(--text3);font-size:12px">
      AgriHub v1.0.0 · 500+ Features · 5 Integrated Apps<br>
      🌾 AgriFlow · 🐟 AquaOS · 🚜 KisanConnect · 🏡 FarmerConnect · 📊 Intelligence<br>
      Made with ❤️ for Indian Farmers
    </div>
  `;

  container.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => navigate(el.dataset.nav));
  });

  container.querySelector('#editNameBtn')?.addEventListener('click', () => {
    showModal(`
      <div class="modal-handle"></div>
      <h3>Edit Name</h3>
      <div class="form-group"><label>Your Name</label><input class="form-input" type="text" id="editName" value="${user.name || ''}" placeholder="Enter name"></div>
      <button class="btn btn-primary" id="saveName">Save</button>
    `);
    document.querySelector('#saveName')?.addEventListener('click', async () => {
      const name = document.querySelector('#editName')?.value?.trim();
      if (!name) { showToast('Enter a name', 'error'); return; }
      try {
        await api.updateMe({ name });
        const updated = { ...user, name };
        localStorage.setItem('agrihub_user', JSON.stringify(updated));
        (await import('../store.js')).setState({ user: updated });
        showToast('Name updated!', 'success');
        closeModal();
        renderProfile(container);
      } catch (e) { showToast(e.message, 'error'); }
    });
  });

  container.querySelector('#editProfileBtn')?.addEventListener('click', async () => {
    let farmProfile = {}, districts = [];
    try { const res = await api.getFarmerProfile(); farmProfile = res?.profile || res || {}; } catch(e) {}
    try { const d = await api.getDistricts(); districts = Array.isArray(d) ? d : (d.districts || []); } catch(e) {}
    showModal(`
      <div class="modal-handle"></div>
      <h3>🌾 Farm Profile</h3>
      <div class="form-group"><label>State</label><input class="form-input" id="fpState" value="${farmProfile.state || ''}" placeholder="e.g. Maharashtra"></div>
      <div class="form-group"><label>District</label>
        <select class="form-input" id="fpDistrict">
          <option value="">Select District</option>
          ${districts.map(d => `<option value="${d.name}" ${(farmProfile.district_name || '') === d.name ? 'selected' : ''}>${d.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Village/Mandal</label><input class="form-input" id="fpVillage" value="${farmProfile.village || ''}" placeholder="e.g. Ozar"></div>
      <div class="form-group"><label>Land Area (acres)</label><input class="form-input" type="number" id="fpLand" value="${farmProfile.total_land_acres || ''}" placeholder="e.g. 5"></div>
      <div class="form-group"><label>Irrigation Type</label>
        <select class="form-input" id="fpIrrigation">
          <option value="">Select</option>
          ${['Drip','Sprinkler','Flood','Rainfed','Canal','Borewell'].map(t=>`<option value="${t}" ${(farmProfile.irrigation_type||[]).includes(t)?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Soil Type</label>
        <select class="form-input" id="fpSoil">
          <option value="">Select</option>
          ${['Black Cotton','Red','Alluvial','Laterite','Sandy','Clay','Loamy'].map(t=>`<option value="${t}" ${(farmProfile.soil_type||[]).includes(t)?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Primary Crops</label><input class="form-input" id="fpCrops" value="${(farmProfile.primary_crops || []).join(', ')}" placeholder="e.g. Wheat, Rice, Cotton"></div>
      <div class="form-group"><label>Farming Method</label>
        <select class="form-input" id="fpMethod">
          ${['conventional','organic','natural','mixed'].map(t=>`<option value="${t}" ${farmProfile.farming_method===t?'selected':''}>${t.charAt(0).toUpperCase()+t.slice(1)}</option>`).join('')}
        </select>
      </div>
      <button class="btn btn-primary" id="saveFarmProfile" style="width:100%">Save Farm Profile</button>
    `);
    document.querySelector('#saveFarmProfile')?.addEventListener('click', async () => {
      const irrigation = document.querySelector('#fpIrrigation')?.value;
      const soil = document.querySelector('#fpSoil')?.value;
      const crops = document.querySelector('#fpCrops')?.value?.split(',').map(s=>s.trim()).filter(Boolean);
      const data = {
        state: document.querySelector('#fpState')?.value?.trim() || undefined,
        district_name: document.querySelector('#fpDistrict')?.value || undefined,
        village: document.querySelector('#fpVillage')?.value?.trim() || undefined,
        total_land_acres: parseFloat(document.querySelector('#fpLand')?.value) || null,
        irrigation_type: irrigation ? [irrigation] : [],
        soil_type: soil ? [soil] : [],
        primary_crops: crops || [],
        farming_method: document.querySelector('#fpMethod')?.value || 'conventional',
      };
      try {
        await api.updateFarmerProfile(data);
        showToast('Farm profile saved!', 'success');
        closeModal();
      } catch(e) { showToast(e.message, 'error'); }
    });
  });

  container.querySelector('#fpoProfileBtn')?.addEventListener('click', async () => {
    let fpoProfile = {};
    try { const res = await api.getFPOProfile(); fpoProfile = res?.profile || res || {}; } catch(e) {}
    showModal(`
      <div class="modal-handle"></div>
      <h3>🏢 FPO Profile</h3>
      <div class="form-group"><label>Organization Name</label><input class="form-input" id="fpoName" value="${fpoProfile.organization_name || ''}" placeholder="Farmers Producer Organization"></div>
      <div class="form-group"><label>Registration Number</label><input class="form-input" id="fpoRegNo" value="${fpoProfile.registration_number || ''}" placeholder="FPO/REG/2024/XXXX"></div>
      <div class="form-group"><label>Total Members</label><input class="form-input" type="number" id="fpoMembers" value="${fpoProfile.total_members || ''}" placeholder="500"></div>
      <div class="form-group"><label>State</label><input class="form-input" id="fpoState" value="${fpoProfile.state || ''}" placeholder="Maharashtra"></div>
      <div class="form-group"><label>District</label><input class="form-input" id="fpoDistrict" value="${fpoProfile.district_name || ''}" placeholder="Nashik"></div>
      <div class="form-group"><label>Commodities Handled</label><input class="form-input" id="fpoCommodities" value="${(fpoProfile.commodities || []).join(', ')}" placeholder="Wheat, Rice, Cotton"></div>
      <div class="form-group"><label>Storage Capacity (MT)</label><input class="form-input" type="number" id="fpoStorage" value="${fpoProfile.storage_capacity_mt || ''}" placeholder="100"></div>
      <div class="form-group"><label>Contact Email</label><input class="form-input" type="email" id="fpoEmail" value="${fpoProfile.email || ''}" placeholder="fpo@example.com"></div>
      <div class="form-group"><label>About</label><textarea class="form-input" id="fpoAbout" rows="2">${fpoProfile.description || ''}</textarea></div>
      <button class="btn btn-primary" id="saveFPOProfile" style="width:100%">Save FPO Profile</button>
    `);
    document.querySelector('#saveFPOProfile')?.addEventListener('click', async () => {
      try {
        await api.updateFPOProfile({
          organization_name: document.querySelector('#fpoName')?.value?.trim(),
          registration_number: document.querySelector('#fpoRegNo')?.value?.trim(),
          total_members: Number(document.querySelector('#fpoMembers')?.value) || undefined,
          state: document.querySelector('#fpoState')?.value?.trim(),
          district_name: document.querySelector('#fpoDistrict')?.value?.trim(),
          commodities: document.querySelector('#fpoCommodities')?.value?.split(',').map(s => s.trim()).filter(Boolean),
          storage_capacity_mt: Number(document.querySelector('#fpoStorage')?.value) || undefined,
          email: document.querySelector('#fpoEmail')?.value?.trim(),
          description: document.querySelector('#fpoAbout')?.value?.trim(),
        });
        showToast('FPO profile saved!', 'success'); closeModal();
      } catch(e) { showToast(e.message, 'error'); }
    });
  });

  container.querySelector('#buyerProfileBtn')?.addEventListener('click', async () => {
    let buyerProfile = {};
    try { const res = await api.getBuyerProfile(); buyerProfile = res?.profile || res || {}; } catch(e) {}
    showModal(`
      <div class="modal-handle"></div>
      <h3>🏪 Business Profile</h3>
      <div class="form-group"><label>Company Name</label><input class="form-input" id="bpCompany" value="${buyerProfile.company_name || ''}" placeholder="ABC Trading Co."></div>
      <div class="form-group"><label>Business Type</label>
        <select class="form-input" id="bpType">
          <option value="">Select</option>
          ${['Wholesaler','Retailer','Processor','Exporter','Restaurant/Hotel','Institutional'].map(t => `<option value="${t}" ${buyerProfile.business_type === t ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>GST Number</label><input class="form-input" id="bpGst" value="${buyerProfile.gst_number || ''}" placeholder="22AAAAA0000A1Z5" style="text-transform:uppercase"></div>
      <div class="form-group"><label>FSSAI License</label><input class="form-input" id="bpFssai" value="${buyerProfile.fssai_license || ''}" placeholder="14-digit FSSAI number"></div>
      <div class="form-group"><label>Commodities of Interest</label><input class="form-input" id="bpCommodities" value="${(buyerProfile.commodities || []).join(', ')}" placeholder="Rice, Wheat, Pulses"></div>
      <div class="form-group"><label>Monthly Requirement (MT)</label><input class="form-input" type="number" id="bpVolume" value="${buyerProfile.monthly_volume_mt || ''}" placeholder="50"></div>
      <div class="form-group"><label>Operating Districts</label><input class="form-input" id="bpDistricts" value="${(buyerProfile.operating_districts || []).join(', ')}" placeholder="Nashik, Pune, Mumbai"></div>
      <div class="form-group"><label>Address</label><textarea class="form-input" id="bpAddr" rows="2">${buyerProfile.address || ''}</textarea></div>
      <button class="btn btn-primary" id="saveBuyerProfile" style="width:100%">Save Business Profile</button>
    `);
    document.querySelector('#saveBuyerProfile')?.addEventListener('click', async () => {
      try {
        await api.updateBuyerProfile({
          company_name: document.querySelector('#bpCompany')?.value?.trim(),
          business_type: document.querySelector('#bpType')?.value,
          gst_number: document.querySelector('#bpGst')?.value?.trim().toUpperCase(),
          fssai_license: document.querySelector('#bpFssai')?.value?.trim(),
          commodities: document.querySelector('#bpCommodities')?.value?.split(',').map(s => s.trim()).filter(Boolean),
          monthly_volume_mt: Number(document.querySelector('#bpVolume')?.value) || undefined,
          operating_districts: document.querySelector('#bpDistricts')?.value?.split(',').map(s => s.trim()).filter(Boolean),
          address: document.querySelector('#bpAddr')?.value?.trim(),
        });
        showToast('Business profile saved!', 'success'); closeModal();
      } catch(e) { showToast(e.message, 'error'); }
    });
  });

  container.querySelector('#notifPrefsBtn')?.addEventListener('click', () => {
    const prefs = JSON.parse(localStorage.getItem('agrihub_notif_prefs') || '{}');
    showModal(`
      <div class="modal-handle"></div>
      <h3>⚙️ Notification Preferences</h3>
      <div style="display:flex;flex-direction:column;gap:12px">
        ${[
          { key: 'price_alerts', label: '💰 Price Alerts', desc: 'Get notified when crop prices change significantly' },
          { key: 'weather_alerts', label: '🌤️ Weather Alerts', desc: 'Severe weather warnings and advisories' },
          { key: 'order_updates', label: '📦 Order Updates', desc: 'Status changes on your orders' },
          { key: 'inquiry_alerts', label: '📩 Inquiry Alerts', desc: 'New inquiries on your listings' },
          { key: 'community_updates', label: '💬 Community Updates', desc: 'Replies and mentions' },
          { key: 'harvest_reminders', label: '🌾 Harvest Reminders', desc: 'Upcoming harvest date notifications' },
        ].map(n => `
          <div style="display:flex;align-items:center;gap:12px;padding:8px;border-bottom:1px solid var(--border)">
            <div style="flex:1">
              <div class="fw-600 text-sm">${n.label}</div>
              <div class="text-sm text-muted">${n.desc}</div>
            </div>
            <label style="position:relative;width:44px;height:24px;flex-shrink:0">
              <input type="checkbox" class="notif-toggle" data-key="${n.key}" ${prefs[n.key] !== false ? 'checked' : ''} style="opacity:0;width:0;height:0">
              <span style="position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:${prefs[n.key] !== false ? 'var(--primary)' : '#ccc'};border-radius:12px;transition:.2s"></span>
              <span style="position:absolute;content:'';height:20px;width:20px;left:${prefs[n.key] !== false ? '22px' : '2px'};bottom:2px;background:white;border-radius:50%;transition:.2s"></span>
            </label>
          </div>
        `).join('')}
      </div>
      <button class="btn btn-primary mt-lg" id="saveNotifPrefs" style="width:100%">Save Preferences</button>
    `);
    document.querySelector('#saveNotifPrefs')?.addEventListener('click', () => {
      const newPrefs = {};
      document.querySelectorAll('.notif-toggle').forEach(t => { newPrefs[t.dataset.key] = t.checked; });
      localStorage.setItem('agrihub_notif_prefs', JSON.stringify(newPrefs));
      showToast('Preferences saved!', 'success'); closeModal();
    });
  });

  container.querySelector('#kycBtn')?.addEventListener('click', () => {
    showModal(`
      <div class="modal-handle"></div>
      <h3>🪪 KYC Verification</h3>
      <p style="color:var(--text2);font-size:13px;margin-bottom:16px">Complete your KYC to unlock premium features, higher trade limits, and verified seller badge.</p>
      <div class="form-group"><label>Aadhaar Number</label><input class="form-input" id="kycAadhaar" placeholder="XXXX XXXX XXXX" maxlength="14"></div>
      <div class="form-group"><label>PAN Number (optional)</label><input class="form-input" id="kycPan" placeholder="ABCDE1234F" maxlength="10" style="text-transform:uppercase"></div>
      <div class="form-group"><label>Bank Account (for payouts)</label><input class="form-input" id="kycBank" placeholder="Account number"></div>
      <div class="form-group"><label>IFSC Code</label><input class="form-input" id="kycIfsc" placeholder="e.g. SBIN0001234" style="text-transform:uppercase"></div>
      <button class="btn btn-primary" id="submitKyc" style="width:100%">Submit for Verification</button>
    `);
    document.querySelector('#submitKyc')?.addEventListener('click', async () => {
      const aadhaar = document.querySelector('#kycAadhaar')?.value?.replace(/\s/g,'');
      if (!aadhaar || aadhaar.length !== 12) { showToast('Enter valid 12-digit Aadhaar', 'error'); return; }
      try {
        await api.updateMe({ aadhaar_last4: aadhaar.slice(-4), kyc_submitted: true });
        showToast('KYC submitted for verification!', 'success');
        closeModal();
      } catch(e) { showToast(e.message, 'error'); }
    });
  });

  container.querySelector('#exportDataBtn')?.addEventListener('click', async () => {
    showToast('Preparing data export...', 'info');
    try {
      const [profile, listings, inquiries] = await Promise.allSettled([
        api.getFarmerProfile(), api.getMyListings(), api.getMyInquiries()
      ]);
      const exportData = {
        exported_at: new Date().toISOString(),
        profile: profile.value || {},
        listings: listings.value || [],
        inquiries: inquiries.value || []
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `agrihub_data_${Date.now()}.json`;
      a.click(); URL.revokeObjectURL(url);
      showToast('Data exported successfully!', 'success');
    } catch(e) { showToast(e.message, 'error'); }
  });

  container.querySelector('#logoutBtn')?.addEventListener('click', async () => {
    await api.logout();
    api.setToken(null);
    logoutStore();
    navigate('login');
  });
}
