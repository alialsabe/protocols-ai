import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { savedStacks } from '@/lib/schema-postgres';
import { findSupplementByQuery } from '@/lib/supplement-lookup';
import { createClient } from '../../../../../utils/supabase/server';

type ImportItem = {
  name?: unknown;
};

function parseIds(value: string | null): string[] {
  try {
    const parsed = JSON.parse(value ?? '[]');
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

/**
 * POST /api/stack/import
 * Body: { supplements: Array<{ name: string }>, name?: string }
 *
 * Resolves scanned/optimized supplement names to catalog rows. Authenticated
 * users also get a merged server stack; anonymous users receive slugs for the
 * client-side routine store.
 */
export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const rawItems: ImportItem[] = Array.isArray(payload?.supplements) ? payload.supplements : [];
  const stackName = typeof payload?.name === 'string' && payload.name.trim()
    ? payload.name.trim()
    : 'My Stack';

  const names = rawItems
    .map((item) => (typeof item?.name === 'string' ? item.name.trim() : ''))
    .filter(Boolean);

  if (names.length === 0) {
    return NextResponse.json({ error: 'supplements are required' }, { status: 400 });
  }

  const seenIds = new Set<string>();
  const matched: Array<{ id: string; slug: string; name: string }> = [];
  const unmatched: string[] = [];

  for (const name of names) {
    const match = await findSupplementByQuery(name);
    if (!match) {
      unmatched.push(name);
      continue;
    }
    if (seenIds.has(match.id)) continue;
    seenIds.add(match.id);
    matched.push({ id: match.id, slug: match.slug, name: match.name });
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: userData } = await supabase.auth.getUser();

  let stackId: string | null = null;
  if (userData.user && matched.length > 0) {
    const existing = await db
      .select()
      .from(savedStacks)
      .where(eq(savedStacks.userId, userData.user.id))
      .limit(1);

    const now = new Date().toISOString();
    if (existing.length > 0) {
      const current = existing[0];
      const mergedIds = Array.from(new Set([...parseIds(current.supplementIds), ...matched.map((m) => m.id)]));
      await db
        .update(savedStacks)
        .set({
          supplementIds: JSON.stringify(mergedIds),
          updatedAt: now,
        })
        .where(eq(savedStacks.id, current.id));
      stackId = current.id;
    } else {
      stackId = `stack-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      await db.insert(savedStacks).values({
        id: stackId,
        userId: userData.user.id,
        name: stackName,
        supplementIds: JSON.stringify(matched.map((m) => m.id)),
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  return NextResponse.json({
    authenticated: Boolean(userData.user),
    stackId,
    matched,
    unmatched,
    slugs: matched.map((m) => m.slug),
  });
}
