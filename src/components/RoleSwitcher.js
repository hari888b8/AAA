import { api } from '../api.js';
import { getState, setState, getRole, getRoles, hasRole } from '../store.js';
import { showToast } from '../app-shell.js';

const ROLE_META = {
  farmer:           { icon: '👨‍🌾', color: '#4CAF50', label: 'Farmer',          desc: 'Crop & Aqua farming' },
  buyer:            { icon: '🛒', color: '#FF9800', label: 'Buyer',            desc: 'Trade · Export · Process' },
  fpo:              { icon: '🏢', color: '#2196F3', label: 'FPO / Society',    desc: 'Farmer Producer Org' },
  supplier:         { icon: '🏭', color: '#9C27B0', label: 'Input Supplier',   desc: 'Sell inputs to farmers' },
  service_provider: { icon: '🔧', color: '#607D8B', label: 'Service Provider', desc: 'Tractor · Labor · Transport' },
};

const ALL_ROLES = Object.keys(ROLE_META);

/**
 * Renders the role switcher widget — shows active role with quick-switch pills
 * @param {HTMLElement} container
 * @param {Function} onSwitch — called after role switch with new role
 */
export function renderRoleSwitcher(container, onSwitch) {
  const activeRole = getRole();
  const userRoles = getRoles();
  const roleList = userRoles.length ? userRoles : [{ role: activeRole, is_active: true }];

  container.innerHTML = `
    <div class="role-switcher" style="padding:12px 16px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div style="font-size:12px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px">🔄 Active Role</div>
        <button id="addRoleBtn" style="font-size:11px;font-weight:700;color:var(--primary);background:var(--primary-surface);border:none;padding:4px 10px;border-radius:12px;cursor:pointer">+ Add Role</button>
      </div>
      
      <!-- Role pills -->
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${roleList.map(r => {
          const meta = ROLE_META[r.role] || ROLE_META.farmer;
          const isActive = r.role === activeRole;
          return `
            <button class="role-pill" data-role="${r.role}" style="
              display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:20px;
              border:2px solid ${isActive ? meta.color : 'var(--border)'};
              background:${isActive ? meta.color + '18' : 'var(--bg)'};
              cursor:pointer;font-size:13px;font-weight:${isActive ? '700' : '500'};
              color:${isActive ? meta.color : 'var(--text2)'};
              transition:all 0.2s ease;
            ">
              <span style="font-size:16px">${meta.icon}</span>
              ${meta.label}
              ${isActive ? '<span style="font-size:10px;margin-left:2px">✓</span>' : ''}
            </button>
          `;
        }).join('')}
      </div>
      
      ${roleList.length > 1 ? `
        <div style="font-size:11px;color:var(--text3);margin-top:8px">Tap a role to switch your dashboard & navigation</div>
      ` : `
        <div style="font-size:11px;color:var(--text3);margin-top:8px">Add more roles to access features from other user types</div>
      `}
    </div>
  `;

  // Switch role on pill click
  container.querySelectorAll('.role-pill').forEach(btn => {
    btn.addEventListener('click', async () => {
      const targetRole = btn.dataset.role;
      if (targetRole === activeRole) return;
      
      btn.style.opacity = '0.5';
      btn.disabled = true;
      
      try {
        const res = await api.switchRole(targetRole);
        setState({
          user: res.user,
          activeRole: targetRole,
          roles: res.roles,
        });
        showToast(`Switched to ${ROLE_META[targetRole]?.icon} ${ROLE_META[targetRole]?.label}`, 'success');
        if (onSwitch) onSwitch(targetRole);
      } catch (e) {
        showToast(e.message || 'Failed to switch role', 'error');
        btn.style.opacity = '1';
        btn.disabled = false;
      }
    });
  });

  // Add role button
  container.querySelector('#addRoleBtn')?.addEventListener('click', () => {
    showAddRoleModal(onSwitch);
  });
}

/**
 * Shows modal to add a new role
 */
