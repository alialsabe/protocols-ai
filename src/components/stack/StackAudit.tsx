'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { AuditCategory, AuditFinding, AuditSeverity } from '@/lib/audit-engine';

const ROUTINE_KEY = 'protocolsai.routine.v2';
const MEDICATIONS_KEY = 'protocolsai.medications.v1';
const BIOMETRICS_KEY = 'protocolsai.biometrics.v1';

const CATEGORY_ORDER: AuditCategory[] = [
  'drug_supplement_interactions',
  'supplement_supplement_conflicts',
  'timing_issues',
  'redundancies',
  'dosing_concerns',
];

const CATEGORY_LABELS: Record<AuditCategory, string> = {
  drug_supplement_interactions: 'Drug-supplement interactions',
  supplement_supplement_conflicts: 'Supplement-supplement conflicts',
  timing_issues: 'Timing issues',
  redundancies: 'Redundancies',
  dosing_concerns: 'Dosing concerns',
};

interface Props {
  isAuthenticated: boolean;
}

interface AuditResponse {
  findings: AuditFinding[];
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try { return JSON.parse(localStorage.getItem(key) ?? JSON.stringify(fallback)); }
  catch { return fallback; }
}

function writeMedications(medications: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MEDICATIONS_KEY, JSON.stringify(medications));
}

