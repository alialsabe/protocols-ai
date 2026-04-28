# Kinetic + Cinematic frontend for Materia

**Date:** 2026-04-17
**Author:** Claude (brainstormed with Ali)
**Status:** Draft — awaiting user review

## Goal

Make Materia feel **alive and cinematic** without abandoning its "scientific instrument" thesis. The current app looks authoritative but static — this design adds kinetic motion everywhere and 3D molecular structures in two flagship spots (home hero + supplement detail pages), so the app feels like an instrument panel that's actually plugged in and running.

## Decisions (locked during brainstorm)

| Question | Chosen |
|----------|--------|
| What does "fun" mean here? | **Alive** (kinetic motion) + **Cinematic** (3D hero moments) |
| Where does 3D live? | **Home hero** + **Supplement detail** (skip stack + ambient for now) |
| Home hero form | **Trending constellation** — 6-8 molecules from live snapshot |
| Detail page layout | **Sticky side card** — right column desktop, inline top mobile |
| Kinetic treatments | **All six** (see §3) |
| Mobile 3D strategy | **Lazy-load on mobile** — 2D placeholder, tap to activate 3D |

---

## 1. Scope

**Ships in this spec:**

1. **Home hero constellation** — 6-8 real molecules from the trending snapshot floating in a Three.js scene, hover reveals name + trend delta
2. **Supplement detail molecule card** — sticky side card on desktop, inline above content on mobile (lazy-loaded on mobile), rendered from PubChem SDF data
3. **Kinetic treatments (all 6)** — number ticking, scroll reveals, scan beams on data tables, hover depth on tiles, View Transitions API, live delta animations on trending
4. **Molecule acquisition script** — one-time `scripts/fetch-molecules.ts` that pulls SDF structure files from PubChem by name for all 279 supplements, stores as static assets in `/public/molecules/{slug}.sdf`

**Explicitly out of scope:**

- Stack builder 3D constellation (deferred to phase 3)
- Ambient 3D background layer
- Meta 3D Gen integration — not needed; PubChem gives us real chemistry
- Stack/compare/advisor page redesigns
- Any DB migrations (molecule data lives on disk)
- Any new runtime API calls to PubChem (build-time fetch only)

---

## 2. 3D features

### 2.1 Home hero constellation

**Where:** Sits inside the hero block on `src/app/page.tsx`, to the right of the CommandBar on desktop (`md:` breakpoint), full-width above the CommandBar on mobile.

**What renders:** 6 molecules from the current `trending_snapshot` (top 6 by mention count), positioned in a loose cluster using seeded randomness (so layout is stable across renders). Slow global rotation (~20s per full spin). Mouse-parallax tilt on desktop hover. Each molecule labelled with its abbreviated name and `+X%` delta.

**Interaction:** Hover a molecule → scale up 1.1×, name + delta pill appears with mint glow, other molecules dim to 60% opacity. Click → navigate to `/research/{slug}`.

**Data flow:**

1. Page server-component reads `trending_snapshot.payload.trending[0..6]`.
2. Passes `[{slug, name, delta}]` to `<HeroConstellation />` client component.
3. Client fetches `/molecules/{slug}.sdf` for each slug in parallel on mount.
4. Parses SDF, builds atom + bond geometry, renders via `@react-three/fiber`.

**Fallback:** If SDF fetch fails for a slug, that node renders as a mint-outlined sphere with the name. No molecule = graceful degradation, not an error state.

### 2.2 Supplement detail molecule card

**Where:** New component `<MoleculeCard />` inside `src/app/research/[query]/page.tsx`, positioned as a sticky right column on `md:` and above (`sticky top-20`). On mobile, renders inline after the `ReportHeader` but before the `ScoreStrip`.

**What renders:**
- 320×320 3D viewport (desktop), 100%×320 (mobile)
- Rotating molecule, user can drag to rotate manually, scroll to zoom (desktop only)
- Below the viewport: formula, molecular weight, CAS number (if present in SDF metadata), link to PubChem source
- "Reset view" button to re-center