function showAddRoleModal(onSwitch) {
  const { showModal, closeModal } = require('../app-shell.js');
  const userRoles = getRoles();
  const existingRoles = userRoles.map(r => r.role);
  const available = ALL_ROLES.filter(r => !existingRoles.includes(r));

  if (!available.length) {
    showToast('You already have all available roles!', 'info');
    return;
  }

  let selectedRole = available[0];

  const SUB_TYPES = {
    farmer: [
      { id: 'agri_farmer', label: '🌾 Agri Farmer', desc: 'Crops — paddy, cotton, vegetables' },
      { id: 'aqua_farmer', label: '🐟 Aqua Farmer', desc: 'Aquaculture — shrimp, fish, crab' },
      { id: 'both', label: '🌾🐟 Both', desc: 'Both crop & aquaculture farming' },
    ],
    buyer: [
      { id: 'trader', label: '📦 Trader', desc: 'Buy & resell agricultural produce' },
      { id: 'exporter', label: '🌍 Exporter', desc: 'Export to international markets' },
      { id: 'processor', label: '🏭 Processor', desc: 'Process raw produce' },
      { id: 'retailer', label: '🏪 Retailer', desc: 'Retail/direct consumer sales' },
    ],
    supplier: [
      { id: 'agri_inputs', label: '🌱 Agri Inputs', desc: 'Seeds, fertilizers, pesticides' },
      { id: 'aqua_inputs', label: '🐟 Aqua Inputs', desc: 'Feed, probiotics, equipment' },
      { id: 'equipment', label: '🔧 Equipment', desc: 'Farm machinery & tools' },
    ],
  };

  showModal(`
    <div class="modal-handle"></div>
    <h3 style="margin-bottom:4px">➕ Add a New Role</h3>
    <p style="font-size:12px;color:var(--text3);margin-bottom:16px">Access features from another perspective. You can switch between roles anytime.</p>
    
    <div id="roleOptions" style="display:flex;flex-direction:column;gap:8px">
      ${available.map(r => {
        const meta = ROLE_META[r];
        return `
          <label style="display:flex;align-items:flex-start;gap:10px;padding:12px;border-radius:10px;border:2px solid ${selectedRole===r?meta.color:'var(--border)'};background:${selectedRole===r?meta.color+'18':'var(--bg)'};cursor:pointer" data-role="${r}">
            <input type="radio" name="addRoleSelect" value="${r}" ${selectedRole===r?'checked':''} style="margin-top:3px;accent-color:${meta.color}">
            <div style="flex:1">
              <div style="font-size:14px;font-weight:700;color:${selectedRole===r?meta.color:'var(--text1)'}">${meta.icon} ${meta.label}</div>
              <div style="font-size:11px;color:var(--text3);margin-top:2px">${meta.desc}</div>
            </div>
          </label>
        `;
      }).join('')}
    </div>

    <div id="subTypeSection" style="margin-top:12px;display:none">
      <div style="font-size:12px;font-weight:700;color:var(--text2);margin-bottom:8px">Specialization:</div>
      <div id="subTypeOptions"></div>
    </div>

    <button class="btn btn-primary" id="confirmAddRole" style="width:100%;margin-top:16px">Add Role →</button>
  `);

  let selectedSubType = null;

  function updateSubTypes() {
    const section = document.querySelector('#subTypeSection');
    const container = document.querySelector('#subTypeOptions');
    const subs = SUB_TYPES[selectedRole];
    
    if (subs) {
      section.style.display = 'block';
      selectedSubType = subs[0].id;
      container.innerHTML = subs.map(s => `
        <label style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;border:1px solid var(--border);margin-bottom:6px;cursor:pointer;font-size:13px" data-sub="${s.id}">
          <input type="radio" name="subTypeSelect" value="${s.id}" ${selectedSubType===s.id?'checked':''}>
          <div><div style="font-weight:600">${s.label}</div><div style="font-size:11px;color:var(--text3)">${s.desc}</div></div>
        </label>
      `).join('');
      container.querySelectorAll('input[name="subTypeSelect"]').forEach(r => {
        r.addEventListener('change', () => { selectedSubType = r.value; });
      });
    } else {
      section.style.display = 'none';
      selectedSubType = null;
    }
  }

  updateSubTypes();

  // Role selection events
  document.querySelectorAll('#roleOptions input[name="addRoleSelect"]').forEach(r => {
    r.addEventListener('change', () => {
      selectedRole = r.value;
      // Update borders
      document.querySelectorAll('#roleOptions label').forEach(l => {
        const role = l.dataset.role;
        const meta = ROLE_META[role];
        l.style.borderColor = role === selectedRole ? meta.color : 'var(--border)';
        l.style.background = role === selectedRole ? meta.color + '18' : 'var(--bg)';
      });
      updateSubTypes();
    });
  });

  // Confirm
  document.querySelector('#confirmAddRole')?.addEventListener('click', async () => {
    const btn = document.querySelector('#confirmAddRole');
    btn.disabled = true;
    btn.textContent = 'Adding...';
    
    try {
      await api.addRole(selectedRole, selectedSubType);
      // Refresh roles
      const rolesRes = await api.getRoles();
      setState({ roles: rolesRes.roles });
      showToast(`${ROLE_META[selectedRole]?.icon} ${ROLE_META[selectedRole]?.label} role added!`, 'success');
      closeModal();
      if (onSwitch) onSwitch(getRole());
    } catch (e) {
      showToast(e.message || 'Failed to add role', 'error');
      btn.disabled = false;
      btn.textContent = 'Add Role →';
    }
  });
}

/**
 * Renders a compact role badge for the home screen header
 */
export function renderRoleBadge(activeRole) {
  const meta = ROLE_META[activeRole] || ROLE_META.farmer;
  const roles = getRoles();
  const count = roles.length;
  
  return `
    <div class="role-badge" style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:16px;background:${meta.color}22;color:${meta.color};font-size:11px;font-weight:700">
      ${meta.icon} ${meta.label}${count > 1 ? ` <span style="opacity:0.6;margin-left:2px">+${count - 1}</span>` : ''}
    </div>
  `;
}
