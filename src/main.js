import './styles/app.css';

import { api } from './api.js';
import { getState, setState, subscribe, getRole } from './store.js';
import { t, getLang, setLang, LANGUAGES } from './i18n.js';
import { activateLazyImages } from './utils/perf.js';
import { attachPullToRefresh } from './utils/pullRefresh.js';
import { installErrorBoundary } from './utils/errors.js';
import { renderLogin } from './screens/LoginScreen.js';
import { renderHome } from './screens/HomeScreen.js';
import { renderAgriHub } from './screens/AgriHubScreen.js';
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
import { renderAgriGalaxy } from './screens/AgriGalaxyScreen.js';
import { renderBhoomiOS } from './screens/BhoomiOSScreen.js';
import { renderChat } from './screens/ChatScreen.js';
import { renderAdmin } from './screens/AdminScreen.js';
import { renderFarmDiary } from './screens/FarmDiaryScreen.js';
import { renderSchemes } from './screens/SchemesScreen.js';
import { renderJobs } from './screens/JobsScreen.js';
import { renderTraining } from './screens/TrainingScreen.js';
import { renderWallet } from './screens/WalletScreen.js';
import { renderSchemeDiscovery } from './screens/SchemeDiscoveryScreen.js';
import { renderCropDoctor } from './screens/CropDoctorScreen.js';
import { renderSubscriptions } from './screens/SubscriptionsScreen.js';
import { renderFavorites } from './screens/FavoritesScreen.js';
import { renderTickets } from './screens/TicketsScreen.js';
import { renderEscrow } from './screens/EscrowScreen.js';
import { renderWatchlists } from './screens/WatchlistsScreen.js';
import { renderFPODashboard } from './screens/FPODashboardScreen.js';
import { renderLogistics } from './screens/LogisticsScreen.js';
import { renderInputs } from './screens/InputsScreen.js';
import { renderCropPlanning } from './screens/CropPlanningScreen.js';
import { renderContract } from './screens/ContractScreen.js';
import { renderTrustScore } from './screens/TrustScoreScreen.js';
import { renderSatellite } from './screens/SatelliteScreen.js';
import { renderFinance } from './screens/FinanceScreen.js';
import { renderAgentDashboard } from './screens/AgentDashboardScreen.js';
import { renderExporter } from './screens/ExporterScreen.js';
import { renderAnalytics } from './screens/AnalyticsScreen.js';
import { renderExecutionNetwork } from './screens/ExecutionNetworkScreen.js';
import { renderDemandEngine } from './screens/DemandEngineScreen.js';
import { renderHyperlocal } from './screens/HyperlocalScreen.js';
import { renderVoiceAssist } from './screens/VoiceAssistScreen.js';
import { renderCropLifecycle } from './screens/CropLifecycleScreen.js';
import { renderToolsHub } from './screens/ToolsHubScreen.js';
import { renderDistrictPilot } from './screens/DistrictPilotScreen.js';

