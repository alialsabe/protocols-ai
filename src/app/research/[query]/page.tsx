import Link from 'next/link';
import type { Metadata } from 'next';
import { TopBar } from '@/components/v2/TopBar';
import { CommandBar } from '@/components/v2/CommandBar';
import { lookupSupplement } from '@/lib/supplement-lookup';
import type { ProtocolReport } from '@/lib/protocol-types';
import { ReportHeader } from '@/components/research/ReportHeader';
import { ScoreStrip } from '@/components/research/ScoreStrip';
import { OverviewSection } from '@/components/research/OverviewSection';
import { EvidenceSection } from '@/components/research/EvidenceSection';
import { InteractionsSection } from '@/components/research/InteractionsSection';
import { DosageSection } from '@/components/research/DosageSection';
import { EmptyReport } from '@/components/research/EmptyReport';

interface ResearchPageProps {
  params: Promise<{ query: string }>;
}

export async function generateMetadata({ params }: ResearchPageProps): Promise<Metadata> {
  const { query } = await params;
  const decoded = decodeURIComponent(query);
  return {
    title: `${decoded} — research report · Protocols.ai`,
    description: `Evidence-graded science, dosage, and interaction data for ${decoded}.`,
  };
}

export default async function ResearchPage({ params }: ResearchPageProps) {
  const { query } = await params;
  const decoded = decodeURIComponent(query);

  let report: ProtocolReport | null = null;
  let errorMessage: string | null = null;
  try {
    report = await lookupSupplement(decoded);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : 'Unknown error.';
  }

  return (
    <main className="proto-grid relative min-h-screen">
      <TopBar />

      {/* Collapsed command bar row */}
      <section
        className="mx-auto max-w-[1200px] px-6 pt-6 md:px-10 lg:px-16"
        style={{ borderBottom: '1px solid var(--hair)' }}
      >
        <div className="pb-6">
          <CommandBar size="sm" defaultValue={decoded} />
        </div>
      </section>

      {/* Report body */}
      <section className="mx-auto max-w-[1200px] px-6 pb-24 md:px-10 lg:px-16">
        {errorMessage ? (
          <div className="mt-16">
            <ErrorState query={decoded} message={errorMessage} />
          </div>
        ) : !report ? (
          <div className="mt-16">
            <NotFoundState query={decoded} />
          </div>
        ) : (
          <>
            <ReportHeader report={report} />
            <ScoreStrip report={report} />
            <div className="mt-10 space-y-16">
              <OverviewSection report={report} />
              <EvidenceSection report={report} />
              <DosageSection report={report} />
              <InteractionsSection report={report} />
              {(!report.science?.findings?.length || !report.dosage) ? (
                <EmptyReport report={report} />
              ) : null}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function NotFoundState({ query }: { query: string }) {
  return (
    <div
      className="mx-auto max-w-xl rounded-[16px] p-10 text-center"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--hair)',
      }}
    >
      <span
        className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
        style={{ color: 'var(--accent)' }}
      >
        NO MATCH FOUND
      </span>
      <h1
        className="mt-4 text-[28px] font-extrabold tracking-[-0.6px]"
        style={{ color: 'var(--fg)' }}
      >
        “{query}” is not in the catalog
      </h1>
      <p className="mt-3 text-[14px] leading-[22px]" style={{ color: 'var(--fg-muted)' }}>
        Try a different spelling, or browse the suggestions below.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {['magnesium glycinate', 'creatine', 'vitamin d3', 'omega-3', 'ashwagandha'].map((s) => (
          <Link
            key={s}
            href={`/research/${encodeURIComponent(s)}`}
            className="rounded-md px-3 py-1.5 font-mono text-[12px] transition-colors hover:text-white"
            style={{
              border: '1px solid var(--hair)',
              color: 'var(--fg-muted)',
            }}
          >
            {s}
          </Link>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ query, message }: { query: string; message: string }) {
  return (
    <div
      className="mx-auto max-w-xl rounded-[16px] p-10"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--hair)',
      }}
    >
      <span
        className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
        style={{ color: '#fb7185' }}
      >
        LOOKUP FAILED
      </span>
      <h1
        className="mt-4 text-[24px] font-extrabold tracking-[-0.4px]"
        style={{ color: 'var(--fg)' }}
      >
        Couldn’t load the report for “{query}”
      </h1>
      <p className="mt-3 font-mono text-[12px]" style={{ color: 'var(--fg-dim)' }}>
        {message}
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex font-mono text-[12px]"
        style={{ color: 'var(--accent)' }}
      >
        ← back to home
      </Link>
    </div>
  );
}
