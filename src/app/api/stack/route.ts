import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/drizzle';
import { savedStacks, supplements } from '@/lib/schema-postgres';
import { eq } from 'drizzle-orm';
import { createClient } from '../../../../utils/supabase/server';

/**
 * GET /api/stack
 * Returns the authenticated user's current stack, with resolved supplement names.
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

  const supplementNames: string[] = [];
  for (const sid of supplementIds) {
    const sRows = await db.select().from(supplements).where(eq(supplements.id, sid)).limit(1);
    if (sRows[0]?.name) supplementNames.push(sRows[0].name);
    else supplementNames.push(sid);
  }

  return NextResponse.json({
    authenticated: true,
    stack: {
      id: stack.id,
      name: stack.name,
      supplementIds,
      supplementNames,
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
