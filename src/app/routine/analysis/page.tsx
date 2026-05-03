import { cookies } from 'next/headers';
import { unstable_cache } from 'next/cache';
import { db } from '@/lib/drizzle';
import {
  supplements,
  supplementDosage,
  supplementConflicts,
  userProfiles,
} from '@/lib/schema-postgres';
import { eq } from 'drizzle-orm';
import { createClient } from '../../../../utils/supabase/server';
import { PersonalisedAnalysis } from '@/components/stack/PersonalisedAnalysis';
import type { Biometrics } from '@/components/stack/BiometricsForm';

export const metadata = {
  title: 'Analysis — Stack Lab',
  description: 'Personalised dosing, conflict grading, and biometrics-aware recommendations.',
};

// Heaviest page in the workspace — needs the full reference dataset for
// conflict grading + per-kg dosing. Reference data is cached for 5 min;
// only auth + user profile is per-request.
export const maxDuration = 30;

const loadReferenceData = unstable_cache(
  async () => {
    const [suppsResult, dosageResult, conflictsResult] = await Promise.allSettled([
      db.select({
        id: supplements.id,
        slug: supplements.slug,
        name: supplements.name,
        category: supplements.category,
      }).from(supplements),
      db.select({
        supplementId: supplementDosage.supplementId,
        perKgFactor: supplementDosage.perKgFactor,
        unit: supplementDosage.unit,
        maintenance: supplementDosage.maintenance,
      }).from(supplementDosage),
      db.select().from(supplementConflicts),
    ]);
    return { suppsResult, dosageResult, conflictsResult };
  },
  ['routine-reference-data'],
  { revalidate: 300, tags: ['routine-reference-data'] },
);

export default async function AnalysisPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: userData } = await supabase.auth.getUser();
  const isAuthenticated = Boolean(userData.user);
  const userId = userData.user?.id ?? null;

  const [profileResult, referenceData] = await Promise.all([
    Promise.allSettled([
      userId
        ? db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1)
        : Promise.resolve([]),
    ]).then(([r]) => r),
    loadReferenceData(),
  ]);

  const { suppsResult, dosageResult, conflictsResult } = referenceData;

  const initialBiometrics: Biometrics =
    profileResult.status === 'fulfilled' && profileResult.value[0]?.biometrics
      ? safeJsonParse<Biometrics>(profileResult.value[0].biometrics, {})
      : {};

  const supps = suppsResult.status === 'fulfilled' ? suppsResult.value : [];
  const dosages = dosageResult.status === 'fulfilled' ? dosageResult.value : [];
  const rawConflicts = conflictsResult.status === 'fulfilled' ? conflictsResult.value : [];

  const failures = {
    biometrics: profileResult.status === 'rejected',
    conflicts: conflictsResult.status === 'rejected',
  };

  const conflicts = rawConflicts.map((c) => ({
    id: c.id,
    supplementAId: c.supplementAId,
    supplementBId: c.supplementBId,
    conflictType: c.conflictType ?? 'interaction',
    severity: c.severity ?? 'medium',
    mechanism: c.mechanism ?? null,
    minSpacingHours: c.minSpacingHours ?? null,
  }));

  return (
    <div>
      <header className="mb-8">
        <span
          className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
          style={{ color: 'var(--accent)' }}
        >
          Analysis
        </span>
        <h1
          className="mt-1 text-[28px] font-extrabold tracking-[-0.5px]"
          style={{ color: 'var(--fg)' }}
        >
          Personalised analysis
        </h1>
        <p className="mt-2 text-[14px]" style={{ color: 'var(--fg-muted)' }}>
          Biometrics-aware dosing, conflict grading, and stack quality score. Add weight + height for per-kg recommendations.
        </p>
      </header>
      <PersonalisedAnalysis
        initialBiometrics={initialBiometrics}
        isAuthenticated={isAuthenticated}
        supplements={supps}
        dosages={dosages}
        conflicts={conflicts}
        failures={failures}
      />
    </div>
  );
}

function safeJsonParse<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; }
  catch { return fallback; }
}
