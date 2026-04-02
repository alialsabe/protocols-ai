import { NextResponse } from 'next/server';
import { getRawDb } from '@/lib/db';

type FallbackRow = {
  id: string;
  query: string;
  normalized_query: string;
  first_seen_at: string;
  last_seen_at: string;
  hit_count: number;
  status: string;
  reviewer_notes: string | null;
};

const VALID_STATUSES = ['pending', 'reviewed', 'approved', 'rejected'] as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? 'pending';

  if (!VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }

  const raw = getRawDb();
  const rows = raw.prepare(
    'SELECT * FROM fallback_queue WHERE status = ? ORDER BY hit_count DESC, last_seen_at DESC LIMIT 100'
  ).all(status) as FallbackRow[];

  return NextResponse.json({ items: rows, total: rows.length, status });
}
