import { api } from '../api.js';
import { showToast, showModal, closeModal } from '../app-shell.js';
import { t } from '../i18n.js';

export function renderCommunity(container) {
  let posts = [], tab = 'all', loading = true, searchQ = '';

  const SAMPLE_POLLS = [
    { id:'p1', question:'Which fertilizer gives best yield for Kharif Paddy?', options:['Urea+DAP','NPK complex','Organic only','Neem-coated urea'], votes:[45,62,18,31], userVote:null, author:'AgriHub Community', created_at:'2026-04-25T10:00:00Z' },
    { id:'p2', question:'Are you planning to use drip irrigation this season?', options:['Yes, already have it','Planning to install','Considering government subsidy','No, too expensive'], votes:[87,53,41,24], userVote:null, author:'KisanConnect', created_at:'2026-04-24T08:00:00Z' },
    { id:'p3', question:'What is your biggest challenge this farming season?', options:['Weather uncertainty','Input costs','Labour shortage','Market prices'], votes:[112,78,95,66], userVote:null, author:'FarmerConnect', created_at:'2026-04-23T15:00:00Z' },
  ];

  const SAMPLE_EXPERTS = [
    { id:'e1', name:'Dr. Vithal Rao', title:'Agri Scientist', org:'ICRISAT Hyderabad', speciality:'Dryland crops, groundnut, sorghum', questions_answered:284, rating:4.8, badge:'Verified Expert', icon:'👨‍🔬' },
    { id:'e2', name:'Priya Kumari', title:'Soil Health Specialist', org:'ICAR-CRIDA', speciality:'Soil testing, organic farming, microbiome', questions_answered:196, rating:4.9, badge:'Soil Expert', icon:'🔬' },
    { id:'e3', name:'Rajesh Aqua', title:'Aquaculture Consultant', org:'CIBA Chennai', speciality:'Vannamei shrimp, pond management, diseases', questions_answered:152, rating:4.7, badge:'Aqua Expert', icon:'🐟' },
    { id:'e4', name:'Meena Devi', title:'FPO Management Advisor', org:'NABARD AP', speciality:'FPO governance, collective marketing, credit', questions_answered:89, rating:4.6, badge:'FPO Expert', icon:'🏢' },
  ];

  const TRENDING = ['Paddy prices','Organic farming','Drip subsidy','Vannamei shrimp','Cotton MSP','FPO registration','Soil health card','PM-KISAN'];


  const SAMPLE_POSTS = [
    { id:'sp1', title:'Best paddy variety for Rabi season?', content:'I am in Guntur district, irrigated land. Which variety gives best yield - BPT 5204 or MTU 1010? My land is 5 acres with bore well.', category:'questions', author_name:'Ramesh Reddy', likes:12, replies:8, views:145, created_at:'2026-04-26T14:00:00Z' },
    { id:'sp2', title:'Organic pest control that actually works', content:'After 2 years of trial, here is what I found works: Neem oil 5ml/L + Panchagavya 3% spray weekly. Reduced thrips by 80% in my chilli crop without chemicals.', category:'tips', author_name:'Lakshmi Organic Farm', likes:34, replies:15, views:520, created_at:'2026-04-25T09:00:00Z' },
    { id:'sp3', title:'Cotton prices this week - Adilabad update', content:'Adilabad market: Long staple ₹6,850, Medium ₹6,200. Arrivals are low so mills paying premium for quality. Hold if moisture is below 8%.', category:'market', author_name:'Srinivas Cotton', likes:18, replies:5, views:230, created_at:'2026-04-26T18:00:00Z' },
    { id:'sp4', title:'Drip irrigation saved my groundnut crop', content:'Invested ₹18,500/acre in drip. 40% water savings and 20% yield increase compared to flood irrigation. Government subsidy covered 55%.', category:'tips', author_name:'Venkat Farms', likes:45, replies:22, views:680, created_at:'2026-04-24T11:00:00Z' },
    { id:'sp5', title:'FPO procurement rates for Kharif 2026', content:'Any FPOs in Krishna/Guntur sharing their procurement plans for Kharif? Looking for paddy and maize collection centers near Tenali.', category:'general', author_name:'Suresh Kumar', likes:8, replies:4, views:95, created_at:'2026-04-27T07:00:00Z' },
    { id:'sp6', title:'Shrimp pond DO levels dropping fast', content:'My 2-acre Vannamei pond DOC 45 - dissolved oxygen dropping to 3.5 by morning. Running 2HP aerator 8hrs. Should I add DO booster or get bigger aerator?', category:'questions', author_name:'Praveen Aqua', likes:6, replies:11, views:88, created_at:'2026-04-27T05:30:00Z' },
    { id:'sp7', title:'Tomato glut warning - Madanapalle', content:'Massive arrivals from Karnataka pushing Madanapalle tomato to ₹800/quintal. If you have standing crop, consider cold storage or processing units.', category:'market', author_name:'AP Vegetable Growers', likes:28, replies:9, views:410, created_at:'2026-04-25T16:00:00Z' },
  ];

  function render() {
    container.innerHTML = `
      <!-- HERO -->
      <div class="hero-v2" role="banner" style="background:linear-gradient(135deg,#6A1B9A,#4527A0);color:white">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:24px">🌐</span>
          <div style="flex:1">
            <div style="font-weight:800;font-size:16px">Farmer Community</div>
            <div style="font-size:11px;opacity:0.85">Knowledge sharing · Q&A · Market tips</div>
          </div>
          <button id="newPostBtn" type="button" style="background:rgba(255,255,255,0.2);border:none;color:white;padding:6px 12px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer">+ Post</button>
        </div>
      </div>

      <!-- TRENDING TOPICS -->
      <div style="padding:6px 14px" role="search">
        <input id="communitySearch" type="search" placeholder="Search posts, topics…" aria-label="Search community posts" value="${searchQ}" style="width:100%;padding:9px 12px;border-radius:10px;border:1px solid var(--border,#E0E0E0);font-size:13px;background:var(--card,white);font-family:inherit;outline:none">
      </div>
      <div style="padding:4px 14px 8px;background:var(--card,white);border-bottom:1px solid var(--border,#EEE);overflow-x:auto;white-space:nowrap">
        ${TRENDING.map(t=>`<button data-search="${t}" style="display:inline-block;background:#EDE7F6;color:#4527A0;border:none;border-radius:12px;padding:4px 10px;font-size:10px;font-weight:600;margin-right:6px;cursor:pointer">#${t}</button>`).join('')}
      </div>
      <div class="tab-bar" role="tablist">
        ${[['all','📋 All'],['polls','🗳️ Polls'],['experts','👨‍🏫 Experts'],['questions','❓ Q&A'],['tips','💡 Tips'],['market','🛒 Market']].map(([id,label]) =>
          `<button role="tab" aria-selected="${tab === id}" class="tab-btn ${tab === id ? 'active' : ''}" data-tab="${id}">${label}</button>`
        ).join('')}
      </div>
      ${loading ? '<div class="loading"><div class="spinner"></div></div>' : tab === 'polls' ? renderPolls() : tab === 'experts' ? renderExperts() : renderPosts()}
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
    container.querySelector('#communitySearch')?.addEventListener('input', e => { searchQ = e.target.value; render(); });
    container.querySelectorAll('.vote-btn').forEach(b => b.addEventListener('click', () => castVote(b.dataset.poll, parseInt(b.dataset.opt))));
    container.querySelector('#createPollBtn')?.addEventListener('click', showCreatePoll);
    container.querySelectorAll('.ask-expert-btn').forEach(b => b.addEventListener('click', () => showAskExpert(b.dataset.eid)));
  }

  function renderPolls() {
    return `<div style="padding:12px 14px 80px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-size:13px;font-weight:700;color:var(--text,#424242)">Community Polls</div>
        <button id="createPollBtn" style="background:#6A1B9A;color:white;border:none;border-radius:8px;padding:6px 12px;font-size:11px;font-weight:700;cursor:pointer">+ Create Poll</button>
      </div>
      ${SAMPLE_POLLS.map(poll => {
        const total = poll.votes.reduce((a,b)=>a+b,0);
        return `<div style="background:var(--card,white);border-radius:12px;padding:14px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,0.07)">
          <div style="font-size:13px;font-weight:700;color:var(--text,#333);margin-bottom:10px">${poll.question}</div>
          ${poll.options.map((opt,i) => {
            const pct = total ? Math.round(poll.votes[i]/total*100) : 0;
            const voted = poll.userVote === i;
            return `<button class="vote-btn" data-poll="${poll.id}" data-opt="${i}" style="display:block;width:100%;background:${voted?'#E8F5E9':'#F5F5F5'};border:${voted?'2px solid #2E7D32':'2px solid transparent'};border-radius:8px;padding:8px 10px;margin-bottom:6px;cursor:pointer;text-align:left;position:relative;overflow:hidden">
              <div style="position:absolute;top:0;left:0;height:100%;width:${pct}%;background:${voted?'rgba(46,125,50,0.15)':'rgba(106,27,154,0.1)'};border-radius:6px"></div>
              <div style="position:relative;display:flex;justify-content:space-between;align-items:center">
                <span style="font-size:12px;font-weight:${voted?700:500};color:var(--text,#333)">${voted?'✓ ':''} ${opt}</span>
                <span style="font-size:11px;font-weight:700;color:${voted?'#2E7D32':'#757575'}">${pct}%</span>
              </div>
            </button>`;
          }).join('')}
          <div style="font-size:10px;color:var(--text3,#9E9E9E);margin-top:6px">${total} votes · ${poll.author} · ${timeAgo(poll.created_at)}</div>
        </div>`;
      }).join('')}
    </div>`;
  }

  function renderExperts() {
    return `<div style="padding:12px 14px 80px">
      <div style="background:#F3E5F5;border-radius:10px;padding:12px;margin-bottom:14px">
        <div style="font-size:12px;font-weight:700;color:#6A1B9A;margin-bottom:4px">🏆 Verified Experts</div>
        <div style="font-size:11px;color:#555">Get answers from accredited agriculture scientists, specialists, and experienced consultants.</div>
      </div>
      ${SAMPLE_EXPERTS.map(exp => `
        <div style="background:var(--card,white);border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 1px 4px rgba(0,0,0,0.07)">
          <div style="display:flex;gap:10px;align-items:flex-start">
            <div style="width:44px;height:44px;border-radius:50%;background:#EDE7F6;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">${exp.icon}</div>
            <div style="flex:1">
              <div style="font-weight:700;font-size:13px">${exp.name} <span style="background:#2E7D32;color:white;border-radius:8px;font-size:9px;padding:2px 6px">${exp.badge}</span></div>
              <div style="font-size:11px;color:var(--text3,#757575);margin-top:2px">${exp.title} · ${exp.org}</div>
              <div style="font-size:11px;color:var(--text2,#555);margin-top:4px">Speciality: ${exp.speciality}</div>
              <div style="display:flex;gap:12px;margin-top:8px;align-items:center">
                <span style="font-size:10px;color:var(--text3,#9E9E9E)">⭐ ${exp.rating} · 💬 ${exp.questions_answered} answered</span>
                <button class="ask-expert-btn" data-eid="${exp.id}" style="margin-left:auto;background:#1a237e;color:white;border:none;border-radius:8px;padding:5px 12px;font-size:11px;font-weight:700;cursor:pointer">Ask</button>
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>`;
  }


  function renderPosts() {
    let filtered = tab === 'all' ? posts : posts.filter(p => p.category === tab);
    if (searchQ) filtered = filtered.filter(p => `${p.title} ${p.content} ${p.author_name}`.toLowerCase().includes(searchQ.toLowerCase()));
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

  function castVote(pollId, optIdx) {
    const poll = SAMPLE_POLLS.find(p => p.id === pollId);
    if (!poll || poll.userVote !== null) { showToast('Already voted!', 'info'); return; }
    poll.votes[optIdx]++;
    poll.userVote = optIdx;
    render();
    api.post(`/community/polls/${pollId}/vote`, { option: optIdx }).catch(() => null);
  }

  function showCreatePoll() {
    showModal(`<div class="modal-handle"></div>
      <h3>Create Community Poll</h3>
      <div class="form-group"><label>Question</label><input class="form-input" id="pollQ" placeholder="Ask the community…"></div>
      <div class="form-group"><label>Option 1</label><input class="form-input" id="pollO1" placeholder="Option A"></div>
      <div class="form-group"><label>Option 2</label><input class="form-input" id="pollO2" placeholder="Option B"></div>
      <div class="form-group"><label>Option 3 (optional)</label><input class="form-input" id="pollO3" placeholder="Option C"></div>
      <div class="form-group"><label>Option 4 (optional)</label><input class="form-input" id="pollO4" placeholder="Option D"></div>
      <button class="btn btn-primary" id="submitPoll">Create Poll</button>`);
    document.querySelector('#submitPoll')?.addEventListener('click', () => {
      const q = document.querySelector('#pollQ')?.value?.trim();
      const opts = ['#pollO1','#pollO2','#pollO3','#pollO4'].map(s=>document.querySelector(s)?.value?.trim()).filter(Boolean);
      if (!q || opts.length < 2) { showToast('Need question + at least 2 options', 'error'); return; }
      SAMPLE_POLLS.unshift({ id:'p'+Date.now(), question:q, options:opts, votes:opts.map(()=>0), userVote:null, author:'You', created_at:new Date().toISOString() });
      showToast('Poll created!', 'success');
      tab = 'polls'; closeModal(); render();
    });
  }

  function showAskExpert(eid) {
    const exp = SAMPLE_EXPERTS.find(e => e.id === eid);
    if (!exp) return;
    showModal(`<div class="modal-handle"></div>
      <div style="display:flex;gap:10px;align-items:center;margin-bottom:12px">
        <div style="font-size:28px">${exp.icon}</div>
        <div><div style="font-weight:700">${exp.name}</div><div style="font-size:11px;color:#757575">${exp.title}</div></div>
      </div>
      <div class="form-group"><label>Your Question</label><textarea class="form-input" id="expertQ" placeholder="Describe your farm situation and question in detail…" style="height:120px"></textarea></div>
      <div class="form-group"><label>Category</label><select class="form-input" id="expertCat"><option>Crop Management</option><option>Pest & Disease</option><option>Soil & Nutrients</option><option>Irrigation</option><option>Post-harvest</option></select></div>
      <button class="btn btn-primary" id="submitExpertQ">Send Question</button>`);
    document.querySelector('#submitExpertQ')?.addEventListener('click', () => {
      const q = document.querySelector('#expertQ')?.value?.trim();
      if (!q) { showToast('Please enter your question', 'error'); return; }
      api.post('/community/expert-questions', { expert_id: eid, question: q, category: document.querySelector('#expertCat')?.value }).catch(()=>null);
      showToast('Question sent! Expert will reply within 24 hours.', 'success');
      closeModal();
    });
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
    if (posts.length === 0) posts = SAMPLE_POSTS;
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
