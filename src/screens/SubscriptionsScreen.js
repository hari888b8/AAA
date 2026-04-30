import { api } from '../api.js';
import { navigate } from '../main.js';

export function renderSubscriptions(container) {
  container.innerHTML = `
    <div style="padding:16px;max-width:600px;margin:0 auto">
      <div style="text-align:center;margin-bottom:24px">
        <div style="font-size:32px;margin-bottom:8px">⭐</div>
        <h2 style="margin:0;font-size:20px;font-weight:800;color:#1a237e">Subscription Plans</h2>
        <p style="color:#666;font-size:13px;margin-top:4px">Unlock premium features for your farming business</p>
      </div>
      <div id="currentPlan" style="margin-bottom:20px"></div>
      <div id="plansList" style="display:flex;flex-direction:column;gap:12px"></div>
      <div id="subsLoading" style="text-align:center;padding:40px;color:#999">Loading plans...</div>
    </div>`;

  loadPlans(container);
}

async function loadPlans(container) {
  try {
    const [plansRes, currentRes] = await Promise.all([
      api.getSubscriptionPlansAll(),
      api.getCurrentSubscription(),
    ]);

    const plans = plansRes.plans || [];
    const current = currentRes.subscription;
    const currentTier = currentRes.tier || 'free';

    container.querySelector('#subsLoading').style.display = 'none';

    // Current plan badge
    const currentEl = container.querySelector('#currentPlan');
    if (current) {
      const expiresAt = new Date(current.expires_at).toLocaleDateString('en-IN');
      currentEl.innerHTML = `
        <div style="background:linear-gradient(135deg,#E8EAF6,#C5CAE9);border-radius:12px;padding:16px;border:1px solid #9FA8DA">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-size:11px;font-weight:700;color:#3F51B5;text-transform:uppercase">Current Plan</div>
              <div style="font-size:18px;font-weight:800;color:#1a237e;margin-top:4px">${current.plan_name}</div>
              <div style="font-size:12px;color:#5C6BC0;margin-top:2px">Expires: ${expiresAt}</div>
            </div>
            <div style="background:#1a237e;color:white;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700">${currentTier.toUpperCase()}</div>
          </div>
          <button id="cancelSubBtn" style="margin-top:12px;background:#EF5350;color:white;border:none;padding:8px 16px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer">Cancel Subscription</button>
        </div>`;
      currentEl.querySelector('#cancelSubBtn').addEventListener('click', async () => {
        if (confirm('Cancel your subscription? Access continues until expiry.')) {
          await api.cancelSubscription();
          loadPlans(container);
        }
      });
    } else {
      currentEl.innerHTML = `
        <div style="background:#FFF3E0;border-radius:12px;padding:14px;border:1px solid #FFE0B2;text-align:center">
          <div style="font-size:13px;color:#E65100;font-weight:600">You're on the Free tier</div>
          <div style="font-size:11px;color:#F57C00;margin-top:4px">Upgrade to unlock premium features</div>
        </div>`;
    }

    // Plan cards
    const listEl = container.querySelector('#plansList');
    listEl.innerHTML = plans.filter(p => p.tier !== 'free').map(plan => {
      const isCurrent = current && current.plan_id === plan.id;
      const features = plan.features || [];
      return `
        <div style="background:white;border-radius:14px;padding:18px;border:${isCurrent ? '2px solid #1a237e' : '1px solid #E0E0E0'};box-shadow:0 2px 8px rgba(0,0,0,0.04)">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div style="font-size:16px;font-weight:700;color:#212121">${plan.name}</div>
              <div style="font-size:12px;color:#666;margin-top:2px">${plan.target_role ? `For ${plan.target_role}s` : 'All roles'}</div>
            </div>
            <div style="text-align:right">
              <div style="font-size:20px;font-weight:800;color:#1a237e">₹${plan.price_monthly}</div>
              <div style="font-size:10px;color:#999">/month</div>
              ${plan.price_yearly ? `<div style="font-size:11px;color:#4CAF50;font-weight:600">₹${plan.price_yearly}/yr (save ${Math.round((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100)}%)</div>` : ''}
            </div>
          </div>
          <div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:6px">
            ${features.slice(0, 6).map(f => `<span style="background:#E8F5E9;color:#2E7D32;font-size:10px;padding:3px 8px;border-radius:10px;font-weight:500">${f.replace(/_/g, ' ')}</span>`).join('')}
          </div>
          ${!isCurrent ? `<button class="subscribe-btn" data-plan-id="${plan.id}" data-plan-name="${plan.name}" style="width:100%;margin-top:14px;background:linear-gradient(135deg,#1a237e,#311b92);color:white;border:none;padding:12px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer">Subscribe — ₹${plan.price_monthly}/mo</button>` : `<div style="text-align:center;margin-top:14px;color:#1a237e;font-weight:700;font-size:13px">✓ Active</div>`}
        </div>`;
    }).join('');

    listEl.querySelectorAll('.subscribe-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const planId = parseInt(btn.dataset.planId);
        if (confirm(`Subscribe to ${btn.dataset.planName}?`)) {
          try {
            await api.subscribe({ plan_id: planId, billing_period: 'monthly' });
            loadPlans(container);
          } catch (e) { alert(e.message); }
        }
      });
    });

  } catch (e) {
    container.querySelector('#subsLoading').textContent = 'Failed to load plans';
  }
}
