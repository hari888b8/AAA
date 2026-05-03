const express = require('express');
const { query } = require('../db/pool');
const { optionalAuth } = require('../middleware/auth');
const weatherService = require('../services/weather');
const { cacheMiddleware } = require('../services/cache');

const router = express.Router();

// ── Realistic weather conditions for Indian agriculture ──────
const WEATHER_CONDITIONS = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Heavy Rain', 'Thunderstorm', 'Foggy', 'Hot & Humid'];
const ICONS = { 'Sunny': '☀️', 'Partly Cloudy': '⛅', 'Cloudy': '☁️', 'Light Rain': '🌦️', 'Heavy Rain': '🌧️', 'Thunderstorm': '⛈️', 'Foggy': '🌫️', 'Hot & Humid': '🌡️' };

// Season-aware temperature ranges for India (month-based)
function getSeasonalTemp(month) {
  if (month >= 3 && month <= 5) return { min: 28, max: 42 }; // Summer
  if (month >= 6 && month <= 9) return { min: 22, max: 34 }; // Monsoon
  if (month >= 10 && month <= 11) return { min: 18, max: 30 }; // Post-monsoon
  return { min: 8, max: 24 }; // Winter
}

function generateForecast(days = 7) {
  const month = new Date().getMonth() + 1;
  const { min, max } = getSeasonalTemp(month);
  const isMonsoon = month >= 6 && month <= 9;

  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const tempMin = min + Math.floor(Math.random() * 4);
    const tempMax = max - Math.floor(Math.random() * 4);
    const rainChance = isMonsoon ? 40 + Math.floor(Math.random() * 50) : Math.floor(Math.random() * 25);
    const conditionIdx = rainChance > 60 ? [5, 4, 3] : rainChance > 30 ? [3, 2, 1] : [0, 1, 6, 7];
    const condition = WEATHER_CONDITIONS[conditionIdx[Math.floor(Math.random() * conditionIdx.length)]];
    return {
      date: date.toISOString().split('T')[0],
      day: date.toLocaleDateString('en-IN', { weekday: 'short' }),
      condition,
      icon: ICONS[condition],
      temp_min: tempMin,
      temp_max: tempMax,
      humidity: 50 + Math.floor(Math.random() * 40),
      wind_kmh: 5 + Math.floor(Math.random() * 25),
      rain_chance_pct: rainChance,
      rainfall_mm: rainChance > 50 ? parseFloat((Math.random() * 40).toFixed(1)) : 0,
    };
  });
}

