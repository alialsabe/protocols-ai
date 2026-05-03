'use client';

import { useMemo, useRef, useState } from 'react';
import type { AuditFinding, AuditSeverity } from '@/lib/audit-engine';
import type { ExtractedMarker } from '@/lib/bloodwork-rules';

type UploadState = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

interface Props {
  isAuthenticated: boolean;
}

interface BloodworkResponse {
  markers: ExtractedMarker[];
  findings: AuditFinding[];
}

const SEVERITY_ORDER: AuditSeverity[] = ['high', 'medium', 'low', 'info'];

export function BloodworkUpload({ isAuthenticated }: Props) {
  const [state, setState] = useState<UploadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BloodworkResponse | null>(null);
  const [filename, setFilename] = useState<string>('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  if (!isAuthenticated) {
    return (
      <section
        className="py-10"
        style={{ borderTop: '1px solid var(--hair)', borderBottom: '1px solid var(--hair)' }}
      >
        <span
          className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
          style={{ color: 'var(--accent)' }}
        >
          Bloodwork
        </span>
        <h2
          className="mt-1 text-[22px] font-extrabold tracking-[-0.4px]"
          style={{ color: 'var(--fg)' }}
        >
          Upload a lab PDF and we'll flag deficiencies
        </h2>
        <p className="mt-3 text-[14px]" style={{ color: 'var(--fg-muted)' }}>
          Sign in to upload bloodwork. Your raw PDF is never stored - we extract
          markers and discard the file.
        </p>
      </section>
    );
  }

  function pickFile() {
    fileRef.current?.click();
  }

  async function handleFile(file: File) {
    setFilename(file.name);
    setError(null);
    setResult(null);
    setState('uploading');

    const form = new FormData();
    form.append('file', file);

    try {
      setState('processing');
      const res = await fetch('/api/bloodwork', { method: 'POST', body: form });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error ?? 'Bloodwork upload failed.');
        setState('error');
        return;
      }
      const data: BloodworkResponse = await res.json();
      setResult(data);
      setState('done');
    } catch {
      setError('Bloodwork upload failed.');
      setState('error');
    }
  }

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void handleFile(file);
    event.target.value = '';
  }

  const busy = state === 'uploading' || state === 'processing';
  const buttonLabel =
    state === 'uploading'
      ? 'Uploading...'
      : state === 'processing'
        ? 'Reading markers...'
        : 'Choose PDF';

  return (
    <section
      className="py-10"
      style={{ borderTop: '1px solid var(--hair)', borderBottom: '1px solid var(--hair)' }}
    >
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <span
            className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
            style={{ color: 'var(--accent)' }}
          >
            Bloodwork
          </span>
          <h2
            className="mt-1 text-[22px] font-extrabold tracking-[-0.4px]"
            style={{ color: 'var(--fg)' }}
          >
            Upload a lab PDF and we'll flag deficiencies
          </h2>
          <p className="mt-2 text-[13px]" style={{ color: 'var(--fg-muted)' }}>
            LabCorp, Quest, or any standard panel. Max 10MB. Raw PDF is not stored.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={onChange}
          aria-hidden
        />
        <button
          type="button"
          onClick={pickFile}
          disabled={busy}
          className="inline-flex min-h-[48px] items-center justify-center px-6 font-mono text-[11px] font-bold uppercase tracking-[1.4px] transition-opacity disabled:opacity-40"
          style={{ background: 'var(--accent)', color: '#000' }}
        >
          {buttonLabel}
        </button>
        {filename && (
          <span className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
            {filename}
          </span>
        )}
      </div>

      {error && (
        <div
          className="mt-5 p-4 text-[13px]"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#ef4444',
          }}
        >
          {error}
        </div>
      )}

      {state === 'done' && result && <BloodworkReport result={result} />}
    </section>
  );
}

