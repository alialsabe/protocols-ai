# Stack Lab Design System — v2 (Instrument Panel)

**Aesthetic thesis.** Not a SaaS marketing site. Not a wellness app. This is a **scientific instrument** for supplements. Linear meets molecular biology lab meets Bloomberg terminal. Every decision pushes toward: *serious, high-signal, data-dense, calm*.

Three words that should describe every screen: **quiet · precise · authoritative**.

Three words that should never apply: **playful · gradient · cozy**.

---

## 1. Tokens

### 1.1 Color

```ts
const T = {
  // Surfaces
  bg:           '#09090b',  // page
  surface:      '#111113',  // card / panel
  surfaceRaise: '#18181b',  // input, dropdown, hover
  surfaceSink:  '#050506',  // inset (terminal, code, preformatted)

  // Borders — hairlines only
  hair:         'rgba(255,255,255,0.06)',
  hairStrong:   'rgba(255,255,255,0.12)',
  hairAccent:   'rgba(6,214,160,0.25)',

  // Accent — mint is a SIGNAL, not decoration
  accent:       '#06d6a0',
  accentDim:    'rgba(6,214,160,0.08)',
  accentMid:    'rgba(6,214,160,0.15)',
  accentGlow:   'rgba(6,214,160,0.25)',

  // Severity (interactions, evidence quality)
  high:         '#fb7185',  // rose — HIGH severity / contraindicated
  mid:          '#fbbf24',  // amber — MODERATE / caution
  low:          '#38bdf8',  // sky — LOW / informational

  // Text
  fg:           '#fafafa',  // primary headings
  fgMuted:      '#a1a1aa',  // body
  fgDim:        '#71717a',  // secondary / labels
  fgFaint:      '#52525b',  // tertiary / hints
};
```

**Rules.**
- Mint (`accent`) appears only on: active focus rings, primary CTAs, "positive delta" data, and the scanning beam. Max 3 mint elements per viewport.
- No purple, violet, indigo, or blue-to-purple gradients anywhere. Ever.
- No colored card backgrounds for severity. Severity is communicated by a 4px left stripe + a badge pill on the right.
- No large solid color blocks. Color is used as signal, not surface.

### 1.2 Typography

- **UI:** Outfit (variable) — `var(--font-outfit)`. Weights used: 400, 500, 600, 800.
- **Mono:** Geist Mono (variable) — `var(--font-geist-mono)`. Used for: numbers, timestamps, PMIDs, dosages, durations, counters, table cells with data.
- **No default stacks.** `system-ui`, `Inter`, `Roboto`, `Arial` are forbidden as primary fonts. They are fallbacks only.

**Scale (type ramp).**

| Token | Size / Line | Weight | Tracking | Case | Use |
|-------|-------------|--------|----------|------|-----|
| `display` | 56 / 60 | 800 | -1.2px | — | Hero headline only. One per page. |
| `h1`      | 32 / 38 | 800 | -0.6px | — | Page title. |
| `h2`      | 22 / 28 | 800 | -0.4px | — | Section header. |
| `h3`      | 16 / 22 | 600 | -0.2px | — | Card title. |
| `body`    | 15 / 24 | 500 | 0      | — | Default paragraph. |
| `bodySm`  | 13 / 20 | 500 | 0      | — | Dense body. |
| `label`   | 11 / 14 | 700 | 1.4px  | UPPER | Section label / eyebrow. |
| `meta`    | 11 / 14 | 500 | 0      | — | Timestamps, counts (mono). |
| `mono`    | 13 / 18 | 500 | 0      | — | PMIDs, dosages, data cells. |
| `monoSm`  | 11 / 14 | 500 | 0      | — | Ticker, badges. |

Mono font is used **whenever a value could be a number, an ID, or a timestamp.** That is the tell of a scientific tool.

### 1.3 Spacing

4-point grid, but most things land on 8. Usable values: `2 4 6 8 12 16 20 24 32 40 48 64 80 96 128`.

### 1.4 Radius

- `2` — stripe / hairline
- `6` — badge, pill, button-sm
- `10` — input, button, small card
- `16` — card
- `20` — large surface
- `rounded-full` — only for: avatar, status dot, scanning ping. **Never** for CTAs.

### 1.5 Elevation

Not shadows. **Insets and hairlines.**

