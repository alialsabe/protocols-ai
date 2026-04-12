'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, Plus, Search } from 'lucide-react';
import { TopBar } from '@/components/v2/TopBar';
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
    <main className="proto-grid relative min-h-screen">
      <TopBar />

      <section className="mx-auto max-w-[1200px] px-6 pt-10 md:px-10 lg:px-16">
        <span
          className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
          style={{ color: 'var(--accent)' }}
        >
          SIDE-BY-SIDE · v2
        </span>
        <h1
          className="mt-3 text-[40px] font-extrabold leading-[1.05] tracking-[-1.2px]"
          style={{ color: 'var(--fg)' }}
        >
          Compare up to {MAX_SUPPLEMENTS} supplements.
        </h1>
        <p className="mt-3 max-w-[640px] text-[15px] leading-[24px]" style={{ color: 'var(--fg-muted)' }}>
          Evidence quality, safety profile, dose, and bioavailability on a single radar. No marketing spin.
        </p>
      </section>

      <section className="mx-auto mt-8 max-w-[1200px] px-6 md:px-10 lg:px-16">
        <div
          className="rounded-[16px] p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--hair)' }}
        >
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--fg-faint)', width: 16, height: 16 }}
              />
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
                placeholder={queries.length >= MAX_SUPPLEMENTS ? 'Maximum reached' : 'query supplement...'}
                className="proto-focus h-12 w-full rounded-md pl-10 pr-3 font-mono text-[14px] disabled:opacity-50"
                style={{
                  background: 'var(--surface-raise)',
                  border: '1px solid var(--hair)',
                  color: 'var(--fg)',
                  outline: 'none',
                }}
              />
            </div>
            <button
              type="button"
              onClick={addQuery}
              disabled={!input.trim() || queries.length >= MAX_SUPPLEMENTS}
              className="flex h-12 items-center gap-2 rounded-md px-4 font-mono text-[11px] font-bold uppercase tracking-[1.4px] transition-opacity disabled:opacity-40"
              style={{ background: 'var(--accent)', color: '#09090b' }}
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>

          {queries.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {queries.map((q, i) => (
                <span
                  key={`${q}-${i}`}
                  className="inline-flex items-center gap-1.5 rounded-full py-1 pl-3 pr-1 font-mono text-[12px]"
                  style={{
                    background: 'var(--accent-dim)',
                    border: '1px solid var(--accent)',
                    color: 'var(--accent)',
                  }}
                >
                  {q}
                  <button
                    type="button"
                    onClick={() => removeQuery(i)}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full transition-colors"
                    style={{ color: 'var(--accent)' }}
                    aria-label={`Remove ${q}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-between">
            <div className="font-mono text-[11px] uppercase tracking-[1.4px]" style={{ color: 'var(--fg-dim)' }}>
              {queries.length} OF {MAX_SUPPLEMENTS} SELECTED
            </div>
            <button
              type="button"
              onClick={runComparison}
              disabled={queries.length < 2 || loading}
              className="h-10 rounded-md px-5 font-mono text-[11px] font-bold uppercase tracking-[1.4px] transition-colors disabled:opacity-40"
              style={{
                background: 'transparent',
                border: '1px solid var(--hair-strong)',
                color: 'var(--fg)',
              }}
            >
              {loading ? 'COMPARING…' : 'COMPARE →'}
            </button>
          </div>

          {error ? (
            <div
              className="mt-3 rounded-md px-3 py-2 font-mono text-[12px]"
              style={{
                background: 'rgba(251, 113, 133, 0.08)',
                border: '1px solid rgba(251, 113, 133, 0.3)',
                color: '#fb7185',
              }}
            >
              {error}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-[1200px] px-6 pb-24 md:px-10 lg:px-16">
        {hasResults ? (
          <div className="space-y-6">
            <ComparisonRadar results={results} />
            <ComparisonTable results={results} />
          </div>
        ) : (
          <div
            className="rounded-[16px] p-12 text-center"
            style={{ background: 'var(--surface)', border: '1px dashed var(--hair-strong)' }}
          >
            <span
              className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
              style={{ color: 'var(--fg-dim)' }}
            >
              EMPTY STATE
            </span>
            <p className="mt-3 text-[14px]" style={{ color: 'var(--fg-muted)' }}>
              Add 2 or more supplements to see them side by side.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {['magnesium', 'creatine', 'omega-3', 'ashwagandha', 'l-theanine'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setInput(s);
                  }}
                  className="rounded-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-[1.4px] transition-colors hover:text-white"
                  style={{ border: '1px solid var(--hair)', color: 'var(--fg-muted)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
