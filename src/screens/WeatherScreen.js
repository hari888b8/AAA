import { api } from '../api.js';
import { showToast } from '../main.js';

export function renderWeather(container) {
  let forecast = null, advisories = [], cropHealth = [], marketOutlook = {}, districts = [];
  let loading = true, selectedDistrict = '';
  let tab = 'forecast';

  function render() {
    container.innerHTML = loading ? '<div class="loading"><div class="spinner"></div></div>' : `
      <div class="app-brand-header" style="padding:14px 16px 10px;background:linear-gradient(135deg,#2196F3 0%,#00BCD4 100%);color:#fff">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:28px">🌤️</span>
          <div><div style="font-size:18px;font-weight:800;letter-spacing:-0.3px">Weather & Crop Health</div><div style="font-size:11px;opacity:0.85">IMD + Satellite Monitoring · District-level Intelligence</div></div>
        </div>
      </div>
      <div style="padding:8px 16px">
        <select class="form-input" id="districtSelect" style="margin-bottom:8px">
          <option value="">All Districts</option>
          ${districts.map(d => `<option value="${d.id}" ${selectedDistrict == d.id ? 'selected' : ''}>${d.name}</option>`).join('')}
        </select>
      </div>
      <div class="tab-bar">
        <button class="tab-btn ${tab === 'forecast' ? 'active' : ''}" data-tab="forecast">🌤️ Forecast</button>
        <button class="tab-btn ${tab === 'crop' ? 'active' : ''}" data-tab="crop">🌱 Crop Health</button>
        <button class="tab-btn ${tab === 'market' ? 'active' : ''}" data-tab="market">📊 Market</button>
      </div>
      ${tab === 'forecast' ? renderForecast() : tab === 'crop' ? renderCropHealth() : renderMarketOutlook()}
    `;
    container.querySelector('#districtSelect')?.addEventListener('change', e => {
      selectedDistrict = e.target.value;
      loadData();
    });
    container.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; render(); }));
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
    loading = false; render();
  }

  loadData();
}
