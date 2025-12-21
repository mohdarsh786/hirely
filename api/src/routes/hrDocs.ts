import { Hono } from 'hono';
import { z } from 'zod';
import { desc } from 'drizzle-orm';
import { db } from '../db/client';
import { hrDocuments } from '../db/schema';
import { authMiddleware, type AppVariables } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { extractTextFromUpload } from '../utils/text';
import { generateEmbedding } from '../ai/embeddings';
import { badRequest, internalError, handleValidationError } from '../utils/errors';
import { validateHRDocumentFile } from '../utils/validation';

const jsonSchema = z.object({
	title: z.string().min(1).max(255),
	content: z.string().min(1),
});

export const hrDocsRoutes = new Hono<{ Variables: AppVariables }>()
	.use('*', authMiddleware)
	.post('/upload', requireRole(['HR_ADMIN']), async (c) => {
		const user = c.get('user');
		const contentType = c.req.header('content-type') ?? '';

		try {
			if (contentType.includes('multipart/form-data')) {
				const formData = await c.req.parseBody();
				const file = formData.file;
				
				if (!(file instanceof File)) {
					return badRequest(c, 'Missing file field');
				}

				validateHRDocumentFile(file);
				const text = await extractTextFromUpload(file);
				
				if (!text.trim()) {
					return badRequest(c, 'File contains no text');
				}

				const title = String(formData.title ?? file.name ?? 'HR Document').trim();

				// Generate embedding for the document content
				const embedding = await generateEmbedding(text);

				const [doc] = await db
					.insert(hrDocuments)
					.values({ 
						title, 
						content: text, 
						uploadedBy: user.id,
						embeddingId: JSON.stringify(embedding) // Store as JSON string
					})
					.returning();

				if (!doc) {
					return internalError(c, 'Insert failed', 'Failed to create document');
				}

				return c.json({ document: doc }, 201);
			}

			const body = await c.req.json();
			const data = jsonSchema.parse(body);

			// Generate embedding for the document content
			const embedding = await generateEmbedding(data.content);

			const [doc] = await db
				.insert(hrDocuments)
				.values({ 
					title: data.title, 
					content: data.content, 
					uploadedBy: user.id,
					embeddingId: JSON.stringify(embedding) // Store as JSON string
				})
				.returning();

			if (!doc) {
				return internalError(c, 'Insert failed', 'Failed to create document');
			}

			return c.json({ document: doc }, 201);
		} catch (error) {
			if (error instanceof z.ZodError) {
				return handleValidationError(c, error);
			}
			return internalError(c, error, 'Failed to upload document');
		}
	})
	.get('/', requireRole(['HR_ADMIN', 'RECRUITER']), async (c) => {
		try {
			const list = await db.select().from(hrDocuments).orderBy(desc(hrDocuments.createdAt));
			return c.json({ documents: list });
		} catch (error) {
			return internalError(c, error, 'Failed to fetch documents');
		}
	});
