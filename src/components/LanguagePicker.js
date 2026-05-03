// ═══════════════════════════════════════════════════════════════
// Language Picker Component
// Allows users to switch between English, Telugu, and Hindi
// Persists choice and triggers re-render
// ═══════════════════════════════════════════════════════════════

import { LANGUAGES, getLang, setLang } from '../i18n.js';
import { showToast } from '../app-shell.js';

/**
 * Render inline language picker (horizontal pill buttons)
 * @param {Function} [onChangeCallback] - Called after language change
 * @returns {string} HTML string
 */
export function languagePicker(onChangeCallback) {
  const current = getLang();

  // Register global handler
  window._switchLang = (code) => {
    if (code === current) return;
    setLang(code);
    showToast(`Language changed to ${LANGUAGES.find(l => l.code === code)?.native || code}`, 'success');
    if (onChangeCallback) {
      onChangeCallback(code);
    } else {
      // Default: reload current screen
      window.location.reload();
    }
  };

  return `
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
      ${LANGUAGES.map(lang => `
        <button onclick="window._switchLang('${lang.code}')"
          style="padding:8px 16px;border-radius:20px;border:${current === lang.code ? '2px solid #1565C0' : '1px solid #e0e0e0'};
          background:${current === lang.code ? '#E3F2FD' : '#fff'};
          color:${current === lang.code ? '#1565C0' : '#333'};
          font-size:13px;font-weight:${current === lang.code ? '600' : '400'};
          cursor:pointer;display:flex;align-items:center;gap:6px;transition:all 0.2s;">
          <span>${lang.flag}</span>
          <span>${lang.native}</span>
          ${current === lang.code ? '<span style="font-size:10px;">✓</span>' : ''}
        </button>
      `).join('')}
    </div>
  `;
}

/**
 * Render floating language button (FAB style) for quick access
 * @returns {string} HTML string
 */
export function languageFAB() {
  const current = getLang();
  const currentLang = LANGUAGES.find(l => l.code === current);

  window._toggleLangMenu = () => {
    const menu = document.getElementById('lang-fab-menu');
    if (menu) {
      menu.style.display = menu.style.display === 'none' ? 'flex' : 'none';
    }
  };

  return `
    <div style="position:fixed;bottom:80px;right:16px;z-index:1000;">
      <button onclick="window._toggleLangMenu()" 
        style="width:44px;height:44px;border-radius:50%;background:#1565C0;border:none;
        color:#fff;font-size:18px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.2);
        display:flex;align-items:center;justify-content:center;"
        aria-label="Change language">
        ${currentLang?.flag || '🌐'}
      </button>
      <div id="lang-fab-menu" style="display:none;position:absolute;bottom:52px;right:0;
        flex-direction:column;gap:6px;background:#fff;border-radius:12px;padding:8px;
        box-shadow:0 4px 16px rgba(0,0,0,0.15);min-width:140px;">
        ${LANGUAGES.map(lang => `
          <button onclick="window._switchLang('${lang.code}');window._toggleLangMenu()"
            style="padding:8px 12px;border:none;background:${current === lang.code ? '#E3F2FD' : 'transparent'};
            border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:8px;
            font-size:13px;color:#333;text-align:left;">
            <span>${lang.flag}</span>
            <span>${lang.native}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}
