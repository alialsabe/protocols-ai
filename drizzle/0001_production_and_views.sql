CREATE TABLE IF NOT EXISTS "supplement_production" (
	"id" text PRIMARY KEY NOT NULL,
	"supplement_id" text NOT NULL,
	"source" text DEFAULT '' NOT NULL,
	"method" text DEFAULT '' NOT NULL,
	"quality_markers" text DEFAULT '' NOT NULL,
	"data_source" text DEFAULT 'manual' NOT NULL,
	"created_at" text DEFAULT '' NOT NULL,
	"updated_at" text DEFAULT '' NOT NULL,
	CONSTRAINT "supplement_production_supplement_id_unique" UNIQUE("supplement_id")
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "supplement_production" ADD CONSTRAINT "supplement_production_supplement_id_supplements_id_fk" FOREIGN KEY ("supplement_id") REFERENCES "public"."supplements"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "supplement_mentions" ADD COLUMN IF NOT EXISTS "view_count" integer DEFAULT 0 NOT NULL;
