import type { SchedulerWarning } from './protocol-types';

export type AuditCategory =
  | 'drug_supplement_interactions'
  | 'supplement_supplement_conflicts'
  | 'timing_issues'
  | 'redundancies'
  | 'dosing_concerns';

export type AuditSeverity = 'high' | 'medium' | 'low' | 'info';

export interface AuditFinding {
  category: AuditCategory;
  severity: AuditSeverity;
  title: string;
  rationale: string;
  refs?: string[];
  details?: string;
}

export interface AuditSupplement {
  id: string;
  slug: string;
  name: string;
  currentDoseMg?: number;
}

export interface AuditBiometrics {
  weightKg?: number;
  heightCm?: number;
}

export interface AuditMedicineInteractionRow {
  supplementId: string;
  medicineName: string;
  medicineClass: string | null;
  severity: string;
  mechanism: string;
  recommendation: string;
  source: string | null;
}

export interface AuditConflictRow {
  supplementAId: string;
  supplementBId: string;
  conflictType: string;
  minSpacingHours: number | null;
  mechanism: string;
  severity: string;
}

export interface AuditDosageRow {
  supplementId: string;
  perKgFactor: number | null;
  unit: string;
  maintenance: string;
}

export interface RunAuditInput {
  supplements: AuditSupplement[];
  medications: string[];
  biometrics?: AuditBiometrics;
  medicineInteractions?: AuditMedicineInteractionRow[];
  supplementConflicts?: AuditConflictRow[];
  schedulerWarnings?: SchedulerWarning[];
  dosages?: AuditDosageRow[];
}

export interface RedundancyRule {
  id: string;
  triggerA: string[];
  triggerB: string[];
  severity: Extract<AuditSeverity, 'info' | 'low' | 'medium'>;
  title: string;
  rationale: string;
}

export const REDUNDANCY_RULES: RedundancyRule[] = [
  {
    id: 'b-complex-b12',
    triggerA: ['b-complex', 'vitamin-b-complex'],
    triggerB: ['vitamin-b12', 'b12', 'methylcobalamin', 'cyanocobalamin'],
    severity: 'medium',
    title: 'B-complex overlaps with standalone B12',
    rationale: 'Most B-complex formulas already include B12; keep the standalone only when deficiency or labs justify it.',
  },
  {
    id: 'multivitamin-vitamin-d',
    triggerA: ['multivitamin', 'mens-multivitamin', 'womens-multivitamin'],
    triggerB: ['vitamin-d', 'vitamin-d3', 'cholecalciferol'],
    severity: 'low',
    title: 'Multivitamin adds to standalone vitamin D',
    rationale: 'Count vitamin D from both products so the combined dose matches your 25(OH)D target.',
  },
  {
    id: 'magnesium-oxide-glycinate',
    triggerA: ['magnesium-oxide'],
    triggerB: ['magnesium-glycinate'],
    severity: 'medium',
    title: 'Magnesium oxide duplicates magnesium glycinate',
    rationale: 'Magnesium oxide is poorly absorbed; glycinate is usually the more efficient single form.',
  },
  {
    id: 'omega3-fish-oil',
    triggerA: ['omega-3', 'omega-3-fish-oil'],
    triggerB: ['fish-oil', 'krill-oil'],
    severity: 'low',
    title: 'Multiple omega-3 products overlap',
    rationale: 'EPA and DHA add across fish, krill, and omega-3 capsules; total the label amounts before dosing.',
  },
  {
    id: 'zinc-multivitamin',
    triggerA: ['zinc', 'zinc-picolinate', 'zinc-glycinate'],
    triggerB: ['multivitamin', 'mens-multivitamin', 'womens-multivitamin'],
    severity: 'info',
    title: 'Zinc may already be in the multivitamin',
    rationale: 'Many multivitamins include zinc; extra zinc can crowd copper if taken long term.',
  },
  {
    id: 'vitamin-c-multivitamin',
    triggerA: ['vitamin-c', 'ascorbic-acid'],
    triggerB: ['multivitamin', 'mens-multivitamin', 'womens-multivitamin'],
    severity: 'info',
    title: 'Vitamin C overlaps with the multivitamin',
    rationale: 'This is usually harmless, but the standalone may not add value unless you are targeting a specific protocol.',
  },
  {
    id: 'calcium-multivitamin',
    triggerA: ['calcium', 'calcium-citrate', 'calcium-carbonate'],
    triggerB: ['multivitamin', 'mens-multivitamin', 'womens-multivitamin'],
    severity: 'low',
    title: 'Calcium can duplicate minerals in the multivitamin',
    rationale: 'Check the mineral panel before stacking calcium on top of a multi, especially if dietary calcium is high.',
  },
];

