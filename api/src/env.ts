import { z } from 'zod';

const envSchema = z.object({
	PORT: z.coerce.number().int().positive().default(3001),
	CORS_ORIGIN: z.string().default('http://localhost:3000'),

	SUPABASE_URL: z.string().url(),
	SUPABASE_ANON_KEY: z.string().min(1),
	SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
	SUPABASE_RESUME_BUCKET: z.string().min(1).default('resumes'),
	SUPABASE_HR_DOCS_BUCKET: z.string().min(1).default('hr-docs'),

	DATABASE_URL: z.string().min(1),

	GROQ_API_KEY: z.string().min(1),
	GROQ_CHAT_MODEL: z.string().min(1),

	BREVO_API_KEY: z.string().min(1).optional(),
	BREVO_SMTP_API_KEY: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
	if (cachedEnv) return cachedEnv;
	const parsed = envSchema.safeParse(process.env);
	if (!parsed.success) {
		const message = parsed.error.issues
			.map((i) => `${i.path.join('.')}: ${i.message}`)
			.join('\n');
		throw new Error(`Invalid environment variables:\n${message}`);
	}
	cachedEnv = parsed.data;
	return cachedEnv;
}
