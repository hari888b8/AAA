// Shared rendering helpers for sub-app pages

export function renderSubHeader(app) {
  return `
    <header class="header">
      <div class="header__inner">
        <button class="header__back-btn" onclick="navigate('/')">← Back to Hub</button>
        <div class="header__logo" onclick="navigate('/')">
          <span class="header__logo-icon">🌾</span>
          <span>AgriHub</span>
        </div>
        <div class="header__active-pill" onclick="navigate('/${app.id}')">
          <span class="pill-icon">${app.icon}</span>
          <span class="pill-label">${app.name}</span>
        </div>
      </div>
    </header>
  `;
}

export function renderHero(app) {
  return `
    <div class="app-page__hero" style="background: var(--gradient-${app.gradient})">
      <div class="app-page__hero-icon">${app.icon}</div>
      <h1 class="app-page__hero-title">${app.name}</h1>
      <p class="app-page__hero-desc">${app.description}</p>
      <div class="app-page__hero-stats">
        ${app.stats.map(s => `
          <div class="app-page__hero-stat">
            <div class="app-page__hero-stat-value">${s.value}</div>
            <div class="app-page__hero-stat-label">${s.label}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export function renderBreadcrumb(app) {
  return `
    <div class="breadcrumb">
      <span class="breadcrumb__link" onclick="navigate('/')">Home</span>
      <span class="breadcrumb__sep">›</span>
      <span class="breadcrumb__current">${app.name}</span>
    </div>
  `;
}

export function renderPlatformCards(platforms) {
  return `
    <div class="platforms-grid stagger-children">
      ${platforms.map(p => `
        <div class="platform-card" style="background: var(--gradient-${p.gradient})">
          <div style="font-size:2rem;margin-bottom:8px;">${p.icon}</div>
          <div class="platform-card__title">${p.name}</div>
          <div class="platform-card__desc">${p.desc}</div>
          <div class="platform-card__count">${p.features} features</div>
        </div>
      `).join('')}
    </div>
  `;
}

export function renderFeatureGrid(features) {
  return `
    <div class="grid-3 stagger-children">
      ${features.map(f => `
        <div class="feature-card">
          <div class="feature-card__icon">${f.icon}</div>
          <div class="feature-card__title">${f.title}</div>
          <div class="feature-card__desc">${f.desc}</div>
          ${f.tag ? `<span class="feature-card__tag">${f.tag}</span>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

export function renderPersonas(personas) {
  return `
    <div class="grid-2 stagger-children">
      ${personas.map(p => `
        <div class="persona-card">
          <div class="persona-card__name">${p.name}</div>
          <div class="persona-card__role">${p.role}</div>
          <div class="persona-card__detail"><strong>Age:</strong> ${p.age}</div>
          <div class="persona-card__detail"><strong>Device:</strong> ${p.device}</div>
          <div class="persona-card__detail"><strong>Language:</strong> ${p.lang}</div>
          <div class="persona-card__detail"><strong>Pain:</strong> ${p.pain}</div>
          <div class="persona-card__detail"><strong>Goal:</strong> ${p.goal}</div>
        </div>
      `).join('')}
    </div>
  `;
}

export function renderDataTable(headers, rows) {
  return `
    <div class="data-table-wrapper">
      <table class="data-table">
        <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    </div>
  `;
}

export function renderTimeline(items, labelKey, titleKey, descKey) {
  return `
    <div class="timeline">
      ${items.map(item => `
        <div class="timeline__item">
          <div class="timeline__phase">${item[labelKey]}</div>
          <div class="timeline__title">${item[titleKey]}</div>
          <div class="timeline__desc">${item[descKey]}</div>
        </div>
      `).join('')}
    </div>
  `;
}

export function renderSection(title, subtitle, content) {
  return `
    <div class="section">
      <div class="section__header">
        <h2 class="section__title">${title}</h2>
        ${subtitle ? `<p class="section__subtitle">${subtitle}</p>` : ''}
      </div>
      ${content}
    </div>
    <div class="section-divider"></div>
  `;
}

export function renderSourceDocs(docs) {
  return `
    <div class="section">
      <div class="section__header">
        <h2 class="section__title">📄 Source Documents</h2>
      </div>
      <div class="tag-list">
        ${docs.map(d => `<span class="tag">${d}</span>`).join('')}
      </div>
    </div>
  `;
}
