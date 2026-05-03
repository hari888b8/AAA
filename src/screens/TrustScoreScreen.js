import { api } from '../api.js';
import { navigate } from '../main.js';

export function renderTrustScore(container) {
  container.innerHTML = `
    <div class="screen-container">
      <header class="screen-header">
        <button class="back-btn" onclick="navigateBack()">←</button>
        <h1>⭐ Trust Score</h1>
      </header>

      <div id="trust-content" class="content-area">
        <div class="loading-spinner">Loading trust score...</div>
      </div>
    </div>
  `;

  loadTrustScore(container);
}

async function loadTrustScore(container) {
  const content = container.querySelector('#trust-content');

  try {
    const [scoreRes, leaderboardRes] = await Promise.all([
      api('/api/trustscore/me'),
      api('/api/trustscore/leaderboard?limit=10'),
    ]);

    const score = scoreRes.trustScore;
    const leaderboard = leaderboardRes.leaderboard || [];

    content.innerHTML = `
      <div class="trust-score-card">
        <div class="score-circle">
          <div class="score-value">${Math.round(score.overall_score)}</div>
          <div class="score-label">Trust Score</div>
        </div>
        <div class="score-details">
          <div class="score-row"><span>Trade Score</span><span>${Math.round(score.trade_score || 50)}/100</span></div>
          <div class="score-row"><span>Payment Score</span><span>${Math.round(score.payment_score || 50)}/100</span></div>
          <div class="score-row"><span>Delivery Score</span><span>${Math.round(score.delivery_score || 50)}/100</span></div>
          <div class="score-row"><span>Quality Score</span><span>${Math.round(score.quality_score || 50)}/100</span></div>
        </div>
        <div class="verification-badge">
          <span class="badge badge-${score.verification_level}">${score.verification_level || 'basic'} verified</span>
        </div>
        <p class="score-meta">Total trades: ${score.total_trades || 0} | Last computed: ${score.last_computed ? new Date(score.last_computed).toLocaleDateString() : 'N/A'}</p>
        <button class="btn btn-primary" id="recompute-btn">Recompute Score</button>
      </div>

      <h3 class="section-title">🏆 Leaderboard</h3>
      <div class="leaderboard">
        ${leaderboard.length ? leaderboard.map((u, i) => `
          <div class="leaderboard-row">
            <span class="rank">#${i + 1}</span>
            <span class="name">${u.name || 'User'}</span>
            <span class="lb-score">${Math.round(u.overall_score)}</span>
          </div>
        `).join('') : '<p class="empty-state">No leaderboard data yet</p>'}
      </div>
    `;

    content.querySelector('#recompute-btn').addEventListener('click', async () => {
      try {
        await api('/api/trustscore/compute', { method: 'POST' });
        loadTrustScore(container);
      } catch (err) {
        alert('Error: ' + err.message);
      }
    });
  } catch (err) {
    content.innerHTML = `<div class="error">${err.message}</div>`;
  }
}
