// ═══════════════════════════════════════════════════════════════
// App Shell — navigation, toast, modal helpers
// Extracted from main.js so screens import shell (leaf module)
// instead of main.js (entry that imports all screens).
// This breaks the circular import graph and enables clean code-splitting.
// ═══════════════════════════════════════════════════════════════

let _navigate = () => { console.warn('[shell] navigate not registered'); };

/** Internal — registered by main.js at boot. */
export function _registerNavigator(fn) { _navigate = fn; }

export function navigate(route) { return _navigate(route); }

export function showToast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.setAttribute('role', 'status');
  t.setAttribute('aria-live', 'polite');
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

export function showModal(html) {
  closeModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modalOverlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `<div class="modal-sheet">${html}</div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.body.appendChild(overlay);
  // Trap focus to first focusable
  setTimeout(() => {
    const f = overlay.querySelector('input, button, select, textarea, [tabindex]');
    f?.focus?.();
  }, 0);
}

export function closeModal() {
  document.querySelector('#modalOverlay')?.remove();
}

// Escape closes modal
if (typeof document !== 'undefined') {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}
