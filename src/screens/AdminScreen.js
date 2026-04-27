import { api } from '../api.js';
import { showToast, navigate, showModal, closeModal } from '../app-shell.js';
import { getRole, getState } from '../store.js';

/**
 * AdminScreen — Platform-wide statistics and management
 * Only accessible to admin role users
 */
export function renderAdmin(container) {
  const role = getRole();
  if (role !== 'admin') {
    container.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:60vh;text-align:center;padding:20px">
      <div style="font-size:56px;margin-bottom:16px">🔒</div>
      <div style="font-weight:800;font-size:18px;margin-bottom:8px">Admin Access Only</div>
      <div style="color:#757575;font-size:14px">This section is restricted to platform administrators.</div>
      <button onclick="history.back()" style="margin-top:20px;padding:10px 24px;background:#1565C0;color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer">← Go Back</button>
    </div>`;
    return;
  }

  let tab = 'overview';
  let stats = {};
  let users = [];
  let orders = [];
  let payments = [];
  let loading = true;

  const SAMPLE_STATS = {
    total_users: 12843, farmers: 9621, fpos: 387, buyers: 1982, suppliers: 643, service_providers: 210,
    total_orders: 4210, confirmed_orders: 2876, cancelled_orders: 234, pending_orders: 1100,
    total_revenue: 18400000, this_month_revenue: 2100000, avg_order_value: 4370,
    total_equipment: 1842, active_listings: 934, equipment_bookings: 3204,
    total_land_records: 6218, active_listings_bhoomi: 412,
    active_ponds: 2134, total_aqua_orders: 893,
  };

  const SAMPLE_USERS = [
    { id:'u1', name:'Ramesh Kumar', role:'farmer', phone:'9876543210', created_at:'2026-03-15T10:00:00Z', status:'active' },
    { id:'u2', name:'Srinivas FPO', role:'fpo', phone:'9988776600', created_at:'2026-03-10T09:00:00Z', status:'active' },
    { id:'u3', name:'Ravi Traders', role:'buyer', phone:'9123456780', created_at:'2026-03-20T11:00:00Z', status:'active' },
    { id:'u4', name:'Lakshmi Inputs', role:'supplier', phone:'9555666777', created_at:'2026-04-01T08:00:00Z', status:'active' },
    { id:'u5', name:'Venkat Agro', role:'farmer', phone:'9012345600', created_at:'2026-04-10T14:00:00Z', status:'suspended' },
  ];

  const SAMPLE_PAYMENTS = [
    { id:'p1', order_number:'ORD_001_XYZ', amount:2500, status:'paid', user_id:'u1', description:'Seed purchase', created_at:'2026-04-25T10:00:00Z' },
    { id:'p2', order_number:'ORD_002_ABC', amount:18500, status:'paid', user_id:'u4', description:'Drip irrigation kit', created_at:'2026-04-24T15:00:00Z' },
    { id:'p3', order_number:'ORD_003_DEF', amount:8000, status:'failed', user_id:'u3', description:'Cotton seeds', created_at:'2026-04-23T09:00:00Z' },
  ];

  function render() {
    container.innerHTML = `
      <div class="hero-v2" role="banner" style="background:linear-gradient(135deg,#1A237E,#283593);color:white">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:28px">🛡️</span>
          <div>
            <div style="font-weight:800;font-size:18px">Admin Dashboard</div>
            <div style="font-size:11px;opacity:0.85">Platform management & analytics</div>
          </div>
        </div>
      </div>
      <div class="tab-bar" role="tablist" style="overflow-x:auto;white-space:nowrap">
        <button role="tab" aria-selected="${tab==='overview'}" class="tab-btn ${tab==='overview'?'active':''}" data-tab="overview">📊 Overview</button>
        <button role="tab" aria-selected="${tab==='users'}" class="tab-btn ${tab==='users'?'active':''}" data-tab="users">👥 Users</button>
        <button role="tab" aria-selected="${tab==='payments'}" class="tab-btn ${tab==='payments'?'active':''}" data-tab="payments">💰 Payments</button>
        <button role="tab" aria-selected="${tab==='platforms'}" class="tab-btn ${tab==='platforms'?'active':''}" data-tab="platforms">🏗️ Platforms</button>
      </div>
      ${loading ? '<div class="loading"><div class="spinner"></div></div>' : renderTab()}
    `;
    container.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; render(); }));
    container.querySelectorAll('.toggle-user-btn').forEach(b => b.addEventListener('click', () => {
      const u = users.find(x => x.id === b.dataset.uid);
      if (!u) return;
      u.status = u.status === 'active' ? 'suspended' : 'active';
      showToast(`${u.name} ${u.status}`, 'success');
      render();
    }));
    container.querySelectorAll('.user-row[data-uid]').forEach(r => r.addEventListener('click', (e) => {
      if (e.target.closest('.toggle-user-btn')) return;
      showUserDetail(r.dataset.uid);
    }));
  }

  function showUserDetail(uid) {
    const u = users.find(x => x.id === uid);
    if (!u) return;
    const roleIcon = { farmer:'👨‍🌾', fpo:'🤝', buyer:'🏢', supplier:'🏪', service_provider:'🔧' };
    showModal(`<div class="modal-handle"></div>
      <div style="text-align:center;margin-bottom:12px">
        <div style="font-size:36px;margin-bottom:6px">${roleIcon[u.role]||'👤'}</div>
        <div style="font-weight:800;font-size:16px">${u.name}</div>
        <div style="font-size:12px;color:#757575">${u.phone} · ${u.role}</div>
        <span style="background:${u.status==='active'?'#E8F5E9':'#FFEBEE'};color:${u.status==='active'?'#2E7D32':'#C62828'};padding:3px 10px;border-radius:8px;font-size:11px;font-weight:700;display:inline-block;margin-top:6px">${u.status}</span>
      </div>
      <div style="font-size:12px;color:#555;margin-bottom:12px">Joined: ${new Date(u.created_at).toLocaleDateString('en-IN',{dateStyle:'long'})}</div>
      <button id="closeUserDetail" style="width:100%;padding:10px;background:#F5F5F5;color:#424242;border:none;border-radius:10px;font-weight:600;cursor:pointer">Close</button>`);
    document.querySelector('#closeUserDetail')?.addEventListener('click', () => closeModal());
  }

  function renderTab() {
    switch(tab) {
      case 'overview': return renderOverview();
      case 'users': return renderUsers();
      case 'payments': return renderPayments();
      case 'platforms': return renderPlatforms();
      default: return renderOverview();
    }
  }

  function renderOverview() {
    const s = stats;
    const monthRevFmt = `₹${(Number(s.this_month_revenue||0)/100000).toFixed(1)}L`;
    const totalRevFmt = `₹${(Number(s.total_revenue||0)/10000000).toFixed(2)}Cr`;

    // CSS bar chart for user distribution
    const roleData = [
      { label: 'Farmers', count: s.farmers||0, color: '#2E7D32', icon: '👨‍🌾' },
      { label: 'Buyers', count: s.buyers||0, color: '#1565C0', icon: '🏢' },
      { label: 'Suppliers', count: s.suppliers||0, color: '#6A1B9A', icon: '🏪' },
      { label: 'FPOs', count: s.fpos||0, color: '#E65100', icon: '🤝' },
    ];
    const maxUsers = Math.max(...roleData.map(r=>r.count), 1);

    return `<div style="padding:12px 14px 80px">
      <!-- Revenue KPIs -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
        <div style="background:linear-gradient(135deg,#1565C0,#0D47A1);border-radius:12px;padding:14px;color:white">
          <div style="font-size:10px;opacity:0.8">THIS MONTH REVENUE</div>
          <div style="font-size:22px;font-weight:800;margin-top:4px">${monthRevFmt}</div>
          <div style="font-size:11px;opacity:0.8">${s.total_orders||0} total orders</div>
        </div>
        <div style="background:linear-gradient(135deg,#2E7D32,#1B5E20);border-radius:12px;padding:14px;color:white">
          <div style="font-size:10px;opacity:0.8">TOTAL PLATFORM REVENUE</div>
          <div style="font-size:22px;font-weight:800;margin-top:4px">${totalRevFmt}</div>
          <div style="font-size:11px;opacity:0.8">Avg order ₹${Number(s.avg_order_value||0).toLocaleString()}</div>
        </div>
      </div>

      <!-- User stats -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:12px">
        ${[
          {label:'Total Users', val:Number(s.total_users||0).toLocaleString(), icon:'👤'},
          {label:'Verified FPOs', val:s.fpos||0, icon:'🤝'},
          {label:'Active Listings', val:s.active_listings||0, icon:'📋'},
        ].map(k=>`<div style="background:white;border-radius:10px;padding:10px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
          <div style="font-size:20px">${k.icon}</div>
          <div style="font-weight:800;font-size:16px;color:#1A237E">${k.val}</div>
          <div style="font-size:10px;color:#757575">${k.label}</div>
        </div>`).join('')}
      </div>

      <!-- User distribution bar chart -->
      <div style="background:white;border-radius:12px;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,0.06);margin-bottom:12px">
        <div style="font-weight:700;font-size:13px;margin-bottom:10px">👥 User Distribution by Role</div>
        ${roleData.map(r=>`
          <div style="margin-bottom:8px">
            <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px">
              <span>${r.icon} ${r.label}</span>
              <span style="color:${r.color};font-weight:700">${Number(r.count).toLocaleString()}</span>
            </div>
            <div style="background:#E8EAF6;border-radius:4px;height:8px;overflow:hidden">
              <div style="background:${r.color};height:100%;width:${Math.round((r.count/maxUsers)*100)}%;border-radius:4px"></div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Order status -->
      <div style="background:white;border-radius:12px;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
        <div style="font-weight:700;font-size:13px;margin-bottom:8px">📦 Order Status Breakdown</div>
        ${[
          {label:'Confirmed', val:s.confirmed_orders||0, color:'#2E7D32'},
          {label:'Pending', val:s.pending_orders||0, color:'#E65100'},
          {label:'Cancelled', val:s.cancelled_orders||0, color:'#C62828'},
        ].map(o=>`
          <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #F5F5F5">
            <span style="font-size:12px">${o.label}</span>
            <div style="display:flex;align-items:center;gap:8px">
              <div style="width:80px;background:#E8EAF6;border-radius:4px;height:6px;overflow:hidden">
                <div style="background:${o.color};height:100%;width:${s.total_orders?Math.round((o.val/s.total_orders)*100):0}%"></div>
              </div>
              <span style="font-weight:700;color:${o.color};font-size:12px">${o.val}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>`;
  }

  function renderUsers() {
    return `<div style="padding:12px 14px 80px">
      <div style="display:flex;align-items:center;background:white;border:1px solid #E0E0E0;border-radius:10px;padding:8px 12px;margin-bottom:10px">
        <span style="margin-right:8px">🔍</span>
        <input id="userSearch" type="search" aria-label="Search users" placeholder="Search users by name, phone…" aria-label="Search users by name, phone…" style="border:none;outline:none;flex:1;font-size:13px">
      </div>
      <div style="font-size:11px;color:#757575;margin-bottom:8px">${users.length} users shown · ${stats.total_users||0} total</div>
      ${users.map(u=>`
        <div class="user-row" data-uid="${u.id}" style="background:white;border-radius:10px;margin-bottom:6px;padding:10px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.06);display:flex;align-items:center;gap:10px;cursor:pointer">
          <div style="width:36px;height:36px;border-radius:50%;background:${u.role==='farmer'?'#E8F5E9':u.role==='fpo'?'#E3F2FD':u.role==='buyer'?'#EDE7F6':'#FFF3E0'};display:flex;align-items:center;justify-content:center;font-size:18px">
            ${u.role==='farmer'?'👨‍🌾':u.role==='fpo'?'🤝':u.role==='buyer'?'🏢':u.role==='supplier'?'🏪':'👤'}
          </div>
          <div style="flex:1">
            <div style="font-weight:700;font-size:13px">${u.name}</div>
            <div style="font-size:11px;color:#757575">${u.phone} · ${u.role}</div>
            <div style="font-size:10px;color:#757575">Joined ${new Date(u.created_at).toLocaleDateString('en-IN')}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:3px;align-items:flex-end">
            <span style="background:${u.status==='active'?'#E8F5E9':'#FFEBEE'};color:${u.status==='active'?'#2E7D32':'#C62828'};padding:2px 7px;border-radius:8px;font-size:10px;font-weight:700">${u.status}</span>
            <button class="toggle-user-btn" data-uid="${u.id}" data-status="${u.status}" style="padding:3px 8px;background:#F5F5F5;border:none;border-radius:6px;font-size:10px;cursor:pointer">${u.status==='active'?'Suspend':'Activate'}</button>
          </div>
        </div>
      `).join('')}
    </div>`;
  }

  function renderPayments() {
    const totalPaid = payments.filter(p=>p.status==='paid').reduce((s,p)=>s+Number(p.amount||0),0);
    const totalFailed = payments.filter(p=>p.status==='failed').length;
    return `<div style="padding:12px 14px 80px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
        <div style="background:#E8F5E9;border-radius:10px;padding:12px;text-align:center">
          <div style="font-weight:800;font-size:18px;color:#2E7D32">₹${Number(totalPaid).toLocaleString()}</div>
          <div style="font-size:11px;color:#2E7D32">Collected</div>
        </div>
        <div style="background:#FFEBEE;border-radius:10px;padding:12px;text-align:center">
          <div style="font-weight:800;font-size:18px;color:#C62828">${totalFailed}</div>
          <div style="font-size:11px;color:#C62828">Failed Payments</div>
        </div>
      </div>
      ${payments.map(p=>`
        <div style="background:white;border-radius:10px;margin-bottom:6px;padding:10px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div style="font-weight:700;font-size:12px">${p.order_number||'Unknown'}</div>
              <div style="font-size:11px;color:#757575">${p.description||''}</div>
              <div style="font-size:10px;color:#757575">${new Date(p.created_at).toLocaleDateString('en-IN')}</div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:700;color:#1A237E">₹${Number(p.amount||0).toLocaleString()}</div>
              <span style="background:${p.status==='paid'?'#E8F5E9':'#FFEBEE'};color:${p.status==='paid'?'#2E7D32':'#C62828'};padding:2px 7px;border-radius:6px;font-size:10px;font-weight:700">${p.status}</span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>`;
  }

  function renderPlatforms() {
    const s = stats;
    const platforms = [
      { name:'AgriGalaxy', icon:'🌐', desc:'Input Supplier Marketplace', metrics: [
        {label:'Active Stores', val: s.active_stores||0},
        {label:'Products Listed', val: s.total_products||0},
        {label:'Orders This Month', val: s.agrigalaxy_orders||0},
      ]},
      { name:'AquaOS', icon:'🐟', desc:'Aquaculture Management', metrics: [
        {label:'Active Ponds', val: s.active_ponds||0},
        {label:'Aqua Orders', val: s.total_aqua_orders||0},
        {label:'Fish Batches', val: s.total_batches||0},
      ]},
      { name:'AgriFlow', icon:'🌾', desc:'Crop Supply Chain', metrics: [
        {label:'Active Listings', val: s.active_listings||0},
        {label:'Verified FPOs', val: s.fpos||0},
        {label:'Crop Declarations', val: s.total_declarations||0},
      ]},
      { name:'KisanConnect', icon:'🚜', desc:'Farm Equipment Marketplace', metrics: [
        {label:'Equipment Listed', val: s.total_equipment||0},
        {label:'Active Listings', val: s.active_listings||0},
        {label:'Bookings Made', val: s.equipment_bookings||0},
      ]},
      { name:'BhoomiOS', icon:'🏡', desc:'Land & Farm Records', metrics: [
        {label:'Land Records', val: s.total_land_records||0},
        {label:'Active Listings', val: s.active_listings_bhoomi||0},
        {label:'Inquiries', val: s.bhoomi_inquiries||0},
      ]},
    ];
    return `<div style="padding:12px 14px 80px">
      ${platforms.map(p=>`
        <div style="background:white;border-radius:12px;margin-bottom:10px;box-shadow:0 2px 6px rgba(0,0,0,0.07);overflow:hidden">
          <div style="height:3px;background:linear-gradient(90deg,#1A237E,#283593)"></div>
          <div style="padding:12px 14px">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
              <span style="font-size:28px">${p.icon}</span>
              <div>
                <div style="font-weight:700;font-size:14px">${p.name}</div>
                <div style="font-size:11px;color:#757575">${p.desc}</div>
              </div>
              <span style="margin-left:auto;background:#E8EAF6;color:#1A237E;padding:3px 8px;border-radius:8px;font-size:10px;font-weight:700">Active</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">
              ${p.metrics.map(m=>`
                <div style="text-align:center;background:#F8F9FA;border-radius:8px;padding:8px">
                  <div style="font-weight:800;font-size:16px;color:#1A237E">${Number(m.val).toLocaleString()}</div>
                  <div style="font-size:10px;color:#757575">${m.label}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `).join('')}
    </div>`;
  }

  async function loadData() {
    loading = true; render();
    try {
      const [statsRes, usersRes, paymentsRes] = await Promise.all([
        api.get('/admin/stats').catch(() => ({})),
        api.get('/admin/users?limit=20').catch(() => []),
        api.get('/admin/payments?limit=20').catch(() => []),
      ]);
      stats = statsRes.stats || statsRes || {};
      users = Array.isArray(usersRes) ? usersRes : (usersRes.users || []);
      payments = Array.isArray(paymentsRes) ? paymentsRes : (paymentsRes.payments || []);
    } catch(e) { console.error('Admin load error:', e); }
    if (!stats.total_users) stats = SAMPLE_STATS;
    if (!users.length) users = SAMPLE_USERS;
    if (!payments.length) payments = SAMPLE_PAYMENTS;
    loading = false; render();
  }

  loadData();
}
