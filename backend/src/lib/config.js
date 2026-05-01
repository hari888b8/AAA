'use strict';

/**
 * Centralized configuration with validation.
 * Fails fast on missing critical env vars in production.
 */

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    // Use console.error here to avoid circular dependency with logger
    console.error(`FATAL: Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

const isProduction = process.env.NODE_ENV === 'production';

const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction,
  port: parseInt(process.env.PORT || '4000', 10),

  // JWT — no fallback in production
  jwt: {
    secret: isProduction
      ? requireEnv('JWT_SECRET')
      : (process.env.JWT_SECRET || 'dev_only_secret_not_for_production_use'),
    expiry: process.env.JWT_EXPIRY || '7d',
    refreshExpiry: parseInt(process.env.REFRESH_TOKEN_EXPIRY || '2592000', 10), // 30 days in seconds
  },

  // CORS — restricted in production
  cors: {
    origins: isProduction
      ? (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean)
      : ['*'],
  },

  // Database
  db: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DB || 'Agrihub',
    user: process.env.POSTGRES_USER || 'Agrihub',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    maxPool: parseInt(process.env.DB_POOL_MAX || '20', 10),
    retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '5', 10),
    retryDelay: parseInt(process.env.DB_RETRY_DELAY || '3000', 10),
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },

  // SMS
  sms: {
    msg91AuthKey: process.env.MSG91_AUTH_KEY,
    msg91TemplateId: process.env.MSG91_TEMPLATE_ID,
    msg91SenderId: process.env.MSG91_SENDER_ID || 'AGRIHB',
    fast2smsApiKey: process.env.FAST2SMS_API_KEY,
  },

  // Payments
  payments: {
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
    commissionRate: parseFloat(process.env.PLATFORM_COMMISSION_RATE || '0.03'),
  },

  // Push Notifications
  push: {
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
    firebaseServerKey: process.env.FIREBASE_SERVER_KEY,
  },

  // Cloud Storage
  storage: {
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID,
    r2SecretKey: process.env.R2_SECRET_ACCESS_KEY,
    r2Bucket: process.env.R2_BUCKET_NAME || 'agrihub-media',
    r2Endpoint: process.env.R2_ENDPOINT,
    r2PublicUrl: process.env.R2_PUBLIC_URL,
  },

  // Monitoring
  monitoring: {
    sentryDsn: process.env.SENTRY_DSN,
  },

  // Rate limiting
  rateLimit: {
    global: { windowMs: 60_000, max: 200 },
    auth: { windowMs: 60_000, max: 10 },   // stricter for auth
    otp: { windowMs: 300_000, max: 5 },    // 5 OTPs per 5 min
  },
};

module.exports = config;
