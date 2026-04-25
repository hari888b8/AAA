const express = require('express');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/auth');
const { query } = require('../db/pool');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Simple in-memory rate limiter for uploads per user
const uploadCounts = new Map();
const UPLOAD_LIMIT = 20; // per hour

function checkUploadRate(userId) {
  const now = Date.now();
  const entry = uploadCounts.get(userId) || { count: 0, resetAt: now + 3600000 };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + 3600000; }
  if (entry.count >= UPLOAD_LIMIT) return false;
  entry.count++;
  uploadCounts.set(userId, entry);
  return true;
}

// Validate base64 image
function validateBase64Image(dataUrl) {
  const match = dataUrl.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/);
  if (!match) return { valid: false, error: 'Invalid format. Must be base64 JPEG, PNG or WebP.' };
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > 5 * 1024 * 1024) return { valid: false, error: 'Image exceeds 5MB limit.' };
  return { valid: true, ext: match[1] === 'jpg' ? 'jpeg' : match[1], buffer };
}

// POST /api/upload/image — base64 image upload
router.post('/image', authMiddleware, (req, res) => {
  try {
    const { image, context = 'general' } = req.body;
    if (!image) return res.status(400).json({ error: 'image (base64) required' });

    if (!checkUploadRate(req.user.id)) return res.status(429).json({ error: 'Upload limit reached. Max 20 uploads/hour.' });

    const validation = validateBase64Image(image);
    if (!validation.valid) return res.status(400).json({ error: validation.error });

    const allowed_contexts = ['profile', 'listing', 'pond', 'crop', 'property', 'general'];
    if (!allowed_contexts.includes(context)) return res.status(400).json({ error: `Invalid context. Allowed: ${allowed_contexts.join(', ')}` });

    const filename = `${uuidv4()}.${validation.ext}`;
    const filepath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(filepath, validation.buffer);

    const url = `/uploads/${filename}`;

    // Log upload to DB
    query(
      `INSERT INTO uploaded_files (id, user_id, filename, url, context, size_bytes) VALUES ($1,$2,$3,$4,$5,$6)`,
      [uuidv4(), req.user.id, filename, url, context, validation.buffer.length]
    ).catch(console.error);

    res.status(201).json({ url, filename, size_bytes: validation.buffer.length, context });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/upload/my-files — list user's uploaded files
router.get('/my-files', authMiddleware, async (req, res) => {
  try {
    const { context } = req.query;
    let conditions = [`user_id = $1`];
    let params = [req.user.id];
    if (context) { conditions.push(`context = $2`); params.push(context); }

    const result = await query(
      `SELECT id, filename, url, context, size_bytes, created_at FROM uploaded_files WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT 50`,
      params
    );
    res.json({ files: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/upload/:id — delete uploaded file
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await query(`SELECT * FROM uploaded_files WHERE id = $1 AND user_id = $2`, [req.params.id, req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'File not found or not yours' });

    const file = result.rows[0];
    const filepath = path.join(UPLOADS_DIR, file.filename);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);

    await query(`DELETE FROM uploaded_files WHERE id = $1`, [req.params.id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
