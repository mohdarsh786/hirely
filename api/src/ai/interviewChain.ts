import { z } from 'zod';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { getGroqChat } from './groq';
import { parseJsonObject } from '../utils/json';

const evalSchema = z.object({
	score: z.number().min(0).max(10),
	feedback: z.string().default(''),
});

export type InterviewEvaluation = z.infer<typeof evalSchema>;

export async function generateInterviewQuestions(input: {
	jobRole: string;
	requiredSkills: string[];
	resumeText: string;
	numberOfQuestions: number;
}): Promise<any[]> {
	const model = getGroqChat();
	
	const system = new SystemMessage(
		'You are an expert technical interviewer creating challenging, practical interview questions. '
		+ 'Generate questions that test real-world problem-solving, code analysis, and deep technical knowledge. '
		+ 'Include code snippets where appropriate and ask candidates to identify bugs, predict output, or improve code. '
		+ 'Return a JSON array of questions.'
	);
	
	const skillsList = input.requiredSkills.length > 0 
		? input.requiredSkills.join(', ')
		: 'general technical skills';
	
	const user = new HumanMessage(
		`Generate ${input.numberOfQuestions} TECHNICAL interview questions for a ${input.jobRole} position.\n` +
		`Required skills: ${skillsList}\n` +
		`Candidate background: ${input.resumeText.substring(0, 500)}...\n\n` +
		`REQUIREMENTS:\n` +
		`- At least 60% of questions should include code snippets\n` +
		`- Ask candidates to find bugs, predict output, or optimize code\n` +
		`- Include system design and architecture questions\n` +
		`- Focus on practical, real-world scenarios\n` +
		`- Progressive difficulty: easy → medium → hard → expert\n` +
		`- Questions should test deep understanding, not just definitions\n\n` +
		`Return ONLY a JSON array with this format:\n` +
		`[{"id": "q1", "question": "What is the output of this code?\\nconst x = [1,2,3]; x.push(4); console.log(x);", "expectedAnswer": "[1,2,3,4]", "difficulty": "easy"}]\n` +
		`Mix coding problems, debugging challenges, and system design questions. Make it CHALLENGING.`
	);

	try {
		const result = await model.invoke([system, user]);
		const content = typeof result.content === 'string' ? result.content : String(result.content);
		const parsed = parseJsonObject(content);
		
		if (Array.isArray(parsed)) {
			return parsed.map((q, i) => ({
				id: q.id || `q${i + 1}`,
				question: q.question,
				expectedAnswer: q.expectedAnswer || '',
				difficulty: q.difficulty || 'medium',
			}));
		}
		
		return [];
	} catch (error) {
		console.error('Failed to generate questions:', error);
		// Fallback questions
		return [
			{ id: 'q1', question: `Tell me about your experience with ${input.jobRole}.`, expectedAnswer: '', difficulty: 'easy' },
			{ id: 'q2', question: `What is your experience with ${input.requiredSkills[0] || 'the main technologies'}?`, expectedAnswer: '', difficulty: 'medium' },
			{ id: 'q3', question: 'Describe a challenging project you worked on and how you overcame obstacles.', expectedAnswer: '', difficulty: 'medium' },
			{ id: 'q4', question: `How would you approach solving a complex ${input.jobRole} problem?`, expectedAnswer: '', difficulty: 'hard' },
			{ id: 'q5', question: 'Where do you see yourself growing in this role?', expectedAnswer: '', difficulty: 'easy' },
		];
	}
}

export async function generateNextQuestion(input: {
	role: string;
	previousAnswers: string[];
	context?: string;
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
