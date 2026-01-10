import { z } from 'zod';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { invokeWithFallback, getGroqChat } from './llm';

export const ResumeScoreSchema = z.object({
	score: z.number().min(0).max(100).describe('Match score from 0-100'),
	matched_skills: z.array(z.string()).describe('Skills found in resume'),
	missing_skills: z.array(z.string()).describe('Required skills not found'),
	reason: z.string().describe('Brief explanation of the score'),
});

export type ResumeScore = z.infer<typeof ResumeScoreSchema>;

const SYSTEM_PROMPT = 
	'You are a technical recruiter. Evaluate resumes for skill matching.\n\n' +
	'MATCHING RULES:\n' +
	'- Accept related technologies (Next.js implies React)\n' +
	'- Accept variations (Node = Node.js, AWS = Amazon Web Services)\n' +
	'- Accept abbreviations (JS = JavaScript, TS = TypeScript)\n' +
	'- Look for skills in projects, experience, and skills sections\n' +
	'- Skills demonstrated in projects count as matched\n\n' +
	'SCORING: score = (matched / total) * 100';

function buildUserPrompt(jobRole: string, skills: string[], resumeText: string): string {
	return `Job: ${jobRole}
Required Skills: ${skills.join(', ')}
Total: ${skills.length}

Resume:
${resumeText}

For each skill, check if it or equivalent appears in resume. Return JSON only.`;
}

export async function scoreResume(input: {
	jobRole: string;
	requiredSkills: string[];
	resumeText: string;
}): Promise<ResumeScore> {
	console.log('[SCORE] Processing:', input.jobRole, input.requiredSkills.length, 'skills');
	
	const systemMsg = new SystemMessage(SYSTEM_PROMPT);
	const userMsg = new HumanMessage(buildUserPrompt(
		input.jobRole, 
		input.requiredSkills, 
		input.resumeText
	));

	return invokeWithFallback(async (model) => {
		try {
			const structured = model.withStructuredOutput(ResumeScoreSchema, { name: 'score' });
			const result = await structured.invoke([systemMsg, userMsg]);
			console.log('[SCORE] Result:', result.score);
			return result;
		} catch (err) {
			console.warn('[SCORE] Structured failed, trying raw parse');
			const raw = await model.invoke([systemMsg, userMsg]);
			const content = typeof raw.content === 'string' ? raw.content : JSON.stringify(raw.content);
			const match = content.match(/\{[\s\S]*\}/);
			if (!match) throw new Error('No JSON in response');
			return ResumeScoreSchema.parse(JSON.parse(match[0]));
		}
	});
}
