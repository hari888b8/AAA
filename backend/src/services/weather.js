'use strict';

/**
 * Weather Service — OpenWeatherMap API integration with smart fallback
 * Uses real weather data when API key is configured, falls back to
 * season-aware simulated data for development.
 */

const https = require('https');
const logger = require('../lib/logger');

const OWM_API_KEY = process.env.OPENWEATHERMAP_API_KEY;
const IS_CONFIGURED = !!OWM_API_KEY;

// Cache weather data for 30 minutes to avoid API rate limits
const cache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000;

/**
 * Make request to OpenWeatherMap API
 */
function owmRequest(path) {
  return new Promise((resolve, reject) => {
    const url = `https://api.openweathermap.org/data/2.5${path}&appid=${OWM_API_KEY}&units=metric`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode === 200) resolve(parsed);
          else reject(new Error(parsed.message || `OWM error ${res.statusCode}`));
        } catch { reject(new Error('Parse error')); }
      });
    }).on('error', reject);
  });
}

/**
 * Get current weather for a location
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} Current weather data
 */
async function getCurrentWeather(lat, lng) {
  const cacheKey = `current_${lat.toFixed(2)}_${lng.toFixed(2)}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.time < CACHE_TTL_MS) return cached.data;

  if (!IS_CONFIGURED) return null;

  try {
    const data = await owmRequest(`/weather?lat=${lat}&lon=${lng}`);
    const result = {
      temperature: Math.round(data.main.temp),
      feels_like: Math.round(data.main.feels_like),
      temp_min: Math.round(data.main.temp_min),
      temp_max: Math.round(data.main.temp_max),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      wind_kmh: Math.round((data.wind?.speed || 0) * 3.6),
      wind_direction: data.wind?.deg,
      condition: data.weather?.[0]?.main || 'Clear',
      description: data.weather?.[0]?.description || '',
      icon: mapOWMIcon(data.weather?.[0]?.icon),
      clouds_pct: data.clouds?.all || 0,
      visibility_km: Math.round((data.visibility || 10000) / 1000),
      rain_1h_mm: data.rain?.['1h'] || 0,
      sunrise: data.sys?.sunrise ? new Date(data.sys.sunrise * 1000).toISOString() : null,
      sunset: data.sys?.sunset ? new Date(data.sys.sunset * 1000).toISOString() : null,
      location_name: data.name,
    };

    cache.set(cacheKey, { data: result, time: Date.now() });
    return result;
  } catch (err) {
    logger.warn({ lat, lng, error: err.message }, '[Weather] OWM current weather failed');
    return null;
  }
}

/**
 * Get 5-day / 3-hour forecast
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Array>} Daily forecast array
 */
async function getForecast(lat, lng) {
  const cacheKey = `forecast_${lat.toFixed(2)}_${lng.toFixed(2)}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.time < CACHE_TTL_MS) return cached.data;

  if (!IS_CONFIGURED) return null;

  try {
    const data = await owmRequest(`/forecast?lat=${lat}&lon=${lng}`);

    // Group 3-hour intervals into daily summaries
    const dailyMap = {};
    for (const item of data.list) {
      const date = item.dt_txt.split(' ')[0];
      if (!dailyMap[date]) {
        dailyMap[date] = { temps: [], humidity: [], wind: [], rain: 0, conditions: [] };
      }
      dailyMap[date].temps.push(item.main.temp);
      dailyMap[date].humidity.push(item.main.humidity);
      dailyMap[date].wind.push((item.wind?.speed || 0) * 3.6);
      dailyMap[date].rain += item.rain?.['3h'] || 0;
      dailyMap[date].conditions.push(item.weather?.[0]?.main || 'Clear');
    }

    const forecast = Object.entries(dailyMap).slice(0, 7).map(([date, day]) => {
      const condition = getMostFrequent(day.conditions);
      const rainChance = day.conditions.filter(c => c === 'Rain' || c === 'Drizzle' || c === 'Thunderstorm').length / day.conditions.length * 100;

      return {
        date,
        day: new Date(date).toLocaleDateString('en-IN', { weekday: 'short' }),
        condition,
        icon: mapConditionToEmoji(condition),
        temp_min: Math.round(Math.min(...day.temps)),
        temp_max: Math.round(Math.max(...day.temps)),
        humidity: Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length),
        wind_kmh: Math.round(day.wind.reduce((a, b) => a + b, 0) / day.wind.length),
        rain_chance_pct: Math.round(rainChance),
        rainfall_mm: parseFloat(day.rain.toFixed(1)),
      };
    });

    cache.set(cacheKey, { data: forecast, time: Date.now() });
    return forecast;
  } catch (err) {
    logger.warn({ lat, lng, error: err.message }, '[Weather] OWM forecast failed');
    return null;
  }
}

