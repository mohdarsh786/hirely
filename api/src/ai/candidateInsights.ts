import { z } from 'zod';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { invokeWithFallback } from './llm';

export const CandidateInsightsSchema = z.object({
	summary: z.string().describe('2-3 sentence candidate overview'),
	strengths: z.array(z.string()).describe('Top 3-5 key strengths'),
	concerns: z.array(z.string()).describe('Potential gaps or concerns'),
	interviewSuggestions: z.array(z.string()).describe('3-5 recommended interview topics'),
	cultureFit: z.string().describe('Brief culture fit assessment'),
	recommendation: z.enum(['strongly_recommend', 'recommend', 'consider', 'not_recommended'])
		.describe('Overall hiring recommendation'),
});

export type CandidateInsights = z.infer<typeof CandidateInsightsSchema>;

const SYSTEM_PROMPT = 
	'You are a senior technical recruiter analyzing a candidate for a job role.\n\n' +
	'Provide a comprehensive but concise analysis covering:\n' +
	'1. Summary: Brief overview of the candidate\n' +
	'2. Strengths: What makes them a good fit\n' +
	'3. Concerns: Gaps or areas needing clarification\n' +
	'4. Interview Suggestions: Specific topics to explore\n' +
	'5. Culture Fit: How they might fit the team\n' +
	'6. Recommendation: Your overall hiring recommendation\n\n' +
	'Be specific and actionable. Reference actual experience from the resume.';

function buildUserPrompt(input: {
	resumeText: string;
	jobTitle: string;
	requiredSkills: string[];
	candidateName: string;
	score?: number | null;
	matchedSkills?: string[];
	missingSkills?: string[];
}): string {
	const parts = [
		`Job Role: ${input.jobTitle}`,
		`Required Skills: ${input.requiredSkills.join(', ')}`,
		`Candidate: ${input.candidateName}`,
	];

	if (input.score !== undefined && input.score !== null) {
		parts.push(`Current Match Score: ${input.score}/100`);
	}
	if (input.matchedSkills?.length) {
		parts.push(`Matched Skills: ${input.matchedSkills.join(', ')}`);
	}
	if (input.missingSkills?.length) {
		parts.push(`Missing Skills: ${input.missingSkills.join(', ')}`);
	}

	parts.push('', 'Resume:', input.resumeText, '', 'Provide your analysis as JSON.');

	return parts.join('\n');
}

export async function generateCandidateInsights(input: {
	resumeText: string;
	jobTitle: string;
	requiredSkills: string[];
	candidateName: string;
	score?: number | null;
	matchedSkills?: string[];
	missingSkills?: string[];
}): Promise<CandidateInsights> {
	console.log('[INSIGHTS] Generating for:', input.candidateName, 'role:', input.jobTitle);

	const systemMsg = new SystemMessage(SYSTEM_PROMPT);
	const userMsg = new HumanMessage(buildUserPrompt(input));

	return invokeWithFallback(async (model) => {
		try {
			const structured = model.withStructuredOutput(CandidateInsightsSchema, { name: 'insights' });
			const result = await structured.invoke([systemMsg, userMsg]);
			console.log('[INSIGHTS] Generated:', result.recommendation);
			return result;
		} catch (err) {
			console.warn('[INSIGHTS] Structured failed, trying raw parse');
			const raw = await model.invoke([systemMsg, userMsg]);
			const content = typeof raw.content === 'string' ? raw.content : JSON.stringify(raw.content);
			const match = content.match(/\{[\s\S]*\}/);
			if (!match) throw new Error('No JSON in response');
			return CandidateInsightsSchema.parse(JSON.parse(match[0]));
		}
	});
}
