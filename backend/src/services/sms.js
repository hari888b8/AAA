'use strict';

/**
 * SMS Service — MSG91 primary + Fast2SMS fallback
 * Sends real OTPs in production, logs to console in development.
 */

const https = require('https');
const logger = require('../lib/logger');

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID;
const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID || 'AGRIHB';
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Send OTP via MSG91 (primary provider)
 * @param {string} phone - 10-digit Indian mobile number
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<{success: boolean, provider: string, messageId?: string, error?: string}>}
 */
async function sendViaMSG91(phone, otp) {
  if (!MSG91_AUTH_KEY || !MSG91_TEMPLATE_ID) {
    return { success: false, provider: 'msg91', error: 'MSG91 credentials not configured' };
  }

  const payload = JSON.stringify({
    template_id: MSG91_TEMPLATE_ID,
    short_url: '0',
    realTimeResponse: '1',
    recipients: [{
      mobiles: `91${phone}`,
      otp,
    }],
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'control.msg91.com',
      path: '/api/v5/otp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authkey': MSG91_AUTH_KEY,
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'success' || res.statusCode === 200) {
            resolve({ success: true, provider: 'msg91', messageId: parsed.request_id });
          } else {
            resolve({ success: false, provider: 'msg91', error: parsed.message || data });
          }
        } catch {
          resolve({ success: false, provider: 'msg91', error: `Parse error: ${data}` });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ success: false, provider: 'msg91', error: err.message });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ success: false, provider: 'msg91', error: 'Request timeout' });
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Send OTP via Fast2SMS (fallback provider)
 * @param {string} phone - 10-digit Indian mobile number
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<{success: boolean, provider: string, messageId?: string, error?: string}>}
 */
async function sendViaFast2SMS(phone, otp) {
  if (!FAST2SMS_API_KEY) {
    return { success: false, provider: 'fast2sms', error: 'Fast2SMS API key not configured' };
  }

  const payload = JSON.stringify({
    route: 'otp',
    variables_values: otp,
    numbers: phone,
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'www.fast2sms.com',
      path: '/dev/bulkV2',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authorization': FAST2SMS_API_KEY,
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.return === true || res.statusCode === 200) {
            resolve({ success: true, provider: 'fast2sms', messageId: parsed.request_id });
          } else {
            resolve({ success: false, provider: 'fast2sms', error: parsed.message || data });
          }
        } catch {
          resolve({ success: false, provider: 'fast2sms', error: `Parse error: ${data}` });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ success: false, provider: 'fast2sms', error: err.message });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ success: false, provider: 'fast2sms', error: 'Request timeout' });
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Send OTP with automatic fallback
 * Production: MSG91 → Fast2SMS fallback
 * Development: Console log only
 * @param {string} phone - 10-digit Indian mobile number  
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<{success: boolean, provider: string, messageId?: string, error?: string}>}
 */
async function sendOTP(phone, otp) {
  // Development mode: just log it
  if (!IS_PRODUCTION) {
    logger.info({ phone: phone.slice(-4), otp: otp.slice(0, 2) + '****' }, '[SMS-DEV] OTP generated (not sent)');
    return { success: true, provider: 'development', messageId: 'dev-mode' };
  }

  // Production: try MSG91 first
  logger.info({ phone: phone.slice(-4) }, '[SMS] Sending OTP via MSG91');
  const msg91Result = await sendViaMSG91(phone, otp);

  if (msg91Result.success) {
    logger.info({ phone: phone.slice(-4), provider: 'msg91', messageId: msg91Result.messageId }, '[SMS] OTP sent successfully');
    return msg91Result;
  }

  // Fallback to Fast2SMS
  logger.warn({ phone: phone.slice(-4), error: msg91Result.error }, '[SMS] MSG91 failed, trying Fast2SMS fallback');
  const fast2smsResult = await sendViaFast2SMS(phone, otp);

  if (fast2smsResult.success) {
    logger.info({ phone: phone.slice(-4), provider: 'fast2sms', messageId: fast2smsResult.messageId }, '[SMS] OTP sent via fallback');
    return fast2smsResult;
  }

  // Both failed
  logger.error({ phone: phone.slice(-4), msg91Error: msg91Result.error, fast2smsError: fast2smsResult.error }, '[SMS] All providers failed');
  return { success: false, provider: 'none', error: `All SMS providers failed: ${msg91Result.error}; ${fast2smsResult.error}` };
}

module.exports = { sendOTP, sendViaMSG91, sendViaFast2SMS };
