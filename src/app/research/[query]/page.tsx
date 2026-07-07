import { ReadingLevelOverview } from '@/components/research/ReadingLevelOverview';
import { EvidenceSection } from '@/components/research/EvidenceSection';
import { DosageSection } from '@/components/research/DosageSection';
import { InteractionsSection } from '@/components/research/InteractionsSection';
import { StackSection } from '@/components/research/StackSection';
import { ExtractionSection } from '@/components/research/ExtractionSection';
import { VideosSection } from '@/components/research/VideosSection';
import { TopVideosSection } from '@/components/research/TopVideosSection';
import { BuyOptionsSection } from '@/components/research/BuyOptionsSection';
import { AddToRoutineButton } from '@/components/research/AddToRoutineButton';
import { lookupSupplement } from '@/lib/supplement-lookup';
import Link from 'next/link';

// ISR: each supplement/peptide page renders once then serves cached HTML,
// keeping repeat loads well under 700ms. Revalidates hourly.
export const revalidate = 3600;

function letterGrade(score: number): { tier: 'a' | 'b' | 'c' | 'neutral'; label: string } {
  if (score >= 0.85) return { tier: 'a', label: score >= 0.92 ? 'A+' : 'A' };
  if (score >= 0.65) return { tier: 'b', label: score >= 0.78 ? 'B+' : 'B' };
  if (score >= 0.35) return { tier: 'c', label: 'C' };
  return { tier: 'neutral', label: '—' };
}