- `card`: `border: 1px solid T.hair; box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);`
- `raised` (hover): `border: 1px solid T.hairStrong; background: T.surfaceRaise;`
- `active` (focus): `border: 1px solid T.accent; box-shadow: 0 0 0 3px T.accentDim, inset 0 1px 0 rgba(255,255,255,0.04);`

Drop shadows are forbidden on content cards. Only the floating command palette and dropdowns get `box-shadow: 0 24px 48px -16px rgba(0,0,0,0.6)`.

### 1.6 Motion

- Duration: `120ms` (micro), `200ms` (standard), `320ms` (entrance).
- Easing: `cubic-bezier(0.2, 0.8, 0.2, 1)` (default), `linear` for scanning beam.
- The **only decorative motion** allowed: scanning beam on the command bar, animated caret on empty search, counter tick on live research feed. No bouncing, no spring overshoots, no page-wide parallax.

---

## 2. Page grid & layout

### 2.1 Container

- Max content width: **1200px**, centered.
- Gutter: `px-6` (mobile), `px-10` (tablet), `px-16` (desktop).
- Baseline: `py-10` (mobile), `py-14` (tablet), `py-16` (desktop).

### 2.2 Chrome

**Top bar** (56px, sticky, `backdrop-blur(24px)`, `background: rgba(9,9,11,0.72)`, bottom hairline):
- Left: brand lockup `MATERIA` (Outfit 800, 14px, tracking -0.2px) + mono subtitle `v2 / supplement intelligence` (10px, `T.fgDim`).
- Center: nothing on marketing pages, global command bar on app pages.
- Right: nav links `Stack · Compare · Advisor · Sign in` (Outfit 600, 13px, gap 24), with a mint 4px underline on active.

**Bottom bar** (mobile only, 64px tab bar, 4 icons: Search / Stack / Advisor / Profile). Hide at `md`.

**Sidebar** is removed in v2. The top bar + in-page navigation is enough. The old 260px sidebar eats 20% of screen real estate on 1440px displays for nothing.

### 2.3 Background

- Solid `T.bg`.
- 1px dot grid at 4% opacity, 40px spacing: `radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px) 0 0 / 40px 40px`.
- Optional: one soft radial mint wash 800px wide at 3% opacity, top-right, only on the home page. Nowhere else.

---

## 3. Component anatomy

### 3.1 Command bar (the signature element)

This is the one oversized, opinionated element of the whole product. It appears at the top of the home page and collapses into a top-bar command input on inner pages.

**Anatomy.**
- Container: full width of content column, 96px tall on home, 56px on inner pages.
- Border: 1px `T.hair` default, 1px `T.accent` + `accentDim` glow on focus.
- Radius: 16px.
- Background: `T.surface`, with an inset hairline at the top.
- Left: 16px mint status dot + label `QUERY` in mono 11px uppercase.
- Input: Geist Mono, 20px (home) / 15px (inner), `T.fg`, placeholder `T.fgFaint`: `query supplement, condition, or stack...`.
- Right: keyboard hint `⌘K` in a 24px pill, mono 11px, `T.fgDim`.

**Scanning beam.** On focus, a 2px mint line sweeps left-to-right inside the bottom border of the bar at `2000ms linear infinite`. That is the one moment of theater in the product.

**Autocomplete.** Dropdown in a portal, 8px below the bar, same width, max-height 360px. Each row: mono supplement name (15px) + inline mono meta `279 STUDIES · EVIDENCE B+` in `T.fgDim` 11px + right-side arrow icon.

### 3.2 Card

`rounded-16 border-1 T.hair bg-T.surface inset-highlight`. Body padding `24px`. Header: `h3` + optional right-aligned mono meta (e.g. `PMID 12345678`). Footer (optional): top hairline, 16px padding, muted meta.

**Cards earn their existence.** If something is a card, it is because the card is the unit of interaction. Reports are not cards. Tables are not cards. Use a card only when it contains a single, discrete, self-contained thing (e.g. a single study, a single supplement tile in compare).

### 3.3 Stat / counter

```
LABEL (label style, fgDim)
42.7 mg     <- h1, mono, fg
▲ +12% vs baseline     <- monoSm, accent (or high if down)
```

Stats are **always mono.** They sit in a row of 3–4 divided by vertical hairlines, no boxes.

### 3.4 Data table

- Zero border between rows. 1px `T.hair` on bottom of each row.
- Header row: `label` style, `T.fgDim`, uppercase, 11px tracking 1.4px, bottom hairline `T.hairStrong`.
- Cell: mono for numeric columns, body for text.
- Row height: 48px.
- Hover: background `T.surfaceRaise`, no motion.
- Sticky header on tables over 6 rows.

