# Kinetic + Cinematic Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn ProtocolsAI into a kinetic instrument panel with two flagship 3D molecular moments (home hero constellation + supplement detail sticky card), without abandoning the scientific design thesis.

**Architecture:** Phase 1 adds six kinetic CSS/JS treatments using only native browser APIs (no animation library). Phase 2 adds React Three Fiber, a one-time PubChem SDF acquisition script, and two 3D components. No backend or DB changes.

**Tech Stack:** Next 16.2.1 · React 19.2.4 · Tailwind v4 · three + @react-three/fiber + @react-three/drei (Phase 2 only) · TypeScript · tsx for scripts.

**Codebase conventions (must follow):**
- Read `node_modules/next/dist/docs/` before Next-specific code (this is Next 16, not older)
- All interactive components start with `'use client'`
- CSS variables (`var(--accent)`, `var(--fg)` etc.) via inline `style={{}}`, not Tailwind arbitrary values
- CSS class prefix `proto-` for utilities added to `globals.css`
- Components live under `src/components/v2/...`
- Verification = `npx tsc --noEmit` + manual browser smoke, no formal test framework
- Respect global `prefers-reduced-motion` (already handled site-wide in `globals.css:163`)

**Spec:** `docs/superpowers/specs/2026-04-17-kinetic-3d-frontend-design.md`

**Don't:**
- Start the dev server yourself — project memory says it OOMs this machine. Use Vercel preview instead.
- Restructure code outside the listed files.
- Add a testing framework.
- Add any animation library (framer-motion, gsap, motion-one, etc.).

---

## Task Map

**Phase 1 — Kinetic (no new dependencies):**
- Task 1: Count-up hook + component
- Task 2: Reveal-on-scroll hook
- Task 3: Scan-beam ambient utility class
- Task 4: Hover depth on supplement tiles
- Task 5: View Transitions API wrapper
- Task 6: Live delta animations on trending

**Phase 2 — 3D Foundation:**
- Task 7: Install Three.js dependencies
- Task 8: PubChem fetch script + SDF parser
- Task 9: Generic `<MoleculeViewer />` primitive

**Phase 3 — 3D Integration:**
- Task 10: Home hero `<HeroConstellation />`
- Task 11: Supplement detail `<MoleculeCard />` desktop
- Task 12: Mobile lazy 3D + final verify & deploy

---

## PHASE 1 — KINETIC

### Task 1: Count-up hook + component

Makes the three ledger counts tick from 0 to their final value over 800 ms when they scroll into view.

**Files:**
- Create: `src/hooks/useCountUp.ts`
- Create: `src/components/ui/CountUp.tsx`
- Modify: `src/app/page.tsx:62-67, 90, 168-187`

- [ ] **Step 1: Create the hook**

Create `src/hooks/useCountUp.ts`:

```ts
'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Count from 0 to `target` over `duration` ms, starting when the attached
 * element enters the viewport. Respects prefers-reduced-motion (snaps to target).
 * Returns a ref to attach to the display element and the current value.
 */
export function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLElement | null>(null);
  const triggered = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setValue(target);
      return;
    }

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting || triggered.current) continue;
        triggered.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          // ease-out cubic
          const eased = 1 - Math.pow(1 - t, 3);
          setValue(Math.round(target * eased));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.disconnect();
      }
    }, { threshold: 0.4 });

    io.observe(el);
    return () => io.disconnect();
  }, [target, duration]);

  return { ref, value };
}
```

- [ ] **Step 2: Create the component wrapper**

Create `src/components/ui/CountUp.tsx`:

```tsx
'use client';

import { useCountUp } from '@/hooks/useCountUp';

/**
 * <CountUp value={1144} /> renders a span that animates 0 → 1,144 when scrolled into view.
 * Formats with en-US thousands separators.
 */
const nf = new Intl.NumberFormat('en-US');

export function CountUp({
  value,
  duration = 800,
  className,
  style,
}: {
  value: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { ref, value: displayed } = useCountUp(value, duration);
  return (
    <span ref={ref as React.RefObject<HTMLSpanElement>} className={className} style={style}>
      {nf.format(displayed)}
    </span>
  );
}
```

- [ ] **Step 3: Use it in the ledger on `src/app/page.tsx`**

Replace the hardcoded LEDGER mapping. In `src/app/page.tsx`:

Change lines 63-67 from:
```tsx
const LEDGER = [
  { label: 'COMPOUNDS INDEXED', value: nf.format(counts.compounds) },
  { label: 'CLINICAL STUDIES',  value: nf.format(counts.studies) },
  { label: 'DEEP DATA',         value: nf.format(counts.deepData) },
];
```

To:
```tsx
const LEDGER = [
  { label: 'COMPOUNDS INDEXED', value: counts.compounds },
  { label: 'CLINICAL STUDIES',  value: counts.studies },
  { label: 'DEEP DATA',         value: counts.deepData },
];
```

Add import at top (after existing imports):
```tsx
import { CountUp } from '@/components/ui/CountUp';
```

Change the ledger render (line 182-184) from:
```tsx
<span className="font-mono text-[18px]" style={{ color: 'var(--fg)' }}>
  {cell.value}
</span>
```

To:
```tsx
<CountUp
  value={cell.value}
  className="font-mono text-[18px]"
  style={{ color: 'var(--fg)' }}
/>
```

Leave the hero subtitle at line 90 unchanged — it uses prose inline, not worth the component ceremony.

- [ ] **Step 4: Verify typecheck**

```bash
cd /home/ali/workspace/protocols-ai
npx tsc --noEmit
```

Expected: exit 0, no errors.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useCountUp.ts src/components/ui/CountUp.tsx src/app/page.tsx
git commit -m "feat(home): ledger counts tick up on scroll into view"
```

---

### Task 2: Reveal-on-scroll hook

Fades + slides up each home section as it enters the viewport. Dead simple IntersectionObserver.

**Files:**
- Create: `src/hooks/useRevealOnScroll.ts`
- Modify: `src/app/globals.css` (append after line 170)
- Modify: `src/app/page.tsx` — wrap relevant `<section>` elements

- [ ] **Step 1: Create the hook**

Create `src/hooks/useRevealOnScroll.ts`:

```ts
'use client';

import { useEffect, useRef } from 'react';

/**
 * Adds the class `.is-revealed` to the element when it enters the viewport.
 * CSS handles the actual transition. One-shot — once revealed, stays revealed.
 */
export function useRevealOnScroll<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      el.classList.add('is-revealed');
      return;
    }

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-revealed');
          io.unobserve(e.target);
        }
      }
    }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return ref;
}
```

- [ ] **Step 2: Add CSS for the `.reveal` class**

Append to `src/app/globals.css`:

```css
/* reveal-on-scroll — sections fade + slide up when they enter the viewport */
.reveal {
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 400ms var(--ease), transform 400ms var(--ease);
}
.reveal.is-revealed {
  opacity: 1;
  transform: translateY(0);
}
```

- [ ] **Step 3: Create a client wrapper (sections are server components, hook needs client boundary)**

Create `src/components/ui/Reveal.tsx`:

```tsx
'use client';

import { useRevealOnScroll } from '@/hooks/useRevealOnScroll';

/**
 * Wraps children in a div that fades+slides-up when scrolled into view.
 * Pass-through for className/style so it nests cleanly inside existing layouts.
 */
