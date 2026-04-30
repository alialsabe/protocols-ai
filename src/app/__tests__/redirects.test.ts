import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock next/navigation's redirect to a spy that throws (Next throws internally
// to short-circuit rendering — we just want to assert the destination).
const redirectSpy = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});

vi.mock('next/navigation', () => ({
  redirect: redirectSpy,
}));

describe('legacy route redirects', () => {
  beforeEach(() => {
    redirectSpy.mockClear();
  });

  it('1: /stack page redirects to /routine', async () => {
    const mod = await import('../stack/page');
    const StackPage = mod.default;
    expect(() => StackPage()).toThrow(/NEXT_REDIRECT/);
    expect(redirectSpy).toHaveBeenCalledTimes(1);
    expect(redirectSpy).toHaveBeenCalledWith('/routine');
  });

  it('2: /dashboard page redirects to /routine', async () => {
    const mod = await import('../dashboard/page');
    const DashboardPage = mod.default;
    expect(() => DashboardPage()).toThrow(/NEXT_REDIRECT/);
    expect(redirectSpy).toHaveBeenCalledTimes(1);
    expect(redirectSpy).toHaveBeenCalledWith('/routine');
  });
});