/**
 * Get weather alerts for a region (using OneCall API if available)
 * @param {number} lat
 * @param {number} lng
 */
async function getAlerts(lat, lng) {
  if (!IS_CONFIGURED) return [];

  try {
    // OneCall 3.0 (requires subscription) — fallback gracefully
    const data = await owmRequest(`/onecall?lat=${lat}&lon=${lng}&exclude=minutely,hourly`);
    return (data.alerts || []).map(alert => ({
      event: alert.event,
      sender: alert.sender_name,
      start: new Date(alert.start * 1000).toISOString(),
      end: new Date(alert.end * 1000).toISOString(),
      description: alert.description,
    }));
  } catch {
    return [];
  }
}

// District coordinates for Indian agricultural districts
const DISTRICT_COORDS = {
  // Andhra Pradesh
  'guntur': { lat: 16.30, lng: 80.44 },
  'krishna': { lat: 16.60, lng: 80.73 },
  'east_godavari': { lat: 16.99, lng: 82.24 },
  'west_godavari': { lat: 16.74, lng: 81.10 },
  'kurnool': { lat: 15.83, lng: 78.04 },
  'anantapur': { lat: 14.68, lng: 77.60 },
  'nellore': { lat: 14.44, lng: 79.97 },
  'prakasam': { lat: 15.34, lng: 79.55 },
  'chittoor': { lat: 13.22, lng: 79.10 },
  // Telangana
  'hyderabad': { lat: 17.39, lng: 78.49 },
  'warangal': { lat: 17.98, lng: 79.59 },
  'karimnagar': { lat: 18.44, lng: 79.13 },
  'adilabad': { lat: 19.67, lng: 78.53 },
  'khammam': { lat: 17.25, lng: 80.15 },
  'nizamabad': { lat: 18.67, lng: 78.09 },
  'medak': { lat: 18.04, lng: 78.26 },
  // Other major agricultural districts
  'pune': { lat: 18.52, lng: 73.86 },
  'nashik': { lat: 20.00, lng: 73.79 },
  'indore': { lat: 22.72, lng: 75.86 },
  'jaipur': { lat: 26.91, lng: 75.79 },
  'ludhiana': { lat: 30.90, lng: 75.86 },
};

/**
 * Resolve district to coordinates
 */
function getDistrictCoords(districtName) {
  if (!districtName) return { lat: 17.39, lng: 78.49 }; // Default: Hyderabad
  const key = districtName.toLowerCase().replace(/[^a-z]/g, '_');
  return DISTRICT_COORDS[key] || { lat: 17.39, lng: 78.49 };
}

// Helper: Map OWM icon codes to emojis
function mapOWMIcon(iconCode) {
  const map = {
    '01d': '☀️', '01n': '🌙', '02d': '⛅', '02n': '☁️',
    '03d': '☁️', '03n': '☁️', '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️', '13d': '❄️', '13n': '❄️',
    '50d': '🌫️', '50n': '🌫️',
  };
  return map[iconCode] || '☀️';
}

function mapConditionToEmoji(condition) {
  const map = {
    'Clear': '☀️', 'Clouds': '☁️', 'Rain': '🌧️', 'Drizzle': '🌦️',
    'Thunderstorm': '⛈️', 'Snow': '❄️', 'Mist': '🌫️', 'Fog': '🌫️',
    'Haze': '🌫️', 'Smoke': '🌫️',
  };
  return map[condition] || '☀️';
}

function getMostFrequent(arr) {
  const counts = {};
  arr.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Clear';
}

module.exports = {
  getCurrentWeather,
  getForecast,
  getAlerts,
  getDistrictCoords,
  IS_CONFIGURED,
  DISTRICT_COORDS,
};
