import { listProtocolsSupplements, listAllTags, listAllTypes } from '@/lib/db';

export async function GET() {
  const [rows, allTags, allTypes] = await Promise.all([
    listProtocolsSupplements(),
    listAllTags(),
    listAllTypes(),
  ]);

  const tagMap = new Map<string, { tag: string; tagType: string }[]>();
  for (const t of allTags) {
    const arr = tagMap.get(t.supplementId) ?? [];
    arr.push({ tag: t.tag, tagType: t.tagType });
    tagMap.set(t.supplementId, arr);
  }

  const typeMap = new Map<string, string[]>();
  for (const t of allTypes) {
    const arr = typeMap.get(t.supplementId) ?? [];
    arr.push(t.typeName);
    typeMap.set(t.supplementId, arr);
  }

  const supplements = rows.map(({ id, ...rest }) => ({
    ...rest,
    tags: tagMap.get(id) ?? [],
    supplementTypes: typeMap.get(id) ?? [],
  }));

  return Response.json({
    supplements,
    total: supplements.length,
  });
}
