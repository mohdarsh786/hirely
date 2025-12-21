import type { Context, Next } from 'hono';
import type { AppVariables, Role } from './auth';
import { forbidden } from '../utils/errors';

export function requireRole(allowedRoles: Role[]) {
	return async (c: Context<{ Variables: AppVariables }>, next: Next) => {
		const user = c.get('user');
		
		if (!user?.role) {
			console.warn(`[RBAC] User ${user?.id || 'unknown'} has no role assigned`);
			return forbidden(c, 'User role not assigned');
		}
		
		if (!allowedRoles.includes(user.role)) {
			console.warn(`[RBAC] User ${user.id} with role ${user.role} denied access`);
			return forbidden(c, 'Insufficient permissions');
		}
		
		await next();
	};
}
