import { TopBar } from '@/components/v2/TopBar';
import { BottomTabBar } from '@/components/v2/BottomTabBar';
import { ReportHeader } from '@/components/research/ReportHeader';
import { ScoreStrip } from '@/components/research/ScoreStrip';
import { OverviewSection } from '@/components/research/OverviewSection';
import { EvidenceSection } from '@/components/research/EvidenceSection';
import { DosageSection } from '@/components/research/DosageSection';
import { InteractionsSection } from '@/components/research/InteractionsSection';
import { StackSection } from '@/components/research/StackSection';
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

        <div className="mt-16 flex flex-col gap-16">
          <OverviewSection report={report} />
          <EvidenceSection report={report} />
          <DosageSection report={report} />
          <InteractionsSection report={report} />
          <StackSection report={report} currentSlug={q} />
          <VideosSection slug={q} />
        </div>
      </section>

      <BottomTabBar />
    </main>
  );
}