### 3.5 Severity row

4px left stripe (`high`, `mid`, or `low`) → 16px padding → supplement name (Outfit 600 15px) → inline mono meta → right: severity pill (`rounded-6 px-2.5 py-1 mono 11px font-bold uppercase`, bg `T.surfaceRaise`, text matches severity color).

### 3.6 Terminal ticker

Used on home and stack dashboard for the "live research feed".

- Full-width strip, 56px tall, 1px top + bottom hairline.
- Monospace. 13px. `T.fgMuted`.
- Format: `[04:12:07Z]  PMID 38217445  ·  ASHWAGANDHA  ·  cortisol reduction, n=58  ·  +REL 0.92`.
- Animation: items slide up from the bottom on a 12s loop. Respect `prefers-reduced-motion`.
- A blinking mint square caret on the leftmost column.

### 3.7 Segmented control

Used for the intake strip and for tab-style filters. No underlines, no rounded pills. A single 1px-bordered row of equal-width cells. Active cell: `background T.surfaceRaise`, bottom 2px mint bar inset. Height 44px.

### 3.8 Primary / ghost button

- **Primary:** `bg T.accent text T.bg rounded-10 px-5 h-11 Outfit 700 14px tracking-normal`. No shadow. On hover: `brightness(0.95)`. On press: `translateY(0.5px)`.
- **Ghost:** transparent, 1px `T.hair`, `T.fg`, same dims. Hover: `border T.hairStrong bg T.surfaceRaise`.
- **Destructive:** ghost variant with `T.high` border + text.
- **Danger-fill** (reserved for confirm delete): `bg T.high text T.bg`.

### 3.9 Badge / pill

`rounded-6 px-2.5 py-1 mono 11px font-bold uppercase` in mono. Background is a tint of the signal color at 12% opacity, text is the full-strength signal color.

### 3.10 Empty state

Never the string `"No items found."`. Empty states are a feature. Anatomy:

- 1 line: **what's happening** in `h3` (e.g. "No studies indexed yet for this compound.")
- 1 line: **why, in honest plain English** in body (e.g. "Stack Lab only surfaces peer-reviewed work. This one is too new to cite.")
- 1 primary action: what to do next (e.g. "Set a research alert" or "Suggest a study").
- No illustrations. No emoji. A single muted `T.fgFaint` mono line at the top: `EMPTY STATE · 01`.

---

## 4. Screens — visual specifications

All screens use the 1200px content column unless noted.

### 4.1 `/` — Home (anonymous entry)

**Purpose.** Replace the blank search box with a credible command surface that communicates "this is a real tool with real data". Time-to-first-value < 10 seconds.

**Layout (top to bottom).**
1. **Top bar** (56px). Brand left, nav right.
2. **Research ledger row** (64px, hairline-divided). 4 cells, mono:
   `279 COMPOUNDS INDEXED` · `4,821 STUDIES` · `12 CLINICAL GUIDELINES` · `LAST SYNC 04:12Z`.
   Each value mono 18px, label 11px uppercase `T.fgDim`. Hairline dividers between cells.
3. **Hero block** (400px tall, centered).
   - Eyebrow: `label` style, `T.accent`, `SUPPLEMENT INTELLIGENCE · v2`.
   - Headline (`display`): `Know exactly what's in your stack.` 2 lines max. `T.fg`.
   - Supporting line (`body` 16px, `T.fgMuted`): `279 compounds. 4,821 studies. Zero marketing copy.`
   - Command bar (96px) directly underneath, full content width.
   - Under command bar, row of 6 chip suggestions mono 12px: `ashwagandha · magnesium glycinate · creatine · omega-3 · berberine · nmn`. Chips are ghost-styled, one hairline, clicking sets the query.
4. **Protocol intake strip** (80px, full content width, 1px hairlines top+bottom). 3 segmented-control groups in one horizontal row:
   - `PRIMARY GOAL` [ Energy · Sleep · Focus · Longevity · Strength · Recovery ]
   - `MEDICATIONS` [ None · 1–2 · 3+ ] → opens detail sheet
   - `MORNING ROUTINE` [ Fasted · Coffee · Breakfast · Workout ]
   - Right side: primary button `Generate starting protocol → ⏎`.
