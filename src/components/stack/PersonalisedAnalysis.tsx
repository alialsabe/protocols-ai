'use client';

import { useEffect, useMemo, useState } from 'react';
import { BiometricsForm, type Biometrics } from './BiometricsForm';
import { StackGrade } from './StackGrade';

const ROUTINE_KEY = 'protocolsai.routine.v2';

interface SupplementRow {
  id: string;
  slug: string;
  name: string;
  category: string;
}

interface DosageRow {
  supplementId: string;
  perKgFactor: number | null;
  unit: string;
  maintenance: string;
}

interface ConflictRow {
  id: string;
  supplementAId: string;
  supplementBId: string;
  conflictType: string;
  severity: string;
  mechanism: string | null;
  minSpacingHours: number | null;
}

interface Props {
  initialBiometrics: Biometrics;
  isAuthenticated: boolean;
  supplements: SupplementRow[];
  dosages: DosageRow[];
  conflicts: ConflictRow[];
  failures?: { biometrics?: boolean; conflicts?: boolean };
}

function readLocalRoutine(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(ROUTINE_KEY) ?? '[]'); }
  catch { return []; }
}

function severityColor(s: string) {
  if (s === 'high')   return 'var(--severity-high)';
  if (s === 'medium') return 'var(--severity-mid)';
  return 'var(--severity-low)';
}

function severityBg(s: string) {
  if (s === 'high')   return 'rgba(239,68,68,0.08)';
  if (s === 'medium') return 'rgba(234,179,8,0.08)';
  return 'rgba(34,197,94,0.08)';
}

export function PersonalisedAnalysis({
  initialBiometrics, isAuthenticated, supplements, dosages, conflicts, failures = {},
}: Props) {
  const [stackSlugs, setStackSlugs] = useState<string[]>([]);

  useEffect(() => {
    setStackSlugs(readLocalRoutine());
    const sync = () => setStackSlugs(readLocalRoutine());
    window.addEventListener('routine:update', sync);
    return () => window.removeEventListener('routine:update', sync);
  }, []);

  const bySlug = useMemo(() => new Map(supplements.map((s) => [s.slug, s])), [supplements]);
  const byId   = useMemo(() => new Map(supplements.map((s) => [s.id, s])), [supplements]);
  const dosageById = useMemo(() => new Map(dosages.map((d) => [d.supplementId, d])), [dosages]);

  const stackIds = useMemo(
    () => stackSlugs.map((slug) => bySlug.get(slug)?.id).filter((id): id is string => Boolean(id)),
    [stackSlugs, bySlug],
  );
  const stackIdSet = useMemo(() => new Set(stackIds), [stackIds]);

  const stackConflicts = useMemo(
    () => conflicts.filter((c) => stackIdSet.has(c.supplementAId) && stackIdSet.has(c.supplementBId)),
    [conflicts, stackIdSet],
  );

  const weightDosages = useMemo(() => {
    return stackIds
      .map((id) => {
        const supp = byId.get(id);
        const dosage = dosageById.get(id);
        if (!supp || !dosage || dosage.perKgFactor == null) return null;
        return {
          supplementId: id,
          name: supp.name,
          slug: supp.slug,
          perKgFactor: dosage.perKgFactor,
          unit: dosage.unit,
          maintenance: dosage.maintenance,
        };
      })
      .filter((d): d is NonNullable<typeof d> => d !== null);
  }, [stackIds, byId, dosageById]);

  if (stackSlugs.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 56, paddingTop: 48 }}>
      <Section label="Stack Analysis">
        {failures.conflicts ? (
          <SoftFail message="Stack analysis temporarily unavailable. Try refreshing in a moment." />
        ) : stackConflicts.length === 0 ? (
          <div style={{
            padding: '20px 24px', borderRadius: 12, border: '1px solid var(--rule)',
            background: 'rgba(34,197,94,0.04)', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 18 }}>✓</span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>
                No conflicts detected
              </p>
              <p style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                The supplements in your stack have no known interactions with each other based on available clinical data.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...stackConflicts]
              .sort((a, b) => {
                const order = { high: 0, medium: 1, low: 2 } as const;
                return (order[a.severity as keyof typeof order] ?? 3) - (order[b.severity as keyof typeof order] ?? 3);
              })
              .map((c) => {
                const suppA = byId.get(c.supplementAId);
                const suppB = byId.get(c.supplementBId);
                if (!suppA || !suppB) return null;
                return (
                  <div key={c.id} style={{
                    padding: '16px 18px', borderRadius: 12,
                    border: `1px solid ${severityColor(c.severity)}`,
                    background: severityBg(c.severity),
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                        letterSpacing: '1px', textTransform: 'uppercase', color: severityColor(c.severity),
                      }}>
                        {c.severity} · {c.conflictType}
                      </span>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
                      {suppA.name} + {suppB.name}
                    </p>
                    {c.mechanism && (
                      <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: '20px' }}>
                        {c.mechanism}
                      </p>
                    )}
                    {c.minSpacingHours && c.minSpacingHours > 0 && (
                      <p style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-4)', marginTop: 6 }}>
                        Recommended spacing: {c.minSpacingHours}h apart
                      </p>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {!failures.conflicts && (
          <StackGrade conflicts={stackConflicts} total={stackIds.length} />
        )}
      </Section>

      {failures.biometrics ? (
        <Section label="">
          <SoftFail message="Personalised dosing temporarily unavailable. Try refreshing in a moment." />
        </Section>
      ) : (
        <Section label="">
          <BiometricsForm
            initialBiometrics={initialBiometrics}
            weightDosages={weightDosages}
            isAuthenticated={isAuthenticated}
          />
        </Section>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      {label && (
        <h2 style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
          letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 16,
        }}>
          {label}
        </h2>
      )}
      {children}
    </section>
  );
}

function SoftFail({ message }: { message: string }) {
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 10, border: '1px solid var(--rule)',
      background: 'var(--paper-2)', color: 'var(--ink-3)', fontSize: 13,
    }}>
      {message}
    </div>
  );
}
