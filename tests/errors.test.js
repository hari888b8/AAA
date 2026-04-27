import { describe, it, expect } from 'vitest';
import { withRetry } from '../src/utils/errors.js';

describe('withRetry', () => {
  it('succeeds on first try', async () => {
    let calls = 0;
    const out = await withRetry(async () => { calls++; return 'ok'; }, { tries: 3 });
    expect(out).toBe('ok');
    expect(calls).toBe(1);
  });

  it('retries on failure and eventually succeeds', async () => {
    let calls = 0;
    const out = await withRetry(async () => {
      calls++;
      if (calls < 3) throw new Error('boom');
      return 'done';
    }, { tries: 5, delay: 10 });
    expect(out).toBe('done');
    expect(calls).toBe(3);
  });

  it('throws after max tries', async () => {
    let calls = 0;
    await expect(withRetry(async () => { calls++; throw new Error('always'); }, { tries: 2, delay: 5 }))
      .rejects.toThrow('always');
    expect(calls).toBe(2);
  });
});
