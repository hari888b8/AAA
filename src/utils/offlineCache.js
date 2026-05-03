// ═══════════════════════════════════════════════════════════════
// Offline-First Caching & Sync Queue Utility
// localStorage-based cache with TTL, sync queue for offline
// writes, network detection, image compression, and data mode.
// ═══════════════════════════════════════════════════════════════

const CACHE_PREFIX = 'agrihub_cache_';
const SYNC_QUEUE_KEY = 'agrihub_sync_queue';

// ─── Cache Management ────────────────────────────────────────

/**
 * Store data in cache with a TTL.
 * @param {string} key - Cache key
 * @param {any} data - Data to store (must be JSON-serializable)
 * @param {number} ttlMinutes - Time-to-live in minutes (default 30)
 */
export function cacheSet(key, data, ttlMinutes = 30) {
  try {
    const entry = {
      data,
      storedAt: Date.now(),
      expiresAt: Date.now() + ttlMinutes * 60 * 1000,
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch (e) {
    console.warn('[offlineCache] cacheSet failed:', e.message);
  }
}

/**
 * Get cached data. Returns null if expired or missing.
 * @param {string} key - Cache key
 * @returns {any|null}
 */
export function cacheGet(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return entry.data;
  } catch (e) {
    console.warn('[offlineCache] cacheGet failed:', e.message);
    return null;
  }
}

/**
 * Remove a specific cache entry.
 * @param {string} key - Cache key
 */
export function cacheClear(key) {
  try {
    localStorage.removeItem(CACHE_PREFIX + key);
  } catch (e) {
    console.warn('[offlineCache] cacheClear failed:', e.message);
  }
}

/**
 * Clear all agrihub cache entries from localStorage.
 */
export function cacheFlush() {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
  } catch (e) {
    console.warn('[offlineCache] cacheFlush failed:', e.message);
  }
}

/**
 * Get a human-readable age label for a cache entry.
 * @param {string} key - Cache key
 * @returns {string|null} e.g. "5 min ago", "2 hrs ago", or null if not cached
 */
export function cacheAge(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    const diffMs = Date.now() - entry.storedAt;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHrs = Math.floor(diffMin / 60);
    return `${diffHrs} hrs ago`;
  } catch (e) {
    console.warn('[offlineCache] cacheAge failed:', e.message);
    return null;
  }
}

// ─── Sync Queue ──────────────────────────────────────────────

/**
 * Add an action to the offline sync queue.
 * @param {{ type: 'POST'|'PATCH'|'DELETE', endpoint: string, body?: object }} action
 */
export function queueAction(action) {
  try {
    const queue = getPendingActions();
    queue.push({ ...action, timestamp: Date.now() });
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('[offlineCache] queueAction failed:', e.message);
  }
}

/**
 * Get all pending actions in the sync queue.
 * @returns {Array}
 */
export function getPendingActions() {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('[offlineCache] getPendingActions failed:', e.message);
    return [];
  }
}

/**
 * Process the sync queue by replaying each action via the provided API client.
 * Removes successful actions; keeps failed ones for retry.
 * @param {object} apiClient - Must have .post(), .patch(), .delete() methods
 * @returns {Promise<{ synced: number, failed: number }>}
 */
export async function processSyncQueue(apiClient) {
  const queue = getPendingActions();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  const failed = [];
  let synced = 0;

  for (const action of queue) {
    try {
      const { type, endpoint, body } = action;
      if (type === 'POST') await apiClient.post(endpoint, body);
      else if (type === 'PATCH') await apiClient.patch(endpoint, body);
      else if (type === 'DELETE') await apiClient.delete(endpoint);
      synced++;
    } catch (e) {
      console.warn('[offlineCache] sync failed for action:', action.endpoint, e.message);
      failed.push(action);
    }
  }

  try {
    if (failed.length > 0) {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(failed));
    } else {
      localStorage.removeItem(SYNC_QUEUE_KEY);
    }
  } catch (e) {
    console.warn('[offlineCache] queue persist failed:', e.message);
  }

  return { synced, failed: failed.length };
}

/**
 * Clear the entire sync queue.
 */
export function clearSyncQueue() {
  try {
    localStorage.removeItem(SYNC_QUEUE_KEY);
  } catch (e) {
    console.warn('[offlineCache] clearSyncQueue failed:', e.message);
  }
}

/**
 * Get the number of pending actions in the queue.
 * @returns {number}
 */
export function getSyncQueueCount() {
  return getPendingActions().length;
}

// ─── Network Status Detection ────────────────────────────────

/**
 * Check if the browser is currently online.
 * @returns {boolean}
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Register a callback for online/offline changes.
 * @param {function} callback - Receives { online: boolean }
 * @returns {function} Unsubscribe function
 */
export function onNetworkChange(callback) {
  const handleOnline = () => callback({ online: true });
  const handleOffline = () => callback({ online: false });
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Get a "last updated" label for a cache key (alias for cacheAge).
 * @param {string} key - Cache key
 * @returns {string|null}
 */
export function getLastUpdatedLabel(key) {
  return cacheAge(key);
}

// ─── Image Compression ───────────────────────────────────────

/**
 * Compress an image file for low-bandwidth uploads.
 * Uses canvas to resize and compress to JPEG base64.
 * @param {File} file - Image file to compress
 * @param {number} maxWidth - Maximum width in pixels (default 800)
 * @param {number} quality - JPEG quality 0–1 (default 0.7)
 * @returns {Promise<string>} Base64-encoded compressed image
 */
export async function compressImage(file, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const base64 = canvas.toDataURL('image/jpeg', quality);
        resolve(base64);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// ─── Data Mode ───────────────────────────────────────────────

/**
 * Check if low-data mode is enabled.
 * @returns {boolean}
 */
export function isLowDataMode() {
  try {
    return localStorage.getItem('agrihub_low_data') === 'true';
  } catch {
    return false;
  }
}

/**
 * Toggle low-data mode on or off.
 * @param {boolean} enabled
 */
export function setLowDataMode(enabled) {
  try {
    localStorage.setItem('agrihub_low_data', String(enabled));
  } catch (e) {
    console.warn('[offlineCache] setLowDataMode failed:', e.message);
  }
}
