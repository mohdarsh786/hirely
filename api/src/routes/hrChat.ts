import { Hono } from 'hono';
import { z } from 'zod';
import { desc } from 'drizzle-orm';
import { db } from '../db/client';
import { chatLogs, hrDocuments } from '../db/schema';
import { authMiddleware, type AppVariables } from '../middleware/auth';
import { answerFromDocs } from '../ai/hrRag';
import { generateEmbedding, cosineSimilarity } from '../ai/embeddings';
import { badRequest, internalError, handleValidationError } from '../utils/errors';

const querySchema = z.object({
	question: z.string().min(1),
	topK: z.number().int().positive().max(5).optional(),
});

type Doc = { id: string; title: string; content: string; embeddingId: string | null };

async function findRelevantDocsByVector(question: string, docs: Doc[], max: number): Promise<Doc[]> {
	// Generate embedding for the question
	const questionEmbedding = await generateEmbedding(question);

	// Calculate similarity scores for all documents with embeddings
	const scored = docs
		.filter((doc) => doc.embeddingId) // Only docs with embeddings
		.map((doc) => {
			try {
				const docEmbedding = JSON.parse(doc.embeddingId!);
				const similarity = cosineSimilarity(questionEmbedding, docEmbedding);
				return { doc, score: similarity };
			} catch (error) {
				console.error('Failed to parse embedding for doc', doc.id, error);
				return { doc, score: 0 };
			}
		})
		.sort((a, b) => b.score - a.score);

	// Return top K most similar documents
	return scored.slice(0, max).map((item) => item.doc);
}

export const hrChatRoutes = new Hono<{ Variables: AppVariables }>()
	.use('*', authMiddleware)
	.post('/query', async (c) => {
		const user = c.get('user');
		
		try {
			const body = await c.req.json();
			const data = querySchema.parse(body);
			const topK = data.topK ?? 3;

			const recent = await db
				.select({ 
					id: hrDocuments.id, 
					title: hrDocuments.title, 
					content: hrDocuments.content,
					embeddingId: hrDocuments.embeddingId 
				})
				.from(hrDocuments)
				.orderBy(desc(hrDocuments.createdAt))
				.limit(25);

			const relevant = await findRelevantDocsByVector(data.question, recent, topK);
			const answer = await answerFromDocs({ question: data.question, docs: relevant });

			await db.insert(chatLogs).values({
				userId: user.id,
				question: data.question,
				answer,
			});

			return c.json({ 
				answer, 
				sources: relevant.map((doc) => ({ id: doc.id, title: doc.title })) 
			});
		} catch (error) {
			if (error instanceof z.ZodError) {
				return handleValidationError(c, error);
			}
			return internalError(c, error, 'Failed to process query');
		}
	});
