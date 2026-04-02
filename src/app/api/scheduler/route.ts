import { NextResponse } from 'next/server';
import { generateSchedule } from '@/lib/scheduler-engine';
import type { SchedulerInput } from '@/lib/protocol-types';

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));

  const supplements: string[] = payload?.supplements;
  if (!supplements || !Array.isArray(supplements) || supplements.length === 0) {
    return NextResponse.json(
      { error: 'Missing or empty "supplements" array. Provide supplement names or slugs.' },
      { status: 400 }
    );
  }

  const input: SchedulerInput = {
    supplements,
    routine: payload?.routine ?? undefined,
    medications: payload?.medications ?? undefined,
  };

  const started = performance.now();
  const result = generateSchedule(input);

  return NextResponse.json({
    schedule: result,
    runtimeMs: performance.now() - started,
    source: 'deterministic_engine',
  });
}
