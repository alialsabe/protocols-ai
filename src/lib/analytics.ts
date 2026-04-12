/**
 * Client-side analytics wrapper around posthog-js.
 * posthog-js is imported dynamically so the rest of the codebase type-checks
 * even if the package isn't installed yet (e.g. on first clone before `pnpm install`).
 */

// Minimal shape so we don't depend on posthog-js types at compile time.
interface PostHogLike {
  init: (key: string, options: Record<string, unknown>) => void;
  capture: (event: string, properties?: Record<string, unknown>) => void;
  identify: (distinctId: string, properties?: Record<string, unknown>) => void;
  reset: () => void;
}

let client: PostHogLike | null = null;
let initialized = false;

export async function initAnalytics(): Promise<void> {
  if (initialized || typeof window === 'undefined') return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) {
    initialized = true;
    return;
  }

  try {
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';
    const mod = await import('posthog-js');
    const posthog = mod.default as unknown as PostHogLike;
    posthog.init(key, {
      api_host: host,
      capture_pageview: true,
      capture_pageleave: true,
      person_profiles: 'identified_only',
    });
    client = posthog;
  } catch {
    // posthog-js not installed — no-op so the app still runs.
  }
  initialized = true;
}

export function track(event: string, properties?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  client?.capture(event, properties);
}

export function identify(distinctId: string, properties?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  client?.identify(distinctId, properties);
}

export function reset(): void {
  if (typeof window === 'undefined') return;
  client?.reset();
}

export const ANALYTICS_EVENTS = {
  SUPPLEMENT_SEARCHED: 'supplement_searched',
  TAB_CLICKED: 'tab_clicked',
  AFFILIATE_CTA_CLICKED: 'affiliate_cta_clicked',
  ADVISOR_QUERY: 'advisor_query',
  COMPARISON_STARTED: 'comparison_started',
  PROTOCOL_SHARED: 'protocol_shared',
  STACK_SAVED: 'stack_saved',
  LLM_FALLBACK_TRIGGERED: 'llm_fallback_triggered',
  LLM_FALLBACK_COMPLETED: 'llm_fallback_completed',
} as const;
