import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/drizzle';
import { savedStacks, supplements, clinicalStudies } from '@/lib/schema-postgres';
import { eq, inArray, sql } from 'drizzle-orm';
import { createClient } from '../../../../utils/supabase/server';

/**
 * GET /api/stack
 * Returns the authenticated user's current stack, with resolved supplement
 * names and per-supplement metadata (slug + study count) needed to compute
 * rarity client-side.
 */
export async function GET() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return NextResponse.json({ stack: null, authenticated: false });
  }

  const rows = await db
    .select()
    .from(savedStacks)
    .where(eq(savedStacks.userId, userData.user.id))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ stack: null, authenticated: true });
  }

  const stack = rows[0];
  let supplementIds: string[] = [];
  try {
    supplementIds = JSON.parse(stack.supplementIds ?? '[]');
  } catch {
    supplementIds = [];
  }

  // Resolve supplement metadata + study counts in two queries (no N+1).
  let supplementMeta: Array<{ id: string; name: string; slug: string; studyCount: number }> = [];
  if (supplementIds.length > 0) {
    const suppRows = await db
      .select({
        id: supplements.id,
        name: supplements.name,
        slug: supplements.slug,
      })
      .from(supplements)
      .where(inArray(supplements.id, supplementIds));

    const studyCounts = await db
      .select({
        supplementId: clinicalStudies.supplementId,
        cnt: sql<number>`count(*)::int`,
      })
      .from(clinicalStudies)
      .where(inArray(clinicalStudies.supplementId, supplementIds))
      .groupBy(clinicalStudies.supplementId);

    const countMap = new Map(studyCounts.map((r) => [r.supplementId, Number(r.cnt) || 0]));
    supplementMeta = suppRows.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      studyCount: countMap.get(s.id) ?? 0,
    }));
  }

  const metaById = new Map(supplementMeta.map((s) => [s.id, s]));
  const supplementNames: string[] = supplementIds.map(
    (sid) => metaById.get(sid)?.name ?? sid,
  );

  return NextResponse.json({
    authenticated: true,
    stack: {
      id: stack.id,
      name: stack.name,
      supplementIds,
      supplementNames,
      supplements: supplementMeta,
    },
  });
}

/**
 * POST /api/stack
 * Body: { name: string, supplementIds: string[] }
 * Upserts the user's stack. Returns { id: string }.
 */
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const name = String(payload?.name ?? 'My Stack');
  const supplementIds: string[] = Array.isArray(payload?.supplementIds)
    ? payload.supplementIds.map(String)
    : [];

  const now = new Date().toISOString();

  // Check if the user already has a stack
  const existing = await db
    .select()
    .from(savedStacks)
    .where(eq(savedStacks.userId, userData.user.id))
    .limit(1);

  if (existing.length > 0) {
    // Update
    await db
      .update(savedStacks)
      .set({
        name,
        supplementIds: JSON.stringify(supplementIds),
        updatedAt: now,
      })
      .where(eq(savedStacks.userId, userData.user.id));

    return NextResponse.json({ id: existing[0].id });
  }

  // Insert
  const id = `stack-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  await db.insert(savedStacks).values({
    id,
    userId: userData.user.id,
    name,
    supplementIds: JSON.stringify(supplementIds),
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ id });
}
