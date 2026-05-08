// Shared rarity / evidence-grade derivation. Used by HomepageClient and
// StackBuilder to render consistent letter-grade + rarity tier pills.

export type GradeTier = 'a' | 'b' | 'c';
export type Rarity = 'common' | 'rare' | 'legendary';

export interface SupplementGrade {
  tier: GradeTier;
  label: string;          // 'A' | 'B' | 'C'
  rarity: Rarity;
}

/** Derive a letter grade + rarity tier from study count. */
export function gradeFromCount(n: number): SupplementGrade {
  if (n >= 8) return { tier: 'a', label: 'A', rarity: 'legendary' };
  if (n >= 5) return { tier: 'a', label: 'A', rarity: 'rare' };
  if (n >= 2) return { tier: 'b', label: 'B', rarity: 'common' };
  return { tier: 'c', label: 'C', rarity: 'common' };
}

export const RARITY_LABEL: Record<Rarity, string> = {
  common: '★',
  rare: '★★★',
  legendary: '★★★★',
};