**Mobile lazy-load:** Mobile renders a placeholder card showing a 2D PubChem PNG (fetched at build time too, stored at `/molecules/{slug}.png`) with a "Tap to rotate in 3D" button overlay. Tapping mounts the 3D component and starts rendering. This keeps the ~200-400KB of Three.js off the mobile critical path.

**Fallback:** If `/molecules/{slug}.sdf` doesn't exist (acquisition failed for that supplement), the card is hidden entirely. Report page renders without it.

### 2.3 Molecule acquisition script

**File:** `scripts/fetch-molecules.ts`

**What it does:**
1. Reads all published supplements from the DB (`SELECT slug, name FROM supplements`)
2. For each supplement, calls PubChem REST:
   - `GET https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{name}/SDF?record_type=3d`
   - `GET https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{name}/PNG?record_type=2d&image_size=600x600`
3. Saves to `/public/molecules/{slug}.sdf` and `/public/molecules/{slug}.png`
4. Logs successes and failures to `scripts/fetch-molecules.log`
5. Writes a summary JSON `public/molecules/_manifest.json` listing which slugs have which formats

**Success criteria:** ≥80% of 279 supplements get at least an SDF file. Complex/proprietary blends (e.g. "KSM-66 Ashwagandha Extract") may fail — that's expected and logged, not retried.

**Run cadence:** Manual, one-off for now. Re-run when catalog changes significantly. No cron.

**Throttling:** 500ms between requests (PubChem rate limits ~5 req/sec). Full run of 279 supplements ≈ 3 minutes.

---

## 3. Kinetic treatments

All six ship, each as a small isolated addition. No framework changes.

### 3.1 Number ticking on load

- New hook `src/hooks/useCountUp.ts` — takes `targetValue`, animates from 0 to target over 800ms using `requestAnimationFrame`
- Respects `prefers-reduced-motion` (jumps straight to target)
- Used in: ledger counts on home, score values on Most Popular tiles, any display of `{number}` from DB
- Implementation: ~30 lines, no dependency

### 3.2 Scroll-triggered section reveals

- New hook `src/hooks/useRevealOnScroll.ts` — IntersectionObserver wrapper
- When element enters viewport: adds `.is-visible` class → CSS transitions `opacity` 0→1 and `translateY(8px)→0` over 400ms
- Applied to: home page sections (Ticker, Trending, MostPopular, Capability, Ledger), research page sections
- Respects `prefers-reduced-motion`

### 3.3 Ambient scan beam on data tables

- New CSS utility class `.proto-scan-ambient` added to `globals.css`
- Existing CommandBar scan-beam animation refactored — extract keyframes + pseudo-element into reusable class
- Applied to: MostPopular grid container, TrendingSection container, MoleculeCard container
- Longer cycle than CommandBar (12s vs 4s), lower opacity (mint at 4%)

### 3.4 Hover depth on supplement tiles

- CSS-only addition to existing tile components
- On hover: `translateY(-4px)` + box-shadow mint glow + `font-variation-settings` bump on the name (weight 500→600)
- Metadata row (category, score, etc.) fades in below the name — was previously always visible, now shows on hover only with a height transition
- Desktop only (pointer:fine) — mobile has tap states, no hover

### 3.5 Page transitions via View Transitions API

- Add `document.startViewTransition()` wrapper around `router.push()` calls from home → research
- Same-element `view-transition-name: supplement-hero-{slug}` on the molecule name + the detail page header
- Result: the name morphs into the header, rest of page crossfades
- Chrome / Edge / Safari only. Firefox falls through to normal navigation (no change from today)
- No polyfill — graceful degradation only
- Implemented as a small helper `src/lib/view-transition.ts` that wraps any navigation

### 3.6 Live delta animations on trending

