import type { Context, Next } from 'hono';
import { supabaseForAuth } from '../supabase';
import { unauthorized } from '../utils/errors';
import { db } from '../db/client';
import { organizationMembers } from '../db/schema';
import { eq } from 'drizzle-orm';

export type Role = 'HR_ADMIN' | 'RECRUITER' | 'EMPLOYEE';

export type AuthedUser = {
	id: string;
	email: string | null;
	role: Role | null;
	organizationId?: string;
};

export type AppVariables = {
	user: AuthedUser;
};

export function getBearerToken(authHeader: string | undefined): string | null {
	if (!authHeader) return null;
	const parts = authHeader.split(' ');
	if (parts.length !== 2) return null;
	const [scheme, token] = parts;
	if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
	return token;
}

export function extractRole(user: any): Role | null {
	const candidates: unknown[] = [
		user?.app_metadata?.role,
		user?.user_metadata?.role,
		user?.app_metadata?.claims?.role,
		user?.user_metadata?.claims?.role,
		user?.role,
	];

	for (const raw of candidates) {
		if (typeof raw !== 'string') continue;
		const normalized = raw.trim().toUpperCase().replace(/[-\s]+/g, '_');
		if (normalized === 'HR_ADMIN' || normalized === 'RECRUITER' || normalized === 'EMPLOYEE') {
			return normalized as Role;
		}
	}

	return null;
}

export async function authMiddleware(c: Context<{ Variables: AppVariables }>, next: Next) {
	const token = getBearerToken(c.req.header('authorization'));
	
	if (!token) {
		return unauthorized(c, 'Missing or invalid Authorization header');
	}

	try {
		const supabase = supabaseForAuth(token);
		const { data, error } = await supabase.auth.getUser();
		
		if (error || !data.user) {
			console.warn('[AUTH] Token validation failed:', error?.message || 'Unknown error');
			return unauthorized(c, 'Invalid or expired token');
		}

		// Fetch organization membership
		const [membership] = await db
			.select()
			.from(organizationMembers)
			.where(eq(organizationMembers.userId, data.user.id))
			.limit(1);

		c.set('user', {
			id: data.user.id,
			email: data.user.email ?? null,
			role: extractRole(data.user),
			organizationId: membership?.organizationId,
		});

		await next();
	} catch (error) {
		console.error('[AUTH] Unexpected error:', error);
		return unauthorized(c, 'Authentication failed');
	}
}
