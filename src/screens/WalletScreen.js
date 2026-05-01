import { api } from '../api.js';
import { showToast, showModal, closeModal } from '../app-shell.js';
import { t } from '../i18n.js';

// ═══════════════════════════════════════════════════════════════
// UNIFIED WALLET & CREDIT SYSTEM — Frontend Screen
// ═══════════════════════════════════════════════════════════════
export function renderWallet(container) {
  let loading = true;
  let walletData = null;
  let tab = 'overview'; // overview | history | referral | leaderboard
  let historyData = [];
  let referralData = null;
  let leaderboard = [];

  async function loadWallet() {
    try {
      loading = true; draw();
      walletData = await api.getWalletBalance();
      loading = false; draw();
    } catch (e) { loading = false; showToast('Failed to load wallet', 'error'); draw(); }
  }

  async function loadHistory() {
    try {
      const data = await api.getWalletHistory();
      historyData = data.transactions || [];
      draw();
    } catch (e) { showToast('Failed to load history', 'error'); }
  }

  async function loadReferral() {
    try {
      referralData = await api.getWalletReferral();
      draw();
    } catch (e) { showToast('Failed to load referral info', 'error'); }
  }

  async function loadLeaderboard() {
    try {
      const data = await api.getWalletLeaderboard();
      leaderboard = data.leaderboard || [];
      draw();
    } catch (e) { showToast('Failed to load leaderboard', 'error'); }
  }

  function switchTab(newTab) {
    tab = newTab;
    if (newTab === 'history' && !historyData.length) loadHistory();
    if (newTab === 'referral' && !referralData) loadReferral();
    if (newTab === 'leaderboard' && !leaderboard.length) loadLeaderboard();
    draw();
  }

  function draw() {
    container.innerHTML = `
      <div style="padding:16px;max-width:600px;margin:0 auto;">
        <!-- Hero Header -->
        <div style="background:linear-gradient(135deg,#1B5E20,#4CAF50);border-radius:16px;padding:24px;color:#fff;margin-bottom:16px;text-align:center;">
          <div style="font-size:14px;opacity:0.9;">AgriHub Credits</div>
          <div style="font-size:42px;font-weight:700;margin:8px 0;">
            ${loading ? '...' : (walletData?.credits?.balance || 0).toLocaleString()}
          </div>
          <div style="font-size:13px;opacity:0.8;">
            🎯 Earned: ${walletData?.credits?.total_earned || 0} | 💸 Spent: ${walletData?.credits?.total_spent || 0}
          </div>
          ${walletData?.cash_balance ? `<div style="margin-top:8px;font-size:13px;background:rgba(255,255,255,0.15);border-radius:8px;padding:6px 12px;display:inline-block;">
            💵 Cash Wallet: ₹${Number(walletData.cash_balance).toLocaleString()}
          </div>` : ''}
        </div>

        <!-- Tab Navigation -->
        <div style="display:flex;gap:4px;margin-bottom:16px;overflow-x:auto;">
          ${['overview', 'history', 'referral', 'leaderboard'].map(t => `
            <button onclick="window._walletTab('${t}')" style="flex:1;min-width:80px;padding:10px 8px;border-radius:10px;border:none;font-size:12px;font-weight:600;cursor:pointer;
              background:${tab === t ? '#E8F5E9' : '#f5f5f5'};color:${tab === t ? '#1B5E20' : '#666'};">
              ${{ overview: '🏠 Overview', history: '📜 History', referral: '🎁 Referral', leaderboard: '🏆 Top' }[t]}
            </button>
          `).join('')}
        </div>

        <!-- Tab Content -->
        ${tab === 'overview' ? renderOverview() : ''}
        ${tab === 'history' ? renderHistory() : ''}
        ${tab === 'referral' ? renderReferralTab() : ''}
        ${tab === 'leaderboard' ? renderLeaderboard() : ''}
      </div>
    `;
  }

  function renderOverview() {
    if (loading) return '<div style="text-align:center;padding:40px;color:#888;">Loading...</div>';
    const spendOptions = walletData?.spend_options || [];
    const recent = walletData?.recent_activity || [];

    return `
      <!-- How to Earn -->
      <div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <h3 style="margin:0 0 12px;font-size:15px;color:#333;">🌟 Earn Credits</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          ${[
            { icon: '📋', action: 'Declare Crop', credits: 10 },
            { icon: '📦', action: 'Create Listing', credits: 15 },
            { icon: '🎁', action: 'Refer a Friend', credits: 50 },
            { icon: '✅', action: 'Complete Profile', credits: 25 },
            { icon: '🎓', action: 'Finish Training', credits: 20 },
            { icon: '📝', action: 'Community Post', credits: 5 },
          ].map(e => `
            <div style="background:#F1F8E9;border-radius:8px;padding:10px;text-align:center;">
              <div style="font-size:20px;">${e.icon}</div>
              <div style="font-size:11px;color:#555;margin-top:4px;">${e.action}</div>
              <div style="font-size:13px;font-weight:700;color:#2E7D32;">+${e.credits}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Spend Credits -->
      <div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <h3 style="margin:0 0 12px;font-size:15px;color:#333;">💎 Spend Credits</h3>
        ${spendOptions.map(opt => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f0f0f0;">
            <div>
              <div style="font-size:13px;font-weight:500;color:#333;">${opt.description}</div>
              <div style="font-size:11px;color:#888;">Use: ${opt.credits} credits</div>
            </div>
            <button onclick="window._walletSpend('${opt.id}')" style="background:#FF6F00;color:#fff;border:none;border-radius:8px;padding:6px 12px;font-size:11px;font-weight:600;cursor:pointer;">
              Redeem
            </button>
          </div>
        `).join('')}
      </div>

      <!-- Recent Activity -->
      ${recent.length ? `
        <div style="background:#fff;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <h3 style="margin:0 0 12px;font-size:15px;color:#333;">📊 Recent Activity</h3>
          ${recent.slice(0, 5).map(tx => `
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f5f5f5;">
              <div style="font-size:12px;color:#555;">${tx.description || tx.action}</div>
              <div style="font-size:13px;font-weight:600;color:${tx.type === 'earn' ? '#2E7D32' : '#D32F2F'};">
                ${tx.type === 'earn' ? '+' : '-'}${tx.credits}
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
  }

  function renderHistory() {
    if (!historyData.length) return '<div style="text-align:center;padding:40px;color:#888;">No credit history yet. Start earning!</div>';
    return `
      <div style="background:#fff;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        ${historyData.map(tx => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #f5f5f5;">
            <div>
              <div style="font-size:13px;font-weight:500;color:#333;">${tx.description || tx.action}</div>
              <div style="font-size:11px;color:#999;">${new Date(tx.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</div>
            </div>
            <div style="font-size:15px;font-weight:700;color:${tx.type === 'earn' ? '#2E7D32' : '#D32F2F'};">
              ${tx.type === 'earn' ? '+' : '-'}${tx.credits}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderReferralTab() {
    if (!referralData) return '<div style="text-align:center;padding:40px;color:#888;">Loading referral info...</div>';
    return `
      <div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <h3 style="margin:0 0 4px;font-size:15px;color:#333;">🎁 Your Referral Code</h3>
        <div style="background:#E8F5E9;border-radius:10px;padding:16px;text-align:center;margin:12px 0;">
          <div style="font-size:24px;font-weight:700;color:#1B5E20;letter-spacing:2px;">${referralData.referral_code}</div>
        </div>
        <button onclick="window._walletCopyCode()" style="width:100%;padding:12px;border:none;border-radius:10px;background:#1B5E20;color:#fff;font-weight:600;cursor:pointer;font-size:14px;">
          📋 Copy & Share
        </button>
        <div style="display:flex;justify-content:space-around;margin-top:16px;text-align:center;">
          <div><div style="font-size:20px;font-weight:700;color:#1B5E20;">${referralData.stats?.total_referrals || 0}</div><div style="font-size:11px;color:#888;">Invited</div></div>
          <div><div style="font-size:20px;font-weight:700;color:#FF6F00;">${referralData.stats?.active_referrals || 0}</div><div style="font-size:11px;color:#888;">Active</div></div>
          <div><div style="font-size:20px;font-weight:700;color:#2E7D32;">${referralData.stats?.total_credits_earned || 0}</div><div style="font-size:11px;color:#888;">Credits</div></div>
        </div>
      </div>
      <div style="background:#FFF8E1;border-radius:10px;padding:12px;font-size:12px;color:#F57F17;text-align:center;">
        🎯 Earn <b>50 credits</b> for each friend who joins + <b>100 credits</b> when they make their first transaction!
      </div>
    `;
  }

  function renderLeaderboard() {
    if (!leaderboard.length) return '<div style="text-align:center;padding:40px;color:#888;">Loading leaderboard...</div>';
    return `
      <div style="background:#fff;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <h3 style="margin:0 0 12px;font-size:15px;color:#333;">🏆 Top Earners This Month</h3>
        ${leaderboard.map((entry, i) => `
          <div style="display:flex;align-items:center;padding:10px 0;border-bottom:1px solid #f5f5f5;">
            <div style="width:28px;height:28px;border-radius:50%;background:${i < 3 ? ['#FFD700','#C0C0C0','#CD7F32'][i] : '#eee'};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;margin-right:12px;">
              ${i + 1}
            </div>
            <div style="flex:1;">
              <div style="font-size:13px;font-weight:500;color:#333;">${entry.name || 'Anonymous'}</div>
              <div style="font-size:11px;color:#888;">${entry.district_name || ''} • ${entry.referrals || 0} referrals</div>
            </div>
            <div style="font-size:15px;font-weight:700;color:#2E7D32;">${entry.total_earned}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Expose functions to window for event handlers
  window._walletTab = switchTab;
  window._walletSpend = async (optionId) => {
    try {
      const result = await api.spendWalletCredits({ option_id: optionId });
      showToast(`✅ ${result.spent} credits used!`, 'success');
      loadWallet();
    } catch (e) { showToast(e.message || 'Insufficient credits', 'error'); }
  };
  window._walletCopyCode = () => {
    if (referralData?.share_message) {
      navigator.clipboard?.writeText(referralData.share_message);
      showToast('Referral link copied!', 'success');
    }
  };

  loadWallet();
}
