import { api } from '../api.js';
import { showToast, showModal, closeModal } from '../main.js';
import { getRole } from '../store.js';

export function renderKisan(container) {
  const role = getRole();
  let mode = role === 'buyer' ? 'buyer' : 'seller'; // dual-mode toggle
  let tab = 'equipment';
  let equipment = [], jobs = [], stats = {};
  let loading = true;

  function render() {
    container.innerHTML = `
      <div class="mode-toggle" style="display:flex;margin:8px 16px;background:var(--surface);border-radius:12px;padding:3px;border:1px solid var(--border)">
        <button class="mode-btn ${mode === 'buyer' ? 'active' : ''}" data-mode="buyer" style="flex:1;padding:8px;border-radius:10px;font-size:13px;font-weight:600;border:none;cursor:pointer;transition:all .2s;${mode === 'buyer' ? 'background:var(--primary);color:white;box-shadow:0 2px 6px rgba(0,0,0,0.15)' : 'background:transparent;color:var(--text2)'}">🛒 Buyer Mode</button>
        <button class="mode-btn ${mode === 'seller' ? 'active' : ''}" data-mode="seller" style="flex:1;padding:8px;border-radius:10px;font-size:13px;font-weight:600;border:none;cursor:pointer;transition:all .2s;${mode === 'seller' ? 'background:var(--primary);color:white;box-shadow:0 2px 6px rgba(0,0,0,0.15)' : 'background:transparent;color:var(--text2)'}">🏷️ Seller Mode</button>
      </div>
      <div class="tab-bar">
        ${mode === 'seller' ? `
          <button class="tab-btn ${tab === 'equipment' ? 'active' : ''}" data-tab="equipment">🚜 My Equipment</button>
          <button class="tab-btn ${tab === 'jobs' ? 'active' : ''}" data-tab="jobs">💼 My Jobs</button>
          <button class="tab-btn ${tab === 'earnings' ? 'active' : ''}" data-tab="earnings">💰 Earnings</button>
        ` : `
          <button class="tab-btn ${tab === 'equipment' ? 'active' : ''}" data-tab="equipment">🚜 Rent Equipment</button>
          <button class="tab-btn ${tab === 'jobs' ? 'active' : ''}" data-tab="jobs">💼 Find Jobs</button>
          <button class="tab-btn ${tab === 'services' ? 'active' : ''}" data-tab="services">🔧 Services</button>
        `}
      </div>
      ${loading ? '<div class="loading"><div class="spinner"></div></div>'
        : tab === 'equipment' ? renderEquipment()
        : tab === 'jobs' ? renderJobs()
        : tab === 'earnings' ? renderEarnings()
        : tab === 'services' ? renderServices()
        : ''}
    `;
    container.querySelectorAll('.mode-btn').forEach(b => b.addEventListener('click', () => {
      mode = b.dataset.mode; tab = 'equipment'; render();
    }));
    container.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; render(); }));
    container.querySelectorAll('.book-btn').forEach(b => b.addEventListener('click', () => showBooking(b.dataset.id)));
    container.querySelector('#postJobBtn')?.addEventListener('click', showPostJob);
    container.querySelector('#listEquipBtn')?.addEventListener('click', showListEquipment);
    container.querySelectorAll('.apply-btn').forEach(b => {
      b.addEventListener('click', () => {
        const j = jobs.find(x => x.id == b.dataset.jid);
        if (!j) return;
        showModal(`<div class="modal-handle"></div><h3>Apply — ${j.title}</h3>
          <div class="card" style="box-shadow:none;background:var(--bg);margin-bottom:12px">
            <div class="flex-between mb"><span>Employer</span><span class="fw-600">${j.employer_name || 'N/A'}</span></div>
            <div class="flex-between mb"><span>Salary</span><span class="fw-600">₹${Number(j.salary_min || 0).toLocaleString()}/${j.salary_period || 'month'}</span></div>
            <div class="flex-between"><span>Type</span><span>${j.job_type}</span></div>
          </div>
          <div class="form-group"><label>Your Experience</label><textarea class="form-input" id="appExp" rows="2" placeholder="Describe your relevant experience…"></textarea></div>
          <div class="form-group"><label>Expected Salary (₹)</label><input class="form-input" type="number" id="appSalary" placeholder="${j.salary_min || ''}"></div>
          <div class="form-group"><label>Available From</label><input class="form-input" type="date" id="appDate"></div>
          <button class="btn btn-primary" id="submitApp">Submit Application</button>`);
        document.querySelector('#submitApp')?.addEventListener('click', async () => {
          try {
            await api.applyJob(j.id, {
              experience: document.querySelector('#appExp')?.value,
              expected_salary: Number(document.querySelector('#appSalary')?.value) || undefined,
              available_from: document.querySelector('#appDate')?.value || undefined,
            });
            showToast('Application submitted!', 'success'); closeModal();
          } catch (e) { showToast(e.message, 'error'); }
        });
      });
    });
  }

  function renderEarnings() {
    return `<div class="section" style="padding-top:8px">
      <div class="stats-grid mb-lg">
        <div class="stat-card"><div class="stat-icon">💰</div><div class="stat-value">₹0</div><div class="stat-label">Total Earned</div></div>
        <div class="stat-card"><div class="stat-icon">📋</div><div class="stat-value">0</div><div class="stat-label">Bookings</div></div>
        <div class="stat-card"><div class="stat-icon">⭐</div><div class="stat-value">0.0</div><div class="stat-label">Rating</div></div>
      </div>
      <div class="card" style="padding:16px;margin-bottom:12px">
        <div class="fw-700" style="margin-bottom:8px">💳 Payment History</div>
        <div class="empty-state" style="padding:20px 0"><div class="es-icon">💰</div><div class="es-title">No earnings yet</div><div class="es-text">List equipment or services to start earning</div></div>
      </div>
      <div class="card" style="padding:16px;margin-bottom:12px;background:var(--info-bg);border:1px solid var(--info)">
        <div class="fw-700 text-sm" style="margin-bottom:4px">🔒 Escrow Protection</div>
        <div class="text-sm text-muted">All payments are held in escrow until delivery is confirmed. Commission: 8-15% of rental value.</div>
      </div>
    </div>`;
  }

  function renderServices() {
    const services = [
      { icon: '💧', name: 'Drip Irrigation Install', rate: '₹5,000-₹15,000', category: 'irrigation' },
      { icon: '🧪', name: 'Soil Testing', rate: '₹200-₹500', category: 'testing' },
      { icon: '🐄', name: 'Veterinary Visit', rate: '₹300-₹1,000', category: 'veterinary' },
      { icon: '🏗️', name: 'Warehouse Storage', rate: '₹5-₹15/quintal/day', category: 'storage' },
      { icon: '🚛', name: 'Transport Service', rate: '₹15-₹25/km', category: 'transport' },
      { icon: '🌿', name: 'Pest Control', rate: '₹500-₹2,000', category: 'crop_care' },
    ];
    return `<div class="section" style="padding-top:8px">
      <div class="section-title">🔧 Available Services</div>
      ${services.map(s => `
        <div class="listing-card">
          <div class="l-icon">${s.icon}</div>
          <div class="l-body">
            <div class="l-title">${s.name}</div>
            <div class="l-meta">${s.category} · Available in your district</div>
          </div>
          <div style="text-align:right">
            <div class="l-price" style="font-size:12px">${s.rate}</div>
            <button class="btn btn-primary btn-small mt-sm">Book</button>
          </div>
        </div>
      `).join('')}
      <div class="card" style="padding:16px;margin-bottom:12px;background:var(--accent-light);border:1px solid var(--accent)">
        <div class="fw-600 text-sm">💡 Lead Generation</div>
        <div class="text-sm text-muted" style="margin-top:4px">Service providers pay ₹10-₹50 per lead. Farmers get services at best prices.</div>
      </div>
    </div>`;
  }

  function renderEquipment() {
    return `
      <div class="section" style="padding-top:8px">
        <div class="stats-grid-2 mb-lg">
          <div class="stat-card"><div class="stat-value">${stats.total_equipment || equipment.length}</div><div class="stat-label">${mode === 'seller' ? 'My Equipment' : 'Available'}</div></div>
          <div class="stat-card"><div class="stat-value">${stats.available_equipment || 0}</div><div class="stat-label">${mode === 'seller' ? 'Active Listings' : 'Nearby'}</div></div>
        </div>
        ${mode === 'seller' ? '<button class="btn btn-primary btn-small mb" id="listEquipBtn">+ List Equipment</button>' : ''}
        ${equipment.length === 0 ? `<div class="empty-state"><div class="es-icon">🚜</div><div class="es-title">${mode === 'seller' ? 'No equipment listed' : 'No equipment available'}</div>${mode === 'seller' ? '<button class="btn btn-primary btn-small mt" id="listEquipBtn">+ List Equipment</button>' : ''}</div>`
          : equipment.map(e => `
            <div class="listing-card">
              <div class="l-icon">🚜</div>
              <div class="l-body">
                <div class="l-title">${e.name}</div>
                <div class="l-meta">${e.equipment_type || 'General'} · ${e.district_name || ''}</div>
                <div class="l-tags">
                  <span class="tag tag-${e.status === 'available' ? 'green' : 'orange'}">${e.status}</span>
                  ${e.rating ? `<span class="tag tag-gray">⭐ ${Number(e.rating).toFixed(1)}</span>` : ''}
                </div>
              </div>
              <div style="text-align:right">
                <div class="l-price">₹${Number(e.daily_rate || 0).toLocaleString()}/day</div>
                ${e.status === 'available' ? `<button class="btn btn-primary btn-small mt-sm book-btn" data-id="${e.id}">Book</button>` : ''}
              </div>
            </div>
          `).join('')}
      </div>`;
  }

  function renderJobs() {
    return `
      <div class="section" style="padding-top:8px">
        <div class="stats-grid-2 mb-lg">
          <div class="stat-card"><div class="stat-value">${stats.active_jobs || jobs.length}</div><div class="stat-label">Active Jobs</div></div>
          <div class="stat-card"><div class="stat-value">${stats.total_vacancies || 0}</div><div class="stat-label">Vacancies</div></div>
        </div>
        ${jobs.length === 0 ? `<div class="empty-state"><div class="es-icon">💼</div><div class="es-title">${mode === 'seller' ? 'No jobs posted' : 'No jobs available'}</div>${mode === 'seller' ? '<button class="btn btn-primary btn-small mt" id="postJobBtn">+ Post Job</button>' : ''}</div>`
          : `${mode === 'seller' ? '<button class="btn btn-primary btn-small mb" id="postJobBtn">+ Post Job</button>' : ''}
          ${jobs.map(j => `
            <div class="card">
              <div class="flex-between">
                <div class="fw-700">${j.title}</div>
                <span class="tag tag-blue">${j.job_type || 'general'}</span>
              </div>
              <div class="text-sm text-muted mt-sm">${j.employer_name || ''} · ${j.location_label || j.district_name || ''}</div>
              <div class="flex-between mt-sm">
                <span class="text-sm fw-600" style="color:var(--primary)">₹${Number(j.salary_min || 0).toLocaleString()}${j.salary_max ? ' - ₹' + Number(j.salary_max).toLocaleString() : ''}/${j.salary_period || 'month'}</span>
                <span class="text-sm text-muted">${j.vacancies || 0} openings</span>
              </div>
              ${j.days_remaining ? `<div class="text-sm text-muted mt-sm">⏰ ${j.days_remaining} days left</div>` : ''}
              ${mode === 'buyer' ? `<button class="btn btn-primary btn-small mt-sm apply-btn" data-jid="${j.id}">Apply Now</button>` : ''}
            </div>
          `).join('')}`}
      </div>`;
  }

  function showBooking(id) {
    const e = equipment.find(x => x.id == id);
    if (!e) return;
    showModal(`
      <div class="modal-handle"></div>
      <h3>Book ${e.name}</h3>
      <div class="card" style="box-shadow:none;background:var(--bg)">
        <div class="flex-between mb"><span>Rate</span><span class="fw-700">₹${Number(e.daily_rate).toLocaleString()}/day</span></div>
      </div>
      <div class="form-group mt"><label>Start Date</label><input class="form-input" type="date" id="bStart"></div>
      <div class="form-group"><label>End Date</label><input class="form-input" type="date" id="bEnd"></div>
      <div class="form-group"><label>Notes</label><textarea class="form-input" id="bNotes" placeholder="Any special requirements…"></textarea></div>
      <button class="btn btn-primary" id="confirmBook">Confirm Booking</button>
    `);
    document.querySelector('#confirmBook')?.addEventListener('click', async () => {
      try {
        const res = await api.bookEquipment(e.id, {
          start_date: document.querySelector('#bStart')?.value,
          end_date: document.querySelector('#bEnd')?.value,
          notes: document.querySelector('#bNotes')?.value,
        });
        showToast(`Booked! Total: ₹${res.booking?.total_amount || 'N/A'}`, 'success');
        closeModal(); loadData();
      } catch (e) { showToast(e.message, 'error'); }
    });
  }

  function showPostJob() {
    showModal(`
      <div class="modal-handle"></div>
      <h3>Post a Job</h3>
      <div class="form-group"><label>Title</label><input class="form-input" type="text" id="jTitle" placeholder="Farm Supervisor"></div>
      <div class="form-group"><label>Employer Name</label><input class="form-input" type="text" id="jEmployer" placeholder="Your farm/company name"></div>
      <div class="form-group"><label>Job Type</label><select class="form-input" id="jType"><option>permanent</option><option>seasonal</option><option>daily_wage</option><option>contract</option></select></div>
      <div class="form-group"><label>Min Salary (₹)</label><input class="form-input" type="number" id="jSalary" placeholder="15000"></div>
      <div class="form-group"><label>Max Salary (₹)</label><input class="form-input" type="number" id="jSalaryMax" placeholder="25000"></div>
      <div class="form-group"><label>Salary Period</label><select class="form-input" id="jPeriod"><option value="month">Per Month</option><option value="day">Per Day</option><option value="season">Per Season</option><option value="year">Per Year</option></select></div>
      <div class="form-group"><label>Location</label><input class="form-input" type="text" id="jLoc" placeholder="Village, District"></div>
      <div class="form-group"><label>Vacancies</label><input class="form-input" type="number" id="jVac" placeholder="2"></div>
      <div class="form-group"><label>Skills Required</label><input class="form-input" type="text" id="jSkills" placeholder="Tractor driving, Irrigation, Harvesting (comma-separated)"></div>
      <div class="form-group"><label>Description</label><textarea class="form-input" id="jDesc" placeholder="Job details, responsibilities, requirements…"></textarea></div>
      <button class="btn btn-primary" id="submitJob" style="width:100%">Post Job</button>
    `);
    document.querySelector('#submitJob')?.addEventListener('click', async () => {
      const title = document.querySelector('#jTitle')?.value?.trim();
      if (!title) { showToast('Title is required', 'error'); return; }
      try {
        const skills = document.querySelector('#jSkills')?.value?.split(',').map(s => s.trim()).filter(Boolean);
        await api.createJob({
          title,
          employer_name: document.querySelector('#jEmployer')?.value?.trim() || undefined,
          job_type: document.querySelector('#jType')?.value,
          salary_min: Number(document.querySelector('#jSalary')?.value) || undefined,
          salary_max: Number(document.querySelector('#jSalaryMax')?.value) || undefined,
          salary_period: document.querySelector('#jPeriod')?.value,
          location_label: document.querySelector('#jLoc')?.value?.trim() || undefined,
          vacancies: Number(document.querySelector('#jVac')?.value) || 1,
          skills: skills.length ? skills : undefined,
          description: document.querySelector('#jDesc')?.value?.trim() || undefined,
        });
        showToast('Job posted!', 'success');
        closeModal(); loadData();
      } catch (e) { showToast(e.message, 'error'); }
    });
  }

  function showListEquipment() {
    showModal(`
      <div class="modal-handle"></div>
      <h3>List Equipment for Rent</h3>
      <div class="form-group"><label>Equipment Name</label><input class="form-input" type="text" id="eqName" placeholder="John Deere 5050D"></div>
      <div class="form-group"><label>Type</label><select class="form-input" id="eqType"><option>tractor</option><option>harvester</option><option>sprayer</option><option>rotavator</option><option>seed_drill</option><option>other</option></select></div>
      <div class="form-group"><label>Daily Rate (₹)</label><input class="form-input" type="number" id="eqRate" placeholder="1500"></div>
      <div class="form-group"><label>Hourly Rate (₹, optional)</label><input class="form-input" type="number" id="eqHRate" placeholder="300"></div>
      <div class="form-group"><label>With Operator?</label><select class="form-input" id="eqOperator"><option value="false">No (equipment only)</option><option value="true">Yes (+ operator)</option></select></div>
      <div class="form-group"><label>Location</label><input class="form-input" type="text" id="eqLoc" placeholder="Village, District"></div>
      <div class="form-group"><label>Description</label><textarea class="form-input" id="eqDesc" rows="2" placeholder="Condition, hours, features…"></textarea></div>
      <button class="btn btn-primary" id="submitEquip">List Equipment</button>
      <div class="text-sm text-muted mt" style="text-align:center">Commission: 8-15% on completed rentals</div>
    `);
    document.querySelector('#submitEquip')?.addEventListener('click', async () => {
      try {
        await api.createEquipment({
          name: document.querySelector('#eqName')?.value,
          equipment_type: document.querySelector('#eqType')?.value,
          daily_rate: Number(document.querySelector('#eqRate')?.value),
          hourly_rate: Number(document.querySelector('#eqHRate')?.value) || undefined,
          operator_included: document.querySelector('#eqOperator')?.value === 'true',
          location_label: document.querySelector('#eqLoc')?.value || undefined,
          description: document.querySelector('#eqDesc')?.value,
        });
        showToast('Equipment listed!', 'success'); closeModal(); loadData();
      } catch (e) { showToast(e.message, 'error'); }
    });
  }

  async function loadData() {
    loading = true; render();
    try {
      const [eq, jb, st] = await Promise.all([
        api.getEquipment('?limit=20'),
        api.getJobs('?limit=20'),
        api.getKisanStats().catch(() => ({})),
      ]);
      equipment = Array.isArray(eq) ? eq : (eq.equipment || []);
      jobs = Array.isArray(jb) ? jb : (jb.jobs || []);
      stats = st?.stats || st || {};
    } catch (e) { console.error(e); }
    loading = false; render();
  }

  loadData();
}
