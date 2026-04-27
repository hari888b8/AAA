import { api } from '../api.js';
import { showToast, showModal, closeModal } from '../app-shell.js';

// ═══ FARMER TRAINING & LEARNING CENTER ═══
export function renderTraining(container) {
  let tab = 'courses';
  let search = '';
  let catFilter = '';

  const CATS = [
    { id:'crop_mgmt',   label:'Crop Management', icon:'🌿', color:'#E8F5E9' },
    { id:'pest',        label:'Pest & Disease',  icon:'🔬', color:'#FFF3E0' },
    { id:'organic',     label:'Organic Farming', icon:'🌱', color:'#F1F8E9' },
    { id:'technology',  label:'Technology',      icon:'💻', color:'#E3F2FD' },
    { id:'market',      label:'Market & Pricing',icon:'📈', color:'#FFF8E1' },
    { id:'water',       label:'Water Management',icon:'💧', color:'#E0F7FA' },
    { id:'finance',     label:'Finance & Loans', icon:'💰', color:'#EFEBE9' },
    { id:'fpo',         label:'FPO Management',  icon:'🏢', color:'#E8EAF6' },
  ];

  const COURSES = [
    { id:'c1', title:'Paddy Cultivation — Complete Guide', category:'crop_mgmt', duration:'45 min', modules:6, level:'Beginner', lang:'Telugu/Hindi', rating:4.8, learned:12400, icon:'🌾', badge:'#2E7D32',
      modules_list:['Land Preparation','Seed Selection & Nursery','Transplanting','Irrigation Management','Nutrient Management','Harvesting & Post Harvest'] },
    { id:'c2', title:'Integrated Pest Management (IPM)', category:'pest', duration:'30 min', modules:5, level:'Intermediate', lang:'Telugu/Hindi/Eng', rating:4.7, learned:8900, icon:'🔬', badge:'#E65100',
      modules_list:['Understanding Pests','Bio-pesticides','Chemical Control','Monitoring','Record Keeping'] },
    { id:'c3', title:'Drip Irrigation — Installation & Management', category:'water', duration:'25 min', modules:4, level:'Beginner', lang:'Telugu/English', rating:4.9, learned:15600, icon:'💧', badge:'#0277BD',
      modules_list:['System Overview','Installation Steps','Operation & Scheduling','Maintenance & Troubleshooting'] },
    { id:'c4', title:'Organic Farming Transition Guide', category:'organic', duration:'60 min', modules:8, level:'Intermediate', lang:'Telugu/Hindi', rating:4.6, learned:6200, icon:'🌿', badge:'#33691E',
      modules_list:['Why Go Organic','Soil Building','Composting','Green Manuring','Biological Pest Control','Certification (NPOP)','Market Linkage','Record Keeping'] },
    { id:'c5', title:'eNAM & Mandi Trading for Farmers', category:'market', duration:'20 min', modules:3, level:'Beginner', lang:'Telugu/Hindi/Eng', rating:4.5, learned:22000, icon:'📈', badge:'#F57F17',
      modules_list:['eNAM Registration','Uploading Produce','Trading & Payments'] },
    { id:'c6', title:'SRI Method — System of Rice Intensification', category:'crop_mgmt', duration:'35 min', modules:5, level:'Intermediate', lang:'Telugu', rating:4.7, learned:9800, icon:'🌾', badge:'#2E7D32',
      modules_list:['Principles of SRI','Nursery (8–12 days)','Transplanting (1 seedling)','Weeding','Yield Comparison'] },
    { id:'c7', title:'FPO Formation & Management', category:'fpo', duration:'50 min', modules:7, level:'Advanced', lang:'Telugu/Hindi/Eng', rating:4.8, learned:3400, icon:'🏢', badge:'#283593',
      modules_list:['What is FPO','Registration Process','Governance','Member Mobilization','Business Planning','Credit & Finance','Marketing'] },
    { id:'c8', title:'KCC — Kisan Credit Card Application', category:'finance', duration:'15 min', modules:3, level:'Beginner', lang:'Telugu/Hindi/Eng', rating:4.9, learned:35000, icon:'💳', badge:'#C62828',
      modules_list:['Eligibility & Documents','Bank Application Process','Using Your KCC'] },
    { id:'c9', title:'Tomato Cultivation in AP/TS', category:'crop_mgmt', duration:'40 min', modules:5, level:'Beginner', lang:'Telugu', rating:4.7, learned:18200, icon:'🍅', badge:'#C62828',
      modules_list:['Variety Selection','Nursery & Transplanting','Irrigation & Nutrition','Disease Management','Harvesting & Marketing'] },
    { id:'c10', title:'Solar Pump — Installation & Subsidies', category:'technology', duration:'20 min', modules:3, level:'Beginner', lang:'Telugu/Hindi', rating:4.8, learned:11500, icon:'☀️', badge:'#F57F17',
      modules_list:['PM KUSUM Scheme','Technical Specification','Application Process'] },
  ];

  const TIPS = [
    { icon:'💡', title:'Weekly Farming Tip', content:'Apply Trichoderma Viride (5g/kg seed) during seed treatment to prevent soil-borne fungal diseases in paddy and pulses.' },
    { icon:'🌦️', title:'Seasonal Advisory (Kharif 2026)', content:'La Niña conditions expected — above-normal rainfall in Andhra/Telangana. Choose flood-tolerant paddy varieties and ensure drainage in low-lying fields.' },
    { icon:'🐛', title:'Pest Alert', content:'Fall Armyworm (FAW) infestation reported in maize fields in Nizamabad and Adilabad. Monitor whorls for feeding damage. Apply Emamectin benzoate 5SG @ 0.4g/L if >5% damage.' },
    { icon:'🌱', title:'Soil Health', content:'Pre-kharif: Apply well-decomposed FYM 5 tonnes/acre to build organic matter. Hold soil in the shade for 10–15 days before plowing for solarization effect.' },
  ];

  const EXPERTS = [
    { name:'Dr. S. Rao', title:'Plant Pathologist, ANGRAU', topics:'Disease management, IPM', rating:4.9, answered:340, icon:'👨‍🔬' },
    { name:'Dr. K. Devi', title:'Soil Scientist, ICAR', topics:'Soil health, fertilization, organic', rating:4.8, answered:280, icon:'👩‍🔬' },
    { name:'M. Krishnamurthy', title:'FPO Advisor, SFAC', topics:'FPO formation, credit access', rating:4.7, answered:195, icon:'👨‍💼' },
  ];

  function render() {
    container.innerHTML = `
      <div class="hero-v2" role="banner" style="background:linear-gradient(135deg,#4527A0,#512DA8);color:white">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:28px">🎓</span>
          <div>
            <div style="font-weight:800;font-size:18px">Farmer Training Center</div>
            <div style="font-size:11px;opacity:0.85">Courses · Expert Q&A · Advisory tips in your language</div>
          </div>
        </div>
      </div>
      <div class="tab-bar" role="tablist" style="background:white">
        <button role="tab" aria-selected="${tab==='courses'}" class="tab-btn ${tab==='courses'?'active':''}" data-tab="courses">📚 Courses</button>
        <button role="tab" aria-selected="${tab==='tips'}" class="tab-btn ${tab==='tips'?'active':''}" data-tab="tips">💡 Daily Tips</button>
        <button role="tab" aria-selected="${tab==='experts'}" class="tab-btn ${tab==='experts'?'active':''}" data-tab="experts">🧑‍🏫 Ask Expert</button>
        <button role="tab" aria-selected="${tab==='videos'}" class="tab-btn ${tab==='videos'?'active':''}" data-tab="videos">📹 Videos</button>
      </div>
      <div style="padding-bottom:80px">
        ${tab === 'courses' ? renderCourses() : tab === 'tips' ? renderTips() : tab === 'experts' ? renderExperts() : renderVideos()}
      </div>
    `;
    container.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; render(); }));
    container.querySelector('#trainingSearch')?.addEventListener('input', e => { search = e.target.value; render(); });
    container.querySelectorAll('.cat-pill').forEach(b => {
      b.addEventListener('click', () => { catFilter = catFilter===b.dataset.cat?'':b.dataset.cat; render(); });
    });
    container.querySelectorAll('.start-course-btn').forEach(b => {
      b.addEventListener('click', () => showCourseDetail(b.dataset.cid));
    });
    container.querySelector('#askExpertBtn')?.addEventListener('click', showAskExpert);
  }

  function renderCourses() {
    let shown = COURSES;
    if (search) shown = shown.filter(c=>`${c.title} ${c.category}`.toLowerCase().includes(search.toLowerCase()));
    if (catFilter) shown = shown.filter(c=>c.category===catFilter);

    return `
      <div style="padding:10px 14px 0">
        <!-- Search -->
        <div style="background:white;border-radius:10px;display:flex;align-items:center;gap:8px;padding:10px 12px;box-shadow:0 1px 4px rgba(0,0,0,0.07);margin-bottom:10px">
          <span>🔍</span>
          <input id="trainingSearch" type="search" placeholder="Search courses…" aria-label="Search courses…" value="${search}" style="flex:1;border:none;outline:none;font-size:13px;font-family:inherit">
        </div>
        <!-- Category pills -->
        <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:8px;scrollbar-width:none;margin-bottom:10px">
          ${CATS.map(c=>`<button class="cat-pill" data-cat="${c.id}" style="flex-shrink:0;padding:5px 12px;border-radius:20px;border:none;font-size:11px;font-weight:600;cursor:pointer;background:${catFilter===c.id?'#512DA8':'#F5F5F5'};color:${catFilter===c.id?'white':'#555'}">${c.icon} ${c.label}</button>`).join('')}
        </div>
        <!-- Stats -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:12px">
          <div style="background:#E8EAF6;border-radius:8px;padding:8px;text-align:center"><div style="font-weight:800;font-size:14px;color:#512DA8">${COURSES.length}+</div><div style="font-size:9px;color:#555">Courses</div></div>
          <div style="background:#E8F5E9;border-radius:8px;padding:8px;text-align:center"><div style="font-weight:800;font-size:14px;color:#2E7D32">Free</div><div style="font-size:9px;color:#555">All Courses</div></div>
          <div style="background:#FFF3E0;border-radius:8px;padding:8px;text-align:center"><div style="font-weight:800;font-size:14px;color:#E65100">3 Lang</div><div style="font-size:9px;color:#555">Telugu/Hindi</div></div>
        </div>
        <!-- Course cards -->
        ${shown.length === 0 ? `<div style="text-align:center;padding:40px 20px"><div style="font-size:48px">📚</div><div style="font-weight:700;margin-top:8px">No courses found</div><div style="font-size:12px;color:#757575;margin-top:4px">Try a different search or category</div></div>` :
        shown.map(c => `
          <div style="background:white;border-radius:14px;margin-bottom:10px;box-shadow:0 2px 6px rgba(0,0,0,0.07);overflow:hidden">
            <div style="background:linear-gradient(135deg,${c.badge}18,${c.badge}08);padding:12px 14px;border-left:4px solid ${c.badge}">
              <div style="display:flex;justify-content:space-between">
                <div style="display:flex;align-items:center;gap:8px">
                  <span style="font-size:24px">${c.icon}</span>
                  <div>
                    <div style="font-weight:700;font-size:13px">${c.title}</div>
                    <div style="font-size:10px;color:#757575;margin-top:2px">${c.lang}</div>
                  </div>
                </div>
                <span style="background:${c.badge};color:white;padding:2px 8px;border-radius:8px;font-size:10px;font-weight:700;height:fit-content">${c.level}</span>
              </div>
            </div>
            <div style="padding:10px 14px">
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px">
                <div style="text-align:center;font-size:10px"><div style="font-weight:700">⏱️ ${c.duration}</div><div style="color:#757575">Duration</div></div>
                <div style="text-align:center;font-size:10px"><div style="font-weight:700">📚 ${c.modules} modules</div><div style="color:#757575">Modules</div></div>
                <div style="text-align:center;font-size:10px"><div style="font-weight:700">⭐ ${c.rating}</div><div style="color:#757575">${(c.learned/1000).toFixed(0)}K learned</div></div>
              </div>
              <button class="start-course-btn" data-cid="${c.id}" style="width:100%;padding:9px;background:#512DA8;color:white;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">📖 Start Learning (Free)</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderTips() {
    return `
      <div style="padding:10px 14px 0">
        <div style="background:linear-gradient(135deg,#F57F17,#FF6F00);border-radius:14px;padding:14px;color:white;margin-bottom:14px">
          <div style="font-weight:800;font-size:15px;margin-bottom:2px">💡 Daily Agri Tips & Advisories</div>
          <div style="font-size:11px;opacity:0.85">Expert tips updated daily in Telugu, Hindi & English</div>
        </div>
        ${TIPS.map(tip => `
          <div style="background:white;border-radius:12px;margin-bottom:10px;padding:14px;box-shadow:0 2px 6px rgba(0,0,0,0.07)">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <span style="font-size:22px">${tip.icon}</span>
              <div style="font-weight:700;font-size:13px">${tip.title}</div>
            </div>
            <div style="font-size:12px;color:#424242;line-height:1.7">${tip.content}</div>
          </div>
        `).join('')}
        <div style="background:#E8EAF6;border-radius:12px;padding:14px;text-align:center">
          <div style="font-size:22px;margin-bottom:4px">🔔</div>
          <div style="font-weight:700;font-size:13px;margin-bottom:4px">Get Daily Tips on WhatsApp</div>
          <div style="font-size:11px;color:#555;margin-bottom:10px">Receive seasonal advisories and pest alerts on your phone</div>
          <button id="subscribeWhatsapp" style="padding:10px 24px;background:#25D366;color:white;border:none;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer">📲 Subscribe (WhatsApp)</button>
        </div>
      </div>
    `;
  }

  function renderExperts() {
    return `
      <div style="padding:10px 14px 0">
        <div style="background:linear-gradient(135deg,#004D40,#00695C);border-radius:14px;padding:14px;color:white;margin-bottom:14px">
          <div style="font-weight:800;font-size:15px;margin-bottom:2px">🧑‍🏫 Ask an Expert</div>
          <div style="font-size:11px;opacity:0.85">Get answers from certified agronomists, scientists & FPO advisors</div>
        </div>
        <button id="askExpertBtn" style="width:100%;padding:12px;background:#004D40;color:white;border:none;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer;margin-bottom:14px">❓ Post Your Question</button>
        <!-- Expert profiles -->
        ${EXPERTS.map(e => `
          <div style="background:white;border-radius:12px;margin-bottom:10px;padding:14px;box-shadow:0 2px 6px rgba(0,0,0,0.07);display:flex;gap:12px;align-items:flex-start">
            <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#512DA8,#00695C);display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0">${e.icon}</div>
            <div style="flex:1">
              <div style="font-weight:700;font-size:13px">${e.name}</div>
              <div style="font-size:11px;color:#6A1B9A">${e.title}</div>
              <div style="font-size:11px;color:#757575;margin-top:2px">Topics: ${e.topics}</div>
              <div style="display:flex;gap:12px;margin-top:6px">
                <span style="font-size:11px;font-weight:600">⭐ ${e.rating}</span>
                <span style="font-size:11px;color:#757575">${e.answered} questions answered</span>
              </div>
            </div>
          </div>
        `).join('')}
        <!-- Sample Q&A -->
        <div style="font-weight:700;font-size:13px;margin:12px 0 8px">📋 Recent Questions</div>
        ${[
          { q:'Why are my paddy leaves turning yellow at tips?', a:'Tip yellowing (leaf scorch) is typically caused by potassium deficiency. Apply MOP (muriate of potash) 30kg/acre. Also check your water source for high salinity.', expert:'Dr. K. Devi', ago:'2 hrs ago' },
          { q:'Best time to spray for thrips in chilli?', a:'Spray in early morning (6–9 AM) or evening (4–6 PM) when thrips are most active on leaf surface. Use Spinosad 45SC @ 0.3ml/L.', expert:'Dr. S. Rao', ago:'5 hrs ago' },
        ].map(qa => `
          <div style="background:white;border-radius:12px;margin-bottom:8px;padding:12px;box-shadow:0 1px 4px rgba(0,0,0,0.06)">
            <div style="font-size:12px;font-weight:700;color:#333;margin-bottom:6px">❓ ${qa.q}</div>
            <div style="background:#E8F5E9;border-radius:8px;padding:10px">
              <div style="font-size:11px;color:#1B5E20;font-weight:600;margin-bottom:4px">✅ ${qa.expert}</div>
              <div style="font-size:12px;color:#424242;line-height:1.6">${qa.a}</div>
            </div>
            <div style="font-size:10px;color:#9E9E9E;margin-top:4px">${qa.ago}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderVideos() {
    const VIDEOS = [
      { title:'Paddy transplanting technique (SRI method)', duration:'12:34', views:'2.4L', thumb:'🌾', channel:'ANGRAU Extension' },
      { title:'Making Jeevamrutha (organic liquid fertilizer)', duration:'8:15', views:'1.8L', thumb:'🌿', channel:'ZBNF Academy' },
      { title:'How to set up drip irrigation (step-by-step)', duration:'18:42', views:'3.1L', thumb:'💧', channel:'Agri Videos Telugu' },
      { title:'PM-KISAN registration — step by step', duration:'5:23', views:'9.2L', thumb:'📱', channel:'Govt of India' },
      { title:'Recognising common paddy diseases', duration:'14:11', views:'1.2L', thumb:'🔬', channel:'CRRI Extension' },
      { title:'Cotton bollworm management', duration:'10:07', views:'890K', thumb:'🌿', channel:'ICAR CICR' },
    ];
    return `
      <div style="padding:10px 14px 0">
        <div style="font-size:12px;color:#757575;margin-bottom:10px">📹 Curated agri videos from government & research institutions</div>
        ${VIDEOS.map(v => `
          <div style="background:white;border-radius:12px;margin-bottom:8px;padding:12px;display:flex;gap:12px;align-items:center;box-shadow:0 1px 4px rgba(0,0,0,0.06);cursor:pointer" onclick="showToast && showToast('Opening video — allow video player in browser settings', 'info')">
            <div style="width:56px;height:40px;border-radius:8px;background:linear-gradient(135deg,#512DA8,#4527A0);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">${v.thumb}</div>
            <div style="flex:1">
              <div style="font-weight:600;font-size:12px;color:#1A1A1A;line-height:1.4">${v.title}</div>
              <div style="font-size:10px;color:#757575;margin-top:2px">${v.channel} · ⏱ ${v.duration} · 👁 ${v.views} views</div>
            </div>
            <span style="font-size:20px;color:#C62828">▶</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  function showCourseDetail(cid) {
    const course = COURSES.find(c=>c.id===cid);
    if (!course) return;
    showModal(`<div class="modal-handle"></div>
      <div style="background:${course.badge}18;border-radius:10px;padding:12px;margin-bottom:12px;border-left:4px solid ${course.badge}">
        <div style="font-size:24px;margin-bottom:4px">${course.icon}</div>
        <div style="font-weight:800;font-size:15px">${course.title}</div>
        <div style="font-size:11px;color:#555;margin-top:2px">${course.lang} · ${course.level} · ${course.duration}</div>
      </div>
      <div style="font-weight:700;font-size:13px;margin-bottom:8px">📚 Course Modules (${course.modules_list.length})</div>
      ${course.modules_list.map((m,i) => `
        <div style="display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;margin-bottom:6px;background:#F5F5F5">
          <div style="width:24px;height:24px;border-radius:50%;background:${course.badge};color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">${i+1}</div>
          <span style="font-size:12px;font-weight:600">${m}</span>
          ${i===0 ? '<span style="font-size:10px;background:#E8F5E9;color:#2E7D32;padding:2px 6px;border-radius:4px;margin-left:auto">Free Preview</span>' : ''}
        </div>
      `).join('')}
      <div style="display:flex;justify-content:space-between;background:#E8EAF6;border-radius:8px;padding:10px;margin:10px 0">
        <div style="text-align:center"><span style="font-size:16px;font-weight:800;color:#512DA8">${course.rating}</span><div style="font-size:10px">Rating</div></div>
        <div style="text-align:center"><span style="font-size:16px;font-weight:800;color:#512DA8">${(course.learned/1000).toFixed(0)}K</span><div style="font-size:10px">Learned</div></div>
        <div style="text-align:center"><span style="font-size:16px;font-weight:800;color:#2E7D32">Free</span><div style="font-size:10px">Cost</div></div>
      </div>
      <button id="startLearning" style="width:100%;padding:12px;background:#512DA8;color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer;margin-top:4px">🎓 Start Course Now</button>`);
    document.querySelector('#startLearning')?.addEventListener('click', () => {
      showToast(`Starting "${course.title}" — modules open in reading mode`, 'success');
      closeModal();
    });
  }

  function showAskExpert() {
    showModal(`<div class="modal-handle"></div>
      <h3>❓ Ask an Expert</h3>
      <div class="form-group"><label>Your Question*</label><textarea class="form-input" id="expertQ" rows="4" placeholder="Describe your problem in detail. Include crop name, symptoms, location if relevant…"></textarea></div>
      <div class="form-group"><label>Crop (if applicable)</label><input class="form-input" id="expertCrop" placeholder="e.g. Paddy, Cotton, Tomato"></div>
      <div class="form-group"><label>District</label><input class="form-input" id="expertDistrict" placeholder="Your district"></div>
      <button id="submitExpertQ" style="width:100%;padding:12px;background:#004D40;color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer">Submit Question</button>`);
    document.querySelector('#submitExpertQ')?.addEventListener('click', async () => {
      const q = document.querySelector('#expertQ').value.trim();
      if (!q) { showToast('Question required', 'error'); return; }
      await api.post('/training/questions', { question: q, crop: document.querySelector('#expertCrop').value, district: document.querySelector('#expertDistrict').value }).catch(()=>null);
      showToast('Question submitted! Expert will respond within 24 hours.', 'success');
      closeModal();
    });
  }

  // Subscribe to WhatsApp tips
  container.addEventListener('click', e => {
    if (e.target.id === 'subscribeWhatsapp') showToast('WhatsApp subscription — feature coming soon. Call 1800-180-1551 for advisories.', 'info');
  });

  render();
}
