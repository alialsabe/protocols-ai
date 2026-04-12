import { getSuggestions } from '@/lib/supplement-lookup';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';
  if (q.length < 1) return Response.json({ suggestions: [] });

  try {
    const suggestions = await getSuggestions(q, 6);
    return Response.json({ suggestions });
  } catch {
    return Response.json({ suggestions: [] });
  }
}