// ===== ROUTE CONFIG =====
//
// AgriHub Platform:
//   🐟 AquaOS        — Standalone aquaculture app (aqua farmer, aqua buyer, input supplier)
//   🌾 Agri          — Umbrella section: AgriFlow + Community + Weather + Farmers + FPOs
//                  “Agri Intelligence” = data engine inside Agri, NOT a separate app
//   🚜 KisanConnect   — Standalone rural super-app (all roles)
//
// Buyer subscribes selectively: aqua-only / agri-only / both
//
const ROUTES = {
  // ── Bottom-nav routes ───────────────────────────────────────
  home:          { title: 'Home',          icon: '🏠', render: renderHome,         nav: true },
  agrigalaxy:    { title: 'AgriGalaxy',    icon: '🌐', render: renderAgriGalaxy,   nav: true },
  aquaos:        { title: 'AquaOS',        icon: '🐟', render: renderAquaOS,       nav: true },
  agri:          { title: 'Agri',          icon: '🌾', render: renderAgriHub,      nav: true },
  kisan:         { title: 'Kisan',         icon: '🚜', render: renderKisan,        nav: true },
  bhoomios:      { title: 'Bhoomi',        icon: '🏡', render: renderBhoomiOS,     nav: true },
  profile:       { title: 'Profile',       icon: '👤', render: renderProfile,      nav: true },
  community:     { title: 'Community',     icon: '💬', render: renderCommunity,    nav: true },

  // ── Non-tab routes (accessed from within sections) ──────────────────────────
  agriflow:      { title: 'AgriFlow',      icon: '🌾', render: renderAgriFlow,     back: 'agri'    },
  intelligence:  { title: 'My Agri Hub',   icon: '📊', render: renderIntelligence, back: 'agri'    },
  weather:       { title: 'Weather',       icon: '🌤️', render: renderWeather,      back: 'agri'    },
  farmerconnect: { title: 'FarmerConnect', icon: '🏡', render: renderFarmerConnect,back: 'home'    },
  notifications: { title: 'Notifications', icon: '🔔', render: renderNotifications,back: 'profile' },
  orders:        { title: 'Orders',        icon: '📦', render: renderOrders,       back: 'profile' },
  chat:          { title: 'Messages',      icon: '💬', render: renderChat,         back: 'home'    },
  architecture:  { title: 'Platform Map',  icon: '🏗️', render: renderArchitecture, back: 'home'   },
  admin:         { title: 'Admin',         icon: '🛡️', render: renderAdmin,        back: 'profile' },
  farmdiary:     { title: 'Farm Diary',    icon: '📓', render: renderFarmDiary,    back: 'home'    },
  schemes:       { title: 'Schemes',       icon: '🏛️', render: renderSchemes,      back: 'home'    },
  jobs:          { title: 'Agri Jobs',     icon: '👷', render: renderJobs,         back: 'home'    },
  training:      { title: 'Training',      icon: '🎓', render: renderTraining,     back: 'home'    },
  wallet:        { title: 'Wallet',        icon: '💎', render: renderWallet,       back: 'profile' },
  schemediscovery: { title: 'Schemes AI',  icon: '🏛️', render: renderSchemeDiscovery, back: 'home' },
  cropdoctor:    { title: 'Crop Doctor',   icon: '🩺', render: renderCropDoctor,   back: 'home'    },
  subscriptions: { title: 'Plans',         icon: '⭐', render: renderSubscriptions,back: 'profile' },
  favorites:     { title: 'Favorites',     icon: '❤️', render: renderFavorites,    back: 'profile' },
  tickets:       { title: 'Support',       icon: '🎫', render: renderTickets,      back: 'profile' },
  escrow:        { title: 'Escrow',        icon: '🔐', render: renderEscrow,       back: 'orders'  },
  watchlists:    { title: 'Watchlists',    icon: '👁️', render: renderWatchlists,   back: 'home'    },
  fpodashboard:  { title: 'FPO Hub',       icon: '🏢', render: renderFPODashboard, back: 'home'    },
  logistics:     { title: 'Logistics',     icon: '🚚', render: renderLogistics,    back: 'home'    },
  inputs:        { title: 'Agri Inputs',   icon: '🌱', render: renderInputs,       back: 'home'    },
  cropplanning:  { title: 'Crop Plan AI',  icon: '🧠', render: renderCropPlanning, back: 'farmdiary' },
  contracts:     { title: 'Contracts',     icon: '📝', render: renderContract,     back: 'home'    },
  trustscore:    { title: 'Trust Score',   icon: '⭐', render: renderTrustScore,   back: 'profile' },
  satellite:     { title: 'Satellite',     icon: '🛰️', render: renderSatellite,    back: 'farmdiary' },
  finance:       { title: 'Finance',       icon: '💰', render: renderFinance,      back: 'home'    },
  agentdashboard:{ title: 'Agent Hub',     icon: '🤝', render: renderAgentDashboard, back: 'home'  },
  exporter:      { title: 'Exporter',      icon: '🌍', render: renderExporter,     back: 'home'    },
  analytics:     { title: 'Analytics',     icon: '📊', render: renderAnalytics,    back: 'home'    },
  executionnetwork: { title: 'Execution Network', icon: '🌾', render: renderExecutionNetwork, back: 'home' },
  demandengine:  { title: 'Demand Engine', icon: '🎯', render: renderDemandEngine, back: 'home'    },
  hyperlocal:    { title: 'Local Market',  icon: '📍', render: renderHyperlocal,   back: 'home'    },
  voiceassist:   { title: 'Voice & Assist',icon: '🎙️', render: renderVoiceAssist,  back: 'home'    },
  croplifecycle: { title: 'Crop Lifecycle',icon: '🔄', render: renderCropLifecycle,back: 'home'    },
  toolshub:      { title: 'Tools Hub',     icon: '🧰', render: renderToolsHub,     back: 'home'    },
  districtpilot: { title: 'District Pilot',icon: '🏘️', render: renderDistrictPilot,back: 'home'    },
};

