// ═══════════════════════════════════════════════════════════════
// Razorpay payment gateway wrapper
// Loads Razorpay checkout SDK on demand and wraps order creation.
// ═══════════════════════════════════════════════════════════════

import { api } from '../api.js';
import { showToast } from '../app-shell.js';

let _sdkPromise = null;

function loadRazorpaySDK() {
  if (typeof window.Razorpay !== 'undefined') return Promise.resolve(true);
  if (_sdkPromise) return _sdkPromise;
  _sdkPromise = new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => { _sdkPromise = null; resolve(false); };
    document.head.appendChild(s);
  });
  return _sdkPromise;
}

/**
 * Open Razorpay checkout for an order.
 * @param {Object} opts
 * @param {number} opts.amount - amount in INR (rupees)
 * @param {string} opts.orderId - order id (DB)
 * @param {string} opts.description - line description
 * @param {Object} [opts.customer] - { name, email, contact }
 * @param {Function} [opts.onSuccess] - (paymentId, orderId, signature)
 * @param {Function} [opts.onFailure] - (err)
 * @returns {Promise<void>}
 */
export async function openCheckout({ amount, orderId, description = 'AgriHub order', customer = {}, onSuccess, onFailure } = {}) {
  const ok = await loadRazorpaySDK();
  if (!ok) {
    showToast?.('Payment gateway unreachable. Try again.', 'error');
    onFailure?.(new Error('SDK_LOAD_FAILED'));
    return;
  }
  let serverOrder;
  try {
    serverOrder = await api.createPaymentOrder?.({ amount: Math.round(amount * 100), orderId, currency: 'INR' });
  } catch (e) {
    onFailure?.(e);
    showToast?.('Could not start payment: ' + (e.message || 'unknown'), 'error');
    return;
  }
  if (!serverOrder?.id) {
    showToast?.('Payment init failed', 'error');
    onFailure?.(new Error('NO_ORDER'));
    return;
  }
  const opts = {
    key: serverOrder.keyId || import.meta.env?.VITE_RAZORPAY_KEY || 'rzp_test_placeholder',
    amount: serverOrder.amount,
    currency: 'INR',
    name: 'AgriHub',
    description,
    order_id: serverOrder.id,
    prefill: {
      name: customer.name || '',
      email: customer.email || '',
      contact: customer.contact || '',
    },
    theme: { color: '#1B5E20' },
    handler: async (resp) => {
      try {
        await api.verifyPayment?.({
          orderId,
          razorpay_order_id: resp.razorpay_order_id,
          razorpay_payment_id: resp.razorpay_payment_id,
          razorpay_signature: resp.razorpay_signature,
        });
        showToast?.('Payment successful', 'success');
        onSuccess?.(resp.razorpay_payment_id, resp.razorpay_order_id, resp.razorpay_signature);
      } catch (e) {
        showToast?.('Payment verification failed', 'error');
        onFailure?.(e);
      }
    },
    modal: {
      ondismiss: () => onFailure?.(new Error('USER_CANCELLED')),
    },
  };
  try {
    const rzp = new window.Razorpay(opts);
    rzp.on('payment.failed', (resp) => {
      showToast?.('Payment failed: ' + (resp.error?.description || ''), 'error');
      onFailure?.(resp.error);
    });
    rzp.open();
  } catch (e) {
    onFailure?.(e);
  }
}

/** UPI deep-link fallback when Razorpay is not configured. */
export function upiIntent({ vpa, name, amount, note }) {
  const url = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(name || 'AgriHub')}&am=${amount}&cu=INR&tn=${encodeURIComponent(note || '')}`;
  window.location.href = url;
}
