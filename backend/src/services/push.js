'use strict';

/**
 * Push Notification Service — Firebase Cloud Messaging (FCM)
 * Sends real push notifications via FCM HTTP v1 API in production.
 * Falls back to console logging in development.
 */

const https = require('https');
const { query } = require('../db/pool');
const logger = require('../lib/logger');

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const FIREBASE_SERVER_KEY = process.env.FIREBASE_SERVER_KEY;

const IS_PUSH_CONFIGURED = !!(FIREBASE_PROJECT_ID && FIREBASE_SERVER_KEY);

/**
 * Send push notification to a single device token
 * @param {string} fcmToken - Device FCM token
 * @param {Object} notification - {title, body, image?}
 * @param {Object} [data] - Custom data payload
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function sendToDevice(fcmToken, notification, data = {}) {
  if (!IS_PUSH_CONFIGURED) {
    logger.debug({ fcmToken: fcmToken?.slice(-8), notification }, '[Push-DEV] Would send notification');
    return { success: true, provider: 'development' };
  }

  const payload = JSON.stringify({
    to: fcmToken,
    notification: {
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icons/agrihub-192.png',
      image: notification.image,
      click_action: notification.click_action || 'OPEN_APP',
      sound: 'default',
    },
    data: {
      ...data,
      click_action: 'OPEN_APP',
    },
    android: {
      priority: 'high',
      notification: {
        channel_id: 'agrihub_default',
        sound: 'default',
      },
    },
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'fcm.googleapis.com',
      path: '/fcm/send',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${FIREBASE_SERVER_KEY}`,
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.success >= 1) {
            resolve({ success: true, messageId: parsed.results?.[0]?.message_id });
          } else {
            const error = parsed.results?.[0]?.error || 'Unknown FCM error';
            resolve({ success: false, error });
          }
        } catch {
          resolve({ success: false, error: `Parse error: ${body}` });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ success: false, error: 'FCM request timeout' });
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Send push notification to a user (all their registered devices)
 * @param {string} userId - User UUID
 * @param {Object} notification - {title, body, image?}
 * @param {Object} [data] - Custom data payload
 * @returns {Promise<{sent: number, failed: number, errors: string[]}>}
 */
async function sendToUser(userId, notification, data = {}) {
  try {
    const { rows: devices } = await query(
      `SELECT fcm_token FROM device_tokens WHERE user_id = $1 AND active = true`,
      [userId]
    );

    if (!devices.length) {
      logger.debug({ userId }, '[Push] No active devices for user');
      return { sent: 0, failed: 0, errors: ['No active devices'] };
    }

    let sent = 0;
    let failed = 0;
    const errors = [];

    for (const device of devices) {
      const result = await sendToDevice(device.fcm_token, notification, data);
      if (result.success) {
        sent++;
      } else {
        failed++;
        errors.push(result.error);

        // Deactivate invalid tokens
        if (result.error === 'NotRegistered' || result.error === 'InvalidRegistration') {
          await query(
            `UPDATE device_tokens SET active = false WHERE fcm_token = $1`,
            [device.fcm_token]
          ).catch(() => {});
          logger.info({ userId, token: device.fcm_token.slice(-8) }, '[Push] Deactivated invalid token');
        }
      }
    }

    if (sent > 0) {
      logger.info({ userId, sent, failed }, '[Push] Notifications sent');
    }

    return { sent, failed, errors };
  } catch (err) {
    logger.error({ userId, err }, '[Push] Failed to send notifications');
    return { sent: 0, failed: 0, errors: [err.message] };
  }
}

/**
 * Send push notification to multiple users
 * @param {string[]} userIds - Array of user UUIDs
 * @param {Object} notification - {title, body, image?}
 * @param {Object} [data] - Custom data payload
 * @returns {Promise<{totalSent: number, totalFailed: number}>}
 */
async function sendToUsers(userIds, notification, data = {}) {
  let totalSent = 0;
  let totalFailed = 0;

  // Process in batches of 10 to avoid overwhelming FCM
  const batchSize = 10;
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(userId => sendToUser(userId, notification, data))
    );
    for (const result of results) {
      totalSent += result.sent;
      totalFailed += result.failed;
    }
  }

  return { totalSent, totalFailed };
}

/**
 * Send topic-based notification (e.g., weather alerts, price alerts)
 * @param {string} topic - FCM topic name
 * @param {Object} notification - {title, body, image?}
 * @param {Object} [data] - Custom data payload
 */
async function sendToTopic(topic, notification, data = {}) {
  if (!IS_PUSH_CONFIGURED) {
    logger.debug({ topic, notification }, '[Push-DEV] Would send topic notification');
    return { success: true, provider: 'development' };
  }

  const payload = JSON.stringify({
    to: `/topics/${topic}`,
    notification: {
      title: notification.title,
      body: notification.body,
      sound: 'default',
    },
    data,
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'fcm.googleapis.com',
      path: '/fcm/send',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${FIREBASE_SERVER_KEY}`,
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({ success: res.statusCode < 300 });
      });
    });

    req.on('error', (err) => resolve({ success: false, error: err.message }));
    req.setTimeout(10000, () => { req.destroy(); resolve({ success: false, error: 'timeout' }); });
    req.write(payload);
    req.end();
  });
}

module.exports = { sendToDevice, sendToUser, sendToUsers, sendToTopic, IS_PUSH_CONFIGURED };
