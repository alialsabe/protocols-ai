/** Protocols.ai design tokens — single source of truth */
export const T = {
  // Backgrounds
  bg: '#09090b',
  card: '#111113',
  elevated: '#18181b',
  surface: 'rgba(255,255,255,0.03)',

  // Brand
  accent: '#06d6a0',
  accentDim: 'rgba(6,214,160,0.08)',
  accentMid: 'rgba(6,214,160,0.15)',
  accentGlow: 'rgba(6,214,160,0.25)',
  sky: '#0ea5e9',
  skyDim: 'rgba(14,165,233,0.08)',

  // Semantic
  amber: '#fbbf24',
  rose: '#fb7185',
  purple: '#a78bfa',

  // Text — note: body text is off-white per dark mode best practice
  text: '#e8e8e8',
  textMuted: '#a1a1aa',
  textDim: '#71717a',
  textFaint: '#52525b',

  // Borders
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(255,255,255,0.12)',
  borderAccent: 'rgba(6,214,160,0.18)',
} as const;

/** Tag color helper based on tag content */
export function tagColors(tag: string, tagType: string) {
  const t = tag.toLowerCase();
  if (tagType === 'category') {
    if (t.includes('sleep')) return { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)', color: T.amber };
    if (t.includes('heart') || t.includes('cardio')) return { bg: 'rgba(251,113,133,0.08)', border: 'rgba(251,113,133,0.2)', color: T.rose };
    if (t.includes('immun')) return { bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.2)', color: T.sky };
    return { bg: T.accentDim, border: T.borderAccent, color: T.accent };
  }
  if (t.includes('sleep') || t.includes('relax')) return { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)', color: T.amber };
  if (t.includes('heart') || t.includes('blood')) return { bg: 'rgba(251,113,133,0.08)', border: 'rgba(251,113,133,0.2)', color: T.rose };
  return { bg: T.skyDim, border: 'rgba(56,189,248,0.18)', color: T.sky };
}

/** Supplement image map */
const SUPPLEMENT_IMAGE_MAP: [string, string][] = [
  ['ashwagandha', '/images/supplements/v3/ashwagandha.webp'],
  ['berberine', '/images/supplements/v3/berberine.webp'],
  ['boron', '/images/supplements/v3/boron.webp'],
  ['theanine', '/images/supplements/v3/l-theanine.webp'],
  ['lion', '/images/supplements/v3/lions-mane.webp'],
  ['melatonin', '/images/supplements/v3/melatonin.webp'],
  ['omega', '/images/supplements/v3/omega-3.webp'],
  ['rhodiola', '/images/supplements/v3/rhodiola.webp'],
  ['turkey', '/images/supplements/v3/turkey-tail.webp'],
  ['b12', '/images/supplements/v3/vitamin-b12.webp'],
];

export function getSupplementImage(name: string): string | null {
  const lower = name.toLowerCase();
  for (const [key, path] of SUPPLEMENT_IMAGE_MAP) {
    if (lower.includes(key)) return path;
  }
  return null;
}

/** Category icon fallback for supplements without images */
export function getCategoryIcon(types: string[]): string {
  const joined = types.join(' ').toLowerCase();
  if (joined.includes('vitamin')) return '💊';
  if (joined.includes('mineral')) return '⚡';
  if (joined.includes('amino')) return '🧬';
  if (joined.includes('herb') || joined.includes('botanical')) return '🌿';
  if (joined.includes('mushroom') || joined.includes('fungi')) return '🍄';
  if (joined.includes('nootropic')) return '🧠';
  if (joined.includes('longevity')) return '⏳';
  if (joined.includes('protein')) return '💪';
  return '⚗️';
}
