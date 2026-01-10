import { ChatGroq } from '@langchain/groq';
import { ChatOpenAI } from '@langchain/openai';
import { getEnv } from '../env';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

// Models to rotate through for OpenRouter
// These are free/cheap models with high availability and structured output support
const OPENROUTER_MODELS = [
    'xiaomi/mimo-v2-flash',
    'mistralai/devstral-2-2512',
    'openai/gpt-oss-120b',
    'nvidia/nemotron-nano-9b-v2'
];

let primaryModel: BaseChatModel | null = null;

export function getGroqChat(): BaseChatModel {
	if (primaryModel) return primaryModel;
	
	const env = getEnv();
	primaryModel = new ChatGroq({
		apiKey: env.GROQ_API_KEY,
		model: env.GROQ_CHAT_MODEL,
		temperature: 0,
		maxTokens: 1024, // Increased for structured output
		timeout: 30000, // 30 second timeout
	});
	
	return primaryModel;
}

// Helper to get a specific OpenRouter model
function getOpenRouterModel(modelName: string): BaseChatModel | null {
	const env = getEnv();
	
	if (!env.OPENROUTER_API_KEY) {
		console.warn('[LLM] OPENROUTER_API_KEY not set');
		return null;
	}
	
	return new ChatOpenAI({
		apiKey: env.OPENROUTER_API_KEY, // Use 'apiKey' not 'openAIApiKey'
		model: modelName,
		temperature: 0,
		maxTokens: 1024,
		configuration: {
			baseURL: 'https://openrouter.ai/api/v1',
		},
	});
}

export async function invokeWithFallback<T>(
	invoke: (model: BaseChatModel) => Promise<T>
): Promise<T> {
	const primary = getGroqChat();
	
	try {
        // 1. Try Primary (Groq)
		return await invoke(primary);
	} catch (error) {
		console.warn('[LLM] Primary (Groq) failed, initiating fallback sequence:', error);
		
		const env = getEnv();
		if (!env.OPENROUTER_API_KEY) {
			console.error('[LLM] No OpenRouter key found, cannot fallback');
			throw error;
		}

        // 2. Try OpenRouter Models (Rotation)
        // We persist the error from the last attempt if all fail
        let lastError = error;

        for (const modelName of OPENROUTER_MODELS) {
            try {
                const fallback = getOpenRouterModel(modelName);
                if (!fallback) continue;

                console.log(`[LLM] Trying OpenRouter fallback: ${modelName}`);
                return await invoke(fallback);
            } catch (fallbackError) {
                console.warn(`[LLM] OpenRouter model ${modelName} failed:`, fallbackError);
                lastError = fallbackError;
                // Move to next model
            }
        }

        // 3. All failed
        console.error('[LLM] All providers and fallbacks failed');
		throw lastError;
	}
}

