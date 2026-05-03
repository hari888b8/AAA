import { api } from '../api.js';
import { getState, logout as logoutStore, getRole } from '../store.js';
import { navigate, showToast, showModal, closeModal } from '../app-shell.js';
import { t, getLang, setLang, LANGUAGES } from '../i18n.js';
import { getMyLocation } from '../integrations/maps.js';

export function renderProfile(container) {
  const user = getState().user || {};
  const role = user.role || 'farmer';

  const ROLE_META = {
    farmer:           { icon: '👨‍🌾', color: '#4CAF50', label: 'Farmer',          tagline: 'India\'s Agriculture Network' },
    fpo:              { icon: '🏢', color: '#2196F3', label: 'FPO Admin',        tagline: 'FPO Management Platform' },
    buyer:            { icon: '🛒', color: '#FF9800', label: 'Buyer',            tagline: 'Buyer Intelligence App' },
    supplier:         { icon: '🏭', color: '#9C27B0', label: 'Input Supplier',   tagline: 'AquaOS Input Marketplace' },
    service_provider: { icon: '🔧', color: '#607D8B', label: 'Service Provider', tagline: 'AgriHub Services' },
  };
  const rm = ROLE_META[role] || ROLE_META.farmer;

  container.innerHTML = `
    <div class="hero-v2 profile-hero" style="background:linear-gradient(135deg,${rm.color},${role==='buyer'?'#F44336':role==='fpo'?'#9C27B0':role==='supplier'?'#E91E63':'#00c9a7'})" role="banner">
      <div style="text-align:center">
        <div class="profile-avatar" style="background:rgba(255,255,255,0.25);color:white;font-size:28px;width:70px;height:70px;margin:0 auto 10px" aria-hidden="true">${rm.icon}</div>
        <h1 class="ph-name" style="margin:0">${user.name || 'User'}</h1>
        <div class="ph-phone">+91 ${user.phone || ''}</div>
        <div class="ph-role" style="background:rgba(255,255,255,0.2)">${rm.icon} ${rm.label}</div>
        <div style="font-size:11px;opacity:0.8;margin-top:4px">${rm.tagline}</div>
      </div>
      <div class="hero-stats" role="list" style="margin-top:12px">
        <div class="hero-stat-card" role="listitem"><div class="v">${role==='fpo'?'387':'12'}</div><div class="l">${role==='fpo'?'Members':'Listings'}</div></div>
        <div class="hero-stat-card" role="listitem"><div class="v">${role==='buyer'?'156':'8'}</div><div class="l">${role==='buyer'?'Sourced':'Orders'}</div></div>
        <div class="hero-stat-card" role="listitem"><div class="v">80%</div><div class="l">Profile</div></div>
      </div>
    </div>

    <!-- ONBOARDING CTA -->
    <div id="onboardingCta" style="display:none;padding:12px 16px">
      <button id="startOnboardingBtn" style="width:100%;padding:14px;background:linear-gradient(135deg,#FF6F00,#FF9800);color:white;border:none;border-radius:12px;font-weight:700;font-size:14px;cursor:pointer;box-shadow:0 4px 12px rgba(255,111,0,0.3)">
        🌾 Complete Your Profile — Get Better Prices & Advisories
      </button>
    </div>

    <!-- ROLE-SPECIFIC PROFILE SETTINGS -->
    <div id="roleProfileSection" style="padding:8px 0"></div>

    <!-- PLATFORM ACCESS -->
    <nav style="padding:8px 0" aria-label="Navigation">
      <div style="padding:8px 16px;font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px" aria-hidden="true">Platform Access</div>
      ${role === 'farmer' ? `
        <div class="menu-item" data-nav="intelligence"><div class="mi-icon" style="background:#E8F5E9">📊</div><div class="mi-text"><div class="mi-title">My Dashboard</div><div class="mi-sub">Declarations, Harvests, Inquiries</div></div><span class="mi-arrow">›</span></div>
        <div class="menu-item" data-nav="agriflow"><div class="mi-icon" style="background:#EDE7F6">🌾</div><div class="mi-text"><div class="mi-title">AgriFlow</div><div class="mi-sub">Supply Intelligence</div></div><span class="mi-arrow">›</span></div>
        <div class="menu-item" data-nav="aquaos"><div class="mi-icon" style="background:#E3F2FD">🐟</div><div class="mi-text"><div class="mi-title">AquaOS</div><div class="mi-sub">Aquaculture Farm OS</div></div><span class="mi-arrow">›</span></div>
        <div class="menu-item" data-nav="kisan"><div class="mi-icon" style="background:#FFF3E0">🚜</div><div class="mi-text"><div class="mi-title">KisanConnect</div><div class="mi-sub">Rural Super-App</div></div><span class="mi-arrow">›</span></div>
      ` : role === 'fpo' ? `
        <div class="menu-item" data-nav="intelligence"><div class="mi-icon" style="background:#E3F2FD">📊</div><div class="mi-text"><div class="mi-title">FPO Dashboard</div><div class="mi-sub">Members, Procurement, Inventory</div></div><span class="mi-arrow">›</span></div>
        <div class="menu-item" data-nav="agriflow"><div class="mi-icon" style="background:#E8F5E9">🌾</div><div class="mi-text"><div class="mi-title">Supply Listings</div><div class="mi-sub">Publish aggregated supply</div></div><span class="mi-arrow">›</span></div>
        <div class="menu-item" data-nav="kisan"><div class="mi-icon" style="background:#FFF3E0">🚜</div><div class="mi-text"><div class="mi-title">KisanConnect</div><div class="mi-sub">Marketplace</div></div><span class="mi-arrow">›</span></div>
      ` : role === 'buyer' ? `
        <div class="menu-item" data-nav="intelligence"><div class="mi-icon" style="background:#FFF3E0">🔍</div><div class="mi-text"><div class="mi-title">Supply Search</div><div class="mi-sub">Search nationwide crop supply</div></div><span class="mi-arrow">›</span></div>
        <div class="menu-item" data-nav="aquaos"><div class="mi-icon" style="background:#E3F2FD">🐟</div><div class="mi-text"><div class="mi-title">AquaOS Marketplace</div><div class="mi-sub">Aquaculture harvest listings</div></div><span class="mi-arrow">›</span></div>
        <div class="menu-item" data-nav="kisan"><div class="mi-icon" style="background:#EDE7F6">🚜</div><div class="mi-text"><div class="mi-title">KisanConnect</div><div class="mi-sub">Crop Marketplace</div></div><span class="mi-arrow">›</span></div>
      ` : role === 'supplier' ? `
        <div class="menu-item" data-nav="aquaos"><div class="mi-icon" style="background:#E3F2FD">📦</div><div class="mi-text"><div class="mi-title">My Products</div><div class="mi-sub">Manage input catalog & leads</div></div><span class="mi-arrow">›</span></div>
        <div class="menu-item" data-nav="kisan"><div class="mi-icon" style="background:#FFF3E0">🚜</div><div class="mi-text"><div class="mi-title">KisanConnect</div><div class="mi-sub">Rural Input Marketplace</div></div><span class="mi-arrow">›</span></div>
      ` : `
        <div class="menu-item" data-nav="kisan"><div class="mi-icon" style="background:#FFF3E0">🚜</div><div class="mi-text"><div class="mi-title">KisanConnect</div><div class="mi-sub">Service Listings</div></div><span class="mi-arrow">›</span></div>
      `}
      <div class="menu-item" data-nav="community"><div class="mi-icon" style="background:#E8F5E9">💬</div><div class="mi-text"><div class="mi-title">Community</div><div class="mi-sub">Knowledge network</div></div><span class="mi-arrow">›</span></div>
      <div class="menu-item" data-nav="weather"><div class="mi-icon" style="background:#E0F7FA">🌤️</div><div class="mi-text"><div class="mi-title">Weather & Forecast</div><div class="mi-sub">Crop advisories</div></div><span class="mi-arrow">›</span></div>
      <div class="menu-item" data-nav="notifications"><div class="mi-icon" style="background:var(--info-bg)">🔔</div><div class="mi-text"><div class="mi-title">Notifications</div><div class="mi-sub">Alerts & updates</div></div><span class="mi-arrow">›</span></div>
      <div class="menu-item" data-nav="orders"><div class="mi-icon" style="background:var(--accent-light)">📦</div><div class="mi-text"><div class="mi-title">Orders</div><div class="mi-sub">Track purchases</div></div><span class="mi-arrow">›</span></div>
      <div class="menu-item" data-nav="architecture"><div class="mi-icon" style="background:#ECEFF1">🏗️</div><div class="mi-text"><div class="mi-title">Platform Architecture</div><div class="mi-sub">Roadmap & technical stack</div></div><span class="mi-arrow">›</span></div>
      ${role === 'admin' ? `<div class="menu-item" data-nav="admin"><div class="mi-icon" style="background:#E8EAF6">🛡️</div><div class="mi-text"><div class="mi-title">Admin Dashboard</div><div class="mi-sub">Platform management & stats</div></div><span class="mi-arrow">›</span></div>` : ''}
    </div>

    <!-- ACCOUNT SETTINGS -->
    <nav style="padding:8px 0" aria-label="Navigation">
      <div style="padding:8px 16px;font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px">Account</div>
      <div class="menu-item" id="kycBtn">
        <div class="mi-icon" style="background:#E8F5E9">🛡️</div>
        <div class="mi-text"><div class="mi-title">${t('complete_kyc')}</div><div class="mi-sub" id="kycStatusText">${t('kyc_pending')}</div></div>
        <span class="mi-arrow">›</span>
      </div>
      <div class="menu-item" id="paymentHistBtn">
        <div class="mi-icon" style="background:#FFF3E0">💳</div>
        <div class="mi-text"><div class="mi-title">${t('payment_history')}</div><div class="mi-sub">${t('wallet_balance')}: Loading...</div></div>
        <span class="mi-arrow">›</span>
      </div>
      <div class="menu-item" id="langBtn">
        <div class="mi-icon" style="background:#E3F2FD">🌐</div>
        <div class="mi-text"><div class="mi-title">${t('change_language')}</div><div class="mi-sub">${LANGUAGES.find(l=>l.code===getLang())?.native || 'English'}</div></div>
        <span class="mi-arrow">›</span>
      </div>
      <div class="menu-item" id="editNameBtn">
        <div class="mi-icon" style="background:var(--primary-surface)">✏️</div>
        <div class="mi-text"><div class="mi-title">${t('edit_profile')}</div><div class="mi-sub">${user.name || 'Update your name'}</div></div>
        <span class="mi-arrow">›</span>
      </div>
      <div class="menu-item" id="darkModeBtn">
        <div class="mi-icon" style="background:#212121">🌙</div>
        <div class="mi-text"><div class="mi-title">Dark Mode</div><div class="mi-sub" id="darkModeStatus">${document.documentElement.getAttribute('data-theme')==='dark' ? 'On — tap to switch to light' : 'Off — tap to enable'}</div></div>
        <span class="mi-arrow" id="darkModeIcon">${document.documentElement.getAttribute('data-theme')==='dark' ? '🌙' : '☀️'}</span>
      </div>
      <div class="menu-item" id="logoutBtn">
        <div class="mi-icon" style="background:#FFEBEE">🚪</div>
        <div class="mi-text"><div class="mi-title">${t('logout')}</div><div class="mi-sub">Sign out of AgriHub</div></div>
        <span class="mi-arrow" style="color:#F44336">›</span>
      </div>
    </div>

    <!-- PLAN INFO -->
    <div class="card" style="margin:12px 16px 80px;padding:14px;background:linear-gradient(135deg,var(--primary),#00c9a7);color:white">
      <div class="fw-700">${role === 'buyer' ? '🧠 Buyer Intelligence' : role === 'fpo' ? '🏢 FPO Pro Platform' : role === 'supplier' ? '📦 Supplier Platform' : '🌾 Farmer Network'}</div>
      <div style="font-size:12px;opacity:0.9;margin-top:4px">
        ${role === 'buyer' ? 'Upgrade to Enterprise (₹50,000/yr) for heatmaps, price forecasts, direct farmer contact & API access' :
          role === 'fpo' ? 'Pro Plan (₹2,999/mo) · Unlimited members, procurement, inventory, supply listings' :
          role === 'supplier' ? 'Premium Listing (₹4,999/mo) · Featured products, lead contact details, advertising' :
          'Free Farmer · ₹100/yr Premium for advanced advisory, insurance, priority listings'}
      </div>
    </div>
  `;

  container.querySelectorAll('[data-nav]').forEach(el => el.addEventListener('click', () => navigate(el.dataset.nav)));

  // ─── Onboarding Wizard CTA ─────────────────────────────────────
  const onboardingDone = localStorage.getItem('agrihub_onboarding_done');
  if (!onboardingDone && (role === 'farmer' || role === 'fpo')) {
    container.querySelector('#onboardingCta').style.display = 'block';
  }
  container.querySelector('#startOnboardingBtn')?.addEventListener('click', showOnboardingWizard);

  container.querySelector('#editNameBtn')?.addEventListener('click', () => {
    showModal(`<div class="modal-handle"></div><h3>✏️ Edit Name</h3>
      <div class="form-group"><label>Name</label><input class="form-input" id="newName" value="${user.name||''}" placeholder="Your full name"></div>
      <button class="btn btn-primary" id="saveName" style="width:100%">${t('save')}</button>`);
    document.querySelector('#saveName')?.addEventListener('click', async () => {
      const name = document.querySelector('#newName')?.value?.trim();
      if (!name) { showToast('Name required', 'error'); return; }
      try {
        await api.updateProfile({ name });
        showToast('Name updated!', 'success'); closeModal();
      } catch(e) { showToast(e.message,'error'); }
    });
  });

  // ─── KYC Button ──────────────────────────────────────────────
  container.querySelector('#kycBtn')?.addEventListener('click', () => {
    showModal(`<div class="modal-handle"></div>
      <h3>🛡️ ${t('complete_kyc')}</h3>
      <p class="text-sm text-muted" style="margin-bottom:16px">Submit documents for identity verification. Required for payments above ₹50,000.</p>
      <div id="kycDocsList" style="margin-bottom:16px">
        <div class="card" style="padding:12px;margin-bottom:8px;cursor:pointer" data-doctype="aadhaar">
          <div class="flex-between"><div class="fw-600">📋 ${t('upload_aadhaar')}</div><span class="tag tag-gray" id="kycDoc_aadhaar">Pending</span></div>
          <div class="text-sm text-muted mt-sm">Aadhaar card (front + back)</div>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px;cursor:pointer" data-doctype="pan">
          <div class="flex-between"><div class="fw-600">📋 ${t('upload_pan')}</div><span class="tag tag-gray" id="kycDoc_pan">Pending</span></div>
          <div class="text-sm text-muted mt-sm">PAN Card</div>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px;cursor:pointer" data-doctype="bank_passbook">
          <div class="flex-between"><div class="fw-600">🏦 ${t('upload_bank')}</div><span class="tag tag-gray" id="kycDoc_bank_passbook">Pending</span></div>
          <div class="text-sm text-muted mt-sm">Bank Passbook first page or cancelled cheque</div>
        </div>
      </div>
      <div class="form-group"><label>Document Type</label><select class="form-input" id="kycDocType">
        <option value="aadhaar">Aadhaar Card</option><option value="pan">PAN Card</option><option value="bank_passbook">Bank Passbook</option>
        <option value="land_pattadar">Land Pattadar</option><option value="fpo_certificate">FPO Certificate</option><option value="gst_certificate">GST Certificate</option>
      </select></div>
      <div class="form-group"><label>Document Number (optional)</label><input class="form-input" id="kycDocNum" placeholder="Enter document number"></div>
      <button class="btn btn-primary" id="submitKyc" style="width:100%">${t('submit')} Document</button>
      <button class="btn btn-secondary mt-sm" id="verifyKycBtn" style="width:100%;margin-top:8px">🔄 Request Verification</button>
    `);
    document.querySelector('#submitKyc')?.addEventListener('click', async () => {
      const doc_type = document.querySelector('#kycDocType')?.value;
      const doc_number = document.querySelector('#kycDocNum')?.value;
      try {
        await api.submitKYCDocument({ doc_type, doc_number_hash: doc_number ? btoa(doc_number) : null });
        showToast('Document submitted!', 'success');
      } catch(e) { showToast(e.message, 'error'); }
    });
    document.querySelector('#verifyKycBtn')?.addEventListener('click', async () => {
      try {
        await api.verifyKYC();
        showToast(t('kyc_verified'), 'success'); closeModal();
      } catch(e) { showToast(e.message, 'error'); }
    });
  });

  // ─── Payment History Button ──────────────────────────────────
  container.querySelector('#paymentHistBtn')?.addEventListener('click', async () => {
    try {
      const [walletRes, histRes] = await Promise.all([
        api.getWallet().catch(() => ({ balance: 0, recent_transactions: [] })),
        api.getPaymentHistory().catch(() => ({ payments: [] })),
      ]);
      const balance = walletRes.balance || 0;
      const payments = histRes.payments || [];
      showModal(`<div class="modal-handle"></div>
        <h3>💳 ${t('payment_history')}</h3>
        <div class="card" style="padding:16px;margin-bottom:16px;background:linear-gradient(135deg,#2196F3,#00BCD4);color:white;border-radius:12px">
          <div class="text-sm" style="opacity:0.8">${t('wallet_balance')}</div>
          <div style="font-size:28px;font-weight:800;margin-top:4px">₹${Number(balance).toLocaleString()}</div>
          <button class="btn btn-small" id="addMoneyBtn" style="margin-top:12px;background:rgba(255,255,255,0.2);color:white;border:1px solid rgba(255,255,255,0.4)">+ ${t('add_money')}</button>
        </div>
        <div style="font-size:13px;font-weight:700;margin-bottom:8px">Recent Payments</div>
        ${payments.length === 0 ? '<div class="text-sm text-muted">No payment history yet</div>' :
          payments.slice(0,10).map(p => `
            <div class="card" style="padding:10px;margin-bottom:6px">
              <div class="flex-between"><div class="fw-600 text-sm">${p.description || p.order_type || 'Payment'}</div><span class="tag tag-${p.status==='paid'?'green':p.status==='failed'?'red':'gray'}">${p.status}</span></div>
              <div class="flex-between mt-sm"><span class="fw-700" style="color:var(--primary)">₹${Number(p.amount).toLocaleString()}</span><span class="text-sm text-muted">${new Date(p.created_at).toLocaleDateString('en-IN')}</span></div>
            </div>
          `).join('')}
      `);
      document.querySelector('#addMoneyBtn')?.addEventListener('click', () => {
        showToast('Wallet top-up coming soon', 'info');
      });
    } catch(e) { showToast(e.message, 'error'); }
  });

  // ─── Language Button ─────────────────────────────────────────
  container.querySelector('#langBtn')?.addEventListener('click', () => {
    showModal(`<div class="modal-handle"></div>
      <h3>🌐 ${t('change_language')}</h3>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">
        ${LANGUAGES.map(l => `
          <button class="btn ${getLang()===l.code ? 'btn-primary' : 'btn-secondary'} lang-choice" data-lang="${l.code}" style="width:100%;text-align:left;padding:14px 16px">
            <span style="font-size:16px;margin-right:8px">${l.flag}</span>
            <span class="fw-700">${l.native}</span>
            <span class="text-sm text-muted" style="margin-left:8px">(${l.name})</span>
            ${getLang()===l.code ? '<span style="margin-left:auto">✓</span>' : ''}
          </button>
        `).join('')}
      </div>
    `);
    document.querySelectorAll('.lang-choice').forEach(b => {
      b.addEventListener('click', async () => {
        setLang(b.dataset.lang);
        try { await api.updateLanguage(b.dataset.lang); } catch(e) {}
        closeModal();
        showToast('Language updated!', 'success');
        navigate('profile'); // Re-render with new language
      });
    });
  });

  // ─── Wallet balance loader ───────────────────────────────────
  api.getWallet().then(w => {
    const el = container.querySelector('#paymentHistBtn .mi-sub');
    if (el) el.textContent = `${t('wallet_balance')}: ₹${Number(w.balance||0).toLocaleString()}`;
  }).catch(() => {});

  // ─── KYC status loader ───────────────────────────────────────
  api.getKYCStatus().then(res => {
    const status = res.kyc?.status || 'pending';
    const el = container.querySelector('#kycStatusText');
    if (el) {
      el.textContent = status === 'verified' ? t('kyc_verified') : status === 'submitted' ? t('kyc_pending') : t('kyc_pending');
      el.style.color = status === 'verified' ? 'var(--success)' : '';
    }
  }).catch(() => {});

  container.querySelector('#darkModeBtn')?.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('agri_theme', newTheme);
    const statusEl = container.querySelector('#darkModeStatus');
    const iconEl = container.querySelector('#darkModeIcon');
    if (statusEl) statusEl.textContent = newTheme === 'dark' ? 'On — tap to switch to light' : 'Off — tap to enable';
    if (iconEl) iconEl.textContent = newTheme === 'dark' ? '🌙' : '☀️';
    showToast(newTheme === 'dark' ? '🌙 Dark mode enabled' : '☀️ Light mode enabled', 'success');
  });

  container.querySelector('#logoutBtn')?.addEventListener('click', () => {
    if (!confirm('Logout from AgriHub?')) return;
    logoutStore();
    navigate('login');
  });

  loadRoleProfile();

  async function loadRoleProfile() {
    const el = container.querySelector('#roleProfileSection');
    if (!el) return;
    try {
      if (role === 'farmer') {
        const res = await api.getFarmerProfile();
        const fp = res.profile || res || {};
        el.innerHTML = `
          <div style="padding:8px 16px;font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px">Farm Profile</div>
          <div class="menu-item" id="editFarmBtn">
            <div class="mi-icon" style="background:#E8F5E9">🌾</div>
            <div class="mi-text">
              <div class="mi-title">${fp.village ? `${fp.village}, ${fp.district_name||''}` : 'Set Farm Location'}</div>
              <div class="mi-sub">${fp.total_land_acres ? `${fp.total_land_acres} acres · ${fp.irrigation_type||''}` : 'State · District · Land area'}</div>
            </div>
            <span class="mi-arrow">›</span>
          </div>
          ${fp.primary_crops?.length ? `<div style="padding:4px 16px 8px;display:flex;flex-wrap:wrap;gap:6px">
            ${fp.primary_crops.slice(0,6).map(c => `<span class="tag tag-green">${c}</span>`).join('')}
          </div>` : ''}
        `;
        el.querySelector('#editFarmBtn')?.addEventListener('click', () => showFarmerProfileModal(fp));

      } else if (role === 'fpo') {
        const res = await api.getFPOProfile();
        const fp = res.profile || res || {};
        el.innerHTML = `
          <div style="padding:8px 16px;font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px">FPO Profile</div>
          <div class="menu-item" id="editFpoBtn">
            <div class="mi-icon" style="background:#E3F2FD">🏢</div>
            <div class="mi-text">
              <div class="mi-title">${fp.fpo_name || 'Set Up FPO Profile'}</div>
              <div class="mi-sub">${fp.state||''} ${fp.district_name ? '· '+fp.district_name : ''} ${fp.member_count ? '· '+fp.member_count+' members' : ''}</div>
            </div>
            <span class="mi-arrow">›</span>
          </div>
        `;
        el.querySelector('#editFpoBtn')?.addEventListener('click', () => showFPOProfileModal(fp));

      } else if (role === 'buyer') {
        const res = await api.getBuyerProfile();
        const bp = res.profile || res || {};
        el.innerHTML = `
          <div style="padding:8px 16px;font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px">Buyer Profile</div>
          <div class="menu-item" id="editBuyerBtn">
            <div class="mi-icon" style="background:#FFF3E0">🛒</div>
            <div class="mi-text">
              <div class="mi-title">${bp.company_name || 'Set Company Profile'}</div>
              <div class="mi-sub">${bp.business_type||''} ${bp.gstin ? '· GSTIN: '+bp.gstin.slice(0,8)+'…' : ''}</div>
            </div>
            <span class="mi-arrow">›</span>
          </div>
          ${bp.commodities?.length ? `<div style="padding:4px 16px 8px;display:flex;flex-wrap:wrap;gap:6px">
            ${bp.commodities.slice(0,6).map(c => `<span class="tag tag-orange">${c}</span>`).join('')}
          </div>` : ''}
        `;
        el.querySelector('#editBuyerBtn')?.addEventListener('click', () => showBuyerProfileModal(bp));
      }
    } catch(e) { console.error('Profile load:', e); }
  }

  function showFarmerProfileModal(fp = {}) {
    showModal(`<div class="modal-handle"></div><h3>🌾 Farm Profile</h3>
      <div class="form-group"><label>State</label><input class="form-input" id="fpState" value="${fp.state||''}" placeholder="Andhra Pradesh"></div>
      <div class="form-group"><label>District</label><input class="form-input" id="fpDist" value="${fp.district_name||''}" placeholder="West Godavari"></div>
      <div class="form-group"><label>Village</label><input class="form-input" id="fpVillage" value="${fp.village||''}" placeholder="Bhimavaram"></div>
      <div class="form-group"><label>Land (acres)</label><input class="form-input" type="number" id="fpAcres" value="${fp.total_land_acres||''}" placeholder="5"></div>
      <div class="form-group"><label>Irrigation Type</label><select class="form-input" id="fpIrr">
        ${['borewell','canal','drip','rainfed','tank','river'].map(t=>`<option value="${t}" ${fp.irrigation_type===t?'selected':''}>${t}</option>`).join('')}
      </select></div>
      <div class="form-group"><label>Farming Method</label><select class="form-input" id="fpMethod">
        ${['conventional','organic','natural','integrated'].map(t=>`<option value="${t}" ${fp.farming_method===t?'selected':''}>${t}</option>`).join('')}
      </select></div>
      <div class="form-group"><label>Primary Crops (comma-separated)</label><input class="form-input" id="fpCrops" value="${(fp.primary_crops||[]).join(', ')}" placeholder="Tomato, Onion, Rice"></div>
      <div class="form-group"><label><input type="checkbox" id="fpConsent" ${fp.contact_consent?'checked':''}> Allow buyers to contact me directly</label></div>
      <button class="btn btn-primary" id="saveFarmer" style="width:100%">Save Farm Profile</button>`);
    document.querySelector('#saveFarmer')?.addEventListener('click', async () => {
      try {
        await api.updateFarmerProfile({
          state: document.querySelector('#fpState')?.value,
          village: document.querySelector('#fpVillage')?.value,
          total_land_acres: Number(document.querySelector('#fpAcres')?.value) || undefined,
          irrigation_type: document.querySelector('#fpIrr')?.value,
          farming_method: document.querySelector('#fpMethod')?.value,
          primary_crops: document.querySelector('#fpCrops')?.value?.split(',').map(s=>s.trim()).filter(Boolean),
          contact_consent: document.querySelector('#fpConsent')?.checked,
        });
        showToast('Farm profile saved', 'success'); closeModal(); loadRoleProfile();
      } catch(e) { showToast(e.message,'error'); }
    });
  }

  function showFPOProfileModal(fp = {}) {
    showModal(`<div class="modal-handle"></div><h3>🏢 FPO Profile</h3>
      <div class="form-group"><label>FPO Name</label><input class="form-input" id="fpName" value="${fp.fpo_name||''}" placeholder="Sri Rama FPO Ltd"></div>
      <div class="form-group"><label>Registration Number</label><input class="form-input" id="fpReg" value="${fp.registration_number||''}"></div>
      <div class="form-group"><label>State</label><input class="form-input" id="fpState" value="${fp.state||''}" placeholder="Andhra Pradesh"></div>
      <div class="form-group"><label>District</label><input class="form-input" id="fpDist" value="${fp.district_name||''}"></div>
      <div class="form-group"><label>CEO Name</label><input class="form-input" id="fpCeo" value="${fp.ceo_name||''}"></div>
      <div class="form-group"><label>Primary Crops (comma-separated)</label><input class="form-input" id="fpCrops" value="${(fp.primary_crops||[]).join(', ')}"></div>
      <button class="btn btn-primary" id="saveFpo" style="width:100%">Save FPO Profile</button>`);
    document.querySelector('#saveFpo')?.addEventListener('click', async () => {
      try {
        await api.updateFPOProfile({
          fpo_name: document.querySelector('#fpName')?.value,
          registration_number: document.querySelector('#fpReg')?.value,
          state: document.querySelector('#fpState')?.value,
          ceo_name: document.querySelector('#fpCeo')?.value,
          primary_crops: document.querySelector('#fpCrops')?.value?.split(',').map(s=>s.trim()).filter(Boolean),
        });
        showToast('FPO profile saved', 'success'); closeModal(); loadRoleProfile();
      } catch(e) { showToast(e.message,'error'); }
    });
  }

  function showBuyerProfileModal(bp = {}) {
    showModal(`<div class="modal-handle"></div><h3>🛒 Buyer Profile</h3>
      <div class="form-group"><label>Company Name</label><input class="form-input" id="bpComp" value="${bp.company_name||''}" placeholder="Fresh Exports Pvt Ltd"></div>
      <div class="form-group"><label>Business Type</label><select class="form-input" id="bpType">
        ${['trader','exporter','processor','retailer','supermarket','wholesaler'].map(t=>`<option value="${t}" ${bp.business_type===t?'selected':''}>${t}</option>`).join('')}
      </select></div>
      <div class="form-group"><label>GSTIN</label><input class="form-input" id="bpGstin" value="${bp.gstin||''}" maxlength="15" placeholder="29ABCDE1234F1Z5"></div>
      <div class="form-group"><label>Monthly Volume (tons)</label><input class="form-input" type="number" id="bpVol" value="${bp.monthly_volume_tons||''}"></div>
      <div class="form-group"><label>Sourcing States (comma-separated)</label><input class="form-input" id="bpStates" value="${(bp.sourcing_states||[]).join(', ')}" placeholder="Andhra Pradesh, Karnataka"></div>
      <div class="form-group"><label>Commodities (comma-separated)</label><input class="form-input" id="bpComm" value="${(bp.commodities||[]).join(', ')}" placeholder="Tomato, Onion, Shrimp"></div>
      <button class="btn btn-primary" id="saveBuyer" style="width:100%">Save Buyer Profile</button>`);
    document.querySelector('#saveBuyer')?.addEventListener('click', async () => {
      try {
        await api.updateBuyerProfile({
          company_name: document.querySelector('#bpComp')?.value,
          business_type: document.querySelector('#bpType')?.value,
          gstin: document.querySelector('#bpGstin')?.value,
          monthly_volume_tons: Number(document.querySelector('#bpVol')?.value) || undefined,
          sourcing_states: document.querySelector('#bpStates')?.value?.split(',').map(s=>s.trim()).filter(Boolean),
          commodities: document.querySelector('#bpComm')?.value?.split(',').map(s=>s.trim()).filter(Boolean),
        });
        showToast('Buyer profile saved', 'success'); closeModal(); loadRoleProfile();
      } catch(e) { showToast(e.message,'error'); }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // ONBOARDING WIZARD — 4-step farmer profile setup
  // ═══════════════════════════════════════════════════════════════
  function showOnboardingWizard() {
    let step = 1;
    const data = { lat: null, lng: null, district: '', village: '', mandal: '',
      total_land_acres: '', irrigation: 'rainfed', soil_type: 'black', farming_method: 'conventional',
      crops: [] };
    let cropsList = [];

    function renderStep() {
      let html = `<div class="modal-handle"></div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
          ${[1,2,3,4].map(s => `<div style="flex:1;height:4px;border-radius:2px;background:${s<=step?'#4CAF50':'#E0E0E0'}"></div>`).join('')}
        </div>
        <div style="font-size:11px;color:#757575;margin-bottom:8px">Step ${step} of 4</div>`;

      if (step === 1) {
        html += `<h3>📍 Location</h3>
          <button id="obGpsBtn" style="width:100%;padding:10px;background:#E8F5E9;border:1px solid #4CAF50;border-radius:8px;cursor:pointer;font-weight:600;margin-bottom:12px">
            ${data.lat ? `✅ GPS: ${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}` : '📡 Capture GPS Location'}
          </button>
          <div class="form-group"><label>District</label><select class="form-input" id="obDistrict">
            <option value="">Select district</option>
            <option ${data.district==='Guntur'?'selected':''}>Guntur</option><option ${data.district==='Krishna'?'selected':''}>Krishna</option>
            <option ${data.district==='Prakasam'?'selected':''}>Prakasam</option><option ${data.district==='Nellore'?'selected':''}>Nellore</option>
            <option ${data.district==='Kurnool'?'selected':''}>Kurnool</option><option ${data.district==='Anantapur'?'selected':''}>Anantapur</option>
            <option ${data.district==='Kadapa'?'selected':''}>Kadapa</option><option ${data.district==='Chittoor'?'selected':''}>Chittoor</option>
            <option ${data.district==='Warangal'?'selected':''}>Warangal</option><option ${data.district==='Karimnagar'?'selected':''}>Karimnagar</option>
          </select></div>
          <div class="form-group"><label>Village</label><input class="form-input" id="obVillage" value="${data.village}" placeholder="Enter village name"></div>
          <div class="form-group"><label>Mandal</label><input class="form-input" id="obMandal" value="${data.mandal}" placeholder="Enter mandal name"></div>`;
      } else if (step === 2) {
        html += `<h3>🌾 Land Details</h3>
          <div class="form-group"><label>Total Land (acres)</label><input class="form-input" type="number" id="obLand" value="${data.total_land_acres}" placeholder="5"></div>
          <div class="form-group"><label>Irrigation Type</label><select class="form-input" id="obIrrigation">
            ${['rainfed','borewell','canal','drip','sprinkler'].map(v=>`<option value="${v}" ${data.irrigation===v?'selected':''}>${v.charAt(0).toUpperCase()+v.slice(1)}</option>`).join('')}
          </select></div>
          <div class="form-group"><label>Soil Type</label><select class="form-input" id="obSoil">
            ${['black','red','alluvial','laterite','sandy'].map(v=>`<option value="${v}" ${data.soil_type===v?'selected':''}>${v.charAt(0).toUpperCase()+v.slice(1)}</option>`).join('')}
          </select></div>
          <div class="form-group"><label>Farming Method</label><select class="form-input" id="obMethod">
            ${['conventional','organic','mixed'].map(v=>`<option value="${v}" ${data.farming_method===v?'selected':''}>${v.charAt(0).toUpperCase()+v.slice(1)}</option>`).join('')}
          </select></div>`;
      } else if (step === 3) {
        html += `<h3>🌱 Select Crops</h3>
          <div style="max-height:250px;overflow-y:auto;padding:4px 0">
            ${cropsList.map(c => `<label style="display:flex;align-items:center;gap:8px;padding:8px 4px;border-bottom:1px solid #f0f0f0;cursor:pointer">
              <input type="checkbox" class="obCropCheck" value="${c.id}" ${data.crops.includes(c.id)?'checked':''}>
              <span>${c.icon_emoji||'🌿'} ${c.name}</span>
            </label>`).join('')}
            ${cropsList.length === 0 ? '<div style="text-align:center;color:#757575;padding:20px">Loading crops…</div>' : ''}
          </div>`;
      } else {
        html += `<h3>✅ Confirm Details</h3>
          <div style="background:#F5F5F5;border-radius:10px;padding:12px;font-size:13px;line-height:1.8">
            <div><strong>📍 Location:</strong> ${data.village || '—'}, ${data.mandal || '—'}, ${data.district || '—'}</div>
            <div><strong>🗺️ GPS:</strong> ${data.lat ? `${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}` : 'Not captured'}</div>
            <div><strong>🌾 Land:</strong> ${data.total_land_acres || '—'} acres</div>
            <div><strong>💧 Irrigation:</strong> ${data.irrigation}</div>
            <div><strong>🪨 Soil:</strong> ${data.soil_type}</div>
            <div><strong>🧑‍🌾 Method:</strong> ${data.farming_method}</div>
            <div><strong>🌱 Crops:</strong> ${data.crops.length} selected</div>
          </div>`;
      }

      html += `<div style="display:flex;gap:8px;margin-top:16px">
        ${step > 1 ? '<button id="obBack" class="btn btn-secondary" style="flex:1">← Back</button>' : ''}
        <button id="obNext" class="btn btn-primary" style="flex:1">${step === 4 ? '🚀 Submit' : 'Next →'}</button>
      </div>`;

      showModal(html);
      bindStepEvents();
    }

    function bindStepEvents() {
      document.querySelector('#obGpsBtn')?.addEventListener('click', async () => {
        try {
          const loc = await getMyLocation();
          data.lat = loc.lat; data.lng = loc.lng;
          document.querySelector('#obGpsBtn').innerHTML = `✅ GPS: ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;
        } catch(e) { showToast('GPS unavailable: ' + e.message, 'error'); }
      });

      document.querySelector('#obBack')?.addEventListener('click', () => { saveCurrentStep(); step--; renderStep(); });
      document.querySelector('#obNext')?.addEventListener('click', async () => {
        saveCurrentStep();
        if (step === 4) {
          try {
            await api.post('/farmer/profile', data);
            localStorage.setItem('agrihub_onboarding_done', '1');
            showToast('Profile completed! 🎉', 'success');
            closeModal();
            container.querySelector('#onboardingCta').style.display = 'none';
          } catch(e) { showToast(e.message, 'error'); }
        } else {
          step++;
          if (step === 3 && cropsList.length === 0) {
            try { const res = await api.getCrops(); cropsList = res.crops || []; } catch(e) { cropsList = []; }
          }
          renderStep();
        }
      });
    }

    function saveCurrentStep() {
      if (step === 1) {
        data.district = document.querySelector('#obDistrict')?.value || data.district;
        data.village = document.querySelector('#obVillage')?.value || data.village;
        data.mandal = document.querySelector('#obMandal')?.value || data.mandal;
      } else if (step === 2) {
        data.total_land_acres = document.querySelector('#obLand')?.value || data.total_land_acres;
        data.irrigation = document.querySelector('#obIrrigation')?.value || data.irrigation;
        data.soil_type = document.querySelector('#obSoil')?.value || data.soil_type;
        data.farming_method = document.querySelector('#obMethod')?.value || data.farming_method;
      } else if (step === 3) {
        data.crops = Array.from(document.querySelectorAll('.obCropCheck:checked')).map(el => el.value);
      }
    }

    renderStep();
  }
}
