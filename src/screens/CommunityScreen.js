import { api } from '../api.js';
import { showToast, showModal, closeModal } from '../main.js';

export function renderCommunity(container) {
  let posts = [], tab = 'all', loading = true;

  function render() {
    container.innerHTML = `
      <div class="tab-bar">
        ${['all', 'general', 'questions', 'tips', 'market'].map(t =>
          `<button class="tab-btn ${tab === t ? 'active' : ''}" data-tab="${t}">${t === 'all' ? '📋 All' : t === 'general' ? '💬 General' : t === 'questions' ? '❓ Questions' : t === 'tips' ? '💡 Tips' : '🛒 Market'}</button>`
        ).join('')}
      </div>
      ${loading ? '<div class="loading"><div class="spinner"></div></div>' : renderPosts()}
    `;
    container.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; render(); }));
    container.querySelectorAll('.post-card[data-pid]').forEach(c => {
      c.addEventListener('click', () => showPostDetail(c.dataset.pid));
    });
    container.querySelectorAll('.like-btn').forEach(b => {
      b.addEventListener('click', async (e) => {
        e.stopPropagation();
        try { await api.likePost(b.dataset.id); showToast('Liked!', 'success'); loadData(); } catch (e) { showToast(e.message, 'error'); }
      });
    });
    container.querySelector('#newPostBtn')?.addEventListener('click', showNewPost);
  }

  function renderPosts() {
    const filtered = tab === 'all' ? posts : posts.filter(p => p.category === tab);
    if (filtered.length === 0) return `
      <div class="empty-state"><div class="es-icon">💬</div><div class="es-title">No posts yet</div>
      <button class="btn btn-primary btn-small mt" id="newPostBtn">+ Create Post</button></div>`;
    return `<div class="section" style="padding-top:8px">
      <button class="btn btn-secondary btn-small mb" id="newPostBtn">+ New Post</button>
      ${filtered.map(p => `
        <div class="post-card" data-pid="${p.id}">
          <div class="post-author">
            <div class="post-avatar">${(p.author_name || 'U')[0]}</div>
            <div><div class="post-name">${p.author_name || 'Anonymous'}</div><div class="post-time">${timeAgo(p.created_at)}</div></div>
            <span class="tag tag-gray" style="margin-left:auto">${p.category || 'general'}</span>
          </div>
          <div class="post-title">${p.title}</div>
          <div class="post-body">${(p.content || '').slice(0, 150)}${(p.content || '').length > 150 ? '…' : ''}</div>
          <div class="post-actions">
            <button class="post-btn like-btn" data-id="${p.id}">❤️ ${p.likes || 0}</button>
            <span class="post-btn">💬 ${p.replies || p.reply_count || 0}</span>
            <span class="post-btn">👁️ ${p.views || 0}</span>
          </div>
        </div>
      `).join('')}
    </div>`;
  }

  async function showPostDetail(id) {
    try {
      const [post, comments] = await Promise.all([
        api.getPost(id),
        api.getComments(id).catch(() => []),
      ]);
      const p = post.post || post;
      const cmts = Array.isArray(comments) ? comments : (comments.comments || []);

      showModal(`
        <div class="modal-handle"></div>
        <div class="post-author" style="display:flex;gap:8px;align-items:center;margin-bottom:12px">
          <div class="post-avatar" style="width:36px;height:36px;border-radius:50%;background:var(--primary-surface);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--primary)">${(p.author_name || 'U')[0]}</div>
          <div><div class="fw-600">${p.author_name || 'Anonymous'}</div><div class="text-sm text-muted">${timeAgo(p.created_at)}</div></div>
        </div>
        <h3>${p.title}</h3>
        <p style="font-size:14px;color:var(--text2);line-height:1.6;margin:12px 0">${p.content || ''}</p>
        <div class="flex gap-sm mb-lg">
          <span class="tag tag-gray">${p.category || 'general'}</span>
          <span class="text-sm text-muted">❤️ ${p.likes || 0} · 💬 ${p.replies || p.reply_count || 0} · 👁️ ${p.views || 0}</span>
        </div>
        <h3 style="font-size:15px">Comments (${cmts.length})</h3>
        ${cmts.length === 0 ? '<p class="text-sm text-muted mt">No comments yet</p>' :
          cmts.map(c => `<div style="padding:10px 0;border-bottom:1px solid var(--border)"><div class="flex gap-sm"><strong class="text-sm">${c.author_name || 'Anonymous'}</strong><span class="text-sm text-muted">${timeAgo(c.created_at)}</span></div><div class="text-sm mt-sm">${c.content}</div></div>`).join('')}
        <div class="form-group mt-lg">
          <input class="form-input" type="text" id="commentInput" placeholder="Write a comment…">
        </div>
        <button class="btn btn-primary btn-small" id="submitComment">Post Comment</button>
      `);
      document.querySelector('#submitComment')?.addEventListener('click', async () => {
        const content = document.querySelector('#commentInput')?.value?.trim();
        if (!content) return;
        try {
          await api.addComment(id, { content });
          showToast('Comment posted!', 'success');
          closeModal(); showPostDetail(id);
        } catch (e) { showToast(e.message, 'error'); }
      });
    } catch (e) { showToast(e.message, 'error'); }
  }

  function showNewPost() {
    showModal(`
      <div class="modal-handle"></div>
      <h3>New Post</h3>
      <div class="form-group"><label>Title</label><input class="form-input" type="text" id="npTitle" placeholder="Ask a question or share a tip…"></div>
      <div class="form-group"><label>Category</label><select class="form-input" id="npCat"><option value="general">General</option><option value="questions">Questions</option><option value="tips">Tips</option><option value="market">Market</option></select></div>
      <div class="form-group"><label>Content</label><textarea class="form-input" id="npContent" placeholder="Share your thoughts…" style="height:120px"></textarea></div>
      <button class="btn btn-primary" id="submitPost">Post</button>
    `);
    document.querySelector('#submitPost')?.addEventListener('click', async () => {
      try {
        await api.createPost({
          title: document.querySelector('#npTitle')?.value,
          content: document.querySelector('#npContent')?.value,
          category: document.querySelector('#npCat')?.value,
        });
        showToast('Post created!', 'success');
        closeModal(); loadData();
      } catch (e) { showToast(e.message, 'error'); }
    });
  }

  async function loadData() {
    loading = true; render();
    try {
      const res = await api.getPosts('?limit=30');
      posts = Array.isArray(res) ? res : (res.posts || []);
    } catch (e) { console.error(e); }
    loading = false; render();
  }

  loadData();
}

function timeAgo(d) {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}
