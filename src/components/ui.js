// ═══════════════════════════════════════════════════════════════
// Reusable Modern UI Components — Modern UI v2
// ═══════════════════════════════════════════════════════════════

/**
 * Heroic banner with greeting, title, optional avatar/actions and stats.
 * @param {Object} opts
 * @param {string} opts.gradient - CSS gradient string (background)
 * @param {string} opts.icon - Emoji icon
 * @param {string} opts.greeting - Small text above title
 * @param {string} opts.title - Bold title
 * @param {string} opts.subtitle - Sub-line under title
 * @param {Array<{icon?:string,onClick?:string,badge?:boolean,id?:string}>} opts.actions - Right-side icon buttons
 * @param {Array<{value:string,label:string}>} opts.stats - Stat tiles
 * @returns {string} HTML string
 */
export function heroBanner({ gradient, icon, greeting, title, subtitle, actions = [], stats = [] }) {
  return `
    <header class="hero-v2" style="background:${gradient}" role="banner">
      <div class="hero-row">
        ${icon ? `<div class="hero-avatar" aria-hidden="true">${icon}</div>` : ''}
        <div style="flex:1;min-width:0">
          ${greeting ? `<div class="hero-greeting">${greeting}</div>` : ''}
          <h1 class="hero-title">${title}</h1>
          ${subtitle ? `<div class="hero-sub">${subtitle}</div>` : ''}
        </div>
        ${actions.length ? `<div class="hero-actions">${actions.map(a => `
          <button class="hero-icon-btn" type="button" ${a.id ? `id="${a.id}"` : ''} ${a.onClick ? `data-nav="${a.onClick}"` : ''} aria-label="${a.label || a.onClick || 'action'}">
            <span aria-hidden="true">${a.icon || '⚙️'}</span>
            ${a.badge ? '<span class="badge-dot" aria-label="new notifications"></span>' : ''}
          </button>
        `).join('')}</div>` : ''}
      </div>
      ${stats.length ? `<div class="hero-stats" role="list">${stats.map(s => `
        <div class="hero-stat-card" role="listitem"><div class="v">${s.value}</div><div class="l">${s.label}</div></div>
      `).join('')}</div>` : ''}
    </header>
  `;
}

/**
 * Sticky search bar with optional filter button.
 * @param {Object} opts
 * @param {string} opts.placeholder
 * @param {string} opts.id - input id (required for binding)
 * @param {string} [opts.value]
 * @param {boolean} [opts.filter] - Show filter button
 * @param {string} [opts.filterId]
 */
export function stickySearch({ placeholder = 'Search…', id = 'searchV2', value = '', filter = false, filterId = 'filterBtnV2' } = {}) {
  return `
    <div class="sticky-search" role="search">
      <input class="search-input-v2" id="${id}" type="search" placeholder="${placeholder}" value="${value}" aria-label="${placeholder}" autocomplete="off" enterkeyhint="search">
      ${filter ? `<button class="filter-fab" type="button" id="${filterId}" aria-label="Open filters"><span aria-hidden="true">⚙</span></button>` : ''}
    </div>
  `;
}

/**
 * Horizontal scrollable chip row.
 * @param {Object} opts
 * @param {Array<{key:string,label:string,icon?:string}>} opts.items
 * @param {string} opts.active - Active key
 * @param {string} opts.dataAttr - data-* attribute name (without `data-`)
 * @param {boolean} [opts.sticky] - Wraps in sticky-chips container
 */
export function chipRow({ items, active, dataAttr = 'chip', sticky = false, label = 'Filters' }) {
  const chips = items.map(it => `
    <button class="chip-v2 ${active === it.key ? 'active' : ''}" type="button" role="tab" aria-selected="${active === it.key}" data-${dataAttr}="${it.key}">
      ${it.icon ? `<span aria-hidden="true">${it.icon}</span> ` : ''}${it.label}
    </button>
  `).join('');
  const inner = `<div role="tablist" aria-label="${label}">${chips}</div>`;
  return sticky ? `<div class="sticky-chips">${inner}</div>` : `<div class="scroll-x" style="display:flex;gap:6px;padding:8px 14px">${inner}</div>`;
}

