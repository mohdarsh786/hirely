import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { getGroqChat } from './groq';

export type RetrievedDocument = { 
	id: string; 
	title: string; 
	content: string;
};

export async function answerFromDocs(input: {
	question: string;
	docs: RetrievedDocument[];
}): Promise<string> {
	const model = getGroqChat();
	
	const system = new SystemMessage(
		'You are an HR assistant. Answer questions based only on provided documents. ' +
		'If the answer is not in the documents, clearly state that.'
	);

	const context = input.docs.length > 0
		? input.docs.map((doc) => `=== ${doc.title} ===\n${doc.content}`).join('\n\n')
		: '(no documents)';

	const user = new HumanMessage(
		`Documents:\n${context}\n\n` +
		`Question: ${input.question}\n\n` +
		'Answer based only on the documents. If not available, say so. Cite document titles. Be concise.'
	);

	const result = await model.invoke([system, user]);
	return (typeof result.content === 'string' ? result.content : String(result.content)).trim();
}
