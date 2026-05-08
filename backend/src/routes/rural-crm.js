/**
 * Smart Rural CRM System Routes
 * Features:
 *   1. Contact Management (farmers, buyers, FPOs, agents)
 *   2. Interaction Tracking (calls, visits, messages, orders)
 *   3. Contact Segmentation & Tagging
 *   4. Sales Pipeline Management
 *   5. Task Management (follow-ups, visits, calls)
 *   6. CRM Analytics & Reporting
 *   7. Relationship Mapping
 *   8. Outreach Campaigns
 *   9. Agent Leaderboard
 */
'use strict';

const { Router } = require('express');
const { pool } = require('../db/pool');

const router = Router();

// ═══════════════════════════════════════════════════════════════════
//  SEED / FALLBACK DATA
// ═══════════════════════════════════════════════════════════════════

const SEED_CONTACTS = [
  { id: 'cnt-1', owner_id: 'user-1', name: 'Ramesh Patel', phone: '+919876543210', role: 'farmer', location_district: 'Nashik', location_state: 'Maharashtra', crops: ['onion', 'tomato', 'grape'], tags: ['high-value', 'organic'], notes: 'Progressive farmer, 12 acre holding', created_at: '2025-01-10T08:00:00Z' },
  { id: 'cnt-2', owner_id: 'user-1', name: 'Suresh Agarwal', phone: '+919876543211', role: 'buyer', location_district: 'Azadpur', location_state: 'Delhi', crops: [], tags: ['wholesale', 'onion-buyer'], notes: 'Azadpur mandi wholesale dealer', created_at: '2025-01-12T09:00:00Z' },
  { id: 'cnt-3', owner_id: 'user-1', name: 'Priya Devi', phone: '+919876543212', role: 'farmer', location_district: 'Varanasi', location_state: 'Uttar Pradesh', crops: ['wheat', 'rice', 'mustard'], tags: ['small-holder'], notes: '3 acre holding, interested in FPO membership', created_at: '2025-01-15T10:00:00Z' },
  { id: 'cnt-4', owner_id: 'user-1', name: 'Kisan FPO Nashik', phone: '+919876543213', role: 'fpo', location_district: 'Nashik', location_state: 'Maharashtra', crops: ['onion', 'tomato', 'pomegranate'], tags: ['registered-fpo', 'export-ready'], notes: '250 member FPO, NABARD supported', created_at: '2025-01-18T11:00:00Z' },
  { id: 'cnt-5', owner_id: 'user-1', name: 'Amit Sharma', phone: '+919876543214', role: 'agent', location_district: 'Indore', location_state: 'Madhya Pradesh', crops: ['soybean', 'wheat'], tags: ['field-agent'], notes: 'Field agent covering Indore district', created_at: '2025-01-20T12:00:00Z' },
  { id: 'cnt-6', owner_id: 'user-2', name: 'Lakshmi Bai', phone: '+919876543215', role: 'farmer', location_district: 'Guntur', location_state: 'Andhra Pradesh', crops: ['chilli', 'cotton', 'turmeric'], tags: ['active', 'spice-grower'], notes: '8 acre holding, chilli specialist', created_at: '2025-02-01T08:00:00Z' },
];

const SEED_INTERACTIONS = [
  { id: 'int-1', contact_id: 'cnt-1', owner_id: 'user-1', type: 'call', notes: 'Discussed onion pricing for next season', outcome: 'interested', created_at: '2025-02-01T10:00:00Z' },
  { id: 'int-2', contact_id: 'cnt-1', owner_id: 'user-1', type: 'visit', notes: 'Farm visit — inspected grape vineyard, quality is excellent', outcome: 'positive', created_at: '2025-02-05T14:00:00Z' },
  { id: 'int-3', contact_id: 'cnt-2', owner_id: 'user-1', type: 'message', notes: 'Sent price list for Nashik onions', outcome: 'pending', created_at: '2025-02-06T09:00:00Z' },
  { id: 'int-4', contact_id: 'cnt-3', owner_id: 'user-1', type: 'call', notes: 'Explained FPO benefits and membership process', outcome: 'follow_up', created_at: '2025-02-08T11:00:00Z' },
  { id: 'int-5', contact_id: 'cnt-4', owner_id: 'user-1', type: 'visit', notes: 'FPO office visit — discussed export documentation', outcome: 'positive', created_at: '2025-02-10T15:00:00Z' },
];

