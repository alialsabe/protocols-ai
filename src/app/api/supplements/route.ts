import { listProtocolsSupplements, listAllTags, listAllTypes, listAllStudyCounts } from '@/lib/db';

export async function GET() {
  const rows = await listProtocolsSupplements();
  const allTags = await listAllTags();
  const allTypes = await listAllTypes();
  const allCounts = await listAllStudyCounts();

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

  const countMap = new Map<string, number>();
  for (const c of allCounts) {
    countMap.set(c.supplementId, c.count);
  }

  const supplements = rows.map(({ id, ...rest }) => ({
    ...rest,
    tags: tagMap.get(id) ?? [],
    supplementTypes: typeMap.get(id) ?? [],
    studyCount: countMap.get(id) ?? 0,
  }));

  return Response.json({
    supplements,
    total: supplements.length,
  });
}
