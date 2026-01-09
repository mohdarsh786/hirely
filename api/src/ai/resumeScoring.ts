import { z } from 'zod';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { getGroqChat } from './groq';
import { parseJsonObject } from '../utils/json';

const schema = z.object({
	score: z.number().min(0).max(100),
	matched_skills: z.array(z.string()).default([]),
	missing_skills: z.array(z.string()).default([]),
	reason: z.string().default(''),
});

export type ResumeScore = z.infer<typeof schema>;

export async function scoreResume(input: {
	jobRole: string;
	requiredSkills: string[];
	resumeText: string;
}): Promise<ResumeScore> {
	console.log('🔍 Scoring resume with:', {
		jobRole: input.jobRole,
		requiredSkills: input.requiredSkills,
		resumeTextLength: input.resumeText.length
	});
	
	const model = getGroqChat();
	
	const system = new SystemMessage(
		'You are a technical recruiter. Evaluate resumes based ONLY on skill matching using this formula:\n' +
		'- Score = (matched_skills / total_required_skills) * 100\n' +
		'- 100% match = 95-100 score\n' +
		'- 80-99% match = 80-94 score\n' +
		'- 60-79% match = 60-79 score\n' +
		'- Below 60% match = proportional score\n' +
		'Ignore overall profile, experience level, or unrelated skills. ONLY evaluate skill presence.'
	);
	
	const user = new HumanMessage(
		`Job: ${input.jobRole}\n` +
		`Required Skills: ${input.requiredSkills.join(', ')}\n` +
		`Total Required Skills: ${input.requiredSkills.length}\n` +
		`Resume:\n${input.resumeText}\n\n` +
		'INSTRUCTIONS:\n' +
		'1. Check which required skills are mentioned in the resume (matched_skills)\n' +
		'2. List required skills NOT found in the resume (missing_skills)\n' +
		'3. Calculate: score = (matched_skills_count / total_required_skills) * 100\n' +
		'4. If all skills matched, score should be 95-100\n' +
		'5. Provide brief reasoning based on skill match percentage only\n\n' +
		'Return JSON: { "score": number, "matched_skills": string[], "missing_skills": string[], "reason": string }'
	);

	const result = await model.invoke([system, user]);
	const content = typeof result.content === 'string' ? result.content : JSON.stringify(result.content);
	console.log('🤖 LLM Response:', content);
	
	const parsed = parseJsonObject(content);
	const validated = schema.parse(parsed);
	console.log('✅ Final Score:', validated);
	
	return validated;
}
