// ═══════════════════════════════════════════════════════════════
// AgriHub Service Worker — v2 (Offline-First for Rural India)
// Supports: Cache-first assets, Network-first API, Background Sync,
// Push notifications, IndexedDB sync queue
// ═══════════════════════════════════════════════════════════════

const CACHE_VERSION = 2;
const STATIC_CACHE = `agrihub-static-v${CACHE_VERSION}`;
const API_CACHE = `agrihub-api-v${CACHE_VERSION}`;

// Static assets to precache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
];

// API routes to cache for offline availability
const CACHEABLE_API_PATTERNS = [
  '/api/intelligence/prices',
  '/api/intelligence/crops',
  '/api/weather',
  '/api/crop-doctor/diseases',
  '/api/scheme-discovery',
  '/api/training/courses',
  '/api/agrigalaxy/products',
  '/api/translate',
];

// ─── Install ─────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll(PRECACHE_URLS).catch(() => {});
    }).then(() => self.skipWaiting())
  );
});

// ─── Activate: Clean old caches ──────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== STATIC_CACHE && name !== API_CACHE)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// ─── Fetch: Strategy-based routing ──────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP and chrome-extension requests
  if (url.protocol === 'chrome-extension:' || url.protocol === 'blob:') return;

  // Non-GET requests: attempt network, queue for sync on failure
  if (request.method !== 'GET') {
    event.respondWith(handleMutation(request));
    return;
  }

  // API requests: Network-first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithCache(request, API_CACHE));
    return;
  }

  // Static assets: Cache-first with stale-while-revalidate
  if (url.pathname.match(/\.(js|css|woff2?|png|jpg|webp|svg|ico)$/)) {
    event.respondWith(cacheFirstWithRevalidate(request, STATIC_CACHE));
    return;
  }

  // HTML/navigation requests: Network-first, serve app shell offline
  event.respondWith(
    fetch(request).catch(() => caches.match('/index.html'))
  );
});

// ─── Network-first with cache fallback ──────────────────────
async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      // Add header to indicate offline data
      const headers = new Headers(cached.headers);
      headers.set('X-Served-From', 'offline-cache');
      return new Response(cached.body, { status: cached.status, headers });
    }
    return new Response(JSON.stringify({
      error: { code: 'OFFLINE', message: 'You are offline. Data will load when connected.' },
      _offline: true,
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 503,
    });
  }
}

// ─── Cache-first with stale-while-revalidate ────────────────
async function cacheFirstWithRevalidate(request, cacheName) {
  const cached = await caches.match(request);

  // Update cache in background
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      caches.open(cacheName).then(cache => cache.put(request, response.clone()));
    }
    return response;
  }).catch(() => null);

  if (cached) return cached;

  // No cache: wait for network
  const response = await fetchPromise;
  if (response) return response;

  return new Response('Offline', { status: 503 });
}

// ─── Handle mutations (POST/PUT/PATCH/DELETE) ───────────────
async function handleMutation(request) {
  try {
    const response = await fetch(request.clone());
    return response;
  } catch {
    // Offline: queue for background sync
    try {
      const body = await request.clone().text();
      await queueForSync({
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        body: body,
        queued_at: Date.now(),
      });

      // Return optimistic response
      return new Response(JSON.stringify({
        _queued: true,
        message: 'Saved offline. Will sync when connected.',
      }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      return new Response(JSON.stringify({
        error: { code: 'OFFLINE', message: 'Action failed. Please try when connected.' },
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
}

// ─── Background Sync ────────────────────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'agrihub-sync') {
    event.waitUntil(processSyncQueue());
  }
});

async function processSyncQueue() {
  try {
    const db = await openSyncDB();
    const tx = db.transaction('sync_queue', 'readonly');
    const store = tx.objectStore('sync_queue');
    const allItems = await getAllFromStore(store);

    for (const item of allItems) {
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body || undefined,
        });

        if (response.ok || response.status < 500) {
          // Remove from queue on success or client error (don't retry 400s)
          const deleteTx = db.transaction('sync_queue', 'readwrite');
          deleteTx.objectStore('sync_queue').delete(item.id);

          // Notify all clients
          const clients = await self.clients.matchAll();
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_COMPLETE',
              id: item.id,
              url: item.url,
              success: response.ok,
              status: response.status,
            });
          });
        }
        // 5xx errors: leave in queue for next sync attempt
      } catch {
        // Network still unavailable
        break;
      }
    }
  } catch (err) {
    console.error('[SW] Sync processing error:', err);
  }
}

// ─── IndexedDB for sync queue ───────────────────────────────
function openSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('agrihub-sw', 2);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('sync_queue')) {
        db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function queueForSync(requestData) {
  try {
    const db = await openSyncDB();
    const tx = db.transaction('sync_queue', 'readwrite');
    tx.objectStore('sync_queue').add(requestData);

    // Register for background sync
    if (self.registration.sync) {
      await self.registration.sync.register('agrihub-sync');
    }
  } catch (err) {
    console.error('[SW] Queue sync error:', err);
  }
}

// ─── Push Notifications ─────────────────────────────────────
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data?.json(); } catch { data = { body: event.data?.text() || '' }; }

  const title = data.title || 'AgriHub';
  const options = {
    body: data.message || data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-96.png',
    image: data.image || undefined,
    vibrate: [200, 100, 200],
    data: { url: data.url || '/', ...(data.data || {}) },
    tag: data.type || 'notification',
    renotify: true,
    requireInteraction: data.priority === 'high',
    actions: data.actions || [
      { action: 'open', title: '🔓 Open' },
      { action: 'dismiss', title: '✕ Dismiss' },
    ],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(windowClients => {
      // Focus existing window if available
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// ─── Message handling from main thread ──────────────────────
self.addEventListener('message', event => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'QUEUE_SYNC':
      queueForSync(payload);
      break;
    case 'CLEAR_CACHE':
      caches.delete(STATIC_CACHE);
      caches.delete(API_CACHE);
      break;
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'GET_SYNC_STATUS':
      openSyncDB().then(db => {
        const tx = db.transaction('sync_queue', 'readonly');
        return getAllFromStore(tx.objectStore('sync_queue'));
      }).then(items => {
        event.source.postMessage({ type: 'SYNC_STATUS', pending: items.length });
      }).catch(() => {
        event.source.postMessage({ type: 'SYNC_STATUS', pending: 0 });
      });
      break;
  }
});
