// ═══════════════════════════════════════════════════════════════
// Offline Action Queue — stores pending actions in IndexedDB
// and auto-syncs when connectivity is restored.
// ═══════════════════════════════════════════════════════════════
import { api } from '../api.js';

const DB_NAME = 'agrihub_offline';
const STORE_NAME = 'pending_actions';
const DB_VERSION = 1;

let db = null;

function openDB() {
  if (db) return Promise.resolve(db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const store = e.target.result.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      store.createIndex('created_at', 'created_at', { unique: false });
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

// Auto-sync on reconnect
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[offline] Back online — syncing pending actions…');
    syncPending().then(r => {
      if (r.synced > 0) console.log(`[offline] Synced ${r.synced} action(s)`);
    });
  });
}
