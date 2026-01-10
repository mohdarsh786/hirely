import { db } from '../db/client';
import { candidates, resumes, batchUploads } from '../db/schema';
import { supabaseAdmin } from '../supabase';
import { getEnv } from '../env';
import { extractTextFromUpload } from '../utils/text';
import { scoreResume } from '../ai/resumeScoring';
import { extractResumeInfo } from '../ai/resumeExtractor';
import { generateEmbedding } from '../ai/embeddings';
import { calculateFileHash } from '../utils/deduplication';
import { eq, and } from 'drizzle-orm';

export type CandidateResult = {
	id: string;
	name: string;
	email: string | null;
	score: number | null;
	matchedSkills: string[];
	missingSkills: string[];
	reason: string;
	status: 'pending' | 'processing' | 'completed' | 'failed';
	error?: string;
};

export type BatchProgress = {
	id: string;
	processed: number;
	total: number;
	status: 'processing' | 'completed' | 'failed';
	candidates: CandidateResult[];
};

const batchProgress = new Map<string, BatchProgress>();

export function getBatchProgress(batchId: string): BatchProgress | null {
	return batchProgress.get(batchId) || null;
}

export async function processResume(
	file: File,
	job: { id: string; title: string; requiredSkills: string[] },
	organizationId: string,
	userId: string,
	batchId: string,
	index: number
): Promise<CandidateResult> {
	const progress = batchProgress.get(batchId);
	if (!progress) throw new Error('Batch not found');

	let candidateName = 'Unknown';
	let candidateEmail: string | null = null;

	try {
        const contentHash = await calculateFileHash(file);
        
        const existing = await db.select({ 
            id: candidates.id,
            name: candidates.name,
            email: candidates.email,
            score: resumes.aiScore,
            skills: resumes.parsedSkills,
        })
        .from(resumes)
        .innerJoin(candidates, eq(resumes.candidateId, candidates.id))
        .where(and(
            eq(resumes.contentHash, contentHash),
            eq(candidates.organizationId, organizationId)
        ))
        .limit(1);

        if (existing.length > 0 && existing[0]) {
            const dup = existing[0];
            const skills = dup.skills as any || {};
            
            await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
            
            const result: CandidateResult = {
                id: dup.id,
                name: dup.name,
                email: dup.email,
                score: dup.score,
                matchedSkills: skills.matched_skills || [],
                missingSkills: skills.missing_skills || [],
                reason: skills.reason || 'Previously analyzed',
                status: 'completed',
            };
            console.log(`[BATCH] Cache hit for: ${dup.name} (score: ${dup.score})`);
            progress.candidates[index] = result;
            progress.processed++;
            return result;
        }

		const text = await extractTextFromUpload(file);
		const info = await extractResumeInfo(text);
		candidateName = info.name;
		candidateEmail = info.email;

		const [candidate] = await db.insert(candidates).values({
			name: candidateName,
			email: candidateEmail,
			jobId: job.id,
			appliedRole: job.title,
			organizationId,
			createdBy: userId,
		}).returning();

		if (!candidate) throw new Error('Failed to create candidate');

		progress.candidates[index] = {
			id: candidate.id,
			name: candidateName,
			email: candidateEmail,
			score: null,
			matchedSkills: [],
			missingSkills: [],
			reason: '',
			status: 'processing',
		};

		const env = getEnv();
		const path = `${candidate.id}/${crypto.randomUUID()}/${file.name}`;
		const bytes = new Uint8Array(await file.arrayBuffer());

		await supabaseAdmin.storage
			.from(env.SUPABASE_RESUME_BUCKET)
			.upload(path, bytes, { contentType: 'application/pdf', upsert: true });

		const url = supabaseAdmin.storage.from(env.SUPABASE_RESUME_BUCKET).getPublicUrl(path).data.publicUrl;

		let scoring = null;
		if (job.requiredSkills.length > 0) {
			scoring = await scoreResume({
				jobRole: job.title,
				requiredSkills: job.requiredSkills,
				resumeText: text,
			});
		}

		const embedding = await generateEmbedding(text);

		await db.insert(resumes).values({
			candidateId: candidate.id,
			extractedText: text,
			fileUrl: url,
            contentHash: contentHash,
            embedding: embedding, // Save as vector
			aiScore: scoring?.score ? Math.round(scoring.score) : null,
			parsedSkills: scoring ? {
				matched_skills: scoring.matched_skills,
				missing_skills: scoring.missing_skills,
				reason: scoring.reason,
			} : null,
		});

		const result: CandidateResult = {
			id: candidate.id,
			name: candidateName,
			email: candidateEmail,
			score: scoring?.score ? Math.round(scoring.score) : null,
			matchedSkills: scoring?.matched_skills || [],
			missingSkills: scoring?.missing_skills || [],
			reason: scoring?.reason || '',
			status: 'completed',
		};

		progress.candidates[index] = result;
		progress.processed++;

		// Update DB (non-blocking)
		db.update(batchUploads)
			.set({ 
				processedCount: progress.processed,
				candidateIds: progress.candidates.filter(c => c.id).map(c => c.id),
			})
			.where(eq(batchUploads.id, batchId))
			.catch(() => {});

		return result;
	} catch (error) {
		console.error('[BATCH] Failed:', file.name, error);
		
		const failed: CandidateResult = {
			id: '',
			name: candidateName,
			email: null,
			score: null,
			matchedSkills: [],
			missingSkills: [],
			reason: '',
			status: 'failed',
			error: error instanceof Error ? error.message : 'Unknown error',
		};

		progress.candidates[index] = failed;
		progress.processed++;
		return failed;
	}
}

export async function startBatch(
	files: File[],
	job: { id: string; title: string; requiredSkills: string[] },
	organizationId: string,
	userId: string
): Promise<string> {
	const batchId = crypto.randomUUID();

	// Try to persist to DB, but don't fail if table doesn't exist
	try {
		await db.insert(batchUploads).values({
			id: batchId,
			jobId: job.id,
			organizationId,
			createdBy: userId,
			totalFiles: files.length,
			processedCount: 0,
			status: 'processing',
			candidateIds: [],
		});
	} catch (err) {
		console.warn('[BATCH] Could not persist batch to DB:', err);
	}

	const progress: BatchProgress = {
		id: batchId,
		processed: 0,
		total: files.length,
		status: 'processing',
		candidates: files.map(f => ({
			id: '',
			name: f.name.replace(/\.pdf$/i, ''),
			email: null,
			score: null,
			matchedSkills: [],
			missingSkills: [],
			reason: '',
			status: 'pending',
		})),
	};

	batchProgress.set(batchId, progress);

	(async () => {
		// Process sequentially to avoid rate limits
		for (let i = 0; i < files.length; i++) {
			await processResume(files[i], job, organizationId, userId, batchId, i);
		}

		const finalProgress = batchProgress.get(batchId);
		if (finalProgress) {
			finalProgress.status = 'completed';
		}

		db.update(batchUploads)
			.set({ status: 'completed', completedAt: new Date() })
			.where(eq(batchUploads.id, batchId))
			.catch(() => {});

		setTimeout(() => batchProgress.delete(batchId), 3600000);
	})().catch(async (error) => {
		console.error('[BATCH] Failed:', error);
		const failedProgress = batchProgress.get(batchId);
		if (failedProgress) {
			failedProgress.status = 'failed';
		}
		db.update(batchUploads)
			.set({ status: 'failed' })
			.where(eq(batchUploads.id, batchId))
			.catch(() => {});
	});

	return batchId;
}
