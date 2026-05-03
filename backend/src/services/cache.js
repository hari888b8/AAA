'use strict';

/**
 * Redis Caching Service
 * Provides API response caching, rate limiting support, and session storage.
 * Falls back to in-memory Map when Redis is unavailable.
 */

const { createClient } = require('redis');
const logger = require('../lib/logger');
const config = require('../lib/config');

let redisClient = null;
let isConnected = false;

// In-memory fallback cache
const memoryCache = new Map();
const MEMORY_CACHE_MAX = 1000;

/**
 * Initialize Redis connection
 */
async function initRedis() {
  try {
    redisClient = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
        reconnectStrategy: (retries) => {
          if (retries > 10) return new Error('Max Redis retries reached');
          return Math.min(retries * 200, 5000);
        },
      },
    });

    redisClient.on('error', (err) => {
      if (isConnected) logger.warn({ err: err.message }, '[Cache] Redis error');
      isConnected = false;
    });

    redisClient.on('connect', () => {
      isConnected = true;
      logger.info('[Cache] Redis connected');
    });

    redisClient.on('reconnecting', () => {
      logger.debug('[Cache] Redis reconnecting...');
    });

    await redisClient.connect();
    return true;
  } catch (err) {
    logger.warn({ err: err.message }, '[Cache] Redis unavailable, using in-memory fallback');
    isConnected = false;
    return false;
  }
}

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} Parsed cached value or null
 */
async function get(key) {
  try {
    if (isConnected && redisClient) {
      const val = await redisClient.get(key);
      if (val === null) return null;
      return JSON.parse(val);
    }
    // Memory fallback
    const entry = memoryCache.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      memoryCache.delete(key);
      return null;
    }
    return entry.value;
  } catch (err) {
    logger.debug({ key, err: err.message }, '[Cache] Get error');
    return null;
  }
}

/**
 * Set value in cache with TTL
 * @param {string} key - Cache key
 * @param {any} value - Value to cache (will be JSON stringified)
 * @param {number} [ttlSeconds=300] - Time to live in seconds (default 5 min)
 */
async function set(key, value, ttlSeconds = 300) {
  try {
    const serialized = JSON.stringify(value);

    if (isConnected && redisClient) {
      await redisClient.setEx(key, ttlSeconds, serialized);
      return;
    }

    // Memory fallback with LRU eviction
    if (memoryCache.size >= MEMORY_CACHE_MAX) {
      const firstKey = memoryCache.keys().next().value;
      memoryCache.delete(firstKey);
    }
    memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  } catch (err) {
    logger.debug({ key, err: err.message }, '[Cache] Set error');
  }
}

/**
 * Delete a cache key
 * @param {string} key - Cache key to invalidate
 */
async function del(key) {
  try {
    if (isConnected && redisClient) {
      await redisClient.del(key);
    }
    memoryCache.delete(key);
  } catch (err) {
    logger.debug({ key, err: err.message }, '[Cache] Del error');
  }
}

/**
 * Invalidate all keys matching a pattern
 * @param {string} pattern - Redis glob pattern (e.g., 'prices:*')
 */
async function invalidatePattern(pattern) {
  try {
    if (isConnected && redisClient) {
      let cursor = 0;
      do {
        const result = await redisClient.scan(cursor, { MATCH: pattern, COUNT: 100 });
        cursor = result.cursor;
        if (result.keys.length > 0) {
          await redisClient.del(result.keys);
        }
      } while (cursor !== 0);
    }

    // Memory fallback: delete matching keys
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of memoryCache.keys()) {
      if (regex.test(key)) memoryCache.delete(key);
    }
  } catch (err) {
    logger.debug({ pattern, err: err.message }, '[Cache] Invalidate pattern error');
  }
}

/**
 * Express middleware for caching API responses
 * @param {number} ttlSeconds - Cache TTL
 * @param {Function} [keyFn] - Custom key generator (req) => string
 * @returns {Function} Express middleware
 */
function cacheMiddleware(ttlSeconds = 300, keyFn = null) {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') return next();

    const key = keyFn
      ? keyFn(req)
      : `api:${req.originalUrl}:${req.user?.id || 'anon'}`;

    const cached = await get(key);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Intercept res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        set(key, body, ttlSeconds).catch(() => {});
      }
      res.set('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  };
}

/**
 * Get cache statistics
 */
async function getStats() {
  const stats = { backend: isConnected ? 'redis' : 'memory' };

  if (isConnected && redisClient) {
    try {
      const info = await redisClient.info('memory');
      const usedMemMatch = info.match(/used_memory_human:(\S+)/);
      stats.used_memory = usedMemMatch ? usedMemMatch[1] : 'unknown';

      const keyspaceInfo = await redisClient.info('keyspace');
      const dbMatch = keyspaceInfo.match(/db0:keys=(\d+)/);
      stats.total_keys = dbMatch ? parseInt(dbMatch[1]) : 0;
    } catch {
      stats.error = 'Could not fetch Redis stats';
    }
  } else {
    stats.total_keys = memoryCache.size;
    stats.max_keys = MEMORY_CACHE_MAX;
  }

  return stats;
}

/**
 * Graceful shutdown
 */
async function disconnect() {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('[Cache] Redis disconnected');
    } catch {
      // Already disconnected
    }
  }
}

module.exports = {
  initRedis,
  get,
  set,
  del,
  invalidatePattern,
  cacheMiddleware,
  getStats,
  disconnect,
  isConnected: () => isConnected,
};