5. **Live research feed** (terminal ticker, full-bleed width inside container, 56px tall).
6. **Three-column capability row** — but NOT the SaaS feature grid. Three hairline-divided columns, each 1/3 width, no cards, no icons, no colored circles. Each column:
   - `label` eyebrow (e.g. `01 / RESEARCH`)
   - `h3` title (e.g. `Every claim sourced.`)
   - `bodySm` one sentence, 2 lines max.
   - One mono link `→ view method` at the bottom.
   Columns separated by vertical hairlines. This replaces the standard "3 feature cards with icons" pattern and is the one place we allow a 3-col because it is **hairline-divided**, not card-tiled.
7. **Footer** (120px, 1px top hairline). Brand lockup + mono line: `Built with peer-reviewed research. Not medical advice.` + small nav.

**What's forbidden on this page.**
- No hero image.
- No 3-column feature grid with icons in colored circles.
- No testimonials. No logo wall. No "trusted by".
- No scroll-triggered animations. One scanning beam, one ticker, done.

### 4.2 `/research/[query]` — Supplement report (replaces current "Research" view)

**Purpose.** This is the screen users see most. It is the core IP. It must feel like an intelligence briefing, not a WebMD page.

**Layout.**
1. **Top bar** (56px) with collapsed command bar in the center.
2. **Report header** (128px).
   - Left: `label` `REPORT · 279 / 12` + `display` (trimmed to 40px here) supplement name + mono meta line: `CAS 11013-97-1 · FAMILY adaptogen · TIME-TO-EFFECT 4–6 wks`.
   - Right: two primary actions: `+ Add to stack` (primary) and `Compare` (ghost). Below: `Share report ⌘S` mono link.
3. **Score strip** (80px, 4 stat cells divided by vertical hairlines).
   - `EVIDENCE QUALITY` → `B+` mono 32px
   - `SAFETY PROFILE` → `A−` mono 32px
   - `TYPICAL DOSE` → `300–600 mg` mono 18px
   - `TIME TO FEEL` → `4–6 weeks` mono 18px
   Each stat has a `label` eyebrow and a 1-line `T.fgDim` caption.
4. **Tabs** (52px, segmented control full-width, no underlines).
   `Overview · Evidence · Dosage · Interactions · Schedule · Sources`.
   Active tab: `T.surfaceRaise` background + 2px mint bottom inset.
5. **Tab content** (variable height, 24px top padding).

**Overview tab.**
- `Mechanism` section: 2-paragraph body (max 240 words).
- `What it does` bullet list — 3–5 bullets, each 1 line, mono dash prefix.
- `What it does NOT do` — same format. This is a trust-building section.

**Evidence tab.**
- Study list. One row per study.
- Row anatomy: mono PMID (11px, `T.fgDim`) → study title (`h3`) → mono meta `2023 · n=58 · RCT · effect +23%` → right: quality pill (`A` / `B` / `C` / `D`, mono 11px).
- Hover: inset highlight, reveals a "Read summary" ghost button.
- Click opens a slide-over panel, not a new page.

**Dosage tab.**
- Dose calculator: weight input (mono, 15px) + sex segmented control + a single mono result line: `RECOMMENDED RANGE  300–450 mg / day`.
- Below: schedule visualization. Horizontal 24-hour timeline, 1px tick marks every hour, mint dots at dose times, `T.fgDim` labels.

**Interactions tab.**
- List of severity rows (left stripe + right pill). Grouped by severity: HIGH → MODERATE → LOW. Each group with a `label` header.

**Schedule tab.**
- Full-width timeline card (reuses timeline from Dosage tab) scaled up to 128px tall. Shows the user's full stack overlaid on a 24-hour axis.

**Sources tab.**
- Table (data table pattern). Columns: `PMID · Title · Year · Quality · Citation count`. Sortable. Click opens in new tab.

**Empty state (sparse data):**
- One empty state block per missing section. Offers `Generate via AI research agent` button which fires the LLM fallback.
- `h3`: `Evidence data is pending for this compound.`
- `body`: `Our human-verified dataset covers 40 supplements. This one is AI-assisted — we'll flag every claim that hasn't been manually verified.`
- Primary action: `Generate AI report` (confirms before running).

### 4.3 `/stack` — Stack builder (requires auth)

**Purpose.** This is the long-lived surface — the user's saved protocol.

