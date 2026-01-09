import { Hono } from 'hono';
import { z } from 'zod';
import { desc, eq, and, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { chatLogs, hrDocuments } from '../db/schema';
import { authMiddleware, type AppVariables } from '../middleware/auth';
import { answerFromDocs } from '../ai/hrRag';
import { generateEmbedding } from '../ai/embeddings';
import { badRequest, internalError, handleValidationError } from '../utils/errors';

const querySchema = z.object({
	question: z.string().min(1),
	topK: z.number().int().positive().max(5).optional(),
});

async function findRelevantDocsByVector(question: string, organizationId: string, max: number): Promise<Omit<typeof hrDocuments.$inferSelect, 'embedding'>[]> {
    const questionEmbedding = await generateEmbedding(question);
    
    // Use pgvector cosine distance (<=>)
    // Order by similarity (1 - distance)
    const similarity = sql<number>`1 - (${hrDocuments.embedding} <=> ${JSON.stringify(questionEmbedding)})`;

    const docs = await db.select({
        id: hrDocuments.id,
        title: hrDocuments.title,
        content: hrDocuments.content,
        organizationId: hrDocuments.organizationId,
        uploadedBy: hrDocuments.uploadedBy,
        createdAt: hrDocuments.createdAt
    })
    .from(hrDocuments)
    .where(and(
        eq(hrDocuments.organizationId, organizationId),
        sql`1 - (${hrDocuments.embedding} <=> ${JSON.stringify(questionEmbedding)}) > 0.3` // Threshold
    ))
    .orderBy(desc(similarity))
    .limit(max);

    return docs;
}

export const hrChatRoutes = new Hono<{ Variables: AppVariables }>()
	.use('*', authMiddleware)
	.post('/query', async (c) => {
		const user = c.get('user');
		
		try {
			const body = await c.req.json();
			const data = querySchema.parse(body);
			const topK = data.topK ?? 3;

			// Use pgvector search directly
			const relevant = await findRelevantDocsByVector(data.question, user.organizationId!, topK);
            
			const answer = await answerFromDocs({ question: data.question, docs: relevant });

			await db.insert(chatLogs).values({
				userId: user.id,
                organizationId: user.organizationId!,
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
