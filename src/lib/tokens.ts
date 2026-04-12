export const T = {
  bg: '#09090b',
  surface: '#111113',
  surfaceRaise: '#18181b',
  surfaceSink: '#050506',

  hair: 'rgba(255,255,255,0.06)',
  hairStrong: 'rgba(255,255,255,0.12)',
  hairAccent: 'rgba(6,214,160,0.25)',

  accent: '#06d6a0',
  accentDim: 'rgba(6,214,160,0.08)',
  accentMid: 'rgba(6,214,160,0.15)',
  accentGlow: 'rgba(6,214,160,0.25)',

  high: '#fb7185',
  mid: '#fbbf24',
  low: '#38bdf8',

  fg: '#fafafa',
  fgMuted: '#a1a1aa',
  fgDim: '#71717a',
  fgFaint: '#52525b',
} as const;

export const typography = {
  display: 'text-[56px] leading-[60px] font-extrabold tracking-[-1.2px]',
  h1: 'text-[32px] leading-[38px] font-extrabold tracking-[-0.6px]',
  h2: 'text-[22px] leading-[28px] font-extrabold tracking-[-0.4px]',
  h3: 'text-[16px] leading-[22px] font-semibold tracking-[-0.2px]',
  body: 'text-[15px] leading-[24px] font-medium',
  bodySm: 'text-[13px] leading-[20px] font-medium',
  label: 'text-[11px] leading-[14px] font-bold tracking-[1.4px] uppercase',
  meta: 'text-[11px] leading-[14px] font-medium',
  mono: 'text-[13px] leading-[18px] font-medium font-mono',
  monoSm: 'text-[11px] leading-[14px] font-medium font-mono',
} as const;
