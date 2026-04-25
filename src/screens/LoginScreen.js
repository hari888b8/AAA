import { api } from '../api.js';
import { setState } from '../store.js';
import { navigate, showToast } from '../main.js';

export function renderLogin(container) {
  let step = 'phone'; // phone | otp
  let phone = '';
  let otp = '';
  let name = '';
  let role = 'farmer';
  let devOtp = '';
  let loading = false;

  function render() {
    container.innerHTML = `
      <div class="login-screen">
        <div class="login-logo">
          <div class="icon">🌾</div>
          <h1>AgriHub</h1>
          <p>India's Agriculture Super-App</p>
        </div>
        <div class="login-form">
          ${step === 'phone' ? renderPhoneStep() : renderOtpStep()}
        </div>
      </div>`;
    attachEvents();
  }

  function renderPhoneStep() {
    return `
      <h2>Welcome</h2>
      <p class="sub">Enter your mobile number to get started</p>
      <div class="form-group">
        <label>Mobile Number</label>
        <div class="phone-input">
          <span class="prefix">🇮🇳 +91</span>
          <input type="tel" id="phone" maxlength="10" placeholder="9876543210" value="${phone}" inputmode="numeric" pattern="[0-9]*" autocomplete="tel">
        </div>
      </div>
      <button class="btn btn-primary" id="sendOtp" ${loading ? 'disabled' : ''}>
        ${loading ? '<span class="spinner" style="width:20px;height:20px;border-width:2px;"></span>' : 'Send OTP →'}
      </button>
      <p style="text-align:center;margin-top:20px;font-size:12px;color:var(--text3)">
        By continuing, you agree to our Terms of Service
      </p>`;
  }

  function renderOtpStep() {
    return `
      <h2>Verify OTP</h2>
      <p class="sub">Enter the 6-digit code sent to +91 ${phone}</p>
      ${devOtp ? `<p style="background:var(--success-bg);color:var(--success);padding:8px 12px;border-radius:8px;font-size:13px;font-weight:600;margin-bottom:16px">🔑 Dev OTP: ${devOtp}</p>` : ''}
      <div class="form-group">
        <label>OTP Code</label>
        <div class="otp-input" id="otpContainer">
          ${[0,1,2,3,4,5].map(i => `<input type="tel" maxlength="1" data-idx="${i}" value="${otp[i] || ''}" inputmode="numeric" pattern="[0-9]*">`).join('')}
        </div>
      </div>
      <div class="form-group">
        <label>Your Name</label>
        <input class="form-input" type="text" id="name" placeholder="Enter your name" value="${name}">
      </div>
      <div class="form-group">
        <label>Role</label>
        <div class="role-selector">
          <button class="role-btn ${role === 'farmer' ? 'active' : ''}" data-role="farmer">
            <span class="role-icon">👨‍🌾</span>
            <span class="role-name">Farmer</span>
          </button>
          <button class="role-btn ${role === 'fpo' ? 'active' : ''}" data-role="fpo">
            <span class="role-icon">🏢</span>
            <span class="role-name">FPO</span>
          </button>
          <button class="role-btn ${role === 'buyer' ? 'active' : ''}" data-role="buyer">
            <span class="role-icon">🛒</span>
            <span class="role-name">Buyer</span>
          </button>
        </div>
      </div>
      <button class="btn btn-primary" id="verifyOtp" ${loading ? 'disabled' : ''}>
        ${loading ? '<span class="spinner" style="width:20px;height:20px;border-width:2px;"></span>' : 'Verify & Continue →'}
      </button>
      <button class="btn btn-outline mt-sm" id="changePhone" style="margin-top:12px">← Change Number</button>`;
  }

  function attachEvents() {
    if (step === 'phone') {
      const inp = container.querySelector('#phone');
      inp?.addEventListener('input', e => { phone = e.target.value.replace(/\D/g, '').slice(0, 10); e.target.value = phone; });
      inp?.focus();
      container.querySelector('#sendOtp')?.addEventListener('click', handleSendOtp);
      inp?.addEventListener('keydown', e => { if (e.key === 'Enter') handleSendOtp(); });
    } else {
      // OTP inputs
      const otpInputs = container.querySelectorAll('#otpContainer input');
      otpInputs.forEach((inp, i) => {
        inp.addEventListener('input', e => {
          const v = e.target.value.replace(/\D/g, '');
          e.target.value = v.slice(0, 1);
          otp = otp.substring(0, i) + (v[0] || '') + otp.substring(i + 1);
          if (v && i < 5) otpInputs[i + 1]?.focus();
        });
        inp.addEventListener('keydown', e => {
          if (e.key === 'Backspace' && !e.target.value && i > 0) {
            otpInputs[i - 1]?.focus();
          }
        });
        inp.addEventListener('paste', e => {
          e.preventDefault();
          const text = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6);
          otp = text;
          otpInputs.forEach((inp, j) => { inp.value = text[j] || ''; });
          if (text.length === 6) otpInputs[5]?.focus();
        });
      });
      otpInputs[0]?.focus();

      container.querySelector('#name')?.addEventListener('input', e => { name = e.target.value; });
      container.querySelectorAll('.role-btn').forEach(btn => {
        btn.addEventListener('click', () => { role = btn.dataset.role; render(); });
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
      step = 'otp';
      otp = '';
    } catch (e) { showToast(e.message, 'error'); }
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
      setState({ user: res.user, isLoggedIn: true });
      showToast(`Welcome, ${res.user.name}!`, 'success');
      navigate('home');
    } catch (e) { showToast(e.message, 'error'); loading = false; render(); }
  }

  render();
}
