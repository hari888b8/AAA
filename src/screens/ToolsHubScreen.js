import { navigate } from '../main.js';
import { t } from '../i18n.js';

// ═══════════════════════════════════════════════════════════════
//  AGRI TOOLS HUB — All calculators & utilities in ONE section
//  Keeps core product clean, provides farmers supporting tools
// ═══════════════════════════════════════════════════════════════

export function renderToolsHub(container) {
  const TOOL_CATEGORIES = [
    {
      title: '💰 Financial Tools',
      color: '#1565C0',
      tools: [
        { icon: '📊', name: 'Profit Calculator', desc: 'Calculate crop profit after all expenses', id: 'profit-calc' },
        { icon: '💵', name: 'Cost Estimator', desc: 'Estimate total input costs for a season', id: 'cost-est' },
        { icon: '🏦', name: 'Loan EMI Calculator', desc: 'Calculate monthly EMI for agri loans', id: 'emi-calc' },
        { icon: '📈', name: 'ROI Calculator', desc: 'Return on investment per acre', id: 'roi-calc' },
        { icon: '💹', name: 'Margin Calculator', desc: 'Selling price vs cost margin analysis', id: 'margin-calc' },
      ]
    },
    {
      title: '🌾 Farming Tools',
      color: '#2E7D32',
      tools: [
        { icon: '🌱', name: 'Seed Rate Calculator', desc: 'Optimal seeds per acre by crop', id: 'seed-rate' },
        { icon: '🧪', name: 'Fertilizer Calculator', desc: 'NPK requirement by soil type', id: 'fert-calc' },
        { icon: '📏', name: 'Yield Estimator', desc: 'Expected yield based on inputs & area', id: 'yield-est' },
        { icon: '💧', name: 'Irrigation Planner', desc: 'Water requirement scheduling', id: 'irrigation' },
        { icon: '🗓️', name: 'Crop Calendar', desc: 'Sowing to harvest timeline', id: 'crop-cal' },
        { icon: '🧬', name: 'Soil Health Card', desc: 'Interpret soil test results', id: 'soil-health' },
      ]
    },
    {
      title: '📦 Trade Tools',
      color: '#E65100',
      tools: [
        { icon: '⚖️', name: 'Price Comparison', desc: 'Compare prices across mandis', id: 'price-compare' },
        { icon: '🚛', name: 'Transport Cost', desc: 'Estimate logistics cost by distance', id: 'transport-cost' },
        { icon: '📊', name: 'Market Trend', desc: 'Price trends over 30/60/90 days', id: 'market-trend' },
        { icon: '🏪', name: 'Mandi Directory', desc: 'Find nearest APMCs & buyers', id: 'mandi-dir' },
      ]
    },
    {
      title: '🐟 Aqua Tools',
      color: '#0277BD',
      tools: [
        { icon: '🐟', name: 'Feed Calculator', desc: 'Daily feed requirement by biomass', id: 'feed-calc' },
        { icon: '📈', name: 'Growth Estimator', desc: 'Expected harvest weight & timeline', id: 'growth-est' },
        { icon: '💧', name: 'Water Quality', desc: 'pH, DO, ammonia level tracker', id: 'water-quality' },
        { icon: '🧮', name: 'Stocking Density', desc: 'Optimal count per acre of pond', id: 'stocking' },
      ]
    },
    {
      title: '🏡 Land Tools',
      color: '#795548',
      tools: [
        { icon: '📐', name: 'Area Converter', desc: 'Acres ↔ Hectares ↔ Guntas ↔ Cents', id: 'area-conv' },
        { icon: '🗺️', name: 'Land Valuation', desc: 'Estimate land value by location', id: 'land-val' },
        { icon: '📋', name: 'Lease Calculator', desc: 'Annual lease vs purchase comparison', id: 'lease-calc' },
      ]
    },
  ];

  container.innerHTML = `
    <div style="background:linear-gradient(135deg,#283593,#1565C0);color:white;padding:20px 16px 28px;border-radius:0 0 24px 24px">
      <h1 style="margin:0;font-size:1.5rem;font-weight:800">🧰 Agri Tools Hub</h1>
      <p style="margin:4px 0 0;opacity:0.85;font-size:0.85rem">Calculators, estimators & utilities for smarter farming</p>
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:16px">
        ${['💰','🌾','📦','🐟','🏡'].map((e,i) => `
          <div style="text-align:center;background:rgba(255,255,255,0.12);border-radius:10px;padding:8px 4px;cursor:pointer" data-cat="${i}">
            <div style="font-size:1.4rem">${e}</div>
            <div style="font-size:0.6rem;opacity:0.8;margin-top:2px">${['Finance','Farm','Trade','Aqua','Land'][i]}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div style="padding:16px" id="toolsContent">
      ${TOOL_CATEGORIES.map(cat => `
        <div style="margin-bottom:20px">
          <div style="font-weight:700;font-size:0.95rem;margin-bottom:10px;color:${cat.color}">${cat.title}</div>
          <div style="display:grid;gap:8px">
            ${cat.tools.map(tool => `
              <div class="tool-card" data-tool="${tool.id}" style="display:flex;align-items:center;gap:12px;background:white;border-radius:12px;padding:14px;box-shadow:0 1px 4px rgba(0,0,0,0.06);cursor:pointer;border:1px solid #f0f0f0;transition:all 0.15s">
                <div style="width:42px;height:42px;border-radius:10px;background:${cat.color}12;display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0">${tool.icon}</div>
                <div style="flex:1;min-width:0">
                  <div style="font-weight:600;font-size:0.88rem;color:#212121">${tool.name}</div>
                  <div style="font-size:0.75rem;color:#757575;margin-top:1px">${tool.desc}</div>
                </div>
                <span style="color:#BDBDBD;font-size:14px">›</span>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
    <div style="height:80px"></div>
  `;

  // Tool card interactions — show calculator modal
  container.querySelectorAll('.tool-card').forEach(card => {
    card.addEventListener('click', () => {
      const toolId = card.dataset.tool;
      showToolModal(container, toolId);
    });
  });
}

function showToolModal(container, toolId) {
  const tools = {
    'profit-calc': { title: '📊 Profit Calculator', fields: [
      { label: 'Crop', type: 'select', options: ['Paddy','Cotton','Maize','Groundnut','Chilli','Tomato'] },
      { label: 'Area (acres)', type: 'number', placeholder: '5' },
      { label: 'Total Input Cost (₹)', type: 'number', placeholder: '45000' },
      { label: 'Yield per acre (qtl)', type: 'number', placeholder: '25' },
      { label: 'Market Price (₹/qtl)', type: 'number', placeholder: '2200' },
    ], calculate: (vals) => {
      const revenue = vals[1] * vals[3] * vals[4];
      const cost = vals[2];
      const profit = revenue - cost;
      return `<div style="text-align:center;padding:12px">
        <div style="font-size:0.8rem;color:#666">Total Revenue</div>
        <div style="font-size:1.4rem;font-weight:700;color:#2E7D32">₹${revenue.toLocaleString()}</div>
        <div style="font-size:0.8rem;color:#666;margin-top:8px">Net Profit</div>
        <div style="font-size:1.8rem;font-weight:800;color:${profit>=0?'#1B5E20':'#C62828'}">₹${profit.toLocaleString()}</div>
        <div style="font-size:0.75rem;color:#888;margin-top:4px">Profit per acre: ₹${Math.round(profit/vals[1]).toLocaleString()}</div>
      </div>`;
    }},
    'cost-est': { title: '💵 Cost Estimator', fields: [
      { label: 'Crop', type: 'select', options: ['Paddy','Cotton','Maize','Groundnut','Chilli'] },
      { label: 'Area (acres)', type: 'number', placeholder: '5' },
      { label: 'Seeds (₹)', type: 'number', placeholder: '3000' },
      { label: 'Fertilizer (₹)', type: 'number', placeholder: '8000' },
      { label: 'Pesticide (₹)', type: 'number', placeholder: '4000' },
      { label: 'Labour (₹)', type: 'number', placeholder: '15000' },
      { label: 'Irrigation (₹)', type: 'number', placeholder: '5000' },
    ], calculate: (vals) => {
      const total = vals[2]+vals[3]+vals[4]+vals[5]+vals[6];
      const perAcre = Math.round(total/vals[1]);
      return `<div style="text-align:center;padding:12px">
        <div style="font-size:0.8rem;color:#666">Total Estimated Cost</div>
        <div style="font-size:1.6rem;font-weight:800;color:#E65100">₹${total.toLocaleString()}</div>
        <div style="font-size:0.8rem;color:#888;margin-top:4px">₹${perAcre.toLocaleString()} per acre</div>
      </div>`;
    }},
    'emi-calc': { title: '🏦 Loan EMI Calculator', fields: [
      { label: 'Loan Amount (₹)', type: 'number', placeholder: '100000' },
      { label: 'Interest Rate (%)', type: 'number', placeholder: '7' },
      { label: 'Tenure (months)', type: 'number', placeholder: '12' },
    ], calculate: (vals) => {
      const P = vals[0], r = vals[1]/1200, n = vals[2];
      const emi = r > 0 ? Math.round(P * r * Math.pow(1+r,n) / (Math.pow(1+r,n)-1)) : Math.round(P/n);
      const totalPay = emi * n;
      const interest = totalPay - P;
      return `<div style="text-align:center;padding:12px">
        <div style="font-size:0.8rem;color:#666">Monthly EMI</div>
        <div style="font-size:1.6rem;font-weight:800;color:#1565C0">₹${emi.toLocaleString()}</div>
        <div style="display:flex;justify-content:center;gap:20px;margin-top:12px">
          <div><div style="font-size:0.7rem;color:#888">Total Payable</div><div style="font-weight:700">₹${totalPay.toLocaleString()}</div></div>
          <div><div style="font-size:0.7rem;color:#888">Total Interest</div><div style="font-weight:700;color:#E65100">₹${interest.toLocaleString()}</div></div>
        </div>
      </div>`;
    }},
    'seed-rate': { title: '🌱 Seed Rate Calculator', fields: [
      { label: 'Crop', type: 'select', options: ['Paddy','Cotton','Maize','Groundnut','Chilli','Wheat','Soybean'] },
      { label: 'Area (acres)', type: 'number', placeholder: '5' },
    ], calculate: (vals) => {
      const rates = { Paddy: 30, Cotton: 5, Maize: 8, Groundnut: 50, Chilli: 0.5, Wheat: 40, Soybean: 30 };
      const cropName = ['Paddy','Cotton','Maize','Groundnut','Chilli','Wheat','Soybean'][vals[0]];
      const rate = rates[cropName] || 20;
      const total = rate * vals[1];
      return `<div style="text-align:center;padding:12px">
        <div style="font-size:0.8rem;color:#666">Recommended Seed Rate</div>
        <div style="font-size:1.6rem;font-weight:800;color:#2E7D32">${total} kg</div>
        <div style="font-size:0.8rem;color:#888;margin-top:4px">${rate} kg/acre × ${vals[1]} acres</div>
      </div>`;
    }},
    'fert-calc': { title: '🧪 Fertilizer Calculator', fields: [
      { label: 'Crop', type: 'select', options: ['Paddy','Cotton','Maize','Groundnut','Chilli'] },
      { label: 'Area (acres)', type: 'number', placeholder: '5' },
      { label: 'Soil Type', type: 'select', options: ['Sandy','Loamy','Clay','Black'] },
    ], calculate: (vals) => {
      const npk = { Paddy: [120,60,40], Cotton: [80,40,40], Maize: [120,60,40], Groundnut: [20,40,40], Chilli: [100,50,50] };
      const cropName = ['Paddy','Cotton','Maize','Groundnut','Chilli'][vals[0]];
      const [n,p,k] = npk[cropName] || [80,40,40];
      return `<div style="text-align:center;padding:12px">
        <div style="font-size:0.8rem;color:#666">NPK Requirement (per acre)</div>
        <div style="display:flex;justify-content:center;gap:16px;margin-top:8px">
          <div style="background:#E8F5E9;padding:10px 16px;border-radius:8px"><div style="font-size:1.2rem;font-weight:700;color:#2E7D32">${n}</div><div style="font-size:0.7rem">N (kg)</div></div>
          <div style="background:#E3F2FD;padding:10px 16px;border-radius:8px"><div style="font-size:1.2rem;font-weight:700;color:#1565C0">${p}</div><div style="font-size:0.7rem">P (kg)</div></div>
          <div style="background:#FFF3E0;padding:10px 16px;border-radius:8px"><div style="font-size:1.2rem;font-weight:700;color:#E65100">${k}</div><div style="font-size:0.7rem">K (kg)</div></div>
        </div>
        <div style="font-size:0.78rem;color:#888;margin-top:10px">Total for ${vals[1]} acres: N=${n*vals[1]}kg, P=${p*vals[1]}kg, K=${k*vals[1]}kg</div>
      </div>`;
    }},
    'yield-est': { title: '📏 Yield Estimator', fields: [
      { label: 'Crop', type: 'select', options: ['Paddy','Cotton','Maize','Groundnut','Chilli','Tomato'] },
      { label: 'Area (acres)', type: 'number', placeholder: '5' },
      { label: 'Irrigation', type: 'select', options: ['Rainfed','Canal','Borewell','Drip'] },
    ], calculate: (vals) => {
      const base = { Paddy: 22, Cotton: 8, Maize: 30, Groundnut: 12, Chilli: 15, Tomato: 80 };
      const irrBonus = { Rainfed: 0.8, Canal: 1.0, Borewell: 1.1, Drip: 1.2 };
      const cropName = ['Paddy','Cotton','Maize','Groundnut','Chilli','Tomato'][vals[0]];
      const irrName = ['Rainfed','Canal','Borewell','Drip'][vals[2]];
      const yieldPerAcre = Math.round((base[cropName]||20) * (irrBonus[irrName]||1));
      const total = yieldPerAcre * vals[1];
      return `<div style="text-align:center;padding:12px">
        <div style="font-size:0.8rem;color:#666">Expected Yield</div>
        <div style="font-size:1.6rem;font-weight:800;color:#2E7D32">${total} quintals</div>
        <div style="font-size:0.8rem;color:#888;margin-top:4px">${yieldPerAcre} qtl/acre × ${vals[1]} acres (${irrName})</div>
      </div>`;
    }},
    'area-conv': { title: '📐 Area Converter', fields: [
      { label: 'Value', type: 'number', placeholder: '5' },
      { label: 'From', type: 'select', options: ['Acres','Hectares','Guntas','Cents','Sq.ft'] },
    ], calculate: (vals) => {
      const toSqft = { Acres: 43560, Hectares: 107639, Guntas: 1089, Cents: 435.6, 'Sq.ft': 1 };
      const fromUnit = ['Acres','Hectares','Guntas','Cents','Sq.ft'][vals[1]];
      const sqft = vals[0] * (toSqft[fromUnit] || 1);
      return `<div style="padding:12px">
        <div style="font-size:0.8rem;color:#666;text-align:center;margin-bottom:10px">${vals[0]} ${fromUnit} =</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          ${Object.entries(toSqft).filter(([k])=>k!==fromUnit).map(([unit, factor]) => `
            <div style="background:#f5f5f5;padding:10px;border-radius:8px;text-align:center">
              <div style="font-weight:700;font-size:1rem">${(sqft/factor).toFixed(2)}</div>
              <div style="font-size:0.72rem;color:#888">${unit}</div>
            </div>
          `).join('')}
        </div>
      </div>`;
    }},
    'transport-cost': { title: '🚛 Transport Cost Estimator', fields: [
      { label: 'Distance (km)', type: 'number', placeholder: '50' },
      { label: 'Weight (quintals)', type: 'number', placeholder: '20' },
      { label: 'Vehicle', type: 'select', options: ['Auto (1T)','Mini Truck (2.5T)','Truck (10T)','Lorry (16T)'] },
    ], calculate: (vals) => {
      const ratePerKm = [15, 22, 35, 45][vals[2]];
      const baseCost = vals[0] * ratePerKm;
      const loading = vals[1] * 20;
      const total = baseCost + loading;
      const perQtl = Math.round(total / vals[1]);
      return `<div style="text-align:center;padding:12px">
        <div style="font-size:0.8rem;color:#666">Estimated Transport Cost</div>
        <div style="font-size:1.6rem;font-weight:800;color:#E65100">₹${total.toLocaleString()}</div>
        <div style="font-size:0.78rem;color:#888;margin-top:6px">₹${perQtl}/qtl · ${vals[0]}km · ₹${ratePerKm}/km</div>
        <div style="font-size:0.72rem;color:#aaa;margin-top:4px">Includes ₹${loading} loading charges</div>
      </div>`;
    }},
    'feed-calc': { title: '🐟 Feed Calculator', fields: [
      { label: 'Species', type: 'select', options: ['Vannamei Shrimp','Tiger Prawn','Pangasius','Tilapia'] },
      { label: 'Biomass in pond (kg)', type: 'number', placeholder: '500' },
      { label: 'Average body weight (g)', type: 'number', placeholder: '15' },
    ], calculate: (vals) => {
      const fcr = [1.4, 1.6, 1.5, 1.3][vals[0]];
      const feedPct = vals[2] < 5 ? 10 : vals[2] < 15 ? 6 : vals[2] < 25 ? 4 : 3;
      const dailyFeed = Math.round(vals[1] * feedPct / 100);
      return `<div style="text-align:center;padding:12px">
        <div style="font-size:0.8rem;color:#666">Daily Feed Requirement</div>
        <div style="font-size:1.6rem;font-weight:800;color:#0277BD">${dailyFeed} kg/day</div>
        <div style="font-size:0.78rem;color:#888;margin-top:6px">${feedPct}% of biomass · FCR: ${fcr}</div>
      </div>`;
    }},
    'margin-calc': { title: '💹 Margin Calculator', fields: [
      { label: 'Cost Price (₹/qtl)', type: 'number', placeholder: '1800' },
      { label: 'Selling Price (₹/qtl)', type: 'number', placeholder: '2200' },
      { label: 'Quantity (qtl)', type: 'number', placeholder: '20' },
    ], calculate: (vals) => {
      const margin = vals[1] - vals[0];
      const pct = ((margin/vals[0])*100).toFixed(1);
      const totalProfit = margin * vals[2];
      return `<div style="text-align:center;padding:12px">
        <div style="font-size:0.8rem;color:#666">Margin per quintal</div>
        <div style="font-size:1.6rem;font-weight:800;color:${margin>=0?'#2E7D32':'#C62828'}">₹${margin.toLocaleString()} (${pct}%)</div>
        <div style="font-size:0.8rem;color:#666;margin-top:8px">Total Profit (${vals[2]} qtl)</div>
        <div style="font-size:1.2rem;font-weight:700">₹${totalProfit.toLocaleString()}</div>
      </div>`;
    }},
    'roi-calc': { title: '📈 ROI Calculator', fields: [
      { label: 'Total Investment (₹)', type: 'number', placeholder: '50000' },
      { label: 'Total Revenue (₹)', type: 'number', placeholder: '150000' },
    ], calculate: (vals) => {
      const roi = (((vals[1]-vals[0])/vals[0])*100).toFixed(1);
      return `<div style="text-align:center;padding:12px">
        <div style="font-size:0.8rem;color:#666">Return on Investment</div>
        <div style="font-size:2rem;font-weight:800;color:${roi>=0?'#2E7D32':'#C62828'}">${roi}%</div>
        <div style="font-size:0.8rem;color:#888;margin-top:4px">Profit: ₹${(vals[1]-vals[0]).toLocaleString()}</div>
      </div>`;
    }},
  };

  const tool = tools[toolId];
  if (!tool) return;

  // Create modal overlay
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.5);display:flex;align-items:flex-end;justify-content:center;animation:fadeIn 0.2s';
  modal.innerHTML = `
    <div style="background:white;border-radius:20px 20px 0 0;width:100%;max-width:480px;max-height:85vh;overflow-y:auto;padding:20px 16px 30px;animation:slideUp 0.25s">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3 style="margin:0;font-size:1.1rem">${tool.title}</h3>
        <button id="closeToolModal" style="background:#f5f5f5;border:none;width:32px;height:32px;border-radius:50%;font-size:16px;cursor:pointer">✕</button>
      </div>
      <form id="toolForm" style="display:flex;flex-direction:column;gap:12px">
        ${tool.fields.map((f, i) => `
          <div>
            <label style="font-size:0.8rem;color:#555;display:block;margin-bottom:4px">${f.label}</label>
            ${f.type === 'select'
              ? `<select name="f${i}" style="width:100%;padding:10px;border:1px solid #E0E0E0;border-radius:8px;font-size:0.9rem">${f.options.map((o,j) => `<option value="${j}">${o}</option>`).join('')}</select>`
              : `<input name="f${i}" type="number" placeholder="${f.placeholder||''}" style="width:100%;padding:10px;border:1px solid #E0E0E0;border-radius:8px;font-size:0.9rem" />`
            }
          </div>
        `).join('')}
        <button type="submit" style="padding:14px;background:linear-gradient(135deg,#1565C0,#283593);color:white;border:none;border-radius:10px;font-size:1rem;font-weight:600;cursor:pointer;margin-top:4px">Calculate</button>
      </form>
      <div id="toolResult" style="margin-top:16px"></div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#closeToolModal').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

  modal.querySelector('#toolForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const vals = tool.fields.map((f, i) => {
      const v = fd.get(`f${i}`);
      return f.type === 'select' ? parseInt(v) : parseFloat(v) || 0;
    });
    const resultEl = modal.querySelector('#toolResult');
    resultEl.innerHTML = tool.calculate(vals);
  });
}
