// ═══════════════════════════════════════════════════════════════
// Global error boundary + retry-aware async wrapper
// ═══════════════════════════════════════════════════════════════

let _errorContainer = null;

/** Install global handlers — call once from main.js */
export function installErrorBoundary() {
  window.addEventListener('error', (e) => {
    console.error('[GlobalError]', e.error || e.message);
    showErrorBanner(e.message);
  });
  window.addEventListener('unhandledrejection', (e) => {
    console.error('[UnhandledRejection]', e.reason);
    const msg = e.reason?.message || String(e.reason);
    if (!/network|fetch|abort/i.test(msg)) showErrorBanner(msg);
  });
}

function showErrorBanner(message) {
  if (!_errorContainer) {
    _errorContainer = document.createElement('div');
    _errorContainer.className = 'error-banner';
    _errorContainer.setAttribute('role', 'alert');
    _errorContainer.style.cssText = 'position:fixed;top:0;left:0;right:0;padding:10px 14px;background:#C62828;color:white;font-size:13px;font-weight:600;z-index:9999;display:none;box-shadow:0 2px 8px rgba(0,0,0,0.2)';
    document.body.appendChild(_errorContainer);
  }
  _errorContainer.innerHTML = `⚠️ ${(message || 'Something went wrong').slice(0, 120)} <button style="float:right;background:transparent;border:none;color:white;cursor:pointer;font-weight:700">✕</button>`;
  _errorContainer.style.display = 'block';
  _errorContainer.querySelector('button').onclick = () => (_errorContainer.style.display = 'none');
  setTimeout(() => { if (_errorContainer) _errorContainer.style.display = 'none'; }, 6000);
}

/** Retry an async fn with exponential backoff. */
export async function withRetry(fn, { tries = 3, delay = 400, factor = 2 } = {}) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i < tries - 1) await new Promise(r => setTimeout(r, delay * Math.pow(factor, i)));
    }
  }
  throw lastErr;
}

/** Wrap a render fn so errors render an inline error card instead of crashing the screen. */
export function safeRender(fn, container, fallbackMessage = 'Could not load this section.') {
  try {
    return fn(container);
  } catch (e) {
    console.error('[safeRender]', e);
    container.innerHTML = `
      <div class="empty-v2" role="alert">
        <div class="ev-icon">⚠️</div>
        <div class="ev-title">${fallbackMessage}</div>
        <div class="ev-text">${(e.message || '').slice(0, 200)}</div>
        <button class="btn btn-primary" onclick="location.reload()">Reload</button>
      </div>
    `;
  }
}
