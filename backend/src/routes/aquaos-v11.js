/**
 * AquaOS V11 — Aquaculture Supply Chain & Export Compliance
 * Features:
 *   1. Contract Aquaculture (buyer-farmer forward contracts for aqua products)
 *   2. Labor Management (pond workers, feeding staff, harvest crews)
 *   3. Insurance Integration (crop insurance for aquaculture, claims workflow)
 *   4. Export Compliance (MPEDA, EU/FDA certifications, traceability docs)
 *   5. Multi-Farm Portfolio (aggregated view across multiple farms/ponds)
 *   6. Aqua Input Supply Chain (feed, probiotics, chemicals sourcing)
 *   7. Harvest Planning & Scheduling (coordinated harvest with logistics)
 */
'use strict';

const { Router } = require('express');
const { pool } = require('../db/pool');

const router = Router();

// ═══════════════════════════════════════════════════════════════════
//  1. CONTRACT AQUACULTURE — Forward contracts for shrimp/fish
// ═══════════════════════════════════════════════════════════════════

// Create aqua contract
router.post('/contracts', async (req, res) => {
  try {
    const {
      buyer_id, farmer_id, species_id, variety, quantity_kg, price_per_kg,
      quality_grade, delivery_start, delivery_end, delivery_location,
      advance_amount, pond_ids, certification_required, terms
    } = req.body;

    if (!buyer_id || !farmer_id || !species_id || !quantity_kg || !price_per_kg) {
      return res.status(400).json({ error: 'buyer_id, farmer_id, species_id, quantity_kg, price_per_kg required' });
    }

    const result = await pool.query(`
      INSERT INTO aqua_contracts (
        buyer_id, farmer_id, species_id, variety, quantity_kg, price_per_kg,
        quality_grade, delivery_start, delivery_end, delivery_location,
        advance_amount, total_value, pond_ids, certification_required, terms
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *
    `, [
      buyer_id, farmer_id, species_id, variety, quantity_kg, price_per_kg,
      quality_grade || 'A', delivery_start, delivery_end, delivery_location,
      advance_amount || 0, quantity_kg * price_per_kg,
      JSON.stringify(pond_ids || []), certification_required || false,
      JSON.stringify(terms || {})
    ]);

    res.status(201).json({ contract: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List contracts
router.get('/contracts', async (req, res) => {
  try {
    const { user_id, status, role } = req.query;
    let query = 'SELECT * FROM aqua_contracts WHERE 1=1';
    const params = [];

    if (user_id && role === 'buyer') {
      params.push(user_id);
      query += ` AND buyer_id = $${params.length}`;
    } else if (user_id) {
      params.push(user_id);
      query += ` AND farmer_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    query += ' ORDER BY created_at DESC LIMIT 50';

    const result = await pool.query(query, params);
    res.json({ contracts: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sign contract
router.patch('/contracts/:id/sign', async (req, res) => {
  try {
    const { id } = req.params;
    const { signer_role } = req.body; // 'buyer' or 'farmer'

    const field = signer_role === 'buyer' ? 'signed_by_buyer' : 'signed_by_farmer';
    await pool.query(
      `UPDATE aqua_contracts SET ${field} = true, updated_at = NOW() WHERE id = $1`,
      [id]
    );

    // Check if both signed
    const contract = await pool.query('SELECT * FROM aqua_contracts WHERE id = $1', [id]);
    if (contract.rows[0]?.signed_by_buyer && contract.rows[0]?.signed_by_farmer) {
      await pool.query(
        `UPDATE aqua_contracts SET status = 'active', signed_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [id]
      );
    }

    res.json({ success: true, contract: contract.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update contract status
router.patch('/contracts/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['proposed','negotiating','active','advance_paid','growing','harvest_ready','quality_check','delivered','completed','cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const result = await pool.query(
      `UPDATE aqua_contracts SET status = $1, notes = COALESCE($2, notes), updated_at = NOW() WHERE id = $3 RETURNING *`,
      [status, notes, id]
    );
    res.json({ contract: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  2. LABOR MANAGEMENT — Pond workers, harvest crews
// ═══════════════════════════════════════════════════════════════════

// Register labor
router.post('/labor', async (req, res) => {
  try {
    const {
      farm_id, name, phone, role, skill_level, daily_wage,
      available_from, available_to, specializations
    } = req.body;

    if (!name || !phone || !role) {
      return res.status(400).json({ error: 'name, phone, role required' });
    }

    const result = await pool.query(`
      INSERT INTO aqua_labor (farm_id, name, phone, role, skill_level, daily_wage, available_from, available_to, specializations)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [farm_id, name, phone, role, skill_level || 'intermediate', daily_wage, available_from, available_to, JSON.stringify(specializations || [])]);

    res.status(201).json({ worker: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List labor
router.get('/labor', async (req, res) => {
  try {
    const { farm_id, role, available } = req.query;
    let query = 'SELECT * FROM aqua_labor WHERE 1=1';
    const params = [];

    if (farm_id) { params.push(farm_id); query += ` AND farm_id = $${params.length}`; }
    if (role) { params.push(role); query += ` AND role = $${params.length}`; }
    if (available === 'true') { query += ' AND is_active = true'; }
    query += ' ORDER BY name LIMIT 100';

    const result = await pool.query(query, params);
    res.json({ workers: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Log labor attendance/work
router.post('/labor/attendance', async (req, res) => {
  try {
    const { worker_id, farm_id, work_date, hours_worked, task_type, pond_id, notes } = req.body;
    const result = await pool.query(`
      INSERT INTO aqua_labor_logs (worker_id, farm_id, work_date, hours_worked, task_type, pond_id, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [worker_id, farm_id, work_date || new Date().toISOString().split('T')[0], hours_worked || 8, task_type, pond_id, notes]);

    res.status(201).json({ log: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Labor cost summary
router.get('/labor/costs', async (req, res) => {
  try {
    const { farm_id, month, year } = req.query;
    const result = await pool.query(`
      SELECT l.role, COUNT(DISTINCT l.id) as worker_count,
             SUM(ll.hours_worked) as total_hours,
             SUM(ll.hours_worked * (l.daily_wage / 8.0)) as total_cost
      FROM aqua_labor l
      JOIN aqua_labor_logs ll ON ll.worker_id = l.id
      WHERE l.farm_id = $1
        AND EXTRACT(MONTH FROM ll.work_date) = $2
        AND EXTRACT(YEAR FROM ll.work_date) = $3
      GROUP BY l.role
      ORDER BY total_cost DESC
    `, [farm_id, month || new Date().getMonth() + 1, year || new Date().getFullYear()]);

    res.json({ costs: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  3. INSURANCE INTEGRATION — Aquaculture crop insurance
// ═══════════════════════════════════════════════════════════════════

// List available insurance products
router.get('/insurance/products', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM aqua_insurance_products WHERE is_active = true ORDER BY provider_name'
    );
    res.json({ products: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Apply for insurance
router.post('/insurance/apply', async (req, res) => {
  try {
    const {
      farmer_id, product_id, pond_ids, species_id, culture_area_acres,
      sum_insured, premium_amount, season, start_date, end_date
    } = req.body;

    if (!farmer_id || !product_id || !sum_insured) {
      return res.status(400).json({ error: 'farmer_id, product_id, sum_insured required' });
    }

    const result = await pool.query(`
      INSERT INTO aqua_insurance_policies (
        farmer_id, product_id, pond_ids, species_id, culture_area_acres,
        sum_insured, premium_amount, season, coverage_start, coverage_end
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
    `, [
      farmer_id, product_id, JSON.stringify(pond_ids || []), species_id,
      culture_area_acres, sum_insured, premium_amount, season, start_date, end_date
    ]);

    res.status(201).json({ policy: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List my policies
router.get('/insurance/policies', async (req, res) => {
  try {
    const { farmer_id } = req.query;
    const result = await pool.query(
      'SELECT * FROM aqua_insurance_policies WHERE farmer_id = $1 ORDER BY created_at DESC',
      [farmer_id]
    );
    res.json({ policies: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// File insurance claim
router.post('/insurance/claims', async (req, res) => {
  try {
    const {
      policy_id, claim_type, loss_date, loss_description,
      estimated_loss_amount, evidence_photos, pond_id
    } = req.body;

    if (!policy_id || !claim_type || !loss_date) {
      return res.status(400).json({ error: 'policy_id, claim_type, loss_date required' });
    }

    const result = await pool.query(`
      INSERT INTO aqua_insurance_claims (
        policy_id, claim_type, loss_date, loss_description,
        estimated_loss_amount, evidence_photos, pond_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [policy_id, claim_type, loss_date, loss_description, estimated_loss_amount, JSON.stringify(evidence_photos || []), pond_id]);

    res.status(201).json({ claim: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get claims
router.get('/insurance/claims', async (req, res) => {
  try {
    const { policy_id, farmer_id } = req.query;
    let query = 'SELECT c.*, p.policy_number FROM aqua_insurance_claims c JOIN aqua_insurance_policies p ON p.id = c.policy_id WHERE 1=1';
    const params = [];

    if (policy_id) { params.push(policy_id); query += ` AND c.policy_id = $${params.length}`; }
    if (farmer_id) { params.push(farmer_id); query += ` AND p.farmer_id = $${params.length}`; }
    query += ' ORDER BY c.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ claims: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  4. EXPORT COMPLIANCE — MPEDA, EU, FDA certifications
// ═══════════════════════════════════════════════════════════════════

// Get compliance checklist for export
router.get('/export/checklist', async (req, res) => {
  try {
    const { destination_market, species_id } = req.query;
    const result = await pool.query(
      `SELECT * FROM aqua_export_requirements 
       WHERE (destination_market = $1 OR destination_market = 'all')
       AND (species_id = $2 OR species_id IS NULL)
       ORDER BY category, sort_order`,
      [destination_market || 'EU', species_id]
    );
    res.json({ requirements: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit export application
router.post('/export/applications', async (req, res) => {
  try {
    const {
      farmer_id, exporter_id, species_id, quantity_kg, destination_country,
      destination_market, processing_plant_id, harvest_date, documents
    } = req.body;

    if (!farmer_id || !species_id || !destination_country) {
      return res.status(400).json({ error: 'farmer_id, species_id, destination_country required' });
    }

    const result = await pool.query(`
      INSERT INTO aqua_export_applications (
        farmer_id, exporter_id, species_id, quantity_kg, destination_country,
        destination_market, processing_plant_id, harvest_date, documents
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [
      farmer_id, exporter_id, species_id, quantity_kg, destination_country,
      destination_market || 'EU', processing_plant_id, harvest_date,
      JSON.stringify(documents || {})
    ]);

    res.status(201).json({ application: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List export applications
router.get('/export/applications', async (req, res) => {
  try {
    const { farmer_id, status } = req.query;
    let query = 'SELECT * FROM aqua_export_applications WHERE 1=1';
    const params = [];

    if (farmer_id) { params.push(farmer_id); query += ` AND farmer_id = $${params.length}`; }
    if (status) { params.push(status); query += ` AND status = $${params.length}`; }
    query += ' ORDER BY created_at DESC LIMIT 50';

    const result = await pool.query(query, params);
    res.json({ applications: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test results / lab reports
router.post('/export/lab-results', async (req, res) => {
  try {
    const { application_id, test_type, lab_name, result_value, unit, pass_fail, report_url, tested_date } = req.body;

    const insertResult = await pool.query(`
      INSERT INTO aqua_lab_results (application_id, test_type, lab_name, result_value, unit, pass_fail, report_url, tested_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [application_id, test_type, lab_name, result_value, unit, pass_fail || 'pending', report_url, tested_date]);

    res.status(201).json({ result: insertResult.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  5. MULTI-FARM PORTFOLIO — Aggregated view
// ═══════════════════════════════════════════════════════════════════

// Portfolio summary
router.get('/portfolio/summary', async (req, res) => {
  try {
    const { owner_id } = req.query;
    if (!owner_id) return res.status(400).json({ error: 'owner_id required' });

    const farms = await pool.query(
      'SELECT * FROM aqua_farms WHERE owner_id = $1 ORDER BY name', [owner_id]
    );

    const stats = await pool.query(`
      SELECT 
        COUNT(DISTINCT f.id) as total_farms,
        SUM(f.total_area_acres) as total_area,
        COUNT(DISTINCT p.id) as total_ponds,
        SUM(p.area_sqm) as total_pond_area,
        AVG(p.survival_pct) as avg_survival,
        SUM(CASE WHEN p.status = 'active' THEN 1 ELSE 0 END) as active_ponds
      FROM aqua_farms f
      LEFT JOIN aqua_ponds_v11 p ON p.farm_id = f.id
      WHERE f.owner_id = $1
    `, [owner_id]);

    const financials = await pool.query(`
      SELECT 
        SUM(total_investment) as total_invested,
        SUM(total_revenue) as total_revenue,
        SUM(total_revenue - total_investment) as net_profit
      FROM aqua_farm_financials
      WHERE farm_id IN (SELECT id FROM aqua_farms WHERE owner_id = $1)
        AND season = (SELECT MAX(season) FROM aqua_farm_financials)
    `, [owner_id]);

    res.json({
      farms: farms.rows,
      stats: stats.rows[0],
      financials: financials.rows[0] || {},
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register farm
router.post('/portfolio/farms', async (req, res) => {
  try {
    const { owner_id, name, location, district, total_area_acres, water_source, infrastructure } = req.body;
    if (!owner_id || !name) return res.status(400).json({ error: 'owner_id and name required' });

    const result = await pool.query(`
      INSERT INTO aqua_farms (owner_id, name, location, district, total_area_acres, water_source, infrastructure)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [owner_id, name, location, district, total_area_acres, water_source, JSON.stringify(infrastructure || {})]);

    res.status(201).json({ farm: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Farm-level financials
router.post('/portfolio/financials', async (req, res) => {
  try {
    const { farm_id, season, year, total_investment, total_revenue, cost_breakdown, revenue_breakdown } = req.body;
    const result = await pool.query(`
      INSERT INTO aqua_farm_financials (farm_id, season, year, total_investment, total_revenue, cost_breakdown, revenue_breakdown)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (farm_id, season, year) DO UPDATE SET
        total_investment = EXCLUDED.total_investment,
        total_revenue = EXCLUDED.total_revenue,
        cost_breakdown = EXCLUDED.cost_breakdown,
        revenue_breakdown = EXCLUDED.revenue_breakdown,
        updated_at = NOW()
      RETURNING *
    `, [farm_id, season, year, total_investment, total_revenue, JSON.stringify(cost_breakdown || {}), JSON.stringify(revenue_breakdown || {})]);

    res.status(201).json({ financials: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  6. AQUA INPUT SUPPLY CHAIN — Feed, probiotics, chemicals
// ═══════════════════════════════════════════════════════════════════

// List aqua input suppliers
router.get('/inputs/suppliers', async (req, res) => {
  try {
    const { category, district } = req.query;
    let query = 'SELECT * FROM aqua_input_suppliers WHERE is_active = true';
    const params = [];

    if (category) { params.push(category); query += ` AND $${params.length} = ANY(categories)`; }
    if (district) { params.push(district); query += ` AND district = $${params.length}`; }
    query += ' ORDER BY rating DESC LIMIT 50';

    const result = await pool.query(query, params);
    res.json({ suppliers: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Place input order
router.post('/inputs/orders', async (req, res) => {
  try {
    const { farm_id, supplier_id, items, delivery_date, notes } = req.body;
    if (!farm_id || !supplier_id || !items?.length) {
      return res.status(400).json({ error: 'farm_id, supplier_id, items required' });
    }

    const totalAmount = items.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0);
    const result = await pool.query(`
      INSERT INTO aqua_input_orders (farm_id, supplier_id, items, total_amount, delivery_date, notes)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [farm_id, supplier_id, JSON.stringify(items), totalAmount, delivery_date, notes]);

    res.status(201).json({ order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List input orders
router.get('/inputs/orders', async (req, res) => {
  try {
    const { farm_id, status } = req.query;
    let query = 'SELECT * FROM aqua_input_orders WHERE 1=1';
    const params = [];

    if (farm_id) { params.push(farm_id); query += ` AND farm_id = $${params.length}`; }
    if (status) { params.push(status); query += ` AND status = $${params.length}`; }
    query += ' ORDER BY created_at DESC LIMIT 50';

    const result = await pool.query(query, params);
    res.json({ orders: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  7. HARVEST PLANNING & SCHEDULING
// ═══════════════════════════════════════════════════════════════════

// Create harvest plan
router.post('/harvest/plan', async (req, res) => {
  try {
    const {
      farm_id, pond_ids, planned_date, estimated_quantity_kg,
      buyer_id, contract_id, logistics_partner_id, crew_size, notes
    } = req.body;

    if (!farm_id || !pond_ids?.length || !planned_date) {
      return res.status(400).json({ error: 'farm_id, pond_ids, planned_date required' });
    }

    const result = await pool.query(`
      INSERT INTO aqua_harvest_plans (
        farm_id, pond_ids, planned_date, estimated_quantity_kg,
        buyer_id, contract_id, logistics_partner_id, crew_size, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [
      farm_id, JSON.stringify(pond_ids), planned_date, estimated_quantity_kg,
      buyer_id, contract_id, logistics_partner_id, crew_size || 5, notes
    ]);

    res.status(201).json({ plan: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List harvest plans
router.get('/harvest/plans', async (req, res) => {
  try {
    const { farm_id, status } = req.query;
    let query = 'SELECT * FROM aqua_harvest_plans WHERE 1=1';
    const params = [];

    if (farm_id) { params.push(farm_id); query += ` AND farm_id = $${params.length}`; }
    if (status) { params.push(status); query += ` AND status = $${params.length}`; }
    query += ' ORDER BY planned_date DESC LIMIT 30';

    const result = await pool.query(query, params);
    res.json({ plans: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Record harvest result
router.post('/harvest/result', async (req, res) => {
  try {
    const {
      plan_id, actual_quantity_kg, average_size_g, survival_pct,
      grade_distribution, actual_date, temperature_at_harvest, notes
    } = req.body;

    const result = await pool.query(`
      UPDATE aqua_harvest_plans SET
        actual_quantity_kg = $1, average_size_g = $2, survival_pct = $3,
        grade_distribution = $4, actual_date = $5, temperature_at_harvest = $6,
        notes = COALESCE($7, notes), status = 'completed', updated_at = NOW()
      WHERE id = $8 RETURNING *
    `, [actual_quantity_kg, average_size_g, survival_pct, JSON.stringify(grade_distribution || {}), actual_date, temperature_at_harvest, notes, plan_id]);

    res.json({ result: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
