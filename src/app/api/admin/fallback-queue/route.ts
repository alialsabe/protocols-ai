import { NextResponse } from 'next/server';
import { listFallbackQueueByStatus } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';

const VALID_STATUSES = ['pending', 'reviewed', 'approved', 'rejected'] as const;

export async function GET(request: Request) {
  const authError = requireAdminAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? 'pending';

  if (!VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 },
    );
  }

  const rows = await listFallbackQueueByStatus(status);
  return NextResponse.json({ items: rows, total: rows.length, status });
}
