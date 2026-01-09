import { pipeline, env as transformersEnv } from '@xenova/transformers';

// Disable local model caching in favor of HuggingFace CDN
transformersEnv.allowLocalModels = false;

let embedder: any = null;

/**
 * Initialize the embedding model (lazy loading)
 */
async function getEmbedder() {
	if (!embedder) {
		// Use a small, efficient embedding model
		embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
	}
	return embedder;
}

/**
 * Generate embeddings using Transformers.js
 * Uses all-MiniLM-L6-v2 model which produces 384-dimensional embeddings
 */
export async function generateEmbedding(text: string): Promise<number[]> {
	try {
		const model = await getEmbedder();
		
		const output = await model(text, { pooling: 'mean', normalize: true });
		
		const embedding = Array.from(output.data) as number[];
		
		return embedding;
	} catch (error) {
		console.error('Failed to generate embedding:', error);
		throw error;
	}
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
	if (vecA.length !== vecB.length) {
		throw new Error('Vectors must have same length');
	}
	
	let dotProduct = 0;
	let magA = 0;
	let magB = 0;
	
	for (let i = 0; i < vecA.length; i++) {
		dotProduct += vecA[i]! * vecB[i]!;
		magA += vecA[i]! * vecA[i]!;
		magB += vecB[i]! * vecB[i]!;
	}
	
	magA = Math.sqrt(magA);
	magB = Math.sqrt(magB);
	
	if (magA === 0 || magB === 0) return 0;
	
	return dotProduct / (magA * magB);
}
