import { z } from 'zod';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { invokeWithFallback } from './llm';

export const ResumeInfoSchema = z.object({
	name: z.string().describe('Full name of candidate'),
	email: z.string().nullable().describe('Email or null'),
	phone: z.string().nullable().describe('Phone or null'),
});

export type ResumeInfo = z.infer<typeof ResumeInfoSchema>;

const SYSTEM_PROMPT = 
	'Extract candidate contact info from resume. ' +
	'Name is usually at top. Email has @. Phone has digits.';

function extractWithRegex(text: string): { email: string | null; phone: string | null } {
	const email = text.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/)?.[0] || null;
	const phone = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)?.[0] || null;
	return { email, phone };
}

function extractNameFromLines(text: string): string {
	const lines = text.split('\n').filter(l => l.trim());
	for (const line of lines.slice(0, 5)) {
		const clean = line.trim();
		if (
			clean.length >= 3 && 
			clean.length <= 50 &&
			!clean.includes('@') &&
			!/^\d/.test(clean) &&
			!/resume|curriculum|http/i.test(clean) &&
			/^[A-Z]/.test(clean)
		) {
			return clean.replace(/[|•·\-–—]/g, ' ').replace(/\s+/g, ' ').trim();
		}
	}
	return 'Unknown Candidate';
}

export async function extractResumeInfo(resumeText: string): Promise<ResumeInfo> {
	const preview = resumeText.slice(0, 2000);
	const regex = extractWithRegex(resumeText);

	try {
		return await invokeWithFallback(async (model) => {
			try {
				const structured = model.withStructuredOutput(ResumeInfoSchema, { name: 'info' });
				const result = await structured.invoke([
					new SystemMessage(SYSTEM_PROMPT),
					new HumanMessage(`Extract from:\n\n${preview}`),
				]);
				return {
					name: result.name || extractNameFromLines(preview),
					email: result.email || regex.email,
					phone: result.phone || regex.phone,
				};
			} catch {
				const raw = await model.invoke([
					new SystemMessage(SYSTEM_PROMPT),
					new HumanMessage(`Extract from:\n\n${preview}\n\nReturn JSON: {name, email, phone}`),
				]);
				const content = typeof raw.content === 'string' ? raw.content : JSON.stringify(raw.content);
				const match = content.match(/\{[\s\S]*\}/);
				if (!match) throw new Error('No JSON');
				const parsed = ResumeInfoSchema.parse(JSON.parse(match[0]));
				return {
					name: parsed.name || extractNameFromLines(preview),
					email: parsed.email || regex.email,
					phone: parsed.phone || regex.phone,
				};
			}
		});
	} catch (err) {
		console.warn('[EXTRACT] All LLM failed, using regex:', err);
		return {
			name: extractNameFromLines(preview),
			email: regex.email,
			phone: regex.phone,
		};
	}
}
