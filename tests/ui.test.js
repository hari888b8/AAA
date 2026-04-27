import { describe, it, expect } from 'vitest';
import { heroBanner, stickySearch, chipRow, ticker, emptyState, platformTile } from '../src/components/ui.js';

describe('UI helpers', () => {
  it('heroBanner renders gradient + title + ARIA banner role', () => {
    const html = heroBanner({ gradient: 'linear-gradient(135deg,#000,#fff)', title: 'Hello', subtitle: 'sub' });
    expect(html).toContain('hero-v2');
    expect(html).toContain('linear-gradient(135deg,#000,#fff)');
    expect(html).toContain('Hello');
    expect(html).toContain('role="banner"');
    expect(html).toContain('<h1');
  });

  it('heroBanner renders stats and accessible action buttons', () => {
    const html = heroBanner({
      gradient: '#1B5E20',
      title: 'Hub',
      actions: [{ icon: '🔔', onClick: 'notifications', badge: true, label: 'Notifications' }],
      stats: [{ value: '1,200', label: 'Farmers' }],
    });
    expect(html).toContain('aria-label="Notifications"');
    expect(html).toContain('1,200');
    expect(html).toContain('badge-dot');
  });

  it('stickySearch produces accessible search input', () => {
    const html = stickySearch({ placeholder: 'Find', id: 'q1' });
    expect(html).toContain('role="search"');
    expect(html).toContain('id="q1"');
    expect(html).toContain('aria-label="Find"');
    expect(html).toContain('type="search"');
  });

  it('chipRow marks active with aria-selected', () => {
    const html = chipRow({
      items: [{ key: 'a', label: 'All' }, { key: 'b', label: 'New' }],
      active: 'b',
      dataAttr: 'tab',
    });
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('data-tab="a"');
    expect(html).toContain('data-tab="b"');
    expect(html).toContain('role="tablist"');
  });

  it('ticker renders pulse + duplicated track', () => {
    const html = ticker([{ label: 'Wheat', value: '₹2,300' }]);
    expect(html).toContain('tk-track');
    expect(html).toContain('Wheat');
    // Ensure duplication
    expect((html.match(/Wheat/g) || []).length).toBeGreaterThanOrEqual(2);
  });

  it('emptyState renders icon + title + optional action', () => {
    const html = emptyState({ icon: '📭', title: 'Empty', action: { label: 'Add', id: 'addBtn' } });
    expect(html).toContain('Empty');
    expect(html).toContain('id="addBtn"');
  });

  it('platformTile uses CSS variable for color', () => {
    const html = platformTile({ icon: '🌾', title: 'AgriFlow', sub: 'FPO ops', route: 'agri', color: '#2E7D32' });
    expect(html).toContain('--tile-color:#2E7D32');
    expect(html).toContain('data-nav="agri"');
  });
});
