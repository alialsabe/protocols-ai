// In-memory per-key rate limiter. Sufficient for early launch on Vercel
// (each lambda instance has its own bucket, so effective limit is N×limit
// where N is the number of warm instances — usually 1-2). When we outgrow
// this, swap the implementation for @upstash/ratelimit or @vercel/kv and
// keep the same exports.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const next: Bucket = { count: 1, resetAt: now + windowMs };
    buckets.set(key, next);
    return { allowed: true, remaining: limit - 1, resetAt: next.resetAt, limit };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt, limit };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt, limit };
}

// Best-effort identifier for the caller. Prefers authenticated user ID
// (passed by the route handler), falls back to the first x-forwarded-for
// IP, then a generic 'anon' bucket so we still cap unauth attackers
// without proxy headers.
export function clientKey(request: Request, userId: string | null): string {
  if (userId) return `user:${userId}`;
  const fwd = request.headers.get('x-forwarded-for') ?? '';
  const ip = fwd.split(',')[0]?.trim();
  return ip ? `ip:${ip}` : 'anon';
}

// Standard 429 response. Includes X-RateLimit-* headers so clients can
// react gracefully and we can debug from the network tab.
export function rateLimitResponse(result: RateLimitResult) {
  const retryAfterSec = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded. Try again later.',
      retryAfterSeconds: retryAfterSec,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSec),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
      },
    },
  );
}

// Periodic cleanup so the Map doesn't grow unboundedly. Vercel can keep
// a lambda warm for ~15 min so this matters across many requests.
let cleanupTimer: ReturnType<typeof setInterval> | undefined;
if (typeof globalThis !== 'undefined' && !cleanupTimer) {
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(key);
    }
  }, 60_000);
  // Don't keep the lambda alive just for cleanup.
  cleanupTimer?.unref?.();
}
