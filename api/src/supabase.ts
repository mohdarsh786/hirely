import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getEnv } from './env';

const env = getEnv();

export const supabaseAdmin: SupabaseClient = createClient(
	env.SUPABASE_URL,
	env.SUPABASE_SERVICE_ROLE_KEY,
	{
		auth: { 
			persistSession: false, 
			autoRefreshToken: false 
		},
	}
);

export function supabaseForAuth(userToken: string): SupabaseClient {
	return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
		auth: { 
			persistSession: false, 
			autoRefreshToken: false 
		},
		global: {
			headers: {
				Authorization: `Bearer ${userToken}`,
			},
		},
	});
}
