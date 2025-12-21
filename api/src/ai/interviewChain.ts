import { z } from 'zod';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { getGroqChat } from './groq';
import { parseJsonObject } from '../utils/json';

const evalSchema = z.object({
	score: z.number().min(0).max(10),
	feedback: z.string().default(''),
});

export type InterviewEvaluation = z.infer<typeof evalSchema>;

export async function generateNextQuestion(input: {
	role: string;
	previousAnswers: string[];
}): Promise<string> {
	const model = getGroqChat();
	
	const system = new SystemMessage(
		'You are a technical interviewer. Ask relevant, thoughtful questions.'
	);
	
	const prevAnswers = input.previousAnswers.length > 0
		? input.previousAnswers.map((ans, i) => `${i + 1}. ${ans}`).join('\n')
		: '(none - first question)';
	
	const user = new HumanMessage(
		`Role: ${input.role}\n` +
		`Previous answers:\n${prevAnswers}\n\n` +
		'Ask ONE relevant interview question. Gradually increase difficulty. Avoid repeating topics. Focus on practical skills.'
	);

	const result = await model.invoke([system, user]);
	return (typeof result.content === 'string' ? result.content : String(result.content)).trim();
}

export async function evaluateAnswer(input: {
	question: string;
	answer: string;
}): Promise<InterviewEvaluation> {
	const model = getGroqChat();
	
	const system = new SystemMessage(
		'You are an interviewer evaluating responses. Be fair but critical. ALWAYS respond with valid JSON only.'
	);
	
	const user = new HumanMessage(
		`Question: ${input.question}\n` +
		`Answer: ${input.answer}\n\n` +
		'Score 0-10. Provide brief feedback. Consider accuracy, completeness, clarity.\n' +
		'Return ONLY valid JSON (no markdown, no extra text): { "score": <number>, "feedback": "<string>" }'
	);

	try {
		const result = await model.invoke([system, user]);
		const content = typeof result.content === 'string' ? result.content : JSON.stringify(result.content);
		
		// Remove markdown code blocks if present
		const cleanContent = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
		
		const parsed = parseJsonObject(cleanContent);
		return evalSchema.parse(parsed);
	} catch (error) {
		console.error('[AI] Failed to evaluate answer:', error);
		// Fallback evaluation if AI fails
		const wordCount = input.answer.trim().split(/\s+/).length;
		const hasContent = wordCount > 5;
		return {
			score: hasContent ? 5 : 2,
			feedback: hasContent 
				? 'Unable to fully evaluate - answer received' 
				: 'Answer too short or unclear'
		};
	}
}
