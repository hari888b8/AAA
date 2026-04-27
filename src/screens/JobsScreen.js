import { api } from '../api.js';
import { showToast, showModal, closeModal } from '../app-shell.js';

// ═══ AGRI JOBS BOARD ═══
export function renderJobs(container) {
  let tab = 'browse';
  let jobs = [], myJobs = [], search = '', catFilter = '';
  let loading = true;

  const JOB_CATS = [
    { id:'labour',    label:'Farm Labour',     icon:'👷', color:'#E8F5E9', text:'#2E7D32' },
    { id:'machinery', label:'Machinery Op.',   icon:'🚜', color:'#FFF3E0', text:'#E65100' },
    { id:'spraying',  label:'Crop Spraying',   icon:'🔬', color:'#F3E5F5', text:'#6A1B9A' },
    { id:'harvest',   label:'Harvesting',      icon:'🌾', color:'#FFFDE7', text:'#F57F17' },
    { id:'driver',    label:'Tractor Driver',  icon:'🚗', color:'#E3F2FD', text:'#1565C0' },
    { id:'manager',   label:'Farm Manager',    icon:'📋', color:'#E8EAF6', text:'#283593' },
    { id:'technical', label:'Tech / Advisory', icon:'🧑‍💼', color:'#E0F7FA', text:'#006064' },
    { id:'transport', label:'Transport',       icon:'🚚', color:'#EFEBE9', text:'#4E342E' },
  ];

  const SAMPLE_JOBS = [
    { id:'j1', title:'Farm Labour — Paddy Harvesting', category:'harvest', location:'Guntur, AP', district:'Guntur', wage:'₹600/day', duration:'10 days', start_date:'2026-05-01', workers_needed:8, workers_applied:3, posted_by:'Ramaiah FPO', description:'Need 8 experienced paddy harvesters for 25-acre paddy field. Transportation provided from village.', urgency:'high' },
    { id:'j2', title:'Tractor Driver (Plowing)', category:'driver', location:'Krishna, AP', district:'Krishna', wage:'₹800/day', duration:'5 days', start_date:'2026-04-30', workers_needed:1, workers_applied:0, posted_by:'Suresh Kumar', description:'Need experienced tractor driver for land preparation. Tractor provided.', urgency:'medium' },
    { id:'j3', title:'Cotton Picker — Skilled Preferred', category:'labour', location:'Adilabad, TS', district:'Adilabad', wage:'₹700/day + accommodation', duration:'21 days', start_date:'2026-05-05', workers_needed:15, workers_applied:6, posted_by:'Telangana Cotton FPO', description:'Need cotton pickers for 40-acre cotton field. Experienced workers preferred. Accommodation + meals.', urgency:'high' },
    { id:'j4', title:'Pesticide Sprayer — Licensed', category:'spraying', location:'West Godavari, AP', district:'West Godavari', wage:'₹750/day', duration:'3 days', start_date:'2026-04-28', workers_needed:2, workers_applied:1, posted_by:'Anand Orchards', description:'Licensed pesticide applicator needed for mango orchard. Safety gear provided.', urgency:'urgent' },
    { id:'j5', title:'Farm Manager — Horticulture', category:'manager', location:'Chittoor, AP', district:'Chittoor', wage:'₹25,000/month', duration:'Permanent', start_date:'2026-05-01', workers_needed:1, workers_applied:4, posted_by:'GreenValley Farms', description:'Full-time farm manager for 150-acre tomato and chilli farm. Must have 5+ years experience.', urgency:'low' },
    { id:'j6', title:'Irrigation Technician', category:'technical', location:'Nellore, AP', district:'Nellore', wage:'₹900/day', duration:'7 days', start_date:'2026-05-03', workers_needed:2, workers_applied:0, posted_by:'Drip Agri Solutions', description:'Install and commission drip irrigation system. Certification preferred.', urgency:'medium' },
    { id:'j7', title:'Truck Driver — Produce Transport', category:'transport', location:'Kurnool, AP', district:'Kurnool', wage:'Per trip / ₹3,500', duration:'As needed', start_date:'2026-04-29', workers_needed:3, workers_applied:1, posted_by:'APMC Kurnool', description:'Truck drivers needed for produce transport from farm gate to APMC. Own vehicle preferred.', urgency:'medium' },
    { id:'j8', title:'Combine Operator — Wheat Harvest', category:'machinery', location:'Warangal, TS', district:'Warangal', wage:'₹1,200/day', duration:'8 days', start_date:'2026-05-02', workers_needed:1, workers_applied:0, posted_by:'Ravi Agri Services', description:'Experienced combine harvester operator for wheat season. Machine available.', urgency:'high' },
  ];

  function render() {
    if (jobs.length === 0) jobs = SAMPLE_JOBS;

    container.innerHTML = `
      <div class="hero-v2" role="banner" style="background:linear-gradient(135deg,#004D40,#00695C);color:white">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:28px">👷</span>
          <div>
            <div style="font-weight:800;font-size:18px">Agri Jobs Board</div>
            <div style="font-size:11px;opacity:0.85">Find farm work · Hire labour · Agri services</div>
          </div>
        </div>
      </div>
      <div class="tab-bar" role="tablist" style="background:white">
        <button role="tab" aria-selected="${tab==='browse'}" class="tab-btn ${tab==='browse'?'active':''}" data-tab="browse">🔍 Find Work</button>
        <button role="tab" aria-selected="${tab==='post'}" class="tab-btn ${tab==='post'?'active':''}" data-tab="post">➕ Post Job</button>
        <button role="tab" aria-selected="${tab==='myjobs'}" class="tab-btn ${tab==='myjobs'?'active':''}" data-tab="myjobs">📋 My Postings</button>
      </div>
      <div style="padding-bottom:80px">
        ${tab === 'browse' ? renderBrowse() : tab === 'post' ? renderPostJob() : renderMyJobs()}
      </div>
    `;
    container.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; render(); }));
    container.querySelector('#jobSearch')?.addEventListener('input', e => { search = e.target.value; renderBrowse(); });
    container.querySelectorAll('.cat-filter-btn').forEach(b => {
      b.addEventListener('click', () => { catFilter = catFilter === b.dataset.cat ? '' : b.dataset.cat; render(); });
    });
    container.querySelectorAll('.apply-job-btn').forEach(b => {
      b.addEventListener('click', () => showApplyModal(b.dataset.jid));
    });
    container.querySelectorAll('.view-job-btn').forEach(b => {
      b.addEventListener('click', () => showJobDetail(b.dataset.jid));
    });
    container.querySelector('#postJobForm')?.addEventListener('submit', handlePostJob);
    container.querySelectorAll('.close-job-btn').forEach(b => {
      b.addEventListener('click', () => {
        myJobs = myJobs.filter(j=>j.id!==b.dataset.jid);
        showToast('Job closed', 'info'); render();
      });
    });
  }

  function renderBrowse() {
    let shown = jobs;
    if (search) shown = shown.filter(j=>`${j.title} ${j.location} ${j.category} ${j.description}`.toLowerCase().includes(search.toLowerCase()));
    if (catFilter) shown = shown.filter(j=>j.category === catFilter);

    return `
      <div style="padding:10px 14px 0">
        <!-- Stats banner -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:12px">
          <div style="background:#E8F5E9;border-radius:10px;padding:10px;text-align:center"><div style="font-weight:800;font-size:16px;color:#2E7D32">${jobs.length}</div><div style="font-size:10px;color:#555">Open Jobs</div></div>
          <div style="background:#FFF3E0;border-radius:10px;padding:10px;text-align:center"><div style="font-weight:800;font-size:16px;color:#E65100">${jobs.reduce((s,j)=>s+(j.workers_needed||0),0)}</div><div style="font-size:10px;color:#555">Vacancies</div></div>
          <div style="background:#E3F2FD;border-radius:10px;padding:10px;text-align:center"><div style="font-weight:800;font-size:16px;color:#1565C0">15+</div><div style="font-size:10px;color:#555">Districts</div></div>
        </div>
        <!-- Search -->
        <div style="background:white;border-radius:10px;display:flex;align-items:center;gap:8px;padding:10px 12px;box-shadow:0 1px 4px rgba(0,0,0,0.07);margin-bottom:10px">
          <span>🔍</span>
          <input id="jobSearch" type="search" placeholder="Search jobs, location, skill…" aria-label="Search jobs, location, skill…" value="${search}" style="flex:1;border:none;outline:none;font-size:13px;font-family:inherit">
        </div>
        <!-- Category filters -->
        <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:8px;scrollbar-width:none;margin-bottom:10px">
          ${JOB_CATS.map(c=>`<button class="cat-filter-btn" data-cat="${c.id}" style="flex-shrink:0;padding:5px 12px;border-radius:20px;border:none;font-size:11px;font-weight:600;cursor:pointer;background:${catFilter===c.id?c.text:'#F5F5F5'};color:${catFilter===c.id?'white':'#555'}">${c.icon} ${c.label}</button>`).join('')}
        </div>
        <!-- Job cards -->
        ${shown.length === 0 ? `<div style="text-align:center;padding:40px 20px"><div style="font-size:48px">👷</div><div style="font-weight:700;margin-top:8px">No jobs found</div></div>` :
          shown.map(j => {
            const cat = JOB_CATS.find(c=>c.id===j.category) || JOB_CATS[0];
            const urgencyColor = j.urgency==='urgent' ? '#C62828' : j.urgency==='high' ? '#E65100' : '#2E7D32';
            return `
              <div style="background:white;border-radius:14px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,0.07);overflow:hidden">
                <div style="background:${cat.color};padding:10px 14px;display:flex;justify-content:space-between;align-items:center">
                  <div style="display:flex;align-items:center;gap:8px">
                    <span style="font-size:20px">${cat.icon}</span>
                    <div>
                      <div style="font-weight:700;font-size:13px;color:#1A1A1A">${j.title}</div>
                      <div style="font-size:11px;color:#555">📍 ${j.location}</div>
                    </div>
                  </div>
                  <span style="background:${urgencyColor};color:white;padding:2px 8px;border-radius:8px;font-size:10px;font-weight:700">${j.urgency==='urgent'?'🔴 Urgent':j.urgency==='high'?'🟠 High':'🟢 Open'}</span>
                </div>
                <div style="padding:10px 14px">
                  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px">
                    <div style="background:#F5F5F5;border-radius:6px;padding:6px;text-align:center"><div style="font-weight:700;font-size:12px;color:#2E7D32">${j.wage}</div><div style="font-size:9px;color:#555">Wage</div></div>
                    <div style="background:#F5F5F5;border-radius:6px;padding:6px;text-align:center"><div style="font-weight:700;font-size:12px">${j.workers_needed}</div><div style="font-size:9px;color:#555">Needed</div></div>
                    <div style="background:#F5F5F5;border-radius:6px;padding:6px;text-align:center"><div style="font-weight:700;font-size:12px">${j.duration}</div><div style="font-size:9px;color:#555">Duration</div></div>
                  </div>
                  <div style="font-size:11px;color:#555;margin-bottom:8px">📅 Start: ${j.start_date} · Posted by: ${j.posted_by}</div>
                  <div style="display:flex;gap:6px">
                    <button class="view-job-btn" data-jid="${j.id}" style="flex:1;padding:8px;background:#F5F5F5;color:#424242;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer">View Details</button>
                    <button class="apply-job-btn" data-jid="${j.id}" style="flex:1;padding:8px;background:#004D40;color:white;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer">✅ Apply Now</button>
                  </div>
                </div>
              </div>
            `;
          }).join('')
        }
      </div>
    `;
  }

  function renderPostJob() {
    return `
      <div style="padding:10px 14px 0">
        <div style="background:linear-gradient(135deg,#004D40,#00695C);border-radius:14px;padding:14px;color:white;margin-bottom:14px">
          <div style="font-weight:800;font-size:15px;margin-bottom:2px">➕ Post a Job</div>
          <div style="font-size:11px;opacity:0.85">Reach 10,000+ farm workers across AP & Telangana</div>
        </div>
        <form id="postJobForm">
          <div class="form-group"><label style="font-size:11px;font-weight:600;color:#555;display:block;margin-bottom:4px">Job Title*</label><input class="form-input" name="title" placeholder="e.g. Paddy Harvesting Labour" required></div>
          <div class="form-group"><label style="font-size:11px;font-weight:600;color:#555;display:block;margin-bottom:4px">Category*</label>
            <select class="form-input" name="category" required>
              <option value="">Select category…</option>
              ${JOB_CATS.map(c=>`<option value="${c.id}">${c.icon} ${c.label}</option>`).join('')}
            </select>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div class="form-group"><label style="font-size:11px;font-weight:600;color:#555;display:block;margin-bottom:4px">District*</label><input class="form-input" name="district" placeholder="Guntur, Krishna…" required></div>
            <div class="form-group"><label style="font-size:11px;font-weight:600;color:#555;display:block;margin-bottom:4px">Workers Needed*</label><input class="form-input" name="workers_needed" type="number" min="1" placeholder="5" required></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div class="form-group"><label style="font-size:11px;font-weight:600;color:#555;display:block;margin-bottom:4px">Daily Wage*</label><input class="form-input" name="wage" placeholder="₹600/day" required></div>
            <div class="form-group"><label style="font-size:11px;font-weight:600;color:#555;display:block;margin-bottom:4px">Duration*</label><input class="form-input" name="duration" placeholder="7 days, permanent…" required></div>
          </div>
          <div class="form-group"><label style="font-size:11px;font-weight:600;color:#555;display:block;margin-bottom:4px">Start Date</label><input class="form-input" name="start_date" type="date" value="${new Date().toISOString().split('T')[0]}"></div>
          <div class="form-group"><label style="font-size:11px;font-weight:600;color:#555;display:block;margin-bottom:4px">Job Description</label><textarea class="form-input" name="description" rows="3" placeholder="Describe the work, requirements, accommodation etc."></textarea></div>
          <button type="submit" style="width:100%;padding:13px;background:#004D40;color:white;border:none;border-radius:10px;font-weight:700;font-size:14px;cursor:pointer;margin-bottom:20px">📢 Post Job (Free)</button>
        </form>
      </div>
    `;
  }

  function renderMyJobs() {
    const all = [...myJobs, ...SAMPLE_JOBS.slice(0,2)];
    if (all.length === 0) return `<div style="text-align:center;padding:40px 20px"><div style="font-size:48px">📋</div><div style="font-weight:700;margin-top:8px">No jobs posted yet</div><div style="font-size:12px;color:#757575;margin-top:4px">Post jobs to find the right workers</div></div>`;
    return `
      <div style="padding:10px 14px 0">
        ${all.map(j => `
          <div style="background:white;border-radius:12px;margin-bottom:10px;padding:14px;box-shadow:0 2px 6px rgba(0,0,0,0.07)">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
              <div><div style="font-weight:700;font-size:13px">${j.title}</div><div style="font-size:11px;color:#757575">${j.location}</div></div>
              <span style="background:#E8F5E9;color:#2E7D32;padding:3px 8px;border-radius:8px;font-size:10px;font-weight:700">${j.workers_applied||0}/${j.workers_needed} applied</span>
            </div>
            <div style="font-size:11px;color:#555;margin-bottom:8px">${j.wage} · ${j.duration} · Start: ${j.start_date}</div>
            <div style="display:flex;gap:6px">
              <button class="view-job-btn" data-jid="${j.id}" style="flex:1;padding:7px;background:#E3F2FD;color:#1565C0;border:none;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer">👥 View Applicants</button>
              <button class="close-job-btn" data-jid="${j.id}" style="padding:7px 12px;background:#FFEBEE;color:#C62828;border:none;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer">✕ Close</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function handlePostJob(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    if (!data.title || !data.category || !data.district || !data.workers_needed || !data.wage) {
      showToast('Fill all required fields', 'error'); return;
    }
    const newJob = { id:'j'+Date.now(), ...data, workers_applied:0, location:`${data.district}, AP`, posted_by:'You', urgency:'medium' };
    myJobs.unshift(newJob); jobs.unshift(newJob);
    api.post('/jobs', newJob).catch(()=>null);
    showToast('Job posted! Workers will start applying.', 'success');
    tab = 'myjobs'; render();
  }

  function showApplyModal(jid) {
    const job = jobs.find(j=>j.id===jid);
    if (!job) return;
    showModal(`<div class="modal-handle"></div>
      <h3>✅ Apply for Job</h3>
      <div style="background:#E8F5E9;border-radius:8px;padding:10px;margin-bottom:12px">
        <div style="font-weight:700;font-size:13px">${job.title}</div>
        <div style="font-size:11px;color:#555">${job.location} · ${job.wage} · ${job.duration}</div>
      </div>
      <div class="form-group"><label>Your Name*</label><input class="form-input" id="applyName" placeholder="Full name"></div>
      <div class="form-group"><label>Phone*</label><input class="form-input" id="applyPhone" type="tel" placeholder="10-digit mobile number"></div>
      <div class="form-group"><label>Experience</label><input class="form-input" id="applyExp" placeholder="e.g. 5 years paddy harvesting"></div>
      <div class="form-group"><label>Message (optional)</label><textarea class="form-input" id="applyMsg" rows="2" placeholder="Why you are suitable for this job"></textarea></div>
      <button id="submitApplication" style="width:100%;padding:12px;background:#004D40;color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer">Submit Application</button>`);
    document.querySelector('#submitApplication')?.addEventListener('click', async () => {
      const name = document.querySelector('#applyName').value.trim();
      const phone = document.querySelector('#applyPhone').value.trim();
      if (!name || !phone || phone.length < 10) { showToast('Name and valid phone required', 'error'); return; }
      job.workers_applied = (job.workers_applied||0) + 1;
      await api.post('/jobs/'+jid+'/apply', { name, phone, experience: document.querySelector('#applyExp').value, message: document.querySelector('#applyMsg').value }).catch(()=>null);
      showToast('Application submitted! Employer will contact you.', 'success');
      closeModal();
    });
  }

  function showJobDetail(jid) {
    const job = jobs.find(j=>j.id===jid);
    if (!job) return;
    const cat = JOB_CATS.find(c=>c.id===job.category) || JOB_CATS[0];
    showModal(`<div class="modal-handle"></div>
      <div style="background:${cat.color};border-radius:10px;padding:12px;margin-bottom:12px">
        <div style="font-size:20px;margin-bottom:4px">${cat.icon}</div>
        <div style="font-weight:800;font-size:15px">${job.title}</div>
        <div style="font-size:11px;color:#555;margin-top:2px">📍 ${job.location} · Posted by ${job.posted_by}</div>
      </div>
      ${[['💰 Wage',job.wage],['⏰ Duration',job.duration],['📅 Start Date',job.start_date],['👷 Workers Needed',job.workers_needed],['📊 Applications',job.workers_applied||0]].map(([l,v])=>
        `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #F5F5F5;font-size:12px"><span style="font-weight:600">${l}</span><span>${v}</span></div>`
      ).join('')}
      <div style="margin-top:10px;font-size:12px;color:#424242;line-height:1.7">${job.description}</div>
      <button id="applyFromDetail" style="width:100%;padding:12px;background:#004D40;color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer;margin-top:14px">✅ Apply Now</button>`);
    document.querySelector('#applyFromDetail')?.addEventListener('click', () => { closeModal(); showApplyModal(jid); });
  }

  loading = false;
  api.get('/jobs').then(data=>{ if(data?.length){ jobs=data; render(); } }).catch(()=>{});
  render();
}
