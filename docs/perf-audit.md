# Performance Audit — Materia

## Executive Summary

The homepage is fully `force-dynamic` and fires 3 uncached DB count queries on every single request, while simultaneously shipping Three.js + WebGL + postprocessing (~1 MB JS) eagerly on first load. The `/api/supplements` and `/api/supplements/suggestions` routes also hit the DB (full table scans, no server-side caching) on every call, and `lookupSupplement()` contains two N+1 query loops that run on every research page load. These three categories — forced dynamic rendering, uncached eager 3D bundle, and N+1 queries — account for the vast majority of slowness.

---

## Critical Issues (fix first)

### 1. Homepage is `force-dynamic` with 3 unneeded live DB queries

**File:** `src/app/page.tsx:17`
```
export const dynamic = 'force-dynamic';
```
`loadLedgerCounts()` (lines 19-35) fires three `COUNT(*)` queries against `supplements`, `clinical_studies`, and `supplement_science` on **every request**. These numbers change at most when the DB is seeded — they are ideal candidates for ISR or a `React.cache()` wrapper. With `force-dynamic`, Next.js bypasses all page-level caching, so every visitor triggers a full server render plus 3 DB roundtrips just to display static-looking counter numbers.

**Estimated impact:** Worst single fix. Switching to `revalidate = 3600` (ISR) would make the homepage static-served from CDN for all visitors who don't need real-time data.

---

### 2. Three.js / @react-three/fiber loaded eagerly on the homepage

**Files:** `src/components/v2/molecule/SplitDeck.tsx:17` (imports `MoleculeCard` directly), `src/components/v2/molecule/MoleculeCard.tsx:16-18`

`SplitDeck` is a `'use client'` component that eagerly imports `Canvas` from `@react-three/fiber`, `Bloom`/`EffectComposer` from `@react-three/postprocessing`, and `THREE` from `three`. These three packages together are **~900 KB–1.1 MB** gzipped. They are rendered inside a `<Suspense>` boundary on the homepage but the JS bundle itself is still included in the initial page chunk because there is no `dynamic(() => import(...), { ssr: false })` wrapping.

**File:** `package.json:25-27` — `@react-three/fiber ^9.6.0`, `@react-three/postprocessing ^3.0.4`, `three ^0.169.0`

**Estimated impact:** Shaving ~1 MB from the initial JS download. On a 3G connection (1.5 Mbps) that is ~5 seconds of parse + download time.

---

### 3. N+1 queries in `lookupSupplement()` — runs on every research page load

**File:** `src/lib/supplement-lookup.ts:505-528` and `src/lib/supplement-lookup.ts:530-539`

Two `Promise.all()` blocks both call `getSupplementNameById()` in a loop:
- **Conflicts loop (line 515-527):** For each conflict row matching this supplement, calls `getSupplementNameById(otherId)` — that is one DB query per conflict. A supplement with 5 conflicts fires 5 separate queries.
- **Companion loop (line 531-538):** Same pattern — one `getSupplementNameById` per companion supplement.

Additionally, `listConflicts()` at line 427 fetches the **entire `conflicts` table** (no WHERE clause) on every research page load, then filters in JS.

**File:** `src/lib/db.ts:215-217`
```ts
export async function listConflicts() {
  return db.select().from(supplementConflicts);
}
```
No WHERE, no LIMIT. As the conflicts table grows this becomes a full table scan returned over the network.

**Estimated impact:** A research page for a supplement with 4 conflicts and 3 companions fires 7 extra DB roundtrips beyond the base query. At Supabase free tier latencies (10-50 ms/query), that is 70-350 ms added per page.

---

### 4. N+1 queries in `/api/stack` GET — one DB query per supplement in the stack

**File:** `src/app/api/stack/route.ts:41-44`
```ts
for (const sid of supplementIds) {
  const sRows = await db.select().from(supplements).where(eq(supplements.id, sid)).limit(1);
  ...
}
```
Each supplement ID in the saved stack triggers a separate sequential DB query. A user with 10 supplements fires 11 DB queries (1 for the stack + 10 for names). Same pattern in `loadStackSupplementsForUser()` in the advisor route.

**File:** `src/app/api/advisor/route.ts:91-98`
```ts
for (const id of ids.slice(0, 25)) {
  const r = await db.select({ name: supplementsTable.name })...
}
```

**Estimated impact:** Medium-high. Adds 50-500 ms per `/api/stack` call depending on stack size and DB latency.

---

### 5. N+1 queries in `/stack/[publicId]/page.tsx`

