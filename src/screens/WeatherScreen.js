import { api } from '../api.js';

export function renderWeather(container) {
  let forecast = null, advisories = [], loading = true;

  function render() {
    container.innerHTML = loading ? '<div class="loading"><div class="spinner"></div></div>' : renderContent();
  }

  function renderContent() {
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

  async function loadData() {
    loading = true; render();
    try {
      const [f, a] = await Promise.all([
        api.getForecast('?days=7'),
        api.getWeatherAdvisory().catch(() => []),
      ]);
      forecast = f || {};
      advisories = Array.isArray(a) ? a : (a.weather_based || a.advisories || []);
    } catch (e) { console.error('Weather:', e); forecast = {}; advisories = []; }
    loading = false; render();
  }

  loadData();
}
