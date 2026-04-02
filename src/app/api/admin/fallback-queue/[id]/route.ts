import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getRawDb } from '@/lib/db';

const VALID_STATUSES = ['pending', 'reviewed', 'approved', 'rejected'] as const;

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<'/api/admin/fallback-queue/[id]'>
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const { status, reviewerNotes } = body as { status?: string; reviewerNotes?: string };

  if (status !== undefined && !VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }

  const raw = getRawDb();
  const now = new Date().toISOString();

  const updates: string[] = ['last_seen_at = ?'];
  const values: unknown[] = [now];

  if (status !== undefined) { updates.push('status = ?'); values.push(status); }
  if (reviewerNotes !== undefined) { updates.push('reviewer_notes = ?'); values.push(reviewerNotes); }

  values.push(id);

  const result = raw.prepare(
    `UPDATE fallback_queue SET ${updates.join(', ')} WHERE id = ?`
  ).run(...(values as Parameters<typeof raw.prepare>));

  if ((result as { changes: number }).changes === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, id });
}
