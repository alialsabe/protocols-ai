import { Suspense } from 'react';
import { TopBar } from '@/components/v2/TopBar';
import { BottomTabBar } from '@/components/v2/BottomTabBar';
import { HomeSearch } from '@/components/v2/HomeSearch';
import { Ticker } from '@/components/v2/Ticker';
import {
  TrendingSection,
  TrendingSkeleton,
} from '@/components/v2/trending/TrendingSection';
import { MostPopularFilterable } from '@/components/v2/trending/MostPopularFilterable';

const LEDGER = [
  { label: 'COMPOUNDS INDEXED',   value: '279' },
  { label: 'STUDIES',             value: '4,821' },
  { label: 'CLINICAL GUIDELINES', value: '12' },
  { label: 'LAST SYNC',           value: '04:12Z' },
];

const CAPABILITIES = [
  {
    n: '01 / RESEARCH',
    title: 'Every claim sourced.',
    body: 'Each supplement page links to peer-reviewed studies with PMIDs and quality grades, not affiliate-driven copy.',
    link: '→ view method',
  },
  {
    n: '02 / PERSONAL',
    title: 'Tuned to your stack.',
    body: 'Goal, medications and routine become inputs. The advisor reasons over your actual protocol, not a generic FAQ.',
    link: '→ how the model thinks',
  },
  {
    n: '03 / SAFE',
    title: 'Conflicts surfaced first.',
    body: 'Medication and supplement interactions are flagged with severity and primary source before any recommendation.',
    link: '→ interaction matrix',
  },
];

export default function HomePage() {
  return (
    <>
      {/* Background layers — fixed, GPU-composited, behind all page content */}
      <div className="proto-bg-noise" aria-hidden="true" />
      <div className="proto-bg-bloom" aria-hidden="true" />
      <div className="proto-bg-vignette" aria-hidden="true" />

    <main className="proto-grid relative min-h-screen overflow-x-hidden pb-20 md:pb-0" style={{ zIndex: 1 }}>
      <TopBar />

      {/* Hero */}
      <section className="mx-auto max-w-[1200px] px-5 pt-12 pb-10 md:px-10 md:pt-16 md:pb-12 lg:px-16 lg:pt-24">
        <span
          className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
          style={{ color: 'var(--accent)' }}
        >
          SUPPLEMENT INTELLIGENCE · v2
        </span>
        <p
          className="mt-6 max-w-[640px] text-[15px] leading-[24px] md:text-[16px] md:leading-[26px]"
          style={{ color: 'var(--fg-muted)' }}
        >
          279 compounds. 4,821 studies. Zero marketing copy.
        </p>

        <HomeSearch />
      </section>

      {/* Most Popular — right under search, with category filter */}
      <section
        aria-labelledby="popular-heading"
        className="mx-auto max-w-[1200px] px-5 md:px-10 lg:px-16"
      >
        <h2 id="popular-heading" className="sr-only">
          Most popular supplements
        </h2>
        <MostPopularFilterable />
      </section>

      {/* Live research feed */}
      <section className="mx-auto max-w-[1200px] md:px-10 lg:px-16">
        <Ticker />
      </section>

      {/* Trending */}
      <section
        aria-labelledby="trending-heading"
        className="mx-auto max-w-[1200px] px-5 pt-12 md:px-10 md:pt-16 lg:px-16"
      >
        <h2 id="trending-heading" className="sr-only">
          Trending supplements
        </h2>
        <Suspense fallback={<TrendingSkeleton />}>
          <TrendingSection />
        </Suspense>
      </section>

      {/* Capability row */}
      <section className="mx-auto max-w-[1200px] px-5 py-16 md:px-10 md:py-20 lg:px-16">
        <div className="flex flex-col gap-10 md:grid md:grid-cols-3 md:gap-0">
          {CAPABILITIES.map((c, i) => (
            <div
              key={c.n}
              className={`flex flex-col gap-3 md:px-8 ${
                i === 0 ? '' : 'border-t pt-10 md:border-t-0 md:pt-0 md:border-l'
              }`}
              style={{
                borderColor: 'var(--hair)',
              }}
            >
              <span
                className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
                style={{ color: 'var(--fg-dim)' }}
              >
                {c.n}
              </span>
              <h2 className="text-[20px] font-extrabold tracking-[-0.4px]" style={{ color: 'var(--fg)' }}>
                {c.title}
              </h2>
              <p className="text-[14px] leading-[22px]" style={{ color: 'var(--fg-muted)' }}>
                {c.body}
              </p>
              <a
                className="mt-2 inline-flex min-h-[44px] items-center font-mono text-[12px] transition-colors hover:text-white"
                style={{ color: 'var(--accent)' }}
                href="#"
              >
                {c.link}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Research ledger */}
      <section
        className="mx-auto max-w-[1200px] px-5 md:px-10 lg:px-16"
        style={{ borderTop: '1px solid var(--hair)' }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4">
          {LEDGER.map((cell, i) => {
            const col = i % 2;
            return (
              <div
                key={cell.label}
                className="flex flex-col gap-1 py-5 md:px-6"
                style={{
                  paddingLeft: col === 0 ? 0 : 20,
                  borderLeft: col === 0 ? 'none' : '1px solid var(--hair)',
                  borderTop: i >= 2 ? '1px solid var(--hair)' : 'none',
                }}
              >
                <span
                  className="font-mono text-[10px] font-bold uppercase tracking-[1.4px]"
                  style={{ color: 'var(--fg-dim)' }}
                >
                  {cell.label}
                </span>
                <span className="font-mono text-[18px]" style={{ color: 'var(--fg)' }}>
                  {cell.value}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer
        role="contentinfo"
        className="mx-auto max-w-[1200px] px-5 py-8 md:px-10 md:py-10 lg:px-16"
        style={{ borderTop: '1px solid var(--hair)' }}
      >
        <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center md:gap-4">
          <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:gap-3">
            <span className="text-[14px] font-extrabold tracking-[-0.2px]" style={{ color: 'var(--fg)' }}>
              PROTOCOLS.AI
            </span>
            <span
              className="font-mono text-[10px] uppercase tracking-[1.4px]"
              style={{ color: 'var(--fg-dim)' }}
            >
              built with peer-reviewed research · not medical advice
            </span>
          </div>
          <nav
            aria-label="Legal"
            className="flex gap-6 font-mono text-[11px] uppercase tracking-[1.4px]"
            style={{ color: 'var(--fg-dim)' }}
          >
            <a href="#" className="inline-flex min-h-[44px] items-center">method</a>
            <a href="#" className="inline-flex min-h-[44px] items-center">sources</a>
            <a href="#" className="inline-flex min-h-[44px] items-center">privacy</a>
          </nav>
        </div>
      </footer>

      <BottomTabBar />
    </main>
    </>
  );
}
