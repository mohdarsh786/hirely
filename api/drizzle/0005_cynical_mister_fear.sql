ALTER TABLE "hr_documents" ADD COLUMN "embedding" vector(384);--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "content_hash" text;--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "embedding" vector(384);