**File:** `src/app/stack/[publicId]/page.tsx:50-54`
```ts
for (const id of supplementIds) {
  const rows = await db.select().from(supplements).where(eq(supplements.id, id)).limit(1);
  ...
}
```
Same sequential loop per supplement. No caching on this page either — it runs on every view.

**Estimated impact:** Same as #4.

---

### 6. Scheduler fires `findSupplementByQuery()` + `getScheduleRuleBySupplementId()` in a sequential loop

**File:** `src/lib/scheduler-engine.ts:86-132`
```ts
for (const slugOrQuery of input.supplements) {
  const match = await findSupplementByQuery(slugOrQuery);  // itself calls listSupplementsBasic() — full table scan
  const rule = await getScheduleRuleBySupplementId(match.id);
}
```
`findSupplementByQuery()` calls `listSupplementsBasic()` which is a full table scan on supplements. So for a stack of N supplements, the scheduler fires `N * 2` DB queries, plus a final `listConflicts()` full table scan. For a 10-supplement stack: 21 DB queries.

**Estimated impact:** High for `/api/scheduler`. A 10-supplement request adds ~200-1000 ms of DB time.

---

## Medium Issues

### 7. `/api/supplements` — no server-side cache, full table scan on 4 tables

**File:** `src/app/api/supplements/route.ts:3-7`

Calls `listProtocolsSupplements()`, `listAllTags()`, `listAllTypes()`, `listAllStudyCounts()` — 4 sequential full table scans — on every single GET request. The `MostPopularFilterable` component (homepage) calls this via `fetch('/api/supplements')` on mount. The route does set `Cache-Control: public, s-maxage=3600` but this only works if a CDN is in front (Vercel Edge). Without edge caching, every cold origin request re-runs all 4 queries.

**Estimated impact:** 50-200 ms per cache miss, + cumulative load on Supabase free tier connection pool.

---

### 8. `/api/supplements/suggestions` — full `listSupplementsBasic()` table scan on every keystroke

**File:** `src/app/api/supplements/suggestions/route.ts:9`

`getSuggestions()` calls `listSupplementsBasic()` (full table scan) on every request. With a debounced search field that fires after each keystroke, this is potentially many parallel DB queries for a single user typing "creatine". No cache headers set on this route.

**Estimated impact:** Medium. Degrades search-as-you-type UX and hammers the DB connection pool.

---

### 9. `loadWindow()` in trending aggregate: no row limit

**File:** `src/lib/trending/aggregate.ts:109-116`

```ts
const rows = await db
  .select({ slug, sourceId, mentionedAt })
  .from(supplementMentions)
  .where(conditions);
```

No `.limit()`. This fetches every `supplement_mentions` row within a 7-day or 14-day window with no upper bound. As the mentions table grows (it accumulates every RSS/Reddit/YouTube refresh), this query returns increasingly large result sets, all aggregated in-memory in JS.

**Estimated impact:** Low now, critical at scale. At 10k rows/week this returns 10k+ rows per query.

---

### 10. `next.config.ts` is completely empty — no optimizations configured

**File:** `next.config.ts:3-4`
```ts
const nextConfig: NextConfig = {
};
```

Missing: `images.domains`/`remotePatterns`, `compress`, `poweredByHeader: false`, `experimental.optimizeCss`, or any bundle analyzer config. No image optimization domains means Next.js `<Image>` falls back to unoptimized mode for external images.

**Estimated impact:** Medium. Unoptimized images and no compression config.

---

### 11. `MoleculeCard` uses `dpr={[1, 2]}` — renders at 2x pixel ratio

**File:** `src/components/v2/molecule/MoleculeCard.tsx:131`
```ts
<Canvas dpr={[1, 2]} gl={{ antialias: true, ... powerPreference: 'high-performance' }}>
```

On a Retina display the WebGL canvas renders at 2× resolution. Combined with `Bloom` postprocessing (which runs an additional render pass), this is significant GPU work on mobile devices.

**Estimated impact:** Battery drain and frame drops on mobile, especially mid-range Android.

---

### 12. `useSdfMolecule` fetches a new `.sdf` file on every slug change — no local cache

**File:** `src/lib/useSdfMolecule.ts:77-87`

Every time the user hovers over a different row in the trending list, `useSdfMolecule(activeSlug)` fires a new `fetch('/molecules/slug.sdf')` with no in-memory cache. Hovering through all 8 trending rows fires up to 8 SDF requests. The browser HTTP cache helps on repeat visits, but the first pass re-fetches on every hover.

**Estimated impact:** 8 × (network roundtrip + SDF parse) on first interaction. Each SDF is ~1-10 KB so bandwidth is minimal, but latency stacks up if the user hovers quickly.

---