const severityRank: Record<AuditSeverity, number> = { high: 0, medium: 1, low: 2, info: 3 };

export function runAudit(input: RunAuditInput): AuditFinding[] {
  return sortFindings([
    ...findDrugSupplementInteractions(input),
    ...findSupplementSupplementConflicts(input),
    ...findTimingIssues(input),
    ...findRedundancies(input),
    ...findDosingConcerns(input),
  ]);
}

export function sortFindings(findings: AuditFinding[]): AuditFinding[] {
  return [...findings].sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}

export function findDrugSupplementInteractions(input: RunAuditInput): AuditFinding[] {
  const meds = input.medications.map(normalizeName).filter(Boolean);
  if (input.supplements.length === 0 || meds.length === 0) return [];

  const byId = supplementMap(input.supplements);
  return (input.medicineInteractions ?? [])
    .filter((row) => byId.has(row.supplementId))
    .filter((row) => {
      const medName = normalizeName(row.medicineName);
      const medClass = normalizeName(row.medicineClass ?? '');
      return meds.some((med) => medName.includes(med) || med.includes(medName) || (medClass && medClass.includes(med)));
    })
    .map((row) => {
      const supp = byId.get(row.supplementId)!;
      return {
        category: 'drug_supplement_interactions',
        severity: normalizeAuditSeverity(row.severity),
        title: `${supp.name} + ${row.medicineName}`,
        rationale: compactSentence([row.mechanism, row.recommendation].filter(Boolean).join(' ')),
        refs: row.source ? [row.source] : undefined,
      };
    });
}

export function findSupplementSupplementConflicts(input: RunAuditInput): AuditFinding[] {
  if (input.supplements.length < 2) return [];
  const byId = supplementMap(input.supplements);
  const ids = new Set(input.supplements.map((s) => s.id));

  return (input.supplementConflicts ?? [])
    .filter((row) => ids.has(row.supplementAId) && ids.has(row.supplementBId))
    .map((row) => {
      const a = byId.get(row.supplementAId)!;
      const b = byId.get(row.supplementBId)!;
      const spacing = row.minSpacingHours ? ` Space ${row.minSpacingHours}h apart.` : '';
      return {
        category: 'supplement_supplement_conflicts',
        severity: normalizeAuditSeverity(row.severity),
        title: `${a.name} + ${b.name}`,
        rationale: compactSentence(`${row.mechanism}${spacing}`),
        details: row.conflictType,
      };
    });
}

export function findTimingIssues(input: RunAuditInput): AuditFinding[] {
  return (input.schedulerWarnings ?? []).map((warning) => ({
    category: 'timing_issues',
    severity: warning.severity === 'critical' ? 'high' : warning.severity === 'warning' ? 'medium' : 'info',
    title: timingTitle(warning),
    rationale: warning.message,
    details: warning.supplements.join(', '),
  }));
}

export function findRedundancies(input: RunAuditInput): AuditFinding[] {
  const slugs = new Set(input.supplements.map((s) => s.slug));
  return REDUNDANCY_RULES.filter((rule) => hasAny(slugs, rule.triggerA) && hasAny(slugs, rule.triggerB))
    .map((rule) => ({
      category: 'redundancies',
      severity: rule.severity,
      title: rule.title,
      rationale: rule.rationale,
      details: rule.id,
    }));
}

