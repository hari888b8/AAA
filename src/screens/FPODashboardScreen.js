import { api } from '../api.js';
import { navigate, showToast, showModal, closeModal } from '../app-shell.js';
import { getState } from '../store.js';
import { t } from '../i18n.js';

/**
 * FPO Management Dashboard — Complete FPO Operations Hub
 *
 * Features:
 *   - Dashboard with KPIs (members, procurement, revenue, inventory)
 *   - Member management (add, list, track activity)
 *   - Procurement records with payment tracking
 *   - Inventory management
 *   - Supply listings (bulk selling to buyers)
 *   - Financial summary & reports
 *   - Collection center management
 */

export function renderFPODashboard(container) {
  const user = getState().user;
  let activeTab = 'overview';
  let stats = {};
  let members = [];
  let procurement = [];
  let procSummary = [];
  let inventory = [];
  let supplyListings = [];
  let crops = [];
  let isLoading = true;

  // ── Initial data load ──────────────────────────────────────
  async function loadData() {
    isLoading = true;
    render();
    try {
      const [statsRes, membersRes, procRes, invRes, listRes, cropsRes, summaryRes] = await Promise.all([
        api('fpo/stats').catch(() => ({ stats: {} })),
        api('fpo/members').catch(() => ({ members: [] })),
        api('fpo/procurement?limit=50').catch(() => ({ records: [] })),
        api('fpo/inventory').catch(() => ({ inventory: [] })),
        api('fpo/supply-listings').catch(() => ({ listings: [] })),
        api('intelligence/crops').catch(() => ({ crops: [] })),
        api('fpo/procurement/summary').catch(() => ({ summary: [] })),
      ]);
      stats = statsRes.stats || {};
      members = membersRes.members || [];
      procurement = procRes.records || [];
      inventory = invRes.inventory || [];
      supplyListings = listRes.listings || [];
      crops = cropsRes.crops || [];
      procSummary = summaryRes.summary || [];
    } catch (err) {
      showToast('Failed to load FPO data', 'error');
    }
    isLoading = false;
    render();
  }

  // ── Main render ────────────────────────────────────────────
  function render() {
    const tabs = [
      { id: 'overview', icon: '📊', label: 'Overview' },
      { id: 'members', icon: '👥', label: 'Members' },
      { id: 'procurement', icon: '🌾', label: 'Procurement' },
      { id: 'inventory', icon: '📦', label: 'Inventory' },
      { id: 'listings', icon: '🏪', label: 'Sell' },
      { id: 'finance', icon: '💰', label: 'Finance' },
    ];

    container.innerHTML = `
      <div style="min-height:100vh;background:var(--bg,#f8faf8);">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#1565C0,#7B1FA2);padding:20px 16px 16px;color:#fff;">
          <div style="display:flex;align-items:center;gap:12px;">
            <button onclick="window.navigateBack?.()" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer;">←</button>
            <div>
              <h1 style="margin:0;font-size:18px;font-weight:700;">🏢 FPO Dashboard</h1>
              <p style="margin:2px 0 0;font-size:12px;opacity:0.85;">${user?.name || 'FPO Admin'} • ${stats.member_count || 0} members</p>
            </div>
          </div>
        </div>

        <!-- Tab Bar -->
        <div style="display:flex;overflow-x:auto;background:#fff;border-bottom:1px solid #e0e0e0;padding:0 8px;gap:4px;" class="hide-scrollbar">
          ${tabs.map(tab => `
            <button onclick="window._fpoTab('${tab.id}')" 
              style="flex:0 0 auto;padding:10px 14px;border:none;background:${activeTab === tab.id ? '#E8EAF6' : 'transparent'};
              color:${activeTab === tab.id ? '#1565C0' : '#666'};font-size:12px;font-weight:${activeTab === tab.id ? '600' : '400'};
              border-bottom:${activeTab === tab.id ? '2px solid #1565C0' : '2px solid transparent'};cursor:pointer;white-space:nowrap;border-radius:8px 8px 0 0;">
              ${tab.icon} ${tab.label}
            </button>
          `).join('')}
        </div>

        <!-- Content -->
        <div style="padding:16px;">
          ${isLoading ? renderLoading() : renderTabContent()}
        </div>
      </div>
    `;
  }

  function renderLoading() {
    return `<div style="text-align:center;padding:60px 20px;">
      <div style="font-size:32px;margin-bottom:12px;">⏳</div>
      <p style="color:#666;">Loading FPO data...</p>
    </div>`;
  }

  function renderTabContent() {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'members': return renderMembers();
      case 'procurement': return renderProcurement();
      case 'inventory': return renderInventory();
      case 'listings': return renderListings();
      case 'finance': return renderFinance();
      default: return renderOverview();
    }
  }

  // ═══ OVERVIEW TAB ═══════════════════════════════════════════
  function renderOverview() {
    const kpis = [
      { label: 'Total Members', value: stats.member_count || 0, icon: '👥', color: '#1565C0' },
      { label: 'Active Members', value: stats.active_members || 0, icon: '✅', color: '#2E7D32' },
      { label: 'Procurement (₹)', value: formatCurrency(stats.procurement_total || 0), icon: '🌾', color: '#F57C00' },
      { label: 'Inventory (kg)', value: formatWeight(stats.inventory_kg || 0), icon: '📦', color: '#7B1FA2' },
      { label: 'Active Listings', value: stats.active_listings || 0, icon: '🏪', color: '#00838F' },
      { label: 'Pending Payments', value: formatCurrency(stats.pending_payments || 0), icon: '⏳', color: '#C62828' },
    ];

    return `
      <!-- KPI Grid -->
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:20px;">
        ${kpis.map(kpi => `
          <div style="background:#fff;border-radius:12px;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,0.08);border-left:3px solid ${kpi.color};">
            <div style="font-size:20px;margin-bottom:4px;">${kpi.icon}</div>
            <div style="font-size:18px;font-weight:700;color:#1a1a1a;">${kpi.value}</div>
            <div style="font-size:11px;color:#666;margin-top:2px;">${kpi.label}</div>
          </div>
        `).join('')}
      </div>

      <!-- Quick Actions -->
      <h3 style="font-size:14px;font-weight:600;margin:0 0 12px;color:#333;">⚡ Quick Actions</h3>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:20px;">
        <button onclick="window._fpoTab('procurement');window._fpoProcurementAdd()" style="padding:12px;border:1px solid #e0e0e0;border-radius:10px;background:#fff;cursor:pointer;text-align:center;">
          <div style="font-size:20px;">📝</div>
          <div style="font-size:12px;font-weight:500;margin-top:4px;">Record Procurement</div>
        </button>
        <button onclick="window._fpoTab('members');window._fpoMemberAdd()" style="padding:12px;border:1px solid #e0e0e0;border-radius:10px;background:#fff;cursor:pointer;text-align:center;">
          <div style="font-size:20px;">➕</div>
          <div style="font-size:12px;font-weight:500;margin-top:4px;">Add Member</div>
        </button>
        <button onclick="window._fpoTab('listings')" style="padding:12px;border:1px solid #e0e0e0;border-radius:10px;background:#fff;cursor:pointer;text-align:center;">
          <div style="font-size:20px;">🏪</div>
          <div style="font-size:12px;font-weight:500;margin-top:4px;">Create Listing</div>
        </button>
        <button onclick="window._fpoTab('inventory')" style="padding:12px;border:1px solid #e0e0e0;border-radius:10px;background:#fff;cursor:pointer;text-align:center;">
          <div style="font-size:20px;">📦</div>
          <div style="font-size:12px;font-weight:500;margin-top:4px;">View Inventory</div>
        </button>
      </div>

      <!-- Procurement Summary -->
      ${procSummary.length > 0 ? `
        <h3 style="font-size:14px;font-weight:600;margin:0 0 12px;color:#333;">🌾 Crop-wise Procurement</h3>
        <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          ${procSummary.slice(0, 5).map(item => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid #f0f0f0;">
              <div>
                <div style="font-weight:600;font-size:13px;">${item.crop_name || 'Unknown'}</div>
                <div style="font-size:11px;color:#666;">${item.record_count} records • ${formatWeight(item.total_kg)}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-weight:600;font-size:13px;color:#2E7D32;">₹${formatCurrency(item.total_value)}</div>
                <div style="font-size:11px;color:#666;">Avg ₹${item.avg_price_per_kg}/kg</div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Recent Procurement -->
      ${procurement.length > 0 ? `
        <h3 style="font-size:14px;font-weight:600;margin:20px 0 12px;color:#333;">📋 Recent Procurement</h3>
        ${procurement.slice(0, 5).map(rec => renderProcurementCard(rec)).join('')}
      ` : ''}
    `;
  }

  // ═══ MEMBERS TAB ═══════════════════════════════════════════
  function renderMembers() {
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="font-size:16px;font-weight:600;margin:0;">👥 Members (${members.length})</h3>
        <button onclick="window._fpoMemberAdd()" style="padding:8px 14px;background:#1565C0;color:#fff;border:none;border-radius:8px;font-size:12px;cursor:pointer;">
          ➕ Add Member
        </button>
      </div>

      ${members.length === 0 ? `
        <div style="text-align:center;padding:40px 20px;background:#fff;border-radius:12px;">
          <div style="font-size:48px;margin-bottom:12px;">👥</div>
          <p style="color:#666;font-size:14px;">No members yet. Add your first farmer member!</p>
          <button onclick="window._fpoMemberAdd()" style="margin-top:12px;padding:10px 20px;background:#1565C0;color:#fff;border:none;border-radius:8px;cursor:pointer;">
            Add First Member
          </button>
        </div>
      ` : `
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${members.map(member => `
            <div style="background:#fff;border-radius:10px;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,0.08);display:flex;align-items:center;gap:12px;">
              <div style="width:40px;height:40px;border-radius:50%;background:#E8EAF6;display:flex;align-items:center;justify-content:center;font-size:18px;">
                👨‍🌾
              </div>
              <div style="flex:1;">
                <div style="font-weight:600;font-size:13px;">${member.farmer_name || 'Unknown'}</div>
                <div style="font-size:11px;color:#666;">
                  ${member.farmer_phone ? '📱 ' + member.farmer_phone.slice(-4).padStart(10, '•') : ''}
                  ${member.village ? ' • 📍 ' + member.village : ''}
                </div>
                ${member.total_land_acres ? `<div style="font-size:11px;color:#2E7D32;margin-top:2px;">🌾 ${member.total_land_acres} acres</div>` : ''}
              </div>
              <div style="font-size:10px;padding:4px 8px;border-radius:4px;background:#E8F5E9;color:#2E7D32;">
                Active
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  }

  // ═══ PROCUREMENT TAB ═══════════════════════════════════════
  function renderProcurement() {
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="font-size:16px;font-weight:600;margin:0;">🌾 Procurement</h3>
        <button onclick="window._fpoProcurementAdd()" style="padding:8px 14px;background:#2E7D32;color:#fff;border:none;border-radius:8px;font-size:12px;cursor:pointer;">
          ➕ Record
        </button>
      </div>

      <!-- Summary Cards -->
      ${procSummary.length > 0 ? `
        <div style="display:flex;overflow-x:auto;gap:10px;margin-bottom:16px;padding-bottom:4px;" class="hide-scrollbar">
          ${procSummary.map(s => `
            <div style="flex:0 0 auto;min-width:140px;background:#fff;border-radius:10px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
              <div style="font-size:12px;color:#666;">${s.crop_name || 'Unknown'}</div>
              <div style="font-size:16px;font-weight:700;color:#1a1a1a;">${formatWeight(s.total_kg)}</div>
              <div style="font-size:11px;color:#2E7D32;">₹${formatCurrency(s.total_value)}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Records -->
      ${procurement.length === 0 ? `
        <div style="text-align:center;padding:40px 20px;background:#fff;border-radius:12px;">
          <div style="font-size:48px;margin-bottom:12px;">🌾</div>
          <p style="color:#666;">No procurement records yet.</p>
        </div>
      ` : `
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${procurement.map(rec => renderProcurementCard(rec)).join('')}
        </div>
      `}
    `;
  }

  function renderProcurementCard(rec) {
    const statusColors = { pending: '#F57C00', paid: '#2E7D32', partial: '#1565C0' };
    const status = rec.payment_status || 'pending';
    return `
      <div style="background:#fff;border-radius:10px;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <div style="font-weight:600;font-size:13px;">${rec.crop_name || 'Crop'} — ${rec.farmer_name || 'Farmer'}</div>
            <div style="font-size:11px;color:#666;margin-top:4px;">
              ${rec.quantity_kg} kg @ ₹${rec.price_per_kg}/kg 
              ${rec.quality_grade ? ' • Grade ' + rec.quality_grade : ''}
            </div>
          </div>
          <span style="font-size:10px;padding:3px 8px;border-radius:4px;background:${statusColors[status]}22;color:${statusColors[status]};font-weight:500;">
            ${status.toUpperCase()}
          </span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding-top:8px;border-top:1px solid #f0f0f0;">
          <span style="font-size:12px;color:#666;">${rec.procurement_date ? new Date(rec.procurement_date).toLocaleDateString('en-IN') : ''}</span>
          <span style="font-weight:700;font-size:14px;color:#2E7D32;">₹${formatCurrency(rec.net_payable || rec.gross_amount || 0)}</span>
        </div>
      </div>
    `;
  }

  // ═══ INVENTORY TAB ═════════════════════════════════════════
  function renderInventory() {
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="font-size:16px;font-weight:600;margin:0;">📦 Inventory</h3>
        <button onclick="window._fpoInventoryAdd()" style="padding:8px 14px;background:#7B1FA2;color:#fff;border:none;border-radius:8px;font-size:12px;cursor:pointer;">
          ➕ Add Stock
        </button>
      </div>

      ${inventory.length === 0 ? `
        <div style="text-align:center;padding:40px 20px;background:#fff;border-radius:12px;">
          <div style="font-size:48px;margin-bottom:12px;">📦</div>
          <p style="color:#666;">No inventory records. Add stock from procurement or manually.</p>
        </div>
      ` : `
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${inventory.map(item => `
            <div style="background:#fff;border-radius:10px;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,0.08);display:flex;align-items:center;gap:12px;">
              <div style="width:40px;height:40px;border-radius:8px;background:#F3E5F5;display:flex;align-items:center;justify-content:center;font-size:18px;">📦</div>
              <div style="flex:1;">
                <div style="font-weight:600;font-size:13px;">${item.crop_name || 'Unknown'}</div>
                <div style="font-size:11px;color:#666;">
                  ${item.storage_location || 'Storage'} • Grade ${item.quality_grade || '—'}
                </div>
              </div>
              <div style="text-align:right;">
                <div style="font-weight:700;font-size:14px;">${formatWeight(item.quantity_kg)}</div>
                <div style="font-size:10px;color:#666;">${item.storage_type || ''}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  }

  // ═══ LISTINGS TAB ══════════════════════════════════════════
  function renderListings() {
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="font-size:16px;font-weight:600;margin:0;">🏪 Supply Listings</h3>
        <button onclick="window._fpoListingAdd()" style="padding:8px 14px;background:#00838F;color:#fff;border:none;border-radius:8px;font-size:12px;cursor:pointer;">
          ➕ Create Listing
        </button>
      </div>

      ${supplyListings.length === 0 ? `
        <div style="text-align:center;padding:40px 20px;background:#fff;border-radius:12px;">
          <div style="font-size:48px;margin-bottom:12px;">🏪</div>
          <p style="color:#666;font-size:14px;">No active supply listings.</p>
          <p style="color:#999;font-size:12px;">List your aggregated produce for bulk buyers.</p>
          <button onclick="window._fpoListingAdd()" style="margin-top:12px;padding:10px 20px;background:#00838F;color:#fff;border:none;border-radius:8px;cursor:pointer;">
            Create First Listing
          </button>
        </div>
      ` : `
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${supplyListings.map(listing => `
            <div style="background:#fff;border-radius:10px;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                <div>
                  <div style="font-weight:600;font-size:14px;">${listing.crop_name || 'Crop'}</div>
                  <div style="font-size:12px;color:#666;margin-top:4px;">
                    ${formatWeight(listing.quantity_available)} available
                    ${listing.min_order_kg ? ' • Min: ' + formatWeight(listing.min_order_kg) : ''}
                  </div>
                </div>
                <div style="text-align:right;">
                  <div style="font-weight:700;font-size:14px;color:#00838F;">₹${listing.price_per_kg}/kg</div>
                  <span style="font-size:10px;padding:2px 6px;border-radius:4px;background:#E0F2F1;color:#00695C;">
                    ${listing.status || 'active'}
                  </span>
                </div>
              </div>
              ${listing.certifications?.length ? `
                <div style="margin-top:8px;display:flex;gap:4px;flex-wrap:wrap;">
                  ${listing.certifications.map(c => `<span style="font-size:10px;padding:2px 6px;background:#E8F5E9;border-radius:4px;color:#2E7D32;">✓ ${c}</span>`).join('')}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `}
    `;
  }

  // ═══ FINANCE TAB ═══════════════════════════════════════════
  function renderFinance() {
    const totalProcurement = stats.procurement_total || 0;
    const pendingPayments = stats.pending_payments || 0;
    const paidAmount = totalProcurement - pendingPayments;

    return `
      <h3 style="font-size:16px;font-weight:600;margin:0 0 16px;">💰 Financial Summary</h3>

      <!-- Finance KPIs -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
        <div style="background:#fff;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <div style="font-size:11px;color:#666;">Total Procurement</div>
          <div style="font-size:20px;font-weight:700;color:#1a1a1a;margin-top:4px;">₹${formatCurrency(totalProcurement)}</div>
        </div>
        <div style="background:#fff;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <div style="font-size:11px;color:#666;">Amount Paid</div>
          <div style="font-size:20px;font-weight:700;color:#2E7D32;margin-top:4px;">₹${formatCurrency(paidAmount)}</div>
        </div>
        <div style="background:#fff;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <div style="font-size:11px;color:#666;">Pending Payments</div>
          <div style="font-size:20px;font-weight:700;color:#C62828;margin-top:4px;">₹${formatCurrency(pendingPayments)}</div>
        </div>
        <div style="background:#fff;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <div style="font-size:11px;color:#666;">Active Listings</div>
          <div style="font-size:20px;font-weight:700;color:#00838F;margin-top:4px;">${stats.active_listings || 0}</div>
        </div>
      </div>

      <!-- Payment breakdown by crop -->
      ${procSummary.length > 0 ? `
        <h4 style="font-size:14px;font-weight:600;margin:0 0 12px;color:#333;">Crop-wise Payments</h4>
        <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead>
              <tr style="background:#f5f5f5;">
                <th style="padding:10px 12px;text-align:left;font-weight:600;">Crop</th>
                <th style="padding:10px 8px;text-align:right;font-weight:600;">Qty (kg)</th>
                <th style="padding:10px 8px;text-align:right;font-weight:600;">Paid</th>
                <th style="padding:10px 12px;text-align:right;font-weight:600;">Pending</th>
              </tr>
            </thead>
            <tbody>
              ${procSummary.map(s => `
                <tr style="border-top:1px solid #f0f0f0;">
                  <td style="padding:10px 12px;font-weight:500;">${s.crop_name || '—'}</td>
                  <td style="padding:10px 8px;text-align:right;">${formatWeight(s.total_kg)}</td>
                  <td style="padding:10px 8px;text-align:right;color:#2E7D32;">₹${formatCurrency(s.paid_amount)}</td>
                  <td style="padding:10px 12px;text-align:right;color:#C62828;">₹${formatCurrency(s.pending_amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : `
        <div style="text-align:center;padding:30px;background:#fff;border-radius:12px;">
          <p style="color:#666;">No financial data yet. Start recording procurement.</p>
        </div>
      `}
    `;
  }

  // ═══ MODALS: Add Member ════════════════════════════════════
  window._fpoMemberAdd = () => {
    showModal(`
      <div style="padding:20px;">
        <h3 style="margin:0 0 16px;font-size:16px;">➕ Add Member</h3>
        <label style="display:block;margin-bottom:12px;">
          <span style="font-size:12px;color:#666;">Farmer's Phone Number</span>
          <input id="fpo-member-phone" type="tel" maxlength="10" placeholder="10-digit mobile"
            style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;margin-top:4px;font-size:14px;box-sizing:border-box;">
        </label>
        <div style="display:flex;gap:10px;">
          <button onclick="closeModal()" style="flex:1;padding:10px;border:1px solid #ddd;border-radius:8px;background:#fff;cursor:pointer;">Cancel</button>
          <button onclick="window._fpoMemberSubmit()" style="flex:1;padding:10px;background:#1565C0;color:#fff;border:none;border-radius:8px;cursor:pointer;">Add</button>
        </div>
      </div>
    `);
  };

  window._fpoMemberSubmit = async () => {
    const phone = document.getElementById('fpo-member-phone')?.value?.trim();
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      showToast('Enter a valid 10-digit phone number', 'error');
      return;
    }
    try {
      await api('fpo/members', { method: 'POST', body: JSON.stringify({ farmer_phone: phone }) });
      showToast('Member added successfully!', 'success');
      closeModal();
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to add member', 'error');
    }
  };

  // ═══ MODALS: Add Procurement ══════════════════════════════
  window._fpoProcurementAdd = () => {
    const cropOptions = crops.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    showModal(`
      <div style="padding:20px;max-height:80vh;overflow-y:auto;">
        <h3 style="margin:0 0 16px;font-size:16px;">📝 Record Procurement</h3>
        <div style="display:flex;flex-direction:column;gap:12px;">
          <label>
            <span style="font-size:12px;color:#666;">Farmer Phone</span>
            <input id="proc-phone" type="tel" maxlength="10" placeholder="10-digit"
              style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;margin-top:4px;font-size:14px;box-sizing:border-box;">
          </label>
          <label>
            <span style="font-size:12px;color:#666;">Crop</span>
            <select id="proc-crop" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;margin-top:4px;font-size:14px;box-sizing:border-box;">
              <option value="">Select crop</option>
              ${cropOptions}
            </select>
          </label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <label>
              <span style="font-size:12px;color:#666;">Quantity (kg)</span>
              <input id="proc-qty" type="number" step="0.1" placeholder="100"
                style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;margin-top:4px;font-size:14px;box-sizing:border-box;">
            </label>
            <label>
              <span style="font-size:12px;color:#666;">Price (₹/kg)</span>
              <input id="proc-price" type="number" step="0.01" placeholder="25.00"
                style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;margin-top:4px;font-size:14px;box-sizing:border-box;">
            </label>
          </div>
          <label>
            <span style="font-size:12px;color:#666;">Quality Grade</span>
            <select id="proc-grade" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;margin-top:4px;font-size:14px;box-sizing:border-box;">
              <option value="A">A — Premium</option>
              <option value="B">B — Good</option>
              <option value="C">C — Average</option>
            </select>
          </label>
          <label>
            <span style="font-size:12px;color:#666;">Collection Center (optional)</span>
            <input id="proc-center" type="text" placeholder="Center name"
              style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;margin-top:4px;font-size:14px;box-sizing:border-box;">
          </label>
        </div>
        <div style="display:flex;gap:10px;margin-top:16px;">
          <button onclick="closeModal()" style="flex:1;padding:10px;border:1px solid #ddd;border-radius:8px;background:#fff;cursor:pointer;">Cancel</button>
          <button onclick="window._fpoProcurementSubmit()" style="flex:1;padding:10px;background:#2E7D32;color:#fff;border:none;border-radius:8px;cursor:pointer;">Save</button>
        </div>
      </div>
    `);
  };

  window._fpoProcurementSubmit = async () => {
    const farmer_phone = document.getElementById('proc-phone')?.value?.trim();
    const crop_id = document.getElementById('proc-crop')?.value;
    const quantity_kg = parseFloat(document.getElementById('proc-qty')?.value);
    const price_per_kg = parseFloat(document.getElementById('proc-price')?.value);
    const quality_grade = document.getElementById('proc-grade')?.value;
    const collection_center = document.getElementById('proc-center')?.value?.trim();

    if (!quantity_kg || !price_per_kg) {
      showToast('Quantity and price are required', 'error');
      return;
    }
    try {
      await api('fpo/procurement', {
        method: 'POST',
        body: JSON.stringify({ farmer_phone, crop_id: crop_id || undefined, quantity_kg, price_per_kg, quality_grade, collection_center }),
      });
      showToast('Procurement recorded!', 'success');
      closeModal();
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to save', 'error');
    }
  };

  // ═══ MODALS: Add Inventory ════════════════════════════════
  window._fpoInventoryAdd = () => {
    const cropOptions = crops.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    showModal(`
      <div style="padding:20px;">
        <h3 style="margin:0 0 16px;font-size:16px;">📦 Add Inventory</h3>
        <div style="display:flex;flex-direction:column;gap:12px;">
          <label>
            <span style="font-size:12px;color:#666;">Crop</span>
            <select id="inv-crop" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;margin-top:4px;font-size:14px;box-sizing:border-box;">
              <option value="">Select crop</option>
              ${cropOptions}
            </select>
          </label>
          <label>
            <span style="font-size:12px;color:#666;">Quantity (kg)</span>
            <input id="inv-qty" type="number" step="0.1" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;margin-top:4px;font-size:14px;box-sizing:border-box;">
          </label>
          <label>
            <span style="font-size:12px;color:#666;">Storage Location</span>
            <input id="inv-loc" type="text" placeholder="Warehouse name" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;margin-top:4px;font-size:14px;box-sizing:border-box;">
          </label>
          <label>
            <span style="font-size:12px;color:#666;">Storage Type</span>
            <select id="inv-type" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;margin-top:4px;font-size:14px;box-sizing:border-box;">
              <option value="warehouse">Warehouse</option>
              <option value="cold_storage">Cold Storage</option>
              <option value="godown">Godown</option>
              <option value="open_yard">Open Yard</option>
            </select>
          </label>
        </div>
        <div style="display:flex;gap:10px;margin-top:16px;">
          <button onclick="closeModal()" style="flex:1;padding:10px;border:1px solid #ddd;border-radius:8px;background:#fff;cursor:pointer;">Cancel</button>
          <button onclick="window._fpoInventorySubmit()" style="flex:1;padding:10px;background:#7B1FA2;color:#fff;border:none;border-radius:8px;cursor:pointer;">Save</button>
        </div>
      </div>
    `);
  };

  window._fpoInventorySubmit = async () => {
    const crop_id = document.getElementById('inv-crop')?.value;
    const quantity_kg = parseFloat(document.getElementById('inv-qty')?.value);
    const storage_location = document.getElementById('inv-loc')?.value?.trim();
    const storage_type = document.getElementById('inv-type')?.value;

    if (!quantity_kg) {
      showToast('Quantity is required', 'error');
      return;
    }
    try {
      await api('fpo/inventory', {
        method: 'POST',
        body: JSON.stringify({ crop_id: crop_id || undefined, quantity_kg, storage_location, storage_type }),
      });
      showToast('Inventory added!', 'success');
      closeModal();
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to save', 'error');
    }
  };

  // ═══ MODALS: Create Listing ═══════════════════════════════
  window._fpoListingAdd = () => {
    const cropOptions = crops.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    showModal(`
      <div style="padding:20px;max-height:80vh;overflow-y:auto;">
        <h3 style="margin:0 0 16px;font-size:16px;">🏪 Create Supply Listing</h3>
        <div style="display:flex;flex-direction:column;gap:12px;">
          <label>
            <span style="font-size:12px;color:#666;">Crop</span>
            <select id="lst-crop" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;margin-top:4px;font-size:14px;box-sizing:border-box;">
              <option value="">Select crop</option>
              ${cropOptions}
            </select>
          </label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <label>
              <span style="font-size:12px;color:#666;">Quantity (kg)</span>
              <input id="lst-qty" type="number" step="1" placeholder="1000"
                style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;margin-top:4px;font-size:14px;box-sizing:border-box;">
            </label>
            <label>
              <span style="font-size:12px;color:#666;">Price (₹/kg)</span>
              <input id="lst-price" type="number" step="0.01" placeholder="30.00"
                style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;margin-top:4px;font-size:14px;box-sizing:border-box;">
            </label>
          </div>
          <label>
            <span style="font-size:12px;color:#666;">Min Order (kg)</span>
            <input id="lst-min" type="number" placeholder="100"
              style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;margin-top:4px;font-size:14px;box-sizing:border-box;">
          </label>
          <label>
            <span style="font-size:12px;color:#666;">Quality Grade</span>
            <select id="lst-grade" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;margin-top:4px;font-size:14px;box-sizing:border-box;">
              <option value="A">A — Premium</option>
              <option value="B">B — Good</option>
              <option value="C">C — Average</option>
            </select>
          </label>
          <label>
            <span style="font-size:12px;color:#666;">Notes</span>
            <textarea id="lst-notes" rows="2" placeholder="Additional details..."
              style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;margin-top:4px;font-size:14px;box-sizing:border-box;resize:vertical;"></textarea>
          </label>
        </div>
        <div style="display:flex;gap:10px;margin-top:16px;">
          <button onclick="closeModal()" style="flex:1;padding:10px;border:1px solid #ddd;border-radius:8px;background:#fff;cursor:pointer;">Cancel</button>
          <button onclick="window._fpoListingSubmit()" style="flex:1;padding:10px;background:#00838F;color:#fff;border:none;border-radius:8px;cursor:pointer;">Publish</button>
        </div>
      </div>
    `);
  };

  window._fpoListingSubmit = async () => {
    const crop_id = document.getElementById('lst-crop')?.value;
    const quantity_available = parseFloat(document.getElementById('lst-qty')?.value);
    const price_per_kg = parseFloat(document.getElementById('lst-price')?.value);
    const min_order_kg = parseFloat(document.getElementById('lst-min')?.value) || undefined;
    const quality_grade = document.getElementById('lst-grade')?.value;
    const special_notes = document.getElementById('lst-notes')?.value?.trim();

    if (!crop_id || !quantity_available || !price_per_kg) {
      showToast('Crop, quantity and price are required', 'error');
      return;
    }
    try {
      await api('fpo/supply-listings', {
        method: 'POST',
        body: JSON.stringify({ crop_id, quantity_available, price_per_kg, min_order_kg, quality_grade, special_notes }),
      });
      showToast('Listing published!', 'success');
      closeModal();
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to publish', 'error');
    }
  };

  // ═══ Tab Navigation ════════════════════════════════════════
  window._fpoTab = (tab) => {
    activeTab = tab;
    render();
  };

  // ═══ Utility functions ═════════════════════════════════════
  function formatCurrency(num) {
    if (num >= 10000000) return (num / 10000000).toFixed(1) + ' Cr';
    if (num >= 100000) return (num / 100000).toFixed(1) + ' L';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return String(Math.round(num));
  }

  function formatWeight(kg) {
    if (kg >= 1000) return (kg / 1000).toFixed(1) + ' T';
    return Math.round(kg) + ' kg';
  }

  // ═══ Initialize ════════════════════════════════════════════
  loadData();
}
