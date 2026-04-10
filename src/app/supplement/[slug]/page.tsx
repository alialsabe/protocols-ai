"use client";
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import * as Tabs from '@radix-ui/react-tabs';
import { ArrowLeft, Pill, ExternalLink } from 'lucide-react';
import { T, tagColors, getSupplementImage } from '@/lib/design-tokens';
import { Card, Button, SectionLabel } from '@/components/shared/Primitives';
import type {
  ProtocolReport, ClinicalStudy, StudyCategoryCount,
  MedicineInteraction, ScienceFinding, CompanionSuggestion,
} from '@/lib/protocol-types';

export default function SupplementReportPage() {
  const params = useParams();
  const router = useRouter();
  const slug = decodeURIComponent(params.slug as string);

  const [report, setReport] = React.useState<ProtocolReport | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [runtimeMs, setRuntimeMs] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    fetch('/api/protocols', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: slug }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (data?.status === 'not_found' && data?.suggestions?.length) {
            setError(`No data for "${slug}". Try: ${data.suggestions.slice(0, 3).join(', ')}`);
            return;
          }
          throw new Error(data?.message ?? data?.error ?? 'Unable to analyze.');
        }
        setReport(data.report);
        setRuntimeMs(data.runtimeMs ?? null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to analyze.'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 px-4">
        <div
          className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: `${T.accent} transparent transparent transparent` }}
        />
        <p className="text-sm" style={{ color: T.textDim }}>Analyzing {slug}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-base mb-6" style={{ color: T.rose }}>{error}</p>
        <Button variant="default" onClick={() => router.push('/')}>
          Back to search
        </Button>
      </div>
    );
  }

  if (!report) return null;

  const imgSrc = getSupplementImage(report.name ?? report.subject ?? '');

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-medium mb-6 transition-colors duration-200"
        style={{ color: T.textDim }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <SectionLabel>Supplement Report</SectionLabel>

      {/* Header card */}
      <div
        className="relative rounded-2xl p-6 md:p-8 mb-6 overflow-hidden"
        style={{ background: T.card, border: `1px solid ${T.border}` }}
      >
        {/* Blended product image */}
        {imgSrc && (
          <div
            className="absolute pointer-events-none select-none hidden md:block"
            style={{
              right: -30, top: -10, width: 300, height: 300, zIndex: 0,
              WebkitMaskImage: 'radial-gradient(ellipse 65% 65% at 60% 45%, black 15%, transparent 70%)',
              maskImage: 'radial-gradient(ellipse 65% 65% at 60% 45%, black 15%, transparent 70%)',
              animation: 'proto-float 10s ease-in-out infinite',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgSrc}
              alt=""
              className="w-full h-full object-contain"
              style={{ opacity: 0.2, mixBlendMode: 'luminosity', filter: 'saturate(0.4) brightness(0.65)' }}
              draggable={false}
            />
          </div>
        )}

        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-1" style={{ color: T.text }}>
            {report.name ?? report.subject}
          </h1>
          {report.baseCompound && (
            <p className="text-[11px] mb-4" style={{ color: T.textDim }}>
              Base compound: <span style={{ color: T.textMuted }}>{report.baseCompound}</span>
              {report.specificForm && <> — Form: <span style={{ color: T.textMuted }}>{report.specificForm}</span></>}
            </p>
          )}

          {/* Type + tag badges */}
          <div className="flex flex-wrap gap-2">
            {(report.supplementTypes ?? []).map((t) => (
              <span
                key={t}
                className="text-[10px] font-bold px-2.5 py-1 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`, color: T.textMuted }}
              >
                {t}
              </span>
            ))}
            {(report.tags ?? []).slice(0, 4).map((t) => {
              const s = tagColors(t.tag, t.tagType);
              return (
                <span
                  key={t.tag}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg"
                  style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}
                >
                  {t.tag}
                </span>
              );
            })}
          </div>

          {runtimeMs !== null && (
            <p className="text-[11px] mt-4 font-mono" style={{ color: T.textFaint }}>
              Analyzed in {runtimeMs.toFixed(0)}ms
            </p>
          )}
        </div>
      </div>

      {/* Content: sidebar + tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Companion stack sidebar */}
        <div className="space-y-4">
          <Card className="p-5" hover={false}>
            <h3 className="text-sm font-bold mb-1" style={{ color: T.text }}>Stack Partners</h3>
            <p className="text-[11px] mb-4" style={{ color: T.textDim }}>Commonly taken together.</p>
            <div className="space-y-2">
              {(report.companionSuggestions ?? []).map((item: CompanionSuggestion) => (
                <button
                  key={item.supplement}
                  onClick={() => router.push(`/supplement/${encodeURIComponent(item.supplement)}`)}
                  className="w-full text-left p-3 rounded-xl transition-all duration-200 hover:border-[rgba(6,214,160,0.2)]"
                  style={{ border: `1px solid ${T.border}`, background: T.surface }}
                >
                  <p className="text-sm font-semibold" style={{ color: T.text }}>{item.supplement}</p>
                  <p className="text-[11px] mt-1" style={{ color: T.textDim }}>{item.why}</p>
                </button>
              ))}
              {!(report.companionSuggestions ?? []).length && (
                <p className="text-xs" style={{ color: T.textDim }}>No pairings mapped yet.</p>
              )}
            </div>
          </Card>

          {/* Dosage summary card */}
          {report.dosage && (
            <Card className="p-5" hover={false}>
              <h3 className="text-sm font-bold mb-3" style={{ color: T.text }}>Dosage</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span style={{ color: T.textDim }}>Maintenance</span>
                  <span className="text-right font-medium" style={{ color: T.text }}>{report.dosage.maintenance}</span>
                </div>
                {report.dosage.loading && (
                  <div className="flex justify-between text-xs">
                    <span style={{ color: T.textDim }}>Loading</span>
                    <span className="text-right font-medium" style={{ color: T.text }}>{report.dosage.loading}</span>
                  </div>
                )}
                {report.dosage.formula && (
                  <div className="text-xs font-mono mt-2 p-2 rounded-lg" style={{ background: T.surface, color: T.accent }}>
                    {report.dosage.formula}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Where to buy */}
          {report.commerce && (
            <Card className="p-5" hover={false}>
              <h3 className="text-sm font-bold mb-3" style={{ color: T.text }}>Where to Buy</h3>
              <div className="p-3 rounded-xl" style={{ border: `1px solid ${T.border}`, background: T.surface }}>
                <p className="text-sm font-semibold" style={{ color: T.text }}>{report.commerce.product}</p>
                <p className="text-xs mt-1" style={{ color: T.textDim }}>
                  {report.commerce.retailer}{report.commerce.price ? ` — ${report.commerce.price}` : ''}
                </p>
                <a
                  href={report.commerce.affiliateLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs mt-2 font-medium"
                  style={{ color: T.accent }}
                >
                  View <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </Card>
          )}
        </div>

        {/* Main tabs */}
        <Tabs.Root defaultValue="science" className="flex flex-col w-full min-w-0">
          <Tabs.List
            className="flex gap-1 p-1 rounded-xl mb-4 overflow-x-auto"
            style={{ background: T.elevated }}
          >
            {[
              { value: 'science', label: 'Science' },
              { value: 'clinical', label: 'Clinical Studies' },
              { value: 'interactions', label: 'Interactions' },
              { value: 'sentiment', label: 'Sentiment' },
            ].map((tab) => (
              <Tabs.Trigger
                key={tab.value}
                value={tab.value}
                className="px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 shrink-0 data-[state=active]:bg-[rgba(6,214,160,0.08)] data-[state=active]:text-[#06d6a0]"
                style={{ color: T.textDim }}
              >
                {tab.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {/* Science tab */}
          <Tabs.Content value="science" className="space-y-4">
            <Card className="p-6" hover={false}>
              <p className="text-sm leading-relaxed" style={{ color: T.textMuted }}>
                {report.science?.summary ?? report.summary}
              </p>
              <div className="mt-4 space-y-3">
                {(report.science?.findings ?? []).map((f: ScienceFinding) => (
                  <div
                    key={f.title ?? f.claim}
                    className="p-3 rounded-xl"
                    style={{ border: `1px solid ${T.border}`, background: T.surface }}
                  >
                    <p className="text-sm font-semibold" style={{ color: T.text }}>{f.title ?? f.claim}</p>
                    <p className="text-xs mt-1" style={{ color: T.textDim }}>{f.detail ?? f.context}</p>
                    {(f.citation ?? f.publishedDate ?? f.link) && (
                      <p className="text-[10px] mt-1" style={{ color: T.textFaint }}>
                        {f.citation ? `${f.citation} · ` : ''}
                        {f.publishedDate ? `Published: ${f.publishedDate} · ` : ''}
                        {f.link && (
                          <a className="underline" href={f.link} target="_blank" rel="noreferrer" style={{ color: T.accent }}>
                            Study Link
                          </a>
                        )}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </Tabs.Content>

          {/* Clinical studies tab */}
          <Tabs.Content value="clinical" className="space-y-4">
            {(report.clinicalStudies ?? []).length > 0 ? (
              <div className="space-y-3">
                {/* Category counts */}
                {(report.clinicalStudyCategoryCounts ?? []).length > 0 && (
                  <Card className="p-4" hover={false}>
                    <div className="flex flex-wrap gap-3">
                      {(report.clinicalStudyCategoryCounts ?? [])
                        .sort((a: StudyCategoryCount, b: StudyCategoryCount) => b.count - a.count)
                        .map((cat: StudyCategoryCount) => (
                          <div key={cat.category} className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: T.textDim }}>{cat.category}</span>
                            <span className="text-xs font-bold" style={{ color: T.purple }}>{cat.count}</span>
                          </div>
                        ))}
                    </div>
                  </Card>
                )}
                {(report.clinicalStudies ?? []).map((study: ClinicalStudy) => (
                  <Card key={study.id} className="p-4" hover={false}>
                    <p className="text-sm font-semibold" style={{ color: T.text }}>{study.title}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                        style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', color: T.purple }}
                      >
                        {study.category}
                      </span>
                      {study.studyType && <span className="text-[10px]" style={{ color: T.textDim }}>{study.studyType}</span>}
                      {study.year && <span className="text-[10px]" style={{ color: T.textDim }}>{study.year}</span>}
                      {study.sampleSize && <span className="text-[10px]" style={{ color: T.textDim }}>n={study.sampleSize}</span>}
                    </div>
                    {study.outcome && <p className="text-xs mt-2" style={{ color: T.textDim }}>{study.outcome}</p>}
                    {(study.url ?? study.pmid) && (
                      <a
                        href={study.url ?? `https://pubmed.ncbi.nlm.nih.gov/${study.pmid}/`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs mt-2"
                        style={{ color: T.accent }}
                      >
                        {study.pmid ? `PMID: ${study.pmid}` : 'Link'} <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6" hover={false}>
                <p className="text-sm" style={{ color: T.textDim }}>No clinical studies indexed yet.</p>
              </Card>
            )}
          </Tabs.Content>

          {/* Interactions tab */}
          <Tabs.Content value="interactions" className="space-y-4">
            {/* Medicine interactions */}
            {(report.medicineInteractions ?? []).length > 0 ? (
              <Card className="p-5" style={{ borderColor: 'rgba(251,191,36,0.15)', background: 'rgba(251,191,36,0.03)' }} hover={false}>
                <h4 className="flex items-center gap-2 text-sm font-bold mb-3" style={{ color: T.amber }}>
                  <Pill className="w-4 h-4" /> Medicine Interactions
                </h4>
                <div className="space-y-2">
                  {(report.medicineInteractions ?? []).map((m: MedicineInteraction) => (
                    <div
                      key={`${m.medicineName}-${m.severity}`}
                      className="text-xs p-3 rounded-xl"
                      style={{ border: `1px solid ${T.border}`, background: 'rgba(0,0,0,0.2)', color: T.textMuted }}
                    >
                      <p>
                        <strong style={{ color: T.text }}>{m.medicineName}</strong>
                        {' — '}<span className="uppercase" style={{ color: T.amber }}>{m.severity}</span>
                      </p>
                      <p className="mt-1" style={{ color: T.textDim }}>{m.mechanism}</p>
                      <p className="mt-1" style={{ color: T.textFaint }}>{m.recommendation}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <Card className="p-6" hover={false}>
                <p className="text-sm" style={{ color: T.textDim }}>No medicine interactions indexed.</p>
              </Card>
            )}

            {/* Supplement conflicts */}
            {(report.conflicts ?? []).length > 0 && (
              <Card className="p-5" hover={false}>
                <h4 className="text-sm font-bold mb-3" style={{ color: T.amber }}>Supplement Conflicts</h4>
                <div className="space-y-2">
                  {(report.conflicts ?? []).map((c, i) => (
                    <div key={i} className="p-3 rounded-xl" style={{ border: `1px solid rgba(251,191,36,0.15)`, background: 'rgba(251,191,36,0.04)' }}>
                      <p className="text-sm font-semibold" style={{ color: T.text }}>
                        {c.supplementA} + {c.supplementB}
                        <span className="ml-2 text-[10px] uppercase" style={{ color: T.amber }}>{c.severity}</span>
                      </p>
                      <p className="text-xs mt-1" style={{ color: T.textDim }}>{c.mechanism}</p>
                      {c.minSpacingHours && <p className="text-xs mt-1" style={{ color: T.amber }}>Space by {c.minSpacingHours}h+</p>}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </Tabs.Content>

          {/* Sentiment tab */}
          <Tabs.Content value="sentiment" className="space-y-4">
            <Card className="p-6" hover={false}>
              {report.sentiment ? (
                <div className="flex gap-6 flex-wrap">
                  <div>
                    <p className="text-xs mb-1" style={{ color: T.textDim }}>Positive</p>
                    <p className="text-2xl font-bold" style={{ color: T.accent }}>
                      {Math.round((report.sentiment.positive ?? 0) * 100)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs mb-1" style={{ color: T.textDim }}>Neutral</p>
                    <p className="text-2xl font-bold" style={{ color: T.textMuted }}>
                      {Math.round((report.sentiment.neutral ?? 0) * 100)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs mb-1" style={{ color: T.textDim }}>Negative</p>
                    <p className="text-2xl font-bold" style={{ color: T.rose }}>
                      {Math.round((report.sentiment.negative ?? 0) * 100)}%
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm" style={{ color: T.textDim }}>No sentiment data available.</p>
              )}
            </Card>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
}
