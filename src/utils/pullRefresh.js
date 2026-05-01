// ═══════════════════════════════════════════════════════════════
// Pull-to-Refresh — Adds native-feel pull-to-refresh on screens
// ═══════════════════════════════════════════════════════════════

/**
 * Attach pull-to-refresh behavior to a scrollable container.
 * @param {HTMLElement} container - The scrollable element
 * @param {Function} onRefresh - Async callback to execute on refresh
 */
export function attachPullToRefresh(container, onRefresh) {
  if (!container || !onRefresh) return;

  let startY = 0;
  let pulling = false;
  let indicator = null;

  function createIndicator() {
    indicator = document.createElement('div');
    indicator.className = 'pull-indicator';
    indicator.innerHTML = '<span class="pull-spinner">↻</span>';
    container.style.position = 'relative';
    container.insertBefore(indicator, container.firstChild);
  }

  function onTouchStart(e) {
    if (container.scrollTop > 0) return;
    startY = e.touches[0].clientY;
    pulling = true;
  }

  function onTouchMove(e) {
    if (!pulling) return;
    const diff = e.touches[0].clientY - startY;
    if (diff < 0 || container.scrollTop > 0) {
      pulling = false;
      return;
    }
    if (diff > 10) {
      if (!indicator) createIndicator();
      const progress = Math.min(diff / 80, 1);
      indicator.classList.toggle('visible', progress > 0.3);
      indicator.querySelector('.pull-spinner').style.transform = `rotate(${progress * 360}deg)`;
    }
  }

  async function onTouchEnd() {
    if (!pulling || !indicator) {
      pulling = false;
      return;
    }
    pulling = false;
    if (indicator.classList.contains('visible')) {
      indicator.classList.add('refreshing');
      try {
        await onRefresh();
      } catch (e) { /* silent */ }
      // Brief delay so user sees the spinner
      await new Promise(r => setTimeout(r, 400));
    }
    indicator.classList.remove('visible', 'refreshing');
    indicator.remove();
    indicator = null;
  }

  container.addEventListener('touchstart', onTouchStart, { passive: true });
  container.addEventListener('touchmove', onTouchMove, { passive: true });
  container.addEventListener('touchend', onTouchEnd, { passive: true });

  // Return cleanup function
  return () => {
    container.removeEventListener('touchstart', onTouchStart);
    container.removeEventListener('touchmove', onTouchMove);
    container.removeEventListener('touchend', onTouchEnd);
  };
}
