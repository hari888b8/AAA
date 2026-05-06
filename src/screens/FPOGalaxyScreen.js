import { api } from '../api.js';
import { navigate, showToast } from '../app-shell.js';
import { t } from '../i18n.js';

/**
 * FPO Galaxy — Public Directory of all FPOs for Buyers
 *
 * Features:
 *   - Grid/card view of all FPOs
 *   - Search by name, crop, district
 *   - Filter by state, district, crop, verified
 *   - Sort by member count, acreage, active listings
 *   - Quick stats bar (total FPOs, farmers, acres)
 *   - Click into individual FPO portfolio
 */

export function renderFPOGalaxy(container) {
  let fpos = [];
  let stats = { total_fpos: 0, total_farmers: 0, total_active_farmers: 0 };
  let searchQ = '';
  let stateFilter = '';
  let cropFilter = '';
  let sortBy = 'member_count';
  let isLoading = true;

  const CROP_ICONS = {
    'Paddy': '🌾', 'Rice': '🌾', 'Wheat': '🌾', 'Maize': '🌽', 'Cotton': '🏵️',
    'Groundnut': '🥜', 'Chilli': '🌶️', 'Tomato': '🍅', 'Onion': '🧅',
    'Mango': '🥭', 'Banana': '🍌', 'Coconut': '🥥', 'Sugarcane': '🎋',
    'Turmeric': '🟡', 'Pulses': '🫘', 'Soybean': '🫛', 'Sunflower': '🌻',
    default: '🌱'
  };

  function getCropIcon(crop) {
    if (!crop) return CROP_ICONS.default;
    for (const [key, icon] of Object.entries(CROP_ICONS)) {
      if (crop.toLowerCase().includes(key.toLowerCase())) return icon;
    }
    return CROP_ICONS.default;
  }

  async function loadData() {
    isLoading = true;
    render();
    try {
      const params = new URLSearchParams();
      if (searchQ) params.set('search', searchQ);
      if (stateFilter) params.set('state', stateFilter);
      if (cropFilter) params.set('crop', cropFilter);
      params.set('sort_by', sortBy);
      params.set('limit', '100');

      const res = await api(`fpo/public/directory?${params.toString()}`).catch(() => ({ fpos: [], stats: {} }));
      fpos = res.fpos || [];
      stats = res.stats || { total_fpos: 0, total_farmers: 0, total_active_farmers: 0 };
    } catch (err) {
      showToast('Failed to load FPO directory', 'error');
    }
    isLoading = false;
    render();
  }

  function render() {
    const states = [...new Set(fpos.map(f => f.state || f.state_name).filter(Boolean))].sort();

    container.innerHTML = `
      <div style="min-height:100vh;background:#f5f7fa;">
        <!-- Hero Header -->
        <div style="background:linear-gradient(135deg,#1B5E20,#2E7D32,#43A047);padding:24px 16px 20px;color:#fff;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
            <button onclick="window.navigateBack?.()" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer;">←</button>
            <div>
              <h1 style="margin:0;font-size:20px;font-weight:800;">🌐 FPO Galaxy</h1>
              <p style="margin:2px 0 0;font-size:12px;opacity:0.9;">Discover FPOs • Source Direct from Farmers</p>
            </div>
          </div>

          <!-- Quick Stats -->
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:12px;">
            <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px;text-align:center;backdrop-filter:blur(4px);">
              <div style="font-size:20px;font-weight:800;">${stats.total_fpos || fpos.length}</div>
              <div style="font-size:10px;opacity:0.85;">FPOs</div>
            </div>
            <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px;text-align:center;backdrop-filter:blur(4px);">
              <div style="font-size:20px;font-weight:800;">${formatNumber(stats.total_farmers)}</div>
              <div style="font-size:10px;opacity:0.85;">Farmers</div>
            </div>
            <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px;text-align:center;backdrop-filter:blur(4px);">
              <div style="font-size:20px;font-weight:800;">${formatNumber(getTotalAcres())}</div>
              <div style="font-size:10px;opacity:0.85;">Acres</div>
            </div>
          </div>
        </div>

        <!-- Search & Filters -->
        <div style="padding:12px 14px 0;">
          <!-- Search Bar -->
          <div style="display:flex;align-items:center;background:#fff;border:1px solid #E0E0E0;border-radius:12px;padding:10px 14px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
            <span style="margin-right:8px;font-size:16px;">🔍</span>
            <input id="fpoSearch" type="search" placeholder="Search FPOs by name, crop, district…" value="${searchQ}"
              style="border:none;outline:none;flex:1;font-size:13px;background:transparent;font-family:inherit;">
          </div>

          <!-- Filter Pills -->
          <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:8px;margin-bottom:8px;">
            <select id="stateFilter" style="padding:6px 10px;border-radius:20px;border:1px solid #E0E0E0;font-size:12px;background:#fff;cursor:pointer;">
              <option value="">All States</option>
              ${states.map(s => `<option value="${s}" ${stateFilter === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
            <select id="sortFilter" style="padding:6px 10px;border-radius:20px;border:1px solid #E0E0E0;font-size:12px;background:#fff;cursor:pointer;">
              <option value="member_count" ${sortBy === 'member_count' ? 'selected' : ''}>Most Farmers</option>
              <option value="acreage" ${sortBy === 'acreage' ? 'selected' : ''}>Most Acreage</option>
              <option value="listings" ${sortBy === 'listings' ? 'selected' : ''}>Most Listings</option>
              <option value="name" ${sortBy === 'name' ? 'selected' : ''}>Name A-Z</option>
            </select>
            ${cropFilter ? `<button id="clearCrop" style="padding:6px 10px;border-radius:20px;border:1px solid #43A047;background:#E8F5E9;color:#2E7D32;font-size:12px;cursor:pointer;white-space:nowrap;">🌱 ${cropFilter} ✕</button>` : ''}
          </div>
        </div>

        <!-- FPO Cards -->
        <div style="padding:0 14px 80px;">
          ${isLoading ? '<div style="text-align:center;padding:40px;"><div class="spinner"></div><p style="color:#757575;margin-top:12px;">Loading FPOs…</p></div>' : ''}
          ${!isLoading && fpos.length === 0 ? '<div style="text-align:center;padding:40px;color:#757575;"><p style="font-size:40px;">🏢</p><p>No FPOs found</p></div>' : ''}
          ${!isLoading ? fpos.map(fpo => renderFPOCard(fpo)).join('') : ''}
        </div>
      </div>
    `;
    attachEvents();
  }

  function renderFPOCard(fpo) {
    const crops = fpo.primary_crops || [];
    const topCrops = crops.slice(0, 4);
    const totalAcres = parseFloat(fpo.total_acres || 0);

    return `
      <div class="fpo-card" data-fpoid="${fpo.id}" style="background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;border:1px solid #E8E8E8;box-shadow:0 2px 8px rgba(0,0,0,0.04);cursor:pointer;transition:transform 0.15s,box-shadow 0.15s;">
        <!-- Header Row -->
        <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px;">
          <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#E8F5E9,#C8E6C9);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">🏢</div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:700;font-size:14px;color:#1B5E20;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${fpo.fpo_name || 'Unnamed FPO'}</div>
            <div style="font-size:11px;color:#757575;margin-top:2px;">📍 ${fpo.district_name || fpo.block || ''}, ${fpo.state_name || fpo.state || ''}</div>
            ${fpo.year_established ? `<div style="font-size:10px;color:#9E9E9E;margin-top:1px;">Est. ${fpo.year_established}</div>` : ''}
          </div>
          ${fpo.registration_number ? '<span style="background:#E8F5E9;color:#2E7D32;font-size:10px;padding:3px 8px;border-radius:10px;font-weight:600;">✓ Verified</span>' : ''}
        </div>

        <!-- Stats Row -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:10px;">
          <div style="text-align:center;background:#F5F5F5;border-radius:8px;padding:8px 4px;">
            <div style="font-weight:700;font-size:15px;color:#1565C0;">👥 ${fpo.member_count || 0}</div>
            <div style="font-size:9px;color:#757575;">Farmers</div>
          </div>
          <div style="text-align:center;background:#F5F5F5;border-radius:8px;padding:8px 4px;">
            <div style="font-weight:700;font-size:15px;color:#E65100;">🌾 ${formatNumber(totalAcres)}</div>
            <div style="font-size:9px;color:#757575;">Acres</div>
          </div>
          <div style="text-align:center;background:#F5F5F5;border-radius:8px;padding:8px 4px;">
            <div style="font-weight:700;font-size:15px;color:#2E7D32;">📋 ${fpo.active_listings || 0}</div>
            <div style="font-size:9px;color:#757575;">Listings</div>
          </div>
        </div>

        <!-- Crops -->
        ${topCrops.length > 0 ? `
          <div style="display:flex;flex-wrap:wrap;gap:4px;">
            ${topCrops.map(c => `<span style="background:#FFF8E1;border:1px solid #FFE082;border-radius:12px;padding:3px 8px;font-size:11px;color:#F57F17;">${getCropIcon(c)} ${c}</span>`).join('')}
            ${crops.length > 4 ? `<span style="color:#9E9E9E;font-size:11px;padding:3px 4px;">+${crops.length - 4} more</span>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  function getTotalAcres() {
    return fpos.reduce((sum, f) => sum + parseFloat(f.total_acres || 0), 0);
  }

  function formatNumber(num) {
    const n = parseFloat(num) || 0;
    if (n >= 100000) return (n / 100000).toFixed(1) + 'L';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return Math.round(n).toString();
  }

  function attachEvents() {
    const searchInput = container.querySelector('#fpoSearch');
    if (searchInput) {
      let debounce;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounce);
        debounce = setTimeout(() => { searchQ = e.target.value; loadData(); }, 400);
      });
    }

    const stateSelect = container.querySelector('#stateFilter');
    if (stateSelect) stateSelect.addEventListener('change', (e) => { stateFilter = e.target.value; loadData(); });

    const sortSelect = container.querySelector('#sortFilter');
    if (sortSelect) sortSelect.addEventListener('change', (e) => { sortBy = e.target.value; loadData(); });

    const clearCropBtn = container.querySelector('#clearCrop');
    if (clearCropBtn) clearCropBtn.addEventListener('click', () => { cropFilter = ''; loadData(); });

    // Card clicks → navigate to portfolio
    container.querySelectorAll('.fpo-card').forEach(card => {
      card.addEventListener('click', () => {
        const fpoId = card.dataset.fpoid;
        if (fpoId) navigate('fpoportfolio?id=' + fpoId);
      });
    });
  }

  loadData();
}
