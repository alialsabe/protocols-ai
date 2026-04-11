# Protocols.ai — TODOs

_Generated from /plan-design-review session 2026-04-11_

---

## UI / Design

### Create DESIGN.md
**What:** Extract all design tokens, typography, spacing, and component patterns from `Dashboard.tsx` into a top-level `DESIGN.md`.
**Why:** Without it, every new panel (medicine interactions, scheduler, dosage) gets built by feel. Design drift accumulates. Also blocks new contributors and future AI sessions from knowing the design system.
**Pros:** Single source of truth for all design decisions. Prevents AI slop on new panels.
**Cons:** ~30min to extract. Needs to be kept in sync as tokens evolve.
**Context:** Inline `T.*` tokens in `Dashboard.tsx:38–49` are the de facto design system. Extract: colors, typography (Outfit/Geist Mono), component patterns (Card, Button, Badge, Input).
**Depends on:** Nothing. Can be done independently.

---

### Mobile bottom tab bar
**What:** Replace the left sidebar with a bottom tab bar on `<768px` screens.
**Why:** Prior design audit scored mobile layout F. The sidebar is completely hidden on mobile and nothing replaces it — users can't navigate.
**Pros:** Fixes the worst UX issue in the app. Design is fully specified (4 icons: FlaskConical, LayoutGrid, Activity, Calendar).
**Cons:** Requires CSS breakpoint work in `Dashboard.tsx`. Need to test all 4 views at 375px.
**Context:** Decision from design review — bottom tabs at `<768px`, icon-only collapsed sidebar at `768–1024px`, full sidebar at `>1024px`.
**Depends on:** DESIGN.md helpful but not required.

---

## Data / Features

### Wire up science/social/summary data
**What:** Most supplements return empty arrays for science findings, social data, and summary. Fix the data pipeline so real data returns for the top 20+ supplements.
**Why:** The app looks broken when tabs are empty after a search.
**Depends on:** DB seeding / API response assembly.

### Wire Dosage tab
**What:** Dosage tab is currently a dead-end. Wire it to show: loading dose, maintenance dose, formula, timing note, conflict warnings, affiliate CTA.
**Why:** It's listed in the nav but does nothing. Users who click it bounce.
**Context:** Design specified in plan — two-column layout on desktop (dosage left, affiliate right), single column on mobile.
**Depends on:** `supplement_dosage` and `affiliate_options` tables must have data.

### Wire Medicine Interactions panel
**What:** Add the Medicine Interactions section to the Research Core Science tab (Task 1.5).
**Why:** This is a high-value safety feature with zero current implementation.
**Context:** Full visual spec in plan — full-width rows with severity stripe (rose/amber/sky), severity badge pill, sorted HIGH first. Not colored-left-border cards.
**Depends on:** `medicine_interactions` table must have data for queried supplements.

### Scheduler output view
**What:** The scheduler endpoint exists but the UI doesn't render its output in a useful way.
**Why:** Scheduler is listed in nav but the output is unspecified.
**Context:** Design: vertical day timeline with 4 time slots (Morning/Afternoon/Evening/Bedtime). Each supplement as a row with name, dose, reason. Conflict warnings inline.
**Depends on:** `supplement_schedule_rules` and `supplement_conflicts` tables.
