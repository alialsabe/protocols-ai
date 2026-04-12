# v1 design archive

Snapshot of the pre-revamp UI as of commit `400ff2e` (Apr 2026).
Kept here in case the v2 instrument-panel direction needs to be rolled back
or referenced for specific patterns.

Files:
- `page.tsx`       — original home route (mounted `<Dashboard />`)
- `globals.css`    — original token set + mesh/float/shimmer keyframes
- `DESIGN.md`      — original design system (65 lines, token-only)
- `Dashboard.tsx`  — the 1440-line monolithic research/dosage/scheduler/catalog component

These are intentionally outside `src/` so the TypeScript compiler ignores them.
Do not import from this directory from live code — copy what you need instead.

To revive the old home page in-place:
```bash
cp .archive/v1/page.tsx     src/app/page.tsx
cp .archive/v1/globals.css  src/app/globals.css
cp .archive/v1/DESIGN.md    DESIGN.md
cp .archive/v1/Dashboard.tsx src/components/Dashboard.tsx
```
