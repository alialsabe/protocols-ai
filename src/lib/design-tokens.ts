/**
 * ProtocolsAI design tokens
 * Mirrors the inline `T` object in Dashboard.tsx.
 * Use these in new components so Comparison / Advisor / sharing pages
 * stay visually consistent.
 *
 * See DESIGN.md for the canonical rationale.
 */
export const T = {
  bg:          '#09090b',
  card:        '#111113',
  elevated:    '#18181b',
  accent:      '#06d6a0',
  accentDim:   'rgba(6,214,160,0.08)',
  accentMid:   'rgba(6,214,160,0.15)',
  accentGlow:  'rgba(6,214,160,0.25)',
  border:      'rgba(255,255,255,0.06)',
  borderHover: 'rgba(255,255,255,0.12)',
  sky:         '#38bdf8',
  amber:       '#fbbf24',
  rose:        '#fb7185',
  zinc:        '#71717a',
} as const;

export type DesignTokens = typeof T;
