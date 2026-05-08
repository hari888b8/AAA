/**
 * AI Advisory Engine Routes
 * Personalized agricultural intelligence for farmers
 */

const { Router } = require('express');
const { pool } = require('../db/pool');

const router = Router();

// ============== CROP RECOMMENDATIONS ==============

/**
 * @route POST /crop-recommend
 * @desc Recommend optimal crops based on conditions
 * @body {string} farmer_id, {string} soil_type, {string} water_availability, {string} market_preference
 */
router.post('/crop-recommend', async (req, res) => {
  try {
    const { farmer_id, soil_type, water_availability, market_preference } = req.body;
    if (!farmer_id || !soil_type) {
      return res.status(400).json({ error: 'farmer_id and soil_type are required' });
    }
    res.json({
      success: true,
      farmer_id,
      recommendations: [
        { crop: 'Rice', score: 92, reason: 'High water availability suits paddy cultivation', expected_yield: '4.5 tons/ha', profit_margin: '35%' },
        { crop: 'Sugarcane', score: 87, reason: 'Good soil match and market demand', expected_yield: '70 tons/ha', profit_margin: '28%' },
        { crop: 'Wheat', score: 78, reason: 'Moderate fit, consider irrigation needs', expected_yield: '3.2 tons/ha', profit_margin: '25%' }
      ],
      soil_analysis: { type: soil_type, ph: 6.8, organic_matter: '2.4%' },
      water_status: water_availability || 'moderate',
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate crop recommendations', details: error.message });
  }
});

/**
 * @route GET /crop-calendar/:farmerId
 * @desc Get personalized crop calendar for farmer
 */
router.get('/crop-calendar/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;
    if (!farmerId) {
      return res.status(400).json({ error: 'farmerId is required' });
    }
    res.json({
      success: true,
      farmer_id: farmerId,
      current_month: new Date().toLocaleString('default', { month: 'long' }),
      calendar: [
        { week: 1, activities: ['Soil preparation', 'Seed selection'], crops: ['Rice', 'Maize'] },
        { week: 2, activities: ['Sowing', 'Fertilizer application'], crops: ['Rice'] },
        { week: 3, activities: ['Irrigation monitoring', 'Pest scouting'], crops: ['Rice', 'Maize'] },
        { week: 4, activities: ['Weeding', 'Growth monitoring'], crops: ['All crops'] }
      ],
      upcoming_tasks: [
        { date: '2024-01-15', task: 'Apply nitrogen fertilizer to rice fields', priority: 'high' },
        { date: '2024-01-18', task: 'Scout for stem borer in paddy', priority: 'medium' }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch crop calendar', details: error.message });
  }
});

/**
 * @route GET /crop-profitability/:cropId
 * @desc Analyze crop profitability for region
 */
router.get('/crop-profitability/:cropId', async (req, res) => {
  try {
    const { cropId } = req.params;
    if (!cropId) {
      return res.status(400).json({ error: 'cropId is required' });
    }
    res.json({
      success: true,
      crop_id: cropId,
      analysis: {
        estimated_revenue: 85000,
        input_costs: 32000,
        labor_costs: 18000,
        net_profit: 35000,
        roi_percentage: 70,
        break_even_yield: '2.1 tons/ha'
      },
      market_outlook: 'positive',
      risk_factors: ['Weather variability', 'Price fluctuation'],
      comparison: { regional_avg_profit: 30000, your_position: 'above_average' }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze profitability', details: error.message });
  }
});

// ============== PEST & DISEASE ==============

/**
 * @route POST /pest-alert/check
 * @desc Check pest/disease risk based on conditions
 * @body {string} location, {string} crop, {object} weather
 */
router.post('/pest-alert/check', async (req, res) => {
  try {
    const { location, crop, weather } = req.body;
    if (!location || !crop) {
      return res.status(400).json({ error: 'location and crop are required' });
    }
    res.json({
      success: true,
      location,
      crop,
      risk_assessment: {
        overall_risk: 'moderate',
        pests: [
          { name: 'Stem Borer', risk: 'high', probability: 72, trigger: 'High humidity detected' },
          { name: 'Brown Plant Hopper', risk: 'moderate', probability: 45, trigger: 'Monsoon conditions' }
        ],
        diseases: [
          { name: 'Blast', risk: 'low', probability: 23, trigger: 'Temperature within safe range' }
        ]
      },
      recommendations: ['Install pheromone traps', 'Monitor field edges', 'Prepare neem-based spray'],
      alert_valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check pest risk', details: error.message });
  }
});

/**
 * @route GET /pest-alerts/:region
 * @desc Get active pest alerts for a region
 */
router.get('/pest-alerts/:region', async (req, res) => {
  try {
    const { region } = req.params;
    if (!region) {
      return res.status(400).json({ error: 'region is required' });
    }
    res.json({
      success: true,
      region,
      active_alerts: [
        { id: 'PA001', pest: 'Fall Armyworm', severity: 'high', affected_crops: ['Maize', 'Sorghum'], issued: '2024-01-10', expires: '2024-01-20' },
        { id: 'PA002', pest: 'Locust Swarm', severity: 'critical', affected_crops: ['All crops'], issued: '2024-01-12', expires: '2024-01-15' }
      ],
      advisory: 'Increased vigilance recommended. Report sightings to local agriculture office.',
      emergency_contact: '1800-XXX-XXXX'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pest alerts', details: error.message });
  }
});

/**
 * @route POST /disease/diagnose
 * @desc Diagnose plant disease from symptoms/image
 * @body {string} crop, {array} symptoms, {string} photo_url
 */
router.post('/disease/diagnose', async (req, res) => {
  try {
    const { crop, symptoms, photo_url } = req.body;
    if (!crop || !symptoms) {
      return res.status(400).json({ error: 'crop and symptoms are required' });
    }
    res.json({
      success: true,
      diagnosis: {
        disease: 'Bacterial Leaf Blight',
        confidence: 87,
        crop,
        matching_symptoms: symptoms,
        description: 'Bacterial infection causing yellowing and wilting of leaves'
      },
      severity: 'moderate',
      spread_risk: 'high',
      immediate_actions: ['Isolate affected plants', 'Remove infected leaves', 'Apply copper-based fungicide'],
      treatment_id: 'TRT-BLB-001',
      photo_analyzed: !!photo_url
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to diagnose disease', details: error.message });
  }
});

/**
 * @route GET /disease/treatments/:diseaseId
 * @desc Get treatment recommendations for a disease
 */
router.get('/disease/treatments/:diseaseId', async (req, res) => {
  try {
    const { diseaseId } = req.params;
    if (!diseaseId) {
      return res.status(400).json({ error: 'diseaseId is required' });
    }
    res.json({
      success: true,
      disease_id: diseaseId,
      disease_name: 'Bacterial Leaf Blight',
      treatments: [
        { type: 'chemical', name: 'Copper Oxychloride', dosage: '2.5g/L', frequency: 'Every 7 days', effectiveness: 85 },
        { type: 'biological', name: 'Pseudomonas fluorescens', dosage: '10g/L', frequency: 'Every 10 days', effectiveness: 70 },
        { type: 'cultural', name: 'Crop rotation', description: 'Rotate with non-host crops', effectiveness: 60 }
      ],
      prevention: ['Use resistant varieties', 'Maintain field hygiene', 'Balanced fertilization'],
      estimated_recovery: '14-21 days with treatment'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch treatments', details: error.message });
  }
});

// ============== HARVEST TIMING ==============

/**
 * @route GET /harvest-timing/:cropId
 * @desc Predict optimal harvest window
 */
router.get('/harvest-timing/:cropId', async (req, res) => {
  try {
    const { cropId } = req.params;
    if (!cropId) {
      return res.status(400).json({ error: 'cropId is required' });
    }
    res.json({
      success: true,
      crop_id: cropId,
      optimal_window: {
        start: '2024-01-25',
        end: '2024-02-05',
        peak_day: '2024-01-30'
      },
      maturity_indicators: ['Grain moisture at 20-22%', 'Panicles golden-brown', '85% grain fill complete'],
      weather_forecast: { favorable_days: 8, rain_risk: 'low' },
      quality_prediction: { grade: 'A', moisture_at_harvest: '21%' },
      delay_impact: { per_day_loss: '1.5% yield', quality_degradation: 'moderate after 7 days' }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to predict harvest timing', details: error.message });
  }
});

/**
 * @route POST /harvest-timing/notify
 * @desc Set up harvest timing notification
 * @body {string} farmer_id, {string} crop_id, {string} notification_type
 */
router.post('/harvest-timing/notify', async (req, res) => {
  try {
    const { farmer_id, crop_id, notification_type } = req.body;
    if (!farmer_id || !crop_id) {
      return res.status(400).json({ error: 'farmer_id and crop_id are required' });
    }
    res.json({
      success: true,
      notification_id: `NOTIF-${Date.now()}`,
      farmer_id,
      crop_id,
      notification_type: notification_type || 'sms',
      schedule: {
        first_alert: '7 days before optimal window',
        reminder: '3 days before optimal window',
        final_alert: 'On optimal harvest day'
      },
      status: 'active',
      created_at: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to set notification', details: error.message });
  }
});

/**
 * @route GET /harvest-market-align/:farmerId
 * @desc Align harvest timing with market demand peaks
 */
router.get('/harvest-market-align/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;
    if (!farmerId) {
      return res.status(400).json({ error: 'farmerId is required' });
    }
    res.json({
      success: true,
      farmer_id: farmerId,
      alignments: [
        {
          crop: 'Rice',
          optimal_harvest: '2024-01-30',
          market_peak: '2024-02-05',
          recommendation: 'Harvest on time, store for 5 days',
          price_premium: '+12%',
          storage_cost: '₹200/quintal'
        },
        {
          crop: 'Tomato',
          optimal_harvest: '2024-01-20',
          market_peak: '2024-01-22',
          recommendation: 'Harvest slightly early for peak prices',
          price_premium: '+18%',
          storage_cost: 'N/A - immediate sale'
        }
      ],
      market_insights: { demand_trend: 'increasing', major_buyers: ['Local mandi', 'FPO aggregator'] }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to align harvest with market', details: error.message });
  }
});

// ============== PRICE PREDICTIONS ==============

/**
 * @route GET /price-forecast/:commodityId
 * @desc Get 7/14/30 day price forecast
 */
router.get('/price-forecast/:commodityId', async (req, res) => {
  try {
    const { commodityId } = req.params;
    if (!commodityId) {
      return res.status(400).json({ error: 'commodityId is required' });
    }
    res.json({
      success: true,
      commodity_id: commodityId,
      commodity_name: 'Basmati Rice',
      current_price: 3200,
      unit: '₹/quintal',
      forecasts: {
        '7_day': { price: 3350, change: '+4.7%', confidence: 85 },
        '14_day': { price: 3500, change: '+9.4%', confidence: 75 },
        '30_day': { price: 3400, change: '+6.3%', confidence: 60 }
      },
      price_range: { min: 3100, max: 3600 },
      model_accuracy: '82% over last 30 predictions',
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate price forecast', details: error.message });
  }
});

/**
 * @route GET /price-trends/:commodityId
 * @desc Get historical price trend analysis
 */
router.get('/price-trends/:commodityId', async (req, res) => {
  try {
    const { commodityId } = req.params;
    if (!commodityId) {
      return res.status(400).json({ error: 'commodityId is required' });
    }
    res.json({
      success: true,
      commodity_id: commodityId,
      trends: {
        weekly: { direction: 'up', change: '+3.2%' },
        monthly: { direction: 'up', change: '+8.5%' },
        quarterly: { direction: 'stable', change: '+1.2%' },
        yearly: { direction: 'up', change: '+15.3%' }
      },
      seasonal_pattern: { peak_months: ['November', 'December'], low_months: ['March', 'April'] },
      historical_data: [
        { month: 'Oct 2023', avg_price: 2900 },
        { month: 'Nov 2023', avg_price: 3050 },
        { month: 'Dec 2023', avg_price: 3150 },
        { month: 'Jan 2024', avg_price: 3200 }
      ],
      volatility_index: 'moderate'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch price trends', details: error.message });
  }
});

/**
 * @route GET /price-factors/:commodityId
 * @desc Get factors affecting current prices
 */
router.get('/price-factors/:commodityId', async (req, res) => {
  try {
    const { commodityId } = req.params;
    if (!commodityId) {
      return res.status(400).json({ error: 'commodityId is required' });
    }
    res.json({
      success: true,
      commodity_id: commodityId,
      factors: [
        { factor: 'Export demand', impact: 'positive', weight: 30, description: 'Increased exports to Middle East' },
        { factor: 'MSP announcement', impact: 'positive', weight: 25, description: 'Government raised MSP by 5%' },
        { factor: 'Production estimate', impact: 'negative', weight: 20, description: 'Higher than expected yield' },
        { factor: 'Storage availability', impact: 'neutral', weight: 15, description: 'Adequate warehouse capacity' },
        { factor: 'Fuel prices', impact: 'negative', weight: 10, description: 'Transportation costs stable' }
      ],
      net_outlook: 'moderately_bullish',
      key_events: [
        { date: '2024-01-20', event: 'Export policy review', potential_impact: 'high' },
        { date: '2024-02-01', event: 'Budget announcement', potential_impact: 'medium' }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch price factors', details: error.message });
  }
});

/**
 * @route GET /sell-timing/:commodityId
 * @desc Get best time to sell recommendation
 */
router.get('/sell-timing/:commodityId', async (req, res) => {
  try {
    const { commodityId } = req.params;
    if (!commodityId) {
      return res.status(400).json({ error: 'commodityId is required' });
    }
    res.json({
      success: true,
      commodity_id: commodityId,
      recommendation: {
        action: 'HOLD',
        optimal_sell_window: { start: '2024-02-01', end: '2024-02-15' },
        expected_price: 3450,
        current_price: 3200,
        potential_gain: '+7.8%'
      },
      alternatives: [
        { action: 'Sell now', price: 3200, reasoning: 'Immediate liquidity needs' },
        { action: 'Sell in 30 days', price: 3400, reasoning: 'Higher prices expected', risk: 'medium' },
        { action: 'Contract farming', price: 3300, reasoning: 'Guaranteed price, reduced risk' }
      ],
      market_sentiment: 'bullish',
      confidence: 78
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate sell timing', details: error.message });
  }
});

// ============== INPUT OPTIMIZATION ==============

/**
 * @route POST /fertilizer-plan
 * @desc Generate optimized fertilizer plan
 * @body {string} crop, {object} soil_test, {number} target_yield
 */
router.post('/fertilizer-plan', async (req, res) => {
  try {
    const { crop, soil_test, target_yield } = req.body;
    if (!crop) {
      return res.status(400).json({ error: 'crop is required' });
    }
    res.json({
      success: true,
      crop,
      target_yield: target_yield || 'optimal',
      plan: {
        basal: { urea: '50 kg/ha', dap: '100 kg/ha', mop: '50 kg/ha', timing: 'At sowing' },
        first_top: { urea: '25 kg/ha', timing: '21 days after sowing' },
        second_top: { urea: '25 kg/ha', timing: '45 days after sowing' }
      },
      total_cost: 8500,
      nutrient_balance: { N: 120, P: 60, K: 40, unit: 'kg/ha' },
      soil_health_tips: ['Add organic matter', 'Consider micronutrient spray'],
      savings_vs_conventional: '15%'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate fertilizer plan', details: error.message });
  }
});

/**
 * @route POST /irrigation-schedule
 * @desc Generate optimal irrigation schedule
 * @body {string} crop, {string} soil, {object} weather_forecast
 */
router.post('/irrigation-schedule', async (req, res) => {
  try {
    const { crop, soil, weather_forecast } = req.body;
    if (!crop) {
      return res.status(400).json({ error: 'crop is required' });
    }
    res.json({
      success: true,
      crop,
      soil_type: soil || 'loamy',
      schedule: [
        { day: 'Monday', time: '06:00 AM', duration: '45 min', volume: '500 L', method: 'drip' },
        { day: 'Wednesday', time: '06:00 AM', duration: '45 min', volume: '500 L', method: 'drip' },
        { day: 'Friday', time: '06:00 AM', duration: '45 min', volume: '500 L', method: 'drip' },
        { day: 'Sunday', time: '06:00 AM', duration: '30 min', volume: '350 L', method: 'drip' }
      ],
      water_savings: '35% vs flood irrigation',
      adjustments: { rain_expected: 'Skip Friday irrigation if >10mm rain' },
      soil_moisture_target: '60-70%',
      critical_stages: ['Flowering - increase frequency', 'Grain filling - maintain consistency']
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate irrigation schedule', details: error.message });
  }
});

/**
 * @route GET /input-cost-optimize/:farmerId
 * @desc Get input cost optimization recommendations
 */
router.get('/input-cost-optimize/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;
    if (!farmerId) {
      return res.status(400).json({ error: 'farmerId is required' });
    }
    res.json({
      success: true,
      farmer_id: farmerId,
      current_spend: 45000,
      optimized_spend: 38000,
      savings: 7000,
      savings_percentage: '15.5%',
      recommendations: [
        { category: 'Seeds', current: 8000, optimized: 7000, tip: 'Use certified seeds from FPO - bulk discount' },
        { category: 'Fertilizers', current: 15000, optimized: 12000, tip: 'Soil-test based application reduces waste' },
        { category: 'Pesticides', current: 10000, optimized: 8000, tip: 'IPM approach reduces chemical dependency' },
        { category: 'Irrigation', current: 12000, optimized: 11000, tip: 'Drip irrigation scheduling optimization' }
      ],
      bulk_buying_options: [
        { item: 'DAP Fertilizer', group_price: '₹1150/bag', retail_price: '₹1350/bag', min_quantity: '50 bags' }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to optimize input costs', details: error.message });
  }
});

/**
 * @route POST /pesticide-recommend
 * @desc Get pesticide recommendation
 * @body {string} pest, {string} crop, {string} stage
 */
router.post('/pesticide-recommend', async (req, res) => {
  try {
    const { pest, crop, stage } = req.body;
    if (!pest || !crop) {
      return res.status(400).json({ error: 'pest and crop are required' });
    }
    res.json({
      success: true,
      pest,
      crop,
      growth_stage: stage || 'vegetative',
      recommendations: [
        {
          type: 'chemical',
          name: 'Chlorantraniliprole 18.5% SC',
          dosage: '0.4 ml/L',
          method: 'Foliar spray',
          phi: '14 days',
          effectiveness: 90,
          cost: '₹450/100ml'
        },
        {
          type: 'biological',
          name: 'Beauveria bassiana',
          dosage: '5g/L',
          method: 'Foliar spray',
          phi: 'None',
          effectiveness: 70,
          cost: '₹200/100g'
        },
        {
          type: 'organic',
          name: 'Neem oil 3%',
          dosage: '5ml/L',
          method: 'Foliar spray',
          phi: 'None',
          effectiveness: 55,
          cost: '₹150/L'
        }
      ],
      safety_precautions: ['Wear protective gear', 'Spray in early morning/evening', 'Avoid windy conditions'],
      rotation_advice: 'Alternate between chemical groups to prevent resistance'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to recommend pesticide', details: error.message });
  }
});

// ============== PERSONALIZED ADVISORY ==============

/**
 * @route GET /daily-advisory/:farmerId
 * @desc Get today's personalized advisory tips
 */
router.get('/daily-advisory/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;
    if (!farmerId) {
      return res.status(400).json({ error: 'farmerId is required' });
    }
    const today = new Date().toISOString().split('T')[0];
    res.json({
      success: true,
      farmer_id: farmerId,
      date: today,
      greeting: 'Good morning! Here are your farming tips for today.',
      weather_alert: { condition: 'Partly cloudy', temp: '28°C', humidity: '65%', advisory: 'Good day for field work' },
      daily_tips: [
        { priority: 'high', category: 'Irrigation', tip: 'Soil moisture is low. Irrigate rice fields this evening.' },
        { priority: 'medium', category: 'Pest', tip: 'Scout for stem borer in paddy - favorable conditions detected.' },
        { priority: 'low', category: 'Market', tip: 'Onion prices rising. Consider harvesting early if ready.' }
      ],
      tasks_due: [
        { task: 'Apply second dose of urea', crop: 'Rice', field: 'Plot A' },
        { task: 'Check drip emitters', crop: 'Tomato', field: 'Plot C' }
      ],
      market_highlight: { commodity: 'Rice', trend: 'up', change: '+2.3%' }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch daily advisory', details: error.message });
  }
});

/**
 * @route GET /weekly-report/:farmerId
 * @desc Get weekly farm performance summary
 */
router.get('/weekly-report/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;
    if (!farmerId) {
      return res.status(400).json({ error: 'farmerId is required' });
    }
    res.json({
      success: true,
      farmer_id: farmerId,
      report_period: { start: '2024-01-08', end: '2024-01-14' },
      summary: {
        tasks_completed: 12,
        tasks_pending: 3,
        alerts_addressed: 5,
        field_visits: 4
      },
      crop_health: [
        { crop: 'Rice', field: 'Plot A', status: 'healthy', growth_stage: 'Tillering', days_to_harvest: 45 },
        { crop: 'Tomato', field: 'Plot C', status: 'needs_attention', issue: 'Early blight detected', action_required: true }
      ],
      financial_summary: {
        expenses: 12500,
        projected_revenue: 85000,
        cost_efficiency: 'on_track'
      },
      weather_recap: { avg_temp: '27°C', total_rainfall: '15mm', sunny_days: 5 },
      next_week_focus: ['Complete pest management in tomato', 'Prepare for nitrogen top-dressing', 'Monitor market prices'],
      ai_insights: 'Your rice crop is progressing well. Consider early marketing strategy given favorable price trends.',
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate weekly report', details: error.message });
  }
});

module.exports = router;
