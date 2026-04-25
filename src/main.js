import './styles/app.css';

import { api } from './api.js';
import { getState, setState, subscribe } from './store.js';
import { renderLogin } from './screens/LoginScreen.js';
import { renderHome } from './screens/HomeScreen.js';
import { renderAgriFlow } from './screens/AgriFlowScreen.js';
import { renderAquaOS } from './screens/AquaOSScreen.js';
import { renderKisan } from './screens/KisanConnectScreen.js';
import { renderFarmerConnect } from './screens/FarmerConnectScreen.js';
import { renderIntelligence } from './screens/IntelligenceScreen.js';
import { renderWeather } from './screens/WeatherScreen.js';
import { renderProfile } from './screens/ProfileScreen.js';
import { renderCommunity } from './screens/CommunityScreen.js';
import { renderNotifications } from './screens/NotificationsScreen.js';
import { renderOrders } from './screens/OrdersScreen.js';
import { renderArchitecture } from './screens/ArchitectureScreen.js';

// ===== ROUTE CONFIG =====
const ROUTES = {
  home:          { title: 'AgriHub',          icon: '🌾', render: renderHome,          nav: true },
  agriflow:      { title: 'AgriFlow',         icon: '🌾', render: renderAgriFlow,      nav: true },
  aquaos:        { title: 'AquaOS',           icon: '🐟', render: renderAquaOS,        nav: true },
  kisan:         { title: 'KisanConnect',     icon: '🤝', render: renderKisan,         nav: true },
  profile:       { title: 'Profile',          icon: '👤', render: renderProfile,       nav: true },
  farmerconnect: { title: 'FarmerConnect',    icon: '🏠', render: renderFarmerConnect,  back: 'home' },
  intelligence:  { title: 'Intelligence',     icon: '📊', render: renderIntelligence,   back: 'home' },
  weather:       { title: 'Weather',          icon: '🌤️', render: renderWeather,       back: 'home' },
  community:     { title: 'Community',        icon: '💬', render: renderCommunity,      back: 'profile' },
  notifications: { title: 'Notifications',    icon: '🔔', render: renderNotifications,  back: 'profile' },
  orders:        { title: 'Orders',           icon: '📦', render: renderOrders,          back: 'profile' },
  architecture:  { title: 'Architecture',     icon: '🏗️', render: renderArchitecture,   back: 'home' },
};

const NAV_TABS = ['home', 'agriflow', 'aquaos', 'kisan', 'profile'];
let currentRoute = 'home';
let appEl;

// ===== PUBLIC API =====
export function navigate(route) {
  if (!getState().isLoggedIn && route !== 'login') route = 'login';
  currentRoute = route;
  renderApp();
}

export function showToast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

export function showModal(html) {
  closeModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modalOverlay';
  overlay.innerHTML = `<div class="modal-sheet">${html}</div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.body.appendChild(overlay);
}

export function closeModal() {
  document.querySelector('#modalOverlay')?.remove();
}

// ===== RENDER =====
function renderApp() {
  const state = getState();

  if (!state.isLoggedIn || currentRoute === 'login') {
    appEl.innerHTML = '';
    renderLogin(appEl);
    return;
  }

  const route = ROUTES[currentRoute] || ROUTES.home;
  const isNavRoute = NAV_TABS.includes(currentRoute);

  appEl.innerHTML = `
    ${!isNavRoute ? `
      <div class="app-header">
        <button class="back-btn" id="backBtn">←</button>
        <div class="title">${route.icon} ${route.title}</div>
      </div>
    ` : ''}
    <div class="screen-content" id="screenContent"></div>
    <nav class="bottom-nav">
      ${NAV_TABS.map(key => {
        const r = ROUTES[key];
        return `<button class="nav-tab ${currentRoute === key ? 'active' : ''}" data-tab="${key}">
          <span class="nav-icon">${r.icon}</span>
          <span class="nav-label">${r.title === 'AgriHub' ? 'Home' : r.title}</span>
        </button>`;
      }).join('')}
    </nav>
  `;

  // Nav events
  appEl.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.tab));
  });

  // Back button
  appEl.querySelector('#backBtn')?.addEventListener('click', () => {
    navigate(route.back || 'home');
  });

  // Render screen content
  const content = appEl.querySelector('#screenContent');
  if (content && route.render) {
    route.render(content);
  }
}

// ===== INIT =====
async function init() {
  appEl = document.getElementById('app');

  // Check existing auth
  if (getState().isLoggedIn && api.token) {
    try {
      const res = await api.getMe();
      const user = res.user || res;
      setState({ user, isLoggedIn: true });
    } catch (e) {
      // Token expired
      api.setToken(null);
      setState({ user: null, isLoggedIn: false });
    }
  }

  // Subscribe to auth changes
  subscribe(state => {
    if (!state.isLoggedIn && currentRoute !== 'login') navigate('login');
  });

  // Initial render
  navigate(getState().isLoggedIn ? 'home' : 'login');
}

init();
