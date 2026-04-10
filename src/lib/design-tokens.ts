/** Protocols.ai design tokens — Vanguard Clinical theme */
export const T = {
  // Backgrounds — deep navy
  bg: '#0b1326',
  bgGradientEnd: '#131b2e',
  card: 'rgba(30, 41, 59, 0.4)',
  cardHover: 'rgba(30, 41, 59, 0.6)',
  elevated: '#222a3d',
  surface: 'rgba(45, 52, 73, 0.5)',
  surfaceLow: '#131b2e',
  glass: 'rgba(30, 41, 59, 0.6)',

  // Brand — blue spectrum
  primary: '#adc6ff',
  primaryContainer: '#4d8eff',
  primaryDim: 'rgba(173, 198, 255, 0.1)',
  primaryGlow: 'rgba(77, 142, 255, 0.2)',
  secondary: '#c0c1ff',
  secondaryContainer: '#3131c0',
  tertiary: '#ffb786',
  tertiaryContainer: '#df7412',

  // Semantic
  error: '#ffb4ab',
  errorContainer: '#93000a',

  // Text
  text: '#dae2fd',
  textMuted: '#c5c6cd',
  textDim: '#94a3b8',
  textFaint: '#64748b',
  textOnPrimary: '#002e6a',

  // Borders
  border: 'rgba(255, 255, 255, 0.05)',
  borderHover: 'rgba(255, 255, 255, 0.1)',
  borderAccent: 'rgba(173, 198, 255, 0.2)',
  outline: '#8f9097',
  outlineVariant: '#45474c',
} as const;

/** Tag color helper based on tag content */
export function tagColors(tag: string, tagType: string) {
  const t = tag.toLowerCase();
  if (tagType === 'category') {
    if (t.includes('sleep')) return { bg: 'rgba(255, 183, 134, 0.1)', border: 'rgba(255, 183, 134, 0.2)', color: T.tertiary };
    if (t.includes('heart') || t.includes('cardio')) return { bg: 'rgba(255, 180, 171, 0.1)', border: 'rgba(255, 180, 171, 0.2)', color: T.error };
    if (t.includes('immun')) return { bg: 'rgba(192, 193, 255, 0.1)', border: 'rgba(192, 193, 255, 0.2)', color: T.secondary };
    return { bg: T.primaryDim, border: T.borderAccent, color: T.primary };
  }
  if (t.includes('sleep') || t.includes('relax')) return { bg: 'rgba(255, 183, 134, 0.1)', border: 'rgba(255, 183, 134, 0.2)', color: T.tertiary };
  if (t.includes('heart') || t.includes('blood')) return { bg: 'rgba(255, 180, 171, 0.1)', border: 'rgba(255, 180, 171, 0.2)', color: T.error };
  return { bg: 'rgba(192, 193, 255, 0.1)', border: 'rgba(192, 193, 255, 0.2)', color: T.secondary };
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

/** Category accent color — gives each category a distinct color from the spectrum */
export function categoryAccentColor(types: string[]): string {
  const joined = types.join(' ').toLowerCase();
  if (joined.includes('nootropic') || joined.includes('cognitive')) return T.secondary;
  if (joined.includes('strength') || joined.includes('ergogenic')) return T.tertiary;
  if (joined.includes('longevity')) return T.primary;
  if (joined.includes('sleep') || joined.includes('adaptogen')) return T.tertiary;
  if (joined.includes('metabolic')) return T.primary;
  return T.primary;
}