const SEED_SEGMENTS = [
  { id: 'seg-1', name: 'High Value Buyers', slug: 'high-value-buyers', rules: [{ field: 'role', operator: 'eq', value: 'buyer' }, { field: 'tags', operator: 'contains', value: 'wholesale' }], contact_count: 12, owner_id: 'system' },
  { id: 'seg-2', name: 'Active Farmers', slug: 'active-farmers', rules: [{ field: 'role', operator: 'eq', value: 'farmer' }, { field: 'last_interaction', operator: 'within_days', value: 30 }], contact_count: 45, owner_id: 'system' },
  { id: 'seg-3', name: 'Dormant Contacts', slug: 'dormant', rules: [{ field: 'last_interaction', operator: 'older_than_days', value: 90 }], contact_count: 18, owner_id: 'system' },
  { id: 'seg-4', name: 'New Leads', slug: 'new-leads', rules: [{ field: 'created_at', operator: 'within_days', value: 14 }, { field: 'interactions_count', operator: 'eq', value: 0 }], contact_count: 8, owner_id: 'system' },
];

const SEED_PIPELINE = [
  { id: 'deal-1', owner_id: 'user-1', contact_id: 'cnt-2', contact_name: 'Suresh Agarwal', product: 'Nashik Onion', quantity: 50, unit: 'tonnes', value: 1250000, stage: 'negotiation', expected_close_date: '2025-03-15', created_at: '2025-02-01T08:00:00Z' },
  { id: 'deal-2', owner_id: 'user-1', contact_id: 'cnt-4', contact_name: 'Kisan FPO Nashik', product: 'Export Pomegranate', quantity: 20, unit: 'tonnes', value: 2400000, stage: 'qualified', expected_close_date: '2025-04-01', created_at: '2025-02-05T08:00:00Z' },
  { id: 'deal-3', owner_id: 'user-1', contact_id: 'cnt-1', contact_name: 'Ramesh Patel', product: 'Table Grapes', quantity: 10, unit: 'tonnes', value: 800000, stage: 'lead', expected_close_date: '2025-03-30', created_at: '2025-02-10T08:00:00Z' },
  { id: 'deal-4', owner_id: 'user-1', contact_id: 'cnt-6', contact_name: 'Lakshmi Bai', product: 'Guntur Chilli', quantity: 30, unit: 'tonnes', value: 1800000, stage: 'closed_won', expected_close_date: '2025-02-20', created_at: '2025-01-20T08:00:00Z' },
];

const SEED_TASKS = [
  { id: 'task-1', owner_id: 'user-1', contact_id: 'cnt-1', contact_name: 'Ramesh Patel', type: 'follow_up', title: 'Follow up on grape pricing', notes: 'Discuss export pricing with Ramesh', due_date: '2025-03-01', priority: 'high', status: 'pending', created_at: '2025-02-15T08:00:00Z' },
  { id: 'task-2', owner_id: 'user-1', contact_id: 'cnt-3', contact_name: 'Priya Devi', type: 'visit', title: 'Farm visit - wheat crop assessment', notes: 'Check wheat crop and discuss procurement', due_date: '2025-03-05', priority: 'medium', status: 'pending', created_at: '2025-02-16T08:00:00Z' },
  { id: 'task-3', owner_id: 'user-1', contact_id: 'cnt-2', contact_name: 'Suresh Agarwal', type: 'call', title: 'Negotiate onion bulk deal', notes: 'Finalize price for 50 tonne order', due_date: '2025-02-28', priority: 'high', status: 'pending', created_at: '2025-02-17T08:00:00Z' },
  { id: 'task-4', owner_id: 'user-1', contact_id: 'cnt-4', contact_name: 'Kisan FPO Nashik', type: 'follow_up', title: 'Send export documentation', notes: 'Share APEDA registration docs', due_date: '2025-02-25', priority: 'low', status: 'completed', completed_at: '2025-02-24T10:00:00Z', created_at: '2025-02-18T08:00:00Z' },
];