export function Reveal({
  children,
  className = '',
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRevealOnScroll<HTMLDivElement>();
  return (
    <div ref={ref} className={`reveal ${className}`} style={style}>
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Wrap home page sections**

In `src/app/page.tsx`, wrap the following section contents in `<Reveal>`:
- The Most Popular section content (lines 98-105 — wrap the `<MostPopularFilterable />` and its heading)
- The Trending section content (lines 113-123)
- The Capability row content (lines 126-160 — wrap the inner grid)
- The Research ledger content (lines 163-188 — wrap the inner grid)

Do NOT wrap the Hero (should be visible immediately) or the Ticker (it animates on its own).

Add import:
```tsx
import { Reveal } from '@/components/ui/Reveal';
```

Example — Most Popular section becomes:
```tsx
<section
  aria-labelledby="popular-heading"
  className="mx-auto max-w-[1200px] px-5 md:px-10 lg:px-16"
>
  <h2 id="popular-heading" className="sr-only">Most popular supplements</h2>
  <Reveal>
    <MostPopularFilterable />
  </Reveal>
</section>
```

Apply the same pattern to the other three sections listed above.

- [ ] **Step 5: Verify typecheck**

```bash
npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useRevealOnScroll.ts src/components/ui/Reveal.tsx src/app/globals.css src/app/page.tsx
git commit -m "feat(home): scroll-triggered section reveals"
```

---

### Task 3: Scan-beam ambient utility

Extract the existing CommandBar scan-beam animation into a reusable class and apply it to data tables.

**Files:**
- Modify: `src/app/globals.css` (add new utility after existing `proto-scan` rules)
- Modify: `src/components/v2/trending/TrendingSection.tsx` — add class to container
- Modify: `src/components/v2/trending/MostPopularFilterable.tsx` — add class to container

- [ ] **Step 1: Add the ambient variant to globals.css**

Append to `src/app/globals.css` after the existing `proto-scan` rule (around line 109):

```css
/* Ambient scan beam — slower, subtler than the CommandBar beam.
   Used on data tables / grids to reinforce the "instrument panel" feel. */
@keyframes proto-scan-ambient {
  0%   { transform: translateX(-100%); opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { transform: translateX(100%); opacity: 0; }
}
.proto-scan-ambient {
  position: relative;
  overflow: hidden;
}
.proto-scan-ambient::after {
  content: '';
  position: absolute;
  inset: auto 0 0 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(6, 214, 160, 0.4), transparent);
  transform: translateX(-100%);
  animation: proto-scan-ambient 12s linear infinite;
  pointer-events: none;
}
@media (prefers-reduced-motion: reduce) {
  .proto-scan-ambient::after { display: none; }
}
```

- [ ] **Step 2: Apply the class to TrendingSection**

Open `src/components/v2/trending/TrendingSection.tsx`. Find the outermost `<div>` or `<section>` that wraps the rows and add the class. It will look like:

```tsx
// Before:
<div className="...existing classes...">

// After:
<div className="...existing classes... proto-scan-ambient">
```

Verify the container has a defined border or background — the beam needs a visible box edge to read clearly. If the container is transparent, skip down to the inner card/table element.

- [ ] **Step 3: Apply the class to MostPopularFilterable**

Same treatment in `src/components/v2/trending/MostPopularFilterable.tsx`. Apply to the main grid wrapper.

- [ ] **Step 4: Verify typecheck**

```bash
npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/components/v2/trending/TrendingSection.tsx src/components/v2/trending/MostPopularFilterable.tsx
git commit -m "style(trending): ambient scan beam on data tables"
```

---

### Task 4: Hover depth on supplement tiles

Adds a tactile 4px lift + mint glow when hovering Most Popular tiles. Keyboard focus gets the same treatment.

**Files:**
- Modify: `src/app/globals.css` — add `.proto-tile` utility
- Modify: `src/components/v2/trending/MostPopularFilterable.tsx` — add class to each tile

- [ ] **Step 1: Add the utility to globals.css**

Append to `src/app/globals.css`:

```css
/* Supplement tile interactive states — used on Most Popular grid tiles.
   4px lift + mint glow on hover/focus. Desktop pointer only. */
.proto-tile {
  transition: transform 180ms var(--ease), box-shadow 180ms var(--ease), border-color 180ms var(--ease);
}
@media (hover: hover) and (pointer: fine) {
  .proto-tile:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 28px var(--accent-glow);
    border-color: var(--accent) !important;
  }
}
.proto-tile:focus-visible {
  outline: none;
  transform: translateY(-4px);
  box-shadow: 0 0 0 2px var(--accent), 0 12px 28px var(--accent-glow);
}
```

- [ ] **Step 2: Apply the class to Most Popular tiles**

In `src/components/v2/trending/MostPopularFilterable.tsx`, find where each tile is rendered (likely a `<Link>` or `<a>` or `<button>` inside a `.map()`) and add `proto-tile` to its className.

Example transformation (your exact markup may differ slightly — match the existing structure):

```tsx
// Before:
<Link href={`/research/${slug}`} className="...existing tile classes...">

// After:
<Link href={`/research/${slug}`} className="...existing tile classes... proto-tile">
```

- [ ] **Step 3: Verify typecheck**

```bash
npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/components/v2/trending/MostPopularFilterable.tsx
git commit -m "style(tiles): hover depth on most popular tiles"
```

---

### Task 5: View Transitions API wrapper

Enables native browser page transitions on home → research navigation. Falls through silently on browsers that don't support it (Firefox).

**Files:**
- Create: `src/lib/view-transition.ts`
- Modify: `src/components/v2/trending/MostPopularFilterable.tsx` — use wrapper on tile click
- Modify: `src/components/v2/trending/TrendingSection.tsx` — add view-transition-name on rows
- Modify: `src/app/research/[query]/page.tsx` — add view-transition-name on header

- [ ] **Step 1: Create the navigation helper**

Create `src/lib/view-transition.ts`:

```ts
/**
 * Type for the View Transitions API we use. Minimal — we only need startViewTransition.
 * Widely supported in Chrome/Edge/Safari; Firefox falls through.
 */
interface DocumentWithViewTransitions extends Document {
  startViewTransition?: (cb: () => void | Promise<void>) => unknown;
}

/**
 * Run `navigate()` wrapped in a view transition if the browser supports it.
 * Otherwise run it immediately. `navigate` is typically `() => router.push(href)`.
 */
export function withViewTransition(navigate: () => void) {
  const doc = document as DocumentWithViewTransitions;
  if (typeof doc.startViewTransition !== 'function') {
    navigate();
    return;
  }
  doc.startViewTransition(() => {
    navigate();
  });
}
```

- [ ] **Step 2: Add view-transition-name to MostPopular tiles**

In `src/components/v2/trending/MostPopularFilterable.tsx`, each tile represents a supplement. The tile's supplement-name element should get a unique view-transition-name.

Add to the name element inside each tile:
```tsx
<span style={{ viewTransitionName: `supp-name-${slug}` }}>
  {name}
</span>
```

(Match whatever element currently holds the tile's supplement name. Add the `style` prop with `viewTransitionName` — React 19 supports it via camelCase.)

- [ ] **Step 3: Wrap tile navigation with the helper**

If tiles are `<Link>` components: add an onClick handler that wraps the navigation.

Convert each tile to:
```tsx
'use client';
// ... other imports
import { useRouter } from 'next/navigation';
import { withViewTransition } from '@/lib/view-transition';

// inside component:
const router = useRouter();

// per-tile:
<Link
  href={`/research/${slug}`}
  className="...proto-tile..."
  onClick={(e) => {
    e.preventDefault();
    withViewTransition(() => router.push(`/research/${slug}`));
  }}
>
```

Note: keep the `href` on the Link so right-click / Cmd+click / middle-click still open in a new tab naturally (preventDefault only fires for plain left-click, which honors browser modifier keys via `router.push`).

- [ ] **Step 4: Add matching view-transition-name on the research page header**

Open `src/app/research/[query]/page.tsx`. Find where the supplement name is rendered in the page header (likely inside `ReportHeader` or inline in the h1). Add the matching view-transition-name:

```tsx
<h1 style={{ viewTransitionName: `supp-name-${slug}` }}>
  {supplement.name}
</h1>
```

Use the same slug you compute/receive in the route. The names must match identically for the morph to work.

- [ ] **Step 5: Verify typecheck**

```bash
npx tsc --noEmit
```

Expected: exit 0. If TypeScript complains about `viewTransitionName` not existing on CSSProperties, use `style={{ ['viewTransitionName' as string]: `supp-name-${slug}` } as React.CSSProperties}` as a workaround.

- [ ] **Step 6: Commit**

```bash
git add src/lib/view-transition.ts src/components/v2/trending/MostPopularFilterable.tsx src/app/research/
git commit -m "feat(nav): View Transitions API on home→research morph"
```

---

### Task 6: Live delta animations on trending

When the trending snapshot has changed since the user's last visit, animate the changed deltas with a mint pulse and use FLIP to shift rank-changed rows into position.

**Files:**
- Modify: `src/app/globals.css` — add `.proto-pulse` keyframe
- Modify: `src/components/v2/trending/TrendingSection.tsx` — localStorage compare + classnames
- OR create: `src/components/v2/trending/TrendingRows.tsx` client component if TrendingSection is currently a server component (it is, per memory — it's async). Add a client child for the interactive diff.

- [ ] **Step 1: Add pulse keyframe to globals.css**

Append to `src/app/globals.css`:

```css
/* Pulse used on freshly-changed trending deltas */
@keyframes proto-pulse {
  0%   { opacity: 1; transform: scale(1); }
  30%  { opacity: 1; transform: scale(1.08); filter: drop-shadow(0 0 8px var(--accent-glow)); }
  100% { opacity: 1; transform: scale(1); }
}
.proto-pulse {
  animation: proto-pulse 600ms var(--ease) both;
}

/* FLIP helpers — `.proto-row` transitions its transform so translate-based
   position shifts animate smoothly when rank changes */
.proto-row {
  transition: transform 400ms var(--ease);
}
```

- [ ] **Step 2: Read the approach (don't code yet)**

Since `TrendingSection` is an async server component (per memory doc §3.1), we need a client component nested inside that:
1. Receives the current payload from the server component as a prop
2. On mount, reads `localStorage.protoai_trending_seen` — the previously-seen `generatedAt` timestamp and per-slug ranks
3. Compares: for each current slug, was the mentionCount/delta different last time? Is the rank different?
4. Applies `.proto-pulse` to changed deltas on first render
5. After ~700ms, writes the current snapshot back to localStorage

- [ ] **Step 3: Create the client diff component**

Create `src/components/v2/trending/TrendingDiff.tsx`:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';

type TrendingRow = {
  slug: string;
  name: string;
  mentionCount: number;
  deltaWeek: number;
};

type SeenState = {
  generatedAt: string;
  ranks: Record<string, number>; // slug → rank (0-indexed)
  deltas: Record<string, number>; // slug → delta
};

const STORAGE_KEY = 'protoai_trending_seen';

/**
 * Given the current trending rows + generatedAt, returns a set of slugs
 * whose delta or rank changed since the user's last visit. Also rewrites
 * localStorage with the current snapshot after a brief delay so the next
 * visit compares against THIS state.
 */
export function useTrendingDiff(rows: TrendingRow[], generatedAt: string) {
  const [changed, setChanged] = useState<Set<string>>(new Set());
  const firstRun = useRef(true);

  useEffect(() => {
    if (!firstRun.current) return;
    firstRun.current = false;

    let seen: SeenState | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) seen = JSON.parse(raw) as SeenState;
    } catch { /* ignore corrupt blob */ }

    if (seen && seen.generatedAt !== generatedAt) {
      const diffs = new Set<string>();
      rows.forEach((r, i) => {
        const prevRank = seen!.ranks[r.slug];
        const prevDelta = seen!.deltas[r.slug];
        if (prevRank === undefined || prevRank !== i) diffs.add(r.slug);
        if (prevDelta !== undefined && prevDelta !== r.deltaWeek) diffs.add(r.slug);
      });
      setChanged(diffs);
    }

    // Persist current state for next visit
    const next: SeenState = {
      generatedAt,
      ranks: Object.fromEntries(rows.map((r, i) => [r.slug, i])),
      deltas: Object.fromEntries(rows.map(r => [r.slug, r.deltaWeek])),
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* quota */ }
  }, [rows, generatedAt]);

  return changed;
}
```

- [ ] **Step 4: Integrate into TrendingSection**

In `src/components/v2/trending/TrendingSection.tsx`, extract the per-row rendering into a new client component that uses `useTrendingDiff`.

First, create `src/components/v2/trending/TrendingRowsClient.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { useTrendingDiff } from './TrendingDiff';

type Row = {
  slug: string;
  name: string;
  mentionCount: number;
  deltaWeek: number;
  sources: string[];
  lastSeen: string;
};

export function TrendingRowsClient({
  rows,
  generatedAt,
}: {
  rows: Row[];
  generatedAt: string;
}) {
  const changed = useTrendingDiff(
    rows.map(r => ({ slug: r.slug, name: r.name, mentionCount: r.mentionCount, deltaWeek: r.deltaWeek })),
    generatedAt
  );
  return (
    <ol className="flex flex-col" role="list">
      {rows.map((r, i) => {
        const up = r.deltaWeek >= 0;
        const deltaClass = changed.has(r.slug) ? 'proto-pulse' : '';
        return (
          <li key={r.slug} className="proto-row" style={{ borderBottom: '1px solid var(--hair)' }}>
            <Link
              href={`/research/${r.slug}`}
              className="flex items-center justify-between gap-4 py-3 proto-tile"
            >
              <span className="flex items-center gap-3">
                <span className="font-mono text-[11px] w-5 text-right" style={{ color: 'var(--fg-dim)' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-[14px]" style={{ color: 'var(--fg)' }}>{r.name}</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="font-mono text-[12px]" style={{ color: 'var(--fg-muted)' }}>
                  {r.mentionCount}
                </span>
                <span
                  className={`font-mono text-[11px] ${deltaClass}`}
                  style={{ color: up ? 'var(--severity-low)' : 'var(--severity-high)' }}
                >
                  {up ? '▲' : '▼'} {Math.abs(r.deltaWeek).toFixed(1)}%
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
```

Now open `src/components/v2/trending/TrendingSection.tsx`. Find where the rows are rendered in the existing async server component. Replace the row-rendering block with:

```tsx
import { TrendingRowsClient } from './TrendingRowsClient';

// inside the component, after fetching `payload`:
<TrendingRowsClient
  rows={payload.trending.slice(0, 8)}
  generatedAt={payload.generatedAt}
/>
```

Keep the existing heading and scan-ambient wrapper from Task 3.

- [ ] **Step 5: Verify typecheck**

```bash
npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/components/v2/trending/ src/app/globals.css
git commit -m "feat(trending): live delta pulse + FLIP on rank changes"
```

**End of Phase 1.** At this point the site has all six kinetic treatments. Open a Vercel preview and eyeball before moving to Phase 2.

- [ ] **Step 7: Deploy preview and smoke-test Phase 1**

```bash
vercel --yes > /tmp/phase1-preview.log 2>&1
cat /tmp/phase1-preview.log | grep -E 'Preview:|https://'
```

Open the preview URL in a logged-in browser. Verify each item from §8 of the spec:
1. Ledger numbers tick up when scrolled into view
2. Sections fade + slide in as you scroll
3. Scan beam sweeps across MostPopular + Trending
4. Hovering a Most Popular tile lifts it with mint glow
5. Click a tile — name morphs into the research page header (Chrome/Safari)
6. Reload — no pulse (nothing changed). Wait for the cron or manually refresh trending → next load should pulse changed deltas

If anything is broken, fix inline before Phase 2. Do not merge Phase 1 → Phase 2 if Phase 1 is buggy.

---

## PHASE 2 — 3D FOUNDATION

### Task 7: Install Three.js dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install deps**

```bash
cd /home/ali/workspace/protocols-ai
npm install three@^0.169 @react-three/fiber@^8.17 @react-three/drei@^9.114
npm install --save-dev @types/three@^0.169
```

Pin to these majors — Three.js is a fast-moving API and React Three Fiber has to match.

- [ ] **Step 2: Verify it builds**

```bash
npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add three + react-three-fiber + drei for 3D molecules"
```

---

### Task 8: PubChem fetch script + SDF parser

**Files:**
- Create: `scripts/fetch-molecules.ts`
- Create: `src/lib/sdf-parser.ts`
- Create: `public/molecules/.gitkeep`

- [ ] **Step 1: Create the SDF parser**

Create `src/lib/sdf-parser.ts`:

```ts
/**
 * Minimal parser for PubChem V2000 SDF files.
 * Extracts atom positions (xyz) + element symbols and bond connectivity.
 * Ignores stereo, charge, radical flags, and all header metadata beyond the formula.
 *
 * SDF V2000 structure (relevant portions):
 *   line 1:   compound name
 *   line 2:   info (ignored)
 *   line 3:   comment (ignored)
 *   line 4:   counts line: "NNNMMM  0  0  0  0  0  0  0  0999 V2000"
 *   lines 5+: atoms (N rows): "  x.xxxx   y.yyyy   z.zzzz ELEM 0  0  0  0  0  0  0  0  0  0  0  0"
 *   next:     bonds (M rows): "a1a2  type  ..." (right-aligned in 3-char fields)
 *   ...
 *   M  END
 */

export interface Atom {
  element: string;
  x: number;
  y: number;
  z: number;
}

export interface Bond {
  a: number; // atom index (0-based)
  b: number;
  order: 1 | 2 | 3;
}

export interface Molecule {
  name: string;
  atoms: Atom[];
  bonds: Bond[];
}

export function parseSdf(text: string): Molecule {
  const lines = text.split(/\r?\n/);
  const name = (lines[0] ?? '').trim();
  const counts = lines[3] ?? '';
  const atomCount = parseInt(counts.slice(0, 3).trim(), 10) || 0;
  const bondCount = parseInt(counts.slice(3, 6).trim(), 10) || 0;

  const atoms: Atom[] = [];
  for (let i = 0; i < atomCount; i++) {
    const line = lines[4 + i] ?? '';
    const x = parseFloat(line.slice(0, 10));
    const y = parseFloat(line.slice(10, 20));
    const z = parseFloat(line.slice(20, 30));
    const element = line.slice(31, 34).trim();
    if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z) || !element) continue;
    atoms.push({ element, x, y, z });
  }

  const bonds: Bond[] = [];
  const bondStart = 4 + atomCount;
  for (let i = 0; i < bondCount; i++) {
    const line = lines[bondStart + i] ?? '';
    const a = parseInt(line.slice(0, 3).trim(), 10) - 1;
    const b = parseInt(line.slice(3, 6).trim(), 10) - 1;
    const order = parseInt(line.slice(6, 9).trim(), 10);
    if (Number.isNaN(a) || Number.isNaN(b) || a < 0 || b < 0) continue;
    const o: 1 | 2 | 3 = order === 2 ? 2 : order === 3 ? 3 : 1;
    bonds.push({ a, b, order: o });
  }

  return { name, atoms, bonds };
}
```

- [ ] **Step 2: Smoke-test the parser inline**

The SDF for water (H2O) is ~60 lines, a good sanity input. Run:

```bash
npx tsx -e "
import { parseSdf } from './src/lib/sdf-parser.ts';
const sdf = \`water
  -OEChem-04192617183D

  3  2  0     0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
    0.2774    0.8929    0.2544 H   0  0  0  0  0  0  0  0  0  0  0  0
    0.6068   -0.2383   -0.7169 H   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
  1  3  1  0  0  0  0
M  END
\`;
const m = parseSdf(sdf);
console.log('atoms:', m.atoms.length, 'bonds:', m.bonds.length);
console.log(JSON.stringify(m.atoms[0]));
"
```

Expected output:
```
atoms: 3 bonds: 2
{"element":"O","x":0,"y":0,"z":0}
```

- [ ] **Step 3: Create the fetch script**

Create `scripts/fetch-molecules.ts`:

```ts
/**
 * One-off: for every published supplement, fetch its molecular structure
 * from PubChem by name lookup. Save SDF (3D) and PNG (2D) into
 * /public/molecules/{slug}.{sdf,png}. Writes a manifest JSON summarizing
 * which slugs got which formats.
 *
 * Run: npx tsx scripts/fetch-molecules.ts
 * Re-run on catalog changes. No cron; manual.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { db } from '../src/lib/drizzle';
import { supplements } from '../src/lib/schema-postgres';

const PUBCHEM_SDF_3D = (name: string) =>
  `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/SDF?record_type=3d`;
const PUBCHEM_SDF_2D = (name: string) =>
  `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/SDF`;
const PUBCHEM_PNG = (name: string) =>
  `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/PNG?record_type=2d&image_size=600x600`;

const OUT_DIR = path.join(process.cwd(), 'public', 'molecules');
const THROTTLE_MS = 500;

type Result =
  | { slug: string; ok: true; sdf3d: boolean; sdf2d: boolean; png: boolean }
  | { slug: string; ok: false; reason: string };

async function fetchToFile(url: string, filePath: string): Promise<boolean> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'protocolsai-molecule-fetcher/1.0' } });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 32) return false; // empty or error response
    await fs.writeFile(filePath, buf);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const all = await db
    .select({ slug: supplements.slug, name: supplements.name })
    .from(supplements);

  const results: Result[] = [];
  for (let i = 0; i < all.length; i++) {
    const { slug, name } = all[i];
    process.stdout.write(`[${i + 1}/${all.length}] ${slug} (${name}) ... `);

    // Try 3D first; fall back to 2D SDF if 3D unavailable.
    const sdfPath = path.join(OUT_DIR, `${slug}.sdf`);
    const pngPath = path.join(OUT_DIR, `${slug}.png`);

    const sdf3d = await fetchToFile(PUBCHEM_SDF_3D(name), sdfPath);
    const sdf2d = sdf3d ? false : await fetchToFile(PUBCHEM_SDF_2D(name), sdfPath);
    const png   = await fetchToFile(PUBCHEM_PNG(name), pngPath);

    if (sdf3d || sdf2d || png) {
      results.push({ slug, ok: true, sdf3d, sdf2d, png });
      console.log(`ok (3d=${sdf3d} 2d=${sdf2d} png=${png})`);
    } else {
      results.push({ slug, ok: false, reason: 'no match' });
      console.log('MISS');
    }

    await new Promise(r => setTimeout(r, THROTTLE_MS));
  }

  const ok = results.filter(r => r.ok);
  const manifest = {
    generatedAt: new Date().toISOString(),
    total: results.length,
    withSdf3d: results.filter(r => r.ok && (r as { sdf3d?: boolean }).sdf3d).length,
    withSdf2d: results.filter(r => r.ok && (r as { sdf2d?: boolean }).sdf2d).length,
    withPng: results.filter(r => r.ok && (r as { png?: boolean }).png).length,
    misses: results.filter(r => !r.ok).map(r => r.slug),
  };
  await fs.writeFile(
    path.join(OUT_DIR, '_manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log(`\nDone. ${ok.length}/${results.length} matched.`);
  console.log(`SDF 3D: ${manifest.withSdf3d}, SDF 2D fallback: ${manifest.withSdf2d}, PNG: ${manifest.withPng}`);
  console.log(`Manifest: ${path.join(OUT_DIR, '_manifest.json')}`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 4: Create .gitkeep and .gitignore rule**

```bash
mkdir -p public/molecules
touch public/molecules/.gitkeep
```

Open `.gitignore` and add:
```
# generated molecule assets; regenerated via scripts/fetch-molecules.ts
/public/molecules/*.sdf
/public/molecules/*.png
!/public/molecules/.gitkeep
!/public/molecules/_manifest.json
```

Rationale: SDF + PNG files are large and regeneratable; we commit the manifest (so the app knows what's available) and a .gitkeep to ensure the directory exists. Locally generated assets get gitignored.

**Decision point for deploy:** since Vercel builds from the committed tree, the runtime app won't have SDF files unless they're either (a) checked in, or (b) fetched at build time. Option (b) is cleaner — see Task 12 deploy step for build-time fetch.

Revise .gitignore — remove the `*.sdf` and `*.png` ignore lines if you want to commit them after running the script. **Recommendation: commit them.** They're ~10MB total for 279 supplements, static data, and committed assets are instant on Vercel CDN.

Updated .gitignore (no ignore for molecules):
```
# (no molecules ignore — assets committed)
```

- [ ] **Step 5: Verify typecheck**

```bash
npx tsc --noEmit --project tsconfig.json
```

Note: `scripts/**` is currently excluded from the project tsconfig (per memory). The script will typecheck when `tsx` runs it — that's enough.

- [ ] **Step 6: Run the script**

```bash
npx tsx scripts/fetch-molecules.ts 2>&1 | tee /tmp/fetch-molecules.log
```

Expected runtime: ~3 minutes for 279 supplements. Expected coverage per spec: ≥80% match. Review `public/molecules/_manifest.json` afterward.

- [ ] **Step 7: Commit the parser, script, and assets**

```bash
git add src/lib/sdf-parser.ts scripts/fetch-molecules.ts public/molecules/ .gitignore
git commit -m "feat(molecules): PubChem SDF+PNG fetcher + minimal parser + assets"
```

**If coverage is <60%:** STOP. Don't proceed to Task 9. Brainstorm whether the `base_compound` column on supplements gives us better search terms than `name` does. Don't silently ship a feature that misses half the catalog.

---

### Task 9: Generic `<MoleculeViewer />` primitive

**Files:**
- Create: `src/components/v2/three/MoleculeViewer.tsx`

- [ ] **Step 1: Create the viewer**

Create `src/components/v2/three/MoleculeViewer.tsx`:

```tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { type Molecule } from '@/lib/sdf-parser';

/**
 * Stick-and-ball molecule viewer. Real-chemistry positions from SDF.
 * Colors are CPK (standard): C=gray, H=white, O=red, N=blue, S=yellow, etc.
 * Pass the parsed Molecule. Size defaults to 320×320.
 */

const CPK_COLORS: Record<string, string> = {
  H: '#ffffff',
  C: '#909090',
  N: '#3050f8',
  O: '#ff0d0d',
  S: '#ffff30',
  P: '#ff8000',
  F: '#90e050',
  Cl: '#1ff01f',
  Br: '#a62929',
  I: '#940094',
  // Default fall-through
};

const ATOM_RADIUS: Record<string, number> = {
  H: 0.25,
  C: 0.4,
  N: 0.4,
  O: 0.4,
  S: 0.5,
  default: 0.4,
};

export function MoleculeViewer({
  molecule,
  size = 320,
  autoRotate = true,
  showHydrogens = true,
}: {
  molecule: Molecule;
  size?: number;
  autoRotate?: boolean;
  showHydrogens?: boolean;
}) {
  // Center atoms at origin
  const { atoms, bonds, scale } = useMemo(() => {
    const raw = showHydrogens
      ? molecule.atoms
      : molecule.atoms.filter(a => a.element !== 'H');

    // Build index remap if hydrogens stripped
    let indexMap: number[] = [];
    if (!showHydrogens) {
      let j = 0;
      indexMap = molecule.atoms.map(a => (a.element === 'H' ? -1 : j++));
    }

    const cx = raw.reduce((s, a) => s + a.x, 0) / (raw.length || 1);
    const cy = raw.reduce((s, a) => s + a.y, 0) / (raw.length || 1);
    const cz = raw.reduce((s, a) => s + a.z, 0) / (raw.length || 1);

    const centered = raw.map(a => ({ ...a, x: a.x - cx, y: a.y - cy, z: a.z - cz }));
    const maxD = centered.reduce(
      (m, a) => Math.max(m, Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z)),
      1
    );
    const s = 2.5 / maxD;

    const filteredBonds = showHydrogens
      ? molecule.bonds
      : molecule.bonds
          .filter(b => {
            const eA = molecule.atoms[b.a]?.element;
            const eB = molecule.atoms[b.b]?.element;
            return eA !== 'H' && eB !== 'H';
          })
          .map(b => ({ a: indexMap[b.a], b: indexMap[b.b], order: b.order }));

    return { atoms: centered, bonds: filteredBonds, scale: s };
  }, [molecule, showHydrogens]);

  return (
    <Canvas
      style={{ width: size, height: size }}
      camera={{ position: [0, 0, 6], fov: 40 }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <group scale={scale}>
        {atoms.map((atom, i) => {
          const color = CPK_COLORS[atom.element] ?? '#06d6a0';
          const radius = ATOM_RADIUS[atom.element] ?? ATOM_RADIUS.default;
          return (
            <mesh key={i} position={[atom.x, atom.y, atom.z]}>
              <sphereGeometry args={[radius, 24, 24]} />
              <meshStandardMaterial color={color} metalness={0.2} roughness={0.4} />
            </mesh>
          );
        })}
        {bonds.map((bond, i) => {
          const a = atoms[bond.a];
          const b = atoms[bond.b];
          if (!a || !b) return null;
          const mid = new THREE.Vector3((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
          const dir = new THREE.Vector3(b.x - a.x, b.y - a.y, b.z - a.z);
          const len = dir.length();
          const up = new THREE.Vector3(0, 1, 0);
          const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize());
          return (
            <mesh key={i} position={mid} quaternion={quat}>
              <cylinderGeometry args={[0.08, 0.08, len, 12]} />
              <meshStandardMaterial color="#a1a1aa" metalness={0.3} roughness={0.5} />
            </mesh>
          );
        })}
      </group>
      <OrbitControls
        autoRotate={autoRotate}
        autoRotateSpeed={0.6}
        enablePan={false}
        enableZoom={true}
        minDistance={3}
        maxDistance={10}
      />
    </Canvas>
  );
}
```

- [ ] **Step 2: Verify typecheck**

```bash
npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/v2/three/MoleculeViewer.tsx
git commit -m "feat(3d): <MoleculeViewer /> primitive — stick-and-ball renderer"
```

---

## PHASE 3 — 3D INTEGRATION

### Task 10: Home hero `<HeroConstellation />`

Render 6 trending molecules as a floating cluster on the home page.

**Files:**
- Create: `src/components/v2/three/HeroConstellation.tsx`
- Create: `src/components/v2/three/useMoleculeLoader.ts`
- Modify: `src/app/page.tsx` — mount the constellation in the hero

- [ ] **Step 1: Create the molecule loader hook**

Create `src/components/v2/three/useMoleculeLoader.ts`:

```ts
'use client';

import { useEffect, useState } from 'react';
import { parseSdf, type Molecule } from '@/lib/sdf-parser';

type LoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; molecule: Molecule }
  | { status: 'error' };

/**
 * Fetch /molecules/{slug}.sdf and parse to a Molecule.
 * Returns idle until the browser is idle (requestIdleCallback or 60ms timeout fallback).
 */
export function useMoleculeLoader(slug: string | null): LoadState {
  const [state, setState] = useState<LoadState>({ status: 'idle' });

  useEffect(() => {
    if (!slug) {
      setState({ status: 'idle' });
      return;
    }
    let cancelled = false;
    setState({ status: 'loading' });

    const load = async () => {
      try {
        const res = await fetch(`/molecules/${slug}.sdf`);
        if (!res.ok) throw new Error(`status ${res.status}`);
        const text = await res.text();
        if (cancelled) return;
        const molecule = parseSdf(text);
        if (molecule.atoms.length === 0) throw new Error('no atoms parsed');
        setState({ status: 'ready', molecule });
      } catch {
        if (!cancelled) setState({ status: 'error' });
      }
    };

    const idle = (cb: () => void) => {
      const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback;
      if (typeof ric === 'function') ric(cb);
      else setTimeout(cb, 60);
    };
    idle(load);

    return () => { cancelled = true; };
  }, [slug]);

  return state;
}
```

- [ ] **Step 2: Create the constellation component**

Create `src/components/v2/three/HeroConstellation.tsx`:

```tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import * as THREE from 'three';
import { useMoleculeLoader } from './useMoleculeLoader';
import { parseSdf, type Molecule } from '@/lib/sdf-parser';

type Node = { slug: string; name: string; delta: number };

const FALLBACK_ICONIC: Node[] = [
  { slug: 'creatine-monohydrate', name: 'Creatine', delta: 0 },
  { slug: 'nmn', name: 'NMN', delta: 0 },
  { slug: 'magnesium-glycinate', name: 'Magnesium Glycinate', delta: 0 },
  { slug: 'l-theanine', name: 'L-Theanine', delta: 0 },
  { slug: 'ashwagandha', name: 'Ashwagandha', delta: 0 },
  { slug: 'vitamin-d3', name: 'Vitamin D3', delta: 0 },
];

/**
 * Reads up to 6 nodes from the current trending snapshot (passed in by the
 * server component), falls back to iconic set if the snapshot is empty.
 * Each node renders as a small molecule at a seeded cluster position,
 * slowly rotating. Hover reveals name + delta pill and links to /research/{slug}.
 */
export function HeroConstellation({ nodes }: { nodes: Node[] }) {
  const effectiveNodes = nodes.length >= 3 ? nodes.slice(0, 6) : FALLBACK_ICONIC;

  // Seeded positions — consistent across renders, loose cluster around origin.
  const positions = useMemo(() => {
    return effectiveNodes.map((_, i) => {
      const angle = (i / effectiveNodes.length) * Math.PI * 2;
      const radius = 2.5 + (i % 2) * 0.8;
      return [
        Math.cos(angle) * radius,
        Math.sin(angle) * radius * 0.5,
        Math.sin(angle * 1.3) * 0.8,
      ] as [number, number, number];
    });
  }, [effectiveNodes]);

  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="relative w-full" style={{ height: 360 }}>
      <Canvas camera={{ position: [0, 0, 10], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 8, 5]} intensity={0.7} />
        {effectiveNodes.map((n, i) => (
          <ClusterMolecule
            key={n.slug}
            slug={n.slug}
            position={positions[i]}
            dim={hovered !== null && hovered !== n.slug}
            onHover={(h) => setHovered(h ? n.slug : null)}
          />
        ))}
        <OrbitControls
          autoRotate
          autoRotateSpeed={0.2}
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
        />
      </Canvas>

      {/* Hovered node label overlay */}
      {hovered && (() => {
        const node = effectiveNodes.find(n => n.slug === hovered);
        if (!node) return null;
        return (
          <div
            className="absolute left-1/2 bottom-4 -translate-x-1/2 flex items-center gap-2 px-3 py-2 rounded proto-advisor-pop"
            style={{
              background: 'rgba(9,9,11,0.85)',
              border: '1px solid var(--accent)',
              color: 'var(--fg)',
              fontFamily: 'var(--font-geist-mono)',
              fontSize: 12,
            }}
          >
            <Link href={`/research/${node.slug}`} style={{ color: 'var(--fg)' }}>
              {node.name}
            </Link>
            {node.delta !== 0 && (
              <span style={{ color: node.delta >= 0 ? 'var(--severity-low)' : 'var(--severity-high)' }}>
                {node.delta >= 0 ? '▲' : '▼'} {Math.abs(node.delta).toFixed(1)}%
              </span>
            )}
          </div>
        );
      })()}
    </div>
  );
}

function ClusterMolecule({
  slug,
  position,
  dim,
  onHover,
}: {
  slug: string;
  position: [number, number, number];
  dim: boolean;
  onHover: (h: boolean) => void;
}) {
  const state = useMoleculeLoader(slug);

  if (state.status !== 'ready') {
    // Fallback: mint-outlined sphere placeholder (matches "graceful degradation" in spec §2.1)
    return (
      <mesh
        position={position}
        onPointerOver={() => onHover(true)}
        onPointerOut={() => onHover(false)}
      >
        <sphereGeometry args={[0.6, 20, 20]} />
        <meshStandardMaterial
          color="#06d6a0"
          transparent
          opacity={dim ? 0.25 : 0.5}
          wireframe
        />
      </mesh>
    );
  }

  return (
    <group
      position={position}
      scale={dim ? 0.9 : 1.1}
      onPointerOver={() => onHover(true)}
      onPointerOut={() => onHover(false)}
    >
      <MoleculeMini molecule={state.molecule} dim={dim} />
    </group>
  );
}

/**
 * Compact inline renderer — same logic as MoleculeViewer but flattened (no Canvas
 * wrapper since we're nested inside the HeroConstellation Canvas).
 */
function MoleculeMini({ molecule, dim }: { molecule: Molecule; dim: boolean }) {
  const { atoms, bonds, scale } = useMemo(() => {
    const raw = molecule.atoms.filter(a => a.element !== 'H');
    let j = 0;
    const indexMap = molecule.atoms.map(a => (a.element === 'H' ? -1 : j++));
    const cx = raw.reduce((s, a) => s + a.x, 0) / (raw.length || 1);
    const cy = raw.reduce((s, a) => s + a.y, 0) / (raw.length || 1);
    const cz = raw.reduce((s, a) => s + a.z, 0) / (raw.length || 1);
    const centered = raw.map(a => ({ ...a, x: a.x - cx, y: a.y - cy, z: a.z - cz }));
    const maxD = centered.reduce((m, a) => Math.max(m, Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z)), 1);
    return {
      atoms: centered,
      bonds: molecule.bonds
        .filter(b => molecule.atoms[b.a]?.element !== 'H' && molecule.atoms[b.b]?.element !== 'H')
        .map(b => ({ a: indexMap[b.a], b: indexMap[b.b], order: b.order })),
      scale: 0.6 / maxD,
    };
  }, [molecule]);

  return (
    <group scale={scale}>
      {atoms.map((a, i) => (
        <mesh key={i} position={[a.x, a.y, a.z]}>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshStandardMaterial
            color={CPK_MINI[a.element] ?? '#06d6a0'}
            transparent
            opacity={dim ? 0.5 : 1}
            metalness={0.2}
            roughness={0.4}
          />
        </mesh>
      ))}
      {bonds.map((bond, i) => {
        const a = atoms[bond.a];
        const b = atoms[bond.b];
        if (!a || !b) return null;
        const mid = new THREE.Vector3((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
        const dir = new THREE.Vector3(b.x - a.x, b.y - a.y, b.z - a.z);
        const len = dir.length();
        const up = new THREE.Vector3(0, 1, 0);
        const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize());
        return (
          <mesh key={i} position={mid} quaternion={quat}>
            <cylinderGeometry args={[0.07, 0.07, len, 10]} />
            <meshStandardMaterial color="#a1a1aa" transparent opacity={dim ? 0.4 : 0.8} />
          </mesh>
        );
      })}
    </group>
  );
}

const CPK_MINI: Record<string, string> = {
  C: '#909090',
  N: '#3050f8',
  O: '#ff0d0d',
  S: '#ffff30',
  P: '#ff8000',
};
```

- [ ] **Step 3: Mount in the home page**

Modify `src/app/page.tsx`:

Add imports:
```tsx
import dynamic from 'next/dynamic';
```

Add dynamic import (outside the component):
```tsx
const HeroConstellation = dynamic(
  () => import('@/components/v2/three/HeroConstellation').then(m => ({ default: m.HeroConstellation })),
  { ssr: false }
);
```

Load the trending snapshot at top of component. Reuse existing `getLatestSnapshot()` from `@/lib/trending/aggregate`:

In `HomePage`, after `const counts = await loadLedgerCounts();` add:
```tsx
const snapshot = await getLatestSnapshot().catch(() => null);
const constellation = (snapshot?.payload?.trending ?? [])
  .slice(0, 6)
  .map(t => ({ slug: t.slug, name: t.name, delta: t.deltaWeek }));
```

And import at the top:
```tsx
import { getLatestSnapshot } from '@/lib/trending/aggregate';
```

In the hero section (line 78-94), after the `<HomeSearch />`, add:
```tsx
<div className="mt-8 md:mt-10">
  <HeroConstellation nodes={constellation} />
</div>
```

- [ ] **Step 4: Verify typecheck**

```bash
npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/components/v2/three/ src/app/page.tsx
git commit -m "feat(home): 3D trending constellation hero"
```

---

### Task 11: Supplement detail `<MoleculeCard />` — desktop

**Files:**
- Create: `src/components/v2/three/MoleculeCard.tsx`
- Modify: `src/app/research/[query]/page.tsx` — mount as sticky side column

- [ ] **Step 1: Create the card**

Create `src/components/v2/three/MoleculeCard.tsx`:

```tsx
'use client';

import dynamic from 'next/dynamic';
import { useMoleculeLoader } from './useMoleculeLoader';

const MoleculeViewer = dynamic(
  () => import('./MoleculeViewer').then(m => ({ default: m.MoleculeViewer })),
  { ssr: false }
);

/**
 * Sticky side card on the research page. Loads the slug's SDF, shows a rotating
 * 3D molecule with drag-to-rotate + scroll-to-zoom. Below the viewport:
 * element labels (once we parse formula), PubChem link. Desktop-only viewer —
 * mobile tree renders a different component (MoleculeCardMobile) — see Task 12.
 *
 * If the SDF fetch fails, returns null — the card is hidden entirely.
 */
export function MoleculeCard({ slug, name }: { slug: string; name: string }) {
  const state = useMoleculeLoader(slug);

  if (state.status === 'error') return null;

  const heading = (
    <div
      className="font-mono uppercase tracking-[1.4px]"
      style={{ color: 'var(--fg-dim)', fontSize: 10 }}
    >
      STRUCTURE · {name}
    </div>
  );

  return (
    <aside
      className="proto-scan-ambient rounded"
      style={{
        border: '1px solid var(--hair)',
        background: 'var(--surface)',
        padding: 16,
        width: 320,
      }}
    >
      {heading}
      <div style={{ width: 288, height: 288, marginTop: 10 }}>
        {state.status === 'ready' ? (
          <MoleculeViewer molecule={state.molecule} size={288} autoRotate showHydrogens={false} />
        ) : (
          <div
            className="flex items-center justify-center"
            style={{
              width: 288,
              height: 288,
              background: 'radial-gradient(circle, var(--accent-dim), transparent 70%)',
              color: 'var(--fg-dim)',
              fontFamily: 'var(--font-geist-mono)',
              fontSize: 11,
            }}
          >
            loading structure…
          </div>
        )}
      </div>
      <a
        href={`https://pubchem.ncbi.nlm.nih.gov/#query=${encodeURIComponent(name)}`}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex items-center gap-1 font-mono text-[11px]"
        style={{ color: 'var(--accent)' }}
      >
        view on PubChem →
      </a>
    </aside>
  );
}
```

- [ ] **Step 2: Mount on the research page as sticky side column**

Open `src/app/research/[query]/page.tsx`. The page renders a research report. Find the outer wrapper and turn it into a two-column layout at `md:` and above.

Add import:
```tsx
import { MoleculeCard } from '@/components/v2/three/MoleculeCard';
```

Assuming the existing return shape looks like:
```tsx
return (
  <main>
    <ReportHeader ... />
    <ScoreStrip ... />
    <OverviewSection ... />
    ...
  </main>
);
```

Change to a two-column layout:
```tsx
return (
  <main>
    <div className="mx-auto max-w-[1200px] px-5 md:px-10 lg:px-16">
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-10">
        <div className="flex-1">
          <ReportHeader ... />
          <ScoreStrip ... />
          <OverviewSection ... />
          ...
        </div>
        <div className="md:sticky md:top-20 md:w-[320px] md:flex-shrink-0">
          <MoleculeCard slug={slug} name={supplement.name} />
        </div>
      </div>
    </div>
  </main>
);
```

Note: the exact wrapper and prop shape depends on existing markup. Match it surgically — don't rewrite the inner structure. Reference the actual file before editing.

- [ ] **Step 3: Verify typecheck**

```bash
npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/v2/three/MoleculeCard.tsx src/app/research/
git commit -m "feat(research): sticky 3D molecule card on desktop"
```

---

### Task 12: Mobile lazy 3D + final verify & deploy

**Files:**
- Create: `src/components/v2/three/MoleculeCardMobile.tsx`
- Modify: `src/components/v2/three/MoleculeCard.tsx` — switch between desktop/mobile renderers
- Modify: `src/app/research/[query]/page.tsx` — responsive mount

- [ ] **Step 1: Create the mobile placeholder**

Create `src/components/v2/three/MoleculeCardMobile.tsx`:

```tsx
'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

const MoleculeViewer = dynamic(
  () => import('./MoleculeViewer').then(m => ({ default: m.MoleculeViewer })),
  { ssr: false }
);

import { useMoleculeLoader } from './useMoleculeLoader';

/**
 * Mobile placeholder — shows 2D PNG by default. Tap "Rotate in 3D" to lazy-load
 * Three.js and mount the 3D viewer. This keeps ~200KB of 3D code off the mobile
 * critical path for users who don't opt in.
 */
export function MoleculeCardMobile({ slug, name }: { slug: string; name: string }) {
  const [active, setActive] = useState(false);
  const state = useMoleculeLoader(active ? slug : null);

  return (
    <aside
      className="proto-scan-ambient rounded w-full"
      style={{
        border: '1px solid var(--hair)',
        background: 'var(--surface)',
        padding: 16,
      }}
    >
      <div
        className="font-mono uppercase tracking-[1.4px]"
        style={{ color: 'var(--fg-dim)', fontSize: 10 }}
      >
        STRUCTURE · {name}
      </div>
      <div className="mt-3 relative" style={{ width: '100%', height: 280 }}>
        {!active ? (
          <>
            <img
              src={`/molecules/${slug}.png`}
              alt={`${name} 2D structure`}
              className="w-full h-full object-contain"
              style={{ background: 'radial-gradient(circle, var(--accent-dim), transparent 70%)' }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            <button
              type="button"
              onClick={() => setActive(true)}
              className="absolute inset-0 flex items-center justify-center font-mono text-[12px] proto-focus"
              style={{
                color: 'var(--accent)',
                background: 'rgba(9,9,11,0.6)',
                border: '1px solid var(--accent)',
                borderRadius: 4,
              }}
            >
              tap to rotate in 3D →
            </button>
          </>
        ) : state.status === 'ready' ? (
          <MoleculeViewer molecule={state.molecule} size={280} autoRotate showHydrogens={false} />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ color: 'var(--fg-dim)', fontFamily: 'var(--font-geist-mono)', fontSize: 11 }}
          >
            loading structure…
          </div>
        )}
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Switch MoleculeCard to render desktop vs mobile variant**

Create a lightweight viewport hook, then update the existing `MoleculeCard.tsx` to return one or the other.

Create `src/hooks/useIsMobile.ts`:

```ts
'use client';

import { useEffect, useState } from 'react';

/** true when viewport < 768px, updated on resize. Avoids hydration mismatch by starting false. */
export function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setMobile(mq.matches);
    const listener = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, [breakpoint]);
  return mobile;
}
```

Update `src/components/v2/three/MoleculeCard.tsx` to dispatch:

```tsx
'use client';

import { useIsMobile } from '@/hooks/useIsMobile';
import { MoleculeCardMobile } from './MoleculeCardMobile';
import { MoleculeCardDesktop } from './MoleculeCardDesktop';

export function MoleculeCard({ slug, name }: { slug: string; name: string }) {
  const isMobile = useIsMobile();
  if (isMobile) return <MoleculeCardMobile slug={slug} name={name} />;
  return <MoleculeCardDesktop slug={slug} name={name} />;
}
```

Rename the original `MoleculeCard` body from Task 11 into `src/components/v2/three/MoleculeCardDesktop.tsx` (same file, same code, exported as `MoleculeCardDesktop`).

- [ ] **Step 3: Verify typecheck**

```bash
npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/v2/three/ src/hooks/useIsMobile.ts
git commit -m "feat(research): mobile 2D-placeholder + tap-to-activate 3D"
```

- [ ] **Step 5: Verify against spec success criteria**

Before deploying, walk through the 11 binary checks from spec §8. Check each item locally by running through the app. Fix anything that fails inline.

1. ✅ Ledger numbers tick from 0 on home scroll (Task 1)
2. ✅ Sections fade in on scroll (Task 2)
3. ✅ Scan beam on MostPopular + Trending (Task 3)
4. ✅ Hover depth on Most Popular tiles (Task 4)
5. ✅ View Transition morph home → research (Task 5)
6. ✅ Trending deltas pulse on return visit (Task 6)
7. ✅ Home constellation renders ≥3 molecules within 3s (Task 10)
8. ✅ Detail sticky card renders 3D molecule desktop within 2s (Task 11)
9. ✅ Mobile detail shows 2D placeholder with "Tap to rotate" CTA (Task 12)
10. ✅ `npx tsc --noEmit` exits 0
11. ✅ Vercel production deploy succeeds, home + research pages return 200 under 1s

- [ ] **Step 6: Deploy to preview**

```bash
vercel --yes > /tmp/final-preview.log 2>&1
cat /tmp/final-preview.log | tail -20
```

Open the preview URL. Smoke test on desktop + a real mobile device or Chrome DevTools mobile emulation.

- [ ] **Step 7: If preview looks good, deploy to production**

ONLY after user review. Do not auto-deploy to prod — ask first.

```bash
# Only with user approval:
vercel --prod --yes
```

- [ ] **Step 8: Final commit (if any follow-up fixes made)**

Any last fixes from the smoke test, then:

```bash
git push origin main
```

---

## Appendix — assumptions to watch

Per spec §9. If any of these turn out false mid-implementation, stop and flag to the user — don't silently patch around them.

1. PubChem by-name finds ≥80% of supplements. Measured by `public/molecules/_manifest.json`. If <60%, stop and rethink acquisition.
2. Three.js on mobile is acceptable. Validated in Task 12 smoke test.
3. View Transitions API works in target browsers.
4. Trending snapshot has ≥6 entries (DB shows 25 today). Fallback defined in `HeroConstellation`.
5. No new backend work needed.
6. Stick-and-ball rendering is enough — no shader polish needed.

---

## Spec coverage self-check

| Spec requirement | Task(s) |
|------------------|---------|
| Home hero constellation (§2.1) | 10 |
| Supplement detail molecule card (§2.2) | 11, 12 |
| Molecule acquisition script (§2.3) | 8 |
| Number ticking on load (§3.1) | 1 |
| Scroll-triggered reveals (§3.2) | 2 |
| Ambient scan beam (§3.3) | 3 |
| Hover depth on tiles (§3.4) | 4 |
| View Transitions API (§3.5) | 5 |
| Live delta animations (§3.6) | 6 |
| Mobile strategy — lazy (§5) | 12 |
| Phase 1 acceptance test | Task 6 Step 7 |
| Phase 2 acceptance test | Task 12 Step 5 |
| All 11 success criteria | All tasks; checked in 12.5 |

No placeholders. Type consistency checked: `Molecule`, `Atom`, `Bond` from sdf-parser used identically in MoleculeViewer, HeroConstellation, and both card variants. `useMoleculeLoader` signature consistent everywhere.
