import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/drizzle';
import {
  savedStacks,
  supplements,
  supplementDosage,
  supplementScheduleRules,
  supplementConflicts,
  userProfiles,
} from '@/lib/schema-postgres';
import { eq, inArray, or } from 'drizzle-orm';
import { createClient } from '../../../utils/supabase/server';
import { BiometricsForm } from './BiometricsForm';

// ── types ──────────────────────────────────────────────────────────

interface Biometrics {
  weightKg?: number;
  heightCm?: number;
}

// ── schedule slot ordering ─────────────────────────────────────────

const TIME_SLOTS = [
  { key: 'morning',    label: 'Morning',      icon: '◑' },
  { key: 'afternoon',  label: 'Afternoon',    icon: '○' },
  { key: 'evening',    label: 'Evening',      icon: '◕' },
  { key: 'bedtime',    label: 'Before Bed',   icon: '●' },
  { key: 'any',        label: 'Anytime',      icon: '◎' },
] as const;

function normalizeTime(t: string): string {
  const s = t.toLowerCase().trim();
  if (s.includes('morning') || s.includes('am')) return 'morning';
  if (s.includes('afternoon') || s.includes('noon') || s.includes('lunch') || s.includes('meal')) return 'afternoon';
  if (s.includes('evening') || s.includes('dinner')) return 'evening';
  if (s.includes('bed') || s.includes('night') || s.includes('sleep')) return 'bedtime';
  return 'any';
}

// ── severity helpers ───────────────────────────────────────────────

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

