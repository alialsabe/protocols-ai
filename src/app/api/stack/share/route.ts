import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/drizzle';
import { savedStacks, sharedProtocols, supplements } from '@/lib/schema-postgres';
import { eq } from 'drizzle-orm';
import { createClient } from '../../../../../utils/supabase/server';

/**
 * POST /api/stack/share
 * Body: { stackId: string }
 * Returns: { publicId: string, url: string }
 *
 * Creates a public shareable snapshot of a user's saved stack.
 * Requires authentication. Must own the stack.
 */

function generatePublicId(): string {
  // 12 chars of URL-safe base62. Enough entropy to prevent enumeration.
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const stackId = String(payload?.stackId ?? '');
  if (!stackId) {
    return NextResponse.json({ error: 'stackId is required' }, { status: 400 });
  }

  // Authenticate
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Load stack and verify ownership
  const stackRows = await db.select().from(savedStacks).where(eq(savedStacks.id, stackId)).limit(1);
  if (stackRows.length === 0) {
    return NextResponse.json({ error: 'Stack not found' }, { status: 404 });
  }
  const stack = stackRows[0];
  if (stack.userId !== userData.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Snapshot the supplement names at share time so the page renders
  // even if the source stack later changes.
  let supplementIds: string[] = [];
  try {
    supplementIds = JSON.parse(stack.supplementIds ?? '[]');
  } catch {
    supplementIds = [];
  }

  const supplementNames: string[] = [];
  for (const id of supplementIds) {
    const rows = await db.select().from(supplements).where(eq(supplements.id, id)).limit(1);
    if (rows[0]?.name) supplementNames.push(rows[0].name);
  }

  const snapshot = {
    name: stack.name,
    supplementIds,
    supplementNames,
  };

  const publicId = generatePublicId();
  const shareId = `shared-${Date.now().toString(36)}`;
  const now = new Date().toISOString();

  await db.insert(sharedProtocols).values({
    id: shareId,
    publicId,
    stackId: stack.id,
    ownerUserId: userData.user.id,
    snapshot: JSON.stringify(snapshot),
    viewCount: 0,
    createdAt: now,
    updatedAt: now,
  });

  const { origin } = new URL(request.url);
  return NextResponse.json({
    publicId,
    url: `${origin}/stack/${publicId}`,
  });
}