// ─── Role-based nav — always 5 tabs ─────────────────────────────────────────────────────────
//  Farmer           → Home | AgriGalaxy | Agri | Kisan | Bhoomi
//  FPO              → Home | Agri | Kisan | Bhoomi | Community
//  Buyer            → Home | AquaOS | Agri | Kisan | Profile
//  Input Supplier   → Home | AgriGalaxy | AquaOS | Community | Profile
//  Service Provider → Home | Agri | Kisan | Community | Profile
// ─────────────────────────────────────────────────────────────────────
function getNavTabs() {
  const role = getRole();
  if (role === 'fpo')              return ['home', 'agri',       'kisan',    'bhoomios',   'community'];
  if (role === 'supplier')         return ['home', 'agrigalaxy', 'aquaos',   'community',  'profile'];
  if (role === 'service_provider') return ['home', 'agri',       'kisan',    'community',  'profile'];
  if (role === 'buyer')            return ['home', 'aquaos',     'agri',     'kisan',      'profile'];
  // farmer: sees AgriGalaxy, Agri umbrella, Kisan equipment, Bhoomi land
  return ['home', 'agrigalaxy', 'agri', 'kisan', 'bhoomios'];
}
let currentRoute = 'home';
let appEl;

// ===== PUBLIC API (re-exported from app-shell) =====
export { showToast, showModal, closeModal } from './app-shell.js';
import { _registerNavigator } from './app-shell.js';

export function navigate(route) {
  if (!getState().isLoggedIn && route !== 'login') route = 'login';
  currentRoute = route;
  renderApp();
}
_registerNavigator(navigate);

// Global navigateBack for screens that use it
window.navigateBack = () => {
  const route = ROUTES[currentRoute];
  if (route?.back) navigate(route.back);
  else navigate('home');
};

