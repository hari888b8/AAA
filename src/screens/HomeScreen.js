import { api } from '../api.js';
import { getState, getRole } from '../store.js';
import { navigate, showToast } from '../main.js';
import { t } from '../i18n.js';

function fmt(n) {
  if (!n && n !== 0) return '0';
  if (n >= 10000000) return (n/10000000).toFixed(1)+'Cr';
  if (n >= 100000)   return (n/100000).toFixed(1)+'L';
  if (n >= 1000)     return (n/1000).toFixed(1)+'K';
  return String(n);
}

export function renderHome(container) {
  const user = getState().user;
  const role = getRole();
  const h = new Date().getHours();
  const greeting = h<12?t('good_morning'):h<17?t('good_afternoon'):t('good_evening');

  // Sample platform stats
  const STATS = { farmers: 124500, equipment: 8430, stores: 2150, land_listings: 3820, districts: 156, fpos: 5200 };

  // Sample mandi prices
  const PRICES = [
    { crop:'Paddy (Sona Masoori)', market:'Guntur', price:2180, unit:'Qtl', change:'+₹45' },
    { crop:'Cotton (DCH-32)', market:'Adilabad', price:6850, unit:'Qtl', change:'+₹120' },
    { crop:'Tomato', market:'Madanapalle', price:1420, unit:'Qtl', change:'-₹80' },
    { crop:'Groundnut', market:'Kurnool', price:5650, unit:'Qtl', change:'+₹200' },
    { crop:'Chilli (Teja)', market:'Khammam', price:14500, unit:'Qtl', change:'-₹300' },
    { crop:'Maize', market:'Nizamabad', price:2080, unit:'Qtl', change:'+₹30' },
  ];

  // Sample recent activity
  const ACTIVITY = [
    { icon:'🚜', text:'New tractor listed in Guntur — ₹1,800/day', time:'2 min ago' },
    { icon:'🌱', text:'Sri Sai Seeds added 15 new products', time:'12 min ago' },
    { icon:'🏡', text:'5 acre land for sale in Krishna dist — ₹18L', time:'25 min ago' },
    { icon:'🐟', text:'Shrimp harvest ready — 2.5 tons, Bhimavaram', time:'1 hr ago' },
    { icon:'🌾', text:'FPO Paddy procurement: 120 tons aggregated', time:'2 hrs ago' },
  ];

  container.innerHTML = `
    <!-- HERO -->
    <div style="background:linear-gradient(135deg,#1a237e,#311b92);color:white;padding:18px 16px 16px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
        <div>
          <div style="font-size:12px;opacity:0.8">${greeting},</div>
          <h1 style="margin:2px 0;font-size:22px;font-weight:800">${user?.name?.split(' ')[0]||'Welcome'} 👋</h1>
          <div style="font-size:11px;opacity:0.7;margin-top:2px">${role === 'farmer' ? '👨‍🌾 Farmer' : role === 'fpo' ? '🏢 FPO Admin' : role === 'buyer' ? '🛒 Buyer' : role === 'supplier' ? '🏭 Supplier' : '🔧 Service Provider'} · AgriHub Platform</div>
        </div>
      </div>

      <!-- Platform Stats -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">
        ${[
          ['👨‍🌾',fmt(STATS.farmers),t('farmers')],
          ['🚜',fmt(STATS.equipment),t('equipment')],
          ['🏪',fmt(STATS.stores),t('stores')],
          ['🏡',fmt(STATS.land_listings),t('land_listings')],
          ['📍',STATS.districts+'',t('districts')],
          ['🏢',fmt(STATS.fpos),t('fpos')],
        ].map(([icon,val,label])=>`<div style="text-align:center;background:rgba(255,255,255,0.1);border-radius:8px;padding:6px 4px"><div style="font-size:14px;font-weight:800">${val}</div><div style="font-size:9px;opacity:0.7">${icon} ${label}</div></div>`).join('')}
      </div>
    </div>

    <div style="padding:14px 14px 80px">
      <!-- ALL 5 PLATFORM APPS -->
      <div style="font-size:12px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">📱 ${t('quick_actions')}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
        ${platformTile('🌐','AgriGalaxy','Seeds & Fertilizers','agrigalaxy','#6A1B9A','2,150 stores · 12K+ products')}
        ${platformTile('🐟','AquaOS','Aquaculture','aquaos','#0277BD','Shrimp · Fish · Pond Management')}
        ${platformTile('🌾','Agri','Crops & FPOs','agri','#2E7D32','AgriFlow · Community · Weather')}
        ${platformTile('🚜','KisanConnect','Equipment','kisan','#E65100','Rent · Buy · Sell machinery')}
        ${platformTile('🏡','BhoomiOS','Land Marketplace','bhoomios','#795548','Buy · Sell · Rent farmland')}
        ${platformTile('🏗️','Platform Map','Architecture','architecture','#37474F','5 platforms · Unified system')}
      </div>

      <!-- LIVE MANDI PRICES -->
      <div style="font-size:12px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">💰 ${t('mandi_prices')}</div>
      <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06);margin-bottom:16px">
        ${PRICES.map((p,i)=>`
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;${i<PRICES.length-1?'border-bottom:1px solid #F5F5F5':''}">
            <div>
              <div style="font-weight:700;font-size:12px">${p.crop}</div>
              <div style="font-size:10px;color:#757575">${p.market}</div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:800;font-size:13px;color:#2E7D32">₹${p.price.toLocaleString()}</div>
              <div style="font-size:10px;color:${p.change.startsWith('+')?'#2E7D32':'#C62828'}">${p.change}/${p.unit}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- RECENT ACTIVITY -->
      <div style="font-size:12px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">🔔 ${t('recent_activity')}</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
        ${ACTIVITY.map(a=>`
          <div style="background:white;border-radius:10px;padding:10px 12px;display:flex;align-items:center;gap:10px;box-shadow:0 1px 3px rgba(0,0,0,0.05)">
            <span style="font-size:20px">${a.icon}</span>
            <div style="flex:1"><div style="font-size:12px;color:#424242">${a.text}</div><div style="font-size:10px;color:#9E9E9E;margin-top:2px">${a.time}</div></div>
          </div>
        `).join('')}
      </div>

      <!-- QUICK ACTIONS -->
      <div style="font-size:12px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">⚡ ${t('quick_actions')}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
        ${[
          {icon:'🚜',label:'Rent\nEquipment',route:'kisan'},
          {icon:'🌱',label:'Buy\nSeeds',route:'agrigalaxy'},
          {icon:'🏡',label:'Find\nLand',route:'bhoomios'},
          {icon:'🐟',label:'Aqua\nMarket',route:'aquaos'},
          {icon:'🌾',label:'Crop\nSupply',route:'agri'},
          {icon:'💬',label:'Community',route:'community'},
        ].map(q=>`<button data-nav="${q.route}" style="background:white;border:none;border-radius:10px;padding:12px 8px;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,0.06);text-align:center"><div style="font-size:22px;margin-bottom:4px">${q.icon}</div><div style="font-size:10px;font-weight:600;color:#424242;white-space:pre-line">${q.label}</div></button>`).join('')}
      </div>
    </div>
  `;

  container.querySelectorAll('[data-nav]').forEach(el => el.addEventListener('click', () => navigate(el.dataset.nav)));

  // Load real data in background
  loadRealData();

  function platformTile(icon, title, subtitle, route, color, desc) {
    return `<div data-nav="${route}" style="background:white;border-radius:12px;padding:12px;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.07);border-top:3px solid ${color};position:relative;overflow:hidden">
      <div style="font-size:22px;margin-bottom:4px">${icon}</div>
      <div style="font-weight:700;font-size:13px;color:${color}">${title}</div>
      <div style="font-size:10px;color:#757575;margin-top:1px">${subtitle}</div>
      <div style="font-size:9px;color:#9E9E9E;margin-top:4px">${desc}</div>
    </div>`;
  }

  async function loadRealData() {
    try {
      const stats = await api.getPlatformStats().catch(()=>null);
      if (stats) {
        // Update stats if real data is available
      }
    } catch(e) {}
  }
}