// ── main page ─────────────────────────────────────────────────────

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect('/login?redirect=/dashboard');
  }

  const user = userData.user;

  // Parallel: profile + stack
  const [[profile], [stack]] = await Promise.all([
    db.select().from(userProfiles).where(eq(userProfiles.userId, user.id)).limit(1),
    db.select().from(savedStacks).where(eq(savedStacks.userId, user.id)).limit(1),
  ]);

  const biometrics: Biometrics = profile ? JSON.parse(profile.biometrics ?? '{}') : {};
  const supplementIds: string[] = stack ? JSON.parse(stack.supplementIds ?? '[]') : [];

  if (supplementIds.length === 0) {
    return <EmptyState email={user.email ?? ''} />;
  }

  // Batch fetch all supplement-related data in parallel
  const [suppRows, dosageRows, scheduleRows, conflictRows] = await Promise.all([
    db.select().from(supplements).where(inArray(supplements.id, supplementIds)),
    db.select().from(supplementDosage).where(inArray(supplementDosage.supplementId, supplementIds)),
    db.select().from(supplementScheduleRules).where(inArray(supplementScheduleRules.supplementId, supplementIds)),
    db.select().from(supplementConflicts).where(
      or(
        inArray(supplementConflicts.supplementAId, supplementIds),
        inArray(supplementConflicts.supplementBId, supplementIds),
      )
    ),
  ]);

  // Index by supplementId
  const suppMap = new Map(suppRows.map(s => [s.id, s]));
  const dosageMap = new Map(dosageRows.map(d => [d.supplementId, d]));
  const scheduleMap = new Map(scheduleRows.map(r => [r.supplementId, r]));

  // Only conflicts where both supplements are in this user's stack
  const stackSet = new Set(supplementIds);
  const stackConflicts = conflictRows.filter(
    c => stackSet.has(c.supplementAId) && stackSet.has(c.supplementBId)
  );

  // Supplements with weight-based dosing (for BiometricsForm table)
  const weightDosages = dosageRows
    .filter(d => d.perKgFactor != null)
    .map(d => ({
      supplementId: d.supplementId,
      name: suppMap.get(d.supplementId)?.name ?? d.supplementId,
      slug: suppMap.get(d.supplementId)?.slug ?? '',
      perKgFactor: d.perKgFactor!,
      unit: d.unit,
      maintenance: d.maintenance,
    }));

  // Group schedule by time slot
  const scheduleGroups: Record<string, typeof suppRows> = {
    morning: [], afternoon: [], evening: [], bedtime: [], any: [],
  };
  for (const id of supplementIds) {
    const rule = scheduleMap.get(id);
    const slot = rule ? normalizeTime(rule.preferredTime) : 'any';
    const supp = suppMap.get(id);
    if (supp) scheduleGroups[slot].push(supp);
  }

  const displayName = user.email?.split('@')[0] ?? 'there';

  return (
    <main style={{ minHeight: '100vh', background: 'var(--paper)', paddingBottom: 80 }}>
      {/* ── Header ── */}
      <div style={{ borderBottom: '1px solid var(--rule)', padding: '32px 0 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', paddingInline: 40 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--ink-4)' }}>
            Dashboard
          </span>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ink)', marginTop: 8, marginBottom: 4 }}>
            Hi, {displayName}.
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-3)' }}>
            {stack?.name ?? 'My Stack'} · {supplementIds.length} supplement{supplementIds.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', paddingInline: 40 }}>

        {/* ── Stack Overview ── */}
        <Section label="Stack Overview">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {supplementIds.map(id => {
              const supp = suppMap.get(id);
              const dosage = dosageMap.get(id);
              if (!supp) return null;

              const personalDose = (dosage?.perKgFactor != null && biometrics.weightKg)
                ? dosage.perKgFactor * biometrics.weightKg
                : null;

              return (
                <Link
                  key={id}
                  href={`/research/${supp.slug}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    style={{
                      padding: '16px 18px',
                      borderRadius: 12,
                      border: '1px solid var(--rule)',
                      background: 'var(--paper)',
                      transition: 'border-color 150ms ease',
                      cursor: 'pointer',
                      height: '100%',
                    }}
                    className="stack-card"
                  >
                    <span className="tag" data-cat={supp.category} style={{ fontSize: 10 }}>
                      {supp.category}
                    </span>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginTop: 10, marginBottom: 4, lineHeight: '20px' }}>
                      {supp.name}
                    </p>
                    {dosage ? (
                      <p style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-3)', lineHeight: '17px' }}>
                        {personalDose != null
                          ? `${personalDose % 1 === 0 ? personalDose : personalDose.toFixed(1)} ${dosage.unit}/day`
                          : dosage.maintenance}
                      </p>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
          <style>{`.stack-card:hover { border-color: var(--ink-3) !important; }`}</style>
        </Section>

        {/* ── Daily Schedule ── */}
        <Section label="Daily Schedule">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid var(--rule)', borderRadius: 12, overflow: 'hidden' }}>
            {TIME_SLOTS.filter(slot => scheduleGroups[slot.key].length > 0).map((slot, i) => {
              const items = scheduleGroups[slot.key];
              return (
                <div
                  key={slot.key}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '160px 1fr',
                    borderTop: i > 0 ? '1px solid var(--rule-soft)' : 'none',
                  }}
                >
                  {/* Time label */}
                  <div
                    style={{
                      padding: '16px 20px',
                      background: 'var(--paper-2)',
                      borderRight: '1px solid var(--rule-soft)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 14, color: 'var(--ink-4)', lineHeight: '20px' }}>{slot.icon}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--ink-3)', lineHeight: '20px' }}>
                      {slot.label}
                    </span>
                  </div>

                  {/* Supplements */}
                  <div style={{ padding: '14px 20px', display: 'flex', flexWrap: 'wrap', gap: 8, alignContent: 'center' }}>
                    {items.map(supp => {
                      const rule = scheduleMap.get(supp.id);
                      const dosage = dosageMap.get(supp.id);
                      const personalDose = (dosage?.perKgFactor != null && biometrics.weightKg)
                        ? dosage.perKgFactor * biometrics.weightKg
                        : null;
                      const dose = personalDose != null
                        ? `${personalDose % 1 === 0 ? personalDose : personalDose.toFixed(1)} ${dosage!.unit}`
                        : dosage?.maintenance ?? '';
                      const notes: string[] = [];
                      if (rule?.withFood)       notes.push('with food');
                      if (rule?.fatSoluble)     notes.push('fat-soluble');
                      if (rule?.emptyStomach)   notes.push('empty stomach');
                      if (rule?.stimulant)      notes.push('stimulant');
                      if (rule?.sedating)       notes.push('sedating');

                      return (
                        <div
                          key={supp.id}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 8,
                            background: 'var(--paper-2)',
                            border: '1px solid var(--rule-soft)',
                          }}
                        >
                          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{supp.name}</span>
                          {dose && (
                            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-4)', marginLeft: 8 }}>
                              {dose}
                            </span>
                          )}
                          {notes.length > 0 && (
                            <span style={{ fontSize: 10, color: 'var(--ink-4)', marginLeft: 6 }}>
                              · {notes.join(', ')}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* ── Stack Analysis ── */}
        <Section label="Stack Analysis">
          {stackConflicts.length === 0 ? (
            <div
              style={{
                padding: '20px 24px',
                borderRadius: 12,
                border: '1px solid var(--rule)',
                background: 'rgba(34,197,94,0.04)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
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
              {stackConflicts
                .sort((a, b) => {
                  const order = { high: 0, medium: 1, low: 2 };
                  return (order[a.severity as keyof typeof order] ?? 3) - (order[b.severity as keyof typeof order] ?? 3);
                })
                .map(c => {
                  const suppA = suppMap.get(c.supplementAId);
                  const suppB = suppMap.get(c.supplementBId);
                  if (!suppA || !suppB) return null;
                  return (
                    <div
                      key={c.id}
                      style={{
                        padding: '16px 18px',
                        borderRadius: 12,
                        border: `1px solid ${severityColor(c.severity)}`,
                        background: severityBg(c.severity),
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: severityColor(c.severity) }}>
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

          {/* Overall grade */}
          <StackGrade conflicts={stackConflicts} total={supplementIds.length} />
        </Section>

        {/* ── Biometrics & Dosage ── */}
        <Section label="">
          <BiometricsForm biometrics={biometrics} weightDosages={weightDosages} />
        </Section>

      </div>
    </main>
  );
}

// ── sub-components ─────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section style={{ paddingTop: 48 }}>
      {label && (
        <h2
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '1.4px',
            textTransform: 'uppercase',
            color: 'var(--ink-4)',
            marginBottom: 16,
          }}
        >
          {label}
        </h2>
      )}
      {children}
    </section>
  );
}

function StackGrade({
  conflicts,
  total,
}: {
  conflicts: Array<{ severity: string }>;
  total: number;
}) {
  const high = conflicts.filter(c => c.severity === 'high').length;
  const med  = conflicts.filter(c => c.severity === 'medium').length;

  let grade: string;
  let note: string;
  let color: string;

  if (high > 0) {
    grade = 'C'; color = 'var(--severity-high)';
    note = `${high} high-severity conflict${high > 1 ? 's' : ''} require attention before adding these supplements together.`;
  } else if (med > 1) {
    grade = 'B'; color = 'var(--severity-mid)';
    note = `${med} moderate interaction${med > 1 ? 's' : ''} detected. Space these supplements 2–4 hours apart.`;
  } else if (med === 1) {
    grade = 'B+'; color = 'var(--severity-mid)';
    note = 'One moderate interaction. Space the flagged supplements apart when possible.';
  } else {
    grade = 'A'; color = 'var(--severity-low)';
    note = `Stack of ${total} looks clean. No significant interactions found in clinical literature.`;
  }

  return (
    <div
      style={{
        marginTop: 20,
        padding: '16px 20px',
        borderRadius: 12,
        border: '1px solid var(--rule)',
        background: 'var(--paper-2)',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
      }}
    >
      <span style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-mono)', color, lineHeight: 1 }}>
        {grade}
      </span>
      <div>
        <p style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 4 }}>
          Stack Grade
        </p>
        <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: '19px' }}>{note}</p>
      </div>
    </div>
  );
}

function EmptyState({ email }: { email: string }) {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 400, paddingInline: 40 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--ink-4)' }}>
          Dashboard · {email}
        </span>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', marginTop: 16, marginBottom: 8 }}>
          Your stack is empty
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-3)', lineHeight: '22px', marginBottom: 24 }}>
          Browse supplements and add them to your routine. Your dashboard will show your full analysis here.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            padding: '10px 24px',
            borderRadius: 8,
            background: 'var(--ink)',
            color: 'var(--paper)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            textDecoration: 'none',
          }}
        >
          Browse Supplements →
        </Link>
      </div>
    </main>
  );
}
