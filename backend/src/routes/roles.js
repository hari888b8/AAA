'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../lib/logger');

const router = express.Router();

const VALID_ROLES = ['farmer', 'buyer', 'fpo', 'supplier', 'service_provider'];
const VALID_SUB_TYPES = {
  farmer: ['agri_farmer', 'aqua_farmer', 'both'],
  buyer: ['trader', 'exporter', 'processor', 'retailer', 'wholesaler', 'restaurant'],
  fpo: ['crop_fpo', 'aqua_fpo', 'mixed_fpo'],
  supplier: ['agri_inputs', 'aqua_inputs', 'equipment', 'general'],
  service_provider: ['tractor', 'labor', 'cold_store', 'transport', 'spraying'],
};

// Module visibility per role
const ROLE_MODULES = {
  farmer: ['farmdiary', 'weather', 'schemes', 'training', 'agriflow', 'bhoomios', 'cropdoctor', 'croplifecycle', 'satellite', 'intelligence', 'livestock', 'inputs', 'cropplanning'],
  aqua_farmer: ['aquaos', 'farmdiary', 'weather', 'training', 'schemes'],
  buyer: ['agriflow', 'aquaos', 'intelligence', 'orders', 'cart', 'logistics', 'contracts', 'demandengine', 'hyperlocal', 'finance'],
  fpo: ['agriflow', 'intelligence', 'fpodashboard', 'community', 'orders', 'logistics', 'finance', 'contracts'],
  supplier: ['agrigalaxy', 'aquaos', 'orders', 'community', 'analytics'],
  service_provider: ['kisan', 'community', 'jobs', 'logistics'],
};

// GET /api/roles — list all roles for current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, role, sub_type, is_active, added_at FROM user_roles WHERE user_id = $1 ORDER BY added_at`,
      [req.user.id]
    );

    // If user has no roles in new table, seed from their primary role
    if (!result.rows.length) {
      const userResult = await query('SELECT role FROM users WHERE id = $1', [req.user.id]);
      const primaryRole = userResult.rows[0]?.role || 'farmer';
      await query(
        `INSERT INTO user_roles (id, user_id, role, is_active) VALUES ($1, $2, $3, true) ON CONFLICT DO NOTHING`,
        [uuidv4(), req.user.id, primaryRole]
      );
      return res.json({
        roles: [{ role: primaryRole, sub_type: null, is_active: true, added_at: new Date().toISOString() }],
        active_role: primaryRole,
        available_roles: VALID_ROLES.filter(r => r !== primaryRole),
        modules: ROLE_MODULES[primaryRole] || [],
      });
    }

    const activeRole = result.rows.find(r => r.is_active)?.role || result.rows[0]?.role;
    // Compute combined modules across all roles
    const allModules = [...new Set(result.rows.flatMap(r => ROLE_MODULES[r.role] || []))];

    res.json({
      roles: result.rows,
      active_role: activeRole,
      available_roles: VALID_ROLES.filter(r => !result.rows.some(ur => ur.role === r)),
      modules: allModules,
    });
  } catch (err) {
    logger.error({ err }, 'Failed to get roles');
    res.status(500).json({ error: 'Failed to get roles' });
  }
});

// POST /api/roles — add a new role
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { role, sub_type } = req.body;
    if (!role || !VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
    }
    if (sub_type && VALID_SUB_TYPES[role] && !VALID_SUB_TYPES[role].includes(sub_type)) {
      return res.status(400).json({ error: `Invalid sub_type for ${role}. Must be one of: ${VALID_SUB_TYPES[role].join(', ')}` });
    }

    // Check if role already exists
    const existing = await query(
      'SELECT id FROM user_roles WHERE user_id = $1 AND role = $2',
      [req.user.id, role]
    );
    if (existing.rows.length) {
      return res.status(409).json({ error: 'Role already added' });
    }

    await query(
      `INSERT INTO user_roles (id, user_id, role, sub_type, is_active) VALUES ($1, $2, $3, $4, false)`,
      [uuidv4(), req.user.id, role, sub_type || null]
    );

    res.status(201).json({ message: `Role '${role}' added successfully` });
  } catch (err) {
    logger.error({ err }, 'Failed to add role');
    res.status(500).json({ error: 'Failed to add role' });
  }
});

