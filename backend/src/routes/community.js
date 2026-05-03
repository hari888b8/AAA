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

// ═══════════════════════════════════════════════════════════════
// CROP-SPECIFIC CHANNELS — Sub-communities
// ═══════════════════════════════════════════════════════════════

router.get('/channels', async (req, res) => {
  const channels = [
    { id: 'paddy', name: '#Paddy', icon: '🌾', members: 12400, description: 'Rice cultivation tips, prices, problems' },
    { id: 'cotton', name: '#Cotton', icon: '🌿', members: 8700, description: 'Cotton farming best practices' },
    { id: 'shrimp', name: '#Shrimp', icon: '🦐', members: 5200, description: 'Aquaculture & shrimp farming' },
    { id: 'organic', name: '#Organic', icon: '🌱', members: 6800, description: 'Natural & organic methods' },
    { id: 'market', name: '#MarketPrices', icon: '📊', members: 15600, description: 'Daily mandi prices & trends' },
    { id: 'weather', name: '#Weather', icon: '🌧️', members: 18200, description: 'Weather alerts & advisory' },
    { id: 'machinery', name: '#Machinery', icon: '🚜', members: 4300, description: 'Equipment tips & reviews' },
    { id: 'dairy', name: '#Dairy', icon: '🐄', members: 7100, description: 'Animal husbandry & dairy' },
    { id: 'horticulture', name: '#Horticulture', icon: '🍎', members: 5900, description: 'Fruits & vegetables' },
    { id: 'success', name: '#SuccessStories', icon: '🏆', members: 9400, description: 'Farmer achievements' },
  ];
  res.json({ channels });
});

// ═══════════════════════════════════════════════════════════════
// EXPERT VERIFICATION & BEST ANSWERS
// ═══════════════════════════════════════════════════════════════

// POST /community/posts/:id/mark-best — Mark best answer
router.post('/posts/:id/mark-best', authMiddleware, async (req, res) => {
  try {
    const { comment_id } = req.body;
    if (!comment_id) return res.status(400).json({ error: 'comment_id required' });

    // Verify post ownership
    const post = await query(`SELECT * FROM community_posts WHERE id = $1 AND author_id = $2`, [req.params.id, req.user.id]);
    if (!post.rows.length) return res.status(403).json({ error: 'Only post author can mark best answer' });

    // Remove previous best answer
    await query(`UPDATE post_comments SET is_best_answer = FALSE WHERE post_id = $1`, [req.params.id]);
    // Mark new best
    await query(`UPDATE post_comments SET is_best_answer = TRUE WHERE id = $1 AND post_id = $2`, [comment_id, req.params.id]);
    // Mark post as answered
    await query(`UPDATE community_posts SET is_answered = TRUE WHERE id = $1`, [req.params.id]);

    res.json({ message: 'Best answer marked' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════
// VOICE POSTS — 60-sec audio posts with transcription
// ═══════════════════════════════════════════════════════════════

router.post('/voice-post', authMiddleware, async (req, res) => {
  try {
    const { audio_url, duration_seconds, language, category, district_id } = req.body;
    if (!audio_url) return res.status(400).json({ error: 'audio_url required' });

    const transcription = `[Voice post - ${duration_seconds || 0}s - ${language || 'te'}]`;

    const result = await query(`
      INSERT INTO community_posts (id, author_id, title, content, category, district_id, post_type, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, 'voice', $7) RETURNING *
    `, [uuidv4(), req.user.id, `🎤 Voice Post`, transcription, category || 'general', district_id,
        JSON.stringify({ audio_url, duration_seconds, language, transcription })]);

    res.status(201).json({ post: result.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════
// ACHIEVEMENT BADGES
// ═══════════════════════════════════════════════════════════════

router.get('/badges', authMiddleware, async (req, res) => {
  try {
    // Calculate badges based on activity
    const stats = await query(`
      SELECT
        (SELECT COUNT(*) FROM community_posts WHERE author_id = $1) AS posts_count,
        (SELECT COUNT(*) FROM post_comments WHERE author_id = $1) AS comments_count,
        (SELECT SUM(likes) FROM post_comments WHERE author_id = $1) AS total_likes,
        (SELECT COUNT(*) FROM post_comments WHERE author_id = $1 AND is_best_answer = TRUE) AS best_answers
    `, [req.user.id]);

    const s = stats.rows[0] || {};
    const badges = [];

    if (s.posts_count >= 1) badges.push({ id: 'first_post', name: 'First Post', icon: '✍️', earned: true });
    if (s.posts_count >= 10) badges.push({ id: 'active_poster', name: 'Active Contributor', icon: '📝', earned: true });
    if (s.posts_count >= 50) badges.push({ id: 'community_star', name: 'Community Star', icon: '⭐', earned: true });
    if (s.comments_count >= 5) badges.push({ id: 'helper', name: 'Helpful Farmer', icon: '🤝', earned: true });
    if (s.comments_count >= 25) badges.push({ id: 'mentor', name: 'Community Mentor', icon: '👨‍🏫', earned: true });
    if (parseInt(s.best_answers) >= 3) badges.push({ id: 'expert', name: 'Verified Expert', icon: '🏅', earned: true });
    if (parseInt(s.total_likes) >= 50) badges.push({ id: 'popular', name: 'Popular Voice', icon: '🔥', earned: true });

    // Available but not earned
    if (s.posts_count < 1) badges.push({ id: 'first_post', name: 'First Post', icon: '✍️', earned: false, requirement: 'Create your first post' });
    if (s.posts_count < 10) badges.push({ id: 'active_poster', name: 'Active Contributor', icon: '📝', earned: false, requirement: '10 posts needed' });

    res.json({ badges, stats: s });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════
// SUCCESS STORIES — Farmer achievements showcase
// ═══════════════════════════════════════════════════════════════

router.get('/success-stories', async (req, res) => {
  try {
    const result = await query(`
      SELECT cp.*, u.name AS author_name, u.district_id, d.name AS district_name
      FROM community_posts cp
      JOIN users u ON u.id = cp.author_id
      LEFT JOIN districts d ON d.id = u.district_id
      WHERE cp.category = 'success_story' AND cp.status = 'active'
      ORDER BY cp.likes DESC, cp.created_at DESC
      LIMIT 20
    `);
    res.json({ stories: result.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
