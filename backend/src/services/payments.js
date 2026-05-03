'use strict';

/**
 * Payment Gateway Service — Razorpay (production-ready)
 * Handles order creation, payment verification, refunds, and split payments.
 * Uses actual Razorpay API when credentials are configured.
 */

const https = require('https');
const crypto = require('crypto');
const logger = require('../lib/logger');

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
const PLATFORM_COMMISSION_RATE = parseFloat(process.env.PLATFORM_COMMISSION_RATE || '0.03'); // 3%

const IS_LIVE = !!(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET && !RAZORPAY_KEY_ID.startsWith('rzp_test'));
const IS_CONFIGURED = !!(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);

/**
 * Make an authenticated request to Razorpay API
 */
function razorpayRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
    const payload = body ? JSON.stringify(body) : null;

    const options = {
      hostname: 'api.razorpay.com',
      path: `/v1${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
    };

    if (payload) {
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.error?.description || `Razorpay error (${res.statusCode}): ${data}`));
          }
        } catch {
          reject(new Error(`Parse error: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Razorpay request timeout')); });

    if (payload) req.write(payload);
    req.end();
  });
}

/**
 * Create a Razorpay order
 * @param {Object} opts
 * @param {number} opts.amount - Amount in INR (rupees, not paise)
 * @param {string} opts.receipt - Unique receipt/order ID
 * @param {string} [opts.currency='INR']
 * @param {Object} [opts.notes] - Additional metadata
 * @returns {Promise<{id: string, amount: number, currency: string, receipt: string, status: string}>}
 */
async function createOrder({ amount, receipt, currency = 'INR', notes = {} }) {
  if (!IS_CONFIGURED) {
    // Mock mode for development
    const mockId = 'order_' + crypto.randomBytes(12).toString('hex');
    logger.info({ amount, receipt, mockId }, '[Payment-DEV] Mock order created');
    return {
      id: mockId,
      amount: Math.round(amount * 100),
      amount_inr: amount,
      currency,
      receipt,
      status: 'created',
      key_id: RAZORPAY_KEY_ID || 'rzp_test_mock',
    };
  }

  const order = await razorpayRequest('POST', '/orders', {
    amount: Math.round(amount * 100), // Convert to paise
    currency,
    receipt,
    notes,
    payment_capture: 1, // Auto-capture
  });

  logger.info({ orderId: order.id, amount, receipt }, '[Payment] Order created');
  return {
    id: order.id,
    amount: order.amount,
    amount_inr: amount,
    currency: order.currency,
    receipt: order.receipt,
    status: order.status,
    key_id: RAZORPAY_KEY_ID,
  };
}

/**
 * Verify payment signature (after client-side checkout)
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature
 * @returns {boolean}
 */
function verifyPaymentSignature(orderId, paymentId, signature) {
  if (!IS_CONFIGURED) {
    // In dev mode, accept demo payments
    return paymentId.startsWith('pay_demo') || paymentId.startsWith('pay_');
  }

  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return expectedSignature === signature;
}

/**
 * Verify webhook signature
 * @param {string} body - Raw request body
 * @param {string} signature - x-razorpay-signature header
 * @returns {boolean}
 */
function verifyWebhookSignature(body, signature) {
  if (!RAZORPAY_WEBHOOK_SECRET) return false;

  const expected = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  return expected === signature;
}

/**
 * Fetch payment details from Razorpay
 * @param {string} paymentId - Razorpay payment ID
 */
async function getPayment(paymentId) {
  if (!IS_CONFIGURED) return { id: paymentId, status: 'captured', method: 'upi' };
  return razorpayRequest('GET', `/payments/${paymentId}`);
}

/**
 * Process a refund
 * @param {string} paymentId - Original payment ID
 * @param {number} amount - Refund amount in INR (full refund if omitted)
 * @param {Object} [notes] - Refund reason/metadata
 * @returns {Promise<{id: string, amount: number, status: string}>}
 */
async function createRefund(paymentId, amount = null, notes = {}) {
  if (!IS_CONFIGURED) {
    const mockId = 'rfnd_' + crypto.randomBytes(12).toString('hex');
    logger.info({ paymentId, amount, mockId }, '[Payment-DEV] Mock refund created');
    return { id: mockId, amount: amount ? Math.round(amount * 100) : 0, status: 'processed' };
  }

  const body = { notes };
  if (amount) body.amount = Math.round(amount * 100); // paise

  const refund = await razorpayRequest('POST', `/payments/${paymentId}/refund`, body);
  logger.info({ refundId: refund.id, paymentId, amount }, '[Payment] Refund created');
  return refund;
}

/**
 * Create a payment link (for collecting payments without frontend SDK)
 * @param {Object} opts
 * @param {number} opts.amount - Amount in INR
 * @param {string} opts.description
 * @param {Object} opts.customer - {name, phone, email}
 * @param {string} [opts.callback_url]
 * @param {number} [opts.expire_by] - Unix timestamp
 */
async function createPaymentLink({ amount, description, customer, callback_url, expire_by }) {
  if (!IS_CONFIGURED) {
    return { short_url: `https://rzp.io/mock/${crypto.randomBytes(4).toString('hex')}`, id: 'plink_mock' };
  }

  return razorpayRequest('POST', '/payment_links', {
    amount: Math.round(amount * 100),
    currency: 'INR',
    description,
    customer: {
      name: customer.name,
      contact: `+91${customer.phone}`,
      email: customer.email,
    },
    callback_url,
    expire_by,
    notify: { sms: true, email: !!customer.email },
    reminder_enable: true,
  });
}

/**
 * Calculate platform commission split
 * @param {number} totalAmount - Total trade amount in INR
 * @returns {{sellerAmount: number, platformFee: number, totalAmount: number}}
 */
function calculateSplit(totalAmount) {
  const platformFee = Math.round(totalAmount * PLATFORM_COMMISSION_RATE * 100) / 100;
  const sellerAmount = Math.round((totalAmount - platformFee) * 100) / 100;
  return { sellerAmount, platformFee, totalAmount };
}

module.exports = {
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  getPayment,
  createRefund,
  createPaymentLink,
  calculateSplit,
  IS_LIVE,
  IS_CONFIGURED,
  PLATFORM_COMMISSION_RATE,
};
