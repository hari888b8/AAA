'use strict';

/**
 * Per-Route Rate Limiters for AquaOS endpoints.
 * Protects marketplace, payment, and auction endpoints from abuse.
 */

const rateLimit = require('express-rate-limit');

// ─── Marketplace & Auction Rate Limits ───────────────────────────────────────
// Higher limits for reads, stricter for writes

const marketplaceWriteLimiter = rateLimit({
  windowMs: 60_000,        // 1 minute
  max: 20,                 // 20 listings/offers per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: {
    error: { code: 'RATE_LIMIT', message: 'Too many marketplace actions. Please slow down.' }
  },
});

const auctionBidLimiter = rateLimit({
  windowMs: 10_000,        // 10 seconds
  max: 5,                  // 5 bids per 10 seconds
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: {
    error: { code: 'RATE_LIMIT', message: 'Too many bids. Please wait before bidding again.' }
  },
});

const paymentLimiter = rateLimit({
  windowMs: 60_000,        // 1 minute
  max: 5,                  // 5 payment attempts per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: {
    error: { code: 'RATE_LIMIT', message: 'Too many payment attempts. Please try again later.' }
  },
});

const negotiationLimiter = rateLimit({
  windowMs: 60_000,        // 1 minute
  max: 30,                 // 30 messages per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: {
    error: { code: 'RATE_LIMIT', message: 'Too many messages. Please slow down.' }
  },
});

const searchLimiter = rateLimit({
  windowMs: 60_000,        // 1 minute
  max: 60,                 // 60 searches per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: {
    error: { code: 'RATE_LIMIT', message: 'Too many search requests.' }
  },
});

const iotIngestionLimiter = rateLimit({
  windowMs: 60_000,        // 1 minute
  max: 120,                // 120 sensor readings per minute (2/sec)
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: {
    error: { code: 'RATE_LIMIT', message: 'Too many sensor readings. Check ingestion frequency.' }
  },
});

module.exports = {
  marketplaceWriteLimiter,
  auctionBidLimiter,
  paymentLimiter,
  negotiationLimiter,
  searchLimiter,
  iotIngestionLimiter,
};
