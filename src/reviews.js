/**
 * Shared Review System — Reusable across all platforms
 * Usage: import { showReviewModal, renderReviewSummary, renderReviewsList } from '../reviews.js';
 */
import { api } from './api.js';
import { showModal, closeModal, showToast } from './main.js';
import { t } from './i18n.js';

// ─── Show Review Submission Modal ──────────────────────────────────────────
export function showReviewModal({ target_type, target_id, target_name, onSuccess }) {
  let selectedRating = 0;

  showModal(`
    <div class="modal-handle"></div>
    <h3 style="margin:0 0 14px">⭐ ${t('write_review') || 'Write a Review'}</h3>
    <div style="background:#FFF8E1;border-radius:10px;padding:10px 12px;margin-bottom:14px">
      <div style="font-size:12px;font-weight:600;color:#F9A825">${target_name}</div>
    </div>
    <div style="text-align:center;margin-bottom:14px">
      <div style="font-size:12px;color:#757575;margin-bottom:6px">${t('tap_to_rate') || 'Tap to rate'}</div>
      <div id="starContainer" style="display:flex;justify-content:center;gap:8px">
        ${[1,2,3,4,5].map(n => `<span class="review-star" data-star="${n}" style="font-size:32px;cursor:pointer;opacity:0.3;transition:all 0.2s">⭐</span>`).join('')}
      </div>
      <div id="ratingLabel" style="font-size:13px;font-weight:700;color:#F9A825;margin-top:4px;min-height:20px"></div>
    </div>
    <div class="form-group"><label>${t('review_title') || 'Title (optional)'}</label><input class="form-input" id="reviewTitle" placeholder="${t('review_title_hint') || 'Sum up your experience'}"></div>
    <div class="form-group"><label>${t('review_body') || 'Your Review'}</label><textarea class="form-input" id="reviewBody" rows="3" placeholder="${t('review_body_hint') || 'Share details of your experience...'}"></textarea></div>
    <button id="submitReviewBtn" style="width:100%;padding:12px;background:#F9A825;color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer;opacity:0.5" disabled>${t('submit_review') || 'Submit Review'}</button>
  `);

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
  const stars = document.querySelectorAll('.review-star');
  const label = document.querySelector('#ratingLabel');
  const btn = document.querySelector('#submitReviewBtn');

  stars.forEach(star => {
    star.addEventListener('click', () => {
      selectedRating = parseInt(star.dataset.star);
      stars.forEach(s => {
        s.style.opacity = parseInt(s.dataset.star) <= selectedRating ? '1' : '0.3';
      });
      label.textContent = ratingLabels[selectedRating] || '';
      btn.disabled = false;
      btn.style.opacity = '1';
    });
  });

  btn?.addEventListener('click', async () => {
    if (!selectedRating) return;
    btn.disabled = true;
    btn.textContent = t('loading') || 'Submitting...';
    try {
      await api.submitReview({
        target_type,
        target_id,
        rating: selectedRating,
        title: document.querySelector('#reviewTitle')?.value || '',
        body: document.querySelector('#reviewBody')?.value || '',
      });
      showToast(t('review_submitted') || 'Review submitted! Thank you.', 'success');
      closeModal();
      if (onSuccess) onSuccess();
    } catch (e) {
      showToast(e.message, 'error');
      btn.disabled = false;
      btn.textContent = t('submit_review') || 'Submit Review';
    }
  });
}

