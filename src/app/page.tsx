import { sql } from 'drizzle-orm';
import { clinicalStudies, supplements as supplementsTable, supplementScience } from '@/lib/schema-postgres';
import { TopBar } from '@/components/v2/TopBar';
import { BottomTabBar } from '@/components/v2/BottomTabBar';
import { HomeSearch } from '@/components/v2/HomeSearch';
import { Ticker } from '@/components/v2/Ticker';
import { MostPopularFilterable } from '@/components/v2/trending/MostPopularFilterable';
import { CountUp } from '@/components/ui/CountUp';
import { Reveal } from '@/components/ui/Reveal';
import { db } from '@/lib/drizzle';
import { unstable_cache } from 'next/cache';

export const dynamic = 'force-dynamic';

const loadLedgerCounts = unstable_cache(
  async () => {
    try {
      const [r1, r2, r3] = await Promise.all([
        db.select({ c: sql<number>`count(*)::int` }).from(supplementsTable).where(sql`status = 'published'`),
        db.select({ c: sql<number>`count(*)::int` }).from(clinicalStudies),
        db.select({ c: sql<number>`count(*)::int` }).from(supplementScience),
      ]);
      return {
        compounds: Number(r1[0]?.c ?? 0),
        studies: Number(r2[0]?.c ?? 0),
        deepData: Number(r3[0]?.c ?? 0),
      };
    } catch (err) {
      console.error('[home/ledger] count query failed', err);
      return { compounds: 0, studies: 0, deepData: 0 };
    }
  },
  ['ledger-counts'],
  { revalidate: 3600 },
);

const nf = new Intl.NumberFormat('en-US');

const CAPABILITIES = [
  {
    n: '01 / RESEARCH',
    title: 'Every claim sourced.',
    body: 'Each supplement page links to peer-reviewed studies with PMIDs and quality grades, not affiliate-driven copy.',
    link: '→ see an example report',
    href: '/research/creatine-monohydrate',
  },
  {
    n: '02 / PERSONAL',
    title: 'Your daily routine, auto-built.',
    body: "Add your supplements and get a conflict-resolved daily schedule — morning, midday, evening, bedtime blocks derived from each compound's pharmacokinetics and timing rules.",
    link: '→ build your routine',
    href: '/stack',
  },
  {
    n: '03 / SAFE',
    title: 'Conflicts surfaced first.',
    body: 'Medication and supplement interactions are flagged with severity and primary source before any recommendation.',
    link: '→ compare interactions',
    href: '/compare',
  },
];

export default async function HomePage() {
  const counts = await loadLedgerCounts();
  const LEDGER = [
    { label: 'COMPOUNDS INDEXED', value: counts.compounds },
    { label: 'CLINICAL STUDIES',  value: counts.studies },
    { label: 'DEEP DATA',         value: counts.deepData },
  ];
  return (
    <>
      {/* Background layers — fixed, GPU-composited, behind all page content */}
      <div className="proto-bg-noise" aria-hidden="true" />
      <div className="proto-bg-bloom" aria-hidden="true" />
      <div className="proto-bg-vignette" aria-hidden="true" />

    <main className="proto-grid relative min-h-screen overflow-x-hidden pb-20 md:pb-0" style={{ zIndex: 1 }}>
      <TopBar />

      {/* Hero: search first */}
      <section className="mx-auto max-w-[1200px] px-5 pt-12 pb-8 md:px-10 md:pt-20 md:pb-12 lg:px-16">
        <h1
          className="max-w-[720px] text-[36px] font-extrabold leading-[1.05] tracking-[-1px] md:text-[56px]"
          style={{ color: 'var(--fg)' }}
        >
          Supplement research.<br />
          <span style={{ color: 'var(--accent)' }}>No marketing copy.</span>
        </h1>
        <p
          className="mt-4 max-w-[540px] text-[15px] leading-[24px]"
          style={{ color: 'var(--fg-muted)' }}
        >
          {nf.format(counts.compounds)} compounds · {nf.format(counts.studies)} clinical studies · conflict-resolved daily routines
        </p>
        <div className="mt-8">
          <HomeSearch />
        </div>
      </section>

      {/* Most Popular */}
      <section
        aria-labelledby="popular-heading"
        className="mx-auto max-w-[1200px] px-5 md:px-10 lg:px-16"
      >
        <h2 id="popular-heading" className="sr-only">
          Most popular supplements
        </h2>
        <Reveal>
          <MostPopularFilterable />
        </Reveal>
      </section>

      {/* Live research feed */}
      <section className="mx-auto max-w-[1200px] md:px-10 lg:px-16">
        <Ticker />
      </section>

      {/* Capability row */}
      <section className="mx-auto max-w-[1200px] px-5 py-16 md:px-10 md:py-20 lg:px-16">
        <Reveal>
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
                  href={c.href}
                >
                  {c.link}
                </a>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Research ledger */}
      <section
        className="mx-auto max-w-[1200px] px-5 md:px-10 lg:px-16"
        style={{ borderTop: '1px solid var(--hair)' }}
      >
        <Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3">
            {LEDGER.map((cell, i) => (
              <div
                key={cell.label}
                className={`flex flex-col gap-1 py-5 md:px-6 ${
                  i > 0 ? 'border-t md:border-t-0 md:border-l' : ''
                }`}
                style={{ borderColor: 'var(--hair)' }}
              >
                <span
                  className="font-mono text-[10px] font-bold uppercase tracking-[1.4px]"
                  style={{ color: 'var(--fg-dim)' }}
                >
                  {cell.label}
                </span>
                <CountUp
                  value={cell.value}
                  className="font-mono text-[18px]"
                  style={{ color: 'var(--fg)' }}
                />
              </div>
            ))}
          </div>
        </Reveal>
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