/**
 * Modern section title with optional action link.
 */
export function sectionTitle(text, sub, action) {
  return `
    <div class="section-v2">
      <div>
        <div class="st-text">${text}</div>
        ${sub ? `<div class="st-sub">${sub}</div>` : ''}
      </div>
      ${action ? `<button class="st-link" ${action.id ? `id="${action.id}"` : ''} ${action.nav ? `data-nav="${action.nav}"` : ''}>${action.label} →</button>` : ''}
    </div>
  `;
}

/**
 * Live ticker (mandi prices etc.)
 * @param {Array<{label:string,value:string,color?:string}>} items
 */
export function ticker(items, label = 'LIVE') {
  const track = items.map(i => `
    <span class="tk-item">
      <strong>${i.label}</strong>
      <span style="color:${i.color || 'var(--success)'}"> ${i.value}</span>
    </span>
  `).join('');
  // Duplicate for seamless loop
  return `
    <div class="ticker">
      <div class="tk-pulse"></div>
      <div style="font-size:10px;font-weight:800;color:var(--danger);letter-spacing:0.5px;flex-shrink:0">${label}</div>
      <div style="overflow:hidden;flex:1">
        <div class="tk-track">${track}${track}</div>
      </div>
    </div>
  `;
}

/**
 * Modern empty state.
 */
export function emptyState({ icon = '📭', title = 'Nothing here yet', text = '', action }) {
  return `
    <div class="empty-v2">
      <div class="ev-icon">${icon}</div>
      <div class="ev-title">${title}</div>
      ${text ? `<div class="ev-text">${text}</div>` : ''}
      ${action ? `<button class="btn btn-primary" ${action.id ? `id="${action.id}"` : ''}>${action.label}</button>` : ''}
    </div>
  `;
}

/**
 * Skeleton loader rows.
 */
export function skeletonCards(count = 3) {
  let out = '';
  for (let i = 0; i < count; i++) {
    out += `
      <div class="skel-card">
        <div class="skel-line" style="width:60%;height:14px"></div>
        <div class="skel-line" style="width:90%"></div>
        <div class="skel-line" style="width:40%"></div>
      </div>
    `;
  }
  return `<div style="padding:14px">${out}</div>`;
}

/**
 * Renders a modern shortcut button (use in CSS grid `.shortcut-grid`).
 */
export function shortcut({ icon, label, route, from = '#4CAF50', to = '#2E7D32' }) {
  return `
    <button class="shortcut-v2" data-nav="${route}" style="--sc-from:${from};--sc-to:${to}">
      <span class="sc-icon">${icon}</span>
      <span class="sc-label">${label}</span>
    </button>
  `;
}

/**
 * Renders a modern platform tile (with colored top border).
 */
export function platformTile({ icon, title, sub, meta, route, color }) {
  return `
    <div class="tile-v2" data-nav="${route}" style="--tile-color:${color}">
      <div class="tile-icon">${icon}</div>
      <div class="tile-title">${title}</div>
      <div class="tile-sub">${sub}</div>
      ${meta ? `<div class="tile-meta">${meta}</div>` : ''}
    </div>
  `;
}

/**
 * Modern action card (icon + text + CTA button).
 */
export function actionCard({ icon, title, sub, cta, action, bg, color }) {
  return `
    <div class="action-card">
      <div class="ac-icon" style="${bg ? `--ac-bg:${bg};` : ''}${color ? `--ac-color:${color}` : ''}">${icon}</div>
      <div class="ac-text">
        <div class="ac-title">${title}</div>
        ${sub ? `<div class="ac-sub">${sub}</div>` : ''}
      </div>
      ${cta ? `<button class="ac-cta" data-nav="${action || ''}">${cta}</button>` : ''}
    </div>
  `;
}

/**
 * Attaches sticky-search shadow on scroll.
 */
export function attachStickyShadow(container) {
  const search = container.querySelector('.sticky-search');
  if (!search) return;
  const scroller = container.closest('.screen-content') || container;
  const onScroll = () => {
    if (scroller.scrollTop > 4) search.classList.add('scrolled');
    else search.classList.remove('scrolled');
  };
  scroller.addEventListener('scroll', onScroll, { passive: true });
}