function BloodworkReport({ result }: { result: BloodworkResponse }) {
  const counts = useMemo(() => {
    const next: Record<AuditSeverity, number> = { high: 0, medium: 0, low: 0, info: 0 };
    result.findings.forEach((f) => {
      next[f.severity] += 1;
    });
    return next;
  }, [result.findings]);

  const maxSeverity =
    SEVERITY_ORDER.find((severity) => counts[severity] > 0) ?? 'info';

  return (
    <div className="mt-8">
      <div
        className="mb-5 p-4 text-[14px] font-semibold"
        style={{
          background: severityBg(maxSeverity),
          border: `1px solid ${severityColor(maxSeverity)}`,
          color: 'var(--fg)',
        }}
      >
        {summaryText(result.markers.length, result.findings.length, counts)}
      </div>

      {result.findings.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {result.findings.map((finding, index) => (
            <article
              key={`${finding.title}-${index}`}
              className="p-5"
              style={{ background: 'var(--surface)', border: '1px solid var(--hair)' }}
            >
              <div className="mb-2 flex items-start gap-3">
                <span
                  className="mt-[6px] h-[9px] w-[9px] flex-shrink-0 rounded-full"
                  style={{ background: severityColor(finding.severity) }}
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-[15px] font-bold" style={{ color: 'var(--fg)' }}>
                    {finding.title}
                  </p>
                  <p
                    className="mt-2 text-[13px] leading-[20px]"
                    style={{ color: 'var(--fg-muted)' }}
                  >
                    {finding.rationale}
                  </p>
                  {(finding.details || finding.refs?.length) && (
                    <details
                      className="mt-3 text-[12px]"
                      style={{ color: 'var(--fg-dim)' }}
                    >
                      <summary className="cursor-pointer font-mono text-[10px] font-bold uppercase tracking-[1px]">
                        More details
                      </summary>
                      <p className="mt-2 leading-[18px]">
                        {[finding.details, ...(finding.refs ?? [])]
                          .filter(Boolean)
                          .join(' | ')}
                      </p>
                    </details>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {result.markers.length > 0 && (
        <details
          className="mt-6"
          style={{ color: 'var(--fg-dim)' }}
        >
          <summary className="cursor-pointer font-mono text-[11px] font-bold uppercase tracking-[1.4px]">
            All extracted markers ({result.markers.length})
          </summary>
          <ul className="mt-3 grid gap-2 md:grid-cols-2">
            {result.markers.map((marker, index) => (
              <li
                key={`${marker.name}-${index}`}
                className="flex items-baseline justify-between gap-3 px-3 py-2 text-[12px]"
                style={{ background: 'var(--surface)', border: '1px solid var(--hair)' }}
              >
                <span style={{ color: 'var(--fg)' }}>{marker.name}</span>
                <span style={{ color: 'var(--fg-muted)' }}>
                  {marker.value} {marker.unit}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function summaryText(
  markerCount: number,
  findingCount: number,
  counts: Record<AuditSeverity, number>,
) {
  if (markerCount === 0) return 'No markers extracted from this PDF.';
  if (findingCount === 0) {
    return `Read ${markerCount} markers - no supplement actions flagged.`;
  }
  const parts = SEVERITY_ORDER.filter((severity) => counts[severity] > 0).map(
    (severity) => `${counts[severity]} ${severity}`,
  );
  return `Your bloodwork flags ${findingCount} supplement ${
    findingCount === 1 ? 'action' : 'actions'
  }: ${parts.join(', ')}.`;
}

function severityColor(severity: AuditSeverity) {
  if (severity === 'high') return '#ef4444';
  if (severity === 'medium') return '#f59e0b';
  if (severity === 'low') return '#9ca3af';
  return 'var(--fg-dim)';
}

function severityBg(severity: AuditSeverity) {
  if (severity === 'high') return 'rgba(239,68,68,0.08)';
  if (severity === 'medium') return 'rgba(245,158,11,0.08)';
  if (severity === 'low') return 'rgba(156,163,175,0.08)';
  return 'rgba(255,255,255,0.04)';
}
