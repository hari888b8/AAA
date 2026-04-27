import { api } from '../api.js';
import { showToast, showModal, closeModal, navigate } from '../main.js';
import { getRole, getState } from '../store.js';
import { t } from '../i18n.js';
import { showCheckout } from '../payments.js';
import { showReviewsModal } from '../reviews.js';

/**
 * KisanConnect — Farm Equipment Marketplace
 * Simple 3-mode: Rent · Buy · Sell
 * Equipment ONLY — clean, focused, no clutter
 */

export function renderKisan(container) {
  let mode = 'rent'; // rent | buy | sell
  let equipment = [];
  let loading = true;
  let eqType = '';
  let eqSearch = '';

  const EQ_TYPES = [
    {id:'tractor',     icon:'🚜', label:'Tractor'},
    {id:'harvester',   icon:'🌾', label:'Harvester'},
    {id:'rotavator',   icon:'⚙️', label:'Rotavator'},
    {id:'sprayer',     icon:'💨', label:'Sprayer'},
    {id:'transplanter',icon:'🌱', label:'Transplanter'},
    {id:'pump',        icon:'💧', label:'Pump Set'},
    {id:'thresher',    icon:'🔄', label:'Thresher'},
    {id:'seed_drill',  icon:'🌀', label:'Seed Drill'},
    {id:'mini_tractor',icon:'🚛', label:'Mini Tractor'},
    {id:'power_tiller',icon:'🔧', label:'Power Tiller'},
  ];

  const SAMPLE_EQUIPMENT = [
    { id:'s1', name:'John Deere 5310', equipment_type:'tractor', listing_type:'rent', daily_rate:1800, sale_price:null, year_of_manufacture:2021, operator_included:true, status:'available', location_label:'Guntur, AP', rating:4.8, description:'55 HP, 4WD, well maintained. Comes with experienced operator. Ideal for paddy and cotton fields.', owner_name:'Ramesh Kumar' },
    { id:'s2', name:'Mahindra 475 DI', equipment_type:'tractor', listing_type:'both', daily_rate:1500, sale_price:450000, year_of_manufacture:2019, operator_included:false, status:'available', location_label:'Krishna, AP', rating:4.5, description:'42 HP, good condition, 2800 hours used. Available for both rent and outright purchase.' },
    { id:'s3', name:'Kubota DC-70 Combine', equipment_type:'harvester', listing_type:'rent', daily_rate:8000, sale_price:null, year_of_manufacture:2022, operator_included:true, status:'available', location_label:'West Godavari, AP', rating:4.9, description:'Full combine harvester with cutter header. 70HP, 4-wheel drive. Operator with 8 years experience included.' },
    { id:'s4', name:'Shaktiman Rotavator 7ft', equipment_type:'rotavator', listing_type:'sale', daily_rate:null, sale_price:95000, year_of_manufacture:2020, operator_included:false, status:'available', location_label:'Prakasam, AP', rating:4.2, description:'7 feet working width, 48 blades, multi-speed gearbox. Used for 2 seasons only.' },
    { id:'s5', name:'ASPEE Sprayer 16L', equipment_type:'sprayer', listing_type:'rent', daily_rate:200, sale_price:null, year_of_manufacture:2023, operator_included:false, status:'available', location_label:'Nellore, AP', rating:4.6, description:'Battery-operated knapsack sprayer, 16L capacity. Adjustable nozzle.' },
    { id:'s6', name:'VST Shakti Power Tiller', equipment_type:'power_tiller', listing_type:'both', daily_rate:1200, sale_price:280000, year_of_manufacture:2020, operator_included:true, status:'booked', location_label:'East Godavari, AP', rating:4.4, description:'9HP diesel, ideal for wet and dry land preparation. Very fuel efficient.' },
    { id:'s7', name:'Preet 749 Harvester', equipment_type:'harvester', listing_type:'sale', daily_rate:null, sale_price:1800000, year_of_manufacture:2018, operator_included:false, status:'available', location_label:'Kurnool, AP', rating:4.1, description:'14 feet header, self-propelled, AC cabin. 3200 hours. Good for paddy & wheat.' },
    { id:'s8', name:'Kirloskar Pump Set 5HP', equipment_type:'pump', listing_type:'rent', daily_rate:350, sale_price:null, year_of_manufacture:2022, operator_included:false, status:'available', location_label:'Chittoor, AP', rating:4.7, description:'Centrifugal pump, 5HP motor, 2-inch suction. Suitable for 2-5 acre farms.' },
    { id:'s9', name:'TAFE 5900 DI', equipment_type:'tractor', listing_type:'rent', daily_rate:2000, sale_price:null, year_of_manufacture:2022, operator_included:true, status:'available', location_label:'Srikakulam, AP', rating:4.6, description:'60 HP, power steering, dual clutch. Perfect for heavy-duty operations.' },
    { id:'s10', name:'Landforce Seed Drill 9-Row', equipment_type:'seed_drill', listing_type:'both', daily_rate:600, sale_price:48000, year_of_manufacture:2021, operator_included:false, status:'available', location_label:'Anantapur, AP', rating:4.3, description:'9-row mechanical seed drill. Adjustable row spacing. Suitable for groundnut, sunflower, pulses.' },
  ];

  function render() {
    container.innerHTML = `
      <div style="background:linear-gradient(135deg,#E65100,#BF360C);color:white;padding:14px 16px 12px">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:28px">🚜</span>
          <div style="flex:1">
            <div style="font-weight:800;font-size:18px">KisanConnect</div>
            <div style="font-size:11px;opacity:0.85">Farm Equipment Marketplace</div>
          </div>
        </div>
      </div>

      <div class="mode-toggle-bar" style="display:flex;margin:10px 14px 6px;background:#F5F5F5;border-radius:12px;padding:3px;border:1px solid #E0E0E0">
        <button data-kmode="rent" style="flex:1;padding:9px 4px;border-radius:10px;font-size:12px;font-weight:700;border:none;cursor:pointer;${mode==='rent'?'background:#0277BD;color:white;box-shadow:0 2px 8px rgba(2,119,189,0.3)':'background:transparent;color:#757575'}">🔑 Rent</button>
        <button data-kmode="buy" style="flex:1;padding:9px 4px;border-radius:10px;font-size:12px;font-weight:700;border:none;cursor:pointer;${mode==='buy'?'background:#2E7D32;color:white;box-shadow:0 2px 8px rgba(46,125,50,0.3)':'background:transparent;color:#757575'}">💰 Buy</button>
        <button data-kmode="sell" style="flex:1;padding:9px 4px;border-radius:10px;font-size:12px;font-weight:700;border:none;cursor:pointer;${mode==='sell'?'background:#E65100;color:white;box-shadow:0 2px 8px rgba(230,81,0,0.3)':'background:transparent;color:#757575'}">🏷️ Sell / List</button>
      </div>

      <div style="padding:0 14px 80px">
        ${loading ? '<div class="loading"><div class="spinner"></div></div>' : renderContent()}
      </div>
    `;
    attachEvents();
  }

  function renderContent() {
    if (mode === 'sell') return renderSellMode();
    return renderBrowseMode();
  }

  function renderBrowseMode() {
    const isRent = mode === 'rent';
    let filtered = equipment.filter(e => {
      if (isRent) return e.listing_type === 'rent' || e.listing_type === 'both';
      return e.listing_type === 'sale' || e.listing_type === 'both';
    });
    if (eqSearch) filtered = filtered.filter(e => `${e.name} ${e.equipment_type} ${e.location_label}`.toLowerCase().includes(eqSearch.toLowerCase()));
    if (eqType) filtered = filtered.filter(e => e.equipment_type === eqType);
    const mc = isRent ? '#0277BD' : '#2E7D32';

    return `
      <div style="background:${mc}08;border:1px solid ${mc}25;border-radius:10px;padding:10px 12px;margin:8px 0 10px">
        <div style="font-size:12px;font-weight:700;color:${mc}">${isRent ? '🔑 Rent Equipment' : '💰 Buy Equipment'}</div>
        <div style="font-size:11px;color:var(--text3);margin-top:2px">${isRent ? 'Hire tractors, harvesters & machines by day. Returned after use.' : 'Purchase pre-owned or new equipment. Contact seller to negotiate.'}</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">
        <div style="text-align:center;background:white;border-radius:10px;padding:8px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
          <div style="font-weight:800;font-size:18px;color:${mc}">${filtered.length}</div>
          <div style="font-size:10px;color:#757575">${isRent ? 'For Rent' : 'For Sale'}</div>
        </div>
        <div style="text-align:center;background:white;border-radius:10px;padding:8px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
          <div style="font-weight:800;font-size:18px;color:${mc}">${filtered.filter(e=>e.status==='available').length}</div>
          <div style="font-size:10px;color:#757575">Available</div>
        </div>
        <div style="text-align:center;background:white;border-radius:10px;padding:8px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
          <div style="font-weight:800;font-size:18px;color:${mc}">${[...new Set(filtered.map(e=>e.equipment_type))].length}</div>
          <div style="font-size:10px;color:#757575">Types</div>
        </div>
      </div>

      <div style="display:flex;align-items:center;background:white;border:1px solid #E0E0E0;border-radius:10px;padding:8px 12px;margin-bottom:8px">
        <span style="margin-right:8px">🔍</span>
        <input id="eqSearch" type="text" placeholder="Search tractor, harvester, location…" value="${eqSearch}" style="border:none;outline:none;flex:1;font-size:13px;background:transparent">
      </div>

      <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;margin-bottom:10px">
        <button data-et="" style="flex-shrink:0;padding:5px 12px;border-radius:20px;border:none;font-size:11px;font-weight:600;cursor:pointer;background:${!eqType?mc:'#F5F5F5'};color:${!eqType?'white':'#616161'}">All</button>
        ${EQ_TYPES.map(t=>`<button data-et="${t.id}" style="flex-shrink:0;padding:5px 10px;border-radius:20px;border:none;font-size:11px;cursor:pointer;background:${eqType===t.id?mc:'#F5F5F5'};color:${eqType===t.id?'white':'#616161'}">${t.icon} ${t.label}</button>`).join('')}
      </div>

      ${filtered.length === 0 ? '<div style="text-align:center;padding:30px"><div style="font-size:40px">🚜</div><div style="font-weight:700;margin-top:8px">No equipment found</div></div>'
        : filtered.map(e => renderCard(e)).join('')}
    `;
  }

  function renderSellMode() {
    return `
      <div style="margin-top:10px">
        <button id="listEquipBtn" style="width:100%;padding:14px;background:linear-gradient(135deg,#E65100,#BF360C);color:white;border:none;border-radius:12px;font-weight:700;font-size:14px;cursor:pointer;margin-bottom:14px;box-shadow:0 3px 12px rgba(230,81,0,0.25)">+ List Your Equipment</button>
        <div style="background:white;border-radius:12px;padding:14px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
          <div style="font-weight:700;font-size:13px;margin-bottom:10px">📋 How It Works</div>
          ${[{n:'1',t:'List Equipment',d:'Add name, type, daily rate or sale price'},{n:'2',t:'Get Requests',d:'Farmers send booking or purchase requests'},{n:'3',t:'Earn Money',d:'Accept requests. Secure escrow payment'}].map(s=>`
            <div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:8px">
              <div style="width:26px;height:26px;border-radius:50%;background:#E65100;color:white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:11px;flex-shrink:0">${s.n}</div>
              <div><div style="font-weight:700;font-size:12px">${s.t}</div><div style="font-size:11px;color:#757575">${s.d}</div></div>
            </div>`).join('')}
        </div>
        <div style="background:#FFF3E0;border:1px solid #FFE0B2;border-radius:10px;padding:12px;font-size:12px;color:#E65100;line-height:1.5">
          <strong>💡 Earn ₹1,000–₹8,000/day</strong> by renting out your tractor, harvester, or any farm equipment when idle. Over 10,000 farmers are looking for equipment near you.
        </div>
      </div>
    `;
  }

  function renderCard(e) {
    const isRent = e.listing_type === 'rent' || e.listing_type === 'both';
    const isSale = e.listing_type === 'sale' || e.listing_type === 'both';
    const ti = EQ_TYPES.find(t=>t.id===e.equipment_type)?.icon || '🚜';
    const mc = mode === 'rent' ? '#0277BD' : '#2E7D32';
    return `
      <div style="background:white;border-radius:12px;margin-bottom:10px;box-shadow:0 2px 6px rgba(0,0,0,0.07);overflow:hidden">
        <div style="height:4px;background:${mc}"></div>
        <div style="padding:12px 14px">
          <div style="display:flex;align-items:flex-start;gap:10px">
            <div style="width:44px;height:44px;border-radius:10px;background:#FBE9E7;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">${ti}</div>
            <div style="flex:1">
              <div style="font-weight:700;font-size:14px">${e.name}</div>
              <div style="font-size:11px;color:#757575;margin-top:2px">📍 ${e.location_label||'Nearby'}${e.owner_name?' · 👤 '+e.owner_name:''}</div>
              <div style="display:flex;gap:4px;margin-top:5px;flex-wrap:wrap">
                ${mode==='rent'&&isRent?`<span style="background:#E3F2FD;color:#0277BD;padding:2px 8px;border-radius:8px;font-size:11px;font-weight:700">₹${Number(e.daily_rate||0).toLocaleString()}/day</span>`:''}
                ${mode==='buy'&&isSale?`<span style="background:#E8F5E9;color:#2E7D32;padding:2px 8px;border-radius:8px;font-size:11px;font-weight:700">₹${Number(e.sale_price||0).toLocaleString()}</span>`:''}
                ${e.year_of_manufacture?`<span style="background:#F5F5F5;color:#616161;padding:2px 7px;border-radius:8px;font-size:10px">${e.year_of_manufacture}</span>`:''}
                ${e.operator_included?`<span style="background:#FFF3E0;color:#E65100;padding:2px 7px;border-radius:8px;font-size:10px">+Operator</span>`:''}
                ${e.rating?`<span style="background:#FFF8E1;color:#F9A825;padding:2px 7px;border-radius:8px;font-size:10px">⭐${Number(e.rating).toFixed(1)}</span>`:''}
                <span style="background:${e.status==='available'?'#E8F5E9':'#FFEBEE'};color:${e.status==='available'?'#2E7D32':'#C62828'};padding:2px 7px;border-radius:8px;font-size:10px;font-weight:600">${e.status==='available'?'✓ Available':'Booked'}</span>
              </div>
            </div>
          </div>
          ${e.description?`<div style="font-size:11px;color:#757575;margin-top:8px;line-height:1.5">${e.description.slice(0,120)}${e.description.length>120?'…':''}</div>`:''}
          <div style="display:flex;gap:6px;margin-top:10px">
            ${mode==='rent'&&isRent&&e.status==='available'?`<button class="book-btn" data-id="${e.id}" style="flex:1;padding:9px;background:#0277BD;color:white;border:none;border-radius:8px;font-weight:600;font-size:12px;cursor:pointer">📅 Book Now</button>`:''}
            ${mode==='buy'&&isSale?`<button class="contact-buy-btn" data-id="${e.id}" style="flex:1;padding:9px;background:#2E7D32;color:white;border:none;border-radius:8px;font-weight:600;font-size:12px;cursor:pointer">� Contact Seller</button>`:''}
            <button class="review-eq-btn" data-id="${e.id}" data-name="${e.name}" style="padding:9px 10px;background:#FFF8E1;color:#F9A825;border:none;border-radius:8px;font-size:12px;cursor:pointer">⭐</button>
          </div>
        </div>
      </div>
    `;
  }

  function showListEquipment() {
    showModal(`
      <div class="modal-handle"></div><h3>🚜 List Equipment</h3>
      <div class="form-group"><label>Name *</label><input class="form-input" id="eqName" placeholder="e.g. John Deere 5310"></div>
      <div class="form-group"><label>Type *</label><select class="form-input" id="eqTypeS">${EQ_TYPES.map(t=>`<option value="${t.id}">${t.icon} ${t.label}</option>`).join('')}</select></div>
      <div class="form-group"><label>Listing</label><select class="form-input" id="eqLT"><option value="rent">🔑 Rent</option><option value="sale">💰 Sale</option><option value="both">Both</option></select></div>
      <div class="form-group"><label>Daily Rate (₹)</label><input class="form-input" type="number" id="eqRate" placeholder="1500"></div>
      <div class="form-group"><label>Sale Price (₹)</label><input class="form-input" type="number" id="eqPrice" placeholder="450000"></div>
      <div class="form-group"><label>Year</label><input class="form-input" type="number" id="eqYear" placeholder="2021"></div>
      <div class="form-group"><label>Location</label><input class="form-input" id="eqLoc" placeholder="Guntur, AP"></div>
      <div class="form-group"><label>Description</label><textarea class="form-input" id="eqDesc" rows="2"></textarea></div>
      <button id="submitEq" style="width:100%;padding:12px;background:#E65100;color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer">List Equipment</button>
    `);
    document.querySelector('#submitEq')?.addEventListener('click', async () => {
      const name = document.querySelector('#eqName')?.value?.trim();
      if (!name) return showToast('Name required','error');
      try {
        await api.createEquipment({ name, equipment_type:document.querySelector('#eqTypeS').value, listing_type:document.querySelector('#eqLT').value, daily_rate:Number(document.querySelector('#eqRate').value)||null, sale_price:Number(document.querySelector('#eqPrice').value)||null, year_of_manufacture:Number(document.querySelector('#eqYear').value)||null, location_label:document.querySelector('#eqLoc').value, description:document.querySelector('#eqDesc').value });
        showToast('Listed!','success'); closeModal(); loadData();
      } catch(e) { showToast(e.message,'error'); }
    });
  }

  function showBookingModal(id) {
    const e = equipment.find(x=>x.id==id);
    if (!e) return;
    showModal(`<div class="modal-handle"></div><h3>📅 Book — ${e.name}</h3>
      <div style="background:#E3F2FD;border-radius:8px;padding:10px;margin-bottom:12px;font-size:12px">${e.equipment_type?.replace('_',' ')} · ${e.location_label} · ₹${Number(e.daily_rate||0).toLocaleString()}/day${e.operator_included?' · +Operator':''}</div>
      <div class="form-group"><label>Start</label><input class="form-input" type="date" id="bkS"></div>
      <div class="form-group"><label>End</label><input class="form-input" type="date" id="bkE"></div>
      <div class="form-group"><label>Notes</label><textarea class="form-input" id="bkN" rows="2" placeholder="Purpose, location…"></textarea></div>
      <button id="submitBk" style="width:100%;padding:12px;background:#0277BD;color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer">Confirm Booking</button>`);
    document.querySelector('#submitBk')?.addEventListener('click', async ()=>{
      const s=document.querySelector('#bkS').value, en=document.querySelector('#bkE').value;
      if(!s||!en) return showToast('Select dates','error');
      const d=Math.ceil((new Date(en)-new Date(s))/86400000)+1;
      const total=d*Number(e.daily_rate||0);
      closeModal();
      showCheckout({
        amount: total,
        description: `${e.name} — ${d} days rental`,
        order_type: 'kisanconnect',
        reference_id: e.id,
        onSuccess: async () => {
          try { await api.createBooking({equipment_id:e.id,start_date:s,end_date:en,notes:document.querySelector('#bkN')?.value||'',total_amount:total}); showToast(t('booking_confirmed')||`Booked ${d} days!`,'success'); loadData(); } catch(err){showToast(err.message,'error');}
        },
        onFailure: () => showToast(t('payment_failed')||'Payment failed','error')
      });
    });
  }

  function attachEvents() {
    container.querySelectorAll('[data-kmode]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.kmode;eqType='';eqSearch='';render();}));
    container.querySelectorAll('[data-et]').forEach(b=>b.addEventListener('click',()=>{eqType=b.dataset.et;render();}));
    container.querySelector('#eqSearch')?.addEventListener('input',e=>{eqSearch=e.target.value;render();});
    container.querySelector('#listEquipBtn')?.addEventListener('click',showListEquipment);
    container.querySelectorAll('.book-btn').forEach(b=>b.addEventListener('click',()=>showBookingModal(b.dataset.id)));
    container.querySelectorAll('.contact-buy-btn').forEach(b=>b.addEventListener('click',()=>{
      navigate('chat');
    }));
    container.querySelectorAll('.review-eq-btn').forEach(b=>b.addEventListener('click',()=>showReviewsModal({target_type:'equipment',target_id:b.dataset.id,target_name:b.dataset.name})));
  }

  async function loadData() {
    loading = true; render();
    try {
      const eq = await api.getEquipment('?limit=30').catch(()=>null);
      const data = eq?(Array.isArray(eq)?eq:(eq.equipment||[])):[];
      equipment = data.length > 0 ? data : SAMPLE_EQUIPMENT;
    } catch(e) { equipment = SAMPLE_EQUIPMENT; }
    loading = false; render();
  }

  loadData();
}
