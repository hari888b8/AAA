import { api } from '../api.js';
import { navigate, showToast } from '../app-shell.js';
import { t } from '../i18n.js';

/**
 * FPO Portfolio — Public portfolio page for a single FPO
 *
 * Shows complete FPO information for buyers:
 *   - Header with FPO identity & verification
 *   - Farmer stats (total, active, new joiners)
 *   - Products/Crops produced with icons
 *   - Total land & acreage
 *   - Expected yield per crop
 *   - Current inventory
 *   - Active supply listings with prices
 *   - Trust & certifications
 *   - Contact info
 */

export function renderFPOPortfolio(container) {
  let portfolio = null;
  let isLoading = true;
  let activeSection = 'overview';

  // Extract FPO ID from route params
  const params = new URLSearchParams(window._routeParams || '');
  const fpoId = params.get('id') || window._fpoPortfolioId;

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

  async function loadPortfolio() {
    if (!fpoId) { isLoading = false; render(); return; }
    isLoading = true;
    render();
    try {
      portfolio = await api(`fpo/public/${fpoId}/portfolio`).catch(() => null);
    } catch (err) {
      showToast('Failed to load FPO portfolio', 'error');
    }
    isLoading = false;
    render();
  }

  function render() {
    if (isLoading) {
      container.innerHTML = `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f5f7fa;"><div class="spinner"></div></div>`;
      return;
    }

    if (!portfolio || !portfolio.profile) {
      container.innerHTML = `
        <div style="min-height:100vh;background:#f5f7fa;padding:20px;text-align:center;">
          <button onclick="window.navigateBack?.()" style="position:absolute;top:16px;left:16px;background:none;border:none;font-size:20px;cursor:pointer;">←</button>
          <div style="padding-top:80px;">
            <p style="font-size:48px;">🏢</p>
            <h2 style="color:#424242;">FPO Not Found</h2>
            <p style="color:#757575;">This FPO portfolio is not available.</p>
          </div>
        </div>`;
      return;
    }

    const p = portfolio.profile;
    const fs = portfolio.farmer_stats || {};
    const land = portfolio.land || {};
    const procHistory = portfolio.procurement_history || [];
    const yieldExp = portfolio.yield_expected || [];
    const inventory = portfolio.inventory || [];
    const listings = portfolio.active_listings || [];
    const crops = p.primary_crops || [];

    container.innerHTML = `
      <div style="min-height:100vh;background:#f5f7fa;">
        <!-- Hero Header -->
        <div style="background:linear-gradient(135deg,#1B5E20,#388E3C);padding:20px 16px 24px;color:#fff;position:relative;">
          <button onclick="window.navigateBack?.()" style="position:absolute;top:16px;left:12px;background:none;border:none;color:#fff;font-size:20px;cursor:pointer;">←</button>
          <div style="text-align:center;padding-top:8px;">
            <div style="width:64px;height:64px;border-radius:16px;background:rgba(255,255,255,0.2);display:inline-flex;align-items:center;justify-content:center;font-size:32px;margin-bottom:8px;">🏢</div>
            <h1 style="margin:0;font-size:20px;font-weight:800;">${p.fpo_name}</h1>
            <p style="margin:4px 0 0;font-size:12px;opacity:0.9;">📍 ${p.district_name || ''}, ${p.state_name || p.state || ''} ${p.block ? '• ' + p.block : ''}</p>
            <div style="margin-top:8px;display:flex;justify-content:center;gap:8px;flex-wrap:wrap;">
              ${p.registration_number ? '<span style="background:rgba(255,255,255,0.2);padding:3px 10px;border-radius:12px;font-size:11px;">✓ Registered</span>' : ''}
              ${p.year_established ? `<span style="background:rgba(255,255,255,0.2);padding:3px 10px;border-radius:12px;font-size:11px;">Est. ${p.year_established}</span>` : ''}
              <span style="background:rgba(255,255,255,0.2);padding:3px 10px;border-radius:12px;font-size:11px;">${p.fpo_type || 'FPO'}</span>
            </div>
          </div>
        </div>

        <!-- Quick Stats Cards -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;padding:14px;margin-top:-12px;">
          <div style="background:#fff;border-radius:12px;padding:12px 8px;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,0.06);">
            <div style="font-size:18px;font-weight:800;color:#1565C0;">👥 ${fs.total_members || p.member_count || 0}</div>
            <div style="font-size:9px;color:#757575;margin-top:2px;">Total Farmers</div>
          </div>
          <div style="background:#fff;border-radius:12px;padding:12px 8px;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,0.06);">
            <div style="font-size:18px;font-weight:800;color:#2E7D32;">✅ ${fs.active_members || p.active_member_count || 0}</div>
            <div style="font-size:9px;color:#757575;margin-top:2px;">Active</div>
          </div>
          <div style="background:#fff;border-radius:12px;padding:12px 8px;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,0.06);">
            <div style="font-size:18px;font-weight:800;color:#E65100;">🌾 ${formatNumber(land.total_acres)}</div>
            <div style="font-size:9px;color:#757575;margin-top:2px;">Acres</div>
          </div>
          <div style="background:#fff;border-radius:12px;padding:12px 8px;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,0.06);">
            <div style="font-size:18px;font-weight:800;color:#6A1B9A;">🆕 ${fs.new_joiners || 0}</div>
            <div style="font-size:9px;color:#757575;margin-top:2px;">New (90d)</div>
          </div>
        </div>

        <!-- Section Tabs -->
        <div style="display:flex;gap:4px;padding:0 14px;overflow-x:auto;margin-bottom:12px;">
          ${['overview','listings','inventory','history'].map(s => `
            <button data-section="${s}" style="padding:8px 14px;border-radius:20px;border:none;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;
              ${activeSection === s ? 'background:#1B5E20;color:#fff;' : 'background:#E8F5E9;color:#2E7D32;'}">
              ${s === 'overview' ? '📋 Overview' : s === 'listings' ? '🏪 Listings' : s === 'inventory' ? '📦 Stock' : '📊 History'}
            </button>
          `).join('')}
        </div>

        <!-- Content -->
        <div style="padding:0 14px 80px;">
          ${activeSection === 'overview' ? renderOverview(crops, yieldExp, p) : ''}
          ${activeSection === 'listings' ? renderListings(listings) : ''}
          ${activeSection === 'inventory' ? renderInventory(inventory) : ''}
          ${activeSection === 'history' ? renderHistory(procHistory) : ''}
        </div>

        <!-- Contact Footer -->
        <div style="position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid #E0E0E0;padding:12px 16px;display:flex;gap:10px;box-shadow:0 -2px 8px rgba(0,0,0,0.06);">
          ${p.whatsapp_number ? `<a href="https://wa.me/91${p.whatsapp_number}" target="_blank" rel="noopener" style="flex:1;background:#25D366;color:#fff;border:none;padding:12px;border-radius:10px;font-size:13px;font-weight:700;text-align:center;text-decoration:none;cursor:pointer;">💬 WhatsApp</a>` : ''}
          <button onclick="window.navigateBack?.()" style="flex:1;background:#1B5E20;color:#fff;border:none;padding:12px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;">📞 Contact FPO</button>
        </div>
      </div>
    `;
    attachEvents();
  }

  function renderOverview(crops, yieldExp, profile) {
    return `
      <!-- Crops Produced -->
      <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;border:1px solid #E8E8E8;">
        <h3 style="margin:0 0 10px;font-size:14px;font-weight:700;color:#1B5E20;">🌱 Crops Produced</h3>
        ${crops.length > 0 ? `
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            ${crops.map(c => `<span style="background:#F1F8E9;border:1px solid #C5E1A5;border-radius:20px;padding:6px 12px;font-size:12px;color:#33691E;font-weight:500;">${getCropIcon(c)} ${c}</span>`).join('')}
          </div>
        ` : '<p style="color:#9E9E9E;font-size:13px;">No crops listed</p>'}
      </div>

      <!-- Expected Yield -->
      ${yieldExp.length > 0 ? `
        <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;border:1px solid #E8E8E8;">
          <h3 style="margin:0 0 10px;font-size:14px;font-weight:700;color:#E65100;">📈 Expected Yield (Current Season)</h3>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${yieldExp.map(y => `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#FFF8E1;border-radius:10px;">
                <div>
                  <span style="font-weight:600;font-size:13px;">${getCropIcon(y.crop_name)} ${y.crop_name || 'Unknown'}</span>
                  ${y.harvest_from ? `<div style="font-size:10px;color:#757575;margin-top:2px;">Harvest: ${formatDate(y.harvest_from)} — ${formatDate(y.harvest_to)}</div>` : ''}
                </div>
                <div style="text-align:right;">
                  <div style="font-weight:700;font-size:14px;color:#E65100;">${formatWeight(y.expected_quantity_kg)}</div>
                  ${y.indicative_price ? `<div style="font-size:10px;color:#757575;">~₹${y.indicative_price}/kg</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Trust & Certifications -->
      <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;border:1px solid #E8E8E8;">
        <h3 style="margin:0 0 10px;font-size:14px;font-weight:700;color:#1565C0;">🛡️ Trust & Credentials</h3>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${profile.registration_number ? `<span style="background:#E3F2FD;border:1px solid #90CAF9;border-radius:20px;padding:5px 10px;font-size:11px;color:#1565C0;">📄 Reg: ${profile.registration_number}</span>` : ''}
          ${profile.year_established ? `<span style="background:#E8F5E9;border:1px solid #A5D6A7;border-radius:20px;padding:5px 10px;font-size:11px;color:#2E7D32;">🏛️ Since ${profile.year_established}</span>` : ''}
          <span style="background:#FFF3E0;border:1px solid #FFCC02;border-radius:20px;padding:5px 10px;font-size:11px;color:#E65100;">👥 ${profile.member_count || 0} Members</span>
          ${profile.fpo_type ? `<span style="background:#F3E5F5;border:1px solid #CE93D8;border-radius:20px;padding:5px 10px;font-size:11px;color:#6A1B9A;">🏢 ${profile.fpo_type}</span>` : ''}
        </div>
      </div>

      <!-- Contact Info -->
      <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;border:1px solid #E8E8E8;">
        <h3 style="margin:0 0 10px;font-size:14px;font-weight:700;color:#424242;">📞 Contact</h3>
        ${profile.ceo_name ? `<p style="margin:4px 0;font-size:13px;color:#424242;">👤 CEO: <strong>${profile.ceo_name}</strong></p>` : ''}
        ${profile.whatsapp_number ? `<p style="margin:4px 0;font-size:13px;color:#424242;">📱 WhatsApp: ${profile.whatsapp_number}</p>` : ''}
        ${profile.office_address ? `<p style="margin:4px 0;font-size:13px;color:#424242;">🏠 ${profile.office_address}</p>` : ''}
      </div>
    `;
  }

  function renderListings(listings) {
    if (listings.length === 0) return '<div style="text-align:center;padding:40px;color:#757575;"><p style="font-size:36px;">🏪</p><p>No active listings at the moment</p></div>';
    return `
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${listings.map(l => `
          <div style="background:#fff;border-radius:14px;padding:14px;border:1px solid #E8E8E8;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
              <div>
                <div style="font-weight:700;font-size:14px;color:#1B5E20;">${getCropIcon(l.crop_name)} ${l.crop_name || 'Crop'}</div>
                <div style="font-size:11px;color:#757575;margin-top:2px;">Grade: ${l.quality_grade || 'N/A'} • Min order: ${l.min_order_kg ? l.min_order_kg + ' kg' : 'Any'}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-weight:800;font-size:16px;color:#E65100;">₹${l.price_per_kg || '—'}/kg</div>
                <div style="font-size:11px;color:#2E7D32;font-weight:600;">${formatWeight(l.quantity_available)} available</div>
              </div>
            </div>
            ${l.harvest_from_date || l.harvest_to_date ? `<div style="margin-top:6px;font-size:11px;color:#757575;background:#F5F5F5;padding:4px 8px;border-radius:6px;">📅 Harvest: ${formatDate(l.harvest_from_date)} — ${formatDate(l.harvest_to_date)}</div>` : ''}
            ${l.certifications && l.certifications.length > 0 ? `<div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap;">${l.certifications.map(c => `<span style="background:#E8F5E9;border-radius:8px;padding:2px 6px;font-size:10px;color:#2E7D32;">✓ ${c}</span>`).join('')}</div>` : ''}
            ${l.special_notes ? `<div style="margin-top:6px;font-size:11px;color:#616161;font-style:italic;">"${l.special_notes}"</div>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderInventory(inventory) {
    if (inventory.length === 0) return '<div style="text-align:center;padding:40px;color:#757575;"><p style="font-size:36px;">📦</p><p>No inventory data available</p></div>';
    return `
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${inventory.map(item => `
          <div style="background:#fff;border-radius:12px;padding:12px 14px;border:1px solid #E8E8E8;display:flex;align-items:center;justify-content:space-between;">
            <div>
              <div style="font-weight:600;font-size:13px;color:#424242;">${getCropIcon(item.crop_name)} ${item.crop_name || 'Unknown'}</div>
              <div style="font-size:11px;color:#757575;">Grade: ${item.quality_grade || 'Ungraded'} ${item.storage_location ? '• ' + item.storage_location : ''}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-weight:700;font-size:14px;color:#1B5E20;">${formatWeight(item.quantity_kg)}</div>
              <div style="font-size:10px;color:#757575;">${item.storage_type || 'Warehouse'}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderHistory(procHistory) {
    if (procHistory.length === 0) return '<div style="text-align:center;padding:40px;color:#757575;"><p style="font-size:36px;">📊</p><p>No procurement history available</p></div>';
    return `
      <div style="background:#fff;border-radius:14px;padding:16px;border:1px solid #E8E8E8;">
        <h3 style="margin:0 0 12px;font-size:14px;font-weight:700;color:#424242;">📊 Procurement Track Record</h3>
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${procHistory.map(h => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px;background:#FAFAFA;border-radius:10px;">
              <div>
                <div style="font-weight:600;font-size:13px;">${getCropIcon(h.crop_name)} ${h.crop_name || 'Unknown'}</div>
                <div style="font-size:11px;color:#757575;">${h.procurement_count} procurements • Avg ₹${h.avg_price}/kg</div>
              </div>
              <div style="text-align:right;">
                <div style="font-weight:700;font-size:14px;color:#E65100;">${formatWeight(h.total_kg)}</div>
                <div style="font-size:10px;color:#9E9E9E;">${h.last_procurement ? 'Last: ' + formatDate(h.last_procurement) : ''}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function formatWeight(kg) {
    const n = parseFloat(kg) || 0;
    if (n >= 1000) return (n / 1000).toFixed(1) + ' T';
    return Math.round(n) + ' kg';
  }

  function formatNumber(num) {
    const n = parseFloat(num) || 0;
    if (n >= 100000) return (n / 100000).toFixed(1) + 'L';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return Math.round(n).toString();
  }

  function formatDate(d) {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }); }
    catch { return d; }
  }

  function attachEvents() {
    container.querySelectorAll('[data-section]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeSection = btn.dataset.section;
        render();
      });
    });
  }

  loadPortfolio();
}