// ─── Render Review Summary Bar (avg rating + star distribution) ────────────
export function renderReviewSummary(stats) {
  if (!stats || !stats.total || stats.total === '0') {
    return `<div style="font-size:12px;color:#9E9E9E;padding:8px 0">${t('no_reviews') || 'No reviews yet'}</div>`;
  }
  const avg = Number(stats.avg_rating || 0);
  const total = Number(stats.total || 0);
  const bars = [
    { n: 5, count: Number(stats.five || 0) },
    { n: 4, count: Number(stats.four || 0) },
    { n: 3, count: Number(stats.three || 0) },
    { n: 2, count: Number(stats.two || 0) },
    { n: 1, count: Number(stats.one || 0) },
  ];

  return `
    <div style="display:flex;gap:16px;align-items:center;padding:10px 0">
      <div style="text-align:center;min-width:70px">
        <div style="font-size:32px;font-weight:800;color:#F9A825">${avg.toFixed(1)}</div>
        <div style="font-size:14px;color:#F9A825">${'⭐'.repeat(Math.round(avg))}</div>
        <div style="font-size:11px;color:#757575">${total} ${t('reviews_count') || 'reviews'}</div>
      </div>
      <div style="flex:1">
        ${bars.map(b => {
          const pct = total > 0 ? (b.count / total * 100) : 0;
          return `<div style="display:flex;align-items:center;gap:6px;margin:2px 0">
            <span style="font-size:10px;width:12px;text-align:right;color:#757575">${b.n}</span>
            <div style="flex:1;height:6px;background:#F5F5F5;border-radius:3px;overflow:hidden"><div style="height:100%;width:${pct}%;background:#F9A825;border-radius:3px"></div></div>
            <span style="font-size:10px;width:20px;color:#757575">${b.count}</span>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;
}

// ─── Render Reviews List ───────────────────────────────────────────────────
export function renderReviewsList(reviews) {
  if (!reviews || reviews.length === 0) return '';

  return reviews.map(r => `
    <div style="background:white;border-radius:10px;padding:12px;margin-bottom:8px;box-shadow:0 1px 3px rgba(0,0,0,0.05)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:32px;height:32px;border-radius:50%;background:#F5F5F5;display:flex;align-items:center;justify-content:center;font-size:14px">${r.reviewer_avatar ? `<img src="${r.reviewer_avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">` : '👤'}</div>
          <div>
            <div style="font-weight:700;font-size:12px">${r.reviewer_name || 'User'}</div>
            <div style="font-size:10px;color:#9E9E9E">${timeAgo(r.created_at)}</div>
          </div>
        </div>
        <div style="color:#F9A825;font-size:12px">${'⭐'.repeat(r.rating)}</div>
      </div>
      ${r.title ? `<div style="font-weight:600;font-size:13px;margin-bottom:4px">${escapeHtml(r.title)}</div>` : ''}
      ${r.body ? `<div style="font-size:12px;color:#616161;line-height:1.5">${escapeHtml(r.body)}</div>` : ''}
      <div style="margin-top:6px">
        <button class="helpful-btn" data-rid="${r.id}" style="background:none;border:1px solid #E0E0E0;border-radius:6px;padding:3px 8px;font-size:10px;color:#757575;cursor:pointer">👍 ${t('helpful') || 'Helpful'} (${r.helpful_count || 0})</button>
      </div>
    </div>
  `).join('');
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Show reviews modal for any target ─────────────────────────────────────
export async function showReviewsModal({ target_type, target_id, target_name }) {
  showModal(`<div class="modal-handle"></div><div style="text-align:center;padding:20px"><div class="spinner"></div></div>`);

  try {
    const data = await api.getReviews(target_type, target_id);
    const reviews = data.reviews || [];
    const stats = data.stats || {};

    showModal(`
      <div class="modal-handle"></div>
      <h3 style="margin:0 0 6px">⭐ ${t('reviews') || 'Reviews'} — ${target_name}</h3>
      ${renderReviewSummary(stats)}
      <button id="writeReviewBtn" style="width:100%;padding:10px;background:#F9A825;color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer;margin:8px 0 12px">${t('write_review') || 'Write a Review'}</button>
      <div style="max-height:300px;overflow-y:auto">
        ${reviews.length > 0 ? renderReviewsList(reviews) : `<div style="text-align:center;padding:20px;color:#9E9E9E"><div style="font-size:32px;margin-bottom:6px">📝</div>${t('no_reviews') || 'No reviews yet. Be the first!'}</div>`}
      </div>
    `);

    document.querySelector('#writeReviewBtn')?.addEventListener('click', () => {
      showReviewModal({ target_type, target_id, target_name, onSuccess: () => showReviewsModal({ target_type, target_id, target_name }) });
    });

    document.querySelectorAll('.helpful-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const res = await api.markReviewHelpful(btn.dataset.rid);
          btn.textContent = `👍 ${t('helpful') || 'Helpful'} (${res.helpful_count})`;
        } catch (e) {}
      });
    });
  } catch (e) {
    showModal(`<div class="modal-handle"></div><div style="padding:20px;text-align:center;color:#C62828">Failed to load reviews</div>`);
  }
}
