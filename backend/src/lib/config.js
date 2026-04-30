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

  // Rate limiting
  rateLimit: {
    global: { windowMs: 60_000, max: 200 },
    auth: { windowMs: 60_000, max: 10 },   // stricter for auth
    otp: { windowMs: 300_000, max: 5 },    // 5 OTPs per 5 min
  },
};

module.exports = config;