const SEED_CAMPAIGNS = [
  { id: 'camp-1', owner_id: 'user-1', name: 'Rabi Season Procurement Drive', segment: 'active-farmers', channel: 'sms', template: 'Dear {{name}}, we are procuring wheat & mustard at best prices. Contact us for doorstep pickup. — KisanConnect', status: 'active', sent: 128, delivered: 122, responded: 34, converted: 12, created_at: '2025-01-15T08:00:00Z' },
  { id: 'camp-2', owner_id: 'user-1', name: 'FPO Membership Drive', segment: 'new-leads', channel: 'whatsapp', template: 'Namaste {{name}}! Join our FPO for better pricing, group insurance & govt scheme access. Reply YES to learn more.', status: 'completed', sent: 45, delivered: 43, responded: 18, converted: 8, created_at: '2025-01-20T08:00:00Z' },
  { id: 'camp-3', owner_id: 'user-1', name: 'Cold Storage Awareness', segment: 'high-value-buyers', channel: 'call', template: 'Inform about new cold storage facility in Nashik with competitive rates.', status: 'draft', sent: 0, delivered: 0, responded: 0, converted: 0, created_at: '2025-02-10T08:00:00Z' },
];

const SEED_LEADERBOARD = [
  { rank: 1, agent_id: 'user-5', agent_name: 'Amit Sharma', district: 'Indore', contacts_added: 89, deals_closed: 14, revenue_generated: 4250000, activities_this_month: 142, score: 965 },
  { rank: 2, agent_id: 'user-3', agent_name: 'Ravi Kumar', district: 'Nashik', contacts_added: 72, deals_closed: 11, revenue_generated: 3800000, activities_this_month: 118, score: 890 },
  { rank: 3, agent_id: 'user-7', agent_name: 'Sneha Patil', district: 'Guntur', contacts_added: 65, deals_closed: 13, revenue_generated: 3500000, activities_this_month: 105, score: 855 },
  { rank: 4, agent_id: 'user-1', agent_name: 'Deepak Singh', district: 'Varanasi', contacts_added: 58, deals_closed: 9, revenue_generated: 2900000, activities_this_month: 96, score: 780 },
  { rank: 5, agent_id: 'user-9', agent_name: 'Meera Reddy', district: 'Warangal', contacts_added: 51, deals_closed: 8, revenue_generated: 2100000, activities_this_month: 88, score: 720 },
];

// ═══════════════════════════════════════════════════════════════════
//  1. CONTACT MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

