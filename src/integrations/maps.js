// ═══════════════════════════════════════════════════════════════
// Leaflet maps wrapper — lazy-loads Leaflet from CDN
// Used by BhoomiOS, KisanConnect, FarmerConnect for location pickers
// ═══════════════════════════════════════════════════════════════

let _leafletPromise = null;

export function loadLeaflet() {
  if (typeof window.L !== 'undefined') return Promise.resolve(window.L);
  if (_leafletPromise) return _leafletPromise;
  _leafletPromise = new Promise((resolve, reject) => {
    // CSS
    if (!document.querySelector('link[data-leaflet]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.dataset.leaflet = '1';
      document.head.appendChild(link);
    }
    // JS
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.async = true;
    s.onload = () => resolve(window.L);
    s.onerror = () => { _leafletPromise = null; reject(new Error('LEAFLET_LOAD_FAILED')); };
    document.head.appendChild(s);
  });
  return _leafletPromise;
}

/**
 * Render a basic map with a single marker.
 * @param {string|HTMLElement} target - container id or element
 * @param {Object} opts
 * @param {[number,number]} opts.center - [lat, lng]
 * @param {number} [opts.zoom=10]
 * @param {Array<{lat,lng,title?,popup?}>} [opts.markers]
 * @param {boolean} [opts.picker] - if true, click sets pin and calls onPick
 * @param {Function} [opts.onPick] - (lat, lng)
 * @returns {Promise<{map, addMarker, setCenter}>}
 */
export async function renderMap(target, { center = [20.5937, 78.9629], zoom = 5, markers = [], picker = false, onPick } = {}) {
  const L = await loadLeaflet();
  const el = typeof target === 'string' ? document.getElementById(target) : target;
  if (!el) throw new Error('MAP_TARGET_NOT_FOUND');
  el.style.minHeight = el.style.minHeight || '300px';
  const map = L.map(el).setView(center, zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap',
  }).addTo(map);

  let pickerMarker = null;
  function setMarker(lat, lng) {
    if (pickerMarker) map.removeLayer(pickerMarker);
    pickerMarker = L.marker([lat, lng]).addTo(map);
  }

  markers.forEach(m => {
    const mk = L.marker([m.lat, m.lng]).addTo(map);
    if (m.popup || m.title) mk.bindPopup(m.popup || m.title);
  });

  if (picker) {
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      setMarker(lat, lng);
      onPick?.(lat, lng);
    });
  }

  return {
    map,
    addMarker: (lat, lng, popup) => {
      const mk = L.marker([lat, lng]).addTo(map);
      if (popup) mk.bindPopup(popup);
      return mk;
    },
    setCenter: (lat, lng, z) => map.setView([lat, lng], z ?? zoom),
    destroy: () => map.remove(),
  };
}

/** Get user's geolocation (Promise wrapper). */
export function getMyLocation(opts = { timeout: 10000, enableHighAccuracy: true }) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('GEO_UNSUPPORTED'));
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      e => reject(e),
      opts
    );
  });
}
