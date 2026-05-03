/**
 * Verified Badge & Trust Components
 * Reusable UI components for verification badges and trust scores
 */

/**
 * Render a verification badge inline
 * @param {string} status - 'verified', 'pending', 'unverified'
 * @param {string} size - 'sm', 'md', 'lg'
 */
export function verifiedBadge(status, size = 'sm') {
  if (!status || status === 'unverified') return '';

  const sizes = { sm: '14px', md: '18px', lg: '22px' };
  const fontSize = sizes[size] || sizes.sm;

  if (status === 'verified') {
    return `<span title="Verified Seller" style="display:inline-flex;align-items:center;gap:2px;font-size:${fontSize}">✅</span>`;
  }
  if (status === 'pending') {
    return `<span title="Verification Pending" style="display:inline-flex;align-items:center;gap:2px;font-size:${fontSize};opacity:0.7">⏳</span>`;
  }
  return '';
}

/**
 * Render a trust score badge with color coding
 * @param {number} score - 0-100
 * @param {boolean} showLabel - whether to show the text label
 */
export function trustScoreBadge(score, showLabel = true) {
  if (score === undefined || score === null) return '';

  const numScore = Number(score);
  let color, bg, label;

  if (numScore >= 90) { color = '#1B5E20'; bg = '#E8F5E9'; label = 'Platinum'; }
  else if (numScore >= 75) { color = '#F9A825'; bg = '#FFF8E1'; label = 'Gold'; }
  else if (numScore >= 50) { color = '#757575'; bg = '#F5F5F5'; label = 'Silver'; }
  else if (numScore >= 20) { color = '#795548'; bg = '#EFEBE9'; label = 'Bronze'; }
  else { color = '#9E9E9E'; bg = '#FAFAFA'; label = 'New'; }

  return `<span style="display:inline-flex;align-items:center;gap:4px;background:${bg};color:${color};padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700">
    🛡️ ${numScore}${showLabel ? ` · ${label}` : ''}
  </span>`;
}

/**
 * Render a seller info card with verification and trust
 * @param {Object} seller - { name, verification_status, trust_score, avg_rating, total_reviews }
 */
export function sellerInfoCard(seller) {
  if (!seller) return '';

  const rating = seller.avg_rating ? `⭐ ${Number(seller.avg_rating).toFixed(1)} (${seller.total_reviews || 0})` : '';

  return `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:#FAFAFA;border-radius:10px;margin:8px 0">
      <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#E8F5E9,#C8E6C9);display:flex;align-items:center;justify-content:center;font-size:18px">👤</div>
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-weight:700;font-size:13px">${escapeHtml(seller.name || 'Seller')}</span>
          ${verifiedBadge(seller.verification_status)}
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:2px">
          ${rating ? `<span style="font-size:11px;color:#F9A825">${rating}</span>` : ''}
          ${trustScoreBadge(seller.trust_score)}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render verification CTA banner (for unverified users)
 */
export function verificationCTA() {
  return `
    <div data-nav="profile" style="background:linear-gradient(135deg,#E8F5E9,#C8E6C9);border-radius:12px;padding:14px 16px;margin:8px 0;cursor:pointer;display:flex;align-items:center;gap:12px">
      <div style="font-size:28px">🛡️</div>
      <div style="flex:1">
        <div style="font-weight:700;font-size:13px;color:#1B5E20">Get Verified</div>
        <div style="font-size:11px;color:#2E7D32;margin-top:2px">Upload KYC documents to earn a verified badge and build buyer trust</div>
      </div>
      <div style="color:#1B5E20;font-weight:700;font-size:12px">→</div>
    </div>
  `;
}

/**
 * Render a listing card badge (verified seller indicator on listing cards)
 */
export function listingSellerBadge(sellerName, verificationStatus) {
  return `
    <div style="display:flex;align-items:center;gap:4px;font-size:11px;color:#616161">
      <span>👤 ${escapeHtml(sellerName || 'Seller')}</span>
      ${verifiedBadge(verificationStatus, 'sm')}
    </div>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
