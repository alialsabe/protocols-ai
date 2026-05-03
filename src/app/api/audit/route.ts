import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { inArray } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import {
  auditSessions,
  medicineInteractions,
  supplementConflicts,
  supplementDosage,
  supplements,
} from '@/lib/schema-postgres';
import { runAudit, type AuditBiometrics, type AuditSupplement } from '@/lib/audit-engine';
import { generateSchedule } from '@/lib/scheduler-engine';
import { checkRateLimit, clientKey, rateLimitResponse } from '@/lib/rate-limit';
import { createClient } from '../../../../utils/supabase/server';

// Audit doesn't call any paid API but it does run several DB queries +
// the scheduler engine. 60/hour per IP is plenty for legitimate use and
// stops a runaway loop or scraper from hammering the DB.
const AUDIT_LIMIT_PER_HOUR = 60;

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;

  const limit = checkRateLimit(
    `audit:${clientKey(request, userId)}`,
    AUDIT_LIMIT_PER_HOUR,
    60 * 60 * 1000,
  );
  if (!limit.allowed) return rateLimitResponse(limit);

  const payload = await request.json().catch(() => ({}));
  const supplementIds = Array.isArray(payload?.supplementIds)
    ? payload.supplementIds.map(String).map((s: string) => s.trim()).filter(Boolean)
    : [];
  const medications = Array.isArray(payload?.medications)
    ? payload.medications.map(normalizeMedication).filter(Boolean)
    : [];
  const biometrics = normalizeBiometrics(payload?.biometrics);

  if (supplementIds.length === 0) {
    return NextResponse.json({ error: 'Missing or empty supplementIds array.' }, { status: 400 });
  }

  const allSupplementsResult = await Promise.allSettled([
    db.select({
      id: supplements.id,
      slug: supplements.slug,
      name: supplements.name,
    }).from(supplements),
  ]);

  const allSupplements = allSupplementsResult[0].status === 'fulfilled' ? allSupplementsResult[0].value : [];
  const wanted = new Set(supplementIds);
  const selectedSupplements: AuditSupplement[] = allSupplements
    .filter((supp) => wanted.has(supp.id) || wanted.has(supp.slug))
    .map((supp) => ({ id: supp.id, slug: supp.slug, name: supp.name }));

  const selectedIds = selectedSupplements.map((supp) => supp.id);
  const selectedSlugs = selectedSupplements.map((supp) => supp.slug);

  const [interactionsResult, conflictsResult, dosagesResult, scheduleResult] = await Promise.allSettled([
    selectedIds.length > 0
      ? db.select().from(medicineInteractions).where(inArray(medicineInteractions.supplementId, selectedIds))
      : Promise.resolve([]),
    db.select().from(supplementConflicts),
    selectedIds.length > 0
      ? db.select({
        supplementId: supplementDosage.supplementId,
        perKgFactor: supplementDosage.perKgFactor,
        unit: supplementDosage.unit,
        maintenance: supplementDosage.maintenance,
      }).from(supplementDosage).where(inArray(supplementDosage.supplementId, selectedIds))
      : Promise.resolve([]),
    selectedSlugs.length > 0
      ? generateSchedule({ supplements: selectedSlugs, medications })
      : Promise.resolve({ blocks: [], warnings: [], generatedAt: new Date().toISOString() }),
  ]);

  const findings = runAudit({
    supplements: selectedSupplements,
    medications,
    biometrics,
    medicineInteractions: interactionsResult.status === 'fulfilled' ? interactionsResult.value : [],
    supplementConflicts: conflictsResult.status === 'fulfilled' ? conflictsResult.value : [],
    dosages: dosagesResult.status === 'fulfilled' ? dosagesResult.value : [],
    schedulerWarnings: scheduleResult.status === 'fulfilled' ? scheduleResult.value.warnings : [],
  });

  if (userId) {
    await db.insert(auditSessions).values({
      id: `audit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      userId,
      stackSnapshot: { supplements: selectedSlugs, medications, biometrics },
      findings,
    }).catch(() => undefined);
  }

  return NextResponse.json({ findings });
}

function normalizeMedication(value: unknown): string {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeBiometrics(value: unknown): AuditBiometrics | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as { weightKg?: unknown; heightCm?: unknown };
  const biometrics: AuditBiometrics = {};
  if (typeof raw.weightKg === 'number' && raw.weightKg > 0) biometrics.weightKg = raw.weightKg;
  if (typeof raw.heightCm === 'number' && raw.heightCm > 0) biometrics.heightCm = raw.heightCm;
  return Object.keys(biometrics).length > 0 ? biometrics : undefined;
}
