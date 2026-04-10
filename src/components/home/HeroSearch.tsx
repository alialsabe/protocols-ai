"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { T } from '@/lib/design-tokens';
import { SupplementAutocomplete, useSupplementDictionary } from '@/components/shared/SupplementAutocomplete';

export function HeroSearch() {
  const router = useRouter();
  const dictionary = useSupplementDictionary();
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleAnalyze = (q?: string) => {
    const term = (q ?? query).trim();
    if (!term) return;
    setLoading(true);
    router.push(`/supplement/${encodeURIComponent(term)}`);
  };

  return (
    <section className="text-center max-w-3xl mx-auto pt-12 md:pt-32 pb-20 px-6">
      {/* Chip */}
      <div
        className="inline-block px-3 py-1 mb-6 text-[10px] font-bold tracking-widest uppercase"
        style={{
          background: T.primaryDim,
          border: `1px solid ${T.borderAccent}`,
          color: T.primary,
          borderRadius: 2,
        }}
      >
        The Standard for Supplement Precision
      </div>

      {/* Headline */}
      <h1
        className="text-4xl md:text-7xl font-extrabold tracking-tight mb-12"
        style={{ color: T.text, letterSpacing: '-0.03em' }}
      >
        Verify Your{' '}
        <span className="italic" style={{ color: T.primary }}>
          Protocol.
        </span>
      </h1>

      {/* Search bar */}
      <div className="relative max-w-3xl mx-auto">
        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none z-20">
          <Search className="w-5 h-5" style={{ color: T.outline }} />
        </div>
        <SupplementAutocomplete
          value={query}
          onChange={setQuery}
          onSelect={(v) => handleAnalyze(v)}
          placeholder="SEARCH CLINICAL COMPOUNDS (E.G. NMN, CREATINE MONOHYDRATE...)"
          inputClassName="pl-14 pr-32 h-16 md:h-18 text-sm font-medium tracking-wide bg-transparent border-b border-[rgba(69,71,76,0.3)] focus:border-[#adc6ff] uppercase placeholder:normal-case"
          dictionary={dictionary}
        />
        <div className="absolute inset-y-0 right-4 flex items-center z-20">
          <button
            className="vanguard-gradient px-6 py-2 text-[10px] font-black uppercase tracking-widest"
            style={{ color: T.textOnPrimary, borderRadius: 2 }}
            onClick={() => handleAnalyze()}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Analyze'}
          </button>
        </div>
      </div>

      {/* Sub-text */}
      <p className="mt-6 text-xs tracking-wide" style={{ color: T.outline }}>
        279 supplements indexed with clinical studies, interaction data, and dosage protocols.
      </p>
    </section>
  );
}
