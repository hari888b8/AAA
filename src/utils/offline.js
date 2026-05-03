// ═══════════════════════════════════════════════════════════════
// Offline Action Queue — stores pending actions in IndexedDB
// and auto-syncs when connectivity is restored.
// Enhanced with: offline data caching, connectivity UI, SW integration
// ═══════════════════════════════════════════════════════════════
import { api } from '../api.js';

const DB_NAME = 'agrihub_offline';
const STORE_NAME = 'pending_actions';
const DATA_STORE = 'offline_data';
const DB_VERSION = 2;

let db = null;

function openDB() {
  if (db) return Promise.resolve(db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const database = e.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('created_at', 'created_at', { unique: false });
      }
      if (!database.objectStoreNames.contains(DATA_STORE)) {
        const dataStore = database.createObjectStore(DATA_STORE, { keyPath: 'key' });
        dataStore.createIndex('expires_at', 'expires_at', { unique: false });
      }
    };
    req.onsuccess = () => { db = req.result; resolve(db); };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Enqueue an action to be replayed when online.
 * @param {string} type — action type (e.g. 'POST:/agriflow/listings')
 * @param {object} payload — request body or params
 */
export async function enqueueAction(type, payload) {
  const store = (await openDB()).transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME);
  return new Promise((resolve, reject) => {
    const req = store.add({ type, payload, created_at: Date.now() });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Replay all stored actions in order. Removes each after successful replay.
 * Returns { synced: number, failed: number }.
 */
export async function syncPending() {
  const store = (await openDB()).transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME);
  const items = await new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  let synced = 0, failed = 0;
  for (const item of items) {
    try {
      const [method, path] = item.type.split(':');
      if (method === 'POST') await api.post(path, item.payload);
      else if (method === 'PATCH') await api.patch(path, item.payload);
      else if (method === 'DELETE') await api.del(path);
      else await api.post(path, item.payload);

      // Remove from store after success
      const delTx = (await openDB()).transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME);
      await new Promise((res, rej) => {
        const r = delTx.delete(item.id);
        r.onsuccess = () => res();
        r.onerror = () => rej(r.error);
      });
      synced++;
    } catch (e) {
      console.warn('[offline] sync failed for action', item.id, e.message);
      failed++;
    }
  }
  return { synced, failed };
}

/** Check current connectivity. */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Store data for offline access (e.g., crop prices, weather)
 * @param {string} key - Unique key (e.g., 'prices:latest', 'weather:guntur')
 * @param {any} data - Data to cache
 * @param {number} [ttlMs=3600000] - Time to live (default 1 hour)
 */
export async function cacheOfflineData(key, data, ttlMs = 3600000) {
  try {
    const store = (await openDB()).transaction(DATA_STORE, 'readwrite').objectStore(DATA_STORE);
    await new Promise((resolve, reject) => {
      const req = store.put({ key, data, stored_at: Date.now(), expires_at: Date.now() + ttlMs });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('[offline] cache write failed:', e.message);
  }
}

/**
 * Get cached offline data
 * @param {string} key - Data key
 * @returns {Promise<any|null>}
 */
export async function getCachedData(key) {
  try {
    const store = (await openDB()).transaction(DATA_STORE, 'readonly').objectStore(DATA_STORE);
    return new Promise((resolve) => {
      const req = store.get(key);
      req.onsuccess = () => {
        const entry = req.result;
        if (!entry) return resolve(null);
        if (Date.now() > entry.expires_at) return resolve(null);
        resolve(entry.data);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Get count of pending sync items
 */
export async function getPendingCount() {
  try {
    const store = (await openDB()).transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME);
    return new Promise((resolve) => {
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}

/**
 * Show offline connectivity banner
 */
export function showOfflineBanner() {
  let banner = document.getElementById('agrihub-offline-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'agrihub-offline-banner';
    banner.style.cssText = `
      position:fixed;top:0;left:0;right:0;z-index:99999;
      background:#F57C00;color:#fff;padding:8px 16px;
      font-size:12px;text-align:center;font-weight:500;
      display:flex;align-items:center;justify-content:center;gap:8px;
      transform:translateY(-100%);transition:transform 0.3s ease;
    `;
    document.body.prepend(banner);
  }
  banner.innerHTML = '📡 You are offline. Changes will sync when connected.';
  requestAnimationFrame(() => { banner.style.transform = 'translateY(0)'; });
}

export function hideOfflineBanner() {
  const banner = document.getElementById('agrihub-offline-banner');
  if (banner) {
    banner.style.transform = 'translateY(-100%)';
    setTimeout(() => banner.remove(), 300);
  }
}

// Auto-sync on reconnect
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[offline] Back online — syncing pending actions…');
    hideOfflineBanner();
    syncPending().then(r => {
      if (r.synced > 0) console.log(`[offline] Synced ${r.synced} action(s)`);
    });
  });

  window.addEventListener('offline', () => {
    showOfflineBanner();
  });

  // Show banner if already offline on load
  if (!navigator.onLine) {
    setTimeout(showOfflineBanner, 500);
  }
}
