import { api } from '../api.js';
import { showToast, showModal, closeModal } from '../app-shell.js';
import { t } from '../i18n.js';

// ═══════════════════════════════════════════════════════════════
// SCHEME DISCOVERY & APPLICATION ENGINE — Frontend Screen
// Auto-match farmer profile to eligible government schemes
// ═══════════════════════════════════════════════════════════════
export function renderSchemeDiscovery(container) {
  let loading = true;
  let tab = 'matched'; // matched | applications | categories | deadlines
  let schemes = [];
  let applications = [];
  let categories = [];
  let selectedCategory = null;

  async function loadSchemes() {
    try {
      loading = true; draw();
      const data = await api.discoverSchemes();
      schemes = data.matched_schemes || [];
      loading = false; draw();
    } catch (e) { loading = false; showToast('Failed to load schemes', 'error'); draw(); }
  }

  async function loadApplications() {
    try {
      const data = await api.getSchemeApplications();
      applications = data.applications || [];
      draw();
    } catch (e) { showToast('Failed to load applications', 'error'); }
  }

  async function loadCategories() {
    try {
      const data = await api.getSchemeCategories();
      categories = data.categories || [];
      draw();
    } catch (e) { showToast('Failed to load categories', 'error'); }
  }

  function switchTab(newTab) {
    tab = newTab;
    if (newTab === 'applications' && !applications.length) loadApplications();
    if (newTab === 'categories' && !categories.length) loadCategories();
    draw();
  }

  async function applyScheme(schemeId) {
    try {
      const result = await api.applyForScheme({ scheme_id: schemeId });
      showToast('✅ Application submitted!', 'success');
      loadApplications();
      loadSchemes();
    } catch (e) { showToast(e.message || 'Failed to apply', 'error'); }
  }

  function draw() {
    container.innerHTML = `
      <div style="padding:16px;max-width:600px;margin:0 auto;">
        <!-- Hero -->
        <div style="background:linear-gradient(135deg,#1565C0,#42A5F5);border-radius:16px;padding:24px;color:#fff;margin-bottom:16px;">
          <div style="font-size:20px;font-weight:700;">🏛️ Scheme Discovery</div>
          <div style="font-size:13px;margin-top:6px;opacity:0.9;">AI-matched government schemes for your farm profile</div>
          <div style="display:flex;gap:16px;margin-top:12px;">
            <div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:8px 12px;">
              <div style="font-size:18px;font-weight:700;">${schemes.length}</div>
              <div style="font-size:10px;opacity:0.8;">Schemes Matched</div>
            </div>
            <div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:8px 12px;">
              <div style="font-size:18px;font-weight:700;">${applications.length}</div>
              <div style="font-size:10px;opacity:0.8;">Applied</div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div style="display:flex;gap:4px;margin-bottom:16px;overflow-x:auto;">
          ${['matched', 'applications', 'categories'].map(t => `
            <button onclick="window._sdTab('${t}')" style="flex:1;min-width:90px;padding:10px 8px;border-radius:10px;border:none;font-size:12px;font-weight:600;cursor:pointer;
              background:${tab === t ? '#E3F2FD' : '#f5f5f5'};color:${tab === t ? '#1565C0' : '#666'};">
              ${{ matched: '🎯 For You', applications: '📋 Applied', categories: '📂 Browse' }[t]}
            </button>
          `).join('')}
        </div>

        <!-- Content -->
        ${loading ? '<div style="text-align:center;padding:40px;color:#888;">Analyzing your profile...</div>' : ''}
        ${!loading && tab === 'matched' ? renderMatched() : ''}
        ${tab === 'applications' ? renderApplications() : ''}
        ${tab === 'categories' ? renderCategories() : ''}
      </div>
    `;
  }

  function renderMatched() {
    if (!schemes.length) return `
      <div style="text-align:center;padding:40px;">
        <div style="font-size:48px;">🏛️</div>
        <div style="font-size:14px;color:#666;margin-top:8px;">Complete your farm profile to discover eligible schemes</div>
      </div>
    `;

    return schemes.map(scheme => `
      <div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);border-left:4px solid ${scheme.match_score >= 60 ? '#4CAF50' : scheme.match_score >= 40 ? '#FF9800' : '#9E9E9E'};">
        <div style="display:flex;justify-content:space-between;align-items:start;">
          <div style="flex:1;">
            <div style="font-size:15px;font-weight:600;color:#333;">${scheme.icon} ${scheme.title}</div>
            <div style="font-size:12px;color:#4CAF50;font-weight:500;margin-top:4px;">💰 ${scheme.benefit}</div>
          </div>
          <div style="background:${scheme.match_score >= 60 ? '#E8F5E9' : '#FFF3E0'};border-radius:6px;padding:4px 8px;font-size:11px;font-weight:600;color:${scheme.match_score >= 60 ? '#2E7D32' : '#E65100'};">
            ${scheme.match_score}% match
          </div>
        </div>
        <div style="font-size:12px;color:#666;margin-top:8px;">${scheme.eligibility_text}</div>
        ${scheme.match_reasons?.length ? `
          <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px;">
            ${scheme.match_reasons.map(r => `<span style="background:#F1F8E9;color:#33691E;font-size:10px;padding:3px 8px;border-radius:4px;">✓ ${r}</span>`).join('')}
          </div>
        ` : ''}
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:8px;border-top:1px solid #f0f0f0;">
          <div style="font-size:11px;color:#888;">📅 ${scheme.deadline || 'Ongoing'}</div>
          ${scheme.application_status
            ? `<span style="font-size:11px;font-weight:600;color:#1565C0;background:#E3F2FD;padding:4px 10px;border-radius:6px;">
                ${scheme.application_status.replace('_', ' ')}
              </span>`
            : `<button onclick="window._sdApply('${scheme.id}')" style="background:#1565C0;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:12px;font-weight:600;cursor:pointer;">
                Apply Now →
              </button>`
          }
        </div>
      </div>
    `).join('');
  }

  function renderApplications() {
    if (!applications.length) return '<div style="text-align:center;padding:40px;color:#888;">No applications yet. Apply for a scheme to get started!</div>';

    const statusColors = {
      submitted: '#FF9800', documents_uploaded: '#2196F3', under_review: '#9C27B0', approved: '#4CAF50', rejected: '#F44336', disbursed: '#00BCD4'
    };

    return applications.map(app => `
      <div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="font-size:14px;font-weight:600;color:#333;">${app.scheme_details?.icon || '📋'} ${app.scheme_title}</div>
          <span style="background:${statusColors[app.status] || '#9E9E9E'}22;color:${statusColors[app.status] || '#9E9E9E'};font-size:11px;font-weight:600;padding:4px 10px;border-radius:6px;">
            ${app.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        <div style="font-size:11px;color:#888;margin-top:6px;">Applied: ${new Date(app.created_at).toLocaleDateString('en-IN')}</div>
        ${app.documents_pending && JSON.parse(app.documents_pending || '[]').length ? `
          <div style="margin-top:8px;font-size:11px;color:#E65100;background:#FFF3E0;padding:6px 10px;border-radius:6px;">
            📎 Documents needed: ${JSON.parse(app.documents_pending).join(', ')}
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  function renderCategories() {
    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        ${categories.map(cat => `
          <div onclick="window._sdFilterCat('${cat.id}')" style="background:#fff;border-radius:12px;padding:16px;text-align:center;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,0.08);transition:transform 0.2s;">
            <div style="font-size:28px;">${cat.icon}</div>
            <div style="font-size:13px;font-weight:600;color:#333;margin-top:6px;">${cat.title}</div>
            <div style="font-size:11px;color:#888;">${cat.count} schemes</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Expose handlers
  window._sdTab = switchTab;
  window._sdApply = applyScheme;
  window._sdFilterCat = (catId) => {
    selectedCategory = catId;
    tab = 'matched';
    draw();
  };

  loadSchemes();
}
