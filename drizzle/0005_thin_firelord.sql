CREATE TABLE "story_chapters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kicker" text NOT NULL,
	"big" text NOT NULL,
	"body" text NOT NULL,
	"variant" text DEFAULT 'text' NOT NULL,
	"rank" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "story_chapters" ENABLE ROW LEVEL SECURITY;