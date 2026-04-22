-- Enable Row-Level Security on every table in the public schema.
--
-- The app itself is unaffected: Drizzle connects via the Supabase pooler
-- as the table owner, which bypasses RLS. These policies gate the
-- PostgREST surface that ships with every Supabase project and is
-- reachable by anyone holding the public anon/publishable key.

ALTER TABLE "supplements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "supplement_types" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinical_studies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "supplement_tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "supplement_science" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "supplement_social" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "supplement_sentiment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "supplement_dosage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "schedule_rules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "conflicts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "medicine_interactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "affiliate_options" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "fallback_queue" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "companion_stacks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "saved_stacks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "supplement_mentions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trending_snapshot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "shared_protocols" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

-- Public catalog: world-readable, writes only via service role / owner.
CREATE POLICY "catalog_public_read" ON "supplements"
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "catalog_public_read" ON "supplement_types"
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "catalog_public_read" ON "clinical_studies"
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "catalog_public_read" ON "supplement_tags"
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "catalog_public_read" ON "supplement_science"
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "catalog_public_read" ON "supplement_social"
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "catalog_public_read" ON "supplement_sentiment"
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "catalog_public_read" ON "supplement_dosage"
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "catalog_public_read" ON "schedule_rules"
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "catalog_public_read" ON "conflicts"
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "catalog_public_read" ON "medicine_interactions"
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "catalog_public_read" ON "affiliate_options"
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "catalog_public_read" ON "companion_stacks"
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "catalog_public_read" ON "supplement_mentions"
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "catalog_public_read" ON "trending_snapshot"
  FOR SELECT TO anon, authenticated USING (true);
--> statement-breakpoint

-- user_profiles: one row per authenticated user, owner-only access.
-- user_id is stored as text, so cast auth.uid() (uuid) before comparison.
CREATE POLICY "user_profiles_owner_select" ON "user_profiles"
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);
CREATE POLICY "user_profiles_owner_insert" ON "user_profiles"
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "user_profiles_owner_update" ON "user_profiles"
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "user_profiles_owner_delete" ON "user_profiles"
  FOR DELETE TO authenticated USING (user_id = auth.uid()::text);
--> statement-breakpoint

-- saved_stacks: owner-only access.
CREATE POLICY "saved_stacks_owner_select" ON "saved_stacks"
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);
CREATE POLICY "saved_stacks_owner_insert" ON "saved_stacks"
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "saved_stacks_owner_update" ON "saved_stacks"
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "saved_stacks_owner_delete" ON "saved_stacks"
  FOR DELETE TO authenticated USING (user_id = auth.uid()::text);
--> statement-breakpoint

-- shared_protocols: anyone with the public_id can view; only the owner
-- can create, modify, or delete their share. Public SELECT is intentional
-- since the public_id is the sole access token.
CREATE POLICY "shared_protocols_public_read" ON "shared_protocols"
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "shared_protocols_owner_insert" ON "shared_protocols"
  FOR INSERT TO authenticated WITH CHECK (owner_user_id = auth.uid()::text);
CREATE POLICY "shared_protocols_owner_update" ON "shared_protocols"
  FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid()::text)
  WITH CHECK (owner_user_id = auth.uid()::text);
CREATE POLICY "shared_protocols_owner_delete" ON "shared_protocols"
  FOR DELETE TO authenticated USING (owner_user_id = auth.uid()::text);
--> statement-breakpoint

-- fallback_queue: admin/ingest only. No anon or authenticated policies,
-- so PostgREST access is fully denied. Writes continue via the pooler
-- (table owner bypasses RLS) and the service role key.