- Store `last_seen_snapshot_generated_at` in localStorage on page load
- On subsequent loads, if the current snapshot is newer: animate changed deltas with a 300ms pulse (mint scale + opacity)
- Rank changes: use FLIP (First Last Invert Play) pattern with a CSS transition to shift rows into their new positions
- Unchanged rows don't animate — only rows with new data get the treatment

---

## 4. Dependencies

| Package | Why | Size (gzip) |
|---------|-----|-------------|
| `three` | 3D rendering | ~150KB |
| `@react-three/fiber` | React bindings for Three.js | ~20KB |
| `@react-three/drei` | Camera controls, orbit | ~40KB (tree-shaken) |

**Total added to bundle:** ~210KB — only on pages that use 3D (code-split). Home page loads it; detail pages load it on desktop immediately, on mobile only when user taps "Rotate in 3D".

**What we're NOT adding:**
- Any animation library (Framer Motion etc.) — native CSS + `requestAnimationFrame` is enough
- Any 3D-model-generation API (Meta 3D Gen) — PubChem gives us real molecules
- Any SDF parser lib — we'll write ~50 lines of minimal SDF parser inline (atom positions + bonds only, skip charges/stereo)

---

## 5. Mobile strategy

- **Home hero constellation:** Renders on mobile too. Reduced atom count (strip hydrogens), 30fps cap instead of 60fps, 3 molecules instead of 6 at viewport width <640px. If WebGL unavailable → renders as mint-outlined static spheres with names (same fallback as per-molecule failure in 2.1).
- **Detail page molecule card:** Placeholder with 2D PNG + "Tap to rotate in 3D" button. Tapping lazy-loads `@react-three/fiber` bundle and mounts the viewer. Desktop loads immediately.
- **Kinetic treatments:** All six work identically on mobile. `prefers-reduced-motion` respected.

---

## 6. File changes

**New files:**

```
scripts/fetch-molecules.ts
src/hooks/useCountUp.ts
src/hooks/useRevealOnScroll.ts
src/lib/view-transition.ts
src/lib/sdf-parser.ts
src/components/v2/three/HeroConstellation.tsx
src/components/v2/three/MoleculeCard.tsx
src/components/v2/three/MoleculeViewer.tsx          (shared 3D primitive)
src/components/v2/three/MoleculeCardMobile.tsx      (2D placeholder + lazy activate)
public/molecules/{slug}.sdf                          (279 files, ~3KB each)
public/molecules/{slug}.png                          (279 files, ~30KB each)
public/molecules/_manifest.json                      (acquisition result summary)
```

**Modified files:**

```
src/app/page.tsx                          — mount <HeroConstellation /> in hero, wrap counts in <CountUp />
src/app/research/[query]/page.tsx         — mount <MoleculeCard /> as side column
src/app/globals.css                       — .proto-scan-ambient, hover-depth utilities, view-transition-name hooks, reveal-on-scroll base classes
src/components/v2/CommandBar.tsx          — keep existing beam, factor out keyframes (shared)
src/components/v2/trending/TrendingSection.tsx   — wrap in .proto-scan-ambient, add FLIP animation on rank changes
src/components/v2/trending/MostPopularFilterable.tsx  — wrap in .proto-scan-ambient, tile hover depth
package.json                              — add three, @react-three/fiber, @react-three/drei
```

**No changes:**
- Database schema
- API routes
- `src/lib/trending/*` backend
- Stack, advisor, compare pages

---

## 7. Phasing

Deliberate split for reviewability. Each phase deploys independently.

### Phase 1 — Kinetic (ships first, no new dependencies)

Builds all 6 kinetic treatments. No Three.js, no PubChem. Pure CSS + small hooks.

**Deliverable:** home + research pages feel alive. View Transitions morph names between pages. Ledger counts tick up. Scan beams sweep tables. Hover tiles lift.

**Acceptance test:** Load home on a throttled 3G mobile profile. All animations play smoothly (>30fps). `prefers-reduced-motion: reduce` disables every animation except the existing CommandBar beam.

### Phase 2 — 3D (ships second, adds Three.js)

