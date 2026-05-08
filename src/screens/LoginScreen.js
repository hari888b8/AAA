import { api } from '../api.js';
import { setState } from '../store.js';
import { navigate, showToast } from '../app-shell.js';
import { t, getLang, setLang, LANGUAGES } from '../i18n.js';

// ─── PLATFORM STRUCTURE ───────────────────────────────────────────────────
// AgriHub has 3 standalone platforms:
//   🐟 AquaOS        — Aquaculture (shrimp/fish/crab, AP focus)
//   🌾 Agri          — Crop supply network (AgriFlow + Community + Weather + Farmers + FPOs)
//                      "Agri Intelligence" = data engine inside Agri, NOT a separate app
//   🚜 KisanConnect  — Rural super-app (all roles, free access)
//
// Buyer logs in → sees all 3 → subscribes to what they need (aqua / crop / both)
// Supplier = Input Supplier (sells TO farmers, does NOT buy produce)
// ─────────────────────────────────────────────────────────────────────────────
const ROLES = [
  {
    id: 'farmer',
    icon: '👨‍🌾',
    label: 'Farmer',
    subtitle: 'Crop · Aquaculture · or Both',
    desc: 'Declare crops, log pond activity, post harvests for sale, receive buyer inquiries. Access both AquaOS (aqua) and Agri (crop) platforms.',
    platforms: ['🐟 AquaOS — Pond OS & harvest listing', '🌾 Agri — Crop declarations & markets', '🚜 KisanConnect — Rural marketplace'],
    color: '#2E7D32',
  },
  {
    id: 'fpo',
    icon: '🏢',
    label: 'FPO / Society',
    subtitle: 'Farmer Producer Organisation',
    desc: 'Manage member farmers, record procurement, track inventory, publish aggregated supply listings. FPO Hub is inside the Agri platform.',
    platforms: ['🌾 Agri — FPO Hub (members, procurement, supply)', '🚜 KisanConnect — Crop marketplace'],
    color: '#1565C0',
  },
  {
    id: 'buyer',
    icon: '🛒',
    label: 'Buyer',
    subtitle: 'Trader · Exporter · Processor · Retailer',
    desc: 'You see all 3 platforms and subscribe to what you source. Aqua buyer → use AquaOS. Crop buyer → use Agri. Many buyers use both.',
    platforms: ['🐟 AquaOS — Aqua harvest marketplace (subscribe if needed)', '🌾 Agri — Nationwide crop supply search (subscribe if needed)', '🚜 KisanConnect — Free access always'],
    color: '#E65100',
  },
  {
    id: 'supplier',
    icon: '🏭',
    label: 'Input Supplier',
    subtitle: 'Sell production inputs TO farmers',
    desc: 'You SELL inputs to farmers — aqua feed, medicine, equipment (AquaOS) or fertilizer, seeds, pesticides (KisanConnect). You do NOT buy produce.',
    platforms: ['🐟 AquaOS Inputs — Aqua feed, medicine, equipment', '🚜 KisanConnect Inputs — Fertilizer, seeds, pesticides'],
    color: '#6A1B9A',
  },
  {
    id: 'service_provider',
    icon: '🔧',
    label: 'Service Provider',
    subtitle: 'Tractor · Labor · Cold Store · Transport',
    desc: 'List agricultural services on KisanConnect. Use Agri community for farmer connections and weather to plan work.',
    platforms: ['🚜 KisanConnect — Service listings & marketplace', '🌾 Agri — Community & weather'],
    color: '#546E7A',
  },
];

