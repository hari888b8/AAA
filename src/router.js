// Hash-based SPA Router
const routes = {};
let currentPage = null;

export function registerRoute(path, handler) {
  routes[path] = handler;
}

export function navigate(path) {
  window.location.hash = path;
}

export function getCurrentPath() {
  return window.location.hash.slice(1) || '/';
}

export function initRouter(appEl) {
  function handleRoute() {
    const path = getCurrentPath();
    const handler = routes[path] || routes['/'];
    if (handler) {
      const content = handler();
      if (typeof content === 'string') {
        appEl.innerHTML = content;
      } else if (content instanceof HTMLElement) {
        appEl.innerHTML = '';
        appEl.appendChild(content);
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
      // Trigger page enter animation
      const page = appEl.querySelector('.page-enter');
      if (page) {
        page.style.animationPlayState = 'running';
      }
    }
  }

  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}
