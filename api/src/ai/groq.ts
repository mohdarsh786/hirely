import { ChatGroq } from '@langchain/groq';
import { getEnv } from '../env';

export function getGroqChat() {
	const env = getEnv();
	return new ChatGroq({
		apiKey: env.GROQ_API_KEY,
		model: env.GROQ_CHAT_MODEL,
		temperature: 0,
	});
}