export function findDosingConcerns(input: RunAuditInput): AuditFinding[] {
  if (input.supplements.length === 0) return [];
  const byId = supplementMap(input.supplements);
  const weightKg = input.biometrics?.weightKg;
  const findings: AuditFinding[] = [];

  for (const dosage of input.dosages ?? []) {
    const supp = byId.get(dosage.supplementId);
    if (!supp) continue;

    const currentDose = supp.currentDoseMg ?? parseFirstDoseMg(dosage.maintenance, dosage.unit);
    if (!currentDose) continue;

    if (weightKg && dosage.perKgFactor && dosage.unit.toLowerCase() === 'mg') {
      const target = dosage.perKgFactor * weightKg;
      if (currentDose < target * 0.75) {
        findings.push({
          category: 'dosing_concerns',
          severity: 'low',
          title: `${supp.name} may be under clinical dose`,
          rationale: `${formatDose(currentDose)} is below the weight-based target of about ${formatDose(target)}.`,
        });
      } else if (currentDose > target * 1.5) {
        findings.push({
          category: 'dosing_concerns',
          severity: 'medium',
          title: `${supp.name} may be above clinical dose`,
          rationale: `${formatDose(currentDose)} is above the weight-based target of about ${formatDose(target)}.`,
        });
      }
      continue;
    }

    const band = parseDoseBandMg(dosage.maintenance, dosage.unit);
    if (!band) continue;
    if (currentDose < band.min) {
      findings.push({
        category: 'dosing_concerns',
        severity: 'low',
        title: `${supp.name} may be below typical clinical range`,
        rationale: `${formatDose(currentDose)} is below the listed range of ${formatDose(band.min)}-${formatDose(band.max)}.`,
      });
    } else if (currentDose > band.max) {
      findings.push({
        category: 'dosing_concerns',
        severity: 'medium',
        title: `${supp.name} may exceed typical clinical range`,
        rationale: `${formatDose(currentDose)} is above the listed range of ${formatDose(band.min)}-${formatDose(band.max)}.`,
      });
    }
  }

  return findings;
}

function supplementMap(supplements: AuditSupplement[]) {
  return new Map(supplements.map((s) => [s.id, s]));
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeAuditSeverity(value: string): AuditSeverity {
  const v = value.toLowerCase();
  if (v === 'contraindicated' || v === 'critical' || v === 'high') return 'high';
  if (v === 'moderate' || v === 'medium' || v === 'warning') return 'medium';
  if (v === 'low') return 'low';
  return 'info';
}

function hasAny(slugs: Set<string>, triggers: string[]) {
  return triggers.some((trigger) => slugs.has(trigger));
}

function timingTitle(warning: SchedulerWarning) {
  if (warning.type === 'spacing') return 'Spacing issue';
  if (warning.type === 'food') return 'Timing with food';
  if (warning.type === 'medication') return 'Medication timing warning';
  return 'Schedule conflict';
}

function compactSentence(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function parseFirstDoseMg(text: string, unit: string): number | undefined {
  const band = parseDoseBandMg(text, unit);
  return band?.min;
}

function parseDoseBandMg(text: string, unit: string): { min: number; max: number } | undefined {
  if (unit.toLowerCase() !== 'mg') return undefined;
  const nums = text.match(/\d+(?:\.\d+)?/g)?.map(Number).filter((n) => Number.isFinite(n) && n > 0) ?? [];
  if (nums.length === 0) return undefined;
  if (nums.length === 1) return { min: nums[0], max: nums[0] };
  return { min: Math.min(nums[0], nums[1]), max: Math.max(nums[0], nums[1]) };
}

function formatDose(value: number) {
  return `${Math.round(value)}mg`;
}
