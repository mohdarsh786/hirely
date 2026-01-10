import { pgTable, uuid, text, integer, timestamp, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';

// ======================
// Organizations Schema
// ======================

export const organizations = pgTable('organizations', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	domain: text('domain'), // optional company domain
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const organizationMembers = pgTable('organization_members', {
	id: uuid('id').primaryKey().defaultRandom(),
	organizationId: uuid('organization_id')
		.notNull()
		.references(() => organizations.id, { onDelete: 'cascade' }),
	userId: uuid('user_id').notNull(), // Supabase auth user id
	role: text('role').notNull(), // HR_ADMIN, RECRUITER, EMPLOYEE
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const candidateInvites = pgTable('candidate_invites', {
	id: uuid('id').primaryKey().defaultRandom(),
	candidateId: uuid('candidate_id')
		.notNull()
		.references(() => candidates.id, { onDelete: 'cascade' }),
	interviewId: uuid('interview_id').references(() => interviews.id, { onDelete: 'cascade' }),
	token: text('token').notNull().unique(), // Unique token for candidate access
	email: text('email').notNull(), // Candidate email for sending invite
	expiresAt: timestamp('expires_at', { withTimezone: true }), // Optional expiration
	usedAt: timestamp('used_at', { withTimezone: true }), // Track when token was used
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ======================
// Jobs Table - Source of Truth for Requirements
// ======================

export const jobs = pgTable('jobs', {
	id: uuid('id').primaryKey().defaultRandom(),
	organizationId: uuid('organization_id')
		.notNull()
		.references(() => organizations.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	description: text('description'),
	requiredSkills: jsonb('required_skills').$type<string[]>().notNull().default([]),
	experienceYears: integer('experience_years'),
	status: text('status').notNull().default('active'), // 'active' | 'closed' | 'draft'
	createdBy: uuid('created_by').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ======================
// Core Tables (with organization support)
// ======================

export const candidates = pgTable('candidates', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	email: text('email'),
	experienceYears: integer('experience_years'),
	jobId: uuid('job_id').references(() => jobs.id, { onDelete: 'set null' }), // Link to job
	appliedRole: text('applied_role'), // Derived from job or legacy
	organizationId: uuid('organization_id')
		.references(() => organizations.id, { onDelete: 'cascade' }),
	createdBy: uuid('created_by'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

import { customType } from 'drizzle-orm/pg-core';

const vector = customType<{ data: number[] }>({
  dataType() {
    return 'vector(384)';
  },
});

export const resumes = pgTable('resumes', {
	id: uuid('id').primaryKey().defaultRandom(),
	candidateId: uuid('candidate_id')
		.notNull()
		.references(() => candidates.id, { onDelete: 'cascade' }),
	fileUrl: text('file_url'),
	extractedText: text('extracted_text'),
    contentHash: text('content_hash'), // SHA-256 hash for deduplication
    embedding: vector('embedding'), // PGVector 384 dimensions
	parsedSkills: jsonb('parsed_skills').$type<{
		matched_skills?: string[];
		missing_skills?: string[];
		reason?: string;
	}>(),
	aiScore: integer('ai_score'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type TranscriptEntry =
	| { type: 'question'; text: string; at: string }
	| { type: 'answer'; text: string; at: string }
	| { type: 'eval'; score: number; feedback: string; at: string };

export const interviews = pgTable('interviews', {
	id: uuid('id').primaryKey().defaultRandom(),
	candidateId: uuid('candidate_id')
		.notNull()
		.references(() => candidates.id, { onDelete: 'cascade' }),
	scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
	durationMinutes: integer('duration_minutes'),
	token: text('token').unique(), // For candidate access link
	questions: jsonb('questions').$type<any[]>(), // Generated interview questions
	answers: jsonb('answers').$type<any[]>(), // Candidate answers with scores
	startedAt: timestamp('started_at', { withTimezone: true }),
	completedAt: timestamp('completed_at', { withTimezone: true }),
	transcript: jsonb('transcript').$type<TranscriptEntry[]>().notNull().default([]),
	scores: jsonb('scores').$type<{ perQuestion?: number[] }>().notNull().default({}),
	finalRating: integer('final_rating'),
	aiFeedback: text('ai_feedback'),
	status: text('status').notNull().default('scheduled'), // 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
	decision: text('decision'), // 'shortlisted' | 'rejected' | null
	decisionNote: text('decision_note'), // Optional message from recruiter
	decisionAt: timestamp('decision_at', { withTimezone: true }),
	decisionBy: uuid('decision_by'), // User ID who made the decision
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const hrDocuments = pgTable('hr_documents', {
	id: uuid('id').primaryKey().defaultRandom(),
	title: text('title').notNull(),
	content: text('content').notNull(),
    embedding: vector('embedding'), // PGVector 384 dimensions
	organizationId: uuid('organization_id')
		.notNull()
		.references(() => organizations.id, { onDelete: 'cascade' }),
	uploadedBy: uuid('uploaded_by'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const chatLogs = pgTable('chat_logs', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id'),
	organizationId: uuid('organization_id')
		.notNull()
		.references(() => organizations.id, { onDelete: 'cascade' }),
	question: text('question').notNull(),
	answer: text('answer').notNull(),
	sourceDocId: uuid('source_doc_id').references(() => hrDocuments.id, { onDelete: 'set null' }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ======================
// Batch Uploads Table
// ======================

export const batchUploads = pgTable('batch_uploads', {
	id: uuid('id').primaryKey().defaultRandom(),
	jobId: uuid('job_id')
		.notNull()
		.references(() => jobs.id, { onDelete: 'cascade' }),
	organizationId: uuid('organization_id')
		.notNull()
		.references(() => organizations.id, { onDelete: 'cascade' }),
	createdBy: uuid('created_by').notNull(),
	totalFiles: integer('total_files').notNull(),
	processedCount: integer('processed_count').notNull().default(0),
	status: text('status').notNull().default('processing'), // 'processing' | 'completed' | 'failed'
	candidateIds: jsonb('candidate_ids').$type<string[]>().notNull().default([]),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	completedAt: timestamp('completed_at', { withTimezone: true }),
});

// ======================
// Integrations Table
// ======================

export const integrations = pgTable('integrations', {
	id: uuid('id').primaryKey().defaultRandom(),
	organizationId: uuid('organization_id')
		.notNull()
		.references(() => organizations.id, { onDelete: 'cascade' }),
	userId: uuid('user_id').notNull(), // User who connected the account
	provider: text('provider').notNull(), // 'gmail', 'drive'
	email: text('email').notNull(), // Connected email address
	accessToken: text('access_token').notNull(),
	refreshToken: text('refresh_token'),
	expiresAt: timestamp('expires_at', { withTimezone: true }),
	metadata: jsonb('metadata').$type<any>(), // Store any extra provider-specific data (e.g. historyId for Gmail)
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
	unq: uniqueIndex('integrations_org_provider_email_idx').on(t.organizationId, t.provider, t.email),
}));