// POST /api/roles/switch — switch active role
router.post('/switch', authMiddleware, async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Verify user has this role
    const hasRole = await query(
      'SELECT id FROM user_roles WHERE user_id = $1 AND role = $2',
      [req.user.id, role]
    );
    if (!hasRole.rows.length) {
      return res.status(400).json({ error: 'You have not added this role yet' });
    }

    // Get current active role for audit
    const currentActive = await query(
      'SELECT role FROM user_roles WHERE user_id = $1 AND is_active = true',
      [req.user.id]
    );
    const fromRole = currentActive.rows[0]?.role || null;

    // Deactivate all, activate selected
    await query('UPDATE user_roles SET is_active = false WHERE user_id = $1', [req.user.id]);
    await query('UPDATE user_roles SET is_active = true WHERE user_id = $1 AND role = $2', [req.user.id, role]);

    // Update primary role in users table for backward compat
    await query('UPDATE users SET role = $1 WHERE id = $2', [role, req.user.id]);

    // Audit log
    await query(
      `INSERT INTO role_switch_log (id, user_id, from_role, to_role) VALUES ($1, $2, $3, $4)`,
      [uuidv4(), req.user.id, fromRole, role]
    );

    // Get updated user
    const userResult = await query(
      'SELECT id, phone, name, role, is_verified, onboarding_completed, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    // Get all roles
    const rolesResult = await query(
      'SELECT role, sub_type, is_active FROM user_roles WHERE user_id = $1 ORDER BY added_at',
      [req.user.id]
    );

    res.json({
      message: `Switched to ${role}`,
      user: userResult.rows[0],
      roles: rolesResult.rows,
      modules: ROLE_MODULES[role] || [],
    });
  } catch (err) {
    logger.error({ err }, 'Failed to switch role');
    res.status(500).json({ error: 'Failed to switch role' });
  }
});

// DELETE /api/roles/:role — remove a role (can't remove last role)
router.delete('/:role', authMiddleware, async (req, res) => {
  try {
    const { role } = req.params;

    // Count roles
    const count = await query('SELECT COUNT(*) as cnt FROM user_roles WHERE user_id = $1', [req.user.id]);
    if (parseInt(count.rows[0].cnt) <= 1) {
      return res.status(400).json({ error: 'Cannot remove your only role' });
    }

    // Check if removing active role
    const target = await query(
      'SELECT is_active FROM user_roles WHERE user_id = $1 AND role = $2',
      [req.user.id, role]
    );
    if (!target.rows.length) {
      return res.status(404).json({ error: 'Role not found' });
    }

    await query('DELETE FROM user_roles WHERE user_id = $1 AND role = $2', [req.user.id, role]);

    // If removed role was active, activate the first remaining role
    if (target.rows[0].is_active) {
      const remaining = await query(
        'SELECT role FROM user_roles WHERE user_id = $1 ORDER BY added_at LIMIT 1',
        [req.user.id]
      );
      if (remaining.rows.length) {
        await query('UPDATE user_roles SET is_active = true WHERE user_id = $1 AND role = $2', [req.user.id, remaining.rows[0].role]);
        await query('UPDATE users SET role = $1 WHERE id = $2', [remaining.rows[0].role, req.user.id]);
      }
    }

    res.json({ message: `Role '${role}' removed` });
  } catch (err) {
    logger.error({ err }, 'Failed to remove role');
    res.status(500).json({ error: 'Failed to remove role' });
  }
});

// GET /api/roles/modules — get module visibility for current user (all roles combined)
router.get('/modules', authMiddleware, async (req, res) => {
  try {
    const rolesResult = await query(
      'SELECT role FROM user_roles WHERE user_id = $1',
      [req.user.id]
    );

    let roles = rolesResult.rows.map(r => r.role);
    if (!roles.length) roles = [req.user.role || 'farmer'];

    const allModules = [...new Set(roles.flatMap(r => ROLE_MODULES[r] || []))];
    const activeRole = (await query(
      'SELECT role FROM user_roles WHERE user_id = $1 AND is_active = true',
      [req.user.id]
    )).rows[0]?.role || roles[0];

    res.json({
      active_role: activeRole,
      active_modules: ROLE_MODULES[activeRole] || [],
      all_modules: allModules,
      roles,
    });
  } catch (err) {
    logger.error({ err }, 'Failed to get modules');
    res.status(500).json({ error: 'Failed to get modules' });
  }
});

module.exports = router;
