CREATE TABLE IF NOT EXISTS "supplement_mentions" (
	"id" text PRIMARY KEY NOT NULL,
	"supplement_slug" text NOT NULL,
	"source_id" text NOT NULL,
	"source_type" text NOT NULL,
	"source_url" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"snippet" text DEFAULT '' NOT NULL,
	"mentioned_at" timestamp with time zone NOT NULL,
	"ingested_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trending_snapshot" (
	"id" text PRIMARY KEY NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "supplement_mentions" ADD CONSTRAINT "supplement_mentions_supplement_slug_supplements_slug_fk" FOREIGN KEY ("supplement_slug") REFERENCES "public"."supplements"("slug") ON DELETE no action ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "supplement_mentions_slug_mentioned_at_idx" ON "supplement_mentions" USING btree ("supplement_slug","mentioned_at");
