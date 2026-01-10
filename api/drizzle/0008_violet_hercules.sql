ALTER TABLE "interviews" ADD COLUMN "decision" text;--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "decision_note" text;--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "decision_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "decision_by" uuid;