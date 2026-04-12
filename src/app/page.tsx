import Link from 'next/link';
import { TopBar } from '@/components/v2/TopBar';
import { CommandBar } from '@/components/v2/CommandBar';
import { IntakeStrip } from '@/components/v2/IntakeStrip';
import { Ticker } from '@/components/v2/Ticker';

const LEDGER = [
  { label: 'COMPOUNDS INDEXED', value: '279' },
  { label: 'STUDIES',           value: '4,821' },
  { label: 'CLINICAL GUIDELINES', value: '12' },
  { label: 'LAST SYNC',         value: '04:12Z' },
];

const SUGGESTIONS = ['ashwagandha', 'magnesium glycinate', 'creatine', 'omega-3', 'berberine', 'nmn'];

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
    <main className="proto-grid relative min-h-screen">
      <TopBar />

      {/* Research ledger */}
      <section
        className="mx-auto max-w-[1200px] px-6 md:px-10 lg:px-16"
        style={{ borderBottom: '1px solid var(--hair)' }}
      >
        <div className="grid grid-cols-2 gap-px md:grid-cols-4">
          {LEDGER.map((cell, i) => (
            <div
              key={cell.label}
              className="flex flex-col gap-1 py-5"
              style={{
                borderLeft: i === 0 ? 'none' : '1px solid var(--hair)',
                paddingLeft: i === 0 ? 0 : 24,
              }}
            >
              <span
                className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
                style={{ color: 'var(--fg-dim)' }}
              >
                {cell.label}
              </span>
              <span className="font-mono text-[18px]" style={{ color: 'var(--fg)' }}>
                {cell.value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Hero */}
      <section className="mx-auto max-w-[1200px] px-6 pt-16 pb-12 md:px-10 lg:px-16 lg:pt-24">
        <span
          className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
          style={{ color: 'var(--accent)' }}
        >
          SUPPLEMENT INTELLIGENCE · v2
        </span>
        <h1
          className="mt-5 text-[40px] font-extrabold leading-[1.05] tracking-[-1.2px] md:text-[56px] md:leading-[60px]"
          style={{ color: 'var(--fg)' }}
        >
          Know exactly what's in your stack.
        </h1>
        <p
          className="mt-5 max-w-[640px] text-[16px] leading-[26px]"
          style={{ color: 'var(--fg-muted)' }}
        >
          279 compounds. 4,821 studies. Zero marketing copy.
        </p>

        <div className="mt-10">
          <CommandBar size="lg" />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <Link
              key={s}
              href={`/research/${encodeURIComponent(s)}`}
              className="rounded-md px-3 py-1.5 font-mono text-[12px] transition-colors hover:text-white"
              style={{
                border: '1px solid var(--hair)',
                color: 'var(--fg-muted)',
                background: 'transparent',
              }}
            >
              {s}
            </Link>
          ))}
        </div>
      </section>

      {/* Intake strip */}
      <section className="mx-auto max-w-[1200px] md:px-10 lg:px-16">
        <IntakeStrip />
      </section>

      {/* Live research feed */}
      <section className="mx-auto max-w-[1200px] md:px-10 lg:px-16">
        <Ticker />
      </section>

      {/* Capability row */}
      <section className="mx-auto max-w-[1200px] px-6 py-20 md:px-10 lg:px-16">
        <div className="grid gap-10 md:grid-cols-3 md:gap-0">
          {CAPABILITIES.map((c, i) => (
            <div
              key={c.n}
              className="flex flex-col gap-3 md:px-8"
              style={{
                borderLeft: i === 0 ? 'none' : '1px solid var(--hair)',
              }}
            >
              <span
                className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
                style={{ color: 'var(--fg-dim)' }}
              >
                {c.n}
              </span>
              <h3 className="text-[20px] font-extrabold tracking-[-0.4px]" style={{ color: 'var(--fg)' }}>
                {c.title}
              </h3>
              <p className="text-[14px] leading-[22px]" style={{ color: 'var(--fg-muted)' }}>
                {c.body}
              </p>
              <a
                className="mt-2 font-mono text-[12px] transition-colors hover:text-white"
                style={{ color: 'var(--accent)' }}
                href="#"
              >
                {c.link}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        role="contentinfo"
        className="mx-auto max-w-[1200px] px-6 py-10 md:px-10 lg:px-16"
        style={{ borderTop: '1px solid var(--hair)' }}
      >
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-baseline gap-3">
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
          <nav className="flex gap-5 font-mono text-[11px] uppercase tracking-[1.4px]" style={{ color: 'var(--fg-dim)' }}>
            <a href="#">method</a>
            <a href="#">sources</a>
            <a href="#">privacy</a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