// ===== RENDER =====
function renderApp() {
  const state = getState();

  if (!state.isLoggedIn || currentRoute === 'login') {
    appEl.innerHTML = '';
    renderLogin(appEl);
    return;
  }

  const route = ROUTES[currentRoute] || ROUTES.home;
  const navTabs = getNavTabs();
  const isNavRoute = navTabs.includes(currentRoute);

  appEl.innerHTML = `
    ${!isNavRoute ? `
      <div class="app-header">
        <button class="back-btn" id="backBtn">←</button>
        <div class="title">${route.icon} ${route.title}</div>
      </div>
    ` : ''}
    <div class="screen-content" id="screenContent"></div>
    <!-- HAMBURGER MENU BUTTON (floating) -->
    <button id="hamburgerBtn" style="position:fixed;top:12px;right:14px;z-index:999;width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,0.25);backdrop-filter:blur(8px);border:none;color:white;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center">☰</button>
    <!-- SIDE MENU OVERLAY -->
    <div id="sideMenu" class="side-menu-container" style="visibility:hidden;position:fixed;inset:0;z-index:9999">
      <div id="menuOverlay" class="side-menu-backdrop" style="position:absolute;inset:0;background:rgba(0,0,0,0.5)"></div>
      <div class="side-menu-panel" style="position:absolute;top:0;right:0;width:280px;height:100%;background:white;box-shadow:-4px 0 20px rgba(0,0,0,0.15);overflow-y:auto;padding:0">
        <div style="background:linear-gradient(135deg,#1a237e,#311b92);color:white;padding:20px 16px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <div style="font-weight:800;font-size:16px">AgriHub</div>
            <button id="closeMenuBtn" style="background:rgba(255,255,255,0.2);border:none;color:white;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:14px">✕</button>
          </div>
          <div style="font-weight:700">${state.user?.name || 'User'}</div>
          <div style="font-size:12px;opacity:0.8">${state.user?.phone || ''} · ${getRole()}</div>
        </div>
        <div style="padding:8px 0">
          <div style="padding:4px 16px;font-size:10px;font-weight:700;color:#9E9E9E;text-transform:uppercase;letter-spacing:0.5px;margin-top:8px">${t('platforms') || 'Platforms'}</div>
          ${[
            {icon:'🏠',label:t('home')||'Home',route:'home'},
            {icon:'🌐',label:t('agrigalaxy')||'AgriGalaxy',route:'agrigalaxy'},
            {icon:'🐟',label:t('aquaos')||'AquaOS',route:'aquaos'},
            {icon:'🌾',label:t('agri')||'Agri',route:'agri'},
            {icon:'🚜',label:t('kisan')||'KisanConnect',route:'kisan'},
            {icon:'🏡',label:t('bhoomios')||'BhoomiOS',route:'bhoomios'},
          ].map(m=>`<button class="menu-nav-btn" data-route="${m.route}" style="display:flex;align-items:center;gap:12px;width:100%;padding:12px 16px;border:none;background:${currentRoute===m.route?'#E8EAF620':'transparent'};cursor:pointer;text-align:left;font-size:13px;font-weight:${currentRoute===m.route?'700':'500'};color:${currentRoute===m.route?'#1a237e':'#424242'}"><span style="font-size:18px">${m.icon}</span>${m.label}</button>`).join('')}
          <div style="height:1px;background:#E0E0E0;margin:8px 16px"></div>
          <div style="padding:4px 16px;font-size:10px;font-weight:700;color:#9E9E9E;text-transform:uppercase;letter-spacing:0.5px;margin-top:8px">${t('account') || 'Account'}</div>
          ${[
            {icon:'👤',label:t('profile')||'Profile & Settings',route:'profile'},
            {icon:'�',label:t('messages')||'Messages',route:'chat'},
            {icon:'�🔔',label:t('notifications')||'Notifications',route:'notifications'},
            {icon:'📦',label:t('orders')||'Orders',route:'orders'},
            {icon:'🏗️',label:t('platform_map')||'Platform Map',route:'architecture'},
            {icon:'💬',label:t('community')||'Community',route:'community'},
          ].map(m=>`<button class="menu-nav-btn" data-route="${m.route}" style="display:flex;align-items:center;gap:12px;width:100%;padding:12px 16px;border:none;background:transparent;cursor:pointer;text-align:left;font-size:13px;color:#424242"><span style="font-size:18px">${m.icon}</span>${m.label}</button>`).join('')}
          <div style="height:1px;background:#E0E0E0;margin:8px 16px"></div>
          <div style="padding:4px 16px;font-size:10px;font-weight:700;color:#C62828;text-transform:uppercase;letter-spacing:0.5px;margin-top:8px">⚡ Core Engine</div>
          ${[
            {icon:'🌾',label:'Trade (AgriFlow)',route:'agriflow'},
            {icon:'🎯',label:'Demand Engine',route:'demandengine'},
            {icon:'📝',label:'Contracts',route:'contracts'},
            {icon:'🚚',label:'Logistics',route:'logistics'},
            {icon:'🌾',label:'Execution Network',route:'executionnetwork'},
            {icon:'📍',label:'Hyperlocal Market',route:'hyperlocal'},
            {icon:'💰',label:'Finance & Escrow',route:'finance'},
            {icon:'🤝',label:'Agent Hub',route:'agentdashboard'},
            {icon:'🏘️',label:'District Pilot',route:'districtpilot'},
          ].map(m=>`<button class="menu-nav-btn" data-route="${m.route}" style="display:flex;align-items:center;gap:12px;width:100%;padding:12px 16px;border:none;background:transparent;cursor:pointer;text-align:left;font-size:13px;color:#424242"><span style="font-size:18px">${m.icon}</span>${m.label}</button>`).join('')}
          <div style="height:1px;background:#E0E0E0;margin:8px 16px"></div>
          <div style="padding:4px 16px;font-size:10px;font-weight:700;color:#2E7D32;text-transform:uppercase;letter-spacing:0.5px;margin-top:8px">🌱 Farm OS</div>
          ${[
            {icon:'🏡',label:'BhoomiOS (Land)',route:'bhoomios'},
            {icon:'🐟',label:'AquaOS (Aqua)',route:'aquaos'},
            {icon:'📓',label:'Farm Diary',route:'farmdiary'},
            {icon:'🩺',label:'Crop Doctor',route:'cropdoctor'},
            {icon:'🌤️',label:'Weather & Advisory',route:'weather'},
            {icon:'🛰️',label:'Satellite',route:'satellite'},
            {icon:'🔄',label:'Crop Lifecycle',route:'croplifecycle'},
            {icon:'🎙️',label:'Voice & Assist',route:'voiceassist'},
          ].map(m=>`<button class="menu-nav-btn" data-route="${m.route}" style="display:flex;align-items:center;gap:12px;width:100%;padding:12px 16px;border:none;background:transparent;cursor:pointer;text-align:left;font-size:13px;color:#424242"><span style="font-size:18px">${m.icon}</span>${m.label}</button>`).join('')}
          <div style="height:1px;background:#E0E0E0;margin:8px 16px"></div>
          <div style="padding:4px 16px;font-size:10px;font-weight:700;color:#1565C0;text-transform:uppercase;letter-spacing:0.5px;margin-top:8px">🧰 Tools & Utilities</div>
          ${[
            {icon:'🧰',label:'Agri Tools Hub',route:'toolshub'},
            {icon:'🏛️',label:'Govt Schemes',route:'schemes'},
            {icon:'🎓',label:'Training',route:'training'},
            {icon:'👷',label:'Agri Jobs',route:'jobs'},
            {icon:'⭐',label:'Subscriptions',route:'subscriptions'},
            {icon:'🎫',label:'Support',route:'tickets'},
          ].map(m=>`<button class="menu-nav-btn" data-route="${m.route}" style="display:flex;align-items:center;gap:12px;width:100%;padding:12px 16px;border:none;background:transparent;cursor:pointer;text-align:left;font-size:13px;color:#424242"><span style="font-size:18px">${m.icon}</span>${m.label}</button>`).join('')}
          <div style="height:1px;background:#E0E0E0;margin:8px 16px"></div>
          <button id="logoutMenuBtn" style="display:flex;align-items:center;gap:12px;width:100%;padding:12px 16px;border:none;background:transparent;cursor:pointer;text-align:left;font-size:13px;color:#C62828"><span style="font-size:18px">🚪</span>${t('logout') || 'Logout'}</button>
        </div>
      </div>
    </div>
    <nav class="bottom-nav bottom-nav-v2">
      ${navTabs.map(key => {
        const r = ROUTES[key];
        const agriSubRoutes = ['agri', 'agriflow', 'intelligence', 'weather', 'community'];
        const isActive = currentRoute === key || (key === 'agri' && agriSubRoutes.includes(currentRoute));
        return `<button class="nav-tab ${isActive ? 'active' : ''}" data-tab="${key}">
          <span class="nav-icon">${r.icon}</span>
          <span class="nav-label">${t(key) || r.title}</span>
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

  // Hamburger menu — animated slide-in
  const sideMenu = appEl.querySelector('#sideMenu');
  const menuPanel = sideMenu?.querySelector('.side-menu-panel');
  const menuBackdrop = sideMenu?.querySelector('.side-menu-backdrop');

  function openMenu() {
    if (!sideMenu) return;
    sideMenu.style.visibility = 'visible';
    requestAnimationFrame(() => {
      menuBackdrop.style.opacity = '1';
      menuPanel.style.transform = 'translateX(0)';
    });
  }
  function closeMenu() {
    if (!sideMenu) return;
    menuBackdrop.style.opacity = '0';
    menuPanel.style.transform = 'translateX(100%)';
    setTimeout(() => { sideMenu.style.visibility = 'hidden'; }, 350);
  }

  appEl.querySelector('#hamburgerBtn')?.addEventListener('click', openMenu);
  appEl.querySelector('#menuOverlay')?.addEventListener('click', closeMenu);
  appEl.querySelector('#closeMenuBtn')?.addEventListener('click', closeMenu);
  appEl.querySelectorAll('.menu-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      closeMenu();
      setTimeout(() => navigate(btn.dataset.route), 150);
    });
  });
  appEl.querySelector('#logoutMenuBtn')?.addEventListener('click', () => {
    closeMenu();
    setTimeout(() => {
      api.setToken(null);
      setState({ isLoggedIn: false, user: null });
      navigate('login');
    }, 150);
  });

  // Render screen content
  const content = appEl.querySelector('#screenContent');
  if (content && route.render) {
    route.render(content);
    requestAnimationFrame(() => activateLazyImages(content));
    // Attach pull-to-refresh to screen content
    attachPullToRefresh(content, async () => {
      if (route.render) route.render(content);
      requestAnimationFrame(() => activateLazyImages(content));
    });
  }
}

// ===== INIT =====
async function init() {
  installErrorBoundary();
  appEl = document.getElementById('app');

  // Restore saved theme preference
  const savedTheme = localStorage.getItem('agri_theme');
  if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);

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

  // Dismiss splash screen with smooth animation
  dismissSplash();
}

function dismissSplash() {
  const splash = document.getElementById('splashScreen');
  if (!splash) return;
  // Allow a brief delay so the splash feels intentional
  setTimeout(() => {
    splash.classList.add('hide');
    setTimeout(() => splash.remove(), 600);
  }, 800);
}

init();
