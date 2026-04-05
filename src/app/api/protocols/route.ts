import { NextResponse } from 'next/server';
import { lookupSupplement, getSuggestions, listAllSupplements, logFallbackMiss } from '@/lib/supplement-lookup';
import type { Biometrics } from '@/lib/protocol-types';

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const query = String(payload?.query ?? '').trim();

  if (!query) {
    return NextResponse.json(
      { error: 'Missing query' },
      { status: 400 }
    );
  }

  const biometrics: Biometrics = {
    weightKg: typeof payload?.biometrics?.weightKg === 'number' ? payload.biometrics.weightKg : undefined,
    age: typeof payload?.biometrics?.age === 'number' ? payload.biometrics.age : undefined,
    sex: payload?.biometrics?.sex ?? undefined,
  };

  const started = performance.now();

  // DB-first lookup
  const report = await lookupSupplement(query, biometrics);

  if (report) {
    return NextResponse.json({
      report,
      runtimeMs: performance.now() - started,
      source: 'database',
    });
  }

  // Not found — log miss and return suggestions
  const missId = await logFallbackMiss(query);
  const suggestions = await getSuggestions(query);
  const allSupplements = await listAllSupplements();

  return NextResponse.json({
    status: 'not_found',
    message: `No supplement data found for "${query}". Try one of the suggestions below.`,
    suggestions,
    availableSupplements: allSupplements.map(s => s.name),
    queuedForReview: true,
    missId,
    runtimeMs: performance.now() - started,
  }, { status: 404 });
}
