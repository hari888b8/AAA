import { api } from '../api.js';
import { t } from '../i18n.js';

// ═══════════════════════════════════════════════════════════════
//  CALCULATORS SCREEN — Aqua Calculator + Crop Calculator
//  Solves real-time problems for aquaculture & agriculture farmers
// ═══════════════════════════════════════════════════════════════

export function renderCalculators(container) {
  let activeTab = 'aqua'; // aqua | crop
  let activeTool = null;
  let result = null;
  let loading = false;

  const AQUA_TOOLS = [
    { id: 'pond-economics', icon: '💰', name: 'Pond Economics', desc: 'Full crop P&L, ROI, cost/kg analysis', color: '#0277BD' },
    { id: 'feed-schedule', icon: '🐟', name: 'Feed Schedule', desc: 'Daily feed by ABW, biomass, stage', color: '#00838F' },
    { id: 'water-quality', icon: '💧', name: 'Water Quality', desc: 'Analyze pH, DO, ammonia — get alerts', color: '#1565C0' },
    { id: 'stocking', icon: '📊', name: 'Stocking Calculator', desc: 'Optimal density by system & budget', color: '#283593' },
    { id: 'harvest-timing', icon: '⏱️', name: 'Harvest Timing', desc: 'When to harvest for max profit', color: '#2E7D32' },
    { id: 'disease-cost', icon: '🦠', name: 'Disease Cost', desc: 'Outbreak cost & action options', color: '#C62828' },
  ];

  const CROP_TOOLS = [
    { id: 'season-economics', icon: '💹', name: 'Season P&L', desc: 'Full season profit/loss with MSP compare', color: '#2E7D32' },
    { id: 'fertilizer-dosage', icon: '🧪', name: 'Fertilizer Dosage', desc: 'Split-wise NPK with schedule', color: '#E65100' },
    { id: 'irrigation-schedule', icon: '💧', name: 'Irrigation Plan', desc: 'Water need by stage, soil, method', color: '#0277BD' },
    { id: 'break-even', icon: '📈', name: 'Break-Even', desc: 'Min price/yield for profit', color: '#6A1B9A' },
    { id: 'spray-schedule', icon: '🧫', name: 'Spray Schedule', desc: 'Pest/disease sprays with organic alt', color: '#C62828' },
    { id: 'yield-prediction', icon: '🌾', name: 'Yield Prediction', desc: 'Expected yield by inputs & conditions', color: '#33691E' },
  ];

  function render() {
    const tools = activeTab === 'aqua' ? AQUA_TOOLS : CROP_TOOLS;

    container.innerHTML = `
      <div style="background:linear-gradient(135deg,${activeTab === 'aqua' ? '#0277BD,#01579B' : '#2E7D32,#1B5E20'});color:white;padding:20px 16px 28px;border-radius:0 0 24px 24px">
        <h1 style="margin:0;font-size:1.5rem;font-weight:800">${activeTab === 'aqua' ? '🐟 Aqua Calculator' : '🌾 Crop Calculator'}</h1>
        <p style="margin:4px 0 0;opacity:0.85;font-size:0.85rem">${activeTab === 'aqua' ? 'Pond economics, feed, water quality & more' : 'Season P&L, fertilizer, irrigation & more'}</p>
      </div>

      <!-- Tab Toggle -->
      <div style="display:flex;margin:12px 16px;background:#f5f5f5;border-radius:12px;padding:3px;border:1px solid #e0e0e0">
        <button data-tab="aqua" style="flex:1;padding:10px;border:none;border-radius:10px;font-weight:600;font-size:0.85rem;cursor:pointer;transition:all 0.2s;${activeTab==='aqua'?'background:#0277BD;color:white;box-shadow:0 2px 8px rgba(2,119,189,0.3)':'background:transparent;color:#666'}">🐟 Aqua Calculator</button>
        <button data-tab="crop" style="flex:1;padding:10px;border:none;border-radius:10px;font-weight:600;font-size:0.85rem;cursor:pointer;transition:all 0.2s;${activeTab==='crop'?'background:#2E7D32;color:white;box-shadow:0 2px 8px rgba(46,125,50,0.3)':'background:transparent;color:#666'}">🌾 Crop Calculator</button>
      </div>

      <!-- Tools Grid -->
      <div style="padding:0 16px 100px" id="calcContent">
        <div style="display:grid;gap:10px">
          ${tools.map(tool => `
            <div class="calc-tool" data-tool="${tool.id}" style="display:flex;align-items:center;gap:12px;background:white;border-radius:14px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.06);cursor:pointer;border:1px solid #f0f0f0;transition:all 0.15s">
              <div style="width:46px;height:46px;border-radius:12px;background:${tool.color}14;display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0">${tool.icon}</div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:700;font-size:0.9rem;color:#212121">${tool.name}</div>
                <div style="font-size:0.76rem;color:#757575;margin-top:2px">${tool.desc}</div>
              </div>
              <span style="color:#BDBDBD;font-size:18px">›</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Event listeners
    container.querySelectorAll('[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        render();
      });
    });

    container.querySelectorAll('.calc-tool').forEach(card => {
      card.addEventListener('click', () => {
        activeTool = card.dataset.tool;
        showCalculatorForm(container);
      });
    });
  }

  function showCalculatorForm(container) {
    const forms = {
      // ─── AQUA FORMS ───────────────────────────────
      'pond-economics': {
        title: '💰 Pond Economics Calculator',
        subtitle: 'Complete cost-revenue analysis for your pond crop',
        endpoint: '/api/calculators/aqua/pond-economics',
        fields: [
          { key: 'pond_area_acres', label: 'Pond Area (acres)', type: 'number', placeholder: '1', default: 1 },
          { key: 'species', label: 'Species', type: 'select', options: [['vannamei','Vannamei Shrimp'],['tiger_prawn','Tiger Prawn'],['pangasius','Pangasius'],['tilapia','Tilapia']] },
          { key: 'stocking_density_per_acre', label: 'Stocking Density (per acre)', type: 'number', placeholder: '60000', default: 60000 },
          { key: 'seed_cost_per_piece', label: 'Seed Cost (₹/piece)', type: 'number', placeholder: '0.45', default: 0.45, step: '0.01' },
          { key: 'feed_cost_per_kg', label: 'Feed Cost (₹/kg)', type: 'number', placeholder: '65', default: 65 },
          { key: 'fcr', label: 'Expected FCR', type: 'number', placeholder: '1.4', default: 1.4, step: '0.1' },
          { key: 'survival_rate', label: 'Survival Rate (%)', type: 'number', placeholder: '80', default: 80 },
          { key: 'culture_days', label: 'Culture Days', type: 'number', placeholder: '110', default: 110 },
          { key: 'expected_abw_g', label: 'Target ABW (grams)', type: 'number', placeholder: '30', default: 30 },
          { key: 'selling_price_per_kg', label: 'Selling Price (₹/kg)', type: 'number', placeholder: '280', default: 280 },
          { key: 'electricity_per_month', label: 'Electricity/month (₹)', type: 'number', placeholder: '8000', default: 8000 },
          { key: 'labor_per_month', label: 'Labor/month (₹)', type: 'number', placeholder: '15000', default: 15000 },
        ],
        renderResult: (data) => renderPondEconomicsResult(data),
      },
      'feed-schedule': {
        title: '🐟 Feed Schedule Generator',
        subtitle: 'Daily feed quantity, frequency & timing',
        endpoint: '/api/calculators/aqua/feed-schedule',
        fields: [
          { key: 'species', label: 'Species', type: 'select', options: [['vannamei','Vannamei Shrimp'],['tiger_prawn','Tiger Prawn'],['pangasius','Pangasius'],['tilapia','Tilapia']] },
          { key: 'current_abw_g', label: 'Current ABW (grams)', type: 'number', placeholder: '10', default: 10 },
          { key: 'survival_count', label: 'Surviving Count', type: 'number', placeholder: '50000', default: 50000 },
          { key: 'pond_area_acres', label: 'Pond Area (acres)', type: 'number', placeholder: '1', default: 1 },
        ],
        renderResult: (data) => renderFeedResult(data),
      },
      'water-quality': {
        title: '💧 Water Quality Analyzer',
        subtitle: 'Enter parameters — get health score & action alerts',
        endpoint: '/api/calculators/aqua/water-quality',
        fields: [
          { key: 'species', label: 'Species', type: 'select', options: [['vannamei','Vannamei Shrimp'],['tiger_prawn','Tiger Prawn'],['pangasius','Pangasius'],['tilapia','Tilapia']] },
          { key: 'ph', label: 'pH', type: 'number', placeholder: '7.8', default: 7.8, step: '0.1' },
          { key: 'dissolved_oxygen', label: 'Dissolved Oxygen (ppm)', type: 'number', placeholder: '5', default: 5, step: '0.1' },
          { key: 'ammonia', label: 'Ammonia NH3 (ppm)', type: 'number', placeholder: '0.05', default: 0.05, step: '0.01' },
          { key: 'nitrite', label: 'Nitrite NO2 (ppm)', type: 'number', placeholder: '0.01', default: 0.01, step: '0.01' },
          { key: 'temperature', label: 'Temperature (°C)', type: 'number', placeholder: '28', default: 28 },
          { key: 'salinity', label: 'Salinity (ppt)', type: 'number', placeholder: '15', default: 15 },
          { key: 'alkalinity', label: 'Alkalinity (ppm)', type: 'number', placeholder: '120', default: 120 },
          { key: 'transparency_cm', label: 'Transparency (cm)', type: 'number', placeholder: '35', default: 35 },
        ],
        renderResult: (data) => renderWaterQualityResult(data),
      },
      'stocking': {
        title: '📊 Stocking Density Calculator',
        subtitle: 'Optimal count by system type & budget',
        endpoint: '/api/calculators/aqua/stocking',
        fields: [
          { key: 'pond_area_acres', label: 'Pond Area (acres)', type: 'number', placeholder: '1', default: 1 },
          { key: 'species', label: 'Species', type: 'select', options: [['vannamei','Vannamei Shrimp'],['tiger_prawn','Tiger Prawn'],['pangasius','Pangasius'],['tilapia','Tilapia']] },
          { key: 'culture_system', label: 'Culture System', type: 'select', options: [['extensive','Extensive'],['semi-intensive','Semi-Intensive'],['intensive','Intensive'],['super-intensive','Super-Intensive']] },
          { key: 'target_size_g', label: 'Target Size (grams)', type: 'number', placeholder: '30', default: 30 },
          { key: 'available_budget', label: 'Available Budget (₹)', type: 'number', placeholder: '500000', default: 500000 },
        ],
        renderResult: (data) => renderStockingResult(data),
      },
      'harvest-timing': {
        title: '⏱️ Harvest Timing Optimizer',
        subtitle: 'Grow more or harvest now? Data-driven decision.',
        endpoint: '/api/calculators/aqua/harvest-timing',
        fields: [
          { key: 'current_abw_g', label: 'Current ABW (grams)', type: 'number', placeholder: '20', default: 20 },
          { key: 'doc', label: 'Days of Culture', type: 'number', placeholder: '80', default: 80 },
          { key: 'survival_count', label: 'Surviving Count', type: 'number', placeholder: '45000', default: 45000 },
          { key: 'growth_rate_g_per_day', label: 'Growth Rate (g/day)', type: 'number', placeholder: '0.25', default: 0.25, step: '0.01' },
          { key: 'feed_cost_per_day', label: 'Feed Cost/day (₹)', type: 'number', placeholder: '2000', default: 2000 },
          { key: 'current_market_price', label: 'Current Market Price (₹/kg)', type: 'number', placeholder: '280', default: 280 },
          { key: 'expected_price_change_per_week', label: 'Price Change/week (₹)', type: 'number', placeholder: '-5', default: -5 },
        ],
        renderResult: (data) => renderHarvestTimingResult(data),
      },
      'disease-cost': {
        title: '🦠 Disease Outbreak Cost Estimator',
        subtitle: 'Calculate losses & compare action options',
        endpoint: '/api/calculators/aqua/disease-cost',
        fields: [
          { key: 'species', label: 'Species', type: 'select', options: [['vannamei','Vannamei Shrimp'],['tiger_prawn','Tiger Prawn'],['pangasius','Pangasius']] },
          { key: 'disease', label: 'Disease', type: 'select', options: [['white_spot','White Spot (WSSV)'],['EHP','EHP'],['vibriosis','Vibriosis'],['loose_shell','Loose Shell'],['running_mortality','Running Mortality']] },
          { key: 'current_stock', label: 'Current Stock Count', type: 'number', placeholder: '50000', default: 50000 },
          { key: 'current_abw_g', label: 'Current ABW (grams)', type: 'number', placeholder: '15', default: 15 },
          { key: 'doc', label: 'Days of Culture', type: 'number', placeholder: '60', default: 60 },
          { key: 'mortality_percent', label: 'Mortality So Far (%)', type: 'number', placeholder: '20', default: 20 },
        ],
        renderResult: (data) => renderDiseaseResult(data),
      },
      // ─── CROP FORMS ───────────────────────────────
      'season-economics': {
        title: '💹 Season P&L Calculator',
        subtitle: 'Complete season economics with MSP comparison',
        endpoint: '/api/calculators/crop/season-economics',
        fields: [
          { key: 'crop', label: 'Crop', type: 'select', options: [['paddy','Paddy'],['cotton','Cotton'],['maize','Maize'],['groundnut','Groundnut'],['chilli','Chilli'],['tomato','Tomato'],['sugarcane','Sugarcane'],['onion','Onion']] },
          { key: 'season', label: 'Season', type: 'select', options: [['kharif','Kharif'],['rabi','Rabi'],['zaid','Zaid']] },
          { key: 'area_acres', label: 'Area (acres)', type: 'number', placeholder: '5', default: 5 },
          { key: 'irrigation_type', label: 'Irrigation', type: 'select', options: [['canal','Canal'],['borewell','Borewell'],['drip','Drip'],['rainfed','Rainfed']] },
          { key: 'expected_yield_qtl_per_acre', label: 'Expected Yield (qtl/acre)', type: 'number', placeholder: '0 = auto', default: 0 },
          { key: 'selling_price_per_qtl', label: 'Expected Price (₹/qtl)', type: 'number', placeholder: '0 = auto', default: 0 },
        ],
        renderResult: (data) => renderSeasonEconomicsResult(data),
      },
      'fertilizer-dosage': {
        title: '🧪 Fertilizer Dosage Calculator',
        subtitle: 'Split-wise NPK schedule with soil test adjustment',
        endpoint: '/api/calculators/crop/fertilizer-dosage',
        fields: [
          { key: 'crop', label: 'Crop', type: 'select', options: [['paddy','Paddy'],['cotton','Cotton'],['maize','Maize'],['groundnut','Groundnut'],['chilli','Chilli'],['tomato','Tomato'],['sugarcane','Sugarcane'],['onion','Onion']] },
          { key: 'area_acres', label: 'Area (acres)', type: 'number', placeholder: '5', default: 5 },
          { key: 'soil_type', label: 'Soil Type', type: 'select', options: [['black','Black'],['red','Red'],['alluvial','Alluvial'],['sandy','Sandy']] },
          { key: 'soil_test_n', label: 'Soil N (kg/ha, 0=unknown)', type: 'number', placeholder: '0', default: 0 },
          { key: 'soil_test_p', label: 'Soil P (kg/ha, 0=unknown)', type: 'number', placeholder: '0', default: 0 },
          { key: 'soil_test_k', label: 'Soil K (kg/ha, 0=unknown)', type: 'number', placeholder: '0', default: 0 },
          { key: 'organic_carbon_pct', label: 'Organic Carbon (%)', type: 'number', placeholder: '0.5', default: 0.5, step: '0.1' },
        ],
        renderResult: (data) => renderFertilizerResult(data),
      },
      'irrigation-schedule': {
        title: '💧 Irrigation Planner',
        subtitle: 'Daily water need, pump hours, cost estimate',
        endpoint: '/api/calculators/crop/irrigation-schedule',
        fields: [
          { key: 'crop', label: 'Crop', type: 'select', options: [['paddy','Paddy'],['cotton','Cotton'],['maize','Maize'],['groundnut','Groundnut'],['chilli','Chilli'],['tomato','Tomato'],['sugarcane','Sugarcane']] },
          { key: 'area_acres', label: 'Area (acres)', type: 'number', placeholder: '5', default: 5 },
          { key: 'growth_stage', label: 'Growth Stage', type: 'select', options: [['seedling','Seedling'],['vegetative','Vegetative'],['flowering','Flowering'],['grain_filling','Grain Filling'],['maturity','Maturity']] },
          { key: 'irrigation_method', label: 'Irrigation Method', type: 'select', options: [['flood','Flood'],['furrow','Furrow'],['sprinkler','Sprinkler'],['drip','Drip']] },
          { key: 'soil_type', label: 'Soil Type', type: 'select', options: [['black','Black'],['red','Red'],['sandy','Sandy'],['alluvial','Alluvial']] },
          { key: 'current_temp_c', label: 'Temperature (°C)', type: 'number', placeholder: '32', default: 32 },
          { key: 'last_rain_days', label: 'Last Rain (days ago)', type: 'number', placeholder: '5', default: 5 },
        ],
        renderResult: (data) => renderIrrigationResult(data),
      },
      'break-even': {
        title: '📈 Break-Even Analysis',
        subtitle: 'Minimum price/yield needed for profit',
        endpoint: '/api/calculators/crop/break-even',
        fields: [
          { key: 'crop', label: 'Crop', type: 'select', options: [['paddy','Paddy'],['cotton','Cotton'],['maize','Maize'],['groundnut','Groundnut'],['chilli','Chilli'],['tomato','Tomato']] },
          { key: 'area_acres', label: 'Area (acres)', type: 'number', placeholder: '5', default: 5 },
          { key: 'expected_yield_qtl_per_acre', label: 'Expected Yield (qtl/acre)', type: 'number', placeholder: '25', default: 25 },
          { key: 'current_market_price', label: 'Market Price (₹/qtl)', type: 'number', placeholder: '2200', default: 2200 },
          { key: 'total_fixed_cost', label: 'Fixed Costs (₹, 0=auto)', type: 'number', placeholder: '0', default: 0 },
          { key: 'total_variable_cost', label: 'Variable Costs (₹, 0=auto)', type: 'number', placeholder: '0', default: 0 },
        ],
        renderResult: (data) => renderBreakEvenResult(data),
      },
      'spray-schedule': {
        title: '🧫 Spray Schedule',
        subtitle: 'Pest/disease management with organic alternatives',
        endpoint: '/api/calculators/crop/spray-schedule',
        fields: [
          { key: 'crop', label: 'Crop', type: 'select', options: [['paddy','Paddy'],['cotton','Cotton'],['chilli','Chilli']] },
          { key: 'area_acres', label: 'Area (acres)', type: 'number', placeholder: '5', default: 5 },
          { key: 'growth_stage', label: 'Growth Stage', type: 'select', options: [['seedling','Seedling'],['vegetative','Vegetative'],['flowering','Flowering'],['fruit_setting','Fruit Setting']] },
          { key: 'pest_observed', label: 'Pest Observed', type: 'select', options: [['none','None'],['stem_borer','Stem Borer'],['leaf_folder','Leaf Folder'],['bph','BPH'],['aphids','Aphids'],['bollworm','Bollworm'],['fruit_borer','Fruit Borer'],['mites','Mites']] },
          { key: 'disease_observed', label: 'Disease Observed', type: 'select', options: [['none','None'],['blast','Blast'],['blight','Blight'],['wilt','Wilt'],['powdery_mildew','Powdery Mildew']] },
          { key: 'last_spray_days', label: 'Last Spray (days ago)', type: 'number', placeholder: '10', default: 10 },
          { key: 'organic_preference', label: 'Prefer Organic?', type: 'select', options: [['false','No'],['true','Yes']] },
        ],
        renderResult: (data) => renderSprayResult(data),
      },
      'yield-prediction': {
        title: '🌾 Yield Prediction',
        subtitle: 'Expected yield based on your inputs & conditions',
        endpoint: '/api/calculators/crop/yield-prediction',
        fields: [
          { key: 'crop', label: 'Crop', type: 'select', options: [['paddy','Paddy'],['cotton','Cotton'],['maize','Maize'],['groundnut','Groundnut'],['chilli','Chilli'],['tomato','Tomato'],['sugarcane','Sugarcane']] },
          { key: 'area_acres', label: 'Area (acres)', type: 'number', placeholder: '5', default: 5 },
          { key: 'soil_type', label: 'Soil Type', type: 'select', options: [['black','Black'],['red','Red'],['alluvial','Alluvial'],['sandy','Sandy']] },
          { key: 'irrigation_type', label: 'Irrigation', type: 'select', options: [['canal','Canal'],['borewell','Borewell'],['drip','Drip'],['rainfed','Rainfed']] },
          { key: 'fertilizer_applied_pct', label: 'Fertilizer Applied (%)', type: 'number', placeholder: '100', default: 100 },
          { key: 'pest_incidence', label: 'Pest Incidence', type: 'select', options: [['none','None'],['low','Low'],['moderate','Moderate'],['severe','Severe']] },
          { key: 'seed_quality', label: 'Seed Quality', type: 'select', options: [['certified','Certified'],['hybrid','Hybrid'],['farm_saved','Farm Saved']] },
          { key: 'sowing_time', label: 'Sowing Time', type: 'select', options: [['optimal','Optimal'],['early','Early'],['late','Late']] },
        ],
        renderResult: (data) => renderYieldPredictionResult(data),
      },
    };

    const form = forms[activeTool];
    if (!form) return;

    container.innerHTML = `
      <div style="background:linear-gradient(135deg,${activeTab==='aqua'?'#0277BD,#01579B':'#2E7D32,#1B5E20'});color:white;padding:16px;border-radius:0 0 20px 20px">
        <button id="calcBack" style="background:rgba(255,255,255,0.15);border:none;color:white;padding:6px 12px;border-radius:8px;font-size:0.8rem;cursor:pointer;margin-bottom:8px">← Back</button>
        <h2 style="margin:0;font-size:1.2rem;font-weight:800">${form.title}</h2>
        <p style="margin:4px 0 0;opacity:0.85;font-size:0.8rem">${form.subtitle}</p>
      </div>

      <div style="padding:16px" id="calcFormArea">
        <form id="calcForm" style="display:flex;flex-direction:column;gap:12px">
          ${form.fields.map(f => `
            <div>
              <label style="font-size:0.78rem;color:#555;display:block;margin-bottom:4px;font-weight:500">${f.label}</label>
              ${f.type === 'select'
                ? `<select name="${f.key}" style="width:100%;padding:11px;border:1.5px solid #E0E0E0;border-radius:10px;font-size:0.88rem;background:white">${f.options.map(o => `<option value="${o[0]}">${o[1]}</option>`).join('')}</select>`
                : `<input name="${f.key}" type="number" step="${f.step||'any'}" value="${f.default||''}" placeholder="${f.placeholder||''}" style="width:100%;padding:11px;border:1.5px solid #E0E0E0;border-radius:10px;font-size:0.88rem;box-sizing:border-box" />`
              }
            </div>
          `).join('')}
          <button type="submit" id="calcSubmit" style="padding:14px;background:linear-gradient(135deg,${activeTab==='aqua'?'#0277BD,#01579B':'#2E7D32,#1B5E20'});color:white;border:none;border-radius:12px;font-size:1rem;font-weight:700;cursor:pointer;margin-top:6px;box-shadow:0 4px 12px ${activeTab==='aqua'?'rgba(2,119,189,0.3)':'rgba(46,125,50,0.3)'}">
            Calculate
          </button>
        </form>
        <div id="calcResult" style="margin-top:20px"></div>
      </div>
      <div style="height:80px"></div>
    `;

    container.querySelector('#calcBack').addEventListener('click', () => { activeTool = null; render(); });

    container.querySelector('#calcForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const body = {};
      form.fields.forEach(f => {
        const val = fd.get(f.key);
        if (f.type === 'select') {
          body[f.key] = val === 'true' ? true : val === 'false' ? false : val;
        } else {
          body[f.key] = parseFloat(val) || 0;
        }
      });

      const btn = container.querySelector('#calcSubmit');
      btn.textContent = 'Calculating...';
      btn.disabled = true;

      try {
        const res = await api(form.endpoint, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
        const data = await res.json();
        container.querySelector('#calcResult').innerHTML = form.renderResult(data);
      } catch (err) {
        // Fallback: do client-side calculation for offline
        container.querySelector('#calcResult').innerHTML = `<div style="padding:12px;background:#FFF3E0;border-radius:10px;color:#E65100;font-size:0.85rem">⚠️ Offline mode — connect for full analysis. Error: ${err.message || 'Network error'}</div>`;
      } finally {
        btn.textContent = 'Calculate';
        btn.disabled = false;
      }
    });
  }

  // ─── RESULT RENDERERS ─────────────────────────────

  function renderPondEconomicsResult(d) {
    const s = d.summary;
    const c = d.costs_breakdown;
    const u = d.unit_economics;
    return `
      <div style="background:#E3F2FD;border-radius:14px;padding:16px;margin-bottom:12px">
        <div style="text-align:center">
          <div style="font-size:0.75rem;color:#666">Net Profit</div>
          <div style="font-size:2rem;font-weight:800;color:${s.net_profit>=0?'#1B5E20':'#C62828'}">₹${s.net_profit.toLocaleString()}</div>
          <div style="font-size:0.8rem;color:#666">ROI: ${s.roi_percent}% · ₹${s.profit_per_acre.toLocaleString()}/acre</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
        <div style="background:#f9f9f9;padding:10px;border-radius:10px;text-align:center"><div style="font-size:0.7rem;color:#888">Revenue</div><div style="font-weight:700;color:#2E7D32">₹${s.gross_revenue.toLocaleString()}</div></div>
        <div style="background:#f9f9f9;padding:10px;border-radius:10px;text-align:center"><div style="font-size:0.7rem;color:#888">Total Cost</div><div style="font-weight:700;color:#E65100">₹${s.total_cost.toLocaleString()}</div></div>
        <div style="background:#f9f9f9;padding:10px;border-radius:10px;text-align:center"><div style="font-size:0.7rem;color:#888">Harvest</div><div style="font-weight:700">${s.harvest_weight_kg} kg</div></div>
        <div style="background:#f9f9f9;padding:10px;border-radius:10px;text-align:center"><div style="font-size:0.7rem;color:#888">Cost/kg</div><div style="font-weight:700">₹${u.cost_per_kg}</div></div>
      </div>
      <div style="font-size:0.78rem;color:#555;background:#F1F8E9;padding:10px;border-radius:8px">💡 ${d.recommendation}</div>
    `;
  }

  function renderFeedResult(d) {
    const r = d.daily_recommendation;
    return `
      <div style="background:#E0F7FA;border-radius:14px;padding:16px;text-align:center;margin-bottom:12px">
        <div style="font-size:0.75rem;color:#666">Daily Feed</div>
        <div style="font-size:2.2rem;font-weight:800;color:#00838F">${r.total_daily_feed_kg} kg</div>
        <div style="font-size:0.8rem;color:#666">${r.feedings_per_day}x/day · ${r.per_feeding_kg} kg each</div>
      </div>
      <div style="margin-bottom:12px">
        <div style="font-weight:600;font-size:0.85rem;margin-bottom:6px">🕐 Feed Times</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">${r.feed_times.map(t => `<span style="background:#E0F7FA;padding:4px 10px;border-radius:6px;font-size:0.78rem;font-weight:500">${t}</span>`).join('')}</div>
      </div>
      <div style="margin-bottom:12px">
        <div style="font-weight:600;font-size:0.85rem;margin-bottom:6px">📋 Tips</div>
        ${d.tips.map(tip => `<div style="font-size:0.78rem;color:#555;padding:4px 0">• ${tip}</div>`).join('')}
      </div>
      <div style="background:#FFF3E0;padding:10px;border-radius:8px;font-size:0.78rem">📦 Monthly: ${r.monthly_feed_kg} kg · ₹${r.monthly_cost_estimate.toLocaleString()}</div>
    `;
  }

  function renderWaterQualityResult(d) {
    const scoreColor = d.health_score >= 80 ? '#2E7D32' : d.health_score >= 50 ? '#E65100' : '#C62828';
    return `
      <div style="background:${d.health_score>=80?'#E8F5E9':d.health_score>=50?'#FFF3E0':'#FFEBEE'};border-radius:14px;padding:16px;text-align:center;margin-bottom:12px">
        <div style="font-size:0.75rem;color:#666">Pond Health Score</div>
        <div style="font-size:2.5rem;font-weight:800;color:${scoreColor}">${d.health_score}/100</div>
        <div style="font-size:0.85rem;font-weight:600;color:${scoreColor}">${d.overall_status.toUpperCase()}</div>
      </div>
      ${d.alerts.length ? `<div style="background:#FFEBEE;padding:10px;border-radius:10px;margin-bottom:12px">${d.alerts.map(a => `<div style="font-size:0.8rem;color:#C62828;padding:3px 0">⚠️ ${a}</div>`).join('')}</div>` : ''}
      <div style="margin-bottom:12px">
        ${d.parameters.map(p => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0f0">
            <div><span style="font-size:0.82rem;font-weight:500">${p.name}</span></div>
            <div style="text-align:right">
              <span style="font-weight:700;color:${p.status==='normal'?'#2E7D32':p.status==='warning'||p.status==='low'||p.status==='high'?'#E65100':'#C62828'}">${p.value} ${p.unit}</span>
              <span style="font-size:0.7rem;color:#999;margin-left:6px">(${p.optimal})</span>
            </div>
          </div>
        `).join('')}
      </div>
      ${d.actions.length ? `<div style="background:#E3F2FD;padding:10px;border-radius:10px"><div style="font-weight:600;font-size:0.82rem;margin-bottom:6px">🔧 Recommended Actions</div>${d.actions.map(a => `<div style="font-size:0.78rem;color:#333;padding:3px 0">• ${a}</div>`).join('')}</div>` : ''}
      <div style="margin-top:10px;font-size:0.8rem;color:#555;background:#F9FBE7;padding:8px;border-radius:8px">🍽️ Feeding: ${d.feeding_advice}</div>
    `;
  }

  function renderStockingResult(d) {
    const r = d.recommendation;
    const e = d.economics;
    return `
      <div style="background:#E8EAF6;border-radius:14px;padding:16px;text-align:center;margin-bottom:12px">
        <div style="font-size:0.75rem;color:#666">Recommended Stocking</div>
        <div style="font-size:2rem;font-weight:800;color:#283593">${r.total_stocking.toLocaleString()}</div>
        <div style="font-size:0.8rem;color:#666">${r.recommended_density_per_acre.toLocaleString()}/acre · ${r.culture_system}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
        <div style="background:#f9f9f9;padding:10px;border-radius:10px;text-align:center"><div style="font-size:0.7rem;color:#888">Harvest</div><div style="font-weight:700">${d.expected_output.harvest_weight_kg.toLocaleString()} kg</div></div>
        <div style="background:#f9f9f9;padding:10px;border-radius:10px;text-align:center"><div style="font-size:0.7rem;color:#888">Est. Cost</div><div style="font-weight:700">₹${e.total_estimated_cost.toLocaleString()}</div></div>
        <div style="background:#f9f9f9;padding:10px;border-radius:10px;text-align:center"><div style="font-size:0.7rem;color:#888">Aerators</div><div style="font-weight:700">${d.requirements.aerators}</div></div>
        <div style="background:#f9f9f9;padding:10px;border-radius:10px;text-align:center"><div style="font-size:0.7rem;color:#888">Survival</div><div style="font-weight:700">${d.expected_output.survival_rate}%</div></div>
      </div>
      ${!e.budget_feasible ? `<div style="background:#FFEBEE;padding:10px;border-radius:8px;font-size:0.8rem;color:#C62828">⚠️ Budget insufficient. Adjusted to ${e.budget_adjusted_stock.toLocaleString()} pieces within ₹${e.available_budget.toLocaleString()}</div>` : `<div style="background:#E8F5E9;padding:10px;border-radius:8px;font-size:0.8rem;color:#2E7D32">✓ Budget feasible (₹${e.available_budget.toLocaleString()} available)</div>`}
    `;
  }

  function renderHarvestTimingResult(d) {
    return `
      <div style="background:#F1F8E9;border-radius:14px;padding:16px;text-align:center;margin-bottom:12px">
        <div style="font-size:0.75rem;color:#666">Best Option</div>
        <div style="font-size:1.4rem;font-weight:800;color:${d.best_option.recommendation==='HARVEST NOW'?'#E65100':'#2E7D32'}">${d.best_option.recommendation}</div>
        <div style="font-size:0.8rem;color:#555;margin-top:4px">${d.best_option.reason}</div>
      </div>
      <div style="font-weight:600;font-size:0.85rem;margin-bottom:8px">📊 Size Scenarios</div>
      ${d.scenarios.map(s => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:${s.recommendation==='GROW'?'#F1F8E9':'#FFF3E0'};border-radius:10px;margin-bottom:6px">
          <div>
            <div style="font-weight:700;font-size:0.88rem">${s.target_size_g}g</div>
            <div style="font-size:0.72rem;color:#666">${s.days_remaining} more days · DOC ${s.harvest_doc}</div>
          </div>
          <div style="text-align:right">
            <div style="font-weight:700;color:${s.marginal_profit>=0?'#2E7D32':'#C62828'}">₹${s.marginal_profit.toLocaleString()}</div>
            <div style="font-size:0.72rem;color:#888">${s.recommendation}</div>
          </div>
        </div>
      `).join('')}
    `;
  }

  function renderDiseaseResult(d) {
    const imp = d.impact;
    return `
      <div style="background:#FFEBEE;border-radius:14px;padding:16px;text-align:center;margin-bottom:12px">
        <div style="font-size:0.75rem;color:#666">Total Economic Loss</div>
        <div style="font-size:1.8rem;font-weight:800;color:#C62828">₹${imp.total_economic_loss.toLocaleString()}</div>
        <div style="font-size:0.8rem;color:#666">${d.disease.name} · Severity: ${d.disease.severity}</div>
      </div>
      <div style="font-weight:600;font-size:0.85rem;margin-bottom:8px">🔧 Action Options</div>
      ${d.options.map(o => `
        <div style="background:white;border:1px solid #e0e0e0;border-radius:12px;padding:12px;margin-bottom:8px">
          <div style="font-weight:700;font-size:0.88rem;color:#333">${o.action}</div>
          <div style="font-size:0.76rem;color:#666;margin-top:4px">${o.suitable_when}</div>
          ${o.expected_revenue ? `<div style="font-size:0.8rem;margin-top:4px;color:#2E7D32">Revenue: ₹${o.expected_revenue.toLocaleString()}</div>` : ''}
        </div>
      `).join('')}
    `;
  }

  function renderSeasonEconomicsResult(d) {
    const s = d.summary;
    return `
      <div style="background:${s.net_profit>=0?'#E8F5E9':'#FFEBEE'};border-radius:14px;padding:16px;text-align:center;margin-bottom:12px">
        <div style="font-size:0.75rem;color:#666">Net Profit (${s.crop} · ${s.area_acres} acres)</div>
        <div style="font-size:2rem;font-weight:800;color:${s.net_profit>=0?'#1B5E20':'#C62828'}">₹${s.net_profit.toLocaleString()}</div>
        <div style="font-size:0.8rem;color:#666">₹${s.profit_per_acre.toLocaleString()}/acre · ROI ${s.roi_percent}%</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
        <div style="background:#f9f9f9;padding:10px;border-radius:10px;text-align:center"><div style="font-size:0.7rem;color:#888">Revenue</div><div style="font-weight:700;color:#2E7D32">₹${s.gross_revenue.toLocaleString()}</div></div>
        <div style="background:#f9f9f9;padding:10px;border-radius:10px;text-align:center"><div style="font-size:0.7rem;color:#888">Cost</div><div style="font-weight:700;color:#E65100">₹${s.total_cost.toLocaleString()}</div></div>
        <div style="background:#f9f9f9;padding:10px;border-radius:10px;text-align:center"><div style="font-size:0.7rem;color:#888">Yield</div><div style="font-weight:700">${s.total_yield_qtl} qtl</div></div>
        <div style="background:#f9f9f9;padding:10px;border-radius:10px;text-align:center"><div style="font-size:0.7rem;color:#888">Breakeven</div><div style="font-weight:700">₹${d.unit_economics.breakeven_price}/qtl</div></div>
      </div>
      ${d.msp_comparison ? `<div style="background:#E3F2FD;padding:10px;border-radius:8px;font-size:0.8rem;margin-bottom:10px">🏛️ MSP: ₹${d.msp_comparison.msp_price}/qtl · ${d.msp_comparison.market_vs_msp}</div>` : ''}
      <div style="background:#FFF8E1;padding:10px;border-radius:8px;font-size:0.78rem">📊 Risk: ${d.risk_analysis.price_risk}. Weather: ${d.risk_analysis.weather_risk}</div>
    `;
  }

  function renderFertilizerResult(d) {
    return `
      <div style="background:#FFF3E0;border-radius:14px;padding:16px;margin-bottom:12px">
        <div style="text-align:center;margin-bottom:12px"><span style="font-size:0.8rem;color:#666">Total Fertilizer Cost Estimate</span><br><span style="font-size:1.6rem;font-weight:800;color:#E65100">₹${d.estimated_cost.toLocaleString()}</span></div>
        <div style="display:flex;justify-content:center;gap:16px">
          <div style="text-align:center"><div style="font-weight:700;font-size:1.1rem">${d.fertilizer_quantity.urea_kg} kg</div><div style="font-size:0.72rem;color:#666">Urea</div></div>
          <div style="text-align:center"><div style="font-weight:700;font-size:1.1rem">${d.fertilizer_quantity.dap_kg} kg</div><div style="font-size:0.72rem;color:#666">DAP</div></div>
          <div style="text-align:center"><div style="font-weight:700;font-size:1.1rem">${d.fertilizer_quantity.mop_kg} kg</div><div style="font-size:0.72rem;color:#666">MOP</div></div>
        </div>
      </div>
      <div style="font-weight:600;font-size:0.85rem;margin-bottom:8px">📅 Application Schedule</div>
      ${d.application_schedule.map(s => `
        <div style="display:flex;justify-content:space-between;background:#f9f9f9;padding:10px;border-radius:8px;margin-bottom:6px">
          <div style="font-weight:600;font-size:0.82rem">${s.stage}</div>
          <div style="font-size:0.78rem;color:#555">U:${s.urea_kg}kg · D:${s.dap_kg}kg · M:${s.mop_kg}kg</div>
        </div>
      `).join('')}
      <div style="background:#F1F8E9;padding:10px;border-radius:8px;margin-top:10px;font-size:0.78rem">🌱 ${d.organic_recommendation}</div>
    `;
  }

  function renderIrrigationResult(d) {
    const r = d.requirement;
    const s = d.schedule;
    return `
      <div style="background:${s.needs_irrigation_now?'#FFEBEE':'#E8F5E9'};border-radius:14px;padding:16px;text-align:center;margin-bottom:12px">
        <div style="font-size:1.4rem;font-weight:800;color:${s.needs_irrigation_now?'#C62828':'#2E7D32'}">${s.needs_irrigation_now ? '💧 Irrigate Today!' : '✓ No Irrigation Needed'}</div>
        <div style="font-size:0.8rem;color:#666;margin-top:4px">${s.reason}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
        <div style="background:#f9f9f9;padding:10px;border-radius:10px;text-align:center"><div style="font-size:0.7rem;color:#888">Daily Need</div><div style="font-weight:700">${r.total_daily_litres.toLocaleString()} L</div></div>
        <div style="background:#f9f9f9;padding:10px;border-radius:10px;text-align:center"><div style="font-size:0.7rem;color:#888">Pump Hours</div><div style="font-weight:700">${r.pump_hours_5hp} hrs</div></div>
        <div style="background:#f9f9f9;padding:10px;border-radius:10px;text-align:center"><div style="font-size:0.7rem;color:#888">Interval</div><div style="font-weight:700">Every ${s.irrigation_interval_days} days</div></div>
        <div style="background:#f9f9f9;padding:10px;border-radius:10px;text-align:center"><div style="font-size:0.7rem;color:#888">Monthly Cost</div><div style="font-weight:700">₹${d.monthly_estimate.electricity_cost.toLocaleString()}</div></div>
      </div>
      ${d.tips.length ? `<div style="background:#FFF8E1;padding:10px;border-radius:8px;font-size:0.78rem">${d.tips.map(t => `• ${t}`).join('<br>')}</div>` : ''}
    `;
  }

  function renderBreakEvenResult(d) {
    const b = d.breakeven;
    const p = d.profitability;
    return `
      <div style="background:${p.status==='PROFITABLE'?'#E8F5E9':'#FFEBEE'};border-radius:14px;padding:16px;text-align:center;margin-bottom:12px">
        <div style="font-size:0.75rem;color:#666">Status</div>
        <div style="font-size:1.6rem;font-weight:800;color:${p.status==='PROFITABLE'?'#2E7D32':'#C62828'}">${p.status}</div>
        <div style="font-size:0.85rem">Net: ₹${p.net_profit.toLocaleString()} · Safety Margin: ${p.margin_of_safety_price_pct}%</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
        <div style="background:#FFF3E0;padding:12px;border-radius:10px;text-align:center"><div style="font-size:0.7rem;color:#888">Breakeven Price</div><div style="font-weight:800;font-size:1.1rem;color:#E65100">₹${b.breakeven_price_per_qtl}/qtl</div></div>
        <div style="background:#E3F2FD;padding:12px;border-radius:10px;text-align:center"><div style="font-size:0.7rem;color:#888">Breakeven Yield</div><div style="font-weight:800;font-size:1.1rem;color:#1565C0">${b.breakeven_yield_qtl} qtl</div></div>
      </div>
      <div style="font-weight:600;font-size:0.85rem;margin-bottom:8px">📊 Scenarios</div>
      ${d.scenarios.map(s => `
        <div style="display:flex;justify-content:space-between;padding:8px;background:${s.profit>=0?'#F1F8E9':'#FFEBEE'};border-radius:8px;margin-bottom:4px;font-size:0.78rem">
          <span>${s.label}</span>
          <span style="font-weight:700;color:${s.profit>=0?'#2E7D32':'#C62828'}">${s.status}</span>
        </div>
      `).join('')}
      <div style="background:#F5F5F5;padding:10px;border-radius:8px;margin-top:10px;font-size:0.78rem">💡 ${d.advice}</div>
    `;
  }

  function renderSprayResult(d) {
    const r = d.recommendation;
    return `
      <div style="background:${r.type==='CURATIVE'?'#FFEBEE':'#E8F5E9'};border-radius:14px;padding:16px;margin-bottom:12px">
        <div style="font-size:0.75rem;color:#666">${r.type} Recommendation</div>
        <div style="font-size:1rem;font-weight:700;color:#333;margin-top:4px">${r.spray || r.target}</div>
        ${r.dose_per_acre ? `<div style="font-size:0.82rem;color:#555;margin-top:4px">Dose: ${r.dose_per_acre}</div>` : ''}
        <div style="font-size:0.8rem;color:#E65100;margin-top:4px;font-weight:600">⏰ ${r.urgency}</div>
      </div>
      ${d.organic_alternative ? `
        <div style="background:#F1F8E9;padding:12px;border-radius:10px;margin-bottom:12px">
          <div style="font-weight:600;font-size:0.82rem;color:#2E7D32">🌿 Organic Alternative</div>
          <div style="font-size:0.78rem;color:#333;margin-top:4px">${d.organic_alternative.suggestion}</div>
        </div>
      ` : ''}
      <div style="font-weight:600;font-size:0.85rem;margin-bottom:8px">⚠️ Safety</div>
      <div style="font-size:0.76rem;color:#555">${d.safety_precautions.map(p => `• ${p}`).join('<br>')}</div>
    `;
  }

  function renderYieldPredictionResult(d) {
    const p = d.prediction;
    return `
      <div style="background:#F1F8E9;border-radius:14px;padding:16px;text-align:center;margin-bottom:12px">
        <div style="font-size:0.75rem;color:#666">Predicted Yield</div>
        <div style="font-size:2rem;font-weight:800;color:#33691E">${p.total_yield_qtl} quintals</div>
        <div style="font-size:0.8rem;color:#666">${p.yield_per_acre} qtl/acre · ${p.achieved_pct}% of potential</div>
        <div style="font-size:0.75rem;color:#888;margin-top:4px">Range: ${p.confidence_range.low}–${p.confidence_range.high} qtl</div>
      </div>
      <div style="background:#E3F2FD;padding:10px;border-radius:10px;margin-bottom:12px;text-align:center">
        <div style="font-size:0.75rem;color:#666">Revenue Estimate</div>
        <div style="font-size:1.3rem;font-weight:700;color:#1565C0">₹${d.revenue_estimate.estimated_revenue.toLocaleString()}</div>
      </div>
      ${d.limiting_factors.length ? `
        <div style="font-weight:600;font-size:0.85rem;margin-bottom:8px">⚠️ Limiting Factors</div>
        ${d.improvement_suggestions.map(s => `<div style="font-size:0.78rem;color:#555;padding:3px 0;background:#FFF8E1;border-radius:6px;padding:6px 10px;margin-bottom:4px">💡 ${s}</div>`).join('')}
      ` : '<div style="background:#E8F5E9;padding:10px;border-radius:8px;font-size:0.82rem;color:#2E7D32">✓ All factors optimal!</div>'}
    `;
  }

  render();
}
