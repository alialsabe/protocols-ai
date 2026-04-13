import { refreshTrending } from '@/lib/trending/aggregate';

export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  const provided =
    request.headers.get('x-cron-secret') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!expected || provided !== expected) {
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
