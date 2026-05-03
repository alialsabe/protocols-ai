-- Bloodwork OCR (IL-1)
-- Two tables: extracted markers per upload, and the curated rule book
-- that maps deficient markers to supplement actions.
-- Privacy: raw_pdf_url stays NULL in v1; we never persist PDF bytes.

CREATE TABLE IF NOT EXISTS "user_bloodwork" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL,
    "uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
    "source" text NOT NULL,
    "markers" jsonb NOT NULL,
    "raw_pdf_url" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deficiency_rules" (
    "id" text PRIMARY KEY NOT NULL,
    "marker_name" text NOT NULL,
    "marker_aliases" jsonb,
    "unit" text NOT NULL,
    "threshold_low" numeric,
    "threshold_high" numeric,
    "severity" text NOT NULL,
    "supplement_slug" text,
    "recommendation" text NOT NULL,
    "citation" text
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_bloodwork_user_id_idx" ON "user_bloodwork" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "deficiency_rules_marker_name_idx" ON "deficiency_rules" ("marker_name");
--> statement-breakpoint

-- ── Curated rules ────────────────────────────────────────────────────
-- Slugs cross-checked against src/lib/seed-data.ts. Rules whose target
-- supplement isn't in the seed are commented out with a TODO so the
-- seed-supplement-first invariant holds.

INSERT INTO "deficiency_rules" ("id", "marker_name", "marker_aliases", "unit", "threshold_low", "threshold_high", "severity", "supplement_slug", "recommendation", "citation") VALUES
('rule-vitd', 'vitamin_d_25oh', '["25-OH Vitamin D","25 hydroxyvitamin D","Vitamin D, 25-Hydroxy","25(OH)D"]'::jsonb, 'ng/mL', 30, NULL, 'high', 'vitamin-d3', 'Serum 25(OH)D below 30 ng/mL suggests insufficiency. Start vitamin D3 2000-5000 IU/day and recheck in 8-12 weeks.', 'PMID: 21646368'),
('rule-b12', 'vitamin_b12', '["Vitamin B12","B12","Cobalamin"]'::jsonb, 'pg/mL', 400, NULL, 'medium', 'vitamin-b12-methylcobalamin', 'Serum B12 below 400 pg/mL is suboptimal. Consider methylcobalamin 1000 mcg/day, especially on metformin or PPIs.', 'PMID: 23356638'),
('rule-ferritin', 'ferritin', '["Ferritin","Serum Ferritin"]'::jsonb, 'ng/mL', 30, NULL, 'high', 'iron-ferrous-bisglycinate', 'Ferritin below 30 ng/mL suggests iron depletion. Iron bisglycinate is gentler than ferrous sulfate; confirm with full iron panel before dosing.', 'PMID: 34028001'),
('rule-mag-rbc', 'magnesium_rbc', '["Magnesium, RBC","Magnesium RBC","RBC Magnesium","Erythrocyte Magnesium"]'::jsonb, 'mg/dL', 4.2, NULL, 'medium', 'magnesium-glycinate', 'RBC magnesium below 4.2 mg/dL is below the standard reference range and suggests deficiency. Magnesium glycinate 200-400 mg elemental at night is well tolerated.', 'PMID: 28140318'),
-- TODO: seed supplement tongkat-ali first; until then this rule recommends zinc as foundational support
('rule-free-test', 'free_testosterone', '["Free Testosterone","Free T","Testosterone, Free"]'::jsonb, 'pg/mL', 50, NULL, 'medium', 'zinc-picolinate', 'Free testosterone below 50 pg/mL with symptoms warrants endocrinology workup. Zinc supports normal testosterone production in men with low zinc; this is foundational support, not a substitute for clinical evaluation.', 'PMID: 17984944'),
('rule-homair', 'homa_ir', '["HOMA-IR","Insulin Resistance Index","HOMA Index"]'::jsonb, 'index', NULL, 2.0, 'medium', 'berberine-hcl', 'HOMA-IR above 2.0 indicates insulin resistance. Berberine 500 mg 2-3x/day with meals improves fasting glucose.', 'PMID: 18397984'),
('rule-hscrp', 'hscrp', '["hsCRP","High-Sensitivity CRP","C-Reactive Protein, High Sensitivity"]'::jsonb, 'mg/L', NULL, 1.0, 'medium', 'omega-3-fish-oil', 'hsCRP above 1.0 mg/L suggests low-grade inflammation. EPA+DHA 2-3 g/day combined with diet review.', 'PMID: 22968891'),
-- TODO: seed supplement selenium first
-- ('rule-tsh', 'tsh', '["TSH","Thyroid Stimulating Hormone"]'::jsonb, 'mIU/L', NULL, 4.0, 'medium', 'selenium', 'TSH above 4.0 with symptoms may warrant a thyroid workup. Selenium 100-200 mcg/day supports T4-to-T3 conversion.', 'PMID: 17207404'),
-- TODO: seed supplement methylfolate first
-- ('rule-homocyst', 'homocysteine', '["Homocysteine","Plasma Homocysteine"]'::jsonb, 'umol/L', NULL, 10.0, 'medium', 'methylfolate', 'Homocysteine above 10 umol/L raises CV risk. Methylfolate + B12 + B6 lowers it most effectively in MTHFR variants.', 'PMID: 20223626'),
-- TODO: seed supplement niacin first
-- ('rule-hdl', 'hdl', '["HDL","HDL Cholesterol","HDL-C"]'::jsonb, 'mg/dL', 40, NULL, 'low', 'niacin', 'HDL below 40 mg/dL is a CV risk marker. Niacin raises HDL but causes flushing; discuss with physician before starting.', 'PMID: 20212302')
ON CONFLICT DO NOTHING;
