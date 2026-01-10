CREATE TABLE "batch_uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"total_files" integer NOT NULL,
	"processed_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'processing' NOT NULL,
	"candidate_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"required_skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"experience_years" integer,
	"status" text DEFAULT 'active' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "interviews" ALTER COLUMN "status" SET DEFAULT 'scheduled';--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "job_id" uuid;--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "scheduled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "duration_minutes" integer;--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "token" text;--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "questions" jsonb;--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "answers" jsonb;--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "batch_uploads" ADD CONSTRAINT "batch_uploads_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_uploads" ADD CONSTRAINT "batch_uploads_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_token_unique" UNIQUE("token");