**Layout.**
1. **Top bar.**
2. **Stack header** (120px): `h1` user first name + `'s Protocol` + mono meta `12 COMPOUNDS · STACK HEALTH 78/100 · LAST UPDATED 3H AGO`. Right: `Share link ⌘S` ghost + `Run advisor` primary.
3. **Stack health card** (full width, 160px tall). Contains a horizontal bar: 0–100, mint fill, segmented by the 3 inputs (evidence quality, goal coverage, dosage completeness). Below the bar: 3 hairline-divided stat cells showing each component. Bottom: 1 line of advice text: `Consider replacing X with Y to improve evidence quality (+12 pts).`
4. **Stack table** (data table pattern). Columns: `· Compound · Dose · Schedule · Evidence · Conflicts · Actions`. Row hover reveals `Edit / Remove` ghost buttons.
5. **Interactions panel.** Severity rows, full-width, at the bottom of the page. Always visible — zero state reads `No conflicts detected across 12 compounds.`

### 4.4 `/advisor` — AI advisor chat

**Purpose.** The defensible moat. This must feel like a briefing, not a chatbot.

**Layout.**
- **Two-column** on desktop (≥1024px). Left: 320px conversation list (sticky). Right: main chat column (max 760px centered inside remaining space).
- **Chat column.**
  - Top: `label` eyebrow `BRIEFING` + conversation title + mono meta `12 TURNS · CONTEXT 8.2K TOKENS`.
  - Message list.
    - **User message.** Right-aligned, max 80ch, `T.fgMuted`, no bubble, just text with a 4px left mint stripe on the right side.
    - **Advisor message.** Left-aligned, max 80ch. Eyebrow `ADVISOR · claude-sonnet-4-6` in mono 10px `T.fgDim`. Body text in 15/24. Inline citations as mono pills `[PMID 38217445]` that open a hover card.
    - **Structured recommendations.** When the advisor proposes stack changes, render as an inline card with: `h3 action title` + severity stripe if applicable + 2 primary buttons `Apply to stack` / `Dismiss`.
  - Composer: 1px `T.hair` top, mono textarea 15px, `T.surface` background, primary send button right. Under the composer: mono meta `Context: your stack (12) · profile · last 6 turns`.

- **Left column (conversation list).**
  - Each row: 1-line mono title + relative time + 1-line body preview in `T.fgDim`.
  - Active row: `T.surfaceRaise` + mint left stripe.

### 4.5 `/compare` — Side-by-side comparison (up to 5)

**Purpose.** The data-dense showcase.

**Layout.**
- Full-bleed within 1400px max (wider than default).
- Column-based table with fixed left column for attribute names and 2–5 compound columns to the right.
- **Rows:**
  1. Name header — `h3` + mono meta.
  2. `EVIDENCE QUALITY` — letter grade + mini radar chart inline.
  3. `SAFETY PROFILE`
  4. `TYPICAL DOSE RANGE`
  5. `TIME TO FEEL`
  6. `KEY MECHANISM` (1 line each)
  7. `HEAD-TO-HEAD STUDIES` (mono count + link)
  8. `INTERACTIONS` (severity pills row)
  9. `COST / MONTH` (mono, 2 dp)
- Header row sticky.
- Sparse column treatment: column grays out to `T.fgFaint`, shows `LIMITED DATA` label, and a `Generate report` ghost button at the bottom of the column that triggers LLM fallback inline. Loading state: mint scanning beam across the column, "ANALYZING 23 STUDIES" mono caption.

### 4.6 `/stack/[id]` — Shared protocol page (public, indexable)

**Purpose.** SEO surface + viral acquisition. Must load fast, must look identical to the authenticated stack view minus edit affordances.

