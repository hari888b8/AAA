import { api } from '../api.js';
import { showToast, showModal, closeModal } from '../app-shell.js';
import { t } from '../i18n.js';

// ═══ GOVERNMENT SCHEMES, LOANS & INSURANCE ═══
export function renderSchemes(container) {
  let tab = 'schemes';
  let search = '';

  const SCHEMES = [
    {
      id:'pm_kisan', cat:'income_support', title:'PM-KISAN (PM Kisan Samman Nidhi)', icon:'💰',
      benefit:'₹6,000/year (₹2,000 × 3 installments)', eligibility:'All landholding farmer families',
      how_to:'Register at pmkisan.gov.in or nearest CSC/Agriculture office with Aadhaar + Land records',
      deadline:'Ongoing', color:'#E8F5E9', badge:'#2E7D32', tag:'Income Support',
      docs:['Aadhaar Card','Land ownership records','Bank account details'],
    },
    {
      id:'pmfby', cat:'insurance', title:'PM Fasal Bima Yojana (PMFBY)', icon:'🛡️',
      benefit:'Full insured sum + no premium for small farmers',
      eligibility:'All farmers growing notified crops in notified areas',
      how_to:'Apply via nearest bank, PACS, or CSC during crop season. Premium: 1.5% (Rabi), 2% (Kharif), 5% (commercial crops)',
      deadline:'Before crop sowing (Kharif: June–July, Rabi: Nov–Dec)', color:'#E3F2FD', badge:'#1565C0', tag:'Crop Insurance',
      docs:['Aadhaar Card','Land records/7-12 extract','Bank passbook','Sowing certificate'],
    },
    {
      id:'kcc', cat:'credit', title:'Kisan Credit Card (KCC)', icon:'💳',
      benefit:'Credit up to ₹3 lakh at 7% interest (4% with subsidy)',
      eligibility:'All farmers, sharecroppers, tenant farmers with land documents',
      how_to:'Apply at any nationalised bank, cooperative bank, or regional rural bank with land documents',
      deadline:'Ongoing', color:'#FFF3E0', badge:'#E65100', tag:'Farm Credit',
      docs:['Aadhaar','Land records','Two passport photos','Bank account'],
    },
    {
      id:'pkvy', cat:'organic', title:'Paramparagat Krishi Vikas Yojana (PKVY)', icon:'🌿',
      benefit:'₹50,000/hectare over 3 years for organic farming',
      eligibility:'Farmer groups of minimum 50 farmers covering 50 acres',
      how_to:'Form farmer groups, apply through state agriculture department',
      deadline:'Apply to District Agriculture Officer before Kharif season', color:'#E8F5E9', badge:'#33691E', tag:'Organic Farming',
      docs:['Group formation certificate','Land records','Aadhaar of all members'],
    },
    {
      id:'mid_day', cat:'subsidy', title:'National Food Security Mission (NFSM)', icon:'🌾',
      benefit:'Seeds, fertilizers, IPM inputs at 50% subsidy',
      eligibility:'Rice, wheat, pulse, maize growing farmers in identified districts',
      how_to:'Apply at nearest Krishi Vigyan Kendra (KVK) or agriculture department',
      deadline:'Before crop season', color:'#FFFDE7', badge:'#F57F17', tag:'Input Subsidy',
      docs:['Aadhaar','Land records'],
    },
    {
      id:'rkvy', cat:'subsidy', title:'Rashtriya Krishi Vikas Yojana (RKVY)', icon:'🚜',
      benefit:'Machinery subsidies 25–50%, infrastructure grants for FPOs',
      eligibility:'Farmers, FPOs, SHGs in identified sectors',
      how_to:'Apply through District Agriculture and FPO portals',
      deadline:'Varies by project type', color:'#F3E5F5', badge:'#6A1B9A', tag:'Infrastructure',
      docs:['Business plan (FPOs)','Land records','Aadhaar','Bank statement'],
    },
    {
      id:'soil_health', cat:'subsidy', title:'Soil Health Card Scheme', icon:'🧱',
      benefit:'Free soil testing + crop-wise fertilizer recommendations',
      eligibility:'All farmers',
      how_to:'Contact KVK or Agriculture department. Soil tested free from government labs',
      deadline:'Ongoing', color:'#EFEBE9', badge:'#4E342E', tag:'Soil Health',
      docs:['Village/Survey number of land'],
    },
    {
      id:'drip', cat:'infrastructure', title:'PM-Micro Irrigation Fund (PMKSY)', icon:'💧',
      benefit:'55% (small/marginal) to 45% subsidy on drip/sprinkler systems',
      eligibility:'All farmers with land records',
      how_to:'Apply at horticulture department or state irrigation portal',
      deadline:'Applications open annually', color:'#E0F7FA', badge:'#006064', tag:'Irrigation',
      docs:['Land records','Aadhaar','Quotation from approved vendor','Bank account'],
    },
  ];

  const LOANS = [
    { title:'Agricultural Term Loan', bank:'State Bank of India', rate:'8.5–11%', max:'₹25 lakh', purpose:'Land purchase, machinery, irrigation', tenure:'7 years', icon:'🏦' },
    { title:'Agri Gold Loan', bank:'All Banks', rate:'7–8%', max:'₹20 lakh', purpose:'Quick working capital against gold', tenure:'12 months', icon:'🏅' },
    { title:'Drip Irrigation Loan', bank:'NABARD refinanced banks', rate:'7.5–9%', max:'₹10 lakh', purpose:'Drip/sprinkler systems', tenure:'5 years', icon:'💧' },
    { title:'Allied Activity Loan', bank:'Cooperative Banks', rate:'6–8%', max:'₹5 lakh', purpose:'Poultry, fishery, dairy, horticulture', tenure:'5 years', icon:'🐓' },
    { title:'FPO Term Loan', bank:'NABARD/SFAC', rate:'9–11%', max:'₹2 crore', purpose:'Working capital, processing unit', tenure:'5 years', icon:'🏢' },
    { title:'PM SVANidhi (Urban Farm)', bank:'MFIs/banks', rate:'7%', max:'₹50,000', purpose:'Street vendors / perishable trade', tenure:'12 months', icon:'🛒' },
  ];

  const HELPLINE = [
    { name:'PM-Kisan Helpline', number:'155261', icon:'📞' },
    { name:'Kisan Call Centre', number:'1800-180-1551', icon:'📞' },
    { name:'National Crop Insurance Portal', number:'14447', icon:'🛡️' },
    { name:'NABARD', number:'1800-26-2900', icon:'🏦' },
  ];

  function render() {
    container.innerHTML = `
      <div class="hero-v2" role="banner" style="background:linear-gradient(135deg,#1A237E,#283593);color:white">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:28px">🏛️</span>
          <div>
            <div style="font-weight:800;font-size:18px">Govt Schemes & Loans</div>
            <div style="font-size:11px;opacity:0.85">Subsidies · Insurance · Credit · Farmer Benefits</div>
          </div>
        </div>
      </div>
      <div class="tab-bar" role="tablist" style="background:white">
        <button role="tab" aria-selected="${tab==='schemes'}" class="tab-btn ${tab==='schemes'?'active':''}" data-tab="schemes">🏛️ Schemes</button>
        <button role="tab" aria-selected="${tab==='loans'}" class="tab-btn ${tab==='loans'?'active':''}" data-tab="loans">💳 Loans</button>
        <button role="tab" aria-selected="${tab==='insurance'}" class="tab-btn ${tab==='insurance'?'active':''}" data-tab="insurance">🛡️ Insurance</button>
        <button role="tab" aria-selected="${tab==='helpline'}" class="tab-btn ${tab==='helpline'?'active':''}" data-tab="helpline">📞 Helpline</button>
      </div>
      <div style="padding-bottom:80px">
        ${tab === 'schemes' ? renderSchemesList() : tab === 'loans' ? renderLoans() : tab === 'insurance' ? renderInsurance() : renderHelpline()}
      </div>
    `;
    container.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; render(); }));
    container.querySelector('#schemeSearch')?.addEventListener('input', e => { search = e.target.value; renderSchemesList(); });
    container.querySelectorAll('.scheme-apply-btn').forEach(b => {
      b.addEventListener('click', () => {
        const s = SCHEMES.find(x=>x.id===b.dataset.sid);
        if (!s) return;
        showToast(`Opening ${s.title} application guide…`, 'info');
      });
    });
    container.querySelectorAll('.scheme-details-btn').forEach(b => {
      b.addEventListener('click', () => showSchemeDetail(b.dataset.sid));
    });
  }

  function renderSchemesList() {
    const cats = ['all','income_support','insurance','credit','subsidy','organic','infrastructure'];
    const catLabels = { all:'All', income_support:'Income Support', insurance:'Insurance', credit:'Credit', subsidy:'Subsidy', organic:'Organic', infrastructure:'Infrastructure' };
    let shown = SCHEMES;
    if (search) shown = shown.filter(s => `${s.title} ${s.tag} ${s.benefit}`.toLowerCase().includes(search.toLowerCase()));

    return `
      <div style="padding:10px 14px 0">
        <!-- Search -->
        <div style="background:white;border-radius:10px;display:flex;align-items:center;gap:8px;padding:10px 12px;box-shadow:0 1px 4px rgba(0,0,0,0.07);margin-bottom:10px">
          <span style="font-size:16px">🔍</span>
          <input id="schemeSearch" type="search" placeholder="Search schemes…" aria-label="Search schemes…" value="${search}" style="flex:1;border:none;outline:none;font-size:13px;font-family:inherit">
        </div>
        <!-- Alert banner -->
        <div style="background:#E8F5E9;border-radius:10px;padding:12px;border-left:4px solid #2E7D32;margin-bottom:12px">
          <div style="font-weight:700;font-size:12px;color:#1B5E20">🔔 Check Eligibility in Seconds</div>
          <div style="font-size:11px;color:#2E7D32;margin-top:4px">Most schemes require Aadhaar, land records & bank account. Start gathering documents while checking eligibility below.</div>
        </div>
        <!-- Scheme cards -->
        ${shown.length === 0 ? `<div style="text-align:center;padding:40px 20px"><div style="font-size:48px">🏛️</div><div style="font-weight:700;margin-top:8px">No schemes found</div><div style="font-size:12px;color:#757575;margin-top:4px">Try a different search term</div></div>` :
        shown.map(s => `
          <div style="background:white;border-radius:14px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,0.07);overflow:hidden">
            <div style="background:${s.color};padding:12px 14px;border-left:4px solid ${s.badge}">
              <div style="display:flex;justify-content:space-between;align-items:flex-start">
                <div style="display:flex;align-items:center;gap:8px">
                  <span style="font-size:24px">${s.icon}</span>
                  <div>
                    <div style="font-weight:700;font-size:13px;color:#1A1A1A">${s.title}</div>
                    <span style="background:${s.badge};color:white;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700">${s.tag}</span>
                  </div>
                </div>
              </div>
            </div>
            <div style="padding:12px 14px">
              <div style="font-size:12px;color:#555;margin-bottom:6px">
                <span style="font-weight:600">💰 Benefit:</span> ${s.benefit}
              </div>
              <div style="font-size:12px;color:#555;margin-bottom:8px">
                <span style="font-weight:600">👨‍🌾 Eligible:</span> ${s.eligibility}
              </div>
              <div style="display:flex;gap:6px">
                <button class="scheme-details-btn" data-sid="${s.id}" style="flex:1;padding:8px;background:#F5F5F5;color:#424242;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer">📋 How to Apply</button>
                <button class="scheme-apply-btn" data-sid="${s.id}" style="flex:1;padding:8px;background:${s.badge};color:white;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer">✅ Apply Now</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderLoans() {
    return `
      <div style="padding:10px 14px 0">
        <div style="background:linear-gradient(135deg,#E65100,#BF360C);border-radius:14px;padding:16px;color:white;margin-bottom:14px">
          <div style="font-weight:800;font-size:15px;margin-bottom:4px">💳 Agricultural Loan Guide</div>
          <div style="font-size:11px;opacity:0.85">Compare rates · Check eligibility · Apply at nearest bank</div>
        </div>
        ${LOANS.map(l => `
          <div style="background:white;border-radius:12px;margin-bottom:10px;padding:14px;box-shadow:0 2px 6px rgba(0,0,0,0.07)">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
              <span style="font-size:22px">${l.icon}</span>
              <div>
                <div style="font-weight:700;font-size:13px">${l.title}</div>
                <div style="font-size:11px;color:#757575">${l.bank}</div>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px">
              <div style="background:#FFF3E0;border-radius:8px;padding:8px;text-align:center"><div style="font-weight:700;font-size:12px;color:#E65100">${l.rate}</div><div style="font-size:9px;color:#555">Interest p.a.</div></div>
              <div style="background:#E3F2FD;border-radius:8px;padding:8px;text-align:center"><div style="font-weight:700;font-size:12px;color:#1565C0">${l.max}</div><div style="font-size:9px;color:#555">Max Loan</div></div>
              <div style="background:#E8F5E9;border-radius:8px;padding:8px;text-align:center"><div style="font-weight:700;font-size:12px;color:#2E7D32">${l.tenure}</div><div style="font-size:9px;color:#555">Tenure</div></div>
            </div>
            <div style="font-size:11px;color:#555"><span style="font-weight:600">Purpose:</span> ${l.purpose}</div>
          </div>
        `).join('')}
        <div style="background:#FFF8E1;border-radius:10px;padding:12px;border-left:4px solid #F9A825;margin-bottom:20px">
          <div style="font-weight:700;font-size:11px;color:#F57F17;margin-bottom:4px">💡 Tip</div>
          <div style="font-size:11px;color:#555">KCC (Kisan Credit Card) is fastest for working capital. Visit any nationalised bank with Aadhaar + land records. Processing time: 7–14 days.</div>
        </div>
      </div>
    `;
  }

  function renderInsurance() {
    const INSURANCE_PLANS = [
      { name:'PM Fasal Bima Yojana', type:'Crop Insurance', premium:'1.5–5% (govt subsidised)', cover:'Full SI (State govt fixed)', note:'Mandatory for KCC/crop loan takers', badge:'#1565C0', bg:'#E3F2FD' },
      { name:'Restructured WBCIS', type:'Weather-based Crop Insurance', premium:'Subsidised – same as PMFBY', cover:'Weather-indexed payouts', note:'Faster settlement via weather data', badge:'#0277BD', bg:'#E1F5FE' },
      { name:'United India Agri Insurance', type:'Commercial Crop Insurance', premium:'Varies 2–12%', cover:'Up to actual loss value', note:'Private insurer, faster claims', badge:'#E65100', bg:'#FFF3E0' },
      { name:'Livestock Insurance Scheme', type:'Livestock Coverage', premium:'3–7% (50% subsidised)', cover:'Full market value of animal', note:'Cattle, goat, sheep, poultry', badge:'#4E342E', bg:'#EFEBE9' },
    ];
    return `
      <div style="padding:10px 14px 0">
        <div style="background:linear-gradient(135deg,#283593,#1565C0);border-radius:14px;padding:16px;color:white;margin-bottom:14px">
          <div style="font-weight:800;font-size:15px;margin-bottom:4px">🛡️ Agri Insurance Options</div>
          <div style="font-size:11px;opacity:0.85">Protect your crops & livestock against all risks</div>
          <div style="margin-top:8px;background:rgba(255,255,255,0.15);border-radius:8px;padding:8px;font-size:11px">
            <strong>Claim hotline:</strong> 14447 · pmfby.gov.in · Nearest agriculture office
          </div>
        </div>
        ${INSURANCE_PLANS.map(p => `
          <div style="background:white;border-radius:12px;margin-bottom:10px;box-shadow:0 2px 6px rgba(0,0,0,0.07);overflow:hidden">
            <div style="background:${p.bg};padding:12px 14px;border-left:4px solid ${p.badge}">
              <div style="font-weight:700;font-size:13px">${p.name}</div>
              <span style="background:${p.badge};color:white;padding:2px 8px;border-radius:8px;font-size:10px;font-weight:700">${p.type}</span>
            </div>
            <div style="padding:12px 14px">
              ${[['💰 Premium',p.premium],['📦 Coverage',p.cover],['ℹ️ Note',p.note]].map(([l,v])=>`<div style="font-size:11px;color:#555;margin-bottom:4px"><span style="font-weight:600">${l}:</span> ${v}</div>`).join('')}
            </div>
          </div>
        `).join('')}
        <div style="background:#FFEBEE;border-radius:10px;padding:12px;border-left:4px solid #C62828;margin-bottom:20px">
          <div style="font-weight:700;font-size:11px;color:#C62828;margin-bottom:4px">⚠️ Important Deadlines</div>
          <div style="font-size:11px;color:#555;line-height:1.8">
            <div>• Kharif crops: Register by July 31st</div>
            <div>• Rabi crops: Register by December 31st</div>
            <div>• Report crop loss within 72 hours by calling 14447</div>
          </div>
        </div>
      </div>
    `;
  }

  function renderHelpline() {
    return `
      <div style="padding:10px 14px 0">
        <div style="background:linear-gradient(135deg,#4A148C,#6A1B9A);border-radius:14px;padding:16px;color:white;margin-bottom:14px">
          <div style="font-weight:800;font-size:15px;margin-bottom:4px">📞 Farmer Helplines</div>
          <div style="font-size:11px;opacity:0.85">Free helplines available 24/7 in regional languages</div>
        </div>
        ${HELPLINE.map(h => `
          <a href="tel:${h.number.replace(/-/g,'')}" style="display:flex;align-items:center;gap:12px;background:white;border-radius:12px;padding:14px;margin-bottom:8px;box-shadow:0 1px 4px rgba(0,0,0,0.06);text-decoration:none">
            <div style="width:44px;height:44px;border-radius:12px;background:#E8F5E9;display:flex;align-items:center;justify-content:center;font-size:22px">${h.icon}</div>
            <div style="flex:1">
              <div style="font-weight:700;font-size:13px;color:#1A1A1A">${h.name}</div>
              <div style="font-size:15px;font-weight:800;color:#2E7D32;margin-top:2px">${h.number}</div>
            </div>
            <span style="font-size:20px">📲</span>
          </a>
        `).join('')}
        <!-- Useful websites -->
        <div style="background:white;border-radius:12px;padding:14px;box-shadow:0 1px 4px rgba(0,0,0,0.06);margin-top:4px">
          <div style="font-weight:700;font-size:13px;margin-bottom:10px">🌐 Useful Portals</div>
          ${[
            { name:'PM-KISAN', url:'pmkisan.gov.in' },
            { name:'PMFBY Crop Insurance', url:'pmfby.gov.in' },
            { name:'eNAM (e-Mandi)', url:'enam.gov.in' },
            { name:'Agrimarket App / DACFW', url:'dacfw.gov.in' },
            { name:'AP Farmers Portal', url:'apagrisnet.gov.in' },
          ].map(w => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #F5F5F5;font-size:12px"><span style="font-weight:600">${w.name}</span><span style="color:#1565C0">🔗 ${w.url}</span></div>`).join('')}
        </div>
      </div>
    `;
  }

  function showSchemeDetail(sid) {
    const s = SCHEMES.find(x=>x.id===sid);
    if (!s) return;
    showModal(`<div class="modal-handle"></div>
      <div style="background:${s.color};border-radius:10px;padding:12px;margin-bottom:12px;border-left:4px solid ${s.badge}">
        <div style="font-size:20px;margin-bottom:4px">${s.icon}</div>
        <div style="font-weight:800;font-size:15px">${s.title}</div>
        <span style="background:${s.badge};color:white;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;margin-top:4px;display:inline-block">${s.tag}</span>
      </div>
      <div style="font-size:13px;color:#555;margin-bottom:10px"><strong>💰 Benefit:</strong> ${s.benefit}</div>
      <div style="font-size:13px;color:#555;margin-bottom:10px"><strong>👨‍🌾 Eligibility:</strong> ${s.eligibility}</div>
      <div style="font-size:13px;color:#555;margin-bottom:10px"><strong>📅 Deadline:</strong> ${s.deadline}</div>
      <div style="font-size:13px;font-weight:700;margin-bottom:6px">📋 How to Apply:</div>
      <div style="font-size:12px;color:#424242;line-height:1.7;margin-bottom:10px">${s.how_to}</div>
      <div style="font-size:13px;font-weight:700;margin-bottom:6px">📄 Documents Needed:</div>
      <ul style="margin:0 0 16px 16px;font-size:12px;color:#555;line-height:1.8">
        ${(s.docs||[]).map(d=>`<li>${d}</li>`).join('')}
      </ul>
      <button id="closeSchemeDetail" class="btn btn-primary" style="width:100%">Close</button>`);
    document.querySelector('#closeSchemeDetail')?.addEventListener('click', () => closeModal());
  }

  render();
}
