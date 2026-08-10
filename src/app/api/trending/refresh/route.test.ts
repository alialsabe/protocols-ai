import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  calls: 0,
  generatedAt: '2026-08-10T00:00:00.000Z',
}));

vi.mock('@/lib/trending/aggregate', () => ({
  refreshTrending: vi.fn(async () => {
    state.calls += 1;
    return { trending: [], mostPopular: [], generatedAt: state.generatedAt };
  }),
}));

const SECRET = 'test-cron-secret';

describe('GET /api/trending/refresh (Vercel cron)', () => {
  beforeEach(() => {
    process.env.CRON_SECRET = SECRET;
    state.calls = 0;
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
    vi.resetModules();
  });

  it('returns 401 without the cron secret', async () => {
    const { GET } = await import('./route');
    const res = await GET(new Request('http://test.local/api/trending/refresh'));
    expect(res.status).toBe(401);
    expect(state.calls).toBe(0);
  });

  it('runs the refresh on GET with the Bearer secret (Vercel cron invocation)', async () => {
    const { GET } = await import('./route');
    const res = await GET(
      new Request('http://test.local/api/trending/refresh', {
        headers: { authorization: `Bearer ${SECRET}` },
      }),
    );
    expect(res.status).toBe(200);
    expect(state.calls).toBe(1);
    const json = await res.json();
    expect(json).toEqual({ ok: true, generatedAt: state.generatedAt });
  });
});