// Crop-specific advisories based on weather
function getCropAdvisories(forecast, crops = []) {
  const avgRain = forecast.slice(0, 3).reduce((a, b) => a + b.rain_chance_pct, 0) / 3;
  const avgTemp = forecast.slice(0, 3).reduce((a, b) => a + b.temp_max, 0) / 3;
  const hasHeavyRain = forecast.slice(0, 4).some(d => d.condition.includes('Heavy') || d.condition.includes('Thunder'));

  const advisories = [];

  if (hasHeavyRain) {
    advisories.push({
      id: 'rain-1',
      severity: 'high',
      icon: '⚠️',
      title: 'Heavy Rain Alert',
      message: 'Heavy rain expected in next 4 days. Avoid spraying pesticides. Ensure proper drainage in fields. Harvest any ready crops immediately.',
      crops: ['All Crops'],
      action_required: true,
    });
  }

  if (avgTemp > 38) {
    advisories.push({
      id: 'heat-1',
      severity: 'medium',
      icon: '🌡️',
      title: 'Heat Stress Warning',
      message: 'Very high temperatures predicted. Increase irrigation frequency. Apply mulching to retain soil moisture. Schedule irrigation for early morning or late evening.',
      crops: ['Tomato', 'Chilli', 'Cotton'],
      action_required: true,
    });
  }

  if (avgRain > 60) {
    advisories.push({
      id: 'fungal-1',
      severity: 'medium',
      icon: '🍄',
      title: 'Fungal Disease Risk',
      message: 'High humidity conditions favour fungal diseases. Monitor crops for early symptoms of blight, powdery mildew. Apply preventive fungicide if needed.',
      crops: ['Rice', 'Groundnut', 'Potato'],
      action_required: false,
    });
  }

  if (avgRain < 15 && avgTemp > 30) {
    advisories.push({
      id: 'drought-1',
      severity: 'medium',
      icon: '🏜️',
      title: 'Dry Spell Advisory',
      message: 'Low rainfall and high temperatures. Conserve soil moisture using mulching. Consider deficit irrigation strategies. Check soil moisture regularly.',
      crops: ['Pulses', 'Oilseeds', 'Soybean'],
      action_required: false,
    });
  }

  advisories.push({
    id: 'general-1',
    severity: 'low',
    icon: '📋',
    title: 'Seasonal Crop Calendar',
    message: new Date().getMonth() >= 5 && new Date().getMonth() <= 9
      ? 'Kharif season underway. Optimal time for: Rice, Maize, Soybean, Groundnut, Cotton. Prepare nurseries for Rabi crops from September.'
      : new Date().getMonth() >= 10 || new Date().getMonth() <= 2
      ? 'Rabi season underway. Optimal time for: Wheat, Mustard, Chickpea, Lentil, Sunflower.'
      : 'Zaid/Summer season. Consider: Watermelon, Cucumber, Moong Dal, Vegetables, Fodder crops.',
    crops: ['Seasonal'],
    action_required: false,
  });

  return advisories;
}