Adds the molecule acquisition script, home hero constellation, and supplement detail card.

**Deliverable:** molecules render on home + detail pages. Script has been run successfully with ≥80% SDF coverage.

**Acceptance test:**
- `/` renders constellation from current trending snapshot
- `/research/creatine-monohydrate` renders a known-good molecule in the side card
- `/research/lemon-balm-extract` (a likely failure case — extract, not a pure compound) either renders fallback or hides card cleanly, no error
- Mobile detail page shows 2D placeholder until tapped

---

## 8. Success criteria (verifiable)

Per Karpathy rule 4 — every item below is binary pass/fail.

1. **Ledger numbers animate from 0 to final value** within 800ms of entering viewport on home page
2. **Home page sections fade in** sequentially on scroll (Ticker → Trending → MostPopular → Capability → Ledger)
3. **MostPopular + Trending tables show scan beam** sweeping every ~12s
4. **Hovering a MostPopular tile lifts it 4px** with mint glow
5. **Clicking a molecule link from home → research page morphs** the name into the detail header (Chrome/Safari)
6. **Trending section on second visit** animates any changed deltas with pulse + row-reorder
7. **Home page renders 3D constellation** of ≥3 trending molecules within 3 seconds on desktop broadband
8. **Supplement detail sticky card renders 3D molecule** within 2 seconds on desktop
9. **Mobile detail card renders 2D placeholder** with "Tap to rotate in 3D" CTA
10. **`npx tsc --noEmit` exits 0** after all changes
11. **Vercel production deploy succeeds** and home + a research page both return 200 under 1s TTFB

---

## 9. Assumptions (flag if wrong)

1. **PubChem by-name lookup will find ≥80% of our 279 supplements.** Some (especially branded extracts like "KSM-66", "Ashwagandha KSM-66", proprietary blends) will fail. Script logs failures; we accept the misses and move on, rather than chasing every supplement.
2. **User is fine with Three.js on mobile**, lazy-loaded. If this turns out to be noticeably slow on low-end Android, we downgrade to mobile strategy B (2D only on mobile).
3. **View Transitions API works in the user's target browsers.** Current Chrome + Safari cover ≥90% of their traffic. Firefox users get normal nav.
4. **The trending snapshot always has ≥6 entries.** It does today (25 entries). If the snapshot is empty (pre-cron on a fresh deploy), home hero falls back to 6 hand-picked iconic molecules (Creatine, NMN, Magnesium Glycinate, L-Theanine, Ashwagandha, Vitamin D3).
5. **No new backend work.** Everything data-related comes from existing tables and the snapshot.
6. **No state of art 3D needed.** Stick-and-ball molecule rendering is scientifically correct and performant; we don't need raycast-shaded pharmaceutical-grade visualizations.

---

## 10. Risks

| Risk | Mitigation |
|------|------------|
| PubChem fetch miss rate >50% | Script dry-run first; if too many misses, brainstorm whether we can use PubChem CID from supplement's `base_compound` field instead of name |
| Bundle size explosion from Three.js | Code-split (already planned via dynamic import); monitor `vercel build` output; abort phase 2 if home-page JS exceeds 400KB gzip |
| Mobile FPS drops | 30fps cap + 3-molecule limit on small viewports (§5); test on real device before ship |
| View Transitions API jank on slow nav | It only activates on same-origin nav; if it feels bad, disable with a single flag in `src/lib/view-transition.ts` |
| Molecules for supplement "extracts" render as simple compounds | Acceptable. The card shows the dominant active compound. Document this in the card footer. |

---

## 11. Post-ship (explicit future work)

Not in this spec. Listed here so they don't creep in:

- Stack builder 3D constellation (your interactive stack as a molecular network)
- Supplement interactions visualized as inter-molecular bonds
- PubChem CID column in DB (instead of build-time file fetch) — only if we ever need runtime lookups
- Shader polish pass on the molecules (glass-material, caustics, etc.)
- User-uploaded molecules / custom compounds
