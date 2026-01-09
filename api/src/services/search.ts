import { db } from '../db/client';
import { resumes, candidates, jobs } from '../db/schema';
import { generateEmbedding } from '../ai/embeddings';
import { cosineDistance, desc, eq, sql, and } from 'drizzle-orm';

export async function searchCandidates(query: string, organizationId: string, limit = 10) {
  try {
    const embedding = await generateEmbedding(query);
    const similarity = sql<number>`1 - (${resumes.embedding} <=> ${JSON.stringify(embedding)})`;

    const results = await db.select({
      id: candidates.id,
      name: candidates.name,
      email: candidates.email,
      role: candidates.appliedRole,
      jobTitle: jobs.title,
      similarity: similarity,
      skills: resumes.parsedSkills
    })
    .from(resumes)
    .innerJoin(candidates, eq(resumes.candidateId, candidates.id))
    .leftJoin(jobs, eq(candidates.jobId, jobs.id))
    .where(and(
      eq(candidates.organizationId, organizationId),
      sql`1 - (${resumes.embedding} <=> ${JSON.stringify(embedding)}) > 0.3`
    ))
    .orderBy(desc(similarity))
    .limit(limit);

    // Normalize to match BatchCandidate structure
    return results.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      jobTitle: r.jobTitle,
      similarity: r.similarity,
      // Map JSONB snake_case to camelCase
      matchedSkills: r.skills?.matched_skills || [],
      missingSkills: r.skills?.missing_skills || [],
      reason: r.skills?.reason || '',
      score: null, // Search results rely on similarity, not AI score
      status: 'completed' as const
    }));
  } catch (error) {
    console.error('Semantic search failed:', error);
    return [];
  }
}
