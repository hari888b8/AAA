import { api } from '../api.js';
import { showToast, navigate } from '../app-shell.js';
import { getState } from '../store.js';
import { t } from '../i18n.js';

/**
 * CropPlanningScreen — AI Crop Planning & Season P&L
 * Recommendations, plans, task management, season reports
 */

export function renderCropPlanning(container) {
  let tab = 'recommend'; // recommend | plans | tasks | report
  let recommendations = [];
  let plans = [];
  let currentPlan = null;
  let tasks = [];
  let seasonReport = null;
  let loading = true;

  async function loadData() {
    loading = true;
    render();
    try {
      if (tab === 'recommend') {
        const res = await api.get('/cropplan/recommend');
        recommendations = res.recommendations || [];
      } else if (tab === 'plans') {
        const res = await api.get('/cropplan/plans');
        plans = res.plans || [];
      } else if (tab === 'report') {
        const res = await api.get('/cropplan/season-report');
        seasonReport = res.report || null;
      }
    } catch (err) {
      recommendations = []; plans = [];
    }
    loading = false;
    render();
  }

  function render() {
    container.innerHTML = `
      <div class="hero-v2" role="banner" style="background:linear-gradient(135deg,#6A1B9A,#4A148C);color:white">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:2rem">🧠</span>
          <div><h1 style="margin:0;font-size:1.3rem">Crop Planning AI</h1>
          <p style="margin:2px 0 0;opacity:.85;font-size:.85rem">Smart recommendations • Season P&L • Task tracking</p></div>
        </div>
      </div>

      <div style="display:flex;gap:0;border-bottom:2px solid #F3E5F5;background:#fff;position:sticky;top:0;z-index:10">
        ${['recommend', 'plans', 'tasks', 'report'].map(t => `
          <button onclick="window._cpTab('${t}')" style="flex:1;padding:12px 8px;border:none;background:${tab===t?'#6A1B9A':'transparent'};color:${tab===t?'#fff':'#555'};font-weight:${tab===t?'700':'400'};font-size:.8rem;cursor:pointer;border-radius:${tab===t?'8px 8px 0 0':'0'}">
            ${{recommend:'🧠 Suggest',plans:'📋 Plans',tasks:'✅ Tasks',report:'📊 P&L'}[t]}
          </button>
        `).join('')}
      </div>

      <div style="padding:16px">
        ${loading ? '<div style="text-align:center;padding:40px">⏳ Loading...</div>' : renderTab()}
      </div>
    `;
  }

  function renderTab() {
    if (tab === 'recommend') return renderRecommendations();
    if (tab === 'plans') return renderPlans();
    if (tab === 'tasks') return renderTasks();
    if (tab === 'report') return renderReport();
    return '';
  }

  function renderRecommendations() {
    if (!recommendations.length) return '<div style="text-align:center;padding:40px;color:#888">🧠 Complete your profile (soil type, land, irrigation) for personalized crop recommendations</div>';
    return `
      <h3 style="margin:0 0 4px;font-size:1rem">🌾 Recommended Crops for Next Season</h3>
      <p style="color:#666;font-size:.8rem;margin:0 0 16px">${recommendations[0]?.season || ''} ${recommendations[0]?.year || ''}</p>
      ${recommendations.map((r, idx) => `
        <div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,.06);border-left:4px solid ${idx===0?'#6A1B9A':idx===1?'#AB47BC':'#CE93D8'}">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <span style="font-weight:700;font-size:1rem">${r.crop_name}</span>
              ${r.crop_name_te ? `<span style="font-size:.8rem;color:#666;margin-left:6px">(${r.crop_name_te})</span>` : ''}
            </div>
            <div style="background:#F3E5F5;padding:4px 10px;border-radius:12px;font-size:.8rem;font-weight:700;color:#6A1B9A">
              Score: ${r.score}/100
            </div>
          </div>
          <div style="margin-top:8px;font-size:.82rem;color:#555">
            ${r.reasons.map(reason => `<div style="margin:2px 0">• ${reason}</div>`).join('')}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:12px;background:#FAFAFA;padding:10px;border-radius:8px">
            <div style="text-align:center"><div style="font-size:.7rem;color:#888">Cost/acre</div><div style="font-weight:600;font-size:.85rem">₹${r.estimated_cost_per_acre?.toLocaleString() || '—'}</div></div>
            <div style="text-align:center"><div style="font-size:.7rem;color:#888">Yield/acre</div><div style="font-weight:600;font-size:.85rem">${r.estimated_yield_per_acre || '—'} kg</div></div>
            <div style="text-align:center"><div style="font-size:.7rem;color:#888">Price</div><div style="font-weight:600;font-size:.85rem">₹${r.estimated_price || '—'}/kg</div></div>
          </div>
          <button onclick="window._acceptPlan('${r.crop_id}','${r.season}',${r.year})" style="width:100%;margin-top:12px;padding:10px;background:#6A1B9A;color:#fff;border:none;border-radius:8px;font-size:.85rem;cursor:pointer">
            ✅ Accept & Create Plan
          </button>
        </div>
      `).join('')}
    `;
  }

  function renderPlans() {
    if (!plans.length) return '<div style="text-align:center;padding:40px;color:#888">📋 No plans yet.<br><small>Get recommendations and accept a crop plan!</small></div>';
    return plans.map(p => `
      <div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-weight:600">${p.crop_name || 'Crop Plan'}</span>
          <span style="background:${p.status==='completed'?'#4CAF50':p.status==='in_progress'?'#2196F3':'#FF9800'};color:#fff;padding:4px 10px;border-radius:20px;font-size:.75rem">${p.status}</span>
        </div>
        <div style="margin-top:8px;font-size:.85rem;color:#555">
          <div>🌾 ${p.season} ${p.year} ${p.field_name ? '• ' + p.field_name : ''}</div>
          ${p.area_acres ? `<div>📐 ${p.area_acres} acres</div>` : ''}
          ${p.projected_profit ? `<div>💰 Projected: ₹${p.projected_profit.toLocaleString()}</div>` : ''}
        </div>
        <button onclick="window._viewPlan('${p.id}')" style="margin-top:10px;padding:8px 16px;background:#F3E5F5;color:#6A1B9A;border:none;border-radius:8px;font-size:.8rem;cursor:pointer;font-weight:600">View Tasks →</button>
      </div>
    `).join('');
  }

  function renderTasks() {
    if (!currentPlan) return '<div style="text-align:center;padding:40px;color:#888">✅ Select a plan to view tasks</div>';
    return `
      <h3 style="margin:0 0 12px;font-size:1rem">📋 Task Checklist</h3>
      ${tasks.map(task => `
        <div style="background:#fff;border-radius:10px;padding:12px 16px;margin-bottom:8px;display:flex;gap:12px;align-items:center;box-shadow:0 1px 4px rgba(0,0,0,.04)">
          <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="window._completeTask('${task.id}')"
            style="width:20px;height:20px;accent-color:#6A1B9A;cursor:pointer">
          <div style="flex:1">
            <div style="font-weight:${task.completed?'400':'600'};text-decoration:${task.completed?'line-through':'none'};font-size:.9rem">${task.title}</div>
            ${task.title_te ? `<div style="font-size:.75rem;color:#888">${task.title_te}</div>` : ''}
            ${task.due_date ? `<div style="font-size:.75rem;color:#888;margin-top:2px">📅 Due: ${new Date(task.due_date).toLocaleDateString()}</div>` : ''}
          </div>
        </div>
      `).join('')}
    `;
  }

  function renderReport() {
    if (!seasonReport) return '<div style="text-align:center;padding:40px;color:#888">📊 No season data yet.<br><small>Complete a crop plan to see your P&L report.</small></div>';
    const r = seasonReport;
    return `
      <div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
        <h3 style="margin:0 0 16px">📊 Season Report: ${r.season} ${r.year}</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
          <div style="background:#E8F5E9;padding:14px;border-radius:10px;text-align:center">
            <div style="font-size:.75rem;color:#555">Revenue</div>
            <div style="font-size:1.2rem;font-weight:700;color:#2E7D32">₹${(r.total_revenue || 0).toLocaleString()}</div>
          </div>
          <div style="background:#FFEBEE;padding:14px;border-radius:10px;text-align:center">
            <div style="font-size:.75rem;color:#555">Investment</div>
            <div style="font-size:1.2rem;font-weight:700;color:#C62828">₹${(r.total_investment || 0).toLocaleString()}</div>
          </div>
          <div style="background:${(r.net_profit || 0) >= 0 ? '#E8F5E9' : '#FFEBEE'};padding:14px;border-radius:10px;text-align:center;grid-column:span 2">
            <div style="font-size:.75rem;color:#555">Net Profit</div>
            <div style="font-size:1.5rem;font-weight:700;color:${(r.net_profit || 0) >= 0 ? '#2E7D32' : '#C62828'}">₹${(r.net_profit || 0).toLocaleString()}</div>
          </div>
        </div>
        ${r.total_area_acres ? `<div style="font-size:.85rem;color:#555;text-align:center">Total area: ${r.total_area_acres} acres</div>` : ''}
      </div>
    `;
  }

  // Event handlers
  window._cpTab = (t) => { tab = t; loadData(); };
  window._acceptPlan = async (cropId, season, year) => {
    try {
      await api.post('/cropplan/plans', {
        selected_crop: cropId, season, year,
        estimated_cost_per_acre: 15000,
        estimated_yield_per_acre: 2000,
        estimated_price: 25
      });
      showToast('Crop plan created! Check your tasks.', 'success');
      tab = 'plans';
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };
  window._viewPlan = async (planId) => {
    try {
      const res = await api.get(`/cropplan/plans/${planId}`);
      currentPlan = res.plan;
      tasks = res.tasks || [];
      tab = 'tasks';
      loading = false;
      render();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };
  window._completeTask = async (taskId) => {
    try {
      await api.patch(`/cropplan/tasks/${taskId}/complete`);
      if (currentPlan) {
        const res = await api.get(`/cropplan/plans/${currentPlan.id}`);
        tasks = res.tasks || [];
        render();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  loadData();
}
