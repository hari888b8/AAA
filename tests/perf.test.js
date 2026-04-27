import { describe, it, expect } from 'vitest';
import { debounce, throttle, inr, timeAgo, lazyImg } from '../src/utils/perf.js';

describe('perf utilities', () => {
  it('debounce delays execution', () => {
    return new Promise((resolve) => {
      let count = 0;
      const fn = debounce(() => { count++; }, 30);
      fn(); fn(); fn();
      setTimeout(() => {
        expect(count).toBe(1);
        resolve();
      }, 80);
    });
  });

  it('throttle limits calls', () => {
    return new Promise((resolve) => {
      let count = 0;
      const fn = throttle(() => { count++; }, 50);
      for (let i = 0; i < 10; i++) fn();
      setTimeout(() => {
        expect(count).toBeGreaterThanOrEqual(1);
        expect(count).toBeLessThanOrEqual(3);
        resolve();
      }, 120);
    });
  });

  it('inr formats Indian Rupees', () => {
    expect(inr(1234567)).toMatch(/₹/);
    expect(inr(0)).toMatch(/0/);
  });

  it('timeAgo returns "just now" for recent dates', () => {
    expect(timeAgo(new Date())).toBe('just now');
    expect(timeAgo(new Date(Date.now() - 5 * 60000))).toMatch(/m ago/);
    expect(timeAgo(new Date(Date.now() - 2 * 3600000))).toMatch(/h ago/);
  });

  it('lazyImg returns markup with data-src', () => {
    const html = lazyImg({ src: '/x.jpg', alt: 'test', width: 100, height: 100 });
    expect(html).toContain('data-src="/x.jpg"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('class="lazy-img');
    expect(html).toContain('alt="test"');
  });

  it('lazyImg returns empty for missing src', () => {
    expect(lazyImg({ src: '' })).toBe('');
  });
});
