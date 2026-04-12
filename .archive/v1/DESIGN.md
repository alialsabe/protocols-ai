# Protocols.ai Design System

## Color Tokens

```ts
const T = {
  bg:          '#09090b',     // Page background
  card:        '#111113',     // Card/panel background
  elevated:    '#18181b',     // Elevated surfaces (inputs, dropdowns)
  accent:      '#06d6a0',     // Primary accent (mint green)
  accentDim:   'rgba(6,214,160,0.08)',  // Accent tint for backgrounds
  accentMid:   'rgba(6,214,160,0.15)',  // Medium accent tint
  accentGlow:  'rgba(6,214,160,0.25)',  // Glow/shadow accent
  border:      'rgba(255,255,255,0.06)', // Default borders
  borderHover: 'rgba(255,255,255,0.12)', // Hover borders
  sky:         '#38bdf8',     // Info/low severity
  amber:       '#fbbf24',     // Warning/moderate severity
  rose:        '#fb7185',     // Error/high severity
  zinc:        '#71717a',     // Secondary text
};
// White text: #fafafa (headings), #a1a1aa (body), #52525b (tertiary)
```

## Typography

- **UI font:** Outfit (variable, `--font-outfit`)
- **Mono font:** Geist Mono (variable, `--font-geist-mono`)
- **Headings:** 22-28px, font-extrabold, tracking-[-0.4px to -0.6px], color #fafafa
- **Body:** 13-15px, font-medium to font-semibold
- **Labels:** 10-11px, font-bold, uppercase tracking-[1.4px] for section headers
- **Mono data:** `fontFamily: 'var(--font-geist-mono), monospace'`

## Responsive Breakpoints

| Range | Layout | Nav |
|-------|--------|-----|
| <768px (mobile) | Single column, `px-4 py-6`, `pb-24` for tab bar | Bottom tab bar (4 icons) |
| 768-1024px (tablet) | `px-8 py-10` | Icon-only sidebar (60px) |
| >1024px (desktop) | `px-14 py-12`, max-w-6xl | Full sidebar (260px) |

## Component Patterns

### Card
`rounded-2xl` with `background: T.card`, `border: 1px solid T.border`, `box-shadow: inset 0 1px 0 rgba(255,255,255,0.04)`.

### Button
Primary: `background: T.accent`, `color: T.bg`, rounded-xl, font-bold.
Ghost: transparent with accent border on hover.

### Badge/Pill
`text-[10px] font-bold px-[10px] py-[4px] rounded-[8px]` with tinted background.

### Severity Rows (Medicine Interactions, Conflicts)
Full-width rows with 4px left severity stripe + right badge pill. NOT colored card backgrounds.
- HIGH: T.rose
- MODERATE: T.amber
- LOW: T.sky

## Anti-AI-Slop Rules

1. No colored card backgrounds for severity — use left stripe + badge pill
2. No symmetric 3-column feature grids
3. Catalog: blended images, 1-2 tag pills max per card
4. Affiliate CTA: horizontal strip, not card-with-icon
5. Avoid decorative gradients on content cards
