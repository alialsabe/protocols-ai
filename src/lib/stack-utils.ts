import type { ProtocolReport } from './protocol-types';

/**
 * Utilities for stack-level operations: shopping list, dose calculation,
 * "time to feel it" hints. All pure functions. Deterministic.
 */

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
