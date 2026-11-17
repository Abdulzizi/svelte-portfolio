ALTER TABLE "projects" ADD COLUMN "kind" text DEFAULT 'project' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "company" text;