// List CRM contacts
router.get('/contacts', async (req, res) => {
  try {
    const { owner_id, search, role, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let query = 'SELECT * FROM crm_contacts WHERE 1=1';
    const params = [];

    if (owner_id) { params.push(owner_id); query += ` AND owner_id = $${params.length}`; }
    if (role) { params.push(role); query += ` AND role = $${params.length}`; }
    if (search) { params.push(`%${search}%`); query += ` AND (name ILIKE $${params.length} OR phone ILIKE $${params.length} OR location_district ILIKE $${params.length})`; }
    params.push(parseInt(limit));
    query += ` ORDER BY created_at DESC LIMIT $${params.length}`;
    params.push(offset);
    query += ` OFFSET $${params.length}`;

    const result = await pool.query(query, params);
    res.json({ contacts: result.rows, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    let filtered = SEED_CONTACTS;
    const { owner_id, search, role, page = 1, limit = 20 } = req.query;
    if (owner_id) filtered = filtered.filter(c => c.owner_id === owner_id);
    if (role) filtered = filtered.filter(c => c.role === role);
    if (search) { const s = search.toLowerCase(); filtered = filtered.filter(c => c.name.toLowerCase().includes(s) || c.phone.includes(s)); }
    const offset = (parseInt(page) - 1) * parseInt(limit);
    res.json({ contacts: filtered.slice(offset, offset + parseInt(limit)), page: parseInt(page), limit: parseInt(limit), _fallback: true });
  }
});

// Add contact
router.post('/contacts', async (req, res) => {
  try {
    const { owner_id, name, phone, role, location_district, location_state, crops, tags, notes } = req.body;
    if (!owner_id || !name || !phone || !role) {
      return res.status(400).json({ error: 'owner_id, name, phone, role required' });
    }

    const result = await pool.query(`
      INSERT INTO crm_contacts (owner_id, name, phone, role, location_district, location_state, crops, tags, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [owner_id, name, phone, role, location_district, location_state, JSON.stringify(crops || []), JSON.stringify(tags || []), notes]);

    res.status(201).json({ contact: result.rows[0] });
  } catch (err) {
    const newContact = {
      id: `cnt-${Date.now()}`, ...req.body,
      crops: req.body.crops || [], tags: req.body.tags || [],
      created_at: new Date().toISOString(),
    };
    res.status(201).json({ contact: newContact, _fallback: true });
  }
});

// Contact detail with interaction history
router.get('/contacts/:id', async (req, res) => {
  try {
    const contact = await pool.query('SELECT * FROM crm_contacts WHERE id = $1', [req.params.id]);
    if (!contact.rows.length) return res.status(404).json({ error: 'Contact not found' });

    const interactions = await pool.query(
      'SELECT * FROM crm_interactions WHERE contact_id = $1 ORDER BY created_at DESC LIMIT 20',
      [req.params.id]
    );

    res.json({ contact: contact.rows[0], interactions: interactions.rows });
  } catch (err) {
    const contact = SEED_CONTACTS.find(c => c.id === req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    const interactions = SEED_INTERACTIONS.filter(i => i.contact_id === req.params.id);
    res.json({ contact, interactions, _fallback: true });
  }
});

// Update contact
router.put('/contacts/:id', async (req, res) => {
  try {
    const { name, phone, role, location_district, location_state, crops, tags, notes } = req.body;
    const result = await pool.query(`
      UPDATE crm_contacts SET
        name = COALESCE($1, name), phone = COALESCE($2, phone), role = COALESCE($3, role),
        location_district = COALESCE($4, location_district), location_state = COALESCE($5, location_state),
        crops = COALESCE($6, crops), tags = COALESCE($7, tags), notes = COALESCE($8, notes),
        updated_at = NOW()
      WHERE id = $9 RETURNING *
    `, [name, phone, role, location_district, location_state, crops ? JSON.stringify(crops) : null, tags ? JSON.stringify(tags) : null, notes, req.params.id]);

    if (!result.rows.length) return res.status(404).json({ error: 'Contact not found' });
    res.json({ contact: result.rows[0] });
  } catch (err) {
    const contact = SEED_CONTACTS.find(c => c.id === req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.json({ contact: { ...contact, ...req.body, updated_at: new Date().toISOString() }, _fallback: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  2. INTERACTION TRACKING
// ═══════════════════════════════════════════════════════════════════

// Log interaction
router.post('/contacts/:id/interactions', async (req, res) => {
  try {
    const { owner_id, type, notes, outcome } = req.body;
    if (!owner_id || !type) {
      return res.status(400).json({ error: 'owner_id, type required' });
    }

    const validTypes = ['call', 'visit', 'message', 'order'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `type must be one of: ${validTypes.join(', ')}` });
    }

    const result = await pool.query(`
      INSERT INTO crm_interactions (contact_id, owner_id, type, notes, outcome)
      VALUES ($1,$2,$3,$4,$5) RETURNING *
    `, [req.params.id, owner_id, type, notes, outcome]);

    // Update contact last_interaction timestamp
    await pool.query('UPDATE crm_contacts SET last_interaction_at = NOW(), updated_at = NOW() WHERE id = $1', [req.params.id]);

    res.status(201).json({ interaction: result.rows[0] });
  } catch (err) {
    const interaction = {
      id: `int-${Date.now()}`, contact_id: req.params.id,
      ...req.body, created_at: new Date().toISOString(),
    };
    res.status(201).json({ interaction, _fallback: true });
  }
});

// Interaction history
router.get('/contacts/:id/interactions', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM crm_interactions WHERE contact_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.params.id]
    );
    res.json({ interactions: result.rows });
  } catch (err) {
    const interactions = SEED_INTERACTIONS.filter(i => i.contact_id === req.params.id);
    res.json({ interactions, _fallback: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  3. CONTACT TAGGING
// ═══════════════════════════════════════════════════════════════════

// Add tags to contact
router.post('/contacts/:id/tags', async (req, res) => {
  try {
    const { tags } = req.body;
    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({ error: 'tags[] required' });
    }

    const result = await pool.query(`
      UPDATE crm_contacts SET
        tags = (
          SELECT jsonb_agg(DISTINCT t) FROM (
            SELECT jsonb_array_elements(COALESCE(tags, '[]'::jsonb)) AS t
            UNION
            SELECT jsonb_array_elements($1::jsonb) AS t
          ) sub
        ),
        updated_at = NOW()
      WHERE id = $2 RETURNING *
    `, [JSON.stringify(tags), req.params.id]);

    if (!result.rows.length) return res.status(404).json({ error: 'Contact not found' });
    res.json({ contact: result.rows[0] });
  } catch (err) {
    const contact = SEED_CONTACTS.find(c => c.id === req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    const merged = [...new Set([...(contact.tags || []), ...(req.body.tags || [])])];
    res.json({ contact: { ...contact, tags: merged }, _fallback: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  4. CONTACT SEGMENTS
// ═══════════════════════════════════════════════════════════════════

// List segments
router.get('/segments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM crm_segments ORDER BY name');
    res.json({ segments: result.rows });
  } catch (err) {
    res.json({ segments: SEED_SEGMENTS, _fallback: true });
  }
});

// Create custom segment
router.post('/segments', async (req, res) => {
  try {
    const { owner_id, name, rules } = req.body;
    if (!owner_id || !name || !rules) {
      return res.status(400).json({ error: 'owner_id, name, rules required' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const result = await pool.query(`
      INSERT INTO crm_segments (owner_id, name, slug, rules) VALUES ($1,$2,$3,$4) RETURNING *
    `, [owner_id, name, slug, JSON.stringify(rules)]);

    res.status(201).json({ segment: result.rows[0] });
  } catch (err) {
    const segment = {
      id: `seg-${Date.now()}`, ...req.body,
      slug: (req.body.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      contact_count: 0, created_at: new Date().toISOString(),
    };
    res.status(201).json({ segment, _fallback: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  5. SALES PIPELINE
// ═══════════════════════════════════════════════════════════════════

const PIPELINE_STAGES = ['lead', 'qualified', 'negotiation', 'closed_won', 'closed_lost'];

// Get pipeline
router.get('/pipeline', async (req, res) => {
  try {
    const { owner_id } = req.query;
    let query = 'SELECT * FROM crm_pipeline WHERE 1=1';
    const params = [];

    if (owner_id) { params.push(owner_id); query += ` AND owner_id = $${params.length}`; }
    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);

    const summary = {};
    for (const stage of PIPELINE_STAGES) {
      const deals = result.rows.filter(d => d.stage === stage);
      summary[stage] = { count: deals.length, value: deals.reduce((s, d) => s + parseFloat(d.value || 0), 0) };
    }

    res.json({ deals: result.rows, summary, stages: PIPELINE_STAGES });
  } catch (err) {
    let filtered = SEED_PIPELINE;
    const { owner_id } = req.query;
    if (owner_id) filtered = filtered.filter(d => d.owner_id === owner_id);

    const summary = {};
    for (const stage of PIPELINE_STAGES) {
      const deals = filtered.filter(d => d.stage === stage);
      summary[stage] = { count: deals.length, value: deals.reduce((s, d) => s + (d.value || 0), 0) };
    }

    res.json({ deals: filtered, summary, stages: PIPELINE_STAGES, _fallback: true });
  }
});

// Add deal
router.post('/pipeline', async (req, res) => {
  try {
    const { owner_id, contact_id, product, quantity, unit, value, stage, expected_close_date } = req.body;
    if (!owner_id || !contact_id || !product || !value) {
      return res.status(400).json({ error: 'owner_id, contact_id, product, value required' });
    }

    if (stage && !PIPELINE_STAGES.includes(stage)) {
      return res.status(400).json({ error: `stage must be one of: ${PIPELINE_STAGES.join(', ')}` });
    }

    const result = await pool.query(`
      INSERT INTO crm_pipeline (owner_id, contact_id, product, quantity, unit, value, stage, expected_close_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [owner_id, contact_id, product, quantity, unit || 'tonnes', value, stage || 'lead', expected_close_date]);

    res.status(201).json({ deal: result.rows[0] });
  } catch (err) {
    const deal = {
      id: `deal-${Date.now()}`, ...req.body,
      stage: req.body.stage || 'lead', unit: req.body.unit || 'tonnes',
      created_at: new Date().toISOString(),
    };
    res.status(201).json({ deal, _fallback: true });
  }
});

// Update deal stage
router.put('/pipeline/:id', async (req, res) => {
  try {
    const { stage, value, notes, expected_close_date } = req.body;

    if (stage && !PIPELINE_STAGES.includes(stage)) {
      return res.status(400).json({ error: `stage must be one of: ${PIPELINE_STAGES.join(', ')}` });
    }

    const result = await pool.query(`
      UPDATE crm_pipeline SET
        stage = COALESCE($1, stage), value = COALESCE($2, value),
        notes = COALESCE($3, notes), expected_close_date = COALESCE($4, expected_close_date),
        updated_at = NOW()
      WHERE id = $5 RETURNING *
    `, [stage, value, notes, expected_close_date, req.params.id]);

    if (!result.rows.length) return res.status(404).json({ error: 'Deal not found' });
    res.json({ deal: result.rows[0] });
  } catch (err) {
    const deal = SEED_PIPELINE.find(d => d.id === req.params.id);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });
    res.json({ deal: { ...deal, ...req.body, updated_at: new Date().toISOString() }, _fallback: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  6. TASK MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

// List tasks
router.get('/tasks', async (req, res) => {
  try {
    const { owner_id, status } = req.query;
    let query = 'SELECT * FROM crm_tasks WHERE 1=1';
    const params = [];

    if (owner_id) { params.push(owner_id); query += ` AND owner_id = $${params.length}`; }
    if (status) { params.push(status); query += ` AND status = $${params.length}`; }
    query += ' ORDER BY due_date ASC, priority DESC';

    const result = await pool.query(query, params);
    res.json({ tasks: result.rows });
  } catch (err) {
    let filtered = SEED_TASKS;
    const { owner_id, status } = req.query;
    if (owner_id) filtered = filtered.filter(t => t.owner_id === owner_id);
    if (status) filtered = filtered.filter(t => t.status === status);
    res.json({ tasks: filtered, _fallback: true });
  }
});

// Create task
router.post('/tasks', async (req, res) => {
  try {
    const { owner_id, contact_id, type, title, notes, due_date, priority } = req.body;
    if (!owner_id || !title || !type) {
      return res.status(400).json({ error: 'owner_id, title, type required' });
    }

    const validTypes = ['follow_up', 'visit', 'call'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `type must be one of: ${validTypes.join(', ')}` });
    }

    const validPriorities = ['low', 'medium', 'high'];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({ error: `priority must be one of: ${validPriorities.join(', ')}` });
    }

    const result = await pool.query(`
      INSERT INTO crm_tasks (owner_id, contact_id, type, title, notes, due_date, priority)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [owner_id, contact_id, type, title, notes, due_date, priority || 'medium']);

    res.status(201).json({ task: result.rows[0] });
  } catch (err) {
    const task = {
      id: `task-${Date.now()}`, ...req.body,
      priority: req.body.priority || 'medium', status: 'pending',
      created_at: new Date().toISOString(),
    };
    res.status(201).json({ task, _fallback: true });
  }
});

// Complete task
router.put('/tasks/:id/complete', async (req, res) => {
  try {
    const result = await pool.query(`
      UPDATE crm_tasks SET status = 'completed', completed_at = NOW(), updated_at = NOW()
      WHERE id = $1 RETURNING *
    `, [req.params.id]);

    if (!result.rows.length) return res.status(404).json({ error: 'Task not found' });
    res.json({ task: result.rows[0] });
  } catch (err) {
    const task = SEED_TASKS.find(t => t.id === req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ task: { ...task, status: 'completed', completed_at: new Date().toISOString() }, _fallback: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  7. CRM ANALYTICS
// ═══════════════════════════════════════════════════════════════════

// CRM analytics
router.get('/analytics', async (req, res) => {
  try {
    const { owner_id } = req.query;
    if (!owner_id) return res.status(400).json({ error: 'owner_id required' });

    const contacts = await pool.query(
      'SELECT COUNT(*) as total, role FROM crm_contacts WHERE owner_id = $1 GROUP BY role',
      [owner_id]
    );

    const deals = await pool.query(
      'SELECT COUNT(*) as total, stage, SUM(value) as value FROM crm_pipeline WHERE owner_id = $1 GROUP BY stage',
      [owner_id]
    );

    const activities = await pool.query(
      "SELECT COUNT(*) as count FROM crm_interactions WHERE owner_id = $1 AND created_at > NOW() - INTERVAL '7 days'",
      [owner_id]
    );

    const totalContacts = contacts.rows.reduce((s, r) => s + parseInt(r.total), 0);
    const activeDeals = deals.rows.filter(d => !['closed_won', 'closed_lost'].includes(d.stage));
    const pipelineValue = activeDeals.reduce((s, d) => s + parseFloat(d.value || 0), 0);
    const wonDeals = deals.rows.find(d => d.stage === 'closed_won');
    const totalDeals = deals.rows.reduce((s, d) => s + parseInt(d.total), 0);
    const conversionRate = totalDeals > 0 ? ((parseInt(wonDeals?.total || 0) / totalDeals) * 100).toFixed(1) : 0;

    res.json({
      analytics: {
        total_contacts: totalContacts,
        contacts_by_role: contacts.rows,
        active_deals: activeDeals.reduce((s, d) => s + parseInt(d.total), 0),
        pipeline_value: pipelineValue,
        conversion_rate: parseFloat(conversionRate),
        activities_this_week: parseInt(activities.rows[0]?.count || 0),
        deals_by_stage: deals.rows,
      },
    });
  } catch (err) {
    const { owner_id } = req.query;
    const contacts = SEED_CONTACTS.filter(c => c.owner_id === owner_id);
    const deals = SEED_PIPELINE.filter(d => d.owner_id === owner_id);
    const activeDeals = deals.filter(d => !['closed_won', 'closed_lost'].includes(d.stage));
    const wonDeals = deals.filter(d => d.stage === 'closed_won');
    const conversionRate = deals.length > 0 ? ((wonDeals.length / deals.length) * 100).toFixed(1) : 0;

    res.json({
      analytics: {
        total_contacts: contacts.length,
        contacts_by_role: { farmer: contacts.filter(c => c.role === 'farmer').length, buyer: contacts.filter(c => c.role === 'buyer').length, fpo: contacts.filter(c => c.role === 'fpo').length, agent: contacts.filter(c => c.role === 'agent').length },
        active_deals: activeDeals.length,
        pipeline_value: activeDeals.reduce((s, d) => s + (d.value || 0), 0),
        conversion_rate: parseFloat(conversionRate),
        activities_this_week: 23,
        deals_by_stage: PIPELINE_STAGES.map(stage => ({ stage, count: deals.filter(d => d.stage === stage).length, value: deals.filter(d => d.stage === stage).reduce((s, d) => s + (d.value || 0), 0) })),
      },
      _fallback: true,
    });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  8. RELATIONSHIP MAP
// ═══════════════════════════════════════════════════════════════════

// Relationship graph
router.get('/relationship-map', async (req, res) => {
  try {
    const { owner_id } = req.query;
    let query = `
      SELECT c.id, c.name, c.role, c.location_district, c.tags,
             COUNT(DISTINCT i.id) as interaction_count,
             COUNT(DISTINCT p.id) as deal_count
      FROM crm_contacts c
      LEFT JOIN crm_interactions i ON i.contact_id = c.id
      LEFT JOIN crm_pipeline p ON p.contact_id = c.id
      WHERE 1=1
    `;
    const params = [];
    if (owner_id) { params.push(owner_id); query += ` AND c.owner_id = $${params.length}`; }
    query += ' GROUP BY c.id, c.name, c.role, c.location_district, c.tags';

    const result = await pool.query(query, params);

    const nodes = result.rows.map(r => ({
      id: r.id, name: r.name, role: r.role, district: r.location_district,
      interactions: parseInt(r.interaction_count), deals: parseInt(r.deal_count),
    }));

    // Build edges from interactions between contacts in same district
    const edges = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].district === nodes[j].district && nodes[i].role !== nodes[j].role) {
          edges.push({ source: nodes[i].id, target: nodes[j].id, type: 'same_district' });
        }
      }
    }

    res.json({ nodes, edges, total_nodes: nodes.length, total_edges: edges.length });
  } catch (err) {
    const { owner_id } = req.query;
    let filtered = SEED_CONTACTS;
    if (owner_id) filtered = filtered.filter(c => c.owner_id === owner_id);

    const nodes = filtered.map(c => ({
      id: c.id, name: c.name, role: c.role, district: c.location_district,
      interactions: SEED_INTERACTIONS.filter(i => i.contact_id === c.id).length,
      deals: SEED_PIPELINE.filter(d => d.contact_id === c.id).length,
    }));

    const edges = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].district === nodes[j].district && nodes[i].role !== nodes[j].role) {
          edges.push({ source: nodes[i].id, target: nodes[j].id, type: 'same_district' });
        }
      }
    }

    res.json({ nodes, edges, total_nodes: nodes.length, total_edges: edges.length, _fallback: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  9. OUTREACH CAMPAIGNS
// ═══════════════════════════════════════════════════════════════════

// Create campaign
router.post('/campaigns', async (req, res) => {
  try {
    const { owner_id, name, segment, channel, template } = req.body;
    if (!owner_id || !name || !segment || !channel) {
      return res.status(400).json({ error: 'owner_id, name, segment, channel required' });
    }

    const validChannels = ['sms', 'whatsapp', 'call'];
    if (!validChannels.includes(channel)) {
      return res.status(400).json({ error: `channel must be one of: ${validChannels.join(', ')}` });
    }

    const result = await pool.query(`
      INSERT INTO crm_campaigns (owner_id, name, segment, channel, template, status)
      VALUES ($1,$2,$3,$4,$5,'draft') RETURNING *
    `, [owner_id, name, segment, channel, template]);

    res.status(201).json({ campaign: result.rows[0] });
  } catch (err) {
    const campaign = {
      id: `camp-${Date.now()}`, ...req.body,
      status: 'draft', sent: 0, delivered: 0, responded: 0, converted: 0,
      created_at: new Date().toISOString(),
    };
    res.status(201).json({ campaign, _fallback: true });
  }
});

// List campaigns
router.get('/campaigns', async (req, res) => {
  try {
    const { owner_id } = req.query;
    let query = 'SELECT * FROM crm_campaigns WHERE 1=1';
    const params = [];

    if (owner_id) { params.push(owner_id); query += ` AND owner_id = $${params.length}`; }
    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json({ campaigns: result.rows });
  } catch (err) {
    let filtered = SEED_CAMPAIGNS;
    const { owner_id } = req.query;
    if (owner_id) filtered = filtered.filter(c => c.owner_id === owner_id);
    res.json({ campaigns: filtered, _fallback: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  10. AGENT LEADERBOARD
// ═══════════════════════════════════════════════════════════════════

// Leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id as agent_id, u.name as agent_name,
        COUNT(DISTINCT c.id) as contacts_added,
        COUNT(DISTINCT p.id) FILTER (WHERE p.stage = 'closed_won') as deals_closed,
        COALESCE(SUM(p.value) FILTER (WHERE p.stage = 'closed_won'), 0) as revenue_generated,
        COUNT(DISTINCT i.id) FILTER (WHERE i.created_at > NOW() - INTERVAL '30 days') as activities_this_month
      FROM crm_contacts c
      JOIN users u ON u.id = c.owner_id
      LEFT JOIN crm_pipeline p ON p.owner_id = c.owner_id
      LEFT JOIN crm_interactions i ON i.owner_id = c.owner_id
      GROUP BY u.id, u.name
      ORDER BY revenue_generated DESC
      LIMIT 20
    `);

    const leaderboard = result.rows.map((r, idx) => ({
      rank: idx + 1, ...r,
      score: parseInt(r.contacts_added) * 5 + parseInt(r.deals_closed) * 50 + Math.floor(parseFloat(r.revenue_generated) / 10000),
    }));

    res.json({ leaderboard });
  } catch (err) {
    res.json({ leaderboard: SEED_LEADERBOARD, _fallback: true });
  }
});

module.exports = router;