export function renderLogin(container) {
  let step = 'phone';
  let phone = '';
  let otp = '';
  let name = '';
  let role = 'farmer';
  let devOtp = '';
  let loading = false;

  function render() {
    container.innerHTML = `
      <div class="login-screen">
        <div class="login-logo hero-v2" role="banner" style="background:linear-gradient(135deg,#2E7D32,#00c9a7)">
          <div class="icon" aria-hidden="true">🌾</div>
          <h1>AgriHub</h1>
          <p>India's Agriculture Super-Platform</p>
          <div style="display:flex;gap:6px;justify-content:center;margin-top:8px;flex-wrap:wrap" role="list" aria-label="Available platforms">
            <span role="listitem" style="background:rgba(255,255,255,0.15);padding:3px 8px;border-radius:12px;font-size:10px">🐟 AquaOS</span>
            <span role="listitem" style="background:rgba(255,255,255,0.15);padding:3px 8px;border-radius:12px;font-size:10px">🌾 AgriFlow</span>
            <span role="listitem" style="background:rgba(255,255,255,0.15);padding:3px 8px;border-radius:12px;font-size:10px">🚜 KisanConnect</span>
          </div>
        </div>
        <div class="login-form">
          ${step === 'phone' ? renderPhoneStep() : renderOtpStep()}
        </div>
      </div>`;
    attachEvents();
  }

  function renderPhoneStep() {
    return `
      <div style="display:flex;justify-content:center;gap:6px;margin-bottom:16px">
        ${LANGUAGES.map(l => `<button class="lang-sel-btn" data-lang="${l.code}" style="padding:6px 12px;border-radius:16px;border:2px solid ${getLang()===l.code?'var(--primary)':'var(--border)'};background:${getLang()===l.code?'var(--primary-surface)':'var(--bg)'};font-size:12px;font-weight:${getLang()===l.code?'700':'500'};cursor:pointer;color:${getLang()===l.code?'var(--primary)':'var(--text2)'}">${l.native}</button>`).join('')}
      </div>
      <h2>${t('login_title')}</h2>
      <p class="sub">${t('enter_phone')}</p>
      <div class="form-group">
        <label>${t('enter_phone')}</label>
        <div class="phone-input">
          <span class="prefix">🇮🇳 +91</span>
          <input type="tel" id="phone" maxlength="10" placeholder="9876543210" value="${phone}" inputmode="numeric" pattern="[0-9]*" autocomplete="tel" aria-label="Enter 10-digit mobile number">
        </div>
      </div>
      <button class="btn btn-primary" id="sendOtp" ${loading ? 'disabled' : ''}>
        ${loading ? '<span class="spinner" style="width:20px;height:20px;border-width:2px;"></span>' : t('send_otp') + ' →'}
      </button>
      <p style="text-align:center;margin-top:16px;font-size:11px;color:var(--text3)">By continuing, you agree to our Terms of Service</p>`;
  }

  let farmerType = 'both'; // agri_farmer, aqua_farmer, both
  let buyerType = 'trader'; // trader, exporter, processor, retailer

  function renderOtpStep() {
    const rm = ROLES.find(r => r.id === role) || ROLES[0];
    return `
      <h2>Verify & Select Role</h2>
      <p class="sub">+91 ${phone}</p>
      <div style="background:linear-gradient(135deg,#E8F5E9,#E3F2FD);padding:10px 14px;border-radius:10px;margin-bottom:14px;display:flex;align-items:center;gap:8px">
        <span style="font-size:20px">📱</span>
        <div>
          <div style="font-size:12px;font-weight:700;color:#1B5E20">One App for Everyone</div>
          <div style="font-size:11px;color:#37474F">Pick your primary role — you can add more roles later from Settings</div>
        </div>
      </div>
      ${devOtp ? `<p style="background:var(--success-bg);color:var(--success);padding:8px 12px;border-radius:8px;font-size:13px;font-weight:600;margin-bottom:12px">🔑 Dev OTP: ${devOtp}</p>` : ''}
      <div class="form-group">
        <label>OTP Code</label>
        <div class="otp-input" id="otpContainer">
          ${[0,1,2,3,4,5].map(i => `<input type="tel" maxlength="1" data-idx="${i}" value="${otp[i]||''}" inputmode="numeric" pattern="[0-9]*" aria-label="OTP digit ${i+1}">`).join('')}
        </div>
      </div>
      <div class="form-group">
        <label>Your Name</label>
        <input class="form-input" type="text" id="name" placeholder="Enter your name" value="${name}" aria-label="Enter your name">
      </div>
      <div class="form-group">
        <label>I am a…</label>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${ROLES.map(r => `
            <label style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-radius:10px;border:2px solid ${role===r.id?r.color:'var(--border)'};background:${role===r.id?r.color+'18':'var(--bg)'};cursor:pointer" onclick="document.getElementById('role_${r.id}').click()">
              <input type="radio" id="role_${r.id}" name="roleSelect" value="${r.id}" ${role===r.id?'checked':''} style="margin-top:3px;accent-color:${r.color}">
              <div style="flex:1">
                <div style="font-size:14px;font-weight:700;color:${role===r.id?r.color:'var(--text1)'}">${r.icon} ${r.label}</div>
                <div style="font-size:11px;color:var(--text3);margin-top:1px">${r.subtitle}</div>
                ${role===r.id ? `<div style="font-size:11px;color:var(--text2);margin-top:4px">${r.desc}</div>
                <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">${r.platforms.map(p=>`<span style="background:${r.color}22;color:${r.color};padding:2px 6px;border-radius:8px;font-size:10px;font-weight:600">${p}</span>`).join('')}</div>` : ''}
              </div>
            </label>
          `).join('')}
        </div>
      </div>

      ${role === 'farmer' ? `
      <div class="form-group" id="farmerSubType">
        <label style="font-size:12px;font-weight:700;color:var(--text2)">What type of farming?</label>
        <div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap">
          <button class="sub-type-btn ${farmerType==='agri_farmer'?'active':''}" data-ftype="agri_farmer" style="flex:1;min-width:80px;padding:10px;border-radius:10px;border:2px solid ${farmerType==='agri_farmer'?'#4CAF50':'var(--border)'};background:${farmerType==='agri_farmer'?'#E8F5E9':'var(--bg)'};cursor:pointer;text-align:center">
            <div style="font-size:20px">🌾</div>
            <div style="font-size:12px;font-weight:700;color:${farmerType==='agri_farmer'?'#2E7D32':'var(--text2)'}">Agri</div>
            <div style="font-size:10px;color:var(--text3)">Crops</div>
          </button>
          <button class="sub-type-btn ${farmerType==='aqua_farmer'?'active':''}" data-ftype="aqua_farmer" style="flex:1;min-width:80px;padding:10px;border-radius:10px;border:2px solid ${farmerType==='aqua_farmer'?'#0277BD':'var(--border)'};background:${farmerType==='aqua_farmer'?'#E3F2FD':'var(--bg)'};cursor:pointer;text-align:center">
            <div style="font-size:20px">🐟</div>
            <div style="font-size:12px;font-weight:700;color:${farmerType==='aqua_farmer'?'#0277BD':'var(--text2)'}">Aqua</div>
            <div style="font-size:10px;color:var(--text3)">Shrimp · Fish</div>
          </button>
          <button class="sub-type-btn ${farmerType==='both'?'active':''}" data-ftype="both" style="flex:1;min-width:80px;padding:10px;border-radius:10px;border:2px solid ${farmerType==='both'?'#6A1B9A':'var(--border)'};background:${farmerType==='both'?'#F3E5F5':'var(--bg)'};cursor:pointer;text-align:center">
            <div style="font-size:20px">🌾🐟</div>
            <div style="font-size:12px;font-weight:700;color:${farmerType==='both'?'#6A1B9A':'var(--text2)'}">Both</div>
            <div style="font-size:10px;color:var(--text3)">Agri + Aqua</div>
          </button>
        </div>
      </div>
      ` : ''}

      ${role === 'buyer' ? `
      <div class="form-group" id="buyerSubType">
        <label style="font-size:12px;font-weight:700;color:var(--text2)">What type of buyer?</label>
        <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">
          ${[
            { id:'trader', icon:'📦', label:'Trader' },
            { id:'exporter', icon:'🌍', label:'Exporter' },
            { id:'processor', icon:'🏭', label:'Processor' },
            { id:'retailer', icon:'🏪', label:'Retailer' },
          ].map(bt => `
            <button class="buyer-type-btn ${buyerType===bt.id?'active':''}" data-btype="${bt.id}" style="flex:1;min-width:70px;padding:8px 4px;border-radius:8px;border:2px solid ${buyerType===bt.id?'#E65100':'var(--border)'};background:${buyerType===bt.id?'#FFF3E0':'var(--bg)'};cursor:pointer;text-align:center">
              <div style="font-size:16px">${bt.icon}</div>
              <div style="font-size:11px;font-weight:${buyerType===bt.id?'700':'500'};color:${buyerType===bt.id?'#E65100':'var(--text2)'}">${bt.label}</div>
            </button>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <button class="btn btn-primary" id="verifyOtp" ${loading ? 'disabled' : ''}>
        ${loading ? '<span class="spinner" style="width:20px;height:20px;border-width:2px;"></span>' : `Continue as ${rm.icon} ${rm.label} →`}
      </button>
      <button class="btn btn-outline mt-sm" id="changePhone" style="margin-top:10px;width:100%">← Change Number</button>`;
  }

  function attachEvents() {
    // Language selector buttons
    container.querySelectorAll('.lang-sel-btn').forEach(b => {
      b.addEventListener('click', () => { setLang(b.dataset.lang); render(); });
    });
    if (step === 'phone') {
      const inp = container.querySelector('#phone');
      inp?.addEventListener('input', e => { phone = e.target.value.replace(/\D/g,'').slice(0,10); e.target.value = phone; });
      inp?.focus();
      container.querySelector('#sendOtp')?.addEventListener('click', handleSendOtp);
      inp?.addEventListener('keydown', e => { if (e.key === 'Enter') handleSendOtp(); });
    } else {
      const otpInputs = container.querySelectorAll('#otpContainer input');
      otpInputs.forEach((inp, i) => {
        inp.addEventListener('input', e => {
          const v = e.target.value.replace(/\D/,'');
          e.target.value = v.slice(0,1);
          otp = otp.substring(0,i)+(v[0]||'')+otp.substring(i+1);
          if (v && i < 5) otpInputs[i+1]?.focus();
        });
        inp.addEventListener('keydown', e => { if (e.key==='Backspace' && !e.target.value && i > 0) otpInputs[i-1]?.focus(); });
        inp.addEventListener('paste', e => {
          e.preventDefault();
          const text = (e.clipboardData?.getData('text')||'').replace(/\D/g,'').slice(0,6);
          otp = text;
          otpInputs.forEach((inp,j) => { inp.value = text[j]||''; });
          if (text.length === 6) otpInputs[5]?.focus();
        });
      });
      otpInputs[0]?.focus();
      container.querySelector('#name')?.addEventListener('input', e => { name = e.target.value; });
      // Role radio buttons
      container.querySelectorAll('input[name="roleSelect"]').forEach(r => {
        r.addEventListener('change', () => { role = r.value; render(); });
      });
      // Farmer sub-type buttons
      container.querySelectorAll('.sub-type-btn').forEach(b => {
        b.addEventListener('click', (e) => { e.preventDefault(); farmerType = b.dataset.ftype; render(); });
      });
      // Buyer sub-type buttons
      container.querySelectorAll('.buyer-type-btn').forEach(b => {
        b.addEventListener('click', (e) => { e.preventDefault(); buyerType = b.dataset.btype; render(); });
      });
      container.querySelector('#verifyOtp')?.addEventListener('click', handleVerify);
      container.querySelector('#changePhone')?.addEventListener('click', () => { step = 'phone'; render(); });
    }
  }

  async function handleSendOtp() {
    if (phone.length !== 10) { showToast('Enter a valid 10-digit number', 'error'); return; }
    loading = true; render();
    try {
      const res = await api.sendOtp(phone);
      devOtp = res.otp || '';
      step = 'otp'; otp = '';
    } catch(e) { showToast(e.message, 'error'); }
    loading = false; render();
  }

  async function handleVerify() {
    if (otp.length !== 6) { showToast('Enter 6-digit OTP', 'error'); return; }
    if (!name.trim()) { showToast('Enter your name', 'error'); return; }
    loading = true; render();
    try {
      const res = await api.verifyOtp(phone, otp, name.trim(), role);
      api.setToken(res.token);
      if (res.refreshToken) localStorage.setItem('agrihub_refresh', res.refreshToken);
      
      // Set up multi-role state
      const subType = role === 'farmer' ? farmerType : role === 'buyer' ? buyerType : null;
      const initialRoles = [{ role, sub_type: subType, is_active: true }];
      setState({
        user: res.user,
        isLoggedIn: true,
        roles: initialRoles,
        activeRole: role,
      });

      // Async: seed roles in backend (non-blocking)
      api.addRole(role, subType).catch(() => {});

      showToast(`Welcome, ${res.user.name}!`, 'success');
      navigate('home');
    } catch(e) { showToast(e.message, 'error'); loading = false; render(); }
  }

  render();
}
