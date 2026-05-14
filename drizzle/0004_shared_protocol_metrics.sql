-- Shared protocol discovery metrics.
-- Views make public stacks rankable; copies are the stronger signal for
-- "popular stacks" once users start sharing protocols.

ALTER TABLE "shared_protocols"
  ADD COLUMN IF NOT EXISTS "copy_count" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shared_protocols_popular_idx"
  ON "shared_protocols" ("copy_count" DESC, "view_count" DESC, "created_at" DESC);
