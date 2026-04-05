import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { updateFallbackQueueItem } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';

const VALID_STATUSES = ['pending', 'reviewed', 'approved', 'rejected'] as const;

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<'/api/admin/fallback-queue/[id]'>,
) {
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const { status, reviewerNotes } = body as { status?: string; reviewerNotes?: string };

  if (status !== undefined && !VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 },
    );
  }

  const changes = await updateFallbackQueueItem(id, { status, reviewerNotes });

  if (changes === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, id });
}
