import { TopBar } from '@/components/v2/TopBar';
import { BottomTabBar } from '@/components/v2/BottomTabBar';
import { ReportHeader } from '@/components/research/ReportHeader';
import { ScoreStrip } from '@/components/research/ScoreStrip';
import { ReadingLevelOverview } from '@/components/research/ReadingLevelOverview';
import { EvidenceSection } from '@/components/research/EvidenceSection';
import { DosageSection } from '@/components/research/DosageSection';
import { InteractionsSection } from '@/components/research/InteractionsSection';
import { StackSection } from '@/components/research/StackSection';
import { ExtractionSection } from '@/components/research/ExtractionSection';
import { VideosSection } from '@/components/research/VideosSection';
import { EmptyReport } from '@/components/research/EmptyReport';
import { lookupSupplement } from '@/lib/supplement-lookup';
import Link from 'next/link';

export default async function ResearchQueryPage({
  params,
}: {
  params: Promise<{ query: string }>;
}) {
  const { query } = await params;
  const q = decodeURIComponent(query);

  const report = await lookupSupplement(q);

  if (!report) {
    return (
      <main className="proto-grid relative min-h-screen overflow-x-hidden pb-20 md:pb-0">
        <TopBar />
        <section className="mx-auto max-w-[1200px] px-5 pt-16 pb-24 md:px-10 md:pt-20 lg:px-16 lg:pt-24">
          <span
            className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
            style={{ color: 'var(--accent)' }}
          >
            NOT FOUND
          </span>
          <h1
            className="mt-5 text-[36px] font-extrabold leading-[1.05] tracking-[-1px]"
            style={{ color: 'var(--fg)' }}
          >
            {q}
          </h1>
          <p
            className="mt-6 max-w-[640px] font-mono text-[13px] leading-[20px]"
            style={{ color: 'var(--fg-muted)' }}
          >
            No data found for this compound. Try a different spelling or search for a related supplement.
          </p>
          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-[10px] px-5 text-[13px] font-bold"
              style={{ background: 'var(--accent)', color: 'var(--bg)' }}
            >
              &larr; back to home
            </Link>
          </div>
        </section>
        <BottomTabBar />
      </main>
    );
  }

  const hasData = Boolean(report.science || report.dosage || report.medicineInteractions);

  return (
    <main className="proto-grid relative min-h-screen overflow-x-hidden pb-20 md:pb-0">
      <TopBar />

      <section className="mx-auto max-w-[1200px] px-5 pb-24 md:px-10 lg:px-16">
        <ReportHeader report={report} slug={q} />
        <ScoreStrip report={report} slug={q} />

        {!hasData && (
          <div className="mt-10">
            <EmptyReport report={report} />
          </div>
        )}

        {/*
          Two-column layout on md+: main content left, stack sidebar right.
          On mobile everything stacks — the sidebar appears between Overview
          and Dosage via the `order-*` Tailwind classes below.
        */}
        <div className="mt-12 grid gap-12 md:mt-16 md:grid-cols-[minmax(0,1fr)_320px] md:gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Main column */}
          <div className="flex min-w-0 flex-col gap-14">
            <ReadingLevelOverview report={report} />
            <DosageSection report={report} />
            <EvidenceSection report={report} />
            <ExtractionSection report={report} />
            {/* Interactions intentionally below the fold — see council verdict */}
            <InteractionsSection report={report} />
            <VideosSection slug={q} />
          </div>

          {/* Stack sidebar */}
          <aside className="flex flex-col gap-6 md:sticky md:top-24 md:self-start">
            <StackSection report={report} currentSlug={q} />
          </aside>
        </div>
      </section>

      <BottomTabBar />
    </main>
  );
}