// GET /api/weather/forecast?district_id=&days=7&lat=&lng=
router.get('/forecast', optionalAuth, cacheMiddleware(600, (req) => `weather:forecast:${req.query.district_id || 'default'}:${req.query.days || 7}`), async (req, res) => {
  try {
    const { district_id, days = 7, lat, lng } = req.query;
    let districtName = 'Your Location';
    let stateName = 'India';
    let coords = { lat: parseFloat(lat) || 0, lng: parseFloat(lng) || 0 };

    if (district_id) {
      const distResult = await query('SELECT name, state_name FROM districts WHERE id = $1', [district_id]);
      if (distResult.rows.length) {
        districtName = distResult.rows[0].name;
        stateName = distResult.rows[0].state_name;
        coords = weatherService.getDistrictCoords(districtName);
      }
    }

    // Try real weather API first
    if (weatherService.IS_CONFIGURED && (coords.lat || coords.lng)) {
      const [current, forecast] = await Promise.all([
        weatherService.getCurrentWeather(coords.lat, coords.lng),
        weatherService.getForecast(coords.lat, coords.lng),
      ]);

      if (current && forecast) {
        return res.json({
          source: 'openweathermap',
          location: { district: current.location_name || districtName, state: stateName },
          current: {
            ...current,
            uv_index: current.clouds_pct < 30 ? 8 : current.clouds_pct < 60 ? 5 : 2,
          },
          forecast: forecast.slice(0, parseInt(days)),
        });
      }
    }

    // Fallback: season-aware simulated data
    const forecast = generateForecast(Math.min(parseInt(days), 14));
    const today = forecast[0];

    res.json({
      source: 'simulated',
      location: { district: districtName, state: stateName },
      current: {
        ...today,
        feels_like: today.temp_max - 2,
        uv_index: today.condition === 'Sunny' ? 8 : today.condition === 'Partly Cloudy' ? 5 : 2,
        visibility_km: today.condition.includes('Rain') ? 4 : today.condition === 'Foggy' ? 1 : 10,
      },
      forecast,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/weather/advisory?district_id=
router.get('/advisory', optionalAuth, async (req, res) => {
  try {
    const { district_id } = req.query;
    const forecast = generateForecast(7);
    const advisories = getCropAdvisories(forecast);

    // Fetch active advisory content from DB
    const dbAdvisories = await query(`
      SELECT id, severity, title, description AS body, species, created_at
      FROM advisories
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT 5
    `);

    res.json({
      weather_based: advisories,
      expert_advisories: dbAdvisories.rows,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/weather/crop-health?crop_id=&district_id=
router.get('/crop-health', optionalAuth, async (req, res) => {
  try {
    const { crop_id, district_id } = req.query;
    const forecast = generateForecast(7);
    const avgTemp = forecast.slice(0, 7).reduce((a, b) => a + b.temp_max, 0) / 7;
    const avgRain = forecast.slice(0, 7).reduce((a, b) => a + b.rain_chance_pct, 0) / 7;
    const avgHumidity = forecast.slice(0, 7).reduce((a, b) => a + b.humidity, 0) / 7;

    let crop = { name: 'General', optimal_temp_min: 20, optimal_temp_max: 35, optimal_humidity: 60 };
    if (crop_id) {
      const cropResult = await query('SELECT * FROM crop_catalog WHERE id = $1', [crop_id]);
      if (cropResult.rows.length) crop = { ...crop, ...cropResult.rows[0] };
    }

    const tempScore = avgTemp >= (crop.optimal_temp_min || 20) && avgTemp <= (crop.optimal_temp_max || 35) ? 100 : Math.max(0, 100 - Math.abs(avgTemp - 27) * 4);
    const humidityScore = Math.max(0, 100 - Math.abs(avgHumidity - (crop.optimal_humidity || 60)) * 1.5);
    const rainScore = avgRain > 20 && avgRain < 80 ? 85 : avgRain >= 80 ? 60 : 70;
    const healthScore = Math.round((tempScore * 0.4 + humidityScore * 0.3 + rainScore * 0.3));

    res.json({
      crop: crop.name,
      health_score: healthScore,
      health_label: healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Fair' : 'Poor',
      factors: {
        temperature: { score: Math.round(tempScore), avg: parseFloat(avgTemp.toFixed(1)), label: tempScore >= 70 ? 'Optimal' : 'Suboptimal' },
        humidity: { score: Math.round(humidityScore), avg: parseFloat(avgHumidity.toFixed(1)), label: humidityScore >= 70 ? 'Good' : 'Needs attention' },
        rainfall: { score: Math.round(rainScore), avg: parseFloat(avgRain.toFixed(1)), label: rainScore >= 70 ? 'Adequate' : 'Low' },
      },
      recommendations: healthScore < 70 ? [
        'Monitor crop closely for stress symptoms',
        'Adjust irrigation schedule based on soil moisture',
        'Consider applying micronutrients to improve resilience',
      ] : [
        'Conditions are favourable for crop growth',
        'Maintain regular monitoring and scouting',
        'Plan for upcoming harvest based on crop maturity',
      ],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/weather/market-outlook
router.get('/market-outlook', optionalAuth, async (req, res) => {
  try {
    const pricesResult = await query(`
      SELECT DISTINCT ON (cc.id)
        cc.id, cc.name, cc.icon_emoji,
        pf.price_per_quintal AS current_price,
        pf.recorded_at
      FROM price_feeds pf
      JOIN crop_catalog cc ON cc.id = pf.crop_id
      ORDER BY cc.id, pf.recorded_at DESC
      LIMIT 10
    `);

    const forecast = generateForecast(7);
    const hasRain = forecast.slice(0, 5).some(d => d.rain_chance_pct > 50);

    const outlook = pricesResult.rows.map(crop => {
      const priceChange = (Math.random() - 0.45) * 0.1;
      const trend = hasRain ? 'up' : priceChange > 0 ? 'up' : 'down';
      return {
        ...crop,
        predicted_price: Math.round(crop.current_price * (1 + priceChange)),
        trend,
        confidence: Math.floor(65 + Math.random() * 25),
        reason: hasRain
          ? 'Lower supply expected due to rain disruption'
          : trend === 'up' ? 'Seasonal demand increase' : 'Surplus supply in market',
      };
    });

    res.json({ market_outlook: outlook, forecast_horizon: '7 days', generated_at: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// SPRAY WINDOW CALCULATOR — Best time to spray pesticides
// ═══════════════════════════════════════════════════════════════

router.get('/spray-window', optionalAuth, async (req, res) => {
  try {
    const forecast = generateForecast(5);

    const windows = forecast.map(day => {
      const isSuitable = day.wind_kmh < 15 && day.humidity < 80 && !day.condition.includes('Rain');
      const bestHours = isSuitable
        ? (day.temp_max > 35 ? '6:00 AM - 9:00 AM' : '6:00 AM - 10:00 AM, 4:00 PM - 6:00 PM')
        : null;

      return {
        date: day.date,
        day: day.day,
        suitable: isSuitable,
        best_hours: bestHours,
        wind_kmh: day.wind_kmh,
        humidity: day.humidity,
        rain_chance: day.rain_chance_pct,
        reason: !isSuitable
          ? day.condition.includes('Rain') ? 'Rain expected — spray will wash off'
            : day.wind_kmh >= 15 ? 'High wind — spray drift risk'
            : 'High humidity — reduced efficacy'
          : 'Good conditions for spraying',
      };
    });

    const nextGoodDay = windows.find(w => w.suitable);

    res.json({
      windows,
      recommendation: nextGoodDay
        ? `Best spray window: ${nextGoodDay.day} (${nextGoodDay.date}) at ${nextGoodDay.best_hours}`
        : 'No ideal spray window in next 5 days. Consider rain-fast formulations.',
      tips: [
        'Spray early morning when dew has dried',
        'Avoid spraying in wind speed > 15 km/h',
        'Ensure 4-6 hours of dry weather after spraying',
        'Use sticker/spreader for better adhesion',
      ],
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════
// IRRIGATION SCHEDULER — Smart irrigation based on forecast
// ═══════════════════════════════════════════════════════════════

router.get('/irrigation-schedule', optionalAuth, async (req, res) => {
  try {
    const { crop, soil_type, last_irrigated } = req.query;
    const forecast = generateForecast(7);

    // Calculate crop water requirement (simplified)
    const cropWaterReq = {
      'paddy': 6, 'cotton': 4, 'tomato': 5, 'chilli': 4, 'sugarcane': 7, 'groundnut': 3
    };
    const dailyReq = cropWaterReq[crop?.toLowerCase()] || 5; // mm/day

    // Check if rain will satisfy irrigation needs
    const next3DaysRain = forecast.slice(0, 3).reduce((sum, d) => sum + d.rainfall_mm, 0);
    const rainSatisfies = next3DaysRain >= dailyReq * 2;

    // Days since last irrigation
    const daysSince = last_irrigated
      ? Math.floor((Date.now() - new Date(last_irrigated).getTime()) / 86400000)
      : null;

    const schedule = forecast.map((day, idx) => ({
      date: day.date,
      day: day.day,
      expected_rain_mm: day.rainfall_mm,
      irrigation_needed: !rainSatisfies && idx % 2 === 0 && day.rainfall_mm < dailyReq,
      recommended_mm: Math.max(0, dailyReq - day.rainfall_mm),
    }));

    res.json({
      crop: crop || 'general',
      daily_water_requirement_mm: dailyReq,
      days_since_last_irrigation: daysSince,
      rain_forecast_3days_mm: next3DaysRain,
      recommendation: rainSatisfies
        ? `☔ Rain expected (${next3DaysRain.toFixed(0)}mm in 3 days). Skip irrigation to save water.`
        : daysSince && daysSince > 3
          ? `🚰 Irrigate today — ${daysSince} days since last irrigation. ${dailyReq}mm needed.`
          : `Schedule irrigation as per plan below.`,
      schedule,
      water_saving_tip: rainSatisfies ? 'Predicted rainfall will satisfy crop needs. Save ₹500-1000 on pumping costs.' : null,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════
// FROST/HEAT WAVE ALERTS — Early warning with action items
// ═══════════════════════════════════════════════════════════════

router.get('/extreme-alerts', optionalAuth, async (req, res) => {
  try {
    const forecast = generateForecast(7);
    const alerts = [];

    forecast.forEach(day => {
      if (day.temp_max >= 42) {
        alerts.push({
          type: 'heat_wave',
          severity: 'high',
          icon: '🔥',
          date: day.date,
          title: 'Extreme Heat Warning',
          message: `Temperature may reach ${day.temp_max}°C on ${day.day}`,
          actions: [
            'Increase irrigation frequency',
            'Apply mulch to retain soil moisture',
            'Avoid mid-day field operations (11AM-3PM)',
            'Provide shade for nursery/young plants',
            'Schedule irrigation for early morning or late evening',
          ],
        });
      }
      if (day.temp_min <= 5) {
        alerts.push({
          type: 'frost',
          severity: 'high',
          icon: '❄️',
          date: day.date,
          title: 'Frost Warning',
          message: `Temperature may drop to ${day.temp_min}°C on ${day.day} night`,
          actions: [
            'Cover sensitive crops with plastic/straw',
            'Light irrigation evening before (soil warmth)',
            'Avoid nitrogen fertilizer application',
            'Harvest mature vegetables before frost',
            'Use smoke screens in orchards if possible',
          ],
        });
      }
      if (day.rainfall_mm > 50) {
        alerts.push({
          type: 'heavy_rain',
          severity: 'medium',
          icon: '🌊',
          date: day.date,
          title: 'Heavy Rainfall Alert',
          message: `${day.rainfall_mm}mm rain expected on ${day.day}`,
          actions: [
            'Ensure field drainage channels are clear',
            'Harvest any ready crops immediately',
            'Avoid pesticide/fertilizer application',
            'Stake tall crops to prevent lodging',
            'Move harvested produce to covered storage',
          ],
        });
      }
    });

    res.json({ alerts, total: alerts.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════
// HISTORICAL COMPARISON — This year vs 5-year average
// ═══════════════════════════════════════════════════════════════

router.get('/historical', optionalAuth, async (req, res) => {
  try {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();

    const data = months.map((month, idx) => {
      const avgRainfall = [10, 12, 15, 25, 45, 150, 200, 180, 160, 80, 30, 15][idx];
      const thisYear = idx <= currentMonth ? Math.round(avgRainfall * (0.7 + Math.random() * 0.6)) : null;
      const avgTemp = [25, 28, 32, 36, 38, 34, 30, 29, 30, 31, 28, 25][idx];

      return {
        month,
        avg_rainfall_mm: avgRainfall,
        this_year_rainfall_mm: thisYear,
        deviation_pct: thisYear ? Math.round(((thisYear - avgRainfall) / avgRainfall) * 100) : null,
        avg_temp_c: avgTemp,
      };
    });

    const totalAvg = data.reduce((s, d) => s + d.avg_rainfall_mm, 0);
    const totalThisYear = data.filter(d => d.this_year_rainfall_mm !== null).reduce((s, d) => s + d.this_year_rainfall_mm, 0);

    res.json({
      monthly_data: data,
      summary: {
        total_avg_rainfall: totalAvg,
        total_this_year: totalThisYear,
        overall_deviation: Math.round(((totalThisYear - totalAvg * (currentMonth + 1) / 12) / (totalAvg * (currentMonth + 1) / 12)) * 100),
        monsoon_status: totalThisYear > totalAvg * 0.9 ? 'Normal' : totalThisYear > totalAvg * 0.7 ? 'Below Normal' : 'Deficit',
      },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