export default async function ResearchQueryPage({
  params,
}: {
  params: Promise<{ query: string }>;
}) {
  const { query } = await params;
  const q = decodeURIComponent(query);

  const report = await lookupSupplement(q);

  /* ── Not found ─────────────���────────────────────────────── */
  if (!report) {
    return (
      <div className="page" style={{ paddingTop: 48 }}>
        <span className="footnote" style={{ letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--accent)' }}>
          NOT FOUND
        </span>
        <h1 style={{ margin: '8px 0 16px', fontSize: 40, fontWeight: 600, letterSpacing: '-1px', color: 'var(--ink)' }}>
          {q}
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ink-3)', maxWidth: '54ch', lineHeight: 1.6 }}>
          No data found for this compound. Try a different spelling or search for a related supplement.
        </p>
        <div style={{ marginTop: 24 }}>
          <Link href="/" className="btn">← Back to browse</Link>
        </div>
      </div>
    );
  }

  const name      = report.name ?? q;
  const category  = report.supplementTypes?.[0] ?? report.baseCompound ?? 'Supplement';
  const aliases   = (() => {
    const raw = report.subject ?? report.specificForm ?? '';
    return raw && raw !== name ? [raw] : [];
  })();

  const evScore   = report.clinicalEvidence?.score ?? 0;
  const evGrade   = letterGrade(evScore);

  const studyCount     = report.science?.sourceCount ?? report.clinicalStudies?.length ?? 0;
  const dose           = report.dosage?.maintenance ?? '—';
  const doseLoading    = report.dosage?.loading;
  // Compact single-sentence "how it's made" pulled from per-supplement DB row
  // when available; otherwise the ExtractionSection's category fallback.
  const productionBlurb = report.production?.method?.split(/(?<=[.?!])\s+/)[0]
    ?? report.production?.source
    ?? null;

  return (
    <div className="page">
      {/* Breadcrumb */}
      <div style={{ padding: '28px 0 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Link href="/" className="footnote" style={{ color: 'var(--ink-4)' }}>Browse</Link>
        <span className="footnote" style={{ color: 'var(--ink-5)' }}>/</span>
        <span className="footnote" style={{ color: 'var(--ink-3)' }}>{category}</span>
      </div>

      {/* Abstract + key stats — two-column */}
      <div
        className="research-hero-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1.4fr) minmax(280px,1fr)',
          gap: 48,
          padding: '12px 0 48px',
          borderBottom: '1px solid var(--rule)',
        }}
      >
        {/* ── Left: title + reading-level overview ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <span className="tag" data-cat={category}>{category}</span>
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(36px, 4.5vw, 56px)',
              lineHeight: 1.04,
              letterSpacing: '-1.4px',
              fontWeight: 500,
              color: 'var(--ink)',
            }}
          >
            {name}
          </h1>

          {aliases.length > 0 && (
            <p className="footnote" style={{ marginTop: 10, fontSize: 13, color: 'var(--ink-4)' }}>
              Also known as:{' '}
              <span style={{ color: 'var(--ink-3)' }}>{aliases.join(' · ')}</span>
            </p>
          )}

          <div
            style={{
              marginTop: 28,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 20,
              flexWrap: 'wrap',
            }}
          >
            <AddToRoutineButton slug={q} />
          </div>

          {/* Reading-level summary */}
          <div style={{ marginTop: 28 }}>
            <ReadingLevelOverview report={report} />
          </div>
        </div>

        {/* ── Right: At a glance + Buy options ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            alignSelf: 'start',
            position: 'sticky',
            top: 88,
          }}
        >
          <div
            style={{
              background: 'var(--paper-2)',
              border: '1px solid var(--rule)',
              padding: '24px 28px',
              borderRadius: 4,
            }}
          >
            <span className="footnote" style={{ letterSpacing: '1.4px', textTransform: 'uppercase' }}>
              At a glance
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 18 }}>
              {/* Dose */}
              <div>
                <span className="footnote" style={{ letterSpacing: '1.2px', textTransform: 'uppercase' }}>
                  Typical dose
                </span>
                <div
                  className="footnote"
                  style={{
                    fontSize: 22,
                    fontWeight: 500,
                    color: 'var(--ink)',
                    marginTop: 4,
                    letterSpacing: '-0.2px',
                    fontFamily: 'var(--font-jetbrains-mono, var(--mono))',
                  }}
                >
                  {dose}
                </div>
                {doseLoading && (
                  <div className="footnote" style={{ marginTop: 4, fontSize: 11 }}>
                    Loading: {doseLoading}
                  </div>
                )}
              </div>

              {/* Evidence */}
              <div>
                <span className="footnote" style={{ letterSpacing: '1.2px', textTransform: 'uppercase' }}>
                  Evidence
                </span>
                <div style={{ marginTop: 6 }}>
                  <span className="grade grade--lg" data-tier={evGrade.tier}>
                    {evGrade.label}
                  </span>
                </div>
              </div>

              {/* Studies indexed */}
              <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 14 }}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span className="footnote">Studies indexed</span>
                    <span className="footnote" style={{ color: 'var(--ink-2)' }}>{studyCount}</span>
                  </div>
                  <div className="bar-scale">
                    <div className="track">
                      <div className="fill" style={{ width: `${Math.min((studyCount / 10) * 100, 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* How it's made */}
              <div style={{ borderTop: '1px solid var(--rule-soft)', paddingTop: 14 }}>
                <span className="footnote" style={{ letterSpacing: '1.2px', textTransform: 'uppercase' }}>
                  How it's made
                </span>
                <p
                  style={{
                    fontSize: 12,
                    lineHeight: 1.55,
                    color: 'var(--ink-2)',
                    marginTop: 6,
                    marginBottom: 0,
                  }}
                >
                  {productionBlurb ?? 'Production details below.'}
                </p>
              </div>
            </div>
          </div>

          {/* Buy options panel — directly under At a glance */}
          <BuyOptionsSection report={report} supplementId={report.id} slug={q} />
        </div>
      </div>

      {/* ── Main sections below the fold ── */}
      <div
        className="research-body-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) 320px',
          gap: 48,
          marginTop: 48,
        }}
      >
        {/* Main column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 56, minWidth: 0 }}>
          <DosageSection report={report} />
          <EvidenceSection report={report} />
          <ExtractionSection report={report} />
          <InteractionsSection report={report} />
          <VideosSection slug={q} />
        </div>

        {/* Sidebar — stacked companions + stack score */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 24, alignSelf: 'start', position: 'sticky', top: 88 }}>
          <StackSection report={report} currentSlug={q} />
        </aside>
      </div>

      {/* Top videos — the very bottom of the profile */}
      <TopVideosSection slug={q} />

      {/* Disclaimer */}
      <div style={{ padding: '60px 0 40px' }}>
        <p className="footnote" style={{ fontSize: 12, lineHeight: 1.6, maxWidth: 640 }}>
          This page is a reference summary, not a prescription. Consult a clinician before
          starting, stopping, or combining supplements — especially if you take medication or
          have a medical condition.
        </p>
      </div>
    </div>
  );
}
