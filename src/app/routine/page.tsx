import { cookies } from 'next/headers';
import { unstable_cache } from 'next/cache';
import { db } from '@/lib/drizzle';
import {
  savedStacks,
  supplements,
  supplementDosage,
  supplementConflicts,
  userProfiles,
} from '@/lib/schema-postgres';
import { eq } from 'drizzle-orm';
import { createClient } from '../../../utils/supabase/server';
import { StackBuilder } from '@/components/stack/StackBuilder';
import { PersonalisedAnalysis } from '@/components/stack/PersonalisedAnalysis';
import { StackAudit } from '@/components/stack/StackAudit';
import { BloodworkUpload } from '@/components/stack/BloodworkUpload';
import type { Biometrics } from '@/components/stack/BiometricsForm';

export const metadata = {
  title: 'My Routine — Materia',
  description: 'Build, schedule, and personalise your daily supplement routine.',
};

// Cold starts on Vercel + 4 parallel DB queries + auth check were timing
// out the default function budget. Public reference data doesn't change
// per-user so it can ride a 5-minute server cache, leaving only the auth
// fetch + per-user profile lookup on the critical path.
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

// /routine is the canonical "my stuff" page. Anonymous users get the editor +
// scheduler from localStorage; logged-in users additionally get personalised
// dosing, conflict grade, and server-side persistence.
//
//   ┌──────────────────────────┐
//   │ StackBuilder (client)    │  reads localStorage,
//   │   list editor +          │  fires routine:update on
//   │   RoutinePanel scheduler │  add/remove
//   └──────────────────────────┘
//                │
//                ▼
//   ┌──────────────────────────┐
//   │ PersonalisedAnalysis     │  listens for routine:update,
//   │   conflicts + grade +    │  re-derives from server-fetched
//   │   biometrics + per-kg    │  supplement / dosage / conflict
//   └──────────────────────────┘  data passed in once
//
// Per-section graceful degradation: each Promise.allSettled branch falls
// back to a "temporarily unavailable" inline message, the editor keeps
// working in all cases.

export default async function RoutinePage() {
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

  // SavedStacks fetch happens inside StackBuilder via /api/stack — kept
  // separate so the editor is fully client-driven and can fall back to
  // localStorage on its own.

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

  // Drizzle's column inference makes nulls explicit; map to the shape
  // PersonalisedAnalysis expects.
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
    <div style={{ paddingTop: 0 }}>
      <StackBuilder />
      <div className="mx-auto max-w-[1200px] px-5 md:px-10 lg:px-16">
        <StackAudit isAuthenticated={isAuthenticated} />
        <BloodworkUpload isAuthenticated={isAuthenticated} />
        <PersonalisedAnalysis
          initialBiometrics={initialBiometrics}
          isAuthenticated={isAuthenticated}
          supplements={supps}
          dosages={dosages}
          conflicts={conflicts}
          failures={failures}
        />
      </div>
    </div>
  );
}

function safeJsonParse<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; }
  catch { return fallback; }
}
