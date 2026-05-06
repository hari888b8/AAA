import { api } from '../api.js';
import { navigate, showToast } from '../app-shell.js';

/**
 * Training Galaxy — Discover courses and training programs
 */
export function renderTrainingGalaxy(container) {
  let courses = [];
  let stats = { total_courses: 0, total_instructors: 0, total_enrollments: 0 };
  let searchQ = '';
  let sortBy = 'enrollments';
  let isLoading = true;

  async function loadData() {
    isLoading = true; render();
    try {
      const params = new URLSearchParams();
      if (searchQ) params.set('search', searchQ);
      params.set('sort_by', sortBy); params.set('limit', '100');
      const res = await api(`galaxy/training/directory?${params.toString()}`);
      courses = res.courses || []; stats = res.stats || stats;
    } catch (err) { showToast('Failed to load courses', 'error'); }
    isLoading = false; render();
  }

  function render() {
    container.innerHTML = `
      <div style="min-height:100vh;background:#f5f7fa;">
        <div style="background:linear-gradient(135deg,#4A148C,#6A1B9A,#8E24AA);padding:24px 16px 20px;color:#fff;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
            <button onclick="window.navigateBack?.()" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer;">←</button>
            <div>
              <h1 style="margin:0;font-size:20px;font-weight:800;">🎓 Training Galaxy</h1>
              <p style="margin:2px 0 0;font-size:12px;opacity:0.9;">Skill Up • Free Courses • Certifications</p>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:12px;">
            <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px;text-align:center;">
              <div style="font-size:20px;font-weight:800;">${stats.total_courses}</div><div style="font-size:10px;opacity:0.85;">Courses</div>
            </div>
            <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px;text-align:center;">
              <div style="font-size:20px;font-weight:800;">${stats.total_instructors}</div><div style="font-size:10px;opacity:0.85;">Instructors</div>
            </div>
            <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px;text-align:center;">
              <div style="font-size:20px;font-weight:800;">${formatNum(stats.total_enrollments)}</div><div style="font-size:10px;opacity:0.85;">Enrolled</div>
            </div>
          </div>
        </div>
        <div style="padding:12px 14px 0;">
          <div style="display:flex;align-items:center;background:#fff;border:1px solid #E0E0E0;border-radius:12px;padding:10px 14px;margin-bottom:10px;">
            <span style="margin-right:8px;">🔍</span>
            <input id="trainSearch" type="search" placeholder="Search courses, topics, instructors…" value="${searchQ}"
              style="border:none;outline:none;flex:1;font-size:13px;background:transparent;">
          </div>
          <div style="display:flex;gap:6px;padding-bottom:8px;">
            <select id="sortFilter" style="padding:6px 10px;border-radius:20px;border:1px solid #E0E0E0;font-size:12px;background:#fff;">
              <option value="enrollments" ${sortBy==='enrollments'?'selected':''}>Most Popular</option>
              <option value="rating" ${sortBy==='rating'?'selected':''}>Top Rated</option>
              <option value="name" ${sortBy==='name'?'selected':''}>Name A-Z</option>
            </select>
          </div>
        </div>
        <div style="padding:0 14px 80px;">
          ${isLoading ? '<div style="text-align:center;padding:40px;"><div class="spinner"></div></div>' : ''}
          ${!isLoading && courses.length === 0 ? '<div style="text-align:center;padding:40px;color:#757575;"><p style="font-size:40px;">🎓</p><p>No courses found</p></div>' : ''}
          ${!isLoading ? courses.map(c => `
            <div class="galaxy-card" data-id="${c.id}" style="background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;border:1px solid #E8E8E8;cursor:pointer;">
              <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px;">
                <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#F3E5F5,#E1BEE7);display:flex;align-items:center;justify-content:center;font-size:22px;">🎓</div>
                <div style="flex:1;">
                  <div style="font-weight:700;font-size:14px;color:#4A148C;">${c.title}</div>
                  <div style="font-size:11px;color:#757575;">👨‍🏫 ${c.instructor_name || ''} • ${c.institution || ''}</div>
                </div>
              </div>
              <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
                ${c.category ? `<span style="background:#F3E5F5;border-radius:8px;padding:4px 8px;font-size:10px;color:#6A1B9A;">${c.category}</span>` : ''}
                ${c.language ? `<span style="background:#E8EAF6;border-radius:8px;padding:4px 8px;font-size:10px;color:#283593;">🗣️ ${c.language}</span>` : ''}
                ${c.duration_hours ? `<span style="background:#FFF3E0;border-radius:8px;padding:4px 8px;font-size:10px;color:#E65100;">⏱️ ${c.duration_hours}h</span>` : ''}
                ${c.certification_offered ? `<span style="background:#E8F5E9;border-radius:8px;padding:4px 8px;font-size:10px;color:#2E7D32;">🏅 Certificate</span>` : ''}
                ${c.is_free ? `<span style="background:#E8F5E9;border-radius:8px;padding:4px 8px;font-size:10px;color:#2E7D32;">🆓 Free</span>` : `<span style="background:#FFF3E0;border-radius:8px;padding:4px 8px;font-size:10px;color:#E65100;">₹${c.fee_amount}</span>`}
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:11px;color:#757575;">👥 ${formatNum(c.enrollment_count)} enrolled</span>
                ${c.rating ? `<span style="font-size:12px;font-weight:600;color:#F57F17;">⭐ ${c.rating}</span>` : ''}
              </div>
            </div>
          `).join('') : ''}
        </div>
      </div>`;
    attachEvents();
  }

  function attachEvents() {
    const s = container.querySelector('#trainSearch');
    if (s) { let d; s.addEventListener('input', e => { clearTimeout(d); d = setTimeout(() => { searchQ = e.target.value; loadData(); }, 400); }); }
    container.querySelector('#sortFilter')?.addEventListener('change', e => { sortBy = e.target.value; loadData(); });
    container.querySelectorAll('.galaxy-card').forEach(c => c.addEventListener('click', () => navigate(`trainingdetail?id=${c.dataset.id}`)));
  }

  function formatNum(n) { n = parseFloat(n) || 0; if (n >= 1000) return (n/1000).toFixed(1)+'K'; return Math.round(n).toString(); }
  loadData();
}
