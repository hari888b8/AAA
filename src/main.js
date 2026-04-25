import './styles/base.css';
import './styles/components.css';
import './styles/pages.css';
import './styles/animations.css';
import './styles/functional.css';
import './styles/switcher.css';

import { registerRoute, initRouter, navigate } from './router.js';
import { renderHomePage } from './pages/HomePage.js';
import { renderAgriFlowPage } from './pages/AgriFlowPage.js';
import { renderAquaOSPage } from './pages/AquaOSPage.js';
import { renderFarmerConnectPage } from './pages/FarmerConnectPage.js';
import { renderKisanConnectPage } from './pages/KisanConnectPage.js';
import { renderIntelligencePage } from './pages/IntelligencePage.js';
import { renderArchitecturePage } from './pages/ArchitecturePage.js';
import { mountAppSwitcher, highlightActive } from './components/AppSwitcher.js';

registerRoute('/', renderHomePage);
registerRoute('/agriflow', renderAgriFlowPage);
registerRoute('/aquaos', renderAquaOSPage);
registerRoute('/farmerconnect', renderFarmerConnectPage);
registerRoute('/kisanconnect', renderKisanConnectPage);
registerRoute('/intelligence', renderIntelligencePage);
registerRoute('/architecture', renderArchitecturePage);

// Floating particles
function createParticles() {
  const c = document.createElement('div');
  c.className = 'particles';
  for (let i = 0; i < 25; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;animation-delay:${Math.random()*6}s;animation-duration:${4+Math.random()*4}s;opacity:${0.1+Math.random()*0.15};width:${2+Math.random()*2}px;height:${2+Math.random()*2}px;`;
    c.appendChild(p);
  }
  document.body.appendChild(c);
}

// Scroll button
function createScrollBtn() {
  const b = document.createElement('button');
  b.className = 'scroll-top';
  b.innerHTML = '↑';
  b.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  document.body.appendChild(b);
  window.addEventListener('scroll', () => b.classList.toggle('visible', window.scrollY > 400));
}

// Animated counters
window.animateCounters = function() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    let current = 0;
    const step = Math.max(1, Math.floor(target / 40));
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = prefix + current.toLocaleString('en-IN') + suffix;
      if (current >= target) clearInterval(timer);
    }, 30);
  });
};

// Search functionality
window.filterCards = function(inputEl, containerSelector) {
  const q = inputEl.value.toLowerCase();
  document.querySelectorAll(`${containerSelector} [data-searchable]`).forEach(card => {
    const text = card.dataset.searchable.toLowerCase();
    card.style.display = text.includes(q) ? '' : 'none';
  });
};

// Tab switching
window.switchTab = function(tabId, groupId) {
  document.querySelectorAll(`[data-tab-group="${groupId}"]`).forEach(t => {
    t.classList.remove('tab--active');
    t.style.display = 'none';
  });
  document.querySelectorAll(`[data-tab-btn="${groupId}"]`).forEach(b => b.classList.remove('tab-btn--active'));
  const target = document.getElementById(tabId);
  const btn = document.querySelector(`[data-tab-btn="${groupId}"][data-target="${tabId}"]`);
  if (target) { target.style.display = ''; target.classList.add('tab--active'); }
  if (btn) btn.classList.add('tab-btn--active');
};

// Live clock
window.startLiveClock = function() {
  const el = document.getElementById('live-clock');
  if (!el) return;
  const tick = () => {
    const now = new Date();
    el.textContent = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  tick();
  setInterval(tick, 1000);
};

// Simulated price ticker
window.startPriceTicker = function() {
  const crops = [
    { name: 'Tomato', base: 2200, unit: '₹/qtl' },
    { name: 'Onion', base: 1800, unit: '₹/qtl' },
    { name: 'Potato', base: 1400, unit: '₹/qtl' },
    { name: 'Rice', base: 3200, unit: '₹/qtl' },
    { name: 'Wheat', base: 2800, unit: '₹/qtl' },
    { name: 'Chilli', base: 8500, unit: '₹/qtl' },
  ];
  const container = document.getElementById('price-ticker');
  if (!container) return;

  function update() {
    container.innerHTML = crops.map(c => {
      const change = (Math.random() - 0.48) * 200;
      const price = Math.round(c.base + change);
      const pct = ((change / c.base) * 100).toFixed(1);
      const up = change >= 0;
      return `<div class="ticker-item">
        <span class="ticker-crop">${c.name}</span>
        <span class="ticker-price">₹${price.toLocaleString('en-IN')}</span>
        <span class="ticker-change ${up ? 'ticker-up' : 'ticker-down'}">${up ? '▲' : '▼'} ${Math.abs(pct)}%</span>
      </div>`;
    }).join('');
  }
  update();
  setInterval(update, 3000);
};

// Toast notifications
window.showToast = function(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = `toast toast--${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('toast--visible'));
  setTimeout(() => { t.classList.remove('toast--visible'); setTimeout(() => t.remove(), 300); }, 3000);
};

// Modal
window.openModal = function(title, content) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal">
    <div class="modal__header"><h3>${title}</h3><button onclick="this.closest('.modal-overlay').remove()" class="modal__close">✕</button></div>
    <div class="modal__body">${content}</div>
  </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('modal-overlay--visible'));
};

const app = document.getElementById('app');
createParticles();
createScrollBtn();
mountAppSwitcher();
window.navigate = navigate;
initRouter(app);
window.addEventListener('hashchange', highlightActive);
