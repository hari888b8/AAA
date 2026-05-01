const express = require('express');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/auth');
const { query } = require('../db/pool');
const { v4: uuidv4 } = require('uuid');
const { uploadFile, parseBase64Image, IS_CLOUD_CONFIGURED } = require('../services/storage');

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

// POST /api/upload/image — base64 image upload (cloud storage or local)
router.post('/image', authMiddleware, async (req, res) => {
  try {
    const { image, context = 'general' } = req.body;
    if (!image) return res.status(400).json({ error: 'image (base64) required' });

    if (!checkUploadRate(req.user.id)) return res.status(429).json({ error: 'Upload limit reached. Max 20 uploads/hour.' });

    const allowed_contexts = ['profile', 'listing', 'pond', 'crop', 'property', 'general', 'trade', 'quality', 'disease'];
    if (!allowed_contexts.includes(context)) return res.status(400).json({ error: `Invalid context. Allowed: ${allowed_contexts.join(', ')}` });

    const parsed = parseBase64Image(image);
    if (!parsed.valid) return res.status(400).json({ error: parsed.error });

    // Upload via cloud storage service (handles cloud vs local automatically)
    const result = await uploadFile(parsed.buffer, {
      context,
      extension: parsed.extension,
      contentType: parsed.contentType,
      userId: req.user.id,
    });

    // Log upload to DB
    query(
      `INSERT INTO uploaded_files (id, user_id, filename, url, context, size_bytes, storage_type, storage_key, content_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [uuidv4(), req.user.id, path.basename(result.key), result.url, context, result.size, result.storage, result.key, parsed.contentType]
    ).catch(() => {});

    res.status(201).json({
      url: result.url,
      key: result.key,
      size_bytes: result.size,
      context,
      storage: result.storage,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/upload/multi — Upload multiple images at once
router.post('/multi', authMiddleware, async (req, res) => {
  try {
    const { images, context = 'general' } = req.body;
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'images array required' });
    }
    if (images.length > 5) {
      return res.status(400).json({ error: 'Maximum 5 images per upload' });
    }

    if (!checkUploadRate(req.user.id)) return res.status(429).json({ error: 'Upload limit reached' });

    const results = [];
    for (const image of images) {
      const parsed = parseBase64Image(image);
      if (!parsed.valid) {
        results.push({ error: parsed.error });
        continue;
      }

      const result = await uploadFile(parsed.buffer, {
        context,
        extension: parsed.extension,
        contentType: parsed.contentType,
        userId: req.user.id,
      });

      query(
        `INSERT INTO uploaded_files (id, user_id, filename, url, context, size_bytes, storage_type, storage_key, content_type)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [uuidv4(), req.user.id, path.basename(result.key), result.url, context, result.size, result.storage, result.key, parsed.contentType]
      ).catch(() => {});

      results.push({ url: result.url, key: result.key, size_bytes: result.size, storage: result.storage });
    }

    res.status(201).json({ uploads: results, count: results.filter(r => !r.error).length });
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
      `SELECT id, filename, url, context, size_bytes, storage_type, created_at FROM uploaded_files WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT 50`,
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
    const { deleteFile } = require('../services/storage');

    // Delete from storage (cloud or local)
    await deleteFile(file.storage_key || file.filename);

    await query(`DELETE FROM uploaded_files WHERE id = $1`, [req.params.id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
