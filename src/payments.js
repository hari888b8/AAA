// ─── AgriHub Payment Checkout Module ─────────────────────────────────────────
// Provides showCheckout() for all marketplace screens (AgriGalaxy, KisanConnect, BhoomiOS, AquaOS)

import { api } from './api.js';
import { showModal, closeModal, showToast } from './main.js';
import { t } from './i18n.js';

/**
 * Show payment checkout modal.
 * @param {Object} opts - Checkout options
 * @param {number} opts.amount - Amount in INR
 * @param {string} opts.description - What user is paying for
 * @param {string} opts.order_type - Type: 'agrigalaxy', 'equipment_booking', 'land_inquiry', 'subscription'
 * @param {string} opts.reference_id - Linked order/item UUID
 * @param {Function} opts.onSuccess - Callback on successful payment
 * @param {Function} opts.onFailure - Callback on failed payment
 */
export async function showCheckout({ amount, description, order_type, reference_id, onSuccess, onFailure }) {
  if (!amount || amount <= 0) { showToast('Invalid amount', 'error'); return; }

  showModal(`<div class="modal-handle"></div>
    <h3>💳 ${t('order_summary')}</h3>
    <div class="card" style="padding:16px;margin:12px 0;background:var(--bg)">
      <div class="text-sm text-muted">${description || 'Order'}</div>
      <div style="font-size:28px;font-weight:800;color:var(--primary);margin-top:8px">₹${Number(amount).toLocaleString()}</div>
      <div class="text-sm text-muted mt-sm">Platform fee (3%): ₹${Math.round(amount * 0.03).toLocaleString()}</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;margin:16px 0">
      <button class="btn btn-primary" id="payRazorpay" style="width:100%">
        💳 ${t('pay_now')} — ₹${Number(amount).toLocaleString()}
      </button>
      <button class="btn btn-secondary" id="payCOD" style="width:100%">
        🏠 Cash on Delivery
      </button>
      <button class="btn btn-outline" id="payCancel" style="width:100%">
        ${t('cancel')}
      </button>
    </div>
    <div class="text-sm text-muted" style="text-align:center">🔒 Secured by Razorpay · 256-bit encryption</div>
  `);

  document.querySelector('#payRazorpay')?.addEventListener('click', async () => {
    try {
      // Step 1: Create payment order
      const orderRes = await api.createPaymentOrder({ amount, order_type, reference_id, description });
      const { razorpay_order_id, razorpay_key_id, amount_paise, currency, prefill } = orderRes;

      // Step 2: Open Razorpay checkout (if SDK available)
      if (window.Razorpay) {
        const rzp = new window.Razorpay({
          key: razorpay_key_id,
          amount: amount_paise,
          currency,
          name: 'AgriHub',
          description,
          order_id: razorpay_order_id,
          prefill: { name: prefill?.name, contact: prefill?.contact },
          handler: async function(response) {
            // Step 3: Verify payment
            try {
              const verifyRes = await api.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                payment_order_id: orderRes.payment_order?.id,
              });
              closeModal();
              showToast(t('payment_success'), 'success');
              if (onSuccess) onSuccess(verifyRes);
            } catch(e) {
              showToast(t('payment_failed'), 'error');
              if (onFailure) onFailure(e);
            }
          },
          modal: { ondismiss: () => showToast('Payment cancelled', 'info') },
          theme: { color: '#2E7D32' },
        });
        rzp.open();
      } else {
        // Demo mode: simulate payment without Razorpay SDK
        const demoPaymentId = 'pay_demo_' + Date.now();
        try {
          const verifyRes = await api.verifyPayment({
            razorpay_order_id,
            razorpay_payment_id: demoPaymentId,
            razorpay_signature: 'demo_signature',
            payment_order_id: orderRes.payment_order?.id,
          });
          closeModal();
          showToast(t('payment_success') + ' (Demo)', 'success');
          if (onSuccess) onSuccess(verifyRes);
        } catch(e) {
          showToast(t('payment_failed'), 'error');
          if (onFailure) onFailure(e);
        }
      }
    } catch(e) {
      showToast('Payment error: ' + e.message, 'error');
      if (onFailure) onFailure(e);
    }
  });

  document.querySelector('#payCOD')?.addEventListener('click', async () => {
    try {
      // COD flow: create order without payment
      const orderRes = await api.createPaymentOrder({ amount, order_type, reference_id, description });
      closeModal();
      showToast('Order placed! Pay ₹' + Number(amount).toLocaleString() + ' on delivery.', 'success');
      if (onSuccess) onSuccess({ verified: true, payment: orderRes.payment_order, method: 'cod' });
    } catch(e) {
      showToast(e.message, 'error');
      if (onFailure) onFailure(e);
    }
  });

  document.querySelector('#payCancel')?.addEventListener('click', () => {
    closeModal();
  });
}
