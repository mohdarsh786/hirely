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
	const model = getGroqChat();
	
	const system = new SystemMessage(
		'You are a technical recruiter. Evaluate resumes objectively.'
	);
	
	const user = new HumanMessage(
		`Job: ${input.jobRole}\n` +
		`Required Skills: ${input.requiredSkills.join(', ')}\n` +
		`Resume:\n${input.resumeText}\n\n` +
		'Score 0-100 based on skill match. List matched and missing skills. Explain reasoning.\n' +
		'Return JSON: { "score": number, "matched_skills": string[], "missing_skills": string[], "reason": string }'
	);

	const result = await model.invoke([system, user]);
	const content = typeof result.content === 'string' ? result.content : JSON.stringify(result.content);
	const parsed = parseJsonObject(content);
	return schema.parse(parsed);
}
