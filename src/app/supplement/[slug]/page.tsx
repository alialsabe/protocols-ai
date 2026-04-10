"use client";
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import * as Tabs from '@radix-ui/react-tabs';
import { ArrowLeft, ExternalLink, AlertTriangle, BookOpen } from 'lucide-react';
import { T, tagColors, getSupplementImage, categoryAccentColor } from '@/lib/design-tokens';
import { Button } from '@/components/shared/Primitives';
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
      <div className="flex flex-col items-center justify-center py-32 gap-4 px-4 pt-24">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: `${T.primary} transparent transparent transparent` }}
        />
        <p className="text-xs uppercase tracking-widest font-bold" style={{ color: T.textDim }}>
          Analyzing {slug}...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center pt-24">
        <p className="text-sm mb-6" style={{ color: T.error }}>{error}</p>
        <Button variant="default" onClick={() => router.push('/')}>
          Back to search
        </Button>
      </div>
    );
  }

  if (!report) return null;

  const name = report.name ?? report.subject ?? slug;
  const imgSrc = getSupplementImage(name);
  const accent = categoryAccentColor(report.supplementTypes ?? []);

  // Derive efficacy grade from study count
  const studyCount = (report.clinicalStudies ?? []).length;
  const grade = studyCount > 15 ? 'A' : studyCount > 8 ? 'B+' : studyCount > 3 ? 'B' : studyCount > 0 ? 'C+' : 'N/A';

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-8 py-8 md:py-12 pt-20 md:pt-24">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-xs font-medium mb-8 transition-colors duration-200 uppercase tracking-widest"
        style={{ color: T.textDim }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Hero header */}
      <section className="flex flex-col md:flex-row gap-8 md:gap-12 items-start mb-12">
        {/* Image (if available) */}
        {imgSrc && (
          <div
            className="w-full md:w-56 aspect-square overflow-hidden shrink-0 relative"
            style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 4 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgSrc}
              alt=""
              className="w-full h-full object-cover opacity-70"
              style={{ filter: 'saturate(0.7)' }}
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(11,19,38,0.8), transparent)' }}
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Type badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {(report.supplementTypes ?? []).slice(0, 2).map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase"
                style={{
                  background: T.primaryDim,
                  border: `1px solid ${T.borderAccent}`,
                  color: T.primary,
                  borderRadius: 2,
                }}
              >
                {t}
              </span>
            ))}
            {report.baseCompound && (
              <span
                className="text-[10px] font-medium tracking-widest uppercase px-2 py-0.5"
                style={{
                  border: `1px solid ${T.outlineVariant}`,
                  color: T.outline,
                  borderRadius: 2,
                }}
              >
                {report.baseCompound}
              </span>
            )}
          </div>

          <h1
            className="text-4xl md:text-6xl font-extrabold tracking-tight uppercase mb-3"
            style={{ color: T.text, letterSpacing: '-0.04em' }}
          >
            {name}
          </h1>

          <p className="text-sm max-w-2xl" style={{ color: T.textDim }}>
            {report.science?.summary ?? report.summary ?? 'Clinical analysis and protocol data.'}
          </p>
        </div>

        {/* Efficacy grade box */}
        <div
          className="shrink-0 p-6 flex flex-col items-center justify-center min-w-[140px]"
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${T.border}`,
            borderRadius: 4,
          }}
        >
          <span className="text-4xl font-black tracking-tighter" style={{ color: T.primary }}>
            {grade}
          </span>
          <span
            className="text-[10px] font-bold uppercase tracking-widest mt-1"
            style={{ color: T.outline }}
          >
            Efficacy Grade
          </span>
        </div>
      </section>

      {/* Tabs */}
      <Tabs.Root defaultValue="overview" className="flex flex-col w-full min-w-0">
        <Tabs.List
          className="flex gap-0 mb-8 overflow-x-auto"
          style={{ borderBottom: `1px solid ${T.border}` }}
        >
          {[
            { value: 'overview', label: 'Overview' },
            { value: 'clinical', label: 'Clinical Studies' },
            { value: 'interactions', label: 'Interactions' },
          ].map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className="px-6 md:px-8 py-4 text-xs font-bold uppercase tracking-widest transition-all duration-200 shrink-0 border-b-2 border-transparent data-[state=active]:border-[#adc6ff] data-[state=active]:text-[#adc6ff]"
              style={{ color: T.textDim }}
            >
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* Overview Tab */}
        <Tabs.Content value="overview">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Summary module */}
            <div
              className="md:col-span-8 p-8 relative overflow-hidden"
              style={{ background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)', border: `1px solid ${T.border}` }}
            >
              <h3 className="text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2" style={{ color: T.primary }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.primary }} />
                Clinical Summary
              </h3>
              <p className="text-base md:text-lg leading-relaxed font-medium mb-8" style={{ color: T.text }}>
                {report.science?.summary ?? report.summary ?? 'No summary available.'}
              </p>

              {/* Stats row */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-6" style={{ borderTop: `1px solid ${T.border}` }}>
                {report.dosage?.maintenance && (
                  <div>
                    <div className="text-xl font-bold" style={{ color: T.primary }}>{report.dosage.maintenance}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.outline }}>Target Dosage</div>
                  </div>
                )}
                <div>
                  <div className="text-xl font-bold" style={{ color: T.primary }}>{studyCount}+</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.outline }}>Clinical Studies</div>
                </div>
                {report.sentiment && (
                  <div>
                    <div className="text-xl font-bold" style={{ color: T.primary }}>
                      {Math.round((report.sentiment.positive ?? 0) * 100)}%
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.outline }}>Positive Sentiment</div>
                  </div>
                )}
              </div>
            </div>

            {/* Sentiment sidebar */}
            <div
              className="md:col-span-4 p-8"
              style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', border: `1px solid ${T.border}` }}
            >
              <h3 className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: T.secondary }}>
                Scientific Sentiment
              </h3>
              {report.sentiment ? (
                <div className="space-y-6">
                  {[
                    { label: 'Positive', value: report.sentiment.positive, verdict: report.sentiment.positive > 0.7 ? 'Very High' : report.sentiment.positive > 0.4 ? 'Moderate' : 'Low' },
                    { label: 'Neutral', value: report.sentiment.neutral, verdict: 'Baseline' },
                    { label: 'Negative', value: report.sentiment.negative, verdict: report.sentiment.negative < 0.1 ? 'Minimal' : 'Notable' },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2">
                        <span style={{ color: T.textDim }}>{s.label}</span>
                        <span style={{ color: T.primary }}>{s.verdict}</span>
                      </div>
                      <div className="h-1 w-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div
                          className="h-1"
                          style={{
                            width: `${Math.round((s.value ?? 0) * 100)}%`,
                            background: T.primary,
                            boxShadow: `0 0 8px rgba(173,198,255,0.4)`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs" style={{ color: T.textDim }}>No sentiment data available.</p>
              )}
            </div>

            {/* Findings grid */}
            <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-4 gap-6">
              {(report.science?.findings ?? []).slice(0, 4).map((f: ScienceFinding, i: number) => (
                <div
                  key={i}
                  className="p-6 transition-colors duration-200 hover:border-white/10"
                  style={{ background: 'rgba(15, 23, 42, 0.4)', border: `1px solid ${T.border}` }}
                >
                  <h4 className="text-sm font-bold mb-2" style={{ color: T.text }}>
                    {f.title ?? f.claim ?? 'Finding'}
                  </h4>
                  <p className="text-xs leading-relaxed" style={{ color: T.textDim }}>
                    {f.detail ?? f.context ?? ''}
                  </p>
                </div>
              ))}
            </div>

            {/* Companion stacks */}
            {(report.companionSuggestions ?? []).length > 0 && (
              <div className="md:col-span-12">
                <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: T.outline }}>
                  Stack Partners
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(report.companionSuggestions ?? []).map((c: CompanionSuggestion) => (
                    <button
                      key={c.supplement}
                      onClick={() => router.push(`/supplement/${encodeURIComponent(c.supplement)}`)}
                      className="p-4 text-left transition-colors duration-200 hover:border-white/10"
                      style={{ background: T.card, border: `1px solid ${T.border}` }}
                    >
                      <p className="text-sm font-bold mb-1" style={{ color: T.text }}>{c.supplement}</p>
                      <p className="text-[11px]" style={{ color: T.textDim }}>{c.why}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Dosage + Commerce */}
            {report.dosage && (
              <div className="md:col-span-6 p-6" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: T.primary }}>Dosage Protocol</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: T.textDim }}>Maintenance</span>
                    <span className="font-medium" style={{ color: T.text }}>{report.dosage.maintenance}</span>
                  </div>
                  {report.dosage.loading && (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: T.textDim }}>Loading</span>
                      <span className="font-medium" style={{ color: T.text }}>{report.dosage.loading}</span>
                    </div>
                  )}
                  {report.dosage.formula && (
                    <div className="text-xs font-mono mt-3 p-3 rounded-sm" style={{ background: 'rgba(255,255,255,0.03)', color: T.primary }}>
                      {report.dosage.formula}
                    </div>
                  )}
                </div>
              </div>
            )}

            {report.commerce && (
              <div className="md:col-span-6 p-6" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: T.primary }}>Where to Buy</h3>
                <p className="text-sm font-semibold" style={{ color: T.text }}>{report.commerce.product}</p>
                <p className="text-xs mt-1" style={{ color: T.textDim }}>
                  {report.commerce.retailer}{report.commerce.price ? ` — ${report.commerce.price}` : ''}
                </p>
                <a
                  href={report.commerce.affiliateLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs mt-3 font-medium"
                  style={{ color: T.primary }}
                >
                  View <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </Tabs.Content>

        {/* Clinical Studies Tab */}
        <Tabs.Content value="clinical">
          {(report.clinicalStudies ?? []).length > 0 ? (
            <div className="space-y-6">
              {/* Category counts */}
              {(report.clinicalStudyCategoryCounts ?? []).length > 0 && (
                <div className="flex flex-wrap gap-4 p-4" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                  {(report.clinicalStudyCategoryCounts ?? [])
                    .sort((a: StudyCategoryCount, b: StudyCategoryCount) => b.count - a.count)
                    .map((cat: StudyCategoryCount) => (
                      <div key={cat.category} className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: T.textDim }}>{cat.category}</span>
                        <span className="text-xs font-bold" style={{ color: T.secondary }}>{cat.count}</span>
                      </div>
                    ))}
                </div>
              )}

              {/* Studies table */}
              <div
                className="overflow-hidden"
                style={{ background: 'rgba(5, 7, 13, 0.4)', border: `1px solid ${T.border}` }}
              >
                <table className="w-full text-left">
                  <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <tr>
                      {['Study', 'Category', 'Type', 'Sample', 'Outcome'].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest"
                          style={{ color: T.outline }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(report.clinicalStudies ?? []).map((study: ClinicalStudy) => (
                      <tr
                        key={study.id}
                        className="transition-colors duration-150 hover:bg-white/[0.03]"
                        style={{ borderBottom: `1px solid ${T.border}` }}
                      >
                        <td className="px-6 py-5">
                          <div className="text-xs font-bold" style={{ color: T.text }}>{study.title}</div>
                          {study.year && <div className="text-[10px] mt-0.5" style={{ color: T.outline }}>{study.year}</div>}
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className="text-[10px] font-bold uppercase px-2 py-0.5"
                            style={{ background: 'rgba(192,193,255,0.1)', border: '1px solid rgba(192,193,255,0.2)', color: T.secondary, borderRadius: 2 }}
                          >
                            {study.category}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-xs" style={{ color: T.textDim }}>{study.studyType ?? '-'}</td>
                        <td className="px-6 py-5 text-xs" style={{ color: T.textDim }}>
                          {study.sampleSize ? `n=${study.sampleSize}` : '-'}
                        </td>
                        <td className="px-6 py-5 text-xs" style={{ color: T.textDim }}>
                          {study.outcome ?? '-'}
                          {(study.url ?? study.pmid) && (
                            <a
                              href={study.url ?? `https://pubmed.ncbi.nlm.nih.gov/${study.pmid}/`}
                              target="_blank"
                              rel="noreferrer"
                              className="ml-2 inline-flex items-center gap-1"
                              style={{ color: T.primary }}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-8" style={{ background: T.card, border: `1px solid ${T.border}` }}>
              <p className="text-sm" style={{ color: T.textDim }}>No clinical studies indexed yet.</p>
            </div>
          )}
        </Tabs.Content>

        {/* Interactions Tab */}
        <Tabs.Content value="interactions">
          <div className="space-y-6">
            {(report.medicineInteractions ?? []).length > 0 ? (
              <div
                className="p-6"
                style={{ background: 'rgba(255, 183, 134, 0.03)', border: `1px solid rgba(255, 183, 134, 0.15)` }}
              >
                <h4 className="flex items-center gap-2 text-sm font-bold mb-4" style={{ color: T.tertiary }}>
                  <AlertTriangle className="w-4 h-4" /> Medicine Interactions
                </h4>
                <div className="space-y-3">
                  {(report.medicineInteractions ?? []).map((m: MedicineInteraction) => (
                    <div
                      key={`${m.medicineName}-${m.severity}`}
                      className="text-xs p-4"
                      style={{ background: 'rgba(0,0,0,0.2)', border: `1px solid ${T.border}`, borderRadius: 4 }}
                    >
                      <p>
                        <strong style={{ color: T.text }}>{m.medicineName}</strong>
                        {' — '}<span className="uppercase font-bold" style={{ color: T.tertiary }}>{m.severity}</span>
                      </p>
                      <p className="mt-1" style={{ color: T.textDim }}>{m.mechanism}</p>
                      <p className="mt-1" style={{ color: T.outline }}>{m.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                <p className="text-sm" style={{ color: T.textDim }}>No medicine interactions indexed.</p>
              </div>
            )}

            {(report.conflicts ?? []).length > 0 && (
              <div className="p-6" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                <h4 className="text-sm font-bold mb-4" style={{ color: T.tertiary }}>Supplement Conflicts</h4>
                <div className="space-y-3">
                  {(report.conflicts ?? []).map((c, i) => (
                    <div
                      key={i}
                      className="p-4"
                      style={{ background: 'rgba(255,183,134,0.04)', border: `1px solid rgba(255,183,134,0.15)`, borderRadius: 4 }}
                    >
                      <p className="text-sm font-semibold" style={{ color: T.text }}>
                        {c.supplementA} + {c.supplementB}
                        <span className="ml-2 text-[10px] uppercase" style={{ color: T.tertiary }}>{c.severity}</span>
                      </p>
                      <p className="text-xs mt-1" style={{ color: T.textDim }}>{c.mechanism}</p>
                      {c.minSpacingHours && (
                        <p className="text-xs mt-1" style={{ color: T.tertiary }}>Space by {c.minSpacingHours}h+</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Tabs.Content>
      </Tabs.Root>

      {runtimeMs !== null && (
        <p className="text-[10px] mt-8 font-mono tracking-wide" style={{ color: T.outline }}>
          Analyzed in {runtimeMs.toFixed(0)}ms
        </p>
      )}
    </div>
  );
}
