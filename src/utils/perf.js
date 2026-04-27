// ═══════════════════════════════════════════════════════════════
// Performance utilities — debounce, throttle, lazy image, virtualize
// ═══════════════════════════════════════════════════════════════

/** Debounce a function — runs after `wait` ms of inactivity. */
export function debounce(fn, wait = 250) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

/** Throttle — at most one call per `wait` ms. */
export function throttle(fn, wait = 100) {
  let last = 0, t;
  return function (...args) {
    const now = Date.now();
    const remaining = wait - (now - last);
    if (remaining <= 0) {
      clearTimeout(t);
      last = now;
      fn.apply(this, args);
    } else if (!t) {
      t = setTimeout(() => { last = Date.now(); t = null; fn.apply(this, args); }, remaining);
    }
  };
}

/** Generate <img> tag with lazy-loading + blur-up placeholder. */
export function lazyImg({ src, alt = '', width, height, className = '', placeholder } = {}) {
  if (!src) return '';
  const ph = placeholder || 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 4 3%22><rect width=%224%22 height=%223%22 fill=%22%23eee%22/></svg>';
  return `<img src="${ph}" data-src="${src}" alt="${alt.replace(/"/g, '&quot;')}" loading="lazy" decoding="async" class="lazy-img ${className}"${width ? ` width="${width}"` : ''}${height ? ` height="${height}"` : ''}>`;
}

let _io;
function getObserver() {
  if (_io) return _io;
  if (typeof IntersectionObserver === 'undefined') return null;
  _io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const img = e.target;
        const src = img.dataset.src;
        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
          img.classList.add('lazy-loaded');
        }
        _io.unobserve(img);
      }
    });
  }, { rootMargin: '200px' });
  return _io;
}

/** Activate lazy loading on all .lazy-img inside container. */
export function activateLazyImages(root = document) {
  const io = getObserver();
  const imgs = root.querySelectorAll('img.lazy-img[data-src]');
  if (!io) {
    imgs.forEach(img => { img.src = img.dataset.src; img.removeAttribute('data-src'); });
    return;
  }
  imgs.forEach(img => io.observe(img));
}

/** Simple list virtualization for very long lists (1000+ items). */
export function virtualize({ container, items, rowHeight = 64, render, buffer = 5 }) {
  if (!container) return;
  const total = items.length;
  const viewport = document.createElement('div');
  viewport.style.cssText = `position:relative;height:${total * rowHeight}px`;
  const inner = document.createElement('div');
  inner.style.cssText = 'position:absolute;left:0;right:0;top:0';
  viewport.appendChild(inner);
  container.innerHTML = '';
  container.style.cssText = 'overflow:auto;height:100%';
  container.appendChild(viewport);

  function update() {
    const scroll = container.scrollTop;
    const h = container.clientHeight;
    const start = Math.max(0, Math.floor(scroll / rowHeight) - buffer);
    const end = Math.min(total, Math.ceil((scroll + h) / rowHeight) + buffer);
    inner.style.transform = `translateY(${start * rowHeight}px)`;
    inner.innerHTML = items.slice(start, end).map((it, i) => render(it, start + i)).join('');
  }
  container.addEventListener('scroll', throttle(update, 16));
  update();
}

/** Format INR currency. */
export function inr(value, opts = {}) {
  const n = Number(value) || 0;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: opts.decimals ?? 0 }).format(n);
}

/** Relative time (e.g. "2h ago"). */
export function timeAgo(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return 'just now';
  if (sec < 3600) return Math.floor(sec / 60) + 'm ago';
  if (sec < 86400) return Math.floor(sec / 3600) + 'h ago';
  if (sec < 2592000) return Math.floor(sec / 86400) + 'd ago';
  return d.toLocaleDateString();
}
