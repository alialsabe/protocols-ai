# Design — Stack Lab

A locked design system for Stack Lab. The product should feel like a calm clinical workbench for managing supplements and peptide protocols, not a wellness storefront or a generic SaaS landing page.

## Genre

Modern-minimal, clinical, warm, and information-first.

## Macrostructure family

- Marketing and entry pages: Split Diptych, with product intent on one side and a working protocol surface on the other.
- App pages: Workbench, with a compact horizontal route rail and the task surface using the full content width.
- Research pages: Long Document, with evidence, dosage, interactions, and sources forming the rhythm.

## Theme

- Paper: warm off-white with quiet sage secondary surfaces.
- Ink: near-black green, never pure black.
- Accent: deep botanical green, used for actions, progress, focus, and active state only.
- Rules: low-chroma sage hairlines.
- Status colours: green for strong evidence, ochre for moderate evidence, brick for weak or conflicting evidence.

Exact OKLCH values live in `tokens.css`. Components consume named tokens only.

## Typography

- Display: Outfit, weight 700–800, roman.
- Body: Outfit, weight 400–600.
- Data and metadata: Geist Mono, weight 500–650.
- Display tracking: -0.04em to -0.055em.
- Hero copy stays under 50 characters when possible and uses a 1.0–1.08 line height.
- Numeric values, evidence grades, times, dosages, and counts use the mono face.

## Spacing

A 4-point named scale is defined in `tokens.css`. Pages use the named scale rather than new one-off values.

## Motion

- Ease out: `cubic-bezier(0.16, 1, 0.3, 1)`.
- Use transform and opacity only.
- Product screens use restrained motion: press feedback, focus changes, and short state transitions.
- Reduced motion becomes opacity-only at 120ms or less.

## Microinteractions stance

- Silent success for logging and saving.
- Visible focus rings with no animated delay.
- Hover is never the only way to reveal a required action.
- Disabled controls use native attributes, muted surfaces, and `cursor: not-allowed`.

## CTA voice

- Primary: deep green fill, warm-paper text, 10px radius, concise verb-led label.
- Secondary: transparent surface with a sage rule.
- Labels never wrap.

## Per-page allowances

- Entry pages may use one working product panel as the visual anchor.
- App pages use no decorative enrichment; the schedule, stack, and evidence carry the page.
- Research pages use typography and rules rather than illustration.

## What pages MUST share

- Stack Lab / Revive One brand lockup.
- Botanical accent placement under roughly 5% of each viewport.
- Outfit + Geist Mono pairing.
- Button shape and interaction language.
- Warm paper surfaces, quiet rules, and mono metadata.
- Navigation and footer archetypes.

## What pages MAY differ on

- Content density and section rhythm.
- Whether the primary workspace is a schedule, editor, audit, or research document.
- Use of one discrete card when it is the unit of interaction.

## Navigation and footer

- Navigation: N1b instrument bar, wordmark left, three route destinations centered, membership/account status right. No marketing CTA.
- Routine sub-navigation: one horizontal workbench rail on every viewport; it may scroll on narrow screens.
- Footer: Ft2 inline rule, a compact disclosure and legal line rather than a four-column sitemap.

## Responsive floor

- Verify 320, 375, 414, 768, and 1280×800.
- `html` and `body` use `overflow-x: clip`.
- Clickable labels never wrap.
- Display headings use `overflow-wrap: anywhere` and `min-width: 0`.
- Data tables collapse or simplify rather than forcing horizontal page overflow.

## Exports

The canonical CSS export is `tokens.css`. Tailwind consumes the same values through aliases in `src/app/globals.css`.
