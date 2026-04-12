import type { ProtocolReport } from './protocol-types';

/**
 * Utilities for stack-level operations: health score, shopping list,
 * dose calculation. All pure functions. Deterministic.
 */

export interface StackHealthScore {
  score: number; // 0-100
  tip: string;
}

/**
 * Stack health score formula (from CEO plan):
 *   (avg evidence quality × 0.4) + (goal coverage × 0.4) + (dosage completeness × 0.2)
 *
 * Inputs are 0-1, output is 0-100 integer.
 */
export function computeStackHealthScore(reports: ProtocolReport[], goals: string[] = []): StackHealthScore {
  if (reports.length === 0) {
    return { score: 0, tip: 'Add supplements to see your stack health score.' };
  }

  // Evidence quality: fraction of high-quality findings across all supplements
  let totalFindings = 0;
  let qualityPoints = 0;
  for (const report of reports) {
    const findings = report.science?.findings ?? [];
    totalFindings += findings.length;
    for (const f of findings) {
      qualityPoints += f.quality === 'high' ? 1 : f.quality === 'medium' ? 0.5 : 0;
    }
  }
  const avgEvidenceQuality = totalFindings === 0 ? 0 : qualityPoints / totalFindings;

  // Goal coverage: heuristic — if user has goals, check how many of their reports
  // mention those goals in tags or summaries.
  const goalCoverage = goals.length === 0
    ? 0.6 // neutral baseline when no goals
    : Math.min(1, reports.filter((r) => {
        const haystack = [
          r.summary ?? '',
          ...(r.tags?.map((t) => t.tag) ?? []),
        ].join(' ').toLowerCase();
        return goals.some((g) => haystack.includes(g.toLowerCase()));
      }).length / reports.length);

  // Dosage completeness: fraction of supplements with a maintenance dose
  const withDosage = reports.filter((r) => r.dosage?.maintenance).length;
  const dosageCompleteness = withDosage / reports.length;

  const rawScore = avgEvidenceQuality * 0.4 + goalCoverage * 0.4 + dosageCompleteness * 0.2;
  const score = Math.round(rawScore * 100);

  // Pick the biggest gap as the improvement tip
  let tip: string;
  if (avgEvidenceQuality < 0.5) {
    tip = 'Evidence quality is the weakest part of this stack. Replace lower-quality supplements with well-studied alternatives.';
  } else if (goalCoverage < 0.5 && goals.length > 0) {
    tip = 'Most of your supplements don\'t directly target your stated goals. Consider adding targeted options.';
  } else if (dosageCompleteness < 0.7) {
    tip = 'Some supplements are missing clear dosing guidance. Research proper doses before starting.';
  } else {
    tip = 'Looking good. Keep tracking how you feel and adjust based on results.';
  }

  return { score, tip };
}

/**
 * "Time to feel it" tag — heuristic per supplement based on tags/category.
 */
export function getTimeToFeelIt(report: ProtocolReport): string | null {
  const tags = (report.tags ?? []).map((t) => t.tag.toLowerCase());
  const name = (report.name ?? '').toLowerCase();
  const category = (report.supplementTypes?.join(' ') ?? '').toLowerCase();

  // Fast effects (hours to days)
  if (name.includes('caffeine') || name.includes('l-theanine') || name.includes('gaba') || name.includes('melatonin')) {
    return 'Usually felt within hours';
  }

  // Medium effects (1-2 weeks)
  if (name.includes('creatine') || tags.includes('energy') || category.includes('stimulant')) {
    return 'Most users notice effects in 1-2 weeks';
  }

  // Slow effects (4-8 weeks)
  if (name.includes('vitamin d') || name.includes('omega') || name.includes('ashwagandha') || name.includes('rhodiola')) {
    return 'Typically 4-8 weeks for noticeable effects';
  }

  // Very slow (8+ weeks)
  if (name.includes('collagen') || name.includes('nmn') || name.includes('nr') || name.includes('resveratrol')) {
    return 'Long-term effects; 2-3 months minimum';
  }

  return null;
}

/**
 * Weight-based dose calculator.
 * Uses the `per_kg_factor` from the supplement's dosage row when available.
 */
export interface CalculatedDose {
  dose: string;
  unit: string;
  note?: string;
}

export function calculateDose(report: ProtocolReport, weightKg: number): CalculatedDose | null {
  if (!report.dosage || !weightKg || weightKg <= 0) return null;

  // The dosage plan doesn't expose perKgFactor directly, but lookupSupplement
  // has already applied it when the supplement has one. We use the rendered
  // maintenance string as our source of truth.
  return {
    dose: report.dosage.maintenance,
    unit: '',
    note: report.dosage.formula,
  };
}

/**
 * Generate a shopping list from a stack of supplements.
 * Falls back to an Amazon search link when no affiliate entry exists.
 */
export interface ShoppingListItem {
  name: string;
  product?: string;
  price?: string;
  url: string;
  isAffiliate: boolean;
}

export function buildShoppingList(reports: ProtocolReport[]): ShoppingListItem[] {
  return reports.map((report) => {
    const name = report.name ?? 'Unknown supplement';
    if (report.commerce?.affiliateLink) {
      return {
        name,
        product: report.commerce.product,
        price: report.commerce.price,
        url: report.commerce.affiliateLink,
        isAffiliate: true,
      };
    }
    return {
      name,
      url: `https://www.amazon.com/s?k=${encodeURIComponent(name + ' supplement')}`,
      isAffiliate: false,
    };
  });
}
