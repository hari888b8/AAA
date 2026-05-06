/**
 * Migration V23 — AquaOS V11: Supply Chain & Export Compliance
 * Tables: aqua_contracts, aqua_labor, aqua_labor_logs, aqua_insurance_products,
 *         aqua_insurance_policies, aqua_insurance_claims, aqua_export_requirements,
 *         aqua_export_applications, aqua_lab_results, aqua_farms, aqua_ponds_v11,
 *         aqua_farm_financials, aqua_input_suppliers, aqua_input_orders,
 *         aqua_harvest_plans
 */
'use strict';

const { pool } = require('./pool');

async function migrateV23AquaOSV11() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ─── Contract Aquaculture ─────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS aqua_contracts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        buyer_id UUID,
        farmer_id UUID,
        species_id UUID,
        variety VARCHAR(100),
        quantity_kg DECIMAL(12,2) NOT NULL,
        price_per_kg DECIMAL(10,2) NOT NULL,
        quality_grade VARCHAR(20) DEFAULT 'A',
        delivery_start DATE,
        delivery_end DATE,
        delivery_location TEXT,
        advance_amount DECIMAL(12,2) DEFAULT 0,
        total_value DECIMAL(14,2),
        pond_ids JSONB DEFAULT '[]',
        certification_required BOOLEAN DEFAULT false,
        terms JSONB DEFAULT '{}',
        status VARCHAR(50) DEFAULT 'proposed',
        signed_by_buyer BOOLEAN DEFAULT false,
        signed_by_farmer BOOLEAN DEFAULT false,
        signed_at TIMESTAMPTZ,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── Labor Management ────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS aqua_labor (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        farm_id UUID,
        name VARCHAR(200) NOT NULL,
        phone VARCHAR(15),
        role VARCHAR(50) NOT NULL,
        skill_level VARCHAR(30) DEFAULT 'intermediate',
        daily_wage DECIMAL(8,2),
        available_from DATE,
        available_to DATE,
        specializations JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT true,
        total_days_worked INTEGER DEFAULT 0,
        rating DECIMAL(3,2) DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS aqua_labor_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        worker_id UUID REFERENCES aqua_labor(id),
        farm_id UUID,
        work_date DATE NOT NULL,
        hours_worked DECIMAL(4,1) DEFAULT 8,
        task_type VARCHAR(50),
        pond_id UUID,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── Insurance ───────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS aqua_insurance_products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        provider_name VARCHAR(200) NOT NULL,
        product_name VARCHAR(200) NOT NULL,
        product_type VARCHAR(50) DEFAULT 'crop',
        species_covered TEXT[] DEFAULT '{}',
        coverage_types TEXT[] DEFAULT '{}',
        premium_rate_pct DECIMAL(5,3),
        max_sum_insured DECIMAL(14,2),
        claim_settlement_days INTEGER DEFAULT 30,
        documents_required JSONB DEFAULT '[]',
        terms_url TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS aqua_insurance_policies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        farmer_id UUID,
        product_id UUID REFERENCES aqua_insurance_products(id),
        policy_number VARCHAR(50) DEFAULT ('POL-' || SUBSTR(gen_random_uuid()::text, 1, 8)),
        pond_ids JSONB DEFAULT '[]',
        species_id UUID,
        culture_area_acres DECIMAL(8,2),
        sum_insured DECIMAL(14,2) NOT NULL,
        premium_amount DECIMAL(12,2),
        season VARCHAR(30),
        coverage_start DATE,
        coverage_end DATE,
        status VARCHAR(30) DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS aqua_insurance_claims (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        policy_id UUID REFERENCES aqua_insurance_policies(id),
        claim_number VARCHAR(50) DEFAULT ('CLM-' || SUBSTR(gen_random_uuid()::text, 1, 8)),
        claim_type VARCHAR(50),
        loss_date DATE,
        loss_description TEXT,
        estimated_loss_amount DECIMAL(14,2),
        approved_amount DECIMAL(14,2),
        evidence_photos JSONB DEFAULT '[]',
        pond_id UUID,
        status VARCHAR(30) DEFAULT 'filed',
        inspector_notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── Export Compliance ────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS aqua_export_requirements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        destination_market VARCHAR(50) NOT NULL,
        species_id UUID,
        category VARCHAR(50),
        requirement_name VARCHAR(200) NOT NULL,
        description TEXT,
        document_needed VARCHAR(200),
        issuing_authority VARCHAR(200),
        validity_days INTEGER,
        sort_order INTEGER DEFAULT 0,
        is_mandatory BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS aqua_export_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        farmer_id UUID,
        exporter_id UUID,
        species_id UUID,
        quantity_kg DECIMAL(12,2),
        destination_country VARCHAR(100),
        destination_market VARCHAR(50) DEFAULT 'EU',
        processing_plant_id UUID,
        harvest_date DATE,
        documents JSONB DEFAULT '{}',
        compliance_status JSONB DEFAULT '{}',
        status VARCHAR(30) DEFAULT 'draft',
        mpeda_approval BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS aqua_lab_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id UUID REFERENCES aqua_export_applications(id),
        test_type VARCHAR(100),
        lab_name VARCHAR(200),
        result_value VARCHAR(100),
        unit VARCHAR(50),
        pass_fail VARCHAR(20) DEFAULT 'pending',
        report_url TEXT,
        tested_date DATE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── Multi-Farm Portfolio ─────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS aqua_farms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id UUID,
        name VARCHAR(200) NOT NULL,
        location TEXT,
        district VARCHAR(100),
        total_area_acres DECIMAL(10,2),
        water_source VARCHAR(100),
        infrastructure JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS aqua_ponds_v11 (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        farm_id UUID REFERENCES aqua_farms(id),
        pond_code VARCHAR(50),
        area_sqm DECIMAL(10,2),
        depth_m DECIMAL(4,2),
        species_id UUID,
        stocking_date DATE,
        stocking_density INTEGER,
        status VARCHAR(30) DEFAULT 'active',
        survival_pct DECIMAL(5,2),
        current_weight_g DECIMAL(8,2),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS aqua_farm_financials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        farm_id UUID REFERENCES aqua_farms(id),
        season VARCHAR(30),
        year INTEGER,
        total_investment DECIMAL(14,2) DEFAULT 0,
        total_revenue DECIMAL(14,2) DEFAULT 0,
        cost_breakdown JSONB DEFAULT '{}',
        revenue_breakdown JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(farm_id, season, year)
      )
    `);

    // ─── Aqua Input Supply Chain ─────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS aqua_input_suppliers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(200) NOT NULL,
        categories TEXT[] DEFAULT '{}',
        district VARCHAR(100),
        phone VARCHAR(15),
        address TEXT,
        rating DECIMAL(3,2) DEFAULT 0,
        delivery_available BOOLEAN DEFAULT true,
        min_order_amount DECIMAL(10,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS aqua_input_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        farm_id UUID,
        supplier_id UUID REFERENCES aqua_input_suppliers(id),
        items JSONB NOT NULL DEFAULT '[]',
        total_amount DECIMAL(12,2),
        delivery_date DATE,
        status VARCHAR(30) DEFAULT 'placed',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── Harvest Planning ────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS aqua_harvest_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        farm_id UUID,
        pond_ids JSONB DEFAULT '[]',
        planned_date DATE,
        actual_date DATE,
        estimated_quantity_kg DECIMAL(12,2),
        actual_quantity_kg DECIMAL(12,2),
        average_size_g DECIMAL(8,2),
        survival_pct DECIMAL(5,2),
        grade_distribution JSONB DEFAULT '{}',
        temperature_at_harvest DECIMAL(4,1),
        buyer_id UUID,
        contract_id UUID,
        logistics_partner_id UUID,
        crew_size INTEGER DEFAULT 5,
        status VARCHAR(30) DEFAULT 'planned',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ─── Indexes ─────────────────────────────────────────────
    await client.query('CREATE INDEX IF NOT EXISTS idx_aqua_contracts_buyer ON aqua_contracts(buyer_id, status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_aqua_contracts_farmer ON aqua_contracts(farmer_id, status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_aqua_labor_farm ON aqua_labor(farm_id, is_active)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_aqua_farms_owner ON aqua_farms(owner_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_aqua_harvest_farm ON aqua_harvest_plans(farm_id, planned_date)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_aqua_export_farmer ON aqua_export_applications(farmer_id, status)');

    // ─── Seed Data ───────────────────────────────────────────

    // Insurance products
    await client.query(`
      INSERT INTO aqua_insurance_products (provider_name, product_name, product_type, species_covered, coverage_types, premium_rate_pct, max_sum_insured, claim_settlement_days)
      VALUES
        ('Agriculture Insurance Co.', 'Shrimp Shield Plus', 'crop', '{vannamei,tiger_prawn}', '{disease,natural_calamity,water_quality}', 3.5, 5000000, 21),
        ('IFFCO Tokio', 'Aqua Guard', 'crop', '{vannamei,rohu,catla}', '{disease,flood,drought}', 4.0, 3000000, 30),
        ('National Insurance', 'Fish Protect', 'crop', '{rohu,catla,pangasius,tilapia}', '{disease,flood,theft}', 2.8, 2000000, 45),
        ('United India Insurance', 'Prawn Raksha', 'equipment', '{vannamei,tiger_prawn}', '{equipment,infrastructure,disease}', 5.0, 10000000, 15),
        ('Bajaj Allianz', 'Aqua Farm Cover', 'comprehensive', '{all}', '{disease,natural_calamity,equipment,water_quality,theft}', 6.0, 8000000, 20)
      ON CONFLICT DO NOTHING
    `);

    // Export requirements (EU market)
    await client.query(`
      INSERT INTO aqua_export_requirements (destination_market, category, requirement_name, description, document_needed, issuing_authority, validity_days, sort_order, is_mandatory)
      VALUES
        ('EU', 'registration', 'MPEDA Registration', 'Mandatory registration with Marine Products Export Development Authority', 'MPEDA Certificate', 'MPEDA', 365, 1, true),
        ('EU', 'registration', 'Processing Plant Approval', 'EU-approved processing plant certification', 'EU Approval Number', 'EIC/MPEDA', 730, 2, true),
        ('EU', 'testing', 'Antibiotic Residue Test', 'Test for banned antibiotics (chloramphenicol, nitrofurans)', 'Lab Certificate', 'NABL-accredited lab', 30, 3, true),
        ('EU', 'testing', 'Heavy Metals Test', 'Lead, cadmium, mercury within EU limits', 'Lab Certificate', 'NABL-accredited lab', 30, 4, true),
        ('EU', 'testing', 'Microbiological Test', 'Salmonella, E.coli, Vibrio testing', 'Lab Certificate', 'NABL-accredited lab', 15, 5, true),
        ('EU', 'documentation', 'Health Certificate', 'Official health certificate from competent authority', 'Health Certificate', 'EIC', 15, 6, true),
        ('EU', 'documentation', 'Certificate of Origin', 'Proof of Indian origin', 'CoO', 'Chamber of Commerce', 180, 7, true),
        ('EU', 'traceability', 'Traceability Documentation', 'Farm-to-fork traceability with batch/lot tracking', 'Traceability Record', 'Self-declared', 0, 8, true),
        ('USA', 'registration', 'FDA Registration', 'US FDA facility registration for exporters', 'FDA Registration', 'US FDA', 365, 1, true),
        ('USA', 'testing', 'Antibiotic Residue Test', 'FDA zero-tolerance for banned substances', 'Lab Certificate', 'NABL-accredited lab', 30, 2, true),
        ('USA', 'documentation', 'HACCP Certification', 'Hazard Analysis Critical Control Points', 'HACCP Certificate', 'Certifying body', 365, 3, true),
        ('Japan', 'testing', 'Ethoxyquin Test', 'Specific limit for ethoxyquin in feed-raised shrimp', 'Lab Certificate', 'NABL-accredited lab', 30, 1, true)
      ON CONFLICT DO NOTHING
    `);

    // Input suppliers
    await client.query(`
      INSERT INTO aqua_input_suppliers (name, categories, district, phone, delivery_available, rating)
      VALUES
        ('Avanti Feeds Ltd', '{feed,probiotics}', 'Krishna', '9876543210', true, 4.5),
        ('Waterbase Limited', '{feed,supplements}', 'Nellore', '9876543211', true, 4.3),
        ('CP Aquaculture', '{feed,seed,probiotics}', 'West Godavari', '9876543212', true, 4.7),
        ('Growel Feeds', '{feed,minerals}', 'East Godavari', '9876543213', true, 4.1),
        ('BMR Aqua', '{seed,probiotics,chemicals}', 'Prakasam', '9876543214', true, 4.0),
        ('Uni-President Feeds', '{feed}', 'Guntur', '9876543215', true, 4.4),
        ('Devi Sea Foods', '{seed,equipment}', 'Nellore', '9876543216', true, 3.9),
        ('Apex Frozen Foods', '{processing,packaging}', 'Krishna', '9876543217', false, 4.2)
      ON CONFLICT DO NOTHING
    `);

    await client.query('COMMIT');
    console.log('✅ Migration V23 (AquaOS V11 — Supply Chain & Export) complete');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration V23 failed:', err.message);
  } finally {
    client.release();
  }
}

module.exports = { migrateV23AquaOSV11 };
