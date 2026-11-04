CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"role" text NOT NULL,
	"year" text NOT NULL,
	"stack" text[] DEFAULT '{}' NOT NULL,
	"impact" text NOT NULL,
	"problem" text NOT NULL,
	"result" text NOT NULL,
	"body" text,
	"image_path" text,
	"featured" boolean DEFAULT false NOT NULL,
	"rank" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
