CREATE TABLE IF NOT EXISTS "user_medications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"med_name" text NOT NULL,
	"dosage" text,
	"frequency" text,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"stack_snapshot" jsonb NOT NULL,
	"findings" jsonb NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
