import { NextResponse } from 'next/server';
import { lookupSupplement } from '@/lib/supplement-lookup';
import { triggerFallbackAsync } from '@/lib/llm-fallback';
import type { ProtocolReport } from '@/lib/protocol-types';

/**
 * Comparison endpoint: accepts up to 5 supplement slugs/names, returns
 * a ProtocolReport for each. Sparse supplements trigger a background
 * LLM fallback so subsequent requests fill in.
 *
 * POST /api/compare
 * Body: { queries: string[] }
 */
export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const queries: unknown = payload?.queries;

  if (!Array.isArray(queries) || queries.length === 0) {
    return NextResponse.json(
      { error: 'queries must be a non-empty array' },
      { status: 400 },
    );
  }

  // Dedupe and cap at 5
  const dedupedQueries = Array.from(
    new Set(
      queries
        .filter((q): q is string => typeof q === 'string')
        .map((q) => q.trim())
        .filter(Boolean),
    ),
  ).slice(0, 5);

  if (dedupedQueries.length === 0) {
    return NextResponse.json(
      { error: 'queries must contain at least one non-empty string' },
      { status: 400 },
    );
  }

  // Sequential lookups — keeps the Supabase pool happy.
  // Each lookup will itself trigger the LLM fallback inline if data is missing
  // AND the ANTHROPIC_API_KEY is configured. If not configured, sparse
  // supplements return with empty science/dosage — the UI renders "Data pending".
  const results: Array<{ query: string; report: ProtocolReport | null; status: 'ok' | 'generating' | 'not_found' }> = [];

  for (const query of dedupedQueries) {
    try {
      const report = await lookupSupplement(query);
      if (!report) {
        results.push({ query, report: null, status: 'not_found' });
        continue;
      }

      // If the report has no science AND no dosage, it's sparse.
      // Flag it as 'generating' so the UI shows a placeholder column.
      const isSparse = !report.science && !report.dosage;
      results.push({
        query,
        report,
        status: isSparse ? 'generating' : 'ok',
      });

      // Fire-and-forget background trigger for sparse supplements so the
      // next user visit has the data. No-op when ANTHROPIC_API_KEY is unset.
      if (isSparse && report.id && report.name) {
        triggerFallbackAsync({
          supplementId: report.id,
          name: report.name,
          category: 'supplement',
          baseCompound: report.baseCompound ?? null,
          hasScience: false,
          hasDosage: false,
        });
      }
    } catch (err) {
      results.push({
        query,
        report: null,
        status: 'not_found',
      });
      // Intentionally swallow — we never fail the whole comparison
      // because one supplement lookup threw.
      void err;
    }
  }

  return NextResponse.json({ results });
}
