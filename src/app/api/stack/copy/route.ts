import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { savedStacks, sharedProtocols } from '@/lib/schema-postgres';
import { createClient } from '../../../../../utils/supabase/server';

type SharedSnapshot = {
  name?: string;
  supplementIds?: string[];
};

function parseSnapshot(value: string | null): SharedSnapshot {
  try {
    const parsed = JSON.parse(value ?? '{}');
    return {
      name: typeof parsed.name === 'string' ? parsed.name : undefined,
      supplementIds: Array.isArray(parsed.supplementIds) ? parsed.supplementIds.map(String) : [],
    };
  } catch {
    return { supplementIds: [] };
  }
}

function parseIds(value: string | null): string[] {
  try {
    const parsed = JSON.parse(value ?? '[]');
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

/**
 * POST /api/stack/copy
 * Body: { publicId: string }
 *
 * Copies a public stack into the authenticated user's current routine by
 * merging supplement ids. This avoids silently overwriting an existing routine.
 */
export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const publicId = String(payload?.publicId ?? '');
  if (!publicId) {
    return NextResponse.json({ error: 'publicId is required' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const sharedRows = await db
    .select()
    .from(sharedProtocols)
    .where(eq(sharedProtocols.publicId, publicId))
    .limit(1);

  if (sharedRows.length === 0) {
    return NextResponse.json({ error: 'Shared stack not found' }, { status: 404 });
  }

  const shared = sharedRows[0];
  const snapshot = parseSnapshot(shared.snapshot);
  const incomingIds = snapshot.supplementIds ?? [];
  if (incomingIds.length === 0) {
    return NextResponse.json({ error: 'Shared stack is empty' }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(savedStacks)
    .where(eq(savedStacks.userId, userData.user.id))
    .limit(1);

  const now = new Date().toISOString();
  let stackId: string;

  if (existing.length > 0) {
    const current = existing[0];
    const mergedIds = Array.from(new Set([...parseIds(current.supplementIds), ...incomingIds]));
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
      name: snapshot.name ? `${snapshot.name} Copy` : 'Copied Stack',
      supplementIds: JSON.stringify(incomingIds),
      createdAt: now,
      updatedAt: now,
    });
  }

  await db
    .update(sharedProtocols)
    .set({
      copyCount: sql`${sharedProtocols.copyCount} + 1`,
      updatedAt: now,
    })
    .where(eq(sharedProtocols.id, shared.id));

  return NextResponse.json({ stackId, url: '/routine' });
}
