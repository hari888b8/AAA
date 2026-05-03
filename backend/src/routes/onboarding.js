'use strict';

const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authMiddleware: auth } = require('../middleware/auth');

// ═══════════════════════════════════════════════════════════════
// MULTI-STAKEHOLDER ONBOARDING — Exporter, Supplier, Bank Partner
// Each role has a tailored registration flow
// ═══════════════════════════════════════════════════════════════

// POST /api/onboarding/exporter — Register as exporter
router.post('/exporter', auth, async (req, res) => {
  try {
    const { company_name, export_license, iec_code, fssai_license,
            countries_exported, crops_interested, annual_volume_tonnes,
            quality_certifications, warehouse_locations } = req.body;

    if (!company_name) return res.status(400).json({ error: 'company_name is required' });

    // Update user type
    await pool.query("UPDATE users SET user_type = 'exporter' WHERE id = $1", [req.user.id]);

    const result = await pool.query(`
      INSERT INTO exporter_profiles (user_id, company_name, export_license, iec_code, fssai_license,
        countries_exported, crops_interested, annual_volume_tonnes,
        quality_certifications, warehouse_locations)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (user_id) DO UPDATE SET
        company_name = EXCLUDED.company_name,
        export_license = EXCLUDED.export_license,
        iec_code = EXCLUDED.iec_code,
        fssai_license = EXCLUDED.fssai_license,
        countries_exported = EXCLUDED.countries_exported,
        crops_interested = EXCLUDED.crops_interested,
        annual_volume_tonnes = EXCLUDED.annual_volume_tonnes,
        quality_certifications = EXCLUDED.quality_certifications,
        warehouse_locations = EXCLUDED.warehouse_locations
      RETURNING *
    `, [req.user.id, company_name, export_license, iec_code, fssai_license,
        countries_exported || [], crops_interested || [], annual_volume_tonnes,
        quality_certifications || [], JSON.stringify(warehouse_locations || [])]);

    res.status(201).json({ profile: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/onboarding/supplier — Register as input supplier
router.post('/supplier', auth, async (req, res) => {
  try {
    const { company_name, supplier_type, license_number, gst_number,
            product_categories, district_ids, delivery_available,
            minimum_order, credit_offered, credit_days } = req.body;

    if (!company_name || !supplier_type) {
      return res.status(400).json({ error: 'company_name and supplier_type are required' });
    }

    // Update user type
    await pool.query("UPDATE users SET user_type = 'input_supplier' WHERE id = $1", [req.user.id]);

    const result = await pool.query(`
      INSERT INTO supplier_profiles (user_id, company_name, supplier_type, license_number, gst_number,
        product_categories, district_ids, delivery_available, minimum_order, credit_offered, credit_days)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (user_id) DO UPDATE SET
        company_name = EXCLUDED.company_name,
        supplier_type = EXCLUDED.supplier_type,
        license_number = EXCLUDED.license_number,
        gst_number = EXCLUDED.gst_number,
        product_categories = EXCLUDED.product_categories,
        district_ids = EXCLUDED.district_ids,
        delivery_available = EXCLUDED.delivery_available,
        minimum_order = EXCLUDED.minimum_order,
        credit_offered = EXCLUDED.credit_offered,
        credit_days = EXCLUDED.credit_days
      RETURNING *
    `, [req.user.id, company_name, supplier_type, license_number, gst_number,
        product_categories || [], district_ids || [], delivery_available !== false,
        minimum_order || 0, credit_offered || false, credit_days || 0]);

    res.status(201).json({ profile: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/onboarding/bank-partner — Register as bank/NBFC partner
router.post('/bank-partner', auth, async (req, res) => {
  try {
    const { institution_name, institution_type, license_number,
            districts_served, products_offered, interest_range,
            max_loan_amount, api_enabled, webhook_url } = req.body;

    if (!institution_name || !institution_type) {
      return res.status(400).json({ error: 'institution_name and institution_type are required' });
    }

    // Update user type
    await pool.query("UPDATE users SET user_type = 'bank_partner' WHERE id = $1", [req.user.id]);

    const result = await pool.query(`
      INSERT INTO bank_partners (user_id, institution_name, institution_type, license_number,
        districts_served, products_offered, interest_range, max_loan_amount, api_enabled, webhook_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (user_id) DO UPDATE SET
        institution_name = EXCLUDED.institution_name,
        institution_type = EXCLUDED.institution_type,
        license_number = EXCLUDED.license_number,
        districts_served = EXCLUDED.districts_served,
        products_offered = EXCLUDED.products_offered,
        interest_range = EXCLUDED.interest_range,
        max_loan_amount = EXCLUDED.max_loan_amount,
        api_enabled = EXCLUDED.api_enabled,
        webhook_url = EXCLUDED.webhook_url
      RETURNING *
    `, [req.user.id, institution_name, institution_type, license_number,
        districts_served || [], products_offered || [], interest_range,
        max_loan_amount, api_enabled || false, webhook_url]);

    res.status(201).json({ profile: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/onboarding/status — My onboarding completion status
router.get('/status', auth, async (req, res) => {
  try {
    const user = await pool.query('SELECT id, user_type, name, phone FROM users WHERE id = $1', [req.user.id]);
    const userType = user.rows[0]?.user_type || 'farmer';

    let profile = null;
    let completeness = 0;

    if (userType === 'exporter') {
      const ep = await pool.query('SELECT * FROM exporter_profiles WHERE user_id = $1', [req.user.id]);
      profile = ep.rows[0];
      if (profile) {
        const fields = ['company_name', 'export_license', 'iec_code', 'fssai_license'];
        completeness = Math.round(fields.filter(f => profile[f]).length / fields.length * 100);
      }
    } else if (userType === 'input_supplier') {
      const sp = await pool.query('SELECT * FROM supplier_profiles WHERE user_id = $1', [req.user.id]);
      profile = sp.rows[0];
      if (profile) {
        const fields = ['company_name', 'supplier_type', 'license_number', 'gst_number'];
        completeness = Math.round(fields.filter(f => profile[f]).length / fields.length * 100);
      }
    } else if (userType === 'bank_partner') {
      const bp = await pool.query('SELECT * FROM bank_partners WHERE user_id = $1', [req.user.id]);
      profile = bp.rows[0];
      if (profile) {
        const fields = ['institution_name', 'institution_type', 'license_number'];
        completeness = Math.round(fields.filter(f => profile[f]).length / fields.length * 100);
      }
    } else {
      // Farmer completeness
      const farmer = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
      const f = farmer.rows[0];
      const fields = ['name', 'phone', 'district_id', 'village', 'total_land_acres', 'soil_type'];
      completeness = Math.round(fields.filter(field => f[field]).length / fields.length * 100);
    }

    res.json({
      user_type: userType,
      completeness,
      profile,
      is_verified: profile?.is_verified || false
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/onboarding/verify — Submit verification documents
router.post('/verify', auth, async (req, res) => {
  try {
    const { document_type, document_number, document_url } = req.body;
    if (!document_type || !document_number) {
      return res.status(400).json({ error: 'document_type and document_number are required' });
    }

    // Store verification request (simple implementation — would integrate with KYC service)
    // For now, auto-mark as pending verification
    res.json({
      status: 'pending_verification',
      message: 'Document submitted for verification. Will be reviewed within 24-48 hours.',
      document_type,
      document_number
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
