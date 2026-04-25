import { api } from '../api.js';
import { getState, logout as logoutStore } from '../store.js';
import { navigate, showToast, showModal, closeModal } from '../main.js';

export function renderProfile(container) {
  const user = getState().user || {};

  container.innerHTML = `
    <div class="profile-hero">
      <div class="profile-avatar">${(user.name || 'U')[0].toUpperCase()}</div>
      <div class="ph-name">${user.name || 'User'}</div>
      <div class="ph-phone">+91 ${user.phone || ''}</div>
      <div class="ph-role">${user.role || 'farmer'}</div>
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
      <div class="menu-item" id="editProfileBtn">
        <div class="mi-icon" style="background:#E8F5E9">🌾</div>
        <div class="mi-text"><div class="mi-title">Farm Profile</div><div class="mi-sub">District, land, irrigation, soil type</div></div>
        <span class="mi-arrow">›</span>
      </div>
      <div class="menu-item" id="kycBtn">
        <div class="mi-icon" style="background:#FFF3E0">🪪</div>
        <div class="mi-text"><div class="mi-title">KYC Verification</div><div class="mi-sub">${user.is_verified ? '✅ Verified' : '⏳ Complete your KYC'}</div></div>
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
      AgriHub v1.0.0 · Made with ❤️ for Indian Farmers
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
    let farmProfile = {};
    try { const res = await api.getFarmerProfile(); farmProfile = res?.profile || res || {}; } catch(e) {}
    showModal(`
      <div class="modal-handle"></div>
      <h3>🌾 Farm Profile</h3>
      <div class="form-group"><label>State</label><input class="form-input" id="fpState" value="${farmProfile.state || ''}" placeholder="e.g. Maharashtra"></div>
      <div class="form-group"><label>District</label><input class="form-input" id="fpDistrict" value="${farmProfile.district_name || ''}" placeholder="e.g. Nashik"></div>
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