**Layout.**
- Top bar with single CTA `Copy this protocol →` (primary) for signed-in visitors, `Sign in to copy` for anonymous.
- Stack header same anatomy as `/stack`, but the user's name is replaced with a mono meta line: `AUTHORED BY @username · SHARED 2 DAYS AGO · 47 COPIES`.
- **No share button on a shared page** (don't loop).
- Stack health card + stack table + interactions panel — read-only versions of the authenticated layout.
- OG image: 1200×630, `T.bg` background, mint brand lockup top-left, user's stack summary in mono center, `MATERIA` watermark bottom-right. Generated via route handler, cached.
- Canonical meta tags. JSON-LD `MedicalScholarlyArticle` on each supplement row.

### 4.7 `/signin` & `/onboarding` — Auth flow

**Purpose.** Zero-friction, no-marketing, trust-first. This is **not** a landing page.

**Layout.**
- Max-width 420px, centered, 100vh.
- Brand lockup centered at top.
- `label` eyebrow: `SIGN IN`. `h2`: `Continue your protocol.`
- Email input (mono 15px), primary button, or Google / Apple OAuth buttons.
- Bottom: mono 11px `By signing in, you accept that Stack Lab is a research tool, not medical advice.`
- No illustrations. No "welcome back!". No hero image.

**Onboarding (3 steps after first sign in).**
- Step 1: Primary goal (segmented control, same style as home intake strip).
- Step 2: Medications (typeahead with severity flagging — if a contraindication is found it appears inline as a severity row).
- Step 3: Morning routine (segmented control).
- Each step: 1 question, 1 button. No progress bar — a mono line `STEP 1 / 3` top-left.

---

## 5. State coverage matrix

Every feature must specify all five states. Missing a state is a bug.

| Feature | LOADING | EMPTY | ERROR | SUCCESS | PARTIAL |
|---|---|---|---|---|---|
| Command bar search | Mint scanning beam + `ANALYZING…` mono caption inline | `No match. Try "ashwagandha".` with top 3 mono suggestions | 1-line mono error row with `T.high` stripe + retry button | Route to `/research/[query]` | N/A |
| Supplement report | Skeleton rows, 6 mono dashes + hairlines, scanning beam across score strip | See "sparse data" empty state in 4.2 | `h2` error + `T.high` stripe + `Retry` primary + `Copy error ID` ghost | Full report | Flag "AI-assisted" banner at top if any tab is LLM-generated |
| Stack list | 5 skeleton rows | First-time empty: `Your stack is empty.` + 3 mono chip suggestions (`Add ashwagandha`, `Add creatine`, `Add magnesium`) | Inline `T.high` stripe on the row that failed | Table populated | Some rows show `SYNCING` mono badge if a change is in-flight |
| Advisor chat | Typing indicator: 3 mint dots, 8px, 320ms stagger | `No conversations yet.` + 3 mono chip suggestions for starter prompts | Assistant message with `T.high` stripe + `Retry` | Message appears | Inline `CITING…` label while citations resolve |
| Compare | Row-by-row fade-in with scanning beam per column | `Add compounds to compare.` + typeahead input | Per-column `LIMITED DATA` state | Full table | Sparse columns + LLM fallback affordance |
| Shared protocol page | Static, no loading | N/A (IDs are validated server-side; invalid IDs 404) | 404 page: `h1 "Protocol not found."` + `Start your own` primary | Full read-only stack | Authenticated vs anonymous CTAs differ |
| Auth / onboarding | Primary button → mono `SIGNING IN…` + spin ring | N/A | Inline `T.high` stripe under the input | Redirect to `/stack` | Step indicator mono |

---

## 6. Responsive

Not "stacked on mobile." Each viewport is intentional.

### <768px (mobile)

- No top bar nav. Brand lockup only. Bottom tab bar for nav (Search / Stack / Advisor / Profile).
- Home hero: ledger row scrolls horizontally (snap), command bar is 72px tall, intake strip collapses into a single `Start` button that opens a full-screen sheet.
- Supplement report: tabs become a horizontal-scroll segmented control. Score strip becomes 2×2.
- Stack table: converts to vertical cards — one per compound, with `Swipe for actions`.
- Advisor: conversation list is a top drawer. Chat is full width.
- Compare: locked to 2-up max on mobile. CTA: `View on desktop for 3+`.

### 768–1024px (tablet)

- Top bar nav full, no bottom bar.
- Home hero intake strip becomes 2 rows (goal + meds above, routine below).
- Report tabs full-width.
- Stack and compare: full desktop layout, compressed gutters (`px-8`).

### ≥1024px (desktop)

- Default layout as specified above.
- Advisor uses 2-column layout.
- Max content width 1200px, max compare width 1400px.

---

## 7. Accessibility

Non-optional. These are specs, not aspirations.

- **Keyboard.**
  - `⌘K` / `Ctrl+K` opens global command bar from anywhere.
  - `⌘Enter` submits forms.
  - `⌘S` opens share dialog on `/stack` and `/research/*`.
  - Tab order follows visual order. Focus ring: 2px `T.accent` + 4px `accentDim` outside it.
- **ARIA.**
  - Top bar: `role="banner"`. Nav: `role="navigation"`. Main: `role="main"`. Footer: `role="contentinfo"`.
  - Command bar input: `aria-label="Query supplement, condition, or stack"`, `aria-autocomplete="list"`, `aria-expanded`.
  - Severity rows: `role="listitem"` inside a labeled list, with `aria-label` including severity level.
  - Data tables: `<caption>` required, `<th scope="col">` required.
- **Touch targets.** Min 44×44px. This forces the 44px button / 48px row heights above.
- **Contrast.**
  - `T.fg` on `T.bg` → 18.0:1 (AAA)
  - `T.fgMuted` on `T.bg` → 7.8:1 (AAA)
  - `T.fgDim` on `T.bg` → 4.8:1 (AA)
  - `T.accent` on `T.bg` → 11.2:1 (AAA)
  - `T.fgFaint` on `T.bg` → 3.1:1 (AA Large only — use only on labels ≥16px bold or ≥18px).
  - Severity colors on `T.bg`: all ≥4.8:1.
- **Motion.** Respect `prefers-reduced-motion`: disable scanning beam, ticker, and all transitions > 120ms. Swap ticker for a static "latest research" list.
- **Screen reader.** Every mono numeric value gets an `aria-label` with units spelled out (e.g. `aria-label="300 to 600 milligrams per day"`).

---

## 8. Anti-slop rules (hard rejections)

Any of these is a ship-blocker.

1. **No 3-column SaaS feature grid with icons in colored circles.** The hairline-divided capability row on home (4.1 §6) is the *only* exception, and it has no icons or cards.
2. **No purple / violet / indigo.** Anywhere.
3. **No gradient blobs, wavy SVG dividers, floating circles, or decorative background ornaments.**
4. **No emoji in UI.** Ever. Not even in empty states.
5. **No colored card backgrounds for severity.** Left stripe + pill only.
6. **No drop shadows on content cards.** Inset highlight only.
7. **No default font stacks** (Inter, Roboto, Arial, system). Outfit + Geist Mono only.
8. **No centered everything.** Headlines are left-aligned. Hero content is left-aligned within the centered column.
9. **No "Welcome to Stack Lab"** or any greeting copy. Utility language only.
10. **No bouncing / spring / overshoot animations.** `cubic-bezier(0.2, 0.8, 0.2, 1)` or `linear` only.
11. **No symmetric testimonial-pricing-cta rhythm.** Home does not end with a "Ready to get started?" CTA section.
12. **No card-with-icon affiliate CTAs.** Affiliate buttons are horizontal mono strips inline with the supplement row.

---

## 9. Copy rules

- **Utility over mood.** "Stack health 78/100" beats "Your stack is looking great!".
- **Mono for data, Outfit for prose.** If you would say the number out loud, it's mono.
- **No hedging.** "Evidence quality B+" not "Evidence quality looks solid".
- **No marketing superlatives.** No "best", "ultimate", "revolutionary".
- **Absolute dates in mono, never "2 days ago" without a timestamp tooltip.**
- **Error copy names the fix.** "Couldn't reach the advisor. Retry in 5s." not "Something went wrong."

---

## 10. Implementation notes

- Colocate tokens in `src/lib/tokens.ts`, import `T` everywhere. Delete the in-file `const T = {}` in `Dashboard.tsx`.
- Break `Dashboard.tsx` (currently 1440 lines) into per-route components under `src/app/(app)/...`. The v2 revamp is the moment to kill the single-component dashboard.
- Use Tailwind arbitrary values for spacing (`p-[24px]`) only when the value isn't on the scale. Prefer scale values.
- All mono text uses `className="font-mono"` where `font-mono: var(--font-geist-mono)` is set in `globals.css`.
- Motion is implemented with CSS `@keyframes` for the scanning beam and ticker — no Framer Motion for decorative animation. Framer Motion is reserved for route transitions and the slide-over panels.
- Respect `prefers-reduced-motion` in a single `@media` query block at the top of `globals.css`.

---

## 11. Out of scope for this revamp

- Marketing site variants (there is no separate marketing site; `/` is the entry).
- Community / social features.
- Pricing / subscription UI (Phase 3).
- Research alerts email templates (next sprint).
- Mobile native shell.

---

**This file is the source of truth.** Every PR that touches UI references a section number from this document. If a decision isn't in here, it is either (a) not made yet — ask — or (b) not important enough to block on — default to the calmest, most data-dense option.
