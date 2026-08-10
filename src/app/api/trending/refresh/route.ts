import { refreshTrending } from '@/lib/trending/aggregate';

function isAuthorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const provided =
    request.headers.get('x-cron-secret') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  return provided === expected;
}

async function handleRefresh(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const payload = await refreshTrending();
    return Response.json({ ok: true, generatedAt: payload.generatedAt });
  } catch (err) {
    console.error('[api/trending/refresh] failed', err);
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

// Vercel cron fires a GET with `Authorization: Bearer <CRON_SECRET>`.
export async function GET(request: Request) {
  return handleRefresh(request);
}

export async function POST(request: Request) {
  return handleRefresh(request);
}
