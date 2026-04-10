"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { T } from '@/lib/design-tokens';
import { Button } from '@/components/shared/Primitives';
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
    <section className="text-center max-w-3xl mx-auto pt-8 md:pt-20 pb-16 px-4">
      {/* Tagline chip */}
      <div
        className="inline-block px-3 py-1 mb-5 rounded-md text-[10px] font-bold tracking-widest uppercase"
        style={{ background: T.accentDim, border: `1px solid ${T.borderAccent}`, color: T.accent }}
      >
        Supplement Intelligence
      </div>

      {/* H1 — value prop */}
      <h1
        className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4"
        style={{ color: T.text, lineHeight: 1.1 }}
      >
        Know what you take.
      </h1>

      <p className="text-base md:text-lg mb-10 max-w-xl mx-auto" style={{ color: T.textMuted }}>
        Research any supplement with clinical data, interaction checks, and dosage guidance.
        Then build your personalized protocol.
      </p>

      {/* Search bar */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{ animation: 'proto-fade-up 500ms cubic-bezier(0.16,1,0.3,1) 100ms both' }}
      >
        <div
          className="absolute -inset-px rounded-2xl"
          style={{
            background: `conic-gradient(from 180deg at 50% 50%, transparent 0deg, ${T.accentGlow} 120deg, rgba(14,165,233,0.2) 200deg, transparent 360deg)`,
            animation: 'proto-search-rotate 6s linear infinite',
            opacity: 0.75,
          }}
        />
        <div
          className="relative flex items-center rounded-2xl p-1"
          style={{ background: T.card, zIndex: 1 }}
        >
          <Search className="absolute left-5 w-5 h-5 pointer-events-none" style={{ color: T.textDim }} />
          <SupplementAutocomplete
            value={query}
            onChange={setQuery}
            onSelect={(v) => handleAnalyze(v)}
            placeholder="Search any supplement (e.g. Ashwagandha, Creatine, NMN...)"
            inputClassName="pl-12 h-14 md:h-16 text-[15px] rounded-xl bg-transparent border-transparent font-medium"
            dictionary={dictionary}
          />
          <Button
            className="h-11 md:h-12 shrink-0 mr-1 text-[13px] font-bold px-6 md:px-8"
            variant="primary"
            onClick={() => handleAnalyze()}
            disabled={loading}
            style={{ borderRadius: 12 }}
          >
            {loading ? 'Loading...' : 'Analyze'}
          </Button>
        </div>
      </div>

      {/* Subtext */}
      <p className="mt-5 text-xs" style={{ color: T.textFaint }}>
        279 supplements indexed with clinical studies, interaction data, and dosage protocols.
      </p>
    </section>
  );
}
