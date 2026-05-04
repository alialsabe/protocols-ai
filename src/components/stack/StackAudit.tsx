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
  drug_supplement_interactions: 'Drug × Supplement',
  supplement_supplement_conflicts: 'Supplement Conflicts',
  timing_issues: 'Timing Issues',
  redundancies: 'Redundancies',
  dosing_concerns: 'Dosing Concerns',
};

const CATEGORY_ICONS: Record<AuditCategory, string> = {
  drug_supplement_interactions: '⚕',
  supplement_supplement_conflicts: '⚔',
  timing_issues: '⧗',
  redundancies: '⊜',
  dosing_concerns: '⚖',
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
        setError('The Scout is unavailable. Try again in a moment.');
        return;
      }
      const data: AuditResponse = await res.json();
      setFindings(data.findings ?? []);
    } catch {
      setError('The Scout is unavailable. Try again in a moment.');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 md:px-10 lg:px-16">
      {/* Scout NPC banner — cinematic header */}
      <div
        style={{
          padding: '32px 24px 24px',
          textAlign: 'center',
          marginBottom: 24,
          background: 'radial-gradient(ellipse at center top, rgba(160, 43, 43, 0.18) 0%, transparent 60%)',
          borderBottom: '1px solid var(--rule)',
          position: 'relative',
        }}
      >
        {/* Aura glow */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(160, 43, 43, 0.25) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />
        {/* NPC portrait */}
        <div
          style={{
            position: 'relative',
            width: 88,
            height: 88,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--crimson), var(--crimson-deep))',
            border: '3px solid var(--gold)',
            margin: '0 auto 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-cinzel), serif',
            fontSize: 42,
            fontWeight: 700,
            color: 'var(--gold)',
            boxShadow: '0 0 40px rgba(160, 43, 43, 0.4), inset 0 -8px 20px rgba(0,0,0,0.4)',
          }}
        >
          ⚕
        </div>
        <div
          style={{
            fontFamily: 'var(--font-cinzel), serif',
            fontSize: 14,
            color: 'var(--gold)',
            fontWeight: 600,
            letterSpacing: '3px',
            textTransform: 'uppercase',
          }}
        >
          Scout
        </div>
        <div
          style={{
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: 10,
            color: 'var(--text-3)',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            marginTop: 4,
          }}
        >
          Stack Auditor · Lvl 99
        </div>
        <p
          style={{
            margin: '14px auto 0',
            maxWidth: 420,
            fontFamily: 'var(--font-cinzel), serif',
            fontSize: 16,
            fontStyle: 'italic',
            lineHeight: 1.5,
            color: 'var(--text-2)',
          }}
        >
          &ldquo;Show me your stack and your medications. I&apos;ll find what&apos;s redundant, what conflicts, and what to drop.&rdquo;
        </p>
      </div>

      {/* Medications inventory */}
      <div className="l-section-h">
        <div className="l">⚕ Active Medications</div>
        <div className="r">
          {medications.length} TRACKED
          {isAuthenticated && saveStatus === 'saved' && <span style={{ color: 'var(--good)', marginLeft: 8 }}>● SAVED</span>}
          {isAuthenticated && saveStatus === 'error' && <span style={{ color: 'var(--bad)', marginLeft: 8 }}>● ERROR</span>}
        </div>
      </div>

      <div style={{ marginTop: 4, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8 }}>
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
            style={{
              flex: 1,
              padding: '11px 14px',
              background: 'var(--bg-2)',
              border: '1px solid var(--rule)',
              borderRadius: 6,
              fontSize: 14,
              color: 'var(--text)',
              outline: 'none',
            }}
            aria-label="Medication name"
          />
          <button
            type="button"
            onClick={addMedication}
            className="btn btn--ghost"
          >
            + Add
          </button>
        </div>
        {medications.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {medications.map((medication) => (
              <button
                key={medication}
                type="button"
                onClick={() => removeMedication(medication)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 12px',
                  borderRadius: 99,
                  background: 'var(--bg-2)',
                  border: '1px solid var(--crimson)',
                  color: 'var(--text-2)',
                  fontSize: 12,
                  fontFamily: 'var(--font-cinzel), serif',
                  letterSpacing: '0.4px',
                  cursor: 'pointer',
                }}
                aria-label={`Remove ${medication}`}
              >
                {medication}
                <span style={{ color: 'var(--crimson)', fontWeight: 700 }}>✕</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Begin encounter button */}
      <div
        style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #2A2010 0%, #1F1610 100%)',
          border: '1.5px solid var(--gold)',
          borderRadius: 6,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: 11,
            color: 'var(--gold)',
            letterSpacing: '2px',
            fontWeight: 600,
          }}
        >
          {stackSlugs.length === 0
            ? 'NO STACK TO AUDIT'
            : `READY · ${stackSlugs.length} SUPPLEMENTS · ${medications.length} MEDS`}
        </div>
        <button
          type="button"
          onClick={runStackAudit}
          disabled={!canAudit}
          className="btn"
          style={{
            opacity: canAudit ? 1 : 0.4,
            fontSize: 14,
            padding: '14px 32px',
          }}
        >
          {running ? '⚜ Auditing...' : '▸ Begin Encounter'}
        </button>
        {stackSlugs.length === 0 && (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)', maxWidth: 320 }}>
            Equip at least one supplement on your{' '}
            <a href="/routine" style={{ color: 'var(--gold)', borderBottom: '1px solid var(--gold)' }}>Stack</a>{' '}
            to start the audit.
          </p>
        )}
      </div>

      {error && (
        <div
          style={{
            padding: 16,
            background: 'rgba(160, 43, 43, 0.12)',
            border: '1px solid var(--crimson)',
            borderRadius: 6,
            color: 'var(--bad)',
            fontFamily: 'var(--font-cinzel), serif',
            fontSize: 13,
            marginBottom: 20,
          }}
        >
          {error}
        </div>
      )}

      {findings && <AuditReport findings={findings} />}
    </div>
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
    <div style={{ marginTop: 32 }}>
      {/* Verdict banner */}
      <div
        style={{
          padding: '20px 24px',
          background: severityBg(maxSeverity),
          border: `1.5px solid ${severityColor(maxSeverity)}`,
          borderRadius: 6,
          marginBottom: 24,
          display: 'flex',
          gap: 16,
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: severityColor(maxSeverity),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-cinzel), serif',
            fontSize: 24,
            fontWeight: 700,
            color: 'var(--bg)',
            flexShrink: 0,
          }}
        >
          {findings.length === 0 ? '✓' : '!'}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 10,
              color: 'var(--gold)',
              letterSpacing: '1.5px',
              fontWeight: 600,
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            ◆ Encounter Verdict
          </div>
          <div
            style={{
              fontFamily: 'var(--font-cinzel), serif',
              fontSize: 18,
              color: 'var(--text)',
              fontWeight: 600,
              lineHeight: 1.3,
            }}
          >
            {summaryText(findings.length, counts)}
          </div>
        </div>
      </div>

      {/* Category cards */}
      <div className="l-section-h">
        <div className="l">⚜ Findings by Category</div>
        <div className="r">{findings.length} TOTAL</div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 12,
          marginTop: 8,
        }}
      >
        {CATEGORY_ORDER.map((category) => {
          const categoryFindings = findings.filter((finding) => finding.category === category);
          const hasFindings = categoryFindings.length > 0;
          const maxCatSeverity = hasFindings
            ? (['high', 'medium', 'low', 'info'] as AuditSeverity[]).find((s) =>
                categoryFindings.some((f) => f.severity === s)
              ) ?? 'info'
            : null;

          return (
            <article
              key={category}
              style={{
                padding: 18,
                background: 'linear-gradient(160deg, var(--bg-card) 0%, var(--bg-card-end) 100%)',
                border: `1.5px solid ${hasFindings ? severityColor(maxCatSeverity!) : 'var(--rar-common)'}`,
                borderRadius: 6,
                position: 'relative',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: 12,
                  marginBottom: 14,
                  paddingBottom: 10,
                  borderBottom: '1px dotted var(--rule)',
                }}
              >
                <h3
                  style={{
                    fontFamily: 'var(--font-cinzel), serif',
                    fontSize: 14,
                    color: 'var(--text)',
                    fontWeight: 600,
                    letterSpacing: '0.4px',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ color: 'var(--gold)', fontSize: 16 }}>{CATEGORY_ICONS[category]}</span>
                  {CATEGORY_LABELS[category]}
                </h3>
                <span
                  style={{
                    fontFamily: 'var(--font-jetbrains-mono), monospace',
                    fontSize: 9,
                    color: hasFindings ? severityColor(maxCatSeverity!) : 'var(--text-4)',
                    letterSpacing: '1px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {categoryFindings.length} {categoryFindings.length === 1 ? 'finding' : 'findings'}
                </span>
              </div>

              {!hasFindings ? (
                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--good)',
                    fontFamily: 'var(--font-cinzel), serif',
                    margin: 0,
                    letterSpacing: '0.3px',
                    fontStyle: 'italic',
                  }}
                >
                  ✓ Nothing to flag — clear.
                </p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {categoryFindings.map((finding, index) => (
                    <li key={`${finding.title}-${index}`} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span
                        style={{
                          marginTop: 6,
                          width: 8,
                          height: 8,
                          flexShrink: 0,
                          borderRadius: '50%',
                          background: severityColor(finding.severity),
                          boxShadow: finding.severity === 'high' ? `0 0 6px ${severityColor(finding.severity)}` : 'none',
                        }}
                        aria-hidden
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p
                          style={{
                            fontFamily: 'var(--font-cinzel), serif',
                            fontSize: 13,
                            color: 'var(--text)',
                            fontWeight: 600,
                            margin: 0,
                            letterSpacing: '0.2px',
                            lineHeight: 1.3,
                          }}
                        >
                          {finding.title}
                        </p>
                        <p
                          style={{
                            marginTop: 4,
                            fontSize: 12,
                            lineHeight: 1.5,
                            color: 'var(--text-2)',
                            fontFamily: 'var(--font-inter), sans-serif',
                          }}
                        >
                          {finding.rationale}
                        </p>
                        {(finding.details || finding.refs?.length) && (
                          <details
                            style={{
                              marginTop: 8,
                              fontFamily: 'var(--font-jetbrains-mono), monospace',
                              fontSize: 11,
                              color: 'var(--text-3)',
                            }}
                          >
                            <summary
                              style={{
                                cursor: 'pointer',
                                color: 'var(--gold)',
                                fontSize: 10,
                                fontWeight: 600,
                                letterSpacing: '1px',
                                textTransform: 'uppercase',
                              }}
                            >
                              ▸ Evidence
                            </summary>
                            <p style={{ marginTop: 6, lineHeight: 1.5 }}>
                              {[finding.details, ...(finding.refs ?? [])].filter(Boolean).join(' · ')}
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
  if (total === 0) return 'Stack looks clean. No conflicts, redundancies, or timing issues.';
  const parts = (['high', 'medium', 'low', 'info'] as AuditSeverity[])
    .filter((severity) => counts[severity] > 0)
    .map((severity) => `${counts[severity]} ${severity}`);
  return `${total} ${total === 1 ? 'finding' : 'findings'}: ${parts.join(', ')}.`;
}

function severityColor(severity: AuditSeverity) {
  if (severity === 'high')   return 'var(--bad)';
  if (severity === 'medium') return 'var(--warn)';
  if (severity === 'low')    return 'var(--text-3)';
  return 'var(--text-4)';
}

function severityBg(severity: AuditSeverity) {
  if (severity === 'high')   return 'rgba(255, 107, 107, 0.10)';
  if (severity === 'medium') return 'rgba(255, 139, 107, 0.10)';
  if (severity === 'low')    return 'var(--bg-2)';
  return 'var(--bg-2)';
}
