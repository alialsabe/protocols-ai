import { listSupplementsBasic } from '@/lib/db';

export async function GET() {
  try {
    const rows = await listSupplementsBasic();
    const supplements = rows.map((r) => {
      let aliases: string[] = [];
      try {
        const parsed = JSON.parse(r.aliases ?? '[]');
        if (Array.isArray(parsed)) aliases = parsed.filter((x): x is string => typeof x === 'string');
      } catch {
        // aliases column may be a non-JSON string in older rows
      }
      return { slug: r.slug, name: r.name, aliases };
    });

    return new Response(JSON.stringify({ supplements }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch {
    return new Response(JSON.stringify({ supplements: [] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }
}
