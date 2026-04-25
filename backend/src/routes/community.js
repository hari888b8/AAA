const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/community/posts
router.get('/posts', async (req, res) => {
  try {
    const { category, district_id, limit = 20, offset = 0 } = req.query;
    let conditions = [`cp.status = 'active'`];
    let params = [];
    let i = 1;
    if (category) { conditions.push(`cp.category = $${i++}`); params.push(category); }
    if (district_id) { conditions.push(`cp.district_id = $${i++}`); params.push(district_id); }
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(`
      SELECT cp.*, u.name AS author_name, u.role AS author_role, d.name AS district_name
      FROM community_posts cp
      JOIN users u ON u.id = cp.author_id
      LEFT JOIN districts d ON d.id = cp.district_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY cp.pinned DESC, cp.created_at DESC
      LIMIT $${i++} OFFSET $${i++}
    `, params);

    res.json({ posts: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/community/posts/:id
router.get('/posts/:id', async (req, res) => {
  try {
    const result = await query(`
      SELECT cp.*, u.name AS author_name, u.role AS author_role
      FROM community_posts cp JOIN users u ON u.id = cp.author_id
      WHERE cp.id = $1
    `, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Post not found' });

    // Increment view count
    await query(`UPDATE community_posts SET views = views + 1 WHERE id = $1`, [req.params.id]);
    res.json({ post: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/community/posts
router.post('/posts', authMiddleware, async (req, res) => {
  try {
    const { title, content, category, district_id, tags } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'title and content required' });

    const result = await query(`
      INSERT INTO community_posts (id, author_id, title, content, category, district_id, tags)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [uuidv4(), req.user.id, title, content, category || 'general', district_id, tags ? JSON.stringify(tags) : null]);

    res.status(201).json({ post: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/community/posts/:id/like
router.post('/posts/:id/like', authMiddleware, async (req, res) => {
  try {
    await query(`UPDATE community_posts SET likes = likes + 1 WHERE id = $1`, [req.params.id]);
    res.json({ message: 'Liked' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/community/posts/:id/comments
router.get('/posts/:id/comments', async (req, res) => {
  try {
    const result = await query(`
      SELECT pc.*, u.name AS author_name, u.role AS author_role
      FROM post_comments pc
      JOIN users u ON u.id = pc.author_id
      WHERE pc.post_id = $1
      ORDER BY pc.created_at ASC
    `, [req.params.id]);
    res.json({ comments: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/community/posts/:id/comments
router.post('/posts/:id/comments', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'content required' });

    const result = await query(`
      INSERT INTO post_comments (id, post_id, author_id, content)
      VALUES ($1,$2,$3,$4) RETURNING *
    `, [require('uuid').v4(), req.params.id, req.user.id, content.trim()]);

    // Update reply count on post
    await query(`UPDATE community_posts SET replies = replies + 1 WHERE id = $1`, [req.params.id]);

    res.status(201).json({ comment: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/community/posts/:id/comments/:cid/like
router.post('/posts/:id/comments/:cid/like', authMiddleware, async (req, res) => {
  try {
    await query(`UPDATE post_comments SET likes = likes + 1 WHERE id = $1 AND post_id = $2`, [req.params.cid, req.params.id]);
    res.json({ message: 'Liked' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
