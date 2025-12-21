import type { Context } from 'hono';
import { ZodError } from 'zod';

export type ErrorResponse = {
	error: string;
	details?: unknown;
};

export function badRequest(c: Context, message: string, details?: unknown) {
	const response: ErrorResponse = { error: message };
	if (details) response.details = details;
	return c.json(response, 400);
}

export function unauthorized(c: Context, message = 'Unauthorized') {
	return c.json({ error: message } as ErrorResponse, 401);
}

export function forbidden(c: Context, message = 'Forbidden') {
	return c.json({ error: message } as ErrorResponse, 403);
}

export function notFound(c: Context, resource: string) {
	return c.json({ error: `${resource} not found` } as ErrorResponse, 404);
}

export function internalError(c: Context, error: unknown, safeMessage = 'Internal server error') {
	console.error('[ERROR]', error);
	return c.json({ error: safeMessage } as ErrorResponse, 500);
}

export function handleValidationError(c: Context, error: ZodError) {
	const details = error.issues.map((issue) => ({
		field: issue.path.join('.'),
		message: issue.message,
	}));
	return badRequest(c, 'Validation failed', details);
}
