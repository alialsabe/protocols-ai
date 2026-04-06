import { listProtocolsSupplements, listAllTags } from '@/lib/db';

export async function GET() {
  const [rows, allTags] = await Promise.all([
    listProtocolsSupplements(),
    listAllTags(),
  ]);

  const tagMap = new Map<string, { tag: string; tagType: string }[]>();
  for (const t of allTags) {
    const arr = tagMap.get(t.supplementId) ?? [];
    arr.push({ tag: t.tag, tagType: t.tagType });
    tagMap.set(t.supplementId, arr);
  }

  const supplements = rows.map(({ id, ...rest }) => ({
    ...rest,
    tags: tagMap.get(id) ?? [],
  }));

  return Response.json({
    supplements,
    total: supplements.length,
  });
}
