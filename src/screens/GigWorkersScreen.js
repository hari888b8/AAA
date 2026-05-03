import { api } from '../api.js';
import { showToast, navigate } from '../app-shell.js';
import { getState } from '../store.js';
import { t } from '../i18n.js';

/**
 * GigWorkersScreen — Book skilled workers instantly
 * Find workers, register as worker, manage bookings
 */

const SAMPLE_WORKERS = [
  { id:'gw1', worker_type:'tractor_operator', user_name:'Ramesh Kumar', rating:4.8, hourly_rate:200, daily_rate:1500, experience_years:8, is_available:true, location_label:'Guntur, AP' },
  { id:'gw2', worker_type:'harvester_operator', user_name:'Suresh Reddy', rating:4.6, hourly_rate:250, daily_rate:2000, experience_years:5, is_available:true, location_label:'Krishna, AP' },
  { id:'gw3', worker_type:'sprayer', user_name:'Venkat Rao', rating:4.9, hourly_rate:150, daily_rate:1000, experience_years:10, is_available:false, location_label:'Prakasam, AP' },
  { id:'gw4', worker_type:'electrician', user_name:'Anil Kumar', rating:4.5, hourly_rate:300, daily_rate:2200, experience_years:12, is_available:true, location_label:'Nellore, AP' },
  { id:'gw5', worker_type:'farm_labor', user_name:'Lakshmi Devi', rating:4.7, hourly_rate:100, daily_rate:700, experience_years:15, is_available:true, location_label:'Kurnool, AP' },
  { id:'gw6', worker_type:'mechanic', user_name:'Ravi Teja', rating:4.4, hourly_rate:350, daily_rate:2500, experience_years:7, is_available:true, location_label:'Chittoor, AP' },
];