export function StackAudit({ isAuthenticated }: Props) {
  const [stackSlugs, setStackSlugs] = useState<string[]>([]);
  const [medications, setMedications] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [findings, setFindings] = useState<AuditFinding[] | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const saveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedRef = useRef(false);

  useEffect(() => {
    setStackSlugs(readJson<string[]>(ROUTINE_KEY, []));
    setMedications(readJson<string[]>(MEDICATIONS_KEY, []));

    const syncRoutine = () => setStackSlugs(readJson<string[]>(ROUTINE_KEY, []));
    window.addEventListener('routine:update', syncRoutine);
    window.addEventListener('storage', syncRoutine);
    return () => {
      window.removeEventListener('routine:update', syncRoutine);
      window.removeEventListener('storage', syncRoutine);
      if (saveRef.current) clearTimeout(saveRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function hydrateServerMeds() {
      if (!isAuthenticated) {
        hydratedRef.current = true;
        return;
      }
      try {
        const res = await fetch('/api/medications');
        if (!res.ok) return;
        const data = await res.json();
        const serverMeds = Array.isArray(data.medications) ? data.medications.map(String) : [];
        if (!cancelled && serverMeds.length > 0 && medications.length === 0) {
          setMedications(serverMeds);
          writeMedications(serverMeds);
        }
      } finally {
        hydratedRef.current = true;
      }
    }
    hydrateServerMeds();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    writeMedications(medications);
    setSaveStatus('idle');

    if (!isAuthenticated) return;
    if (saveRef.current) clearTimeout(saveRef.current);
    saveRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/medications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ medications }),
        });
        setSaveStatus(res.ok ? 'saved' : 'error');
      } catch {
        setSaveStatus('error');
      }
    }, 700);
  }, [medications, isAuthenticated]);

  const normalizedInput = input.trim().toLowerCase().replace(/\s+/g, ' ');
  const canAudit = stackSlugs.length > 0 && !running;

  function addMedication() {
    if (!normalizedInput || medications.includes(normalizedInput)) {
      setInput('');
      return;
    }
    setMedications([...medications, normalizedInput]);
    setInput('');
  }

  function removeMedication(medication: string) {
    setMedications(medications.filter((m) => m !== medication));
  }

  async function runStackAudit() {
    if (!canAudit) return;
    setRunning(true);
    setError(null);
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplementIds: stackSlugs,
          medications,
          biometrics: readJson(BIOMETRICS_KEY, {}),
        }),
      });
      if (!res.ok) {
        setError('Audit temporarily unavailable.');
        return;
      }
      const data: AuditResponse = await res.json();
      setFindings(data.findings ?? []);
    } catch {
      setError('Audit temporarily unavailable.');
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="py-10" style={{ borderTop: '1px solid var(--hair)', borderBottom: '1px solid var(--hair)' }}>
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]" style={{ color: 'var(--accent)' }}>
            Stack Audit
          </span>
          <h2 className="mt-1 text-[22px] font-extrabold tracking-[-0.4px]" style={{ color: 'var(--fg)' }}>
            Check your stack against meds, timing, dose, and overlap
          </h2>
        </div>
        {isAuthenticated && saveStatus !== 'idle' && (
          <span className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]" style={{ color: saveStatus === 'saved' ? 'var(--accent)' : '#ef4444' }}>
            {saveStatus === 'saved' ? 'Meds saved' : 'Med save failed'}
          </span>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <label className="mb-2 block font-mono text-[11px] font-bold uppercase tracking-[1.4px]" style={{ color: 'var(--fg-dim)' }}>
            Medications
          </label>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addMedication();
                }
              }}
              placeholder="e.g. sertraline, levothyroxine"
              className="min-h-[44px] flex-1 bg-transparent px-3 text-[14px] outline-none"
              style={{ border: '1px solid var(--hair)', color: 'var(--fg)' }}
              aria-label="Medication name"
            />
            <button
              type="button"
              onClick={addMedication}
              className="inline-flex min-h-[44px] items-center px-5 font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
              style={{ background: 'var(--surface)', border: '1px solid var(--hair)', color: 'var(--fg)' }}
            >
              + Add
            </button>
          </div>
          {medications.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {medications.map((medication) => (
                <button
                  key={medication}
                  type="button"
                  onClick={() => removeMedication(medication)}
                  className="inline-flex min-h-[32px] items-center gap-2 rounded-full px-3 text-[12px] font-semibold"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--hair)', color: 'var(--fg)' }}
                  aria-label={`Remove ${medication}`}
                >
                  {medication}
                  <span aria-hidden style={{ color: 'var(--fg-dim)' }}>x</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={runStackAudit}
          disabled={!canAudit}
          className="inline-flex min-h-[48px] items-center justify-center px-6 font-mono text-[11px] font-bold uppercase tracking-[1.4px] transition-opacity disabled:opacity-40"
          style={{ background: 'var(--accent)', color: '#000' }}
        >
          {running ? 'Auditing...' : 'Audit my stack'}
        </button>
      </div>

      {stackSlugs.length === 0 && (
        <p className="mt-4 text-[13px]" style={{ color: 'var(--fg-muted)' }}>
          Add at least one supplement to run the audit.
        </p>
      )}

      {error && (
        <div className="mt-5 p-4 text-[13px]" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
          {error}
        </div>
      )}

      {findings && <AuditReport findings={findings} />}
    </section>
  );
}

function AuditReport({ findings }: { findings: AuditFinding[] }) {
  const counts = useMemo(() => {
    const next: Record<AuditSeverity, number> = { high: 0, medium: 0, low: 0, info: 0 };
    findings.forEach((finding) => { next[finding.severity] += 1; });
    return next;
  }, [findings]);
  const maxSeverity = (['high', 'medium', 'low', 'info'] as AuditSeverity[]).find((severity) => counts[severity] > 0) ?? 'info';

  return (
    <div className="mt-8">
      <div className="mb-5 p-4 text-[14px] font-semibold" style={{ background: severityBg(maxSeverity), border: `1px solid ${severityColor(maxSeverity)}`, color: 'var(--fg)' }}>
        {summaryText(findings.length, counts)}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {CATEGORY_ORDER.map((category) => {
          const categoryFindings = findings.filter((finding) => finding.category === category);
          return (
            <article key={category} className="p-5" style={{ background: 'var(--surface)', border: '1px solid var(--hair)' }}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-[15px] font-bold" style={{ color: 'var(--fg)' }}>
                  {CATEGORY_LABELS[category]}
                </h3>
                <span className="whitespace-nowrap rounded-full px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[1px]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--hair)', color: 'var(--fg-muted)' }}>
                  {categoryFindings.length} {categoryFindings.length === 1 ? 'finding' : 'findings'}
                </span>
              </div>
              {categoryFindings.length === 0 ? (
                <p className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>No findings - looks good.</p>
              ) : (
                <ul className="flex flex-col gap-4">
                  {categoryFindings.map((finding, index) => (
                    <li key={`${finding.title}-${index}`} className="flex items-start gap-3">
                      <span className="mt-[6px] h-[9px] w-[9px] flex-shrink-0 rounded-full" style={{ background: severityColor(finding.severity) }} aria-hidden />
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold" style={{ color: 'var(--fg)' }}>{finding.title}</p>
                        <p className="mt-1 text-[12px] leading-[18px]" style={{ color: 'var(--fg-muted)' }}>{finding.rationale}</p>
                        {(finding.details || finding.refs?.length) && (
                          <details className="mt-2 text-[12px]" style={{ color: 'var(--fg-dim)' }}>
                            <summary className="cursor-pointer font-mono text-[10px] font-bold uppercase tracking-[1px]">More details</summary>
                            <p className="mt-2 leading-[18px]">
                              {[finding.details, ...(finding.refs ?? [])].filter(Boolean).join(' | ')}
                            </p>
                          </details>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function summaryText(total: number, counts: Record<AuditSeverity, number>) {
  if (total === 0) return 'No findings - looks good.';
  const parts = (['high', 'medium', 'low', 'info'] as AuditSeverity[])
    .filter((severity) => counts[severity] > 0)
    .map((severity) => `${counts[severity]} ${severity}`);
  return `${total} ${total === 1 ? 'finding' : 'findings'}: ${parts.join(', ')}.`;
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
