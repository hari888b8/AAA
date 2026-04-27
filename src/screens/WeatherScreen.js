import { api } from '../api.js';
import { showToast, showModal, closeModal } from '../app-shell.js';
import { t } from '../i18n.js';

export function renderWeather(container) {
  let forecast = null, advisories = [], cropHealth = [], marketOutlook = {}, districts = [];
  let loading = true, selectedDistrict = '';
  let tab = 'forecast';

  // Price Watchlist state
  const WATCHLIST = [
    { id:'w1', crop:'Paddy (Sona Masoori)', market:'Guntur', current:2180, target:2400, unit:'Qtl', alert:'above', icon:'🌾' },
    { id:'w2', crop:'Cotton (DCH-32)', market:'Adilabad', current:6850, target:6500, unit:'Qtl', alert:'below', icon:'🪴' },
    { id:'w3', crop:'Tomato', market:'Madanapalle', current:1420, target:2000, unit:'Qtl', alert:'above', icon:'🍅' },
    { id:'w4', crop:'Chilli (Teja)', market:'Khammam', current:14500, target:16000, unit:'Qtl', alert:'above', icon:'🌶️' },
  ];

  const SAMPLE_FORECAST = {
    location: { district: 'Guntur, AP' },
    current: { temperature: 34, condition: 'Partly Cloudy', humidity: 62, wind_kmh: 14, rain_chance_pct: 25 },
    forecast: [
      { date:'2026-04-27', temp_max:34, temp_min:24, condition:'partly_cloudy', rain_chance:25, humidity:62 },
      { date:'2026-04-28', temp_max:35, temp_min:25, condition:'sunny', rain_chance:10, humidity:55 },
      { date:'2026-04-29', temp_max:33, temp_min:24, condition:'cloudy', rain_chance:45, humidity:70 },
      { date:'2026-04-30', temp_max:30, temp_min:23, condition:'rain', rain_chance:80, humidity:85 },
      { date:'2026-05-01', temp_max:31, temp_min:23, condition:'rain', rain_chance:65, humidity:80 },
      { date:'2026-05-02', temp_max:33, temp_min:24, condition:'partly_cloudy', rain_chance:30, humidity:65 },
      { date:'2026-05-03', temp_max:35, temp_min:25, condition:'sunny', rain_chance:10, humidity:55 },
    ]
  };
  const SAMPLE_ADVISORIES = [
    { title:'Heavy rain expected Apr 30 - May 1', description:'Delay pesticide spraying. Ensure drainage channels are clear. Harvest mature paddy immediately.', severity:'high', crop_name:'Paddy' },
    { title:'Rising temperatures - irrigate evening only', description:'Temperatures reaching 35°C+. Avoid mid-day irrigation. Mulch around vegetable crops.', severity:'medium', crop_name:'Vegetables' },
    { title:'Thrips alert in chilli crops', description:'Yellow sticky traps showing high thrips counts in Guntur region. Apply Spinosad at 0.3ml/L if crossing ETL.', severity:'medium', crop_name:'Chilli' },
  ];
  const SAMPLE_CROP_HEALTH = [
    { crop_name:'Paddy (BPT 5204)', district_name:'Guntur', health_score:85, ndvi:0.72, growth_stage:'Heading', soil_moisture:68, risk_level:'Low', recommendation:'Good health. Continue current water management.' },
    { crop_name:'Cotton', district_name:'Adilabad', health_score:62, ndvi:0.55, growth_stage:'Boll Opening', soil_moisture:42, risk_level:'Medium', recommendation:'Stress detected. Increase irrigation frequency.' },
    { crop_name:'Groundnut', district_name:'Kurnool', health_score:78, ndvi:0.65, growth_stage:'Pegging', soil_moisture:55, risk_level:'Low', recommendation:'On track. Apply gypsum for better pod filling.' },
    { crop_name:'Tomato', district_name:'Madanapalle', health_score:45, ndvi:0.38, growth_stage:'Fruiting', soil_moisture:35, risk_level:'High', recommendation:'Severe water stress. Immediate drip irrigation needed.' },
  ];
  const SAMPLE_MARKET_OUTLOOK = {
    summary: 'Pre-monsoon arrivals declining. Paddy and cotton prices expected to firm up through May. Groundnut demand strong from oil mills.',
    trends: [
      { crop_name:'Paddy BPT 5204', current_price:2180, forecast_price:2350, trend:'up', change_pct:7.8 },
      { crop_name:'Cotton Long Staple', current_price:6850, forecast_price:7100, trend:'up', change_pct:3.6 },
      { crop_name:'Tomato', current_price:1420, forecast_price:1100, trend:'down', change_pct:-22.5 },
      { crop_name:'Groundnut Bold', current_price:5650, forecast_price:5900, trend:'up', change_pct:4.4 },
    ],
    recommendations: [
      { title:'Hold Paddy stocks', message:'Prices rising due to low market arrivals. Expected to peak mid-May.' },
      { title:'Sell Tomato quickly', message:'Arrivals increasing from Karnataka. Prices likely to fall 20% in next 2 weeks.' },
      { title:'Groundnut processors buying aggressively', message:'Oil mill demand strong. Good time to sell if moisture below 8%.' },
    ]
  };

  function render() {
    container.innerHTML = loading ? '<div class="loading"><div class="spinner"></div></div>' : `
      <div class="hero-v2" style="background:linear-gradient(135deg,#2196F3 0%,#00BCD4 100%);color:#fff" role="banner">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="hero-avatar" aria-hidden="true">🌤️</div>
          <div style="flex:1">
            <h1 style="font-weight:800;font-size:18px;margin:0;color:white">Weather & Crop Health</h1>
            <div style="font-size:11px;opacity:0.85;color:white">IMD + Satellite · District Intelligence</div>
          </div>
        </div>
      </div>
      <div class="sticky-search" role="search">
        <input class="search-input-v2" id="weatherSearch" type="search" placeholder="Search district or crop…" aria-label="Search weather" autocomplete="off" enterkeyhint="search">
      </div>
      <div style="padding:4px 16px 8px">
        <select class="form-input" id="districtSelect" aria-label="Select district" style="margin-bottom:4px">
          <option value="">All Districts</option>
          ${districts.map(d => `<option value="${d.id}" ${selectedDistrict == d.id ? 'selected' : ''}>${d.name}</option>`).join('')}
        </select>
      </div>
      <div class="tab-bar" role="tablist">
        <button role="tab" aria-selected="${tab === 'forecast'}" class="tab-btn ${tab === 'forecast' ? 'active' : ''}" data-tab="forecast">🌤️ Forecast</button>
        <button role="tab" aria-selected="${tab === 'crop'}" class="tab-btn ${tab === 'crop' ? 'active' : ''}" data-tab="crop">🌱 Crop Health</button>
        <button role="tab" aria-selected="${tab === 'advisory'}" class="tab-btn ${tab === 'advisory' ? 'active' : ''}" data-tab="advisory">🧑‍🌾 Advisory</button>
        <button role="tab" aria-selected="${tab === 'market'}" class="tab-btn ${tab === 'market' ? 'active' : ''}" data-tab="market">📊 Market</button>
        <button role="tab" aria-selected="${tab === 'watchlist'}" class="tab-btn ${tab === 'watchlist' ? 'active' : ''}" data-tab="watchlist">🔔 Watchlist</button>
      </div>
      ${tab === 'forecast' ? renderForecast() : tab === 'crop' ? renderCropHealth() : tab === 'advisory' ? renderCropAdvisory() : tab === 'watchlist' ? renderWatchlist() : renderMarketOutlook()}
    `;
    container.querySelector('#districtSelect')?.addEventListener('change', e => {
      selectedDistrict = e.target.value;
      loadData();
    });
    container.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; render(); }));
    container.querySelector('#addWatchBtn')?.addEventListener('click', showAddWatch);
    container.querySelector('#addWatchBtn2')?.addEventListener('click', showAddWatch);
    container.querySelectorAll('.del-watch-btn').forEach(b => b.addEventListener('click', () => {
      const idx = WATCHLIST.findIndex(w => w.id === b.dataset.wid);
      if (idx > -1) WATCHLIST.splice(idx, 1);
      render();
    }));
  }

  function renderForecast() {
    const curr = forecast?.current || forecast || {};
    const daily = forecast?.forecast || forecast?.daily || [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const icons = { clear: '☀️', sunny: '☀️', cloudy: '☁️', partly_cloudy: '⛅', rain: '🌧️', heavy_rain: '🌧️', thunderstorm: '⛈️', hot: '🌡️', mild: '🌤️' };

    return `
      <div class="weather-card" style="margin:16px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div class="wc-temp">${curr.temp_max || curr.temperature || curr.temp || 28}°C</div>
            <div class="wc-desc">${curr.condition || curr.description || 'Partly Cloudy'}</div>
            <div class="wc-loc">📍 ${forecast?.location?.district || forecast?.location || curr.location || 'Your District'}</div>
          </div>
          <span style="font-size:48px">${icons[curr.condition?.toLowerCase()] || '🌤️'}</span>
        </div>
        <div class="wc-details">
          <span class="wc-detail">💧 ${curr.humidity || 65}%</span>
          <span class="wc-detail">💨 ${curr.wind_kmh || curr.wind_speed || curr.wind || 12} km/h</span>
          <span class="wc-detail">🌧️ ${curr.rain_chance_pct || curr.rain_chance || 20}%</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">📅 7-Day Forecast</div>
        ${daily.length === 0 ? '<div class="text-sm text-muted">No forecast data available</div>' :
          daily.slice(0, 7).map((d, i) => {
            const date = d.date ? new Date(d.date) : new Date(Date.now() + i * 86400000);
            return `<div class="forecast-card">
              <span class="fc-day">${days[date.getDay()]}</span>
              <span class="fc-icon">${icons[d.condition?.toLowerCase()] || '🌤️'}</span>
              <span class="fc-temp">${d.temp_max || d.temperature || 28}° / ${d.temp_min || (d.temperature ? d.temperature - 5 : 22)}°</span>
              <span class="fc-rain">💧 ${d.rain_chance || d.humidity || 0}%</span>
            </div>`;
          }).join('')}
      </div>

      <div class="section">
        <div class="section-title">🌾 Crop Advisories</div>
        ${advisories.length === 0 ? '<div class="text-sm text-muted">No advisories at this time</div>' :
          advisories.map(a => `
            <div class="advisory-card ${(a.severity || a.priority || 'medium').toLowerCase()}">
              <div class="a-title">${a.title || a.advisory || ''}</div>
              <div class="a-desc">${a.description || a.message || ''}</div>
              ${a.crop_name ? `<span class="tag tag-green mt-sm">${a.crop_name}</span>` : ''}
            </div>
          `).join('')}
      </div>
    `;
  }

  function renderCropHealth() {
    return `<div class="section" style="padding-top:8px">
      <div class="section-title">🌱 Crop Health Monitoring</div>
      ${cropHealth.length === 0 ? `
        <div class="empty-state"><div class="es-icon">🌱</div><div class="es-title">No crop health data</div><div class="es-text">Select a district or check back later</div></div>
      ` : cropHealth.map(c => {
        const healthColor = (c.health_score || 0) >= 80 ? 'green' : (c.health_score || 0) >= 50 ? 'orange' : 'red';
        return `
          <div class="card" style="margin-bottom:8px">
            <div class="flex-between">
              <div class="fw-700">🌾 ${c.crop_name || c.crop || 'Unknown'}</div>
              <span class="tag tag-${healthColor}">Health: ${c.health_score || 0}%</span>
            </div>
            ${c.district_name ? `<div class="text-sm text-muted mt-sm">📍 ${c.district_name}</div>` : ''}
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
              <div class="text-sm"><span class="text-muted">NDVI:</span> ${c.ndvi || 'N/A'}</div>
              <div class="text-sm"><span class="text-muted">Stage:</span> ${c.growth_stage || 'N/A'}</div>
              <div class="text-sm"><span class="text-muted">Moisture:</span> ${c.soil_moisture || 'N/A'}%</div>
              <div class="text-sm"><span class="text-muted">Risk:</span> ${c.risk_level || 'Low'}</div>
            </div>
            ${c.recommendation ? `<div class="text-sm mt-sm" style="padding:8px;background:var(--accent-light);border-radius:6px">💡 ${c.recommendation}</div>` : ''}
          </div>
        `;
      }).join('')}
      <div class="card" style="padding:16px;margin-bottom:12px;background:var(--info-bg);border:1px solid var(--info)">
        <div class="fw-600 text-sm">🛰️ Satellite Monitoring</div>
        <div class="text-sm text-muted" style="margin-top:4px">Crop health is monitored using NDVI from satellite imagery, soil moisture sensors, and weather correlation analysis.</div>
      </div>
    </div>`;
  }

  function renderCropAdvisory() {
    const curr = forecast?.current || {};
    const temp = curr.temperature || curr.temp || 30;
    const rain = curr.rain_chance_pct || curr.rain_chance || 20;
    const humidity = curr.humidity || 65;
    const month = new Date().getMonth() + 1; // 1-12

    // Season detection
    const isMonsoon = month >= 6 && month <= 9;
    const isRabi = month >= 10 || month <= 2;
    const isKharif = month >= 3 && month <= 5;
    const season = isMonsoon ? 'Kharif (Monsoon)' : isRabi ? 'Rabi (Winter)' : 'Zaid (Summer)';

    // Crop recommendations based on conditions
    const CROP_ADVISORY = [
      {
        crop: 'Paddy (BPT 5204)', icon: '🌾', season: 'kharif',
        ideal_temp: [22, 35], ideal_rain: [70, 100], ideal_humidity: [60, 85],
        suitable: isMonsoon && temp >= 22 && temp <= 35,
        tips: 'Transplant 21-25 day old seedlings. Maintain 2-5cm water depth. Apply basal fertilizer before transplanting.'
      },
      {
        crop: 'Wheat', icon: '🌿', season: 'rabi',
        ideal_temp: [15, 25], ideal_rain: [20, 40], ideal_humidity: [40, 65],
        suitable: isRabi && temp >= 15 && temp <= 25,
        tips: 'Sow after October 15. Apply irrigation at crown root initiation stage. Recommended dose: 120-60-40 kg NPK/ha.'
      },
      {
        crop: 'Cotton', icon: '☁️', season: 'kharif',
        ideal_temp: [25, 38], ideal_rain: [30, 60], ideal_humidity: [40, 75],
        suitable: (isMonsoon || isKharif) && temp >= 25 && temp <= 38,
        tips: 'Sow May–July depending on rains. Deep drilled rows 90-120cm apart. Watch for bollworm after 30 DAS.'
      },
      {
        crop: 'Groundnut', icon: '🥜', season: 'kharif/rabi',
        ideal_temp: [25, 32], ideal_rain: [40, 60], ideal_humidity: [50, 75],
        suitable: temp >= 25 && temp <= 32,
        tips: 'Pod-bearing requires calcium. Apply gypsum at pegging. Avoid water-logging during last 30 days.'
      },
      {
        crop: 'Tomato', icon: '🍅', season: 'all',
        ideal_temp: [20, 30], ideal_rain: [20, 40], ideal_humidity: [55, 75],
        suitable: temp >= 20 && temp <= 30 && humidity >= 55,
        tips: 'High-value crop needing consistent moisture. Stake plants at 30 DAS. Watch for early blight in humid weather.'
      },
      {
        crop: 'Maize', icon: '🌽', season: 'kharif/rabi',
        ideal_temp: [21, 33], ideal_rain: [40, 70], ideal_humidity: [50, 80],
        suitable: temp >= 21 && temp <= 33,
        tips: 'Apply top dressing urea at knee-high stage. Maintain 60-75cm row spacing for mechanized harvest.'
      },
      {
        crop: 'Onion', icon: '🧅', season: 'rabi',
        ideal_temp: [13, 24], ideal_rain: [20, 30], ideal_humidity: [40, 65],
        suitable: isRabi && temp >= 13 && temp <= 24,
        tips: 'Stop irrigation 10 days before harvest for better storability. Harvest when tops fall over naturally.'
      },
      {
        crop: 'Chilli', icon: '🌶️', season: 'rabi',
        ideal_temp: [20, 30], ideal_rain: [25, 45], ideal_humidity: [50, 70],
        suitable: (isRabi || isKharif) && temp >= 20 && temp <= 30,
        tips: 'Thrips-sensitive. Install yellow sticky traps. Avoid over-irrigation which causes root rot.'
      },
    ];

    const suitableCrops = CROP_ADVISORY.filter(c => c.suitable);
    const partialCrops = CROP_ADVISORY.filter(c => !c.suitable);

    return `<div class="section" style="padding-top:8px">
      <!-- Current conditions summary -->
      <div style="background:linear-gradient(135deg,#1B5E20,#2E7D32);border-radius:12px;padding:14px;margin-bottom:14px;color:white">
        <div style="font-weight:700;font-size:14px;margin-bottom:8px">🧑‍🌾 Weather-Crop Advisory Engine</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">
          <div style="text-align:center;background:rgba(255,255,255,0.15);border-radius:8px;padding:8px">
            <div style="font-size:18px;font-weight:800">${temp}°C</div>
            <div style="font-size:10px;opacity:0.8">Temperature</div>
          </div>
          <div style="text-align:center;background:rgba(255,255,255,0.15);border-radius:8px;padding:8px">
            <div style="font-size:18px;font-weight:800">${humidity}%</div>
            <div style="font-size:10px;opacity:0.8">Humidity</div>
          </div>
          <div style="text-align:center;background:rgba(255,255,255,0.15);border-radius:8px;padding:8px">
            <div style="font-size:18px;font-weight:800">${rain}%</div>
            <div style="font-size:10px;opacity:0.8">Rain Chance</div>
          </div>
        </div>
        <div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:8px;font-size:12px">
          <strong>🗓️ Current Season:</strong> ${season} · Month: ${new Date().toLocaleString('default',{month:'long'})}
        </div>
      </div>

      <!-- Recommended crops -->
      <div style="font-weight:700;color:#2E7D32;font-size:14px;margin-bottom:8px">✅ Ideal to Plant Now (${suitableCrops.length})</div>
      ${suitableCrops.length === 0 ? `
        <div style="background:#F5F5F5;border-radius:10px;padding:14px;text-align:center;margin-bottom:12px">
          <div style="font-size:11px;color:#757575">No optimal crops for current conditions. Check back as conditions change.</div>
        </div>
      ` : suitableCrops.map(c => `
        <div style="background:white;border-radius:12px;margin-bottom:8px;box-shadow:0 2px 6px rgba(0,0,0,0.07);overflow:hidden">
          <div style="height:3px;background:#2E7D32"></div>
          <div style="padding:12px 14px">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
              <span style="font-size:28px">${c.icon}</span>
              <div>
                <div style="font-weight:700;font-size:14px">${c.crop}</div>
                <div style="font-size:11px;color:#2E7D32;font-weight:600">✅ Conditions favourable</div>
              </div>
              <span style="margin-left:auto;background:#E8F5E9;color:#2E7D32;padding:3px 8px;border-radius:8px;font-size:10px;font-weight:700">PLANT NOW</span>
            </div>
            <div style="background:#F1F8E9;border-radius:8px;padding:8px;font-size:11px;color:#33691E;line-height:1.6">
              💡 ${c.tips}
            </div>
            <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
              <span style="background:#F5F5F5;padding:3px 8px;border-radius:8px;font-size:10px">Ideal Temp: ${c.ideal_temp[0]}–${c.ideal_temp[1]}°C</span>
              <span style="background:#F5F5F5;padding:3px 8px;border-radius:8px;font-size:10px">Rain Need: ${c.ideal_rain[0]}–${c.ideal_rain[1]}mm</span>
              <span style="background:#F5F5F5;padding:3px 8px;border-radius:8px;font-size:10px">Season: ${c.season}</span>
            </div>
          </div>
        </div>
      `).join('')}

      <!-- Other crops (sub-optimal) -->
      <div style="font-weight:700;color:#757575;font-size:13px;margin:12px 0 8px">⚠️ Possible with irrigation (${partialCrops.length})</div>
      ${partialCrops.map(c => `
        <div style="background:white;border-radius:12px;margin-bottom:6px;padding:10px 14px;box-shadow:0 1px 4px rgba(0,0,0,0.05)">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:20px">${c.icon}</span>
            <div style="flex:1">
              <div style="font-weight:600;font-size:12px">${c.crop}</div>
              <div style="font-size:10px;color:#E65100">⚠️ Conditions not ideal — requires extra irrigation/protection</div>
            </div>
            <span style="font-size:10px;background:#FFF3E0;color:#E65100;padding:2px 8px;border-radius:8px">Marginal</span>
          </div>
        </div>
      `).join('')}
    </div>`;
  }

  function renderWatchlist() {
    return `<div class="section" style="padding-top:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div>
          <div class="section-title" style="margin-bottom:2px">🔔 Price Alert Watchlist</div>
          <div style="font-size:11px;color:var(--text3,#9E9E9E)">Get alerted when market price reaches your target</div>
        </div>
        <button id="addWatchBtn" style="background:#1565C0;color:white;border:none;border-radius:8px;padding:6px 12px;font-size:11px;font-weight:700;cursor:pointer">+ Add Alert</button>
      </div>
      ${WATCHLIST.map(w => {
        const triggered = w.alert === 'above' ? w.current >= w.target : w.current <= w.target;
        const pct = Math.round(Math.abs(w.current - w.target) / w.target * 100);
        return `<div style="background:${triggered?'#E8F5E9':'var(--card,white)'};border-radius:12px;padding:12px 14px;margin-bottom:10px;box-shadow:0 1px 4px rgba(0,0,0,0.07);border-left:4px solid ${triggered?'#2E7D32':'#90CAF9'}">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <div style="font-weight:700;font-size:13px">${w.icon} ${w.crop}</div>
            ${triggered?`<span style="background:#2E7D32;color:white;border-radius:10px;padding:2px 8px;font-size:10px;font-weight:700">🔔 Alert Triggered!</span>`:`<span style="background:#E3F2FD;color:#1565C0;border-radius:10px;padding:2px 8px;font-size:10px;font-weight:600">${pct}% away</span>`}
          </div>
          <div style="font-size:11px;color:var(--text3,#757575);margin-bottom:8px">📍 ${w.market} APMC</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;text-align:center">
            <div style="background:#F5F5F5;border-radius:8px;padding:6px">
              <div style="font-size:11px;color:#757575">Current</div>
              <div style="font-weight:800;font-size:14px;color:#333">₹${w.current.toLocaleString()}</div>
            </div>
            <div style="background:#F5F5F5;border-radius:8px;padding:6px">
              <div style="font-size:11px;color:#757575">Target</div>
              <div style="font-weight:800;font-size:14px;color:#1565C0">₹${w.target.toLocaleString()}</div>
            </div>
            <div style="background:#F5F5F5;border-radius:8px;padding:6px">
              <div style="font-size:11px;color:#757575">Alert</div>
              <div style="font-weight:700;font-size:12px;color:${w.alert==='above'?'#2E7D32':'#C62828'}">${w.alert==='above'?'📈 ≥ target':'📉 ≤ target'}</div>
            </div>
          </div>
          <button data-wid="${w.id}" class="del-watch-btn" style="margin-top:8px;background:transparent;border:1px solid #BDBDBD;border-radius:6px;padding:4px 10px;font-size:10px;color:#757575;cursor:pointer;float:right">Remove</button>
        </div>`;
      }).join('')}
      ${WATCHLIST.length === 0 ? `<div class="empty-state"><div class="es-icon">🔔</div><div class="es-title">No watchlist alerts</div><div class="es-text">Add crop price alerts to get notified when market prices hit your targets</div><button id="addWatchBtn2" class="btn btn-primary btn-small mt">+ Add First Alert</button></div>` : ''}
    </div>`;
  }

  function showAddWatch() {
    showModal(`<div class="modal-handle"></div>
      <h3>Add Price Alert</h3>
      <div class="form-group"><label>Crop</label><input class="form-input" id="wCrop" placeholder="e.g. Paddy, Cotton, Tomato"></div>
      <div class="form-group"><label>Market (APMC)</label><input class="form-input" id="wMarket" placeholder="e.g. Guntur, Adilabad"></div>
      <div class="form-group"><label>Target Price (₹/Qtl)</label><input class="form-input" id="wTarget" type="number" placeholder="e.g. 2400"></div>
      <div class="form-group"><label>Alert When Price Is</label>
        <select class="form-input" id="wAlert"><option value="above">📈 Above target (sell time)</option><option value="below">📉 Below target (buy time)</option></select>
      </div>
      <button class="btn btn-primary" id="submitWatch">Set Alert</button>`);
    document.querySelector('#submitWatch')?.addEventListener('click', () => {
      const crop = document.querySelector('#wCrop')?.value?.trim();
      const market = document.querySelector('#wMarket')?.value?.trim();
      const target = Number(document.querySelector('#wTarget')?.value);
      if (!crop || !market || !target) { showToast('Fill all fields', 'error'); return; }
      WATCHLIST.push({ id:'w'+Date.now(), crop, market, current:0, target, unit:'Qtl', alert:document.querySelector('#wAlert')?.value||'above', icon:'🌾' });
      showToast('Price alert added!', 'success');
      closeModal(); tab = 'watchlist'; render();
    });
  }

  function renderMarketOutlook() {
    const outlook = marketOutlook?.outlook || marketOutlook || {};
    const trends = outlook.trends || outlook.price_trends || [];
    const recommendations = outlook.recommendations || [];
    return `<div class="section" style="padding-top:8px">
      <div class="section-title">📊 Market Outlook</div>
      ${outlook.summary ? `<div class="card" style="margin-bottom:12px"><p class="text-sm">${outlook.summary}</p></div>` : ''}
      ${trends.length > 0 ? `
        <div class="section-title" style="font-size:13px;margin-top:12px">📈 Price Trends</div>
        ${trends.map(t => `
          <div class="card" style="margin-bottom:8px">
            <div class="flex-between">
              <div class="fw-700">${t.crop_name || t.crop || ''}</div>
              <span class="tag tag-${t.trend === 'up' ? 'green' : t.trend === 'down' ? 'orange' : 'gray'}">${t.trend === 'up' ? '📈 Rising' : t.trend === 'down' ? '📉 Falling' : '➡️ Stable'}</span>
            </div>
            <div class="flex-between mt-sm">
              <span class="text-sm text-muted">Current: ₹${Number(t.current_price || 0).toLocaleString()}/q</span>
              <span class="text-sm text-muted">Forecast: ₹${Number(t.forecast_price || t.predicted_price || 0).toLocaleString()}/q</span>
            </div>
            ${t.change_pct ? `<div class="text-sm mt-sm" style="color:${t.change_pct > 0 ? 'var(--success)' : 'var(--error)'}">Change: ${t.change_pct > 0 ? '+' : ''}${t.change_pct}%</div>` : ''}
          </div>
        `).join('')}
      ` : ''}
      ${recommendations.length > 0 ? `
        <div class="section-title" style="font-size:13px;margin-top:12px">💡 Recommendations</div>
        ${recommendations.map(r => `
          <div class="card" style="margin-bottom:8px;background:var(--accent-light);border:1px solid var(--accent)">
            <div class="fw-600 text-sm">${r.title || r.crop || ''}</div>
            <div class="text-sm text-muted mt-sm">${r.message || r.recommendation || ''}</div>
          </div>
        `).join('')}
      ` : ''}
      ${!trends.length && !recommendations.length && !outlook.summary ? `
        <div class="empty-state"><div class="es-icon">📊</div><div class="es-title">No market outlook data</div><div class="es-text">Market predictions based on supply-demand analysis</div></div>
      ` : ''}
    </div>`;
  }

  async function loadData() {
    loading = true; render();
    try {
      const distParam = selectedDistrict ? `?district_id=${selectedDistrict}` : '';
      const [f, a, dists, ch, mo] = await Promise.all([
        api.getForecast(`?days=7${selectedDistrict ? '&district_id=' + selectedDistrict : ''}`),
        api.getWeatherAdvisory().catch(() => []),
        districts.length ? Promise.resolve(districts) : api.getDistricts().catch(() => []),
        api.getCropHealth(distParam).catch(() => []),
        api.getMarketOutlook().catch(() => ({})),
      ]);
      forecast = f || {};
      advisories = Array.isArray(a) ? a : (a.weather_based || a.advisories || []);
      if (!districts.length) districts = Array.isArray(dists) ? dists : (dists.districts || []);
      cropHealth = Array.isArray(ch) ? ch : (ch.crop_health || ch.data || []);
      marketOutlook = mo || {};
    } catch (e) { console.error('Weather:', e); forecast = {}; advisories = []; }
    // Fallback to sample data if APIs return empty
    if (!forecast || (!forecast.current && !forecast.forecast?.length)) forecast = SAMPLE_FORECAST;
    if (!advisories.length) advisories = SAMPLE_ADVISORIES;
    if (!cropHealth.length) cropHealth = SAMPLE_CROP_HEALTH;
    if (!marketOutlook.summary && !marketOutlook.trends?.length) marketOutlook = SAMPLE_MARKET_OUTLOOK;
    loading = false; render();
  }

  loadData();
}
