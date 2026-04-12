'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, Plus, Search } from 'lucide-react';
import { T } from '@/lib/design-tokens';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';
import type { ProtocolReport } from '@/lib/protocol-types';
import { ComparisonTable } from '@/components/compare/ComparisonTable';
import { ComparisonRadar } from '@/components/compare/ComparisonRadar';

type ComparisonResult = {
  query: string;
  report: ProtocolReport | null;
  status: 'ok' | 'generating' | 'not_found';
};

const MAX_SUPPLEMENTS = 5;

export default function ComparePage() {
  const [queries, setQueries] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addQuery() {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (queries.length >= MAX_SUPPLEMENTS) {
      setError(`You can compare up to ${MAX_SUPPLEMENTS} supplements at a time.`);
      return;
    }
    if (queries.some((q) => q.toLowerCase() === trimmed.toLowerCase())) {
      setError('Already in the comparison.');
      return;
    }
    setQueries((prev) => [...prev, trimmed]);
    setInput('');
    setError(null);
  }

  function removeQuery(idx: number) {
    setQueries((prev) => prev.filter((_, i) => i !== idx));
    setResults((prev) => prev.filter((_, i) => i !== idx));
  }

  async function runComparison() {
    if (queries.length < 2) {
      setError('Add at least 2 supplements to compare.');
      return;
    }
    setLoading(true);
    setError(null);
    track(ANALYTICS_EVENTS.COMPARISON_STARTED, { supplement_count: queries.length });

    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Comparison failed');
      setResults(data.results ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  const hasResults = results.length > 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: T.bg }}>
      <header className="border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: T.border }}>
        <Link href="/" className="text-[#06d6a0] font-semibold tracking-tight">
          ← Protocols.ai
        </Link>
        <h1 className="text-sm font-medium text-white tracking-wide uppercase">Compare Supplements</h1>
        <div className="w-24" />
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-2">Compare up to {MAX_SUPPLEMENTS} supplements</h2>
          <p className="text-[#71717a] text-sm">
            See side-by-side evidence, dosage, interactions, and cost. Add supplements below to start.
          </p>
        </div>

        <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5 mb-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525b]" />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addQuery();
                  }
                }}
                disabled={queries.length >= MAX_SUPPLEMENTS}
                placeholder={queries.length >= MAX_SUPPLEMENTS ? 'Maximum reached' : 'Search supplement...'}
                className="w-full h-11 pl-9 pr-3 bg-[#18181b] border border-white/[0.06] rounded-lg text-white placeholder:text-[#52525b] focus:outline-none focus:border-[#06d6a0]/40 focus:ring-1 focus:ring-[#06d6a0]/20 disabled:opacity-50"
              />
            </div>
            <button
              type="button"
              onClick={addQuery}
              disabled={!input.trim() || queries.length >= MAX_SUPPLEMENTS}
              className="h-11 px-4 bg-[#06d6a0] hover:bg-[#06d6a0]/90 disabled:opacity-50 text-black font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {queries.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {queries.map((q, i) => (
                <span
                  key={`${q}-${i}`}
                  className="inline-flex items-center gap-1.5 pl-3 pr-1 py-1 bg-[#06d6a0]/10 border border-[#06d6a0]/30 rounded-full text-sm text-[#06d6a0]"
                >
                  {q}
                  <button
                    type="button"
                    onClick={() => removeQuery(i)}
                    className="h-5 w-5 inline-flex items-center justify-center rounded-full hover:bg-[#06d6a0]/20"
                    aria-label={`Remove ${q}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-[#71717a]">
              {queries.length} of {MAX_SUPPLEMENTS} selected
            </div>
            <button
              type="button"
              onClick={runComparison}
              disabled={queries.length < 2 || loading}
              className="h-10 px-5 bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-40 text-white font-semibold rounded-lg border border-white/[0.08] hover:border-[#06d6a0]/40 transition-colors"
            >
              {loading ? 'Comparing…' : 'Compare'}
            </button>
          </div>

          {error ? (
            <div className="mt-3 text-sm text-[#fb7185] bg-[#fb7185]/10 border border-[#fb7185]/20 rounded-lg px-3 py-2">
              {error}
            </div>
          ) : null}
        </div>

        {hasResults ? (
          <div className="space-y-6">
            <ComparisonRadar results={results} />
            <ComparisonTable results={results} />
          </div>
        ) : (
          <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-10 text-center">
            <div className="text-[#71717a] text-sm">
              Add 2 or more supplements and click Compare to see them side by side.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