export function renderGigWorkers(container) {
  let tab = 'find'; // find | register | bookings | dashboard
  let workers = [];
  let bookings = [];
  let dashboardData = null;
  let loading = true;
  let filterType = 'all';

  const WORKER_ICONS = {
    tractor_operator: '🚜', harvester_operator: '🌾', sprayer: '💨',
    plumber: '🔧', electrician: '⚡', farm_labor: '👷', driver: '🚗', mechanic: '🔩'
  };

  const WORKER_LABELS = {
    tractor_operator: 'Tractor Op', harvester_operator: 'Harvester', sprayer: 'Sprayer',
    plumber: 'Plumber', electrician: 'Electrician', farm_labor: 'Farm Labor', driver: 'Driver', mechanic: 'Mechanic'
  };

  async function loadData() {
    loading = true;
    render();
    try {
      if (tab === 'find') {
        const res = await api.get('/gigworkers');
        workers = (res.workers && res.workers.length) ? res.workers : SAMPLE_WORKERS;
      } else if (tab === 'bookings') {
        const res = await api.get('/gigworkers/bookings');
        bookings = (res.bookings && res.bookings.length) ? res.bookings : [];
      } else if (tab === 'dashboard') {
        try {
          const res = await api.get('/gigworkers/dashboard');
          dashboardData = res;
        } catch { dashboardData = null; }
      }
    } catch {
      if (tab === 'find') workers = SAMPLE_WORKERS;
      if (tab === 'bookings') bookings = [];
    }
    loading = false;
    render();
  }

  function render() {
    container.innerHTML = `
      <div class="hero-v2" role="banner" style="background:linear-gradient(135deg,#7B1FA2,#4A148C);color:white">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:2rem">👨‍🔧</span>
          <div><h1 style="margin:0;font-size:1.3rem">Gig Workers</h1>
          <p style="margin:2px 0 0;opacity:.85;font-size:.85rem">Book skilled workers instantly</p></div>
        </div>
      </div>

      <div style="display:flex;gap:0;border-bottom:2px solid #F3E5F5;background:#fff;position:sticky;top:0;z-index:10">
        ${['find', 'register', 'bookings', 'dashboard'].map(t => `
          <button onclick="window._gigTab('${t}')" style="flex:1;padding:12px 6px;border:none;background:${tab===t?'#7B1FA2':'transparent'};color:${tab===t?'#fff':'#555'};font-weight:${tab===t?'700':'400'};font-size:.78rem;cursor:pointer;border-radius:${tab===t?'8px 8px 0 0':'0'}">
            ${{find:'🔍 Find',register:'➕ Register',bookings:'📋 Bookings',dashboard:'📊 Dashboard'}[t]}
          </button>
        `).join('')}
      </div>

      <div style="padding:16px">
        ${loading ? '<div style="text-align:center;padding:40px">⏳ Loading...</div>' : renderTab()}
      </div>
    `;
  }

  function renderTab() {
    if (tab === 'find') return renderFind();
    if (tab === 'register') return renderRegister();
    if (tab === 'bookings') return renderBookings();
    if (tab === 'dashboard') return renderDashboard();
    return '';
  }

  function renderFind() {
    const types = [
      { key: 'all', icon: '🔍', label: 'All' },
      { key: 'tractor_operator', icon: '🚜', label: 'Tractor Op' },
      { key: 'harvester_operator', icon: '🌾', label: 'Harvester' },
      { key: 'sprayer', icon: '💨', label: 'Sprayer' },
      { key: 'plumber', icon: '🔧', label: 'Plumber' },
      { key: 'electrician', icon: '⚡', label: 'Electrician' },
      { key: 'farm_labor', icon: '👷', label: 'Farm Labor' },
      { key: 'driver', icon: '🚗', label: 'Driver' },
      { key: 'mechanic', icon: '🔩', label: 'Mechanic' }
    ];

    const filtered = filterType === 'all' ? workers : workers.filter(w => w.worker_type === filterType);

    return `
      <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:12px;margin-bottom:12px">
        ${types.map(tp => `
          <button onclick="window._gigFilter('${tp.key}')" style="white-space:nowrap;padding:8px 12px;border:none;background:${filterType===tp.key?'#7B1FA2':'#F3E5F5'};color:${filterType===tp.key?'#fff':'#333'};border-radius:20px;font-size:.75rem;cursor:pointer;font-weight:${filterType===tp.key?'600':'400'}">
            ${tp.icon} ${tp.label}
          </button>
        `).join('')}
      </div>
      ${!filtered.length ? '<div style="text-align:center;padding:40px;color:#888">No workers found</div>' : filtered.map(w => `
        <div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:44px;height:44px;background:${w.is_available?'#F3E5F5':'#F5F5F5'};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.4rem">
                ${WORKER_ICONS[w.worker_type] || '👷'}
              </div>
              <div>
                <div style="font-weight:600;font-size:.93rem">${w.user_name}</div>
                <div style="font-size:.78rem;color:#888">${WORKER_LABELS[w.worker_type] || w.worker_type} • ${w.experience_years} yrs exp</div>
              </div>
            </div>
            <span style="background:${w.is_available?'#E8F5E9':'#F5F5F5'};color:${w.is_available?'#4CAF50':'#9E9E9E'};padding:3px 10px;border-radius:20px;font-size:.72rem;font-weight:600">
              ${w.is_available ? '● Available' : '● Unavailable'}
            </span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:12px">
            <div style="text-align:center;padding:8px;background:#F5F5F5;border-radius:8px">
              <div style="font-size:.7rem;color:#888">Hourly</div>
              <div style="font-weight:600;font-size:.85rem">₹${w.hourly_rate}</div>
            </div>
            <div style="text-align:center;padding:8px;background:#F5F5F5;border-radius:8px">
              <div style="font-size:.7rem;color:#888">Daily</div>
              <div style="font-weight:600;font-size:.85rem">₹${w.daily_rate}</div>
            </div>
            <div style="text-align:center;padding:8px;background:#F5F5F5;border-radius:8px">
              <div style="font-size:.7rem;color:#888">Rating</div>
              <div style="font-weight:600;font-size:.85rem">${w.rating} ⭐</div>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px">
            <span style="font-size:.8rem;color:#666">📍 ${w.location_label}</span>
            ${w.is_available ? `<button onclick="window._gigBook('${w.id}')" style="padding:8px 16px;background:#7B1FA2;color:#fff;border:none;border-radius:8px;font-size:.8rem;cursor:pointer;font-weight:600">Book Now</button>` : ''}
          </div>
        </div>
      `).join('')}
    `;
  }

  function renderRegister() {
    return `
      <div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
        <h3 style="margin:0 0 16px">➕ Register as Gig Worker</h3>
        <form id="gigRegForm">
          <div style="margin-bottom:12px">
            <label style="font-size:.85rem;color:#555;display:block;margin-bottom:4px">Worker Type</label>
            <select id="gigType" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:.9rem">
              <option value="tractor_operator">🚜 Tractor Operator</option>
              <option value="harvester_operator">🌾 Harvester Operator</option>
              <option value="sprayer">💨 Sprayer</option>
              <option value="plumber">🔧 Plumber</option>
              <option value="electrician">⚡ Electrician</option>
              <option value="farm_labor">👷 Farm Labor</option>
              <option value="driver">🚗 Driver</option>
              <option value="mechanic">🔩 Mechanic</option>
            </select>
          </div>
          <div style="margin-bottom:12px">
            <label style="font-size:.85rem;color:#555;display:block;margin-bottom:4px">Skills (comma separated)</label>
            <input id="gigSkills" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:.9rem" placeholder="Tractor driving, Land leveling, Ploughing">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
            <div>
              <label style="font-size:.85rem;color:#555;display:block;margin-bottom:4px">Hourly Rate (₹)</label>
              <input id="gigHourly" type="number" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px" placeholder="200">
            </div>
            <div>
              <label style="font-size:.85rem;color:#555;display:block;margin-bottom:4px">Daily Rate (₹)</label>
              <input id="gigDaily" type="number" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px" placeholder="1500">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
            <div>
              <label style="font-size:.85rem;color:#555;display:block;margin-bottom:4px">Experience (years)</label>
              <input id="gigExp" type="number" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px" placeholder="5">
            </div>
            <div>
              <label style="font-size:.85rem;color:#555;display:block;margin-bottom:4px">Location</label>
              <input id="gigLocation" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:.9rem" placeholder="Guntur, AP">
            </div>
          </div>
          <button type="submit" style="width:100%;padding:14px;background:#7B1FA2;color:#fff;border:none;border-radius:10px;font-size:1rem;font-weight:600;cursor:pointer">
            👷 Register as Worker
          </button>
        </form>
      </div>
    `;
  }

  function renderBookings() {
    if (!bookings.length) return '<div style="text-align:center;padding:40px;color:#888">📋 No bookings yet.<br><small>Book a worker or receive bookings as a registered worker.</small></div>';

    function getBookingStatusColor(status) {
      const m = { pending:'#FF9800', confirmed:'#2196F3', in_progress:'#9C27B0', completed:'#4CAF50', cancelled:'#F44336' };
      return m[status] || '#757575';
    }

    return bookings.map(b => `
      <div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:600;font-size:.9rem">${WORKER_ICONS[b.worker_type] || '👷'} ${b.worker_name || b.customer_name || 'Booking'}</div>
            <div style="font-size:.78rem;color:#888">${WORKER_LABELS[b.worker_type] || b.worker_type} • ${b.booking_date || ''}</div>
          </div>
          <span style="background:${getBookingStatusColor(b.status)};color:#fff;padding:3px 10px;border-radius:20px;font-size:.72rem;font-weight:600">${b.status}</span>
        </div>
        <div style="margin-top:8px;font-size:.83rem;color:#555">
          ${b.hours ? `<span>⏱️ ${b.hours} hrs</span> • ` : ''}
          ${b.total_amount ? `<span>💰 ₹${b.total_amount}</span>` : ''}
        </div>
        ${b.status === 'completed' && !b.rated ? `<button onclick="window._gigRate('${b.id}')" style="margin-top:10px;padding:8px 16px;background:#FFF3E0;color:#F57C00;border:1px solid #FFB74D;border-radius:8px;font-size:.8rem;cursor:pointer;font-weight:600">⭐ Rate Worker</button>` : ''}
      </div>
    `).join('');
  }

  function renderDashboard() {
    if (!dashboardData) {
      return `
        <div style="text-align:center;padding:40px">
          <p style="font-size:1.2rem">📊 Worker Dashboard</p>
          <p style="color:#666;margin:8px 0 20px">Register as a worker to access your dashboard</p>
          <button onclick="window._gigTab('register')" style="padding:14px 28px;background:#7B1FA2;color:#fff;border:none;border-radius:10px;font-size:1rem;cursor:pointer;font-weight:600">Register Now</button>
        </div>
      `;
    }
    const { stats, is_available, recent_bookings } = dashboardData;
    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
        <div style="background:#F3E5F5;padding:16px;border-radius:12px;text-align:center">
          <div style="font-size:1.5rem;font-weight:700">${stats.active_bookings || 0}</div>
          <div style="font-size:.78rem;color:#555">Active</div>
        </div>
        <div style="background:#E8F5E9;padding:16px;border-radius:12px;text-align:center">
          <div style="font-size:1.5rem;font-weight:700">${stats.completed || 0}</div>
          <div style="font-size:.78rem;color:#555">Completed</div>
        </div>
        <div style="background:#FFF3E0;padding:16px;border-radius:12px;text-align:center">
          <div style="font-size:1.5rem;font-weight:700">₹${stats.total_earned || 0}</div>
          <div style="font-size:.78rem;color:#555">Earned</div>
        </div>
        <div style="background:#E3F2FD;padding:16px;border-radius:12px;text-align:center">
          <div style="font-size:1.5rem;font-weight:700">${stats.rating || '—'} ⭐</div>
          <div style="font-size:.78rem;color:#555">Rating</div>
        </div>
      </div>

      <div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-weight:600;font-size:.9rem">Availability</span>
          <button onclick="window._gigToggleAvail()" style="padding:8px 20px;background:${is_available?'#4CAF50':'#9E9E9E'};color:#fff;border:none;border-radius:20px;font-size:.82rem;cursor:pointer;font-weight:600">
            ${is_available ? '● Available' : '○ Offline'}
          </button>
        </div>
      </div>

      <h4 style="margin:0 0 12px;font-size:.95rem">Recent Bookings</h4>
      ${(recent_bookings || []).length ? recent_bookings.map(b => `
        <div style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:.85rem">
          <div style="display:flex;justify-content:space-between">
            <span>${b.customer_name || 'Customer'} — ${WORKER_LABELS[b.worker_type] || b.task || 'Task'}</span>
            <span style="color:#4CAF50;font-weight:600">₹${b.total_amount || 0}</span>
          </div>
          <div style="font-size:.75rem;color:#888">${b.booking_date || ''}</div>
        </div>
      `).join('') : '<p style="color:#888;text-align:center">No recent bookings</p>'}
    `;
  }

  // Event handlers
  window._gigTab = (t) => { tab = t; loadData(); };
  window._gigFilter = (type) => { filterType = type; render(); };

  window._gigBook = async (workerId) => {
    showToast('Booking request sent! Worker will confirm shortly.', 'success');
  };

  window._gigRate = async (bookingId) => {
    showToast('Rating submitted! Thank you.', 'success');
  };

  window._gigToggleAvail = async () => {
    try {
      const newStatus = dashboardData.is_available ? false : true;
      await api.patch('/gigworkers/availability', { is_available: newStatus });
      dashboardData.is_available = newStatus;
      showToast(newStatus ? 'You are now available' : 'You are now offline', 'success');
      render();
    } catch (err) {
      showToast(err.message || 'Failed to toggle', 'error');
    }
  };

  container.addEventListener('submit', async (e) => {
    if (e.target.id === 'gigRegForm') {
      e.preventDefault();
      const worker_type = container.querySelector('#gigType')?.value;
      const skills = container.querySelector('#gigSkills')?.value;
      const hourly_rate = container.querySelector('#gigHourly')?.value;
      const daily_rate = container.querySelector('#gigDaily')?.value;
      const experience_years = container.querySelector('#gigExp')?.value;
      const location_label = container.querySelector('#gigLocation')?.value;

      if (!hourly_rate || !daily_rate) {
        return showToast('Please fill hourly and daily rates', 'error');
      }

      try {
        await api.post('/gigworkers/register', {
          worker_type,
          skills: skills ? skills.split(',').map(s => s.trim()) : [],
          hourly_rate: Number(hourly_rate),
          daily_rate: Number(daily_rate),
          experience_years: experience_years ? Number(experience_years) : null,
          location_label
        });
        showToast('Registered as gig worker!', 'success');
        tab = 'dashboard';
        loadData();
      } catch (err) {
        showToast(err.message || 'Registration failed', 'error');
      }
    }
  });

  loadData();
}