### 13. `getSupplementBundleById()` is sequential, not parallel — comment says "Supabase free tier"

**File:** `src/lib/db.ts:177-183`

Six sequential `await` DB calls (science, social, sentiment, dosage, schedule, affiliate) run one after another. The comment acknowledges this is a free-tier workaround. On a paid plan these should run in `Promise.all()`.

**Estimated impact:** At 10 ms per query: 60 ms added per research page. At 50 ms (Supabase cold connection): 300 ms.

---

## Quick Wins (< 30 min each)

- **Add `revalidate = 3600` to `src/app/page.tsx`** and remove `force-dynamic`. Move `loadLedgerCounts()` behind `unstable_cache` or use ISR. The ledger numbers don't need to be live.
- **Wrap `MoleculeCard` import in SplitDeck with `dynamic(() => import('./MoleculeCard'), { ssr: false })`** to code-split Three.js out of the initial bundle.
- **Fix `/api/supplements/suggestions`**: add `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` — suggestions for "vitamin c" will be the same for every user.
- **Fix `/api/supplements`**: already has CDN cache headers — verify Vercel edge is actually caching it by checking `x-vercel-cache: HIT` in response headers.
- **Replace N+1 in `/api/stack` GET**: Use `db.select().from(supplements).where(inArray(supplements.id, supplementIds))` — one query instead of N.
- **Replace N+1 in `/stack/[publicId]/page.tsx`**: Same `inArray` fix.
- **Add `limit(200)` to `loadWindow()` in aggregate.ts** as a safety bound.
- **Add `limit(500)` to `listConflicts()`** as a safety bound while the proper fix (WHERE clause) is implemented.
- **Reduce `dpr` max to 1.5** in MoleculeCard.tsx to halve GPU load on Retina without visible quality change.
- **Cache SDF fetches in `useSdfMolecule`**: use a module-level `Map<string, Molecule | null>` to avoid re-fetching on hover.

---

## Already Good

- **`/api/trending/route.ts`**: Sets `Cache-Control: public, s-maxage=300, stale-while-revalidate=600`. The trending data is served from the `trending_snapshot` single-row cache — no live aggregation on request.
- **`getLatestSnapshot()`** (`src/lib/trending/aggregate.ts:285-299`): Uses `.limit(1)` and reads a single pre-materialized row. The expensive work only runs in the cron refresh endpoint.
- **`supplement_mentions` table**: Has a composite index `(supplement_slug, mentioned_at)` — `loadWindow()` queries will use it once a proper index-friendly query is written.
- **`/api/supplements/index/route.ts`**: Correctly sets `s-maxage=3600` + `stale-while-revalidate=86400`.
- **`MoleculeCard`**: Correctly pauses `frameloop` when the tab is hidden — saves battery on backgrounded tabs.
- **`WebGLFallback`**: Static SVG fallback is present for non-WebGL browsers.
- **`SplitDeckSection`** is wrapped in `<Suspense>` with a skeleton — the page is not blocked waiting for the trending DB read.
- **`getSupplementBySlug()`** and per-supplement lookups: use `.limit(1)` and query by primary key/unique slug — these are fast.

---

## Recommended Fix Order

1. **Remove `force-dynamic` from `src/app/page.tsx`** and add `export const revalidate = 3600`. Biggest single win — turns the homepage into a cached static page.
2. **Lazy-load Three.js bundle** with `dynamic(() => import('./MoleculeCard'), { ssr: false })` in `SplitDeck.tsx`. ~1 MB JS removed from initial load.
3. **Fix N+1 in `lookupSupplement()`** (`supplement-lookup.ts:505-539`): replace per-companion and per-conflict `getSupplementNameById` loops with a single `inArray` batch query.
4. **Fix `listConflicts()`** (`db.ts:215-217`): add a WHERE clause filtering by `supplementAId` or `supplementBId`, not a full table scan.
5. **Fix N+1 in `/api/stack` GET and `/stack/[publicId]/page.tsx`**: batch with `inArray`.
6. **Fix scheduler N+1** (`scheduler-engine.ts:86-132`): pre-load all supplement data before the loop rather than calling `findSupplementByQuery` + `getScheduleRuleBySupplementId` per iteration.
7. **Cache `getSuggestions()`** in `/api/supplements/suggestions` with proper Cache-Control headers.
8. **Add `.limit(200)` to `loadWindow()`** in `aggregate.ts` as a near-term safety bound.
9. **Cache SDF parses in `useSdfMolecule`** with a module-level Map.
10. **Populate `next.config.ts`** with `images.remotePatterns`, `compress: true`, and run `next-bundle-analyzer` to confirm Three.js code-splitting worked.
