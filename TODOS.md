# Materia — TODOs

_Updated from /plan-eng-review session 2026-04-29 (audit-first pivot)_
_Updated from /plan-ceo-review session 2026-04-11_
_Previous items (DESIGN.md, mobile tabs, science data, dosage tab, medicine interactions, scheduler) — all shipped._

---

## From /plan-eng-review 2026-04-29

### Hand-curate redundancy_rules for the audit feature
**What:** Curate ~30-50 rules covering common supplement-stack redundancies: B-complex + standalone B12 / methylfolate, multivitamin + standalone vitamins, magnesium oxide vs glycinate (bioavailability), creatine HCl vs monohydrate (price/effect parity), separate iron + multivitamin with iron, etc. Each rule: trigger_a, trigger_b, severity (info/low/medium), 1-line rationale.
**Why:** The audit feature in cut #1 ships with only `supplement_conflicts` data — drug interactions + timing, not redundancies. Without these rules, the audit can't say "your B-complex contains B12; your separate B12 is duplicative." That's one of the four headline value props of the audit ("redundancies" category in the report).
**Pros:** Sharper audit findings. Saves users money on duplicates (good marketing line). Fills the largest gap in v1.
**Cons:** 4-8 hours of founder time. Each rule needs a real judgement call.
**Context:** The cut #1 audit has 5 categories — categories 1-3 + 5 use existing data; category 4 (redundancies) needs this new table. Schema for `redundancy_rules` is in the design doc at `~/.gstack/projects/alialsabe-protocols-ai/alial-main-design-20260429-075618.md`.
**Effort:** M (human, 4-8h) / S (code to consume)
**Priority:** P2 — do after audit v1 ships and concierge test validates demand. First feature to add in days 21-30 if validated.

---

## Business / Non-Code

### Get one real affiliate partnership
**What:** Reach out to 5 supplement brands: Thorne, NOW Foods, Life Extension, Pure Encapsulations, Amazon Associates. Get one live affiliate link for at least one seeded supplement.
**Why:** Affiliate is the sole launch monetization strategy. Zero real links = zero revenue even with a perfect product. The `affiliate_options` table is seeded with placeholder data but no real `destination_url` or `affiliate_url`.
**Pros:** First dollar. Validates monetization model before more engineering.
**Cons:** Human outreach work. Depends on external parties responding.
**Context:** The affiliate CTA button renders in the Dosage tab but currently points nowhere real. The UI, DB schema, and trust score system are all built — just need real partner data populated.
**Effort:** L (human) / S (code to activate)
**Priority:** P1 — start now, doesn't block engineering

---

## Next Sprint (after v2 P1 ships: accounts + PostHog)

### Research alerts — PubMed polling + email digest
**What:** Poll PubMed for new studies on supplements in user stacks. Send email digest via Resend when high-quality new RCTs drop on their supplements.
**Why:** Retention mechanism + content marketing. Creates a reason to return. Positions Materia as the ongoing source of truth, not a one-time lookup.
**Pros:** High retention value. Viral content marketing if alerts are high quality. Differentiates from static databases.
**Cons:** Requires Resend (email), PubMed API integration, background cron job.
**Context:** Deliberately deferred from v2. Build after user accounts ship and the account to email capture loop is validated.
**Effort:** M-L (CC ~2h)
**Priority:** P2 (next sprint)
**Depends on:** User accounts (v2 P1), email infrastructure (Resend)

---

## Phase 3+

### Subscription / Pro tier
**What:** Free + Pro ($9/mo) tiers. Stripe integration. Pro gates: AI Advisor, research alerts, advanced protocol features. Free: search, science, basic scheduler.
**Why:** Second revenue stream that scales with users, not purchase volume. AI Advisor alone justifies the price.
**Pros:** Predictable MRR. Natural gate for premium features.
**Cons:** Stripe integration, paywalled UX design, need user data to know what to gate.
**Context:** Deliberately deferred. Launch with affiliate-only. Build subscription after affiliate is validated and you have real analytics on what users value from PostHog.
**Effort:** M (CC ~45min once decided)
**Priority:** P3 (Phase 3)
**Depends on:** User accounts, PostHog data (what features are used most)

### Community / social proof layer
**What:** Aggregate (anonymous) stats: "2,340 users with sleep goals take Magnesium Glycinate." Trending protocols. Social proof on supplement cards.
**Why:** Trust signal. Viral loop. Makes the data flywheel visible to users.
**Effort:** M
**Priority:** P3
**Depends on:** User accounts, saved stacks data at scale

### Mobile native app
**What:** React Native or Expo wrapper around the web app, or a dedicated native build.
**Why:** Push notifications (research alerts), better UX for schedule tracking.
**Effort:** XL
**Priority:** P4 (future)
**Depends on:** Web product validated, subscription revenue to fund the work
