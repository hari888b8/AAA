// Global App Switcher — floating sidebar for cross-app navigation

const apps = [
  { id: '/', label: 'AgriHub Home', icon: '🌾', color: '#7b2ff7', tagline: 'India\'s Agriculture Ecosystem' },
  { id: 'agriflow', label: 'AgriFlow', icon: '🌿', color: '#7b2ff7', tagline: 'Supply Intelligence · 200+ Features' },
  { id: 'aquaos', label: 'AquaOS', icon: '🐟', color: '#00c9a7', tagline: 'Aquaculture Platform · 97+ Features' },
  { id: 'farmerconnect', label: 'FarmerConnect', icon: '🏡', color: '#2e7d32', tagline: 'Property & Land · Zero Broker' },
  { id: 'kisanconnect', label: 'KisanConnect', icon: '🚜', color: '#ff6b35', tagline: 'Rural Super-App · 4 Marketplaces' },
  { id: 'intelligence', label: 'Agri Intelligence', icon: '📊', color: '#e63946', tagline: 'National Data Engine · 93+ Features' },
  { id: 'architecture', label: 'Architecture', icon: '🏗️', color: '#f1c40f', tagline: 'System Design Blueprint' },
];

export function mountAppSwitcher() {
  // Remove existing if any
  document.getElementById('app-switcher')?.remove();

  const switcher = document.createElement('div');
  switcher.id = 'app-switcher';
  switcher.className = 'app-switcher';
  switcher.innerHTML = `
    <div class="app-switcher__toggle" id="switcher-toggle" title="Switch App">
      <span>⚡</span>
    </div>
    <div class="app-switcher__panel" id="switcher-panel">
      <div class="app-switcher__header">
        <span style="font-size:var(--fs-xs);color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;">Quick Switch</span>
        <button class="app-switcher__close" id="switcher-close">✕</button>
      </div>
      <nav class="app-switcher__nav">
        ${apps.map(a => `
          <button class="app-switcher__btn" onclick="navigate('/${a.id === '/' ? '' : a.id}');document.getElementById('switcher-panel').classList.remove('app-switcher__panel--open')" data-app="${a.id}" style="--app-color:${a.color}">
            <span class="app-switcher__icon">${a.icon}</span>
            <div style="text-align:left">
              <span class="app-switcher__label">${a.label}</span>
              <div style="font-size:9px;opacity:0.65;margin-top:1px">${a.tagline}</div>
            </div>
          </button>
        `).join('')}
      </nav>
    </div>
  `;
  document.body.appendChild(switcher);

  // Toggle
  document.getElementById('switcher-toggle').addEventListener('click', () => {
    document.getElementById('switcher-panel').classList.toggle('app-switcher__panel--open');
  });
  document.getElementById('switcher-close').addEventListener('click', () => {
    document.getElementById('switcher-panel').classList.remove('app-switcher__panel--open');
  });

  // Highlight active
  highlightActive();
}

export function highlightActive() {
  const path = window.location.hash.slice(1) || '/';
  document.querySelectorAll('.app-switcher__btn').forEach(btn => {
    const id = '/' + (btn.dataset.app === '/' ? '' : btn.dataset.app);
    btn.classList.toggle('app-switcher__btn--active', path === id || (path === '/' && btn.dataset.app === '/'));
  });
}
