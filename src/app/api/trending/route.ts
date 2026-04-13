import { getTrendingPayload } from '@/components/v2/trending/types';

export async function GET() {
  const payload = await getTrendingPayload();
  const stale = payload.stale === true;

  return Response.json(payload, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      'X-Trending-Stale': String(stale),
    },
  });
}
