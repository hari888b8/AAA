import { api } from '../api.js';
import { navigate } from '../main.js';

export function renderFavorites(container) {
  container.innerHTML = `
    <div style="padding:16px;max-width:600px;margin:0 auto">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
        <span style="font-size:28px">❤️</span>
        <h2 style="margin:0;font-size:18px;font-weight:800;color:#212121">My Favorites</h2>
      </div>
      <div id="filterTabs" style="display:flex;gap:8px;margin-bottom:16px;overflow-x:auto;padding-bottom:4px"></div>
      <div id="favList" style="display:flex;flex-direction:column;gap:10px"></div>
      <div id="favLoading" style="text-align:center;padding:40px;color:#999">Loading...</div>
    </div>`;

  const types = [
    { key: '', label: 'All', icon: '📋' },
    { key: 'property', label: 'Properties', icon: '🏠' },
    { key: 'supply_listing', label: 'Crops', icon: '🌾' },
    { key: 'equipment', label: 'Equipment', icon: '🚜' },
    { key: 'service', label: 'Services', icon: '🔧' },
    { key: 'harvest_listing', label: 'Aqua', icon: '🐟' },
    { key: 'job', label: 'Jobs', icon: '👷' },
  ];

  let activeType = '';
  const tabsEl = container.querySelector('#filterTabs');
  tabsEl.innerHTML = types.map(t => `
    <button class="fav-tab" data-type="${t.key}" style="white-space:nowrap;padding:6px 14px;border-radius:20px;border:1px solid ${t.key === '' ? '#1a237e' : '#E0E0E0'};background:${t.key === '' ? '#1a237e' : 'white'};color:${t.key === '' ? 'white' : '#666'};font-size:12px;font-weight:600;cursor:pointer">${t.icon} ${t.label}</button>
  `).join('');

  tabsEl.querySelectorAll('.fav-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeType = btn.dataset.type;
      tabsEl.querySelectorAll('.fav-tab').forEach(b => {
        const isActive = b.dataset.type === activeType;
        b.style.background = isActive ? '#1a237e' : 'white';
        b.style.color = isActive ? 'white' : '#666';
        b.style.borderColor = isActive ? '#1a237e' : '#E0E0E0';
      });
      loadFavorites(container, activeType);
    });
  });

  loadFavorites(container, activeType);
}

async function loadFavorites(container, type) {
  const listEl = container.querySelector('#favList');
  const loadingEl = container.querySelector('#favLoading');
  loadingEl.style.display = 'block';
  listEl.innerHTML = '';

  try {
    const res = await api.getFavorites(type);
    const favorites = res.favorites || [];
    loadingEl.style.display = 'none';

    if (favorites.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center;padding:40px;color:#999">
          <div style="font-size:40px;margin-bottom:8px">💔</div>
          <div style="font-size:14px;font-weight:600">No favorites yet</div>
          <div style="font-size:12px;margin-top:4px">Browse listings and tap ❤️ to save them here</div>
        </div>`;
      return;
    }

    listEl.innerHTML = favorites.map(fav => {
      const typeIcons = { property: '🏠', supply_listing: '🌾', equipment: '🚜', service: '🔧', harvest_listing: '🐟', job: '👷' };
      const icon = typeIcons[fav.listing_type] || '📌';
      const typeLabel = fav.listing_type.replace(/_/g, ' ');
      const date = new Date(fav.created_at).toLocaleDateString('en-IN');
      return `
        <div style="background:white;border-radius:12px;padding:14px;border:1px solid #F0F0F0;display:flex;align-items:center;gap:12px;box-shadow:0 1px 4px rgba(0,0,0,0.04)">
          <div style="width:42px;height:42px;border-radius:10px;background:#F5F5F5;display:flex;align-items:center;justify-content:center;font-size:20px">${icon}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600;color:#212121;text-transform:capitalize">${typeLabel}</div>
            <div style="font-size:11px;color:#999;margin-top:2px">Saved on ${date}</div>
            ${fav.notes ? `<div style="font-size:11px;color:#666;margin-top:2px;font-style:italic">${fav.notes}</div>` : ''}
          </div>
          <button class="remove-fav-btn" data-id="${fav.id}" style="background:#FFEBEE;border:none;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center">🗑️</button>
        </div>`;
    }).join('');

    listEl.querySelectorAll('.remove-fav-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('Remove from favorites?')) {
          await api.removeFavorite(btn.dataset.id);
          loadFavorites(container, type);
        }
      });
    });

  } catch (e) {
    loadingEl.textContent = 'Failed to load favorites';
  }